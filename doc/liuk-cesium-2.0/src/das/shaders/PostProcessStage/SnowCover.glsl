#extension GL_OES_standard_derivatives : enable
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform float alpha;
varying vec2 v_textureCoordinates;
vec4 toEye(in vec2 uv, in float depth){
    vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));
    vec4 posInCamera =czm_inverseProjection * vec4(xy, depth, 1.0);
    posInCamera =posInCamera / posInCamera.w;
    return posInCamera;
}
float getDepth(in vec4 depth){
    float z_window = czm_unpackDepth(depth);
    z_window = czm_reverseLogDepth(z_window);
    float n_range = czm_depthRange.near;
    float f_range = czm_depthRange.far;
    return (2.0 * z_window - n_range - f_range) / (f_range - n_range);
}
void main(){
    vec4 color = texture2D(colorTexture, v_textureCoordinates);
    vec4 currD = texture2D(depthTexture, v_textureCoordinates);
    if(currD.r>=1.0){
        gl_FragColor = color;
        return;
    }
    float depth = getDepth(currD);
    vec4 positionEC = toEye(v_textureCoordinates, depth);
    vec3 dx = dFdx(positionEC.xyz);
    vec3 dy = dFdy(positionEC.xyz);
    vec3 nor = normalize(cross(dx,dy));

    vec4 positionWC = normalize(czm_inverseView * positionEC);
    vec3 normalWC = normalize(czm_inverseViewRotation * nor);
    float dotNumWC = dot(positionWC.xyz,normalWC);
    if(dotNumWC<=0.3){
        gl_FragColor = mix(color,vec4(1.0),alpha*0.3);
        return;
    }
    gl_FragColor = mix(color,vec4(1.0),dotNumWC*alpha);
}
