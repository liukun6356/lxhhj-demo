import { BufferDataType, type GLDataType } from "./constant";

export type GLSLDataFormat = 'float' | "vec2" | 'vec3' | 'vec4'
    | 'int' | 'ivec2' | 'ivec3' | 'ivec4'
    | 'uint' | 'uvec2' | 'uvec3' | 'uvec4';
export function getAttribSize(attribFormat: GLSLDataFormat) {
    switch (attribFormat) {
        case "float": return 1;
        case "vec2": return 2;
        case "vec3": return 3;
        case "vec4": return 4;

        case "int": return 1;
        case "ivec2": return 2;
        case "ivec3": return 3;
        case "ivec4": return 4;

        case "uint": return 1;
        case "uvec2": return 2;
        case "uvec3": return 3;
        case "uvec4": return 4;
    }
}

export function isFloatTypeFormat(attribFormat: GLSLDataFormat) {
    return /^(v|f)/.test(attribFormat);
}

export function isTypedArray(obj: any) {
    return ArrayBuffer.isView(obj) && !(obj instanceof DataView)
}

export function getTypedArrayName(v: TypedArray | TypedArrayConstructor) {
    if (isTypedArray(v)) {
        return Reflect.getPrototypeOf(v).constructor.name as TypedArrayName
    } else if (typeof v === 'function') {
        return (v as TypedArrayConstructor).name as TypedArrayName;
    }
    return null;
}

export function isUintTypedArray(obj: any) {
    switch (getTypedArrayName(obj)) {
        case "Uint8Array":
        case "Uint16Array":
        case "Uint32Array":
        case "Uint8ClampedArray":
            return true;
        default:
            return false;
    }
}


export function getGLDataType(typedArray: TypedArray | TypedArrayConstructor): GLDataType {
    const name = getTypedArrayName(typedArray);
    switch (name) {
        case "Int8Array":
            return BufferDataType.i8;
        case "Uint8Array":
        case "Uint8ClampedArray":
            return BufferDataType.i8;
        case "Int16Array": return BufferDataType.i16;
        case "Uint16Array": return BufferDataType.u16;
        case "Int32Array": return BufferDataType.i32;
        case "Uint32Array": return BufferDataType.u32;
        case "Float16Array": return BufferDataType.f16;
        case "Float32Array": return BufferDataType.f32;
        default: throw new Error(`can not get glType for:${typedArray}`);
    }
}

/**
 * 获取存储【索引】类型的数据 的类型化数组
 * @param maxIntValue 最大值
 * @param isElementIndex 是否是用于 gl.drawElements 的 索引
 * @returns 
 */
export function getIndexDataStoreArrayType(maxIntValue: number, isElementIndex: boolean) {
    if (isElementIndex) {
        // https://registry.khronos.org/webgl/specs/latest/2.0/#5.18
        // PRIMITIVE_RESTART_FIXED_INDEX is always enabled
        // maxValue of typedArray is use for primitive restart
        return maxIntValue < 255 ? Uint8Array
            : maxIntValue < 65535 ? Uint16Array : Uint32Array;
    } else {
        return maxIntValue <= 255 ? Uint8Array
            : maxIntValue <= 65535 ? Uint16Array : Uint32Array;
    }
}

/**
 * 获取图元重启的标记值
 * @param typedArray 数组类型
 * @returns 
 */
export function getPrimitiveRestartIndex(typedArray: TypedArray | TypedArrayConstructor) {
    const name = getTypedArrayName(typedArray);
    switch (name) {
        case "Uint8Array":
        case "Uint8ClampedArray":
            return 2 ** 8 - 1;
        case "Uint16Array":
            return 2 ** 16 - 1;
        case "Uint32Array":
            return 2 ** 32 - 1;
        default: throw new Error(`PrimitiveRestart: unsupported typed ${typedArray}`);
    }
}

/**
 * 判断2个buffer内容是否相同, NaN视为相同
 */
export function isLiteralEqual(b1: TypedArray, b2: TypedArray) {
    if (b1.length !== b2.length) return false;
    for (let i = b1.length; i--;) {
        if (String(b1[i]) !== String(b2[i])) {
            return false;
        }
    }
    return true;
}