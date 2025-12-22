import type { KrigingModel } from "./kriging";

export type ColorMappingItem = { min: number, max: number, color: string };
export type GL = WebGLRenderingContext | WebGL2RenderingContext;

export const isWorker = typeof importScripts !== 'undefined';
export const SupportOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

export const ModelCode = {
    gaussian: 1,
    exponential: 2,
    spherical: 3,
} as const;
export const OutputType = {
    'packed-imagebitmap': 1,
    'value-buffer': 2,
    'imagebitmap': 3
} as const;
export const MAX_STOPS = 256;


export class VariogramObject {
    _model: KrigingModel;
    _n: number; //variogram.n
    _params: [number, number, number, number];//variogram.nugget, variogram.range, variogram.sill, variogram.A
    _texture: WebGLTexture;
    _textureSize: number[];
    dispose: () => void;
}
export class ColorMappingObject {
    _texture: WebGLTexture;
    _textureSize: number[];
    _stopCount: number;
    dispose: () => void;
}

export const colorToRGBA = (() => {
    let init = false;
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    const map = {} as Record<string, number[]>;
    return (colorStr: string) => {
        if (!init) {
            canvas = isWorker ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
            canvas.width = canvas.height = 1;
            ctx = canvas.getContext('2d', { willReadFrequently: true }) as (CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D);
            init = true;
        }
        if (!map[colorStr]) {
            ctx.fillStyle = colorStr;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            map[colorStr] = [r, g, b, a];
        }
        return map[colorStr]
    }
})();

export function withResolvers<T>() {
    let resolve: (t: T) => void;
    let reject: (e?: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject }
}
export function getTextureUnpackAlign(rowBytes: number) {
    return !(rowBytes & 0b111) ? 8 : !(rowBytes & 0b11) ? 4 : !(rowBytes & 0b1) ? 2 : 1;
}
export function calcDataTexSize(pixelCount: number) {
    if (!pixelCount) throw new Error("长度不存在!");
    const length = ceilPowerOfTwo(Math.ceil(pixelCount));
    const l = Math.log2(length);
    const cols = Math.ceil(l / 2);
    const rows = l - cols;
    return [2 ** cols, 2 ** rows];
}
export function ceilPowerOfTwo(val: number) {
    if (val & (val - 1)) {
        val |= val >> 1;
        val |= val >> 2;
        val |= val >> 4;
        val |= val >> 8;
        val |= val >> 16;
        return val + 1;
    } else {
        return val === 0 ? 1 : val;
    }
}
export function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
}

function fract(v: number) {
    return v - Math.floor(v);
}

//输出为归一化值
export function packNormalizeFloatToRGBA(v: number) {
    if (v < 0 || v > 1) throw new Error("value must be in [0, 1]");
    // v = v * 255;
    // const r = Math.floor(v);
    // v = (v - r) * 255;
    // const g = Math.floor(v);
    // v = (v - g) * 255;
    // const b = Math.floor(v);
    // v = (v - b) * 255;
    // const a = Math.floor(v);
    // return [r, g, b, a].map((i) => i / 255);
    const enc = [v, fract(v * 255), fract(v * 65025), fract(v * 16581375)];
    return [
        enc[0] - enc[1] / 255,
        enc[1] - enc[2] / 255,
        enc[2] - enc[3] / 255,
        enc[3], //
    ];
}
//输入为归一化值 rgba∈[0,1]
export function unpackRGBAToNormalizeFloat(normalized_rgba: number[]) {
    const [r, g, b, a] = normalized_rgba;
    return r + g / 255 + b / 65025 + a / 16581375;
}