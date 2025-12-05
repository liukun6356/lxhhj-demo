//5*vec4
export const glsl_vector_field_struct = `
struct VectorField {
    vec2 topLeftScreen;
    vec2 dimension; 
    //
    vec2 offsetNoRotate;
    bool enableColorMapping;
    bool enableSizeMapping;
    //
    vec2 flowRange;
    vec2 sizeRange;
    //
    vec4 defaultColor;
    //
    float defaultSize;
    float samplerGap;
    float arrowAspect;
    float minShowFlow;
};
`;

export const glsl_vector_field_utils = `
vec2 getSamplerScreenPosNoRotate(highp int samplerIndex, VectorField vf){ 
    int width = int(vf.dimension.x);
    int row = samplerIndex / width;
    int col = samplerIndex - width * row;
    return vec2(col, row) * vf.samplerGap + vf.topLeftScreen + vf.offsetNoRotate;
}
`;

//uint 32
// 1,    1,     15,       15
// flag, flag, encode_u, encode_v
export const glsl_vector_field_pack = `

const float vf_PackFactor = 32767.0; //2^15-1

highp uint vf_packUVToUint(vec2 uv, bvec2 dataFlag, vec2 uRange, vec2 vRange){
    float normalized_u = (uv.x - uRange.x) / (uRange.y - uRange.x);
    float normalized_v = (uv.y - vRange.x) / (vRange.y - vRange.x);
    uint u = uint(round(clamp(normalized_u, 0.0, 1.0) * vf_PackFactor));
    uint v = uint(round(clamp(normalized_v, 0.0, 1.0) * vf_PackFactor));

    uint flag = 0u;
    flag |=  dataFlag.x ? (1u << 1) : 0u;
    flag |=  dataFlag.y ? 1u        : 0u;

    u = u << 15;
    flag = flag << 30;

    return flag | u | v;

}
vec2 vf_unpackUintToUV(uint packedValue, vec2 uRange, vec2 vRange, inout bvec2 flag){
    flag.x = ((packedValue >> 31) & 1u) > 0u;
    flag.y = ((packedValue >> 30) & 1u) > 0u;

    uint u = (packedValue >> 15) & 0x7FFFu;
    uint v = packedValue & 0x7FFFu;
    return vec2(
        mix(uRange.x, uRange.y, float(u) / vf_PackFactor),
        mix(vRange.x, vRange.y, float(v) / vf_PackFactor)
    );
}
`;