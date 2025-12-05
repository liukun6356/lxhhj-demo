import { assert } from "es-toolkit";
import { canGenerateMipmap } from "twgl.js";
import { ceilPowerOfTwo } from "../../../shared/utils/math";

/**
 * 获取【数据纹理】的尺寸
 * @param pixelCount 像素数
 * @returns 
 */
export function calcDataTexSize(pixelCount: number) {
    const near2 = ceilPowerOfTwo(Math.ceil(pixelCount));
    const l = Math.log2(near2);
    const cols = 2 ** Math.ceil(l / 2);
    const rows = Math.ceil(pixelCount / cols);
    return [cols, rows];
}

export function getTextureUnpackAlign(rowBytes: number) {
    return !(rowBytes & 0b111)
        ? 8
        : !(rowBytes & 0b11)
            ? 4
            : !(rowBytes & 0b1)
                ? 2
                : 1;
}

export const DataTextureBaseOpts = {
    wrapS: WebGL2RenderingContext.CLAMP_TO_EDGE,
    wrapT: WebGL2RenderingContext.CLAMP_TO_EDGE,
    flipY: false,
    genMipMap: false,
    minFilter: WebGL2RenderingContext.NEAREST,
    magFilter: WebGL2RenderingContext.NEAREST,
    premultiplyAlpha: false,
} as const;

export type TextureOpts = {
    src: HTMLImageElement
    | OffscreenCanvas
    | HTMLCanvasElement
    | HTMLVideoElement
    | ImageData
    | ImageBitmap
    | ArrayBufferView,
    wrapS: number,
    wrapT: number,
    minFilter: number,
    magFilter: number,
    internalformat: number,
    format: number,
    type: number,
    width: number,
    height: number,
    flipY: boolean,
    unpackAlign: number,
    premultiplyAlpha: boolean,
    genMipMap: boolean, //whether genertate mipmap
};
export function createTexture(
    gl: WebGL2RenderingContext,
    opts: Partial<TextureOpts>
) {
    const texture = gl.createTexture();
    const target = gl.TEXTURE_2D;
    gl.bindTexture(target, texture);

    let { width, height, src, internalformat, format, type, minFilter, genMipMap = false } = opts;
    const isArrayBuffer = src && 'buffer' in src && src.buffer instanceof ArrayBuffer;
    minFilter = minFilter || gl.NEAREST_MIPMAP_LINEAR;
    const shouldGenMipMap = minFilter !== gl.NEAREST && minFilter !== gl.LINEAR;
    if (isArrayBuffer || !src) {
        assert(width && height, 'create texture failed: width/height not exist when src is TypedArray or null');
        assert(internalformat && format && type, 'create texture failed: internalformat/format/type not exist when src is TypedArray or null');
    } else {
        internalformat = internalformat ?? gl.RGBA;
    }

    if (shouldGenMipMap) {
        assert(!!genMipMap, `minFilter:${minFilter} require mipmap gernerate, but genMipMap is false, set genMipMap=true or set minFilter=gl.LINEAR/gl.NEAREST `);
        assert(canGenerateMipmap(gl, width, height, internalformat), `arrayBufferView with internalformat:${internalformat}: can not genertate mipmap`);
    }

    if (src) {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, opts.unpackAlign ?? 1);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, opts.premultiplyAlpha ?? false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, opts.flipY ?? false);
    }

    gl.texParameteri(target, gl.TEXTURE_WRAP_S, opts.wrapS ?? gl.REPEAT);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, opts.wrapT ?? gl.REPEAT);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, opts.magFilter ?? gl.LINEAR);

    if (isArrayBuffer || !src) {
        gl.texImage2D(target, 0, internalformat, width, height, 0, format, type, src as any);
    } else {
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src as any);
    }
    shouldGenMipMap && src && gl.generateMipmap(target);

    gl.bindTexture(target, null);
    return texture;
}


