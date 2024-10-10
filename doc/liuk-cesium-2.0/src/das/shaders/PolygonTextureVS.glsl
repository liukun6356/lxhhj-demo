uniform mat4 myPorjection;
attribute vec3 position;
varying vec2 depth;
void main()
{
    vec4 pos = vec4(position.xyz,1.0);
    depth = pos.zw;
    pos.z = 0.0;
    gl_Position = czm_projection*pos;
}
