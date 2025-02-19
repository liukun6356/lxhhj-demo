import { glsl_color_mapping_classbreak, glsl_color_mapping_gradient } from "./color-mapping";
import { ColorMappingTypeCode } from "./common";
import { freeMemory } from "./three-misc";
import {
    Color,
    CustomBlending,
    Float32BufferAttribute,
    InstancedBufferAttribute,
    InstancedBufferGeometry,
    Mesh,
    OneMinusSrcAlphaFactor,
    RawShaderMaterial,
    Sphere,
    SrcAlphaFactor,
    Texture,
    Vector2,
    Vector4,
} from "three";


//基于屏幕采样的箭头渲染
export function createScreenSamplingBasedArrowRenderCtx() {
    const uniforms = {
        //颜色映射
        u_colorMapping: {
            value: {
                enable: false, //是否启用颜色映射
                useDefaultColor: false, //是否使用默认颜色，否则使用箭头图片自身颜色
                defaultColor: new Color("white"), // 默认颜色
                type: null as ColorMappingTypeCode, //映射类型、
                texture: null as Texture, //色带映射纹理
                valueRange: new Vector2(), //色带的映射值域[min,max], (仅gradient 可用)
                trunc: new Vector2(),
            },
        },
        //大小映射
        u_sizeMapping: {
            value: {
                arrow: null as Texture, //箭头图片
                aspect: NaN, //箭头图片宽高比
                sizeRange: new Vector2(), //箭头大小范围
                valueRange: new Vector2(), //箭头大小映射的值域范围
            },
        },
        //采样信息
        u_samplerInfo: {
            value: {
                lerpValue: NaN, //插值百分比
                dataTex: null as Texture, //采样数据纹理 ,[u1,v1,u2,v2] rgba float
                screenSize: new Vector2(), //屏幕尺寸
                layout: new Vector2(), //采样点[ 列数, 行数 ]
                topLeftScreenPos: new Vector2(), //左上角的采样点(index=0)屏幕坐标(像素)
                gap: NaN, //采样点屏幕间隔(像素),
                noRatateSamplerOffset: new Vector2(), //采样偏移，无旋转时数据源中心(fullExtent)与屏幕中心点的像素偏移量
                noRotateActiveScreenArea: new Vector4(), //无旋转时有数据的屏幕坐标范围， (fullextent与renderExtent交集)[xmin, xmax, ymin, ymax]
            },
        },
        u_rotateRad: { value: NaN }, //屏幕旋转弧度, 东北上顺指针为正
        //debug
        u_showOutRange: { value: false }, //是否显示超出范围的箭头（ActiveScreenArea）
        u_outRangeColor: { value: new Color("white") }, //超出范围的箭头颜色
    };
    const material = new RawShaderMaterial({
        blending: CustomBlending,
        blendSrc: SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
        depthTest: false,
        depthWrite: false,
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        defines: {
            ["CLASS_BREAK_COUNT"]: "0.0",
        },
    });
    const positionAttr = new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2);
    const shpere = new Sphere();
    const mesh = new Mesh(
        new InstancedBufferGeometry()
            .setAttribute("position", positionAttr)
            .setAttribute("instance_index", new InstancedBufferAttribute(new Float32Array(1), 1)),
        material
    );
    mesh.frustumCulled = false;
    mesh.geometry.boundingSphere = shpere;
    return {
        uniforms,
        updateSamplerIndicesData(samplerIndices: Float32Array) {
            mesh.geometry.dispose();
            mesh.geometry = new InstancedBufferGeometry()
                .setAttribute("position", positionAttr)
                .setAttribute("instance_index", freeMemory(new InstancedBufferAttribute(samplerIndices, 1)));
            mesh.geometry.boundingSphere = shpere;
        },
        mesh,
        setClassbreakCount(breaks: number) {
            if (breaks !== +material.defines["CLASS_BREAK_COUNT"]) {
                material.defines["CLASS_BREAK_COUNT"] = breaks.toFixed(1);
                material.needsUpdate = true;
            }
        },
    };
}

const struct = {
    ColorMapping: `
    struct ColorMapping { 
        bool enable;
        float type;
        sampler2D texture;
        vec2 valueRange;
        bool useDefaultColor;
        vec3 defaultColor;
        bvec2 trunc;
    };`,
    SizeMapping: `
    struct SizeMapping {
        sampler2D arrow;
        float aspect;
        vec2 sizeRange;
        vec2 valueRange;
    };`,
    SamplerInfo: `
    struct SamplerInfo {
        float lerpValue;
        sampler2D dataTex;
        vec2 screenSize;
        vec2 layout;
        vec2 topLeftScreenPos;
        float gap;
        vec2 noRatateSamplerOffset;
        vec4 noRotateActiveScreenArea;
    };`,
} as const;


const vertexShader = `
precision highp float;
const float PI = 3.1415926;
#define MAPPING_GRADIENT ${ColorMappingTypeCode.gradient.toFixed(1)}
#define MAPPING_CLASS_BREAK ${ColorMappingTypeCode["class-break"].toFixed(1)}

${struct.ColorMapping}
${struct.SizeMapping}
${struct.SamplerInfo}

attribute vec2 position;        
attribute float instance_index;

uniform float u_rotateRad;

uniform SizeMapping u_sizeMapping;
uniform ColorMapping u_colorMapping;
uniform SamplerInfo u_samplerInfo;
uniform bool u_showOutRange;


${glsl_color_mapping_gradient}
${glsl_color_mapping_classbreak}

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
float mappingSize(float value){
    if(value == 0.0) return 0.0;
    if(u_sizeMapping.sizeRange.x == u_sizeMapping.sizeRange.y) return u_sizeMapping.sizeRange.x;
    float per = u_sizeMapping.valueRange.x == u_sizeMapping.valueRange.y 
                        ? 1.0 
                        : (value - u_sizeMapping.valueRange.x) / (u_sizeMapping.valueRange.y  - u_sizeMapping.valueRange.x);
    return mix(u_sizeMapping.sizeRange.x, u_sizeMapping.sizeRange.y, per);
}

vec2 lookupValue(vec2 uv){
    vec4 raw = texture2D(u_samplerInfo.dataTex, uv);
    return mix(raw.xy, raw.zw, u_samplerInfo.lerpValue);
}

vec2 indexToScreenPos(float index){ 
    float width = u_samplerInfo.layout.x;
    float col = mod(index, width);
    float row = floor(index / width);
    return vec2(col, row) * u_samplerInfo.gap + u_samplerInfo.topLeftScreenPos;
}

//vf正方向右上, offset 右下, y轴反向 
vec2 applyArrowRotate(vec2 vf, vec2 offset){
    float len = length(vf);
    float c = len == 0.0 ? 1.0 : vf.x / len;
    float s = len == 0.0 ? 0.0 : vf.y / len;
    return mat2(
        c,  s, // first column
        -s, c  // second column
    ) * offset;
}

vec2 rotateAtPoint(vec2 v, vec2 point, float rad){
    vec2 nv = v - point;
    float c = cos(rad);
    float s = sin(rad);
    return mat2(
        c, s,
        -s, c
    ) * (v - point) + point;
}

varying vec2 v_uv;
varying vec3 v_color;
varying float v_isActive;

void main(){
    v_uv = position;

    //获取采样点屏幕坐标
    vec2 samplerScreenPos = indexToScreenPos(instance_index) + u_samplerInfo.noRatateSamplerOffset;
    vec2 noRotateSamplerScreenPos = samplerScreenPos;
    samplerScreenPos = rotateAtPoint(samplerScreenPos, u_samplerInfo.screenSize / 2.0, u_rotateRad); //绕屏幕中心旋转
    //采样点纹理坐标
    vec2 texST = samplerScreenPos / u_samplerInfo.screenSize * vec2(1, -1) + vec2(0, 1);
    //采样获得矢量信息
    vec2 vf = lookupValue(texST);
    float len = length(vf);

    float size = mappingSize(len) * 0.5;

    v_color = u_colorMapping.enable ? mappingColor(len).rgb : vec3(0);

    vec4 activeArea = u_samplerInfo.noRotateActiveScreenArea;
    float boundsOffset = 2.0;
    bool isActive = noRotateSamplerScreenPos.x >= (activeArea.x + boundsOffset)
                && noRotateSamplerScreenPos.x <= (activeArea.y - boundsOffset)
                && noRotateSamplerScreenPos.y >= (activeArea.z + boundsOffset)
                && noRotateSamplerScreenPos.y <= (activeArea.w - boundsOffset);

    v_isActive = isActive ? 1.0 : 0.0;

    //屏幕空间
    vec2 offset = (position - vec2(0.5)) * vec2(2, -2);
    offset.y = offset.y / u_sizeMapping.aspect; //图片宽高比
    offset = applyArrowRotate(vf * vec2(1, -1), offset); //箭头旋转
    offset = rotateAtPoint(offset, vec2(0), u_rotateRad); //屏幕旋转
    vec2 screenPos = samplerScreenPos + offset * size;

    gl_Position.xy = (screenPos / u_samplerInfo.screenSize) * vec2(2, -2) + vec2(-1, 1);
    gl_Position.zw = vec2((u_showOutRange ? true : isActive) ? 0 : 2, 1);              
}`;
const fragmentShader = `
precision highp float;
${struct.ColorMapping}
${struct.SizeMapping}

uniform SizeMapping u_sizeMapping;
uniform ColorMapping u_colorMapping;
uniform bool u_showOutRange;
uniform vec3 u_outRangeColor;

varying vec2 v_uv;
varying vec3 v_color;
varying float v_isActive;

void main(){
    vec4 arrowColor = texture2D(u_sizeMapping.arrow, v_uv);
    if(v_isActive > 0.5){
        if(u_colorMapping.enable){
            gl_FragColor = vec4(v_color, arrowColor.a);
        }else{
            gl_FragColor = u_colorMapping.useDefaultColor ? vec4(u_colorMapping.defaultColor, arrowColor.a) : arrowColor;  
        }  
    }else{
        gl_FragColor = vec4(u_outRangeColor, arrowColor.a);
    }
                                        
}`;
