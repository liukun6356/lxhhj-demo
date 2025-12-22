import { LRUCache } from "lru-cache";
import type { Variogram } from "../kriging";
import { assert, ColorMappingObject, ModelCode, OutputType, SupportOffscreenCanvas, VariogramObject, withResolvers, type ColorMappingItem } from "../supports";
import { glsl_fs_main } from "./glsl";
import { createColorMappingObject, createProgram, createVariogramObject, getGLCtx } from "./utils";

type P = {
    variogram: Variogram | VariogramObject;
    llCorner: number[];
    gridSize: number[];
    cellSize: number;
}
let ctx: ReturnType<typeof initGenerateCtx>;
export function getGenerateCtx() {
    return ctx ??= initGenerateCtx();
}

function initGenerateCtx() {
    const { gl, isWEBGL2, getExtension } = getGLCtx();

    const prefixVs = isWEBGL2
        ? `#version 300 es
           #define attribute in
           #define varying out
           #define webgl2
        ` : '';
    const prefixFs = isWEBGL2
        ? `#version 300 es
           #define varying in
           #define webgl2
           #define texture2D texture
           #define gl_FragColor out_color
        
           precision highp float;
           precision highp sampler2D;
           
           out vec4 out_color;
        `
        : `
            #ifdef GL_FRAGMENT_PRECISION_HIGH
                precision highp float;
                precision highp sampler2D;
            #else
                precision mediump float;
                precision mediump sampler2D;
            #endif
        `;
    const vs = prefixVs + `
        attribute vec2 position;
        void main(){  
            gl_Position = vec4(position * 2.0 - 1.0, 0, 1); 
        }
    `;
    const fs = prefixFs + glsl_fs_main;


    //only one program used, bind once is ok
    const program = createProgram(gl, [vs, fs]);
    gl.useProgram(program);

    const location = gl.getAttribLocation(program, "position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    type R = {
        fbo: WebGLFramebuffer;
        attachment: WebGLTexture,
    }
    const rtCache = new LRUCache<string, R>({
        max: 10,
        dispose: ({ fbo, attachment }) => {
            gl.deleteFramebuffer(fbo);
            gl.deleteTexture(attachment)
        }
    });

    return {
        setUniforms: initUniformAndTextureSetter(program),
        createBufferRT,
    }
    function createBufferRT(width: number, height: number): R {
        const key = `${width}-${height}`;
        if (rtCache.has(key)) return rtCache.get(key);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (!isWEBGL2) {
            assert(getExtension('OES_texture_float'), 'webgl float texture unsupport');
        } else {
            assert(getExtension('EXT_color_buffer_float'), 'webgl2 EXT_color_buffer_float unsupport');
        }

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            isWEBGL2 ? gl.R32F : gl.RGBA,
            width,
            height,
            0,
            isWEBGL2 ? gl.RED : gl.RGBA,
            gl.FLOAT,
            null
        );

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        // const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        // if (status !== gl.FRAMEBUFFER_COMPLETE) {
        //     console.error('Framebuffer is not complete:', status);
        //     debugger
        // }
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const obj = {
            fbo,
            attachment: texture,
        }
        rtCache.set(key, obj);
        return obj;
    }
}

function initUniformAndTextureSetter(program: WebGLProgram) {
    const { gl, isWEBGL2 } = getGLCtx();
    const location_mxyTexture = gl.getUniformLocation(program, 'u_variogramMxyTexture');
    const location_colormappingTexture = gl.getUniformLocation(program, 'u_colormappingTexture');
    gl.uniform1i(location_mxyTexture, 0);
    gl.uniform1i(location_colormappingTexture, 1);

    if (isWEBGL2) {
        const uboBuffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, uboBuffer);
        gl.bufferData(gl.UNIFORM_BUFFER, 4 * 4 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);

        const blockIndex = gl.getUniformBlockIndex(program, 'DefaultUBO');
        gl.uniformBlockBinding(program, blockIndex, 0); //将program的DefaultUBO绑定到全局的0位置
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboBuffer); //设置全局的0位置uniform数据为uboBuffer

        return ({ outputFormat, variogram, packValueRange, llCorner, cellSize, colorMapping }: {
            outputFormat: keyof typeof OutputType,
            variogram: VariogramObject,
            llCorner: number[],
            cellSize: number,
            packValueRange?: number[],
            colorMapping?: ColorMappingObject
        }) => {
            gl.bindBuffer(gl.UNIFORM_BUFFER, uboBuffer);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Float32Array([
                //ROW
                llCorner[0],
                llCorner[1],
                cellSize,
                variogram._n,
                //ROW
                variogram._textureSize[0],
                variogram._textureSize[1],
                outputFormat === 'packed-imagebitmap' ? packValueRange[0] : NaN,
                outputFormat === 'packed-imagebitmap' ? packValueRange[1] : NaN,
                //ROW
                variogram._params[0],
                variogram._params[1],
                variogram._params[2],
                variogram._params[3],
                //ROW
                ModelCode[variogram._model],
                outputFormat === 'imagebitmap' ? colorMapping._stopCount : NaN,
                OutputType[outputFormat],
                NaN,
            ]))
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, variogram._texture);
            if (outputFormat === 'imagebitmap') {
                gl.activeTexture(gl.TEXTURE0 + 1);
                gl.bindTexture(gl.TEXTURE_2D, colorMapping._texture);
            }
        }
    } else {
        const keys = [
            'outputFormat', 'gridInfo', 'dimension', 'variogramMxySize', 'packValueRange',
            'variogramParam', 'model', 'classbreakCount'
        ] as const;
        const uniformLocations = keys.reduce((map, key) => {
            map[key] = gl.getUniformLocation(program, 'u_' + key);
            return map;
        }, {} as Record<(typeof keys)[`${number}`], WebGLUniformLocation>)
        return ({ outputFormat, variogram, packValueRange, llCorner, cellSize, colorMapping }: {
            outputFormat: keyof typeof OutputType,
            variogram: VariogramObject,
            llCorner: number[],
            cellSize: number,
            packValueRange?: number[],
            colorMapping?: ColorMappingObject
        }) => {
            gl.uniform3fv(uniformLocations.gridInfo, [llCorner[0], llCorner[1], cellSize]);
            gl.uniform1f(uniformLocations.dimension, variogram._n);
            gl.uniform2fv(uniformLocations.variogramMxySize, variogram._textureSize);
            if (outputFormat === 'packed-imagebitmap') {
                gl.uniform2fv(uniformLocations.packValueRange, packValueRange);
            }
            gl.uniform4fv(uniformLocations.variogramParam, variogram._params);
            gl.uniform1f(uniformLocations.model, ModelCode[variogram._model]);
            if (outputFormat === 'imagebitmap') {
                gl.uniform1f(uniformLocations.classbreakCount, colorMapping._stopCount);
                gl.activeTexture(gl.TEXTURE0 + 1);
                gl.bindTexture(gl.TEXTURE_2D, colorMapping._texture);
            }
            gl.uniform1f(uniformLocations.outputFormat, OutputType[outputFormat]);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, variogram._texture);
        }
    }
}
type Cancelable<R> = Promise<R> & { cancel: () => void };

type PromiseReturnType<T> = T extends (...args: any[]) => Promise<infer R> ? R : any;
function wrapQueue<
    F extends (...args: any[]) => Promise<any>,
    R = PromiseReturnType<F>,
>(fn: F) {

    type Task = {
        resolve: (result: R) => void;
        reject: (e: any) => void;
        args: Parameters<F>
    };
    const queue = [] as Task[];
    let curTask: Task;
    return (...args: Parameters<F>) => {
        const { promise, resolve, reject } = withResolvers<R>();
        const task = { resolve, reject, args };
        queue.unshift(task);
        Promise.resolve().then(excute);
        (promise as Cancelable<R>).cancel = () => {
            reject();
            if (task !== curTask) {
                const index = queue.findIndex(i => i === task);
                queue.splice(index, 1);
            }
        };
        return promise as Cancelable<R>;
    }
    function excute() {
        if (curTask) return;
        if (!queue.length) return;
        curTask = queue.pop();
        fn.apply(null, curTask.args)
            .then(result => curTask.resolve(result))
            .catch(e => curTask.reject(e))
            .finally(() => {
                curTask = null;
                excute();
            });
    }
}

function generate(opts: P & { outputFormat: 'value-buffer' }): Cancelable<Float32Array>;
function generate(opts: P & { outputFormat: 'packed-imagebitmap', packValueRange: number[] }): Cancelable<ImageBitmap>;
function generate(opts: P & { outputFormat: 'imagebitmap', colorMapping: ColorMappingItem[] | ColorMappingObject }): Cancelable<ImageBitmap>;
function generate(opts: P & {
    packValueRange?: number[];
    colorMapping?: ColorMappingItem[] | ColorMappingObject;
    outputFormat: keyof typeof OutputType;
}) {
    const { gl, canvas, isWEBGL2 } = getGLCtx();
    const { createBufferRT, setUniforms } = getGenerateCtx();
    const { llCorner, gridSize, cellSize, packValueRange, outputFormat } = opts;
    assert(gridSize[0] > 0 && gridSize[1] > 0, 'gridsize can not be 0');
    const variogram = opts.variogram instanceof VariogramObject
        ? opts.variogram
        : createVariogramObject(opts.variogram);
    const colorMapping = outputFormat === 'imagebitmap'
        ? opts.colorMapping instanceof ColorMappingObject
            ? opts.colorMapping
            : createColorMappingObject(opts.colorMapping)
        : null;

    //clear
    canvas.width = gridSize[0];
    canvas.height = gridSize[1];
    let rt: ReturnType<typeof createBufferRT>;
    if (outputFormat === 'value-buffer') {
        rt = createBufferRT(canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, rt.fbo);
    } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    setUniforms({
        outputFormat,
        variogram,
        packValueRange,
        llCorner,
        cellSize,
        colorMapping
    });

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (outputFormat !== 'value-buffer') {
        doClear();
        if (SupportOffscreenCanvas) {
            return Promise.resolve((canvas as OffscreenCanvas).transferToImageBitmap())
        } else {
            return createImageBitmap(canvas, {
                imageOrientation: "none"
            });
        }
    } else {
        let result: Float32Array;
        if (isWEBGL2) {
            result = new Float32Array(canvas.width * canvas.height);
            gl.readPixels(0, 0, canvas.width, canvas.height, (gl as WebGL2RenderingContext).RED, gl.FLOAT, result);
        } else {
            result = new Float32Array(canvas.width * canvas.height);
            const arr = new Float32Array(canvas.width * canvas.height * 4);
            gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.FLOAT, arr);
            for (let i = 0; i < arr.length; i += 4) {
                result[i / 4] = arr[i]
            };
        }
        doClear();
        return Promise.resolve(result);
    }

    function doClear() {
        if (!(opts.variogram instanceof VariogramObject)) {
            variogram.dispose();
        }
        if (outputFormat === 'imagebitmap' && !(opts.colorMapping instanceof ColorMappingObject)) {
            colorMapping.dispose();
        }
    }
}

export const generate_WEBGL = wrapQueue(generate) as unknown as typeof generate;