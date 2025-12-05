import { createProgram } from "twgl.js";
import { fromGLCache } from "web/arcgis/supports/webgl/cache";
import { getTexUniforms, glsl_common, MeshTexs } from "./common";
import { glsl_vector_field_pack } from "web/arcgis/supports/webgl/glsl/vector-field";

export const TsAttrBindingMesh = {
    index_mesh: 0,
    instance_vertexIndex: 1,
} as const;
export const RenderMode = {
    z: 1,
    wireframe: 2,
    mesh: 3,
} as const;
const vs = '#version 300 es\n' + `
layout(location=${TsAttrBindingMesh.index_mesh}) in int index_mesh;
layout(location=${TsAttrBindingMesh.instance_vertexIndex}) in uvec4 instance_vertexIndex;

${glsl_common}

#define RENDER_Z ${RenderMode['z'].toFixed(1)}
#define RENDER_WIREFRAME ${RenderMode['wireframe'].toFixed(1)}
#define RENDER_MESH ${RenderMode['mesh'].toFixed(1)}

uniform float u_percent;
uniform float u_mappingMode;
uniform float u_renderMode;
uniform float u_opacity;
uniform vec4 u_meshLineColor;

out vec4 v_color;
void main(){
   
    int vertexIndex = int(instance_vertexIndex[index_mesh]);
    gl_Position = getGLPosition(${MeshTexs.encodeXY}, vertexIndex);

    if(u_renderMode == RENDER_WIREFRAME){
        v_color = u_meshLineColor;
    }else{
        float value;
        ColorMapping cm;
        if(u_renderMode == RENDER_Z){
            value = getZ(${MeshTexs.z}, vertexIndex);
            cm = u_cm_z;
        }else{
            int dataIndex = u_mappingMode == MODE_PER_VERTEX 
                ? vertexIndex
                : gl_InstanceID;

            float value1 = getTimeData(${MeshTexs.dataBefore}, dataIndex);
            float value2 = getTimeData(${MeshTexs.dataAfter}, dataIndex);
            value = mix(value1, value2, u_percent);
            cm = u_cm_mesh;
        }
        v_color = mappingColor(value, cm, ${MeshTexs.colorMapping});
    }
    v_color.a *= u_opacity;
}
`;

const fs = '#version 300 es\n' + `
precision highp float;
in vec4 v_color;
out vec4 color;
void main(){
    color = v_color;
    color.rgb *= v_color.a;
}
`;

const key_1 = Symbol('key_tsVector_meshProgram');
export function getTsVectorMeshProgram(gl: WebGL2RenderingContext) {
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
                u_mappingMode: gl.getUniformLocation(program, 'u_mappingMode'),
                u_renderMode: gl.getUniformLocation(program, 'u_renderMode'),
                u_meshLineColor: gl.getUniformLocation(program, 'u_meshLineColor'),
            }
        }
    }
}


const draw_vf_vs = '#version 300 es\n' + `
layout(location=${TsAttrBindingMesh.index_mesh}) in int index_mesh; 
layout(location=${TsAttrBindingMesh.instance_vertexIndex}) in uvec4 instance_vertexIndex;

${glsl_common}

uniform float u_mappingMode;

out vec2 v_vf1;
out vec2 v_vf2;

void main(){
   
    int vertexIndex = int(instance_vertexIndex[index_mesh]);
    gl_Position = getGLPosition(${MeshTexs.encodeXY}, vertexIndex);

    int dataIndex = u_mappingMode == MODE_PER_VERTEX 
            ? vertexIndex
            : gl_InstanceID;

    v_vf1 = getVectorFieldTimeData(u_tex_dataBefore, dataIndex);
    v_vf2 = getVectorFieldTimeData(u_tex_dataAfter, dataIndex);
}
`;

const draw_vf_fs = '#version 300 es\n' + `
precision highp float;

in vec2 v_vf1;
in vec2 v_vf2;

uniform vec4 u_range1;
uniform vec4 u_range2;
${glsl_vector_field_pack}

out uvec2 v_out;
void main(){
    v_out.r = vf_packUVToUint(v_vf1, bvec2(true), u_range1.xy, u_range1.zw);
    v_out.g = vf_packUVToUint(v_vf2, bvec2(true), u_range2.xy, u_range2.zw);
}
`;

const key_2 = Symbol('key_tsVector_drawVFData_mesh');
export function getTsVectorDrawVFDataMeshProgram(gl: WebGL2RenderingContext) {
    return fromGLCache(gl, key_2, _create);
    function _create(gl: WebGL2RenderingContext) {
        const program = createProgram(gl, [draw_vf_vs, draw_vf_fs]);
        gl.uniformBlockBinding(
            program,
            gl.getUniformBlockIndex(program, 'MeshUBO'),
            0
        );
        return {
            program,
            uniforms: {
                ...getTexUniforms(gl, program),
                u_mappingMode: gl.getUniformLocation(program, 'u_mappingMode'),
                u_range1: gl.getUniformLocation(program, 'u_range1'),
                u_range2: gl.getUniformLocation(program, 'u_range2'),
            }
        }
    }
}
