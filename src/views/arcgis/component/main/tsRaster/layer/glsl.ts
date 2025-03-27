import { ColorMappingTypeCode, RenderSamplingCode } from "./common";
import { glsl_pack } from "./pack";
import { glsl_color_mapping } from "./color-mapping";

export const RasterSimpleShader = {
    vertex: `
        precision highp float;

        attribute vec2 position;
        attribute vec3 instance_tileRenderInfo;
        attribute vec4 instance_tileTexInfo;
        attribute vec4 instance_tileDecodeRange;
        
        uniform mat3 u_display;
        uniform mat3 u_rotation;
        
        varying vec2 v_uv;
        varying vec4 v_texInfo;
        varying float v_texRenderSize;
        varying vec4 v_decodeRange;
        void main(){
            v_uv = vec2(position.x, 1.0 - position.y); //手动flipY          
            v_texInfo = instance_tileTexInfo;
            v_texRenderSize = instance_tileRenderInfo.x;
            v_decodeRange = instance_tileDecodeRange;

            vec2 posTransform = (position * 2.0 - 1.0); //转换为相对中心的 -1 ~ 1范围
            posTransform = (u_rotation * vec3(posTransform, 1)).xy; //旋转
            vec2 screenPos = posTransform * vec2(1,-1); //y轴翻转
            screenPos *= instance_tileRenderInfo.x * 0.5;
            screenPos += instance_tileRenderInfo.yz;
            gl_Position.xy = (u_display * vec3(screenPos, 1.0)).xy; 
            gl_Position.zw = vec2(0, 1);
        } 
    `,
    fragment: `
        precision highp float;
        
        #define UNDEFINE_VALUE 0.0
        #define MAPPING_GRADIENT ${ColorMappingTypeCode.gradient.toFixed(1)}
        #define MAPPING_CLASS_BREAK ${ColorMappingTypeCode["class-break"].toFixed(1)}
        #define MAPPING_UNIQUE_VALUE ${ColorMappingTypeCode["unique-value"].toFixed(1)}

        #define RENDER_SAMPLING_NEAREST ${RenderSamplingCode["nearest"].toFixed(1)}
        #define RENDER_SAMPLING_LINEAR ${RenderSamplingCode["linear"].toFixed(1)}
        
        struct ColorMapping { 
            float type;
            float renderSampling;
            sampler2D texture;
            vec2 valueRange;
            float uniqueCount;
            bvec2 trunc;
        };
        uniform highp sampler2D u_texArr[TEXTURE_COUNT]; //纹理数组
        uniform vec2 u_texSize; //纹理的尺寸

        uniform float u_lerpValue;
        uniform float u_showDebugBorder;
        uniform ColorMapping u_colorMapping;

        varying vec2 v_uv;
        varying vec4 v_texInfo;
        varying float v_texRenderSize;
        varying vec4 v_decodeRange;

        ${glsl_pack}
        ${glsl_color_mapping}

        
        vec4 mappingColor(float value){
            return u_colorMapping.type == MAPPING_GRADIENT 
                        ?  mappingcolor_gradient(
                            u_colorMapping.texture, 
                            value, 
                            u_colorMapping.valueRange,
                            u_colorMapping.trunc.x, 
                            u_colorMapping.trunc.y
                        ) 
                        : u_colorMapping.type == MAPPING_CLASS_BREAK 
                            ? mappingcolor_classbreak(
                                u_colorMapping.texture, 
                                value, 
                                u_colorMapping.trunc.x, 
                                u_colorMapping.trunc.y
                            ) 
                            : mappingcolor_unique(u_colorMapping.texture, value, u_colorMapping.uniqueCount);
        }

        vec4 samplerRawValue(int index, vec2 uv){
            vec4 data;
            for(int i = 0; i < TEXTURE_COUNT; i++){
                if(index == i){
                    data = texture2D(u_texArr[i], uv);
                    break;
                }
            }
            return data;
        }

        vec2 samplerDecodeValue(vec2 uv, int texIndex, vec2 decodeRange){
            vec4 rawData = samplerRawValue(texIndex, uv);
            if(rawData.a < 0.5){
                return vec2(0);
            }else{
                float nv = unpackRGBToNormalizeFloat(rawData.xyz);
                float result = mix(decodeRange.x, decodeRange.y, clamp(nv, 0.0, 1.0));
                if(u_colorMapping.type == MAPPING_UNIQUE_VALUE){
                    result = floor(result + 0.5);
                }
                return vec2(result, 1);
            }
        }
        
        vec2 lookupValue(vec2 uv, int texIndex, vec2 decodeRange){
            vec2 onePixel = 1.0 / u_texSize;
            vec2 uv0 = floor(uv / onePixel) * onePixel + onePixel * 0.5;
           
            if(u_colorMapping.type == MAPPING_UNIQUE_VALUE || u_colorMapping.renderSampling == RENDER_SAMPLING_NEAREST){
                return samplerDecodeValue(uv0, texIndex, decodeRange);
            }else{
                vec2 offset = vec2( 
                    uv.x > uv0.x ? 1.0 : -1.0, 
                    uv.y > uv0.y ? 1.0 : -1.0 
                );
                vec2 uv1 = uv0 + offset * onePixel * vec2(1,0);
                vec2 uv2 = uv0 + offset * onePixel * vec2(0,1);
                vec2 uv3 = uv0 + offset * onePixel * vec2(1,1);

                vec2 v0 = samplerDecodeValue(uv0, texIndex, decodeRange);
                vec2 v1 = samplerDecodeValue(uv1, texIndex, decodeRange);
                vec2 v2 = samplerDecodeValue(uv2, texIndex, decodeRange);
                vec2 v3 = samplerDecodeValue(uv3, texIndex, decodeRange);

                vec4 mask = vec4(v0.y, v1.y, v2.y, v3.y);
                if(any(equal(mask,vec4(0)))){
                    return v0;
                }else{
                    float v01 = mix(v0.x, v1.x, (uv.x - uv0.x) / (uv1.x - uv0.x));
                    float v23 = mix(v2.x, v3.x, (uv.x - uv2.x) / (uv3.x - uv2.x));
                    float v = mix(v01, v23, (uv.y - uv0.y) / (uv2.y - uv0.y));
                    return vec2(v,1);
                }
            }
        }

        vec4 getColor(vec2 uv){
            int index1 = int(v_texInfo.x);
            int index2 = int(v_texInfo.y);

            bool enable1 = v_texInfo.z > 0.5;
            bool enable2 = v_texInfo.w > 0.5;

            vec2 range1 = v_decodeRange.xy;
            vec2 range2 = v_decodeRange.zw;

            vec2 v1 = enable1 ? lookupValue(uv, index1, range1) : vec2(0);
            vec2 v2 = enable2 ? lookupValue(uv, index2, range2) : vec2(0);
                
            bool mask1 = v1.y > 0.5;
            bool mask2 = v2.y > 0.5;
             
            vec4 color1 = mask1 ? mappingColor(v1.x) : vec4(0);
            vec4 color2 = mask2 ? mappingColor(v2.x) : vec4(0);

            return mix(color1, color2, u_lerpValue);
        }


        void main(){
            if(u_showDebugBorder > 0.5){
                vec2 dir2 = abs(v_uv - vec2(0.5));
                float dirMax = max(dir2.x, dir2.y) * 2.0;
                float limit = 1.0 - 2.0 / v_texRenderSize;
                gl_FragColor = dirMax < limit ? getColor(v_uv) : vec4(0,0,0,1);
            }else{
                gl_FragColor = getColor(v_uv);
            }
        }
    `,
};
//渲染到纹理,
//pixel    r    g     b    a
//前一时刻 u1   v1,
//后一时刻            u2   v2,
export const RasterVectorFieldMergeShader = {
    vertex: `
        precision highp float;

        attribute vec2 position;
        attribute vec3 instance_tileRenderInfo;
        attribute vec4 instance_tileTexInfo;
        attribute vec4 instance_tileDecodeRange_1;
        attribute vec4 instance_tileDecodeRange_2;
        
        uniform mat3 u_display;
        uniform mat3 u_rotation;
        
        varying vec2 v_uv;
        varying vec4 v_texInfo;
        varying float v_texRenderSize;
        varying vec4 v_decodeRange_1;
        varying vec4 v_decodeRange_2;
        void main(){
            v_uv = vec2(position.x, 1.0 - position.y); //手动flipY          
            v_texInfo = instance_tileTexInfo;
            v_texRenderSize = instance_tileRenderInfo.x;
            v_decodeRange_1 = instance_tileDecodeRange_1;
            v_decodeRange_2 = instance_tileDecodeRange_2;

            vec2 posTransform = (position * 2.0 - 1.0); //转换为相对中心的 -1 ~ 1范围
            posTransform = (u_rotation * vec3(posTransform, 1)).xy; //旋转
            vec2 screenPos = posTransform * vec2(1,-1); //y轴翻转
            screenPos *= instance_tileRenderInfo.x * 0.5;
            screenPos += instance_tileRenderInfo.yz;
            gl_Position.xy = (u_display * vec3(screenPos, 1.0)).xy; 
            gl_Position.zw = vec2(0, 1);
        } 
    `,
    fragment: `
        precision highp float;
            
        #define RENDER_SAMPLING_NEAREST ${RenderSamplingCode["nearest"].toFixed(1)}
        #define RENDER_SAMPLING_LINEAR ${RenderSamplingCode["linear"].toFixed(1)}

        uniform highp sampler2D u_texArr[TEXTURE_COUNT]; //纹理数组
        uniform vec2 u_texSize; //纹理的尺寸

        uniform float u_showDebugBorder;
        uniform float u_sampling;

        varying vec2 v_uv;
        varying vec4 v_texInfo;
        varying float v_texRenderSize;
        varying vec4 v_decodeRange_1;
        varying vec4 v_decodeRange_2;

        ${glsl_pack}

        vec4 samplerRawValue(int index, vec2 uv){
            vec4 data;
            for(int i = 0; i < TEXTURE_COUNT; i++){
                if(index == i){
                    data = texture2D(u_texArr[i], uv);
                    break;
                }
            }
            return data;
        }

        vec2 samplerDecodeValue(vec2 uv, int texIndex, vec4 decodeRange){
            vec4 rawData = samplerRawValue(texIndex, uv);
            //(1, 1)代表0
            bool isZeroU = rawData.x == 1.0 && rawData.y == 1.0; 
            bool isZeroV = rawData.z == 1.0 && rawData.w == 1.0; 
            float nu = unpackRGToNormalizeFloat(rawData.xy);
            float nv = unpackRGToNormalizeFloat(rawData.zw);
            float u = mix(decodeRange.x, decodeRange.y, clamp(nu, 0.0, 1.0));
            float v = mix(decodeRange.z, decodeRange.w, clamp(nv, 0.0, 1.0));
            return vec2( 
                isZeroU ? 0.0 : u, 
                isZeroV ? 0.0 : v
            );
        }
        vec2 lookupValue(vec2 uv, int texIndex, vec4 decodeRange){
            vec2 onePixel = 1.0 / u_texSize;
            vec2 uv0 = floor(uv / onePixel) * onePixel + onePixel * 0.5;
        
            if(u_sampling == RENDER_SAMPLING_NEAREST){
                return samplerDecodeValue(uv0, texIndex, decodeRange);
            }else{
                vec2 offset = vec2( 
                    uv.x > uv0.x ? 1.0 : -1.0, 
                    uv.y > uv0.y ? 1.0 : -1.0 
                );
                vec2 uv1 = uv0 + offset * onePixel * vec2(1,0);
                vec2 uv2 = uv0 + offset * onePixel * vec2(0,1);
                vec2 uv3 = uv0 + offset * onePixel * vec2(1,1);

                vec2 v0 = samplerDecodeValue(uv0, texIndex, decodeRange);
                vec2 v1 = samplerDecodeValue(uv1, texIndex, decodeRange);
                vec2 v2 = samplerDecodeValue(uv2, texIndex, decodeRange);
                vec2 v3 = samplerDecodeValue(uv3, texIndex, decodeRange);
                
                vec2 v01 = mix(v0, v1, (uv.x - uv0.x) / (uv1.x - uv0.x));
                vec2 v23 = mix(v2, v3, (uv.x - uv2.x) / (uv3.x - uv2.x));
                return mix(v01, v23, (uv.y - uv0.y) / (uv2.y - uv0.y));
            }
        }

        void main(){
            int index1 = int(v_texInfo.x);
            int index2 = int(v_texInfo.y);

            bool enable1 = v_texInfo.z > 0.5;
            bool enable2 = v_texInfo.w > 0.5;

            vec2 v1 = enable1 ? lookupValue(v_uv, index1, v_decodeRange_1) : vec2(0.0);
            vec2 v2 = enable2 ? lookupValue(v_uv, index2, v_decodeRange_2) : vec2(0.0);

            gl_FragColor = vec4(v1, v2); //u1,v1, u2,v2
        }
    `,
};
