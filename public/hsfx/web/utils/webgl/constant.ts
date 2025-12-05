
export const BufferTarget = {
    Array: 'ARRAY_BUFFER',
    ElementArray: 'ELEMENT_ARRAY_BUFFER',
    TransformFeedback: 'TRANSFORM_FEEDBACK_BUFFER',
    Uniform: 'UNIFORM_BUFFER'
} as const;
export type GLBufferTarget = typeof BufferTarget[keyof typeof BufferTarget];

export const Usage = {
    StaticDraw: 'STATIC_DRAW',
    DynamicDraw: 'DYNAMIC_DRAW',
} as const;
export type GLUsage = typeof Usage[keyof typeof Usage];


export const BufferDataType = {
    i8: 'BYTE',
    u8: 'UNSIGNED_BYTE',
    i16: 'SHORT',
    u16: 'UNSIGNED_SHORT',
    i32: 'INT',
    u32: 'UNSIGNED_INT',
    f16: 'HALF_FLOAT',
    f32: 'FLOAT',
    //packType
    i32_2_10_10_10_REV: 'INT_2_10_10_10_REV', //[-512, 511],
    u32_2_10_10_10_REV: 'UNSIGNED_INT_2_10_10_10_REV' //[0, 1023],
} as const
export type GLDataType = typeof BufferDataType[keyof typeof BufferDataType];

export const DrawMode = {
    Points: 'POINTS',
    LineStrip: 'LINE_STRIP',
    LineLoop: 'LINE_LOOP',
    Lines: 'LINES',
    TriangleStrip: 'TRIANGLE_STRIP',
    TriangleFan: 'TRIANGLE_FAN',
    Triangles: 'TRIANGLES',
} as const;
export type GLDrawMode = typeof DrawMode[keyof typeof DrawMode];


export const Wrap = {
    Repeat: 'REPEAT',
    ClampToDdge: 'CLAMP_TO_EDGE',
    MirroredRepeat: 'MIRRORED_REPEAT',
}as const;
export type GLWrap = typeof Wrap[keyof typeof Wrap];

export const FilterMin = {
    Linear: 'LINEAR',
    Nearest: 'NEAREST',
    NearestMipmapNearest: 'NEAREST_MIPMAP_NEAREST',
    LinearMipmapNearest: 'LINEAR_MIPMAP_NEAREST',
    NearestMipmapLinear: 'NEAREST_MIPMAP_LINEAR',
    LinearMipmapLinear: 'LINEAR_MIPMAP_LINEAR',
}as const;
export type GLFilterMin = typeof FilterMin[keyof typeof FilterMin];

export const FilterMag = {
    Linear: 'LINEAR',
    Nearest: 'NEAREST',
}as const;
export type GLFilterMag = typeof FilterMag[keyof typeof FilterMag];
