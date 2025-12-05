import { createProgram } from "twgl.js";
import { createAttribute, createVAO, createVBO } from "web/utils/webgl/buffer";
import { BufferDataType, Usage } from "web/utils/webgl/constant";

const vs = `#version 300 es
    layout(location = 0) in vec2 position;

    uniform vec2 u_tileCenterScreenPos;
    uniform vec2 u_tileScreenSize;
    uniform mat3 u_rotate;
    uniform vec2 u_screenSize;

    out vec2 v_uv;
    void main(){
        v_uv = position.xy;
        vec2 pos = (position * 2.0 - 1.0) * vec2(1, -1);
        pos = (u_rotate * vec3(pos, 1.0)).xy  * u_tileScreenSize * 0.5;
        pos = pos + u_tileCenterScreenPos;
        pos = pos / u_screenSize * vec2(2, -2) + vec2(-1, 1);
        gl_Position = vec4(pos, 0, 1);
    }
`;
const fs = `#version 300 es
    precision highp float;
    uniform sampler2D u_map;
    in vec2 v_uv;
    out vec4 color;
    void main(){
        color = texture(u_map, v_uv);
    }
`;

export function createTileRenderProgram(gl: WebGL2RenderingContext) {
    const program = createProgram(gl, [vs, fs]);
    const uniforms = {
        u_tileCenterScreenPos: gl.getUniformLocation(program, 'u_tileCenterScreenPos'),
        u_tileScreenSize: gl.getUniformLocation(program, 'u_tileScreenSize'),
        u_rotate: gl.getUniformLocation(program, 'u_rotate'),
        u_screenSize: gl.getUniformLocation(program, 'u_screenSize'),
        u_map: gl.getUniformLocation(program, 'u_map'),
    }
    const vbo = createVBO(gl, {
        srcData: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
        usage: Usage.StaticDraw
    });
    const attribute = createAttribute({ name: 'position', format: 'vec2', type: BufferDataType.f32 });

    const vao = createVAO(gl, { 0: { attribute, vbo } });

    return {
        program,
        uniforms,
        vao,
        destory() {
            gl.deleteProgram(program);
            gl.deleteVertexArray(vao);
            gl.deleteBuffer(vbo);
        }
    }
}
