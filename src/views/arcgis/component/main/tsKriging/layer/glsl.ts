import { ColorMappingTypeCode, RenderSamplingCode } from "./common";

export const glsl_pack = `
//v ∈ [0,1]
vec4 packNormalizeFloatToRGBA( in highp float v ) {
    vec4 enc = vec4(v, fract(vec3(255.0, 65025.0, 16581375.0) * v));
    enc.xyz -= enc.yzw / 255.0; 
    return enc;
}
float unpackRGBAToNormalizeFloat( const in highp vec4 v ) {
    return dot(v, vec4(1, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}
vec3 packNormalizeFloatToRGB( in highp float v ) {
	return packNormalizeFloatToRGBA( v ).xyz;
}
float unpackRGBToNormalizeFloat( const in highp vec3 v ) {
	return unpackRGBAToNormalizeFloat( vec4( v, 0 ) );
}
vec2 packNormalizeFloatToRG( in highp float v ) {
	return packNormalizeFloatToRGBA( v ).xy;
}
float unpackRGToNormalizeFloat( const in highp vec2 v ) {
	return unpackRGBAToNormalizeFloat( vec4( v, 0, 0 ) );
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

export const glsl_color_mapping_gradient = `
vec4 mappingcolor_gradient(sampler2D map, float value, vec2 mappingRange, bool truncHead, bool truncTail){
    float MIN = mappingRange.x;
    float MAX = mappingRange.y;
    float x = MAX == MIN ? 1.0 : clamp((value - MIN) / (MAX - MIN), 0.0, 1.0);
    bool trunc = (value <= MIN && truncHead) || (value > MAX && truncTail);
    return trunc ? vec4(0) : texture2D(map, vec2(x, 0.5));
}
`;

export const KrigingVertexShader = `
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    varying vec2 v_uv;
    void main(){
        gl_Position= vec4(position, 1);
        v_uv = uv;
    }
`;
export const KrigingFragShader = `
    precision highp float;

    #define MAPPING_GRADIENT ${ColorMappingTypeCode.gradient.toFixed(1)}
    #define MAPPING_CLASS_BREAK ${ColorMappingTypeCode["class-break"].toFixed(1)}

    #define RENDER_SAMPLING_NEAREST ${RenderSamplingCode["nearest"].toFixed(1)}
    #define RENDER_SAMPLING_LINEAR ${RenderSamplingCode["linear"].toFixed(1)}

    struct ColorMapping { 
        float type;
        highp sampler2D texture;
        float renderSampling;
        vec2 valueRange;
        bvec2 trunc;
    };
    struct TexData { 
        float type; // arraybuffer or imagebitmap
        bool zeroFlag;
        highp sampler2D map;
        vec2 decodeValueRange;
    };
    ${glsl_pack}
    ${glsl_color_mapping_gradient}
    ${glsl_color_mapping_classbreak}
    
    uniform ColorMapping u_colorMapping;
    uniform TexData u_before;
    uniform TexData u_after;

    uniform float u_percent;
    uniform vec2 u_texSize;
    uniform vec2 u_renderSize;
   
    varying vec2 v_uv;

    vec4 mappingColor(float value){
        return u_colorMapping.type == MAPPING_GRADIENT 
            ? mappingcolor_gradient(
                u_colorMapping.texture, 
                value, 
                u_colorMapping.valueRange,
                u_colorMapping.trunc.x, 
                u_colorMapping.trunc.y
            ) 
            : mappingcolor_classbreak(
                u_colorMapping.texture, 
                value, 
                u_colorMapping.trunc.x, 
                u_colorMapping.trunc.y
            );
    }
    float samplerTexture(vec2 uv, TexData texData){
        if(texData.zeroFlag) return 0.0; //is all zero
        vec2 _uv = vec2(uv.x, 1.0 - uv.y);
        if(texData.type == TEX_ARRAYBUFFER){
            #ifdef webgl2
                return texture2D(texData.map, _uv).r;
            #else
                return texture2D(texData.map, _uv).a;
            #endif
        }else{
            vec4 packVal = texture2D(texData.map, _uv);
            return mix(
                texData.decodeValueRange.x, 
                texData.decodeValueRange.y, 
                unpackRGBAToNormalizeFloat(packVal)
            );
        }
    }
    float samplerLerpValue(vec2 uv){
        float v1 = samplerTexture(uv, u_before);
        float v2 = samplerTexture(uv, u_after);
        return mix(v1, v2, u_percent);
    }

    float lookupValue(vec2 uv){
        vec2 onePixel = 1.0 / u_texSize;
        vec2 uv0 = floor(uv / onePixel) * onePixel + onePixel * 0.5;

        if(u_colorMapping.renderSampling == RENDER_SAMPLING_NEAREST){
            return samplerLerpValue(uv0);
        }else{
            vec2 offset = vec2( 
                uv.x > uv0.x ? 1.0 : -1.0,
                uv.y > uv0.y ? 1.0 : -1.0 
            );
            vec2 uv1 = uv0 + offset * onePixel * vec2(1,0);
            vec2 uv2 = uv0 + offset * onePixel * vec2(0,1);
            vec2 uv3 = uv0 + offset * onePixel * vec2(1,1);
            
            float v0 = samplerLerpValue(uv0);
            float v1 = samplerLerpValue(uv1);
            float v2 = samplerLerpValue(uv2);
            float v3 = samplerLerpValue(uv3);
            
            float v01 = mix(v0, v1, (uv.x - uv0.x) / (uv1.x - uv0.x));
            float v23 = mix(v2, v3, (uv.x - uv2.x) / (uv3.x - uv2.x));
            return mix(v01, v23, (uv.y - uv0.y) / ( uv2.y - uv0.y));
        }
    }
    void main() {
        float value = lookupValue(v_uv);
        gl_FragColor = mappingColor(value);
        vec2 dir = (0.5 - abs(v_uv - 0.5)) * u_renderSize;
        gl_FragColor.a *= smoothstep(0.0, 2.0, min(dir.x, dir.y));
    }
`;
