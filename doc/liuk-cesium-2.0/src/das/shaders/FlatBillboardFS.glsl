#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_distanceDisplayCondition;
uniform vec3 u_eyePos;
varying vec3 v_worldPos;
uniform sampler2D billImg;
varying vec2 v_st;
void main() {
    float dis = distance(u_eyePos, v_worldPos);
    if (dis < u_distanceDisplayCondition.x || dis > u_distanceDisplayCondition.y) {
        discard;
    } else {
        gl_FragColor = texture2D(billImg,v_st);
    }
}
