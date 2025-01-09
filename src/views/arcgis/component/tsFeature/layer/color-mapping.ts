export const glsl_color_mapping_gradient = `
vec4 mappingcolor_gradient(sampler2D map, float value, vec2 mappingRange, bool truncHead, bool truncTail){
    float MIN = mappingRange.x;
    float MAX = mappingRange.y;
    float x = MAX == MIN ? 1.0 : clamp((value - MIN) / (MAX - MIN), 0.0, 1.0);
    bool trunc = (value <= MIN && truncHead) || (value > MAX && truncTail);
    return trunc ? vec4(0) : texture2D(map, vec2(x, 0.5));
}
`;
export const glsl_color_mapping_classbreak = `
const vec3 ClassBreakPackColorFactor = 1.0 / vec3(65536, 256, 1);
struct ClassBreakNode {
    float min;
    float max;
    vec4 color;
};
ClassBreakNode decode_classbreak(vec4 data){
    float packColor = data.b;
    float a = data.a;
    vec4 color = vec4(mod(floor(vec3(packColor) * ClassBreakPackColorFactor), vec3(256.0)) / 255.0, a);
    return ClassBreakNode(data.r, data.g, color);
}
vec4 mappingcolor_classbreak(highp sampler2D map, float value, bool truncHead, bool truncTail){
    vec4 color;
    float cellX = 1.0 / CLASS_BREAK_COUNT;
    bool trunc = false;
    for(int i = 0; i < int(CLASS_BREAK_COUNT); i++){ 
        float x = cellX * (float(i) + 0.5);
        ClassBreakNode node = decode_classbreak(texture2D(map, vec2(x, 0.5)));
        color = node.color;
        if(i == 0 && value <= node.min){
            trunc = truncHead;
            break;
        }
        if(value <= node.max){
            break;
        }
        if(i == int(CLASS_BREAK_COUNT - 1.0) && value > node.max){
            trunc = truncTail;
        }      
    }
    return trunc ? vec4(0) : color;
}
`;
export const glsl_color_mapping_unique = `
vec4 mappingcolor_unique(sampler2D map, float value, float uniqueCount){
    float onePixel = 1.0 / uniqueCount;
    float x = (value - 0.5) * onePixel;
    vec4 color = texture2D(map, vec2(x, 0.5));
    return color.a > 0.5 ? color : vec4(0);
}
`;
export const glsl_color_mapping = `
${glsl_color_mapping_gradient}
${glsl_color_mapping_classbreak}
${glsl_color_mapping_unique}
`;
