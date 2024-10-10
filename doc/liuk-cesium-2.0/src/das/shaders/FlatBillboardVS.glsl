attribute vec3 position3DHigh;
attribute vec3 position3DLow;
attribute vec3 color;
attribute vec2 st;
attribute float batchId;
uniform mat4 mm;
uniform mat4 vv;
uniform vec2 resolution;
uniform float billWidth;
varying vec2 v_st;
varying vec3 v_worldPos;
vec4 transform(mat4 m,mat4 v,vec3 coord) {
    return m * v * vec4(coord, 1.0);
}
vec2 project(vec4 device) {
    vec3 device_normal = device.xyz / device.w;
    vec2 clip_pos = (device_normal * 0.5 + 0.5).xy;
    return clip_pos * resolution;
}
vec4 unproject(vec2 screen, float z, float w) {
    vec2 clip_pos = screen / resolution;
    vec2 device_normal = clip_pos * 2.0 - 1.0;
    return vec4(device_normal * w, z, w);
}
void main() {
    v_st = st;
    vec3 currP = position3DHigh.xyz + position3DLow.xyz;
    v_worldPos = currP;
    vec4 eyeCurrP = transform(mm,vv,currP);
    vec2 winCurrP = project(eyeCurrP);
    vec3 dirEye = czm_viewRotation * color;
    dirEye = normalize(dirEye);
    vec2 newWinCurrP = winCurrP + dirEye.xy * billWidth;
    gl_Position = unproject(newWinCurrP, eyeCurrP.z, eyeCurrP.w);
    gl_PointSize = billWidth;
}
