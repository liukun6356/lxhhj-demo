import type { Variogram } from "../kriging";
import { assert, calcDataTexSize, ColorMappingObject, colorToRGBA, getTextureUnpackAlign, isWorker, MAX_STOPS, SupportOffscreenCanvas, VariogramObject, type ColorMappingItem, type GL } from "../supports";


function initGlCtx() {
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    if (isWorker) {
        assert(SupportOffscreenCanvas, 'OffscreenCanvas unsupport');
        canvas = new OffscreenCanvas(1, 1);
    } else {
        canvas = SupportOffscreenCanvas
            ? new OffscreenCanvas(1, 1)
            : document.createElement('canvas')
    }
    const opts = {
        alpha: false,
        depth: false,
        stencil: false,
    }
    const gl = (canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts)) as GL;
    assert(!!gl, "webgl unsupport");

    const isWEBGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    const extensions = {} as Record<string, any>;

    const getExtension = (name: 'EXT_color_buffer_float' | 'OES_texture_float') => {
        return extensions[name] ??= (gl.getExtension(name) ?? false)
    };

    return {
        canvas,
        gl,
        isWEBGL2,
        getExtension,
    } as ({
        canvas: HTMLCanvasElement | OffscreenCanvas;
        getExtension: typeof getExtension
    } & ({ gl: WebGL2RenderingContext, isWEBGL2: true } | { gl: WebGLRenderingContext, isWEBGL2: false }))
}
let glCtx: ReturnType<typeof initGlCtx>;
export function getGLCtx() {
    return glCtx ??= initGlCtx()
}

function createShader(gl: GL, type: number, source: string) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;
    const errinfo = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(errinfo);
}

export function createProgram(
    gl: GL,
    [vertexShaderSource, fragmentShaderSource]: string[]
) {
    const program = gl.createProgram();
    const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    gl.deleteShader(vShader);
    gl.deleteShader(fShader);
    if (success) return program;
    const errInfo = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(errInfo);
}

export function createColorMappingObject(stops: ColorMappingItem[]) {
    const { gl, getExtension, isWEBGL2 } = getGLCtx();
    assert(stops?.length && stops.length <= 256, 'stops length must in [1, 256]')
    for (let i = 0; i < stops.length; i++) {
        const { min, max, color } = stops[i];
        assert(min < max, 'stop not satisify: min < max');
        assert(!!color, 'stop color not exist');
        if (i === 0) continue;
        const before = stops[i - 1];
        assert(before.max === min, "stop not satisify item[i].max == item[i+1].min");
    }
    const data = new Float32Array(MAX_STOPS * 4);
    for (let i = 0; i < stops.length; i++) {
        const { min, max, color } = stops[i];
        const [r, g, b, a] = colorToRGBA(color);
        const cursor = i * 4;
        data[cursor] = min;
        data[cursor + 1] = max;
        //in fragment if highp not support(example in mobile), use mediump:  2^14 = 16384, precesion = 2^-10
        data[cursor + 2] = r + g / 1000;
        data[cursor + 3] = b + a / 1000;
    }

    if (!isWEBGL2) {
        assert(getExtension('OES_texture_float'), 'webgl float texture unsupport');
    }
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 8);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        isWEBGL2 ? gl.RGBA32F : gl.RGBA,
        MAX_STOPS,
        1,
        0,
        gl.RGBA,
        gl.FLOAT,
        data
    );
    gl.bindTexture(gl.TEXTURE_2D, null);

    const obj = new ColorMappingObject();
    obj._texture = texture;
    obj._textureSize = [MAX_STOPS, 1];
    obj._stopCount = stops.length;
    obj.dispose = () => gl.deleteTexture(texture);
    return obj;
}

export function createVariogramObject(variogram: Variogram) {
    const { gl, getExtension: supportExtension, isWEBGL2 } = getGLCtx();
    assert(variogram.n <= 1024, 'Supports up to 1024 points');
    const [width, height] = calcDataTexSize(variogram.n);
    const { M, x, y } = variogram;
    const array = new Float32Array(width * height * 4);
    for (let i = 0; i < variogram.n; i++) {
        const cursor = i * 4;
        array[cursor] = M[i];
        array[cursor + 1] = x[i];
        array[cursor + 2] = y[i];
    }
    if (!isWEBGL2) {
        assert(supportExtension('OES_texture_float'), 'webgl float texture unsupport');
    }
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, getTextureUnpackAlign(width));
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        isWEBGL2 ? gl.RGBA32F : gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.FLOAT,
        array
    );
    gl.bindTexture(gl.TEXTURE_2D, null);

    const obj = new VariogramObject();
    obj._model = variogram.model;
    obj._n = variogram.n;
    obj._params = [variogram.nugget, variogram.range, variogram.sill, variogram.A];
    obj._texture = texture;
    obj._textureSize = [width, height];
    obj.dispose = () => gl.deleteTexture(texture);
    return obj;
}