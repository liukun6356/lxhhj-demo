varying vec3 v_positionEC;
varying vec3 v_normalEC;
varying vec2 v_st;
void main(){
    gl_FragColor = xh_getMaterial(v_st);
}
