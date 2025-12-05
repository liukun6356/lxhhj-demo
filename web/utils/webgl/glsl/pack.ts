export const glsl_pack = `
vec4 intToRGBA(highp uint value) {
    uint mask = 255u;
    float r = float((value >>  0) & mask) / 255.0;
    float g = float((value >>  8) & mask) / 255.0;
    float b = float((value >> 16) & mask) / 255.0;
    float a = float((value >> 24) & mask) / 255.0;
    
    return vec4(r, g, b, a);
}
`;