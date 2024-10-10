attribute vec3 position3DHigh;
attribute vec3 position3DLow;
attribute vec3 normal;
attribute vec2 st;
attribute float batchId;
varying vec2 v_st;
varying vec3 v_normalEC;
varying vec3 v_positionEC;
void main()
{
    vec4 p = czm_translateRelativeToEye(position3DHigh,position3DLow);
    v_positionEC = (czm_modelViewRelativeToEye * p).xyz;
    v_normalEC = czm_normal * normal;
    v_st=st;
    gl_Position = czm_modelViewProjectionRelativeToEye * p;
}
