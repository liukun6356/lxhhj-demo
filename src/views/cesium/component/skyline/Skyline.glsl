#extension GL_OES_standard_derivatives : enable
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform float lineWidth;
uniform float height;
uniform bvec3 strokeType;
uniform vec3 tjxColor;
uniform vec3 bjColor;
uniform vec3 cameraPos;
uniform float mbDis;
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
bool isTJX(vec2 uv,float lw){
    vec2 pixelSize = lw / czm_viewport.zw;
    float dx0 = -pixelSize.x;
    float dy0 = -pixelSize.y;
    float dx1 = pixelSize.x;
    float dy1 = pixelSize.y;

    vec2 currUV = uv + vec2(dx0, dy0);
    vec4 currDepth = texture2D(depthTexture, currUV);
    float depth = getDepth(currDepth);
    if(depth>=1.0)return true;

    currUV = uv + vec2(0.0, dy0);
    currDepth = texture2D(depthTexture, currUV);
    depth = getDepth(currDepth);
    if(depth>=1.0)return true;

    currUV = uv + vec2(dx1, dy0);
    currDepth = texture2D(depthTexture, currUV);
    depth = getDepth(currDepth);
    if(depth>=1.0)return true;

    currUV = uv + vec2(dx0, 0.0);
    currDepth = texture2D(depthTexture, currUV);
    depth = getDepth(currDepth);
    if(depth>=1.0)return true;

    currUV = uv + vec2(dx1, 0.0);
    currDepth = texture2D(depthTexture, currUV);
    depth = getDepth(currDepth);
    if(depth>=1.0)return true;

    currUV = uv + vec2(dx0, dy1);
    currDepth = texture2D(depthTexture, currUV);
    depth = getDepth(currDepth);
    if(depth>=1.0)return true;

    currUV = uv + vec2(0.0, dy1);
    currDepth = texture2D(depthTexture, currUV);
    depth = getDepth(currDepth);
    if(depth>=1.0)return true;

    currUV = uv + vec2(dx1, dy1);
    currDepth = texture2D(depthTexture, currUV);
    depth = getDepth(currDepth);
    if(depth>=1.0)return true;

    return false;
}
void main(){


    vec4 color = texture2D(colorTexture, v_textureCoordinates);
    if(height>14102.0){
        gl_FragColor = color;
        return;
    }
    vec4 currD = texture2D(depthTexture, v_textureCoordinates);
    if(currD.r>=1.0){
        gl_FragColor = color;
        return;
    }
    float depth = getDepth(currD);
    vec4 positionEC = toEye(v_textureCoordinates, depth);
    vec3 dx = dFdx(positionEC.xyz);
    vec3 dy = dFdy(positionEC.xyz);
    vec3 normal = normalize(cross(dx,dy));

    if(strokeType.y||strokeType.z){
        vec4 wp = czm_inverseView * positionEC;
        if(distance(wp.xyz,cameraPos)>mbDis){
            gl_FragColor = color;
        }else{
            float dotNum = abs(dot(normal,normalize(positionEC.xyz)));
            if(dotNum<0.05){
                gl_FragColor = vec4(bjColor,1.0);
                return;
            }
        }
    }
    if(strokeType.x||strokeType.z){
        bool tjx = isTJX(v_textureCoordinates,lineWidth);
        if(tjx){
            gl_FragColor = vec4(tjxColor,1.0);
            return;
        }
    }
    gl_FragColor = color;
}