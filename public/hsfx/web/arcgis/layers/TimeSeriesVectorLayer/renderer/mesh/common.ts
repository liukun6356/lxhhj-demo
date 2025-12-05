import { glsl_color_mapping_classbreaks, glsl_color_mapping_def, glsl_color_mapping_func, glsl_color_mapping_ramp, glsl_color_mapping_struct } from "web/arcgis/supports/webgl/glsl/color-mapping";
import { glsl_utils_rotate } from "web/arcgis/supports/webgl/glsl/utils";
import { glsl_vector_field_struct } from "web/arcgis/supports/webgl/glsl/vector-field";
import { MeshMappingMode } from "../../interface";

export const TransformStructSize = 5 * 4 * Float32Array.BYTES_PER_ELEMENT;

export const MeshTexs = {
    encodeXY: 'u_tex_vertex_encodeXY',
    z: 'u_tex_vertex_z',
    arrow: 'u_tex_arrow',
    vfData: 'u_tex_vfEncodeData',
    //
    colorMapping: 'u_tex_colorMapping',
    dataBefore: 'u_tex_dataBefore',
    dataAfter: 'u_tex_dataAfter',
} as const;

export const MeshTexBinding = {
    encodeXY: 0,
    z: 1,
    arrow: 2,
    vfData: 3,
    //
    colorMapping: 4,
    dataBefore: 5,
    dataAfter: 6,
} as const;

const glsl_uniforms = `
${glsl_color_mapping_struct}
${glsl_vector_field_struct}

//5vec4
struct Transform {
    mat3 rotate; 
    vec4 encodeScreenCenter; 
    vec2 screenSize;
    float resolution;
};

layout(std140) uniform MeshUBO{
    Transform u_transform; 
    ColorMapping u_cm_z;
    ColorMapping u_cm_mesh;
    ColorMapping u_cm_vf;
    VectorField u_vf;
};

uniform sampler2D ${MeshTexs.encodeXY};
uniform sampler2D ${MeshTexs.z};
uniform sampler2D ${MeshTexs.arrow};
uniform highp usampler2D ${MeshTexs.vfData};

uniform sampler2D ${MeshTexs.colorMapping}; 
uniform sampler2D ${MeshTexs.dataBefore};
uniform sampler2D ${MeshTexs.dataAfter};
`;

export const glsl_common = `
#define MODE_PER_VERTEX ${MeshMappingMode['per-vertex'].toFixed(1)}
#define MODE_PER_MESH ${MeshMappingMode['per-mesh'].toFixed(1)}
${glsl_color_mapping_def}
${glsl_uniforms}
${glsl_color_mapping_ramp}
${glsl_color_mapping_classbreaks}
${glsl_color_mapping_func}
${glsl_utils_rotate}
ivec2 _getTexelUV(sampler2D map, int pixelIndex){
    ivec2 texSize = textureSize(map, 0);
    int row = pixelIndex / texSize.x;
    int col = pixelIndex - texSize.x * row;
    return ivec2(col, row);
}
vec4 getEncodePosition(sampler2D map, int vertexIndex){
    return texelFetch(map, _getTexelUV(map, vertexIndex), 0);
}
float getZ(sampler2D map, int vertexIndex){
    return texelFetch(map, _getTexelUV(map, vertexIndex), 0).r;
}
vec2 worldToScreen(vec4 encodePosition){
    vec2 rtcPosWorld = (encodePosition.xy - u_transform.encodeScreenCenter.xy) 
            + (encodePosition.zw - u_transform.encodeScreenCenter.zw);
    vec2 rtcScreenPos = rtcPosWorld / u_transform.resolution * vec2(1, -1);
    rtcScreenPos = rotate(rtcScreenPos, u_transform.rotate);
    return rtcScreenPos + u_transform.screenSize * 0.5;
}
vec2 screenToNdc(vec2 screenPos){
    return (screenPos.xy / u_transform.screenSize) * vec2(2, -2) + vec2(-1, 1);
}
vec4 getGLPosition(sampler2D texPositionMap, int vertexIndex){
    vec4 encodePosition = getEncodePosition(texPositionMap, vertexIndex);
    vec2 screenPos = worldToScreen(encodePosition);
    return vec4(screenToNdc(screenPos), 0, 1);
}
float getTimeData(sampler2D dataMap, int dataIndex){
    int pixelIndex = dataIndex / 4;  
    int component = dataIndex - pixelIndex * 4;
    vec4 pixelData = texelFetch(dataMap, _getTexelUV(dataMap, pixelIndex), 0);  
    return pixelData[component];
}
vec2 getVectorFieldTimeData(sampler2D dataMap, int dataIndex){
    return texelFetch(dataMap, _getTexelUV(dataMap, dataIndex), 0).rg;
}
`;

type K = keyof typeof MeshTexs
const keys = Object.keys(MeshTexs) as K[];
export function getTexUniforms(
    gl: WebGL2RenderingContext,
    program: WebGLProgram
) {
    return keys.reduce((map, name) => {
        const uname = MeshTexs[name];
        map[uname] = gl.getUniformLocation(program, uname);
        return map;
    }, {} as Record<typeof MeshTexs[K], WebGLUniformLocation>)
}