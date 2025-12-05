import { assert } from "es-toolkit";
import { type BufferOpts, createGLBuffer, updateGLBuffer } from "./buffer";
import { BufferTarget, Usage } from "./constant";

export function createUBO(
    gl: WebGL2RenderingContext,
    { srcData, size, usage = Usage.StaticDraw }: Omit<BufferOpts, 'target'>
) {
    return createGLBuffer(gl, { srcData, size, usage, target: BufferTarget.Uniform });
}

export const StructBaseAlign = 4 * Float32Array.BYTES_PER_ELEMENT;
export function ensureStructSize(byteLength: number) {
    assert(byteLength % StructBaseAlign === 0, '结构成员基对齐必须是16个字节');
}


export function createMultiPartsUBO<T extends Record<string, (...args: any) => Float32Array>, K extends keyof T>(
    gl: WebGL2RenderingContext,
    parts: {
        name: K,
        byteSize: number,
        calcFunc: T[K],
    }[]
) {
    let totalLength = 0;
    const map = {} as Record<K, {
        offset: number,
        length: number,
        fn: T[K],
        oldData: ArrayBufferLike
    }>;
    for (let { name, byteSize, calcFunc: dataCalcFunc } of parts) {
        map[name] = {
            offset: totalLength,
            length: byteSize,
            fn: dataCalcFunc,
            oldData: null
        };
        totalLength += byteSize;
    }
    const ubo = createUBO(gl, { size: totalLength, usage: Usage.DynamicDraw });
    return {
        update(name: K, ...args: Parameters<T[K]>) {
            const { oldData, fn, offset, length } = map[name];
            const newData = fn(...args);
            assert(newData.byteLength === length, '返回长度不一致');
            const newBuff = new Int8Array(newData.buffer);
            const oldBuff = oldData ? new Int8Array(oldData) : null;
            if (!oldBuff || newBuff.findIndex((_, index) => newBuff[index] !== oldBuff[index]) !== -1) {
                updateGLBuffer(gl, ubo, BufferTarget.Uniform, newData, offset, 0);
                map[name].oldData = newData.buffer;
            }
        },
        get buffer() { return ubo },
        destroy() {
            gl.deleteBuffer(ubo)
        }
    }
}
