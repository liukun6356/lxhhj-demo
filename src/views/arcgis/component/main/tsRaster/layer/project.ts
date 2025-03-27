import { glsl_pack } from "./pack";

import { getTextureUnpackAlign } from "./misc";

let rasterProjCtx: ReturnType<typeof initRasterProjectCtx>;
export function getRasterProjectContext() {
    if (!rasterProjCtx) {
        rasterProjCtx = initRasterProjectCtx();
    }
    return rasterProjCtx;
}

function initRasterProjectCtx() {
    if (!globalThis.OffscreenCanvas) throw new Error("浏览器不支持OffscreenCanvas!");
    const canvas = new OffscreenCanvas(1, 1);
    const opts = {
        premultipliedAlpha: false,
        alpha: true,
        depth: false,
        stencil: false,
    };
    const isWebGL2 = typeof WebGL2RenderingContext !== undefined;
    const gl = isWebGL2 ? canvas.getContext("webgl2", opts) : canvas.getContext("webgl", opts);
    if (!isWebGL2) {
        const ext1 = gl.getExtension("OES_texture_float");
        if (!ext1) throw new Error("栅格重投影: 你的浏览器不支持浮点纹理OES_texture_float");
    }

    //固定的全局设置
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    const createBuffer = (array: BufferSource) => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return buffer;
    };
    const createDataTex = (opts: {
        data: ArrayBufferView;
        internalFormat: GLint;
        width: number;
        height: number;
        format: GLint;
        type: GLint;
    }) => {
        const { data, internalFormat, width, height, format, type } = opts;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, getTextureUnpackAlign(width));
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    };
    const disposeItems = (items: (WebGLBuffer | WebGLTexture)[]) => {
        items.forEach((i) => {
            if (i instanceof WebGLTexture) {
                gl.deleteTexture(i);
            } else if (i instanceof WebGLBuffer) {
                gl.deleteBuffer(i);
            }
        });
    };

    let singleProgramInfo: ReturnType<typeof initSingleChannelProjectProgram>;
    const projectSingleChannel = (opts: {
        outputTexSize: number[]; //输出纹理的尺寸
        triangles: number;
        positionRTC: BufferSource | WebGLBuffer;
        uv: BufferSource | WebGLBuffer;
        inputDataTex: ArrayBufferView | WebGLTexture;
        inputDataTexSize: number[];
        valueRange: number[]; //min, max
        noDataValue?: number;
        sampling?: "nearest" | "linear";
    }) => {
        if (!singleProgramInfo) {
            singleProgramInfo = initSingleChannelProjectProgram(gl, isWebGL2);
        }
        const { program, attributes, textureLoc, uniformsLoc, textureParams } = singleProgramInfo;
        //clear
        canvas.width = opts.outputTexSize[0];
        canvas.height = opts.outputTexSize[1];
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0); //a is mask, 默认全部没有数据
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        //set attributes
        const buffers = attributes.map((attr) => {
            let glBuffer = opts[attr.name];
            if (!(glBuffer instanceof WebGLBuffer)) {
                glBuffer = createBuffer(glBuffer);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
            gl.enableVertexAttribArray(attr.loc);
            gl.vertexAttribPointer(attr.loc, attr.size, attr.type, attr.normalize, attr.stride, attr.offset);
            return { name: attr.name, glBuffer };
        });

        //set uniforms
        gl.uniform2fv(uniformsLoc.dataTexSize, opts.inputDataTexSize);
        gl.uniform1f(uniformsLoc.noDataValue, opts.noDataValue ?? NaN);
        gl.uniform2fv(uniformsLoc.valueRange, opts.valueRange);
        gl.uniform1i(uniformsLoc.isNearest, (opts.sampling ?? "nearest") === "nearest" ? 1 : 0);

        //set texture
        let dataTex = opts.inputDataTex;
        if (!(dataTex instanceof WebGLTexture)) {
            dataTex = createDataTex({
                data: dataTex,
                internalFormat: textureParams.internalFormat,
                width: opts.inputDataTexSize[0],
                height: opts.inputDataTexSize[1],
                format: textureParams.format,
                type: gl.FLOAT,
            });
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, dataTex);
        gl.uniform1i(textureLoc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, opts.triangles * 3);
        return {
            imagebitmap: canvas.transferToImageBitmap(),
            //原始gl数据, 可以复用, 不使用时调用disposeItems释放gpu资源
            positionRTC: buffers[0].glBuffer as WebGLBuffer,
            uv: buffers[1].glBuffer as WebGLBuffer,
            tex: dataTex as WebGLTexture,
        };
    };

    let vectorFieldProgramInfo: ReturnType<typeof initVectorFieldProjectProgram>;
    const projectVectorField = (opts: {
        outputTexSize: number[];
        triangles: number;
        positionRTC: BufferSource | WebGLBuffer;
        uv: BufferSource | WebGLBuffer;
        inputDataTex: ArrayBufferView | WebGLTexture;
        inputDataTexSize: number[];
        valueRange: number[]; //[umin, umax, vmin, vmax]
        sampling?: "nearest" | "linear";
    }) => {
        if (!vectorFieldProgramInfo) {
            vectorFieldProgramInfo = initVectorFieldProjectProgram(gl, isWebGL2);
        }
        const { program, attributes, textureLoc, uniformsLoc, textureParams } = vectorFieldProgramInfo;
        //clear
        canvas.width = opts.outputTexSize[0];
        canvas.height = opts.outputTexSize[1];
        gl.viewport(0, 0, canvas.width, canvas.height);

        //uv编码到rgba, 每2个通道存储一个值
        //0值比较特殊, 这里代表无数据, 参与颜色映射时=无颜色
        //方案1: 取编码前2位, 由于矢量有方向性, min可能为负值,
        //比如U ∈ [-1, 1], 0的归一化值为0.5,
        //packNormalizeFloatToRGBA(0.5) = [0.4980392156862745, 0.4980392156862745, 0.4980392156862745, 0.5]
        //unpackRGBAToNormalizeFloat([0.4980392156862745, 0.4980392156862745, 0, 0]) = 0.4999923106497501
        //0值的表示存在一定误差
        //方案2:
        //packNormalizeFloatToRGBA(1) = [1,0,0,0], 为最大值, 当r=1时, 不存在rgb > 0
        //使用rg=(1,1)代表特殊值0,
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        //set attributes
        const buffers = attributes.map((attr) => {
            let glBuffer = opts[attr.name];
            if (!(glBuffer instanceof WebGLBuffer)) {
                glBuffer = createBuffer(glBuffer);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
            gl.enableVertexAttribArray(attr.loc);
            gl.vertexAttribPointer(attr.loc, attr.size, attr.type, attr.normalize, attr.stride, attr.offset);
            return { name: attr.name, glBuffer };
        });

        //set uniforms
        gl.uniform2fv(uniformsLoc.dataTexSize, opts.inputDataTexSize);
        gl.uniform4fv(uniformsLoc.valueRange, opts.valueRange);
        gl.uniform1i(uniformsLoc.isNearest, (opts.sampling ?? "nearest") === "nearest" ? 1 : 0);

        //set texture
        let dataTex = opts.inputDataTex;
        if (!(dataTex instanceof WebGLTexture)) {
            dataTex = dataTex = createDataTex({
                data: dataTex,
                internalFormat: textureParams.internalFormat,
                width: opts.inputDataTexSize[0],
                height: opts.inputDataTexSize[1],
                format: textureParams.format,
                type: gl.FLOAT,
            });
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, dataTex);
        gl.uniform1i(textureLoc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, opts.triangles * 3);
        //const a = new Uint8ClampedArray(256 * 256 * 4);
        //gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, a);

        return {
            imagebitmap: canvas.transferToImageBitmap(),
            positionRTC: buffers[0].glBuffer as WebGLBuffer,
            uv: buffers[1].glBuffer as WebGLBuffer,
            tex: dataTex as WebGLTexture,
        };
    };
    return {
        canvas,
        gl,
        disposeItems,
        projectSingleChannel,
        projectVectorField,
        createBuffer,
    };
}

function initSingleChannelProjectProgram(gl: WebGLRenderingContext | WebGL2RenderingContext, isWebGL2?: boolean) {
    const defines = isWebGL2 ?? gl instanceof WebGL2RenderingContext ? `#define webgl2` : "";
    const program = createProgram(
        gl,
        SingleChannelReProjectShader.vertex,
        SingleChannelReProjectShader.fragment.replace("{defines}", defines)
    );
    const textureLoc = gl.getUniformLocation(program, "dataTex");
    const uniformsLoc = {
        dataTexSize: gl.getUniformLocation(program, "dataTexSize"),
        noDataValue: gl.getUniformLocation(program, "noDataValue"),
        valueRange: gl.getUniformLocation(program, "valueRange"),
        isNearest: gl.getUniformLocation(program, "isNearest"),
    };
    const attributes = [
        {
            name: "positionRTC" as const,
            loc: gl.getAttribLocation(program, "positionRTC"),
            size: 2,
            type: gl.FLOAT,
            normalize: false,
            stride: 0,
            offset: 0,
        },
        {
            name: "uv" as const,
            loc: gl.getAttribLocation(program, "uv"),
            size: 2,
            type: gl.FLOAT,
            normalize: false,
            stride: 0,
            offset: 0,
        },
    ];
    return {
        program,
        textureLoc,
        uniformsLoc,
        attributes,
        textureParams: {
            format: isWebGL2 ? (gl as WebGL2RenderingContext).RED : gl.ALPHA,
            internalFormat: isWebGL2 ? (gl as WebGL2RenderingContext).R32F : gl.ALPHA,
        },
    };
}

function initVectorFieldProjectProgram(gl: WebGLRenderingContext | WebGL2RenderingContext, isWebGL2?: boolean) {
    const defines = isWebGL2 ?? gl instanceof WebGL2RenderingContext ? `#define webgl2` : "";
    const program = createProgram(
        gl,
        vectorFieldTileReProjectShader.vertex,
        vectorFieldTileReProjectShader.fragment.replace("{defines}", defines)
    );
    const textureLoc = gl.getUniformLocation(program, "dataTex");
    const uniformsLoc = {
        dataTexSize: gl.getUniformLocation(program, "dataTexSize"),
        valueRange: gl.getUniformLocation(program, "valueRange"),
        isNearest: gl.getUniformLocation(program, "isNearest"),
    };
    const attributes = [
        {
            name: "positionRTC" as const,
            loc: gl.getAttribLocation(program, "positionRTC"),
            size: 2,
            type: gl.FLOAT,
            normalize: false,
            stride: 0,
            offset: 0,
        },
        {
            name: "uv" as const,
            loc: gl.getAttribLocation(program, "uv"),
            size: 2,
            type: gl.FLOAT,
            normalize: false,
            stride: 0,
            offset: 0,
        },
    ];
    return {
        program,
        textureLoc,
        uniformsLoc,
        attributes,
        textureParams: {
            format: isWebGL2 ? (gl as WebGL2RenderingContext).RG : gl.LUMINANCE_ALPHA,
            internalFormat: isWebGL2 ? (gl as WebGL2RenderingContext).RG32F : gl.LUMINANCE_ALPHA,
        },
    };
}

function createProgram(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string
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
    const errinfo = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(errinfo);
}

function createShader(gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;
    const errinfo = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(errinfo);
}

//  单一值投影,
//  原值为 v, 范围为[r1, r2]
//  归一值 = nv;
//  输出rgb = packNormalizeFloatToRGB(nv);
//  输出a = 0/1, mask位,对应是否有数据
const SingleChannelReProjectShader = {
    vertex: `
        precision highp float;
        attribute vec2 positionRTC;
        attribute vec2 uv;
        varying vec2 vUv;
        void main(){
            gl_Position = vec4(positionRTC, 0.0, 1.0);
            vUv = uv;
        } 
    `,
    fragment: `
        precision highp float;
        {defines}
        uniform sampler2D dataTex; //数据纹理图像
        uniform vec2 dataTexSize; //数据纹理尺寸
        uniform float noDataValue; //无效值
        uniform vec2 valueRange; //当前tile范围内的值的值域
        uniform bool isNearest; //最邻近
        varying vec2 vUv;
    
        ${glsl_pack}
        
        float samplerData(vec2 uv){
            #ifdef webgl2  
                return texture2D(dataTex, uv).r;
            #else
                return texture2D(dataTex, uv).a;
            #endif
        }
        float lookupData(vec2 uv){
            vec2 onePixel = 1.0 / dataTexSize;
            vec2 uv0 = floor(uv / onePixel) * onePixel + onePixel * 0.5;
            if(isNearest){
                return samplerData(uv0);
            }else{
                vec2 offset = vec2( 
                    uv.x > uv0.x ? 1.0 : -1.0, 
                    uv.y > uv0.y ? 1.0 : -1.0 
                );
                vec2 uv1 = uv0 + offset * onePixel * vec2(1,0);
                vec2 uv2 = uv0 + offset * onePixel * vec2(0,1);
                vec2 uv3 = uv0 + offset * onePixel * vec2(1,1);

                float v0 = samplerData(uv0);
                float v1 = samplerData(uv1);
                float v2 = samplerData(uv2);
                float v3 = samplerData(uv3);
                if(any(equal(vec4(v0,v1,v2,v3), vec4(noDataValue)))){
                    return v0;
                }else{
                    float v01 = mix(v0, v1, (uv.x - uv0.x) / (uv1.x - uv0.x));
                    float v23 = mix(v2, v3, (uv.x - uv2.x) / (uv3.x - uv2.x));
                    return mix(v01, v23, (uv.y - uv0.y) / (uv2.y - uv0.y));
                }
            }
        }
        
        void main(){
            float v = lookupData(vUv);
            //将采样值按值域进行归一化
            float nv = valueRange.y == valueRange.x ? 1.0 : (v - valueRange.x) / (valueRange.y - valueRange.x);
            //归一化值打包成rgb
            gl_FragColor.rgb = packNormalizeFloatToRGB(nv);
            gl_FragColor.a = v == noDataValue ? 0.0 : 1.0; //mask
        }
    `,
};

//  矢量投影, 对xy分量分别
//  原值为 xy, 范围为[xmin, xmax, ymin, ymax]
//  归一值 = nx,ny;
//  输出.rg = packNormalizeFloatToRG(nx);
//  输出.ba = packNormalizeFloatToRG(ny);
const vectorFieldTileReProjectShader = {
    vertex: `
        precision highp float;
        attribute vec2 positionRTC;
        attribute vec2 uv;
        varying vec2 vUv;
        void main(){
            gl_Position = vec4(positionRTC, 0.0, 1.0);
            vUv = uv;
        } 
    `,
    fragment: `
        precision highp float;
        {defines}
        uniform sampler2D dataTex; //数据纹理图像
        uniform vec2 dataTexSize; //数据纹理尺寸
        uniform vec4 valueRange; //[umin, umax, vmin, vmax];
        uniform bool isNearest; //最邻近
        varying vec2 vUv;
    
        ${glsl_pack}
        
        vec2 samplerData(vec2 uv){
            #ifdef webgl2  
                return texture2D(dataTex, uv).rg; //RG32F
            #else
                return texture2D(dataTex, uv).ba; //LUMINANCE_ALPHA
            #endif
        }
        vec2 lookupData(vec2 uv){
            vec2 onePixel = 1.0 / dataTexSize;
            vec2 uv0 = floor(uv / onePixel) * onePixel + onePixel * 0.5;
            if(isNearest){
                return samplerData(uv0);
            }else{
                vec2 offset = vec2( 
                    uv.x > uv0.x ? 1.0 : -1.0, 
                    uv.y > uv0.y ? 1.0 : -1.0 
                );
                vec2 uv1 = uv0 + offset * onePixel * vec2(1,0);
                vec2 uv2 = uv0 + offset * onePixel * vec2(0,1);
                vec2 uv3 = uv0 + offset * onePixel * vec2(1,1);

                vec2 v0 = samplerData(uv0);
                vec2 v1 = samplerData(uv1);
                vec2 v2 = samplerData(uv2);
                vec2 v3 = samplerData(uv3);

                vec2 v01 = mix(v0, v1, (uv.x - uv0.x) / (uv1.x - uv0.x));
                vec2 v23 = mix(v2, v3, (uv.x - uv2.x) / (uv3.x - uv2.x));
                return mix(v01, v23, (uv.y - uv0.y) / (uv2.y - uv0.y));
            }
        }
        
        void main(){
            vec2 vel = lookupData(vUv);
            float nu = valueRange.y == valueRange.x ? 1.0 : (vel.x - valueRange.x) / (valueRange.y - valueRange.x);
            float nv = valueRange.w == valueRange.z ? 1.0 : (vel.y - valueRange.z) / (valueRange.w - valueRange.z);
            gl_FragColor.rg = vel.x == 0.0 ? vec2(1) : packNormalizeFloatToRG(nu); //encode 0 with (1,1)
            gl_FragColor.ba = vel.y == 0.0 ? vec2(1) : packNormalizeFloatToRG(nv);
        }
    `,
};
