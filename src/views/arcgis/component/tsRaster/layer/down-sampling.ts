import {getTextureUnpackAlign} from "./misc";

type GLCtx = WebGLRenderingContext | WebGL2RenderingContext;
//4个imagebitmap合成一个
export const downSamplingImageBitmap = /*#__PURE__*/ (() => {
    let fn: ReturnType<typeof init>;

    function init() {
        try {
            if (!globalThis.OffscreenCanvas) throw new Error("浏览器不支持OffscreenCanvas!");

            const canvas = new OffscreenCanvas(1, 1);
            const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

            const program = createProgram(gl, shaderSource.vertex, shaderSource.fragment);

            const position = {
                glBuffer: null as WebGLBuffer,
                loc: gl.getAttribLocation(program, "position"),
                use: () => {
                    if (!position.glBuffer) {
                        const buffer = gl.createBuffer();
                        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                        gl.bufferData(
                            gl.ARRAY_BUFFER,
                            new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]),
                            gl.STATIC_DRAW
                        );
                        position.glBuffer = buffer;
                    }
                    gl.bindBuffer(gl.ARRAY_BUFFER, position.glBuffer);
                    gl.enableVertexAttribArray(position.loc);
                    gl.vertexAttribPointer(position.loc, 2, gl.FLOAT, false, 0, 0);
                },
            };
            gl.clearColor(0, 0, 0, 0);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.BLEND);
            gl.useProgram(program);

            const uniformLoc = {
                u_kernel: gl.getUniformLocation(program, "u_kernel"),
                //u_kernelWeight: gl.getUniformLocation(program, "u_kernelWeight"),
                u_tex0: gl.getUniformLocation(program, "u_tex0"),
                u_tex1: gl.getUniformLocation(program, "u_tex1"),
                u_tex2: gl.getUniformLocation(program, "u_tex2"),
                u_tex3: gl.getUniformLocation(program, "u_tex3"),
                u_isUnique: gl.getUniformLocation(program, "u_isUnique"),
                u_decodeMin: gl.getUniformLocation(program, "u_decodeMin"),
                u_decodeMax: gl.getUniformLocation(program, "u_decodeMax"),
                u_flag: gl.getUniformLocation(program, "u_flag"),
                u_tileSize: gl.getUniformLocation(program, "u_tileSize"),
                u_encodeRange: gl.getUniformLocation(program, "u_encodeRange"),
            };

            gl.uniform1fv(uniformLoc.u_kernel, [1.0, 2.0, 1.0, 2.0, 4.0, 2.0, 1.0, 2.0, 1.0]);
            //gl.uniform1f(uniformLoc.u_kernelWeight, 16);
            const createTexture = (image: ImageBitmap) => {
                const texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, getTextureUnpackAlign(image.width));
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.bindTexture(gl.TEXTURE_2D, null);
                return texture;
            };
            return function (
                subImages: {
                    imagebitmap: ImageBitmap;
                    range: number[], //min,max
                }[], //左下，右下，左上，右上
                tileSize: number,
                isUnique = false
            ) {
                const mins = subImages.map((i) => (i ? i.range[0] : NaN));
                const maxs = subImages.map((i) => (i ? i.range[1] : NaN));
                const mask = subImages.map((i) => (i ? 1 : 0));
                const allValues = [...mins, ...maxs].filter((i) => !isNaN(i));
                const allMin = Math.min.apply(null, allValues);
                const allMax = Math.max.apply(null, allValues);

                gl.uniform4fv(uniformLoc.u_decodeMin, mins);
                gl.uniform4fv(uniformLoc.u_decodeMax, maxs);
                gl.uniform4fv(uniformLoc.u_flag, mask);
                gl.uniform2f(uniformLoc.u_encodeRange, allMin, allMax);
                gl.uniform2f(uniformLoc.u_tileSize, tileSize, tileSize);
                gl.uniform1f(uniformLoc.u_isUnique, isUnique ? 1 : 0);

                const textures = [] as WebGLTexture[];
                for (let i = 0; i < 4; i++) {
                    const key = `u_tex${i}` as keyof typeof uniformLoc;
                    gl.activeTexture(gl.TEXTURE0 + i);
                    const tex = subImages[i] ? createTexture(subImages[i].imagebitmap) : null;
                    tex && textures.push(tex);
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.uniform1i(uniformLoc[key], i);
                }
                canvas.width = canvas.height = tileSize;
                gl.viewport(0, 0, tileSize, tileSize);
                gl.clear(gl.COLOR_BUFFER_BIT);

                position.use();

                gl.drawArrays(gl.TRIANGLES, 0, 6);
                textures.forEach((tex) => gl.deleteTexture(tex));
                return {
                    imagebitmap: canvas.transferToImageBitmap(),
                    range: [allMin, allMax]
                };
            };
        } catch (e) {
            return () => {
                throw e;
            };
        }
    }

    return (...args: Parameters<typeof fn>) => {
        if (!fn) {
            fn = init();
        }
        return fn(...args);
    };
})();

function handleSource(string: string, errorLine: number) {
    const lines = string.split("\n");
    const lines2 = [];

    const from = Math.max(errorLine - 6, 0);
    const to = Math.min(errorLine + 6, lines.length);

    for (let i = from; i < to; i++) {
        const line = i + 1;
        lines2.push(`${line === errorLine ? ">" : " "} ${line}: ${lines[i]}`);
    }

    return lines2.join("\n");
}

function createShader(gl: GLCtx, type: number, source: string) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;
    const errors = gl.getShaderInfoLog(shader);
    const errorMatches = /ERROR: 0:(\d+)/.exec(errors);
    let errMsg: string;
    if (errorMatches) {
        const errorLine = parseInt(errorMatches[1]);
        errMsg = errors + "\n\n" + handleSource(gl.getShaderSource(shader), errorLine);
    } else {
        errMsg = errors;
    }
    gl.deleteShader(shader);
    throw new Error(errMsg);
}

function createProgram(gl: GLCtx, vertexShaderSource: string, fragmentShaderSource: string) {
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
    console.error(errinfo);
    throw new Error(errinfo);
}

const glsl_pack = `
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

const shaderSource = {
    vertex: `
        precision highp float;
        attribute vec2 position;
        varying vec2 vUv;
        void main(){
            vUv = position;
            gl_Position = vec4(position * 2.0 - 1.0, 0, 1);
        }
    `,
    fragment: `
        precision highp float;

        uniform float u_isUnique; //是否是唯一值
        uniform sampler2D u_tex0; //左下
        uniform sampler2D u_tex1; //右下
        uniform sampler2D u_tex2; //左上
        uniform sampler2D u_tex3; //右上
        uniform vec4 u_decodeMin;  //输入[t0,t1,t2,t3]最小值
        uniform vec4 u_decodeMax;  //输入[t0,t1,t2,t3]最大值
        uniform vec4 u_flag; //4个纹理是否有数据
        uniform vec2 u_tileSize; //瓦片尺寸
        uniform vec2 u_encodeRange; //输出编码的范围
        uniform float u_kernel[9]; //从左往右,从上往下 
        uniform float u_kernelWeight;
        varying vec2 vUv;

        ${glsl_pack}

        const int KERNEL_SIZE = 3;
        const int KERNEL_OFFSET = (KERNEL_SIZE - 1) / 2;
        const int KERNEL_SIZE_POW2 = KERNEL_SIZE * KERNEL_SIZE;

        float getComponent(vec4 data, int index){
            return index == 0 ? data[0] : index == 1 ? data[1] : index == 2 ? data[2] : data[3];
        }
        
        vec2 samplerPixel(vec2 uv){
            int index = int(floor(uv.x / 0.5) + floor(uv.y / 0.5) * 2.0); //x + y * 2;

            float decode_min = getComponent(u_decodeMin, index);
            float decode_max = getComponent(u_decodeMax, index);
            bool texMask = getComponent(u_flag, index) > 0.5; //当前纹理是否有数据

            vec2 normalize_uv = fract(uv * 2.0);
            normalize_uv.y = 1.0 - normalize_uv.y; //fliY imagebitmap
      
            vec4 rawSamplerData = !texMask ? vec4(0)
                                            : index == 0 ? texture2D(u_tex0, normalize_uv)
                                            : index == 1 ? texture2D(u_tex1, normalize_uv)
                                            : index == 2 ? texture2D(u_tex2, normalize_uv)
                                            : texture2D(u_tex3, normalize_uv);
            if(rawSamplerData.a < 0.5){
                return vec2(0);
            }else{
                float nv = unpackRGBToNormalizeFloat(rawSamplerData.xyz);
                float result = mix(decode_min, decode_max, clamp(nv, 0.0, 1.0));
                if(u_isUnique > 0.5){                
                    result = floor(result + 0.5);                    
                }
                return vec2(result, 1);
            }
        }
        //卷积
        vec2 resolveContinuous(){
            vec2 centerUV = vUv;
            vec2 cellSize = 1.0 / u_tileSize;
            vec2 samplerDatas[KERNEL_SIZE_POW2];
            for(int row = -KERNEL_OFFSET; row <= KERNEL_OFFSET; row++){
                for(int col = -KERNEL_OFFSET; col <= KERNEL_OFFSET; col++){
                    vec2 pixelUV = centerUV + vec2(col, -row) * cellSize; //uv y轴是向上的
                    pixelUV = clamp(pixelUV, vec2(0), vec2(1));
                    vec2 samplerData = samplerPixel(pixelUV); //采样值
                    samplerDatas[col + KERNEL_OFFSET + (row + KERNEL_OFFSET) * KERNEL_SIZE] = samplerData;
                }
            }

            float sum = 0.0;
            float weightSum = 0.0;
            float maskSum = 0.0;
            for(int i=0; i < KERNEL_SIZE_POW2; i++){
                vec2 item = samplerDatas[i];
                float mask = item.y;
                maskSum += mask;
                sum += item.x * mask * u_kernel[i];
                weightSum += mask * u_kernel[i];
            } 
            vec2 centerData = samplerDatas[KERNEL_SIZE_POW2 / 2]; //中心点采样值
            if(centerData.y == 1.0 || maskSum >= float(KERNEL_SIZE_POW2 / 2)){
                return vec2(sum / weightSum, 1);
            }else{
                return vec2(0);
            }
        }
        vec2 resolveUnique(){
            return samplerPixel(vUv);
        }
        void main(){
            vec2 result = u_isUnique > 0.5 ? resolveUnique() : resolveContinuous();
            bool noData = result.y == 0.0;
            float normalizeVal = u_encodeRange.y == u_encodeRange.x ? 1.0 : (result.x - u_encodeRange.x) / (u_encodeRange.y - u_encodeRange.x);
            gl_FragColor.rgb = noData ? vec3(0) : packNormalizeFloatToRGB(clamp(normalizeVal, 0.0, 1.0));
            gl_FragColor.a = noData ? 0.0 : 1.0;
        }
    `,
};
