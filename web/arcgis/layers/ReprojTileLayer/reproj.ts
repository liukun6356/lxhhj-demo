import { assert } from "es-toolkit";
import { createProgram } from "twgl.js";
import { createTexture } from "web/utils/webgl/texture";




//少于512个三角形就复用vao
const MAX_TRIANGLES = 512;
const MAX_BUFFER_LENGTH = MAX_TRIANGLES
    * 3 /* point */
    * 4 /* xyuv */
    * 4 /* f32 */;
function createReuseVao(gl: WebGL2RenderingContext) {
    const target = gl.ARRAY_BUFFER;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const buffer = gl.createBuffer();
    gl.bindBuffer(target, buffer);
    //vertex XYUV
    gl.bufferData(target, MAX_BUFFER_LENGTH, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(target, null);
    gl.bindVertexArray(null);

    return {
        update(bufferData: Float32Array) {
            assert(bufferData.length <= MAX_BUFFER_LENGTH, '长度超出限制');
            gl.bindBuffer(target, buffer);
            gl.bufferSubData(target, 0, bufferData);
            gl.bindBuffer(target, null);
        },
        vao,
        destory() {
            gl.deleteBuffer(buffer);
            gl.deleteVertexArray(vao);
        }
    }
}

function createAltasBuilder() {
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    return (atlasSize: number[], atlas: { imagebitmap: ImageBitmap, dxdy: number[] }[]) => {
        canvas.width = atlasSize[0];
        canvas.height = atlasSize[1];
        for (let key in atlas) {
            const { dxdy, imagebitmap } = atlas[key];
            if (!imagebitmap) continue;
            ctx.drawImage(imagebitmap, dxdy[0], dxdy[1]);
        }
        return canvas;
    }
}

function initReprojCtx() {
    const canvas = new OffscreenCanvas(1, 1);
    const gl = canvas.getContext('webgl2', { depth: false, stencil: false });
    canvas.width = canvas.height = 256;
    const vs = `#version 300 es
        layout(location = 0) in vec4 xyuv;
        out vec2 v_uv;
        void main(){
            v_uv = xyuv.zw;
            vec2 position = xyuv.xy * vec2(2, -2) + vec2(-1, 1);
            gl_Position = vec4(position, 0, 1);
        }`;
    const fs = `#version 300 es
        precision highp float;
        uniform sampler2D map;
        in vec2 v_uv;
        out vec4 color;
        void main(){
            color = texture(map, v_uv);
        }`;
    const program = createProgram(gl, [vs, fs]);
    const u_map = gl.getUniformLocation(program, 'map');

    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u_map, 0);

    const reuseContext = createReuseVao(gl);
    const buildAtlas = createAltasBuilder();

    return ({ srcAtlas, srcAtlasSize, meshBuffer, tileSize }: {
        srcAtlasSize: number[],
        meshBuffer: Float32Array,
        tileSize: number[],
        srcAtlas: { imagebitmap: ImageBitmap, dxdy: number[] }[]
    }) => {
        gl.viewport(0, 0, tileSize[0], tileSize[1]);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const atlasCanvas = buildAtlas(srcAtlasSize, srcAtlas);
        const texture = createTexture(gl, {
            src: atlasCanvas,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            internalformat: gl.RGBA,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            genMipMap: false,
            flipY: true,
            unpackAlign: 4,
            minFilter: gl.NEAREST,
            magFilter: gl.NEAREST
        });
        gl.bindTexture(gl.TEXTURE_2D, texture);
        if (meshBuffer.byteLength <= MAX_BUFFER_LENGTH) {
            reuseContext.update(meshBuffer);
            gl.bindVertexArray(reuseContext.vao);
            gl.drawArrays(gl.TRIANGLES, 0, meshBuffer.length / 4);
        } else {
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, meshBuffer, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, meshBuffer.length / 4);
            gl.deleteBuffer(buffer);
        }
        gl.deleteTexture(texture);
        return canvas.transferToImageBitmap();
    }
}

let ctx: ReturnType<typeof initReprojCtx>;
export function reproj_webgl(...args: Parameters<typeof ctx>) {
    return (ctx ??= initReprojCtx()).call(null, ...args);
}
