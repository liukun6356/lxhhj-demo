import { createTexture,type TextureOpts } from "./texture";

export type FBO = ReturnType<typeof createFBO>;
export function createFBO(
    gl: WebGL2RenderingContext,
    { width, height, colorAttachments }: {
        width: number,
        height: number,
        depth: boolean,
        stencil: boolean,
        colorAttachments: Record<number, Partial<TextureOpts>>
    },
) {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    const textures = {} as Record<number, WebGLTexture>;
    for (let index in colorAttachments) {
        textures[index] = createTexture(gl, {
            ...colorAttachments[index],
            width,
            height,
        });
        textures[index]._msg = `rt-attach${index}`;
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0 + parseInt(index),
            gl.TEXTURE_2D,
            textures[index],
            0
        );
    }

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Framebuffer is not complete!');
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
        destroy() {
            gl.deleteFramebuffer(framebuffer);
            Object.values(textures).forEach(i => gl.deleteTexture(i));
        },
        framebuffer,
        defaultViewport: [0, 0, width, height],
        textures,
        width,
        height,
    }
}