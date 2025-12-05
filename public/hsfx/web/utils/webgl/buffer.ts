import { assert } from "es-toolkit";
import { BufferDataType, BufferTarget, type GLBufferTarget, type GLDataType, type GLUsage, Usage } from "./constant";
import { getAttribSize, type GLSLDataFormat, isFloatTypeFormat } from "./utils";


export interface BufferOpts {
    srcData?: ArrayBuffer | ArrayBufferView,
    size?: number,
    usage?: GLUsage;
    target?: GLBufferTarget;
}
export function createGLBuffer(gl: WebGL2RenderingContext, config: BufferOpts) {
    assert(config.srcData || config.size, 'data 或者size至少提供一个');
    const buffer = gl.createBuffer();
    const target = gl[config.target];
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, config.srcData || config.size as any, gl[config.usage]);
    gl.bindBuffer(target, null);
    (buffer as any)._target = config.target;
    return buffer;
}
export function updateGLBuffer(
    gl: WebGL2RenderingContext,
    buffer: WebGLBuffer,
    target: GLBufferTarget,
    newData: ArrayBuffer | ArrayBufferView,
    dstByteOffset = 0,
    srcOffset = 0,
    length = 0
) {
    const _target = gl[target];
    gl.bindBuffer(_target, buffer);
    gl.bufferSubData(_target, dstByteOffset, newData as any, srcOffset, length);
    gl.bindBuffer(_target, null);
}

export function createVBO(
    gl: WebGL2RenderingContext,
    { srcData, size, usage = Usage.StaticDraw }: Omit<BufferOpts, 'target'>
) {
    return createGLBuffer(gl, { srcData, size, usage, target: BufferTarget.Array });
}
export function createEBO(
    gl: WebGL2RenderingContext,
    { srcData, size, usage = Usage.StaticDraw }: Omit<BufferOpts, 'target'>
) {
    return createGLBuffer(gl, { srcData, size, usage, target: BufferTarget.ElementArray });
}


//
export interface AttributeOpts {
    name: string;
    format: GLSLDataFormat; //glsl内的格式
    type: GLDataType;
    normalized?: boolean;
    divisor?: number;
    offset?: number;
    stride?: number;
}
export interface Attribute extends Required<AttributeOpts> {
    size: number;
    isFloatAttrib: boolean;
};
export function createAttribute({
    name, format, type, normalized = false,
    divisor = 0, offset = 0, stride = 0
}: AttributeOpts): Attribute {
    const isFloatAttrib = isFloatTypeFormat(format);
    if (isFloatAttrib) {
        if (normalized) {
            assert(type !== BufferDataType.f16 && type !== BufferDataType.f32, `type:${type}不支持normalized`);
        } else {
            //可能会丢精度
            assert(type !== BufferDataType.i32 && type !== BufferDataType.u32, `format:${format}不支持i32和u32类型数据`);
        }
        if (type === BufferDataType.i32_2_10_10_10_REV || type === BufferDataType.u32_2_10_10_10_REV) {
            assert(format === 'vec4', `${type}仅支持vec4类型, 当前format:${format}`);
        }
    } else {
        //int uint ivec2|3|4 类型
        //输入数据类型必须是 (i|u)(8|16|32)
        if (format.startsWith('u')) {
            assert(
                type === BufferDataType.u8
                || type === BufferDataType.u16
                || type === BufferDataType.u32,
                `format:${format} 仅支持无符号整型数据, 当前数据类型:${type}`
            );
        } else {
            assert(
                type === BufferDataType.i8
                || type === BufferDataType.i16
                || type === BufferDataType.i32,
                `format:${format} 仅支持整型数据, 当前数据类型:${type}`
            );
        }
        //不支持归一化
        assert(normalized === false, `format:${format}不支持归一化`);
    }
    return {
        name, format, type,
        normalized, divisor, offset, stride,
        size: getAttribSize(format),
        isFloatAttrib
    }
}


export function createVAO(
    gl: WebGL2RenderingContext,
    layouts: Record<number, {
        attribute: Attribute,
        vbo?: WebGLBuffer
    }>,
    ebo?: WebGLBuffer
) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    let curVbo: WebGLBuffer;

    for (let slot in layouts) {
        const location = parseInt(slot);
        const { vbo, attribute } = layouts[slot];
        assert(!!vbo, 'vbo不存在');
        if (curVbo !== vbo) {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            curVbo = vbo;
        }
        gl.enableVertexAttribArray(location);
        if (attribute.isFloatAttrib) {
            gl.vertexAttribPointer(location, attribute.size, gl[attribute.type], attribute.normalized, attribute.stride, attribute.offset);
        } else {
            gl.vertexAttribIPointer(location, attribute.size, gl[attribute.type], attribute.stride, attribute.offset);
        }
        gl.vertexAttribDivisor(location, attribute.divisor);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    ebo && gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

    gl.bindVertexArray(null);
    return vao;
}

