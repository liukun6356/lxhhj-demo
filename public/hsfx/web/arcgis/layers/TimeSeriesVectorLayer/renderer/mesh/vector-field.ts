import { createProgram } from "twgl.js";
import { fromGLCache } from "web/arcgis/supports/webgl/cache";
import { getTexUniforms, glsl_common, MeshTexs } from "./common";
import { glsl_vector_field_pack, glsl_vector_field_utils } from "web/arcgis/supports/webgl/glsl/vector-field";

export const TsAttrBindingVectorField = {
    position: 0,
} as const;

const vs = '#version 300 es\n' + `
layout(location=${TsAttrBindingVectorField.position}) in vec2 position;   

${glsl_common}
${glsl_vector_field_utils}
${glsl_vector_field_pack}
float mappingSize(float value){ 
    float flowMin = u_vf.flowRange.x;
    float flowMax = u_vf.flowRange.y;
    float sizeMin = u_vf.sizeRange.x;
    float sizeMax = u_vf.sizeRange.y;
    if(sizeMin == sizeMax) return sizeMin;
    float per = flowMin == flowMax 
        ? 1.0 
        : (value - flowMin) / (flowMax - flowMin);
    return mix(sizeMin, sizeMax, per);
}

vec2 applyArrowRotate(vec2 vf, vec2 offset){
    float len = length(vf);
    float c = len == 0.0 ? 1.0 : vf.x / len;
    float s = len == 0.0 ? 0.0 : vf.y / len;
    return mat2(
        c,  s, // first column
        -s, c  // second column
    ) * offset;
}

uniform float u_opacity;
uniform float u_percent;
uniform vec4 u_range1;
uniform vec4 u_range2;

out vec2 v_uv;
out vec4 v_color;

void main(){
    v_uv = position;

    vec2 screenPosNoRotate = getSamplerScreenPosNoRotate(gl_InstanceID, u_vf);
    vec2 samplerScreenPos = rotateAround(screenPosNoRotate, u_transform.screenSize / 2.0, u_transform.rotate);

    //采样点纹理坐标
    vec2 samplerST = samplerScreenPos / u_transform.screenSize * vec2(1, -1) + vec2(0, 1);

    uvec2 packData = texture(${MeshTexs.vfData}, samplerST).rg;

    bvec2 mask1;
    bvec2 mask2;

    vec2 vf1 = vf_unpackUintToUV(packData.r, u_range1.xy, u_range1.zw, mask1);
    vec2 vf2 = vf_unpackUintToUV(packData.g, u_range2.xy, u_range2.zw, mask2);
    vec2 vf = mix(vf1, vf2, u_percent);
    float len = length(vf);
    bool show = mask1.x && mask1.y && mask2.x && mask2.y && len >= u_vf.minShowFlow;

    v_color = !u_vf.enableColorMapping ? u_vf.defaultColor
                        : mappingColor(len, u_cm_vf, ${MeshTexs.colorMapping});
    
    float size = u_vf.enableSizeMapping ? mappingSize(len) * 0.5
                                        : u_vf.defaultSize * 0.5;

    vec2 offset = (position - vec2(0.5)) * vec2(2, -2);

    offset.y = offset.y / u_vf.arrowAspect;
    offset = rotate(offset, u_transform.rotate);         //屏幕旋转
    offset = applyArrowRotate(vf * vec2(1, -1), offset); //应用箭头旋转

    vec2 screenPos = samplerScreenPos + offset * size;

    gl_Position.xy = screenToNdc(screenPos);
    gl_Position.zw = vec2(show ? 0 : 2, 1);

    v_color.a *= u_opacity;
}
`;

const fs = '#version 300 es\n' + `
precision highp float;
uniform sampler2D ${MeshTexs.arrow};

in vec2 v_uv;
in vec4 v_color;

out vec4 v_out;

void main(){
    v_out.rgb = v_color.rgb;
    v_out.a = texture(${MeshTexs.arrow}, v_uv).a * v_color.a;
}
`;

const key_1 = Symbol('key_tsVector_vfProgram');
export function getTsVectorVectorFieldProgram(gl: WebGL2RenderingContext) {
    return fromGLCache(gl, key_1, _create);
    function _create(gl: WebGL2RenderingContext) {
        const program = createProgram(gl, [vs, fs]);
        gl.uniformBlockBinding(
            program,
            gl.getUniformBlockIndex(program, 'MeshUBO'),
            0
        );
        return {
            program,
            uniforms: {
                ...getTexUniforms(gl, program),
                u_percent: gl.getUniformLocation(program, 'u_percent'),
                u_opacity: gl.getUniformLocation(program, 'u_opacity'),
                u_range1: gl.getUniformLocation(program, 'u_range1'),
                u_range2: gl.getUniformLocation(program, 'u_range2'),
            }
        }
    }
}
