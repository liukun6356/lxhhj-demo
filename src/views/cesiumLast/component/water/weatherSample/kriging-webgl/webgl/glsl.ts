import { MAX_STOPS, ModelCode, OutputType } from "../supports";

export const glsl_pack = `
vec4 packNormalizeFloatToRGBA( in float v ) {
    vec4 enc = vec4(v, fract(vec3(255.0, 65025.0, 16581375.0) * v));
    enc.xyz -= enc.yzw / 255.0; 
    return enc;
}
float unpackRGBAToNormalizeFloat( const in vec4 v ) {
    return dot(v, vec4(1, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}
vec3 packNormalizeFloatToRGB( in float v ) {
	return packNormalizeFloatToRGBA( v ).xyz;
}
float unpackRGBToNormalizeFloat( const in vec3 v ) {
	return unpackRGBAToNormalizeFloat( vec4( v, 0 ) );
}
`;
export const glsl_kriging = `
#define MODEL_GAUSSIAN ${ModelCode.gaussian.toFixed(1)}
#define MODEL_EXPONENTIAL ${ModelCode.exponential.toFixed(1)}
#define MODEL_SPHERICAL ${ModelCode.spherical.toFixed(1)}

struct Variogram {
    float nugget;
    float range;
    float sill;
    float A;
};

float variogram_gaussian(float h, const Variogram p){
    float i = -(1.0 / p.A) * pow(h / p.range, 2.0);
    return p.nugget + ((p.sill - p.nugget) / p.range) * (1.0 - exp(i));
}
float variogram_exponential(float h, const Variogram p){
    float i = -(1.0 / p.A) * (h / p.range);
    return p.nugget + ((p.sill - p.nugget) / p.range) * (1.0 - exp(i));
}
float variogram_spherical(float h, const Variogram p){
    if (h > p.range) return p.nugget + (p.sill - p.nugget) / p.range;
    return p.nugget + ((p.sill - p.nugget) / p.range) * (1.5 * (h / p.range) - 0.5 * pow(h / p.range, 3.0));
}
float modelValue(float model, float h, const Variogram p){
    return model == MODEL_GAUSSIAN
            ? variogram_gaussian(h, p) 
            : model == MODEL_EXPONENTIAL 
                ? variogram_exponential(h, p) 
                : variogram_spherical(h, p);
}`;
export const glsl_colorMapping = `
struct Node {
    float min;
    float max;
    vec4 color;
};
Node decode_classbreak(vec4 data){
    float pack_rg = data.b;
    float pack_ba = data.a;

    vec4 color = vec4(
        floor(pack_rg),
        clamp(fract(pack_rg) * 1000.0, 0.0, 255.0),
        floor(pack_ba),
        clamp(fract(pack_ba) * 1000.0, 0.0, 255.0)
    ) / 255.0;
    return Node(data.r, data.g, color);
}

vec4 mappingColor(
    sampler2D map, 
    int stopCount,
    float value 
){
    int left = 0;
    int right = stopCount - 1;

    vec4 headColor = vec4(0);
    vec4 tailColor = vec4(0);

    for(int i = 0; i < ${Math.log2(MAX_STOPS)}; i++){
        if(left > right) break;
        int middle = (left + right) / 2;
        float x = (float(middle) + 0.5) / ${MAX_STOPS.toFixed(1)};
        vec4 encodeData = texture2D(map, vec2(x, 0.5));
        Node node = decode_classbreak(encodeData);
        if(middle == 0) headColor = node.color;
        if(middle == ${MAX_STOPS} - 1) tailColor = node.color;
        if(node.min > value){
            right = middle - 1;
        }else if(node.max <= value){
            left = middle + 1;
        }else{
            return node.color;
        }
    }
    if(right < 0) return headColor;
    if(left >= stopCount) return tailColor;
}
`;
export const glsl_fs_main = `
    #define PACKED_IMAGEBITMAP ${OutputType["packed-imagebitmap"].toFixed(1)}
    #define VALUE_BUFFER ${OutputType["value-buffer"].toFixed(1)}
    #define IMAGEBITMA ${OutputType["imagebitmap"].toFixed(1)}

    #ifdef webgl2
        layout(std140) uniform DefaultUBO {
            vec3 u_gridInfo;
            float u_dimension;

            vec2 u_variogramMxySize;
            vec2 u_packValueRange; 

            vec4 u_variogramParam;

            float u_model;
            float u_classbreakCount;
            float u_outputFormat;
        };
    #else
        uniform vec3 u_gridInfo; // xmin, ymin, cellSize 
        uniform float u_dimension;

        uniform vec2 u_variogramMxySize;
        uniform vec2 u_packValueRange; 

        uniform vec4 u_variogramParam; //nugget, range, sill, A

        uniform float u_model;
        uniform float u_classbreakCount;
        uniform float u_outputFormat;
    #endif


    uniform sampler2D u_variogramMxyTexture; 
    uniform sampler2D u_colormappingTexture; 
    ${glsl_pack}
    ${glsl_kriging}
    ${glsl_colorMapping}
    vec3 lookup(float index){
        float col = mod(index, u_variogramMxySize.x);
        float row = floor(index / u_variogramMxySize.x);
        vec2 pixel = 1.0 / u_variogramMxySize;
        vec2 uv = vec2(col, row) * pixel + pixel * 0.5;
        return texture2D(u_variogramMxyTexture, uv).xyz;
    }
        
    float hypot(float a, float b){
        return pow(pow(a,2.0) + pow(b,2.0), 0.5);
    }

    void main(){
        Variogram variogram = Variogram(
            u_variogramParam.x,
            u_variogramParam.y,
            u_variogramParam.z,
            u_variogramParam.w
        );
        vec2 inputCoord = gl_FragCoord.xy * u_gridInfo.z + u_gridInfo.xy;
        int max_i = int(u_dimension);
        float sum = 0.0;
        for(int i = 0; i < 1024; i++){
            if(i == max_i) break;
            vec3 mxy = lookup(float(i));
            sum += modelValue(
                u_model, 
                hypot(inputCoord.x - mxy[1], inputCoord.y - mxy[2]),
                variogram
            ) * mxy[0];
        }
                
        if(u_outputFormat == PACKED_IMAGEBITMAP){
            float normalizedSum = (sum - u_packValueRange.x) / (u_packValueRange.y - u_packValueRange.x);
            gl_FragColor.rgb = packNormalizeFloatToRGB(normalizedSum);
            gl_FragColor.a = 1.0;

        }else if(u_outputFormat == VALUE_BUFFER){
            gl_FragColor = vec4(sum, 0, 0, 1);
        }else{
            gl_FragColor = mappingColor(u_colormappingTexture, int(u_classbreakCount), sum);
        }
    }
`
