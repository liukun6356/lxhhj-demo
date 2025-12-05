// 仅用于BaseLayerViewGL2D render, 

import { isEqual } from "es-toolkit";

// 初始状态除了 viewport 和 framebuffer， 其他均为默认值
export type GLRenderState = ReturnType<typeof createGLRenderState>;
const BlendConstantFunc = new Set<number>([
    WebGL2RenderingContext.CONSTANT_COLOR,
    WebGL2RenderingContext.ONE_MINUS_CONSTANT_COLOR,
    WebGL2RenderingContext.CONSTANT_ALPHA,
    WebGL2RenderingContext.ONE_MINUS_CONSTANT_ALPHA,
]);
export function createGLRenderState(
    gl: WebGL2RenderingContext,
    inits?: {
        viewport?: number[],
        framebuffer?: WebGLFramebuffer
    },
) {
    let _curViewport = inits?.viewport;
    let _curFramebuffer = inits?.framebuffer ?? null;
    let _curProgram: WebGLProgram;
    let _curVao: WebGLVertexArrayObject;
    const _uboBinding = {} as Record<number, WebGLBuffer>;
    const _texBinding2D = {} as Record<number, WebGLTexture>;
    const _state = createGLState();

    return {
        useProgram(program: WebGLProgram) {
            if (_curProgram !== program) {
                gl.useProgram(program);
                _curProgram = program;
            }
            return this;
        },
        viewport(vp: number[]) {
            if (!isEqual(vp, _curViewport)) {
                _curViewport = vp;
                gl.viewport(vp[0], vp[1], vp[2], vp[3]);
            }
            return this;
        },
        bindVao(vao: WebGLVertexArrayObject) {
            if (_curVao !== vao) {
                gl.bindVertexArray(vao);
                _curVao = vao;
            }
            return this;
        },
        framebuffer(fbo: WebGLFramebuffer) {
            if (_curFramebuffer !== fbo) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                _curFramebuffer = fbo;
            }
            return this;
        },
        applyUboBind(map: Record<number, WebGLBuffer>) {
            for (let index in map) {
                const ubo = map[index];
                if (_uboBinding[index] === ubo) continue;
                gl.bindBufferBase(gl.UNIFORM_BUFFER, parseInt(index), ubo);
                _uboBinding[index] = ubo;
            }
            return this;
        },
        applyTexture2DBind(map: Record<number, WebGLTexture>) {
            for (let unit in map) {
                const texture = map[unit];
                if (_texBinding2D[unit] === texture) continue;
                gl.activeTexture(gl.TEXTURE0 + parseInt(unit));
                gl.bindTexture(gl.TEXTURE_2D, texture);
                _texBinding2D[unit] = texture;
            }
            return this;
        },
        applyState(state: GLState) {
            applyBlending(state.blend);
            if (!isEqual(state.clearColor, _state.clearColor)) {
                _state.clearColor = [...state.clearColor];
                gl.clearColor(...(state.clearColor as [number, number, number, number]));
            }
            return this;
        },
        uboBindings: _uboBinding,
        texBinding2D: _texBinding2D,

    }
    function applyBlending({
        enable, color, equationAlpha, equationRGB,
        funcSrcRGB, funcSrcAlpha, funcDstRGB, funcDstAlpha
    }: GLState['blend']) {
        const blend = _state.blend;
        if (!enable) {
            if (!blend.enable) return;
            blend.enable = false;
            gl.disable(gl.BLEND);
        } else {
            if (!blend.enable) {
                gl.enable(gl.BLEND);
                blend.enable = true;
            };
            if (
                !isEqual(color, blend.color) &&
                (
                    BlendConstantFunc.has(funcSrcRGB)
                    || BlendConstantFunc.has(funcSrcAlpha)
                    || BlendConstantFunc.has(funcDstRGB)
                    || BlendConstantFunc.has(funcDstAlpha)
                )
            ) {
                gl.blendColor(color[0], color[1], color[2], color[3]);
                blend.color = [...color];
            };
            if (equationAlpha !== blend.equationAlpha
                || equationRGB !== blend.equationRGB
            ) {
                gl.blendEquationSeparate(equationRGB, equationAlpha);
                Object.assign(blend, { equationRGB, equationAlpha })
            };
            if (
                funcSrcAlpha !== blend.funcSrcAlpha
                || funcDstAlpha !== blend.funcDstAlpha
                || funcSrcRGB !== blend.funcSrcRGB
                || funcDstRGB !== blend.funcDstRGB
            ) {
                gl.blendFuncSeparate(funcSrcRGB, funcDstRGB, funcSrcAlpha, funcDstAlpha);
                Object.assign(blend, { funcSrcRGB, funcDstRGB, funcSrcAlpha, funcDstAlpha });
            }
        }
    }
};

export type GLState = ReturnType<typeof createGLState>;
export function createGLState(state?: Partial<{
    clearColor: number[],
    blend: {
        enable?: boolean,
        color?: number[],
        equationRGB?: number,
        equationAlpha?: number,
        funcSrcRGB?: number,
        funcSrcAlpha?: number,
        funcDstRGB?: number,
        funcDstAlpha?: number,
        equation?: number,
        funcSrc?: number,
        funcDst?: number
    },
    textureBinding: Record<number, WebGLTexture>,
    uboBinding: Record<number, WebGLBuffer>,
}>) {
    const { blend = {}, clearColor = [0, 0, 0, 0] } = state ?? {};
    return {
        clearColor,
        blend: {
            enable: blend.enable ?? false,
            color: blend.color ?? [0, 0, 0, 0],
            equationRGB: blend.equationRGB ?? (blend.equation ?? WebGL2RenderingContext.FUNC_ADD),
            equationAlpha: blend.equationAlpha ?? (blend.equation ?? WebGL2RenderingContext.FUNC_ADD),
            funcSrcRGB: blend.funcSrcRGB ?? (blend.funcSrc ?? WebGL2RenderingContext.ONE),
            funcSrcAlpha: blend.funcSrcAlpha ?? (blend.funcSrc ?? WebGL2RenderingContext.ONE),
            funcDstRGB: blend.funcDstRGB ?? (blend.funcDst ?? WebGL2RenderingContext.ZERO),
            funcDstAlpha: blend.funcDstAlpha ?? (blend.funcDst ?? WebGL2RenderingContext.ZERO),
        },
    }
}