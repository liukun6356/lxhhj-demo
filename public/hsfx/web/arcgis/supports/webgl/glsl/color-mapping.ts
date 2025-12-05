import { COLOR_MAPPING_TEXTURE_WIDTH, ColorMapping } from "../../constant";

// min <= v < max

export const glsl_color_mapping_def = `
#define MAPPING_RAMP ${ColorMapping.ramp.toFixed(1)}
#define MAPPING_CLASSBREAK ${ColorMapping["classbreak"].toFixed(1)}
#define MAPPING_UNIQUE ${ColorMapping.unique.toFixed(1)}
`;


export const glsl_color_mapping_ramp = `
vec4 mappingcolor_ramp(
    sampler2D map, 
    float value, 
    vec2 mappingRange, 
    bool clampHead, 
    bool clampTail,
    vec4 headColor,
    vec4 tailColor
){
    float MIN = mappingRange.x;
    float MAX = mappingRange.y;

    float x = MAX == MIN ? 1.0 : (value - MIN) / (MAX - MIN);
    vec4 mappingColor = texture(map, vec2(x, 0.5));

    if(value < MIN && clampHead) mappingColor = headColor;
    if(value > MAX && clampTail) mappingColor = tailColor;
    
    return mappingColor;
}`;


const CLASS_BREAKS_MAX_LOOP_COUNT = Math.log2(COLOR_MAPPING_TEXTURE_WIDTH);
export const glsl_color_mapping_classbreaks = `
struct ClassBreakNode {
    float min;
    float max;
    vec4 color;
};

ClassBreakNode decode_classbreak(vec4 data){
    float min = data.r;
    float max = data.g;
    float packRG = data.b;
    float packBA = data.a;
    vec2 rg = mod(floor(vec2(packRG) / vec2(256, 1)), vec2(256.0)) / 255.0;
    vec2 ba = mod(floor(vec2(packBA) / vec2(256, 1)), vec2(256.0)) / 255.0;
    return ClassBreakNode(min, max, vec4(rg, ba));
}

vec4 mappingcolor_classbreak(
    sampler2D map, 
    int breaksCount,
    float value, 
    bool clampHead, 
    bool clampTail,
    vec4 headColor,
    vec4 tailColor
){
    int left = 0;
    int right = breaksCount - 1;
    for(int i = 0; i < ${CLASS_BREAKS_MAX_LOOP_COUNT}; i++){
        if(left > right) break;
        int middle = (left + right) / 2;

        float x = (float(middle) + 0.5) / ${COLOR_MAPPING_TEXTURE_WIDTH.toFixed(1)};
        vec4 encodeData = texture(map, vec2(x, 0.5));
        ClassBreakNode node = decode_classbreak(encodeData);

        if(node.min > value){
            right = middle - 1;
        }else if(node.max <= value){
            left = middle + 1;
        }else{
            return node.color;
        }
    }

    if(right < 0){
        return clampHead ? vec4(0) : headColor;
    }

    if(left >= breaksCount){
        return clampTail ? vec4(0) : tailColor;
    }
}
`;

export const glsl_color_mapping_unique = `
vec4 mappingcolor_unique(sampler2D map, float code_value){
    float x = (code_value + 0.5) / 256.0;
    vec4 color = texture(map, vec2(x, 0.5));
    return color.a > 0.5 ? color : vec4(0);
}`;
//4 * vec4
export const glsl_color_mapping_struct = `
struct ColorMapping {
    float type;
    float breaks;
    float clampHead;
    float clampTail;

    vec4 headColor;
    vec4 tailColor;

    vec2 mappingValueRange;
};
`;

//4 * vec4
export const glsl_color_mapping_func = `
vec4 mappingColor(float value, ColorMapping m, sampler2D mappingTex){
    if(m.type == MAPPING_RAMP){
        return mappingcolor_ramp(
            mappingTex,
            value,
            m.mappingValueRange,
            m.clampHead > 0.5,
            m.clampTail > 0.5,
            m.headColor,
            m.tailColor
        );
    }else if(m.type == MAPPING_CLASSBREAK){
        return mappingcolor_classbreak(
            mappingTex,
            int(m.breaks),
            value,
            m.clampHead > 0.5,
            m.clampTail > 0.5,
            m.headColor,
            m.tailColor
        );
    }else{
        return vec4(0);
    }
}
`;