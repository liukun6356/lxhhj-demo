let ctx: /*@__PURE__*/ ReturnType<typeof initWebglCtx>;
import {Variogram} from "./kriging";
import {calcDataTexSize, getTextureUnpackAlign} from "./misc";

export function krigingGernerater_WEBGL(opts: Parameters<(typeof ctx)["gernerate"]>[0]) {
    if (!ctx) {
        ctx = initWebglCtx();
    }
    return ctx.gernerate(opts);
}

function initWebglCtx() {
    if (typeof OffscreenCanvas === "undefined") throw new Error("kriging webgl需要支持OffscreenCanvas!");
    const canvas = new OffscreenCanvas(1, 1);
    const isWebGL2 = typeof WebGL2RenderingContext !== "undefined";
    const gl = canvas.getContext(isWebGL2 ? "webgl2" : "webgl", {
        alpha: true,
        depth: false,
        stencil: false,
    }) as WebGLRenderingContext | WebGL2RenderingContext;
    if (!gl) throw new Error("webgl not support");
    if (!isWebGL2) {
        //for mxy texture
        const ext1 = gl.getExtension("OES_texture_float");
        if (!ext1) throw new Error("不支持浮点纹理!");
    }
    const vertexShader = `
    precision highp float;
    attribute vec2 position;
    void main(){
        gl_Position = vec4(position * 2.0 - 1.0, 0, 1);
    }`;
    const positionBuffer = (() => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return buffer;
    })();
    const cache = new Map<number,
        {
            program: WebGLProgram;
            uniformLoc: {
                texture: WebGLUniformLocation;
                value_range: WebGLUniformLocation;
                model: WebGLUniformLocation;
                variogram_mxy_size: WebGLUniformLocation;
                variogram_param: WebGLUniformLocation;
                grid_info: WebGLUniformLocation;
            };
            positionLoc: number;
        }>();
    const ModelCodeMap = {
        gaussian: 1,
        exponential: 2,
        spherical: 3,
    } as const;
    const getRenderProgram = (dimension: number) => {
        let p = cache.get(dimension);
        if (!p) {
            const program = createProgram(gl, vertexShader, getFragmentShader(dimension));
            p = {
                program,
                uniformLoc: {
                    model: gl.getUniformLocation(program, "model"),
                    texture: gl.getUniformLocation(program, "variogram_mxy"),
                    value_range: gl.getUniformLocation(program, "value_range"),
                    variogram_mxy_size: gl.getUniformLocation(program, "variogram_mxy_size"),
                    variogram_param: gl.getUniformLocation(program, "variogram_param"),
                    grid_info: gl.getUniformLocation(program, "grid_info"),
                },
                positionLoc: gl.getAttribLocation(program, "position"),
            };
            cache.set(dimension, p);
        }
        return p;
    };

    const cretaeMxyTexture = (variogram: Variogram) => {
        const [texWidth, texHeight] = calcDataTexSize(variogram.n);
        const {M, x, y} = variogram;
        const array = new Float32Array(texWidth * texHeight * 4);
        for (let i = 0; i < variogram.n; i++) {
            const cursor = i * 4;
            array[cursor] = M[i];
            array[cursor + 1] = x[i];
            array[cursor + 2] = y[i];
        }
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, getTextureUnpackAlign(texWidth));
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            isWebGL2 ? (gl as WebGL2RenderingContext).RGBA32F : gl.RGBA,
            texWidth,
            texHeight,
            0,
            gl.RGBA,
            gl.FLOAT,
            array
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
        return {texture, texWidth, texHeight};
    };

    return {
        gl,
        isWebGL2,
        gernerate(opts: { variogram: Variogram; llCorner: number[]; gridSize: number[]; cellSize: number }) {
            const {variogram, llCorner, gridSize, cellSize} = opts;
            const model = variogram.model;
            const valueRange = variogram.valueRange;
            const dimension = variogram.n;
            const {program, uniformLoc, positionLoc} = getRenderProgram(dimension);

            //clear
            canvas.width = gridSize[0];
            canvas.height = gridSize[1];

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);

            //position
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            const {texture, texHeight, texWidth} = cretaeMxyTexture(opts.variogram);

            gl.uniform1f(uniformLoc.model, ModelCodeMap[model]);
            gl.uniform2fv(uniformLoc.variogram_mxy_size, [texWidth, texHeight]);
            gl.uniform2fv(uniformLoc.value_range, [valueRange[0], valueRange[1]]);
            gl.uniform4fv(uniformLoc.variogram_param, [variogram.nugget, variogram.range, variogram.sill, variogram.A]);
            gl.uniform3fv(uniformLoc.grid_info, [llCorner[0], llCorner[1], cellSize]);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(uniformLoc.texture, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            // const arr = new Uint8Array(canvas.width * canvas.height * 4);
            // gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, arr);
            // window.aaaa = canvas.transferToImageBitmap()
            return canvas.transferToImageBitmap();
        },
    };
}

function createProgram(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string
) {
    const program = gl.createProgram();
    const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource); // 顶点着色器
    const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource); // 片段着色器
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

function getFragmentShader(dimension: number) {
    return `
    precision highp float;

    #define DIMENSION ${dimension}
   
    uniform highp sampler2D variogram_mxy; //实际上是 dimension x 1 的数组 三个分量分别为 M,x,y
    uniform vec2 variogram_mxy_size; //传入的纹理尺寸

    uniform vec2 value_range; //归一化值域
    uniform vec3 grid_info; // llx, lly, cellSize 

    ${glsl_pack}
    ${glsl_krigingModel}

    vec3 lookup(float index){
        float col = mod(index, variogram_mxy_size.x);
        float row = floor(index / variogram_mxy_size.x);
        vec2 pixel = 1.0 / variogram_mxy_size;
        vec2 uv = vec2(col, row) * pixel + pixel * 0.5;
        return texture2D(variogram_mxy, uv).xyz;
    }
    float hypot(float a, float b){
        return pow(pow(a,2.0) + pow(b,2.0), 0.5);
    }
    void main(){
        vec2 inputCoord = gl_FragCoord.xy * grid_info.z + grid_info.xy;

        float sum = 0.0;
        for(int i = 0; i < DIMENSION; i++){
            vec3 mxy = lookup(float(i));
            sum += modelValue(hypot(inputCoord.x - mxy[1], inputCoord.y - mxy[2])) * mxy[0];
        }
        float normalizedSum = (sum - value_range.x) / (value_range.y - value_range.x);
        gl_FragColor = packNormalizeFloatToRGBA(normalizedSum);
    }`;
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

export const glsl_pack = `
//v ∈ [0,1]
vec4 packNormalizeFloatToRGBA( in highp float v ) {
    vec4 enc = vec4(v, fract(vec3(255.0, 65025.0, 16581375.0) * v));
    enc.xyz -= enc.yzw / 255.0; 
    return enc;
}
float unpackRGBAToNormalizeFloat( const in highp vec4 v ) {
    return dot(v, vec4(1, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}
vec3 packNormalizeFloatToRGB( in highp float v ) {
	return packNormalizeFloatToRGBA( v ).xyz;
}
float unpackRGBToNormalizeFloat( const in highp vec3 v ) {
	return unpackRGBAToNormalizeFloat( vec4( v, 0 ) );
}
vec2 packNormalizeFloatToRG( in highp float v ) {
	return packNormalizeFloatToRGBA( v ).xy;
}
float unpackRGToNormalizeFloat( const in highp vec2 v ) {
	return unpackRGBAToNormalizeFloat( vec4( v, 0, 0 ) );
}
`;

const glsl_krigingModel = `
#define MODEL_GAUSSIAN 1.0
#define MODEL_EXPONENTIAL 2.0
#define MODEL_SPHERICAL 3.0

uniform vec4 variogram_param; //nugget, range, sill, A
uniform float model; //模型类型

float variogram_gaussian(float h){
    float nugget = variogram_param.x;
    float range = variogram_param.y;
    float sill = variogram_param.z;
    float A = variogram_param.w;

    float i = -(1.0 / A) * pow(h / range, 2.0);
    return nugget + ((sill - nugget) / range) * (1.0 - exp(i));
}
float variogram_exponential(float h){
    float nugget = variogram_param.x;
    float range = variogram_param.y;
    float sill = variogram_param.z;
    float A = variogram_param.w;

    float i = -(1.0 / A) * (h / range);
    return nugget + ((sill - nugget) / range) * (1.0 - exp(i));
}
float variogram_spherical(float h){
    float nugget = variogram_param.x;
    float range = variogram_param.y;
    float sill = variogram_param.z;
    float A = variogram_param.w;

    if (h > range) return nugget + (sill - nugget) / range;
    return nugget + ((sill - nugget) / range) * (1.5 * (h / range) - 0.5 * pow(h / range, 3.0));
}
float modelValue(float h){
    return model == MODEL_GAUSSIAN
            ? variogram_gaussian(h) 
            : ( model == MODEL_EXPONENTIAL ? variogram_exponential(h) : variogram_spherical(h));
}
`;
