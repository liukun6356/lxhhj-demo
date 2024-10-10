uniform float czzj;
uniform float dis;
uniform float spzj;
uniform vec3 visibleColor;
uniform vec3 disVisibleColor;
uniform float mixNum;
uniform sampler2D colorTexture;
uniform sampler2D dasShadow;
uniform sampler2D depthTexture;
uniform mat4 _shadowMap_matrix;
uniform vec4 shadowMap_lightPositionEC;
uniform vec3 shadowMap_lightPositionWC;
uniform vec4 shadowMap_lightDirectionEC;
uniform vec3 shadowMap_lightUp;
uniform vec3 shadowMap_lightDir;
uniform vec3 shadowMap_lightRight;
uniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness;
uniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth;
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
float _czm_sampleShadowMap(sampler2D shadowMap, vec2 uv){
    return texture2D(shadowMap, uv).r;
}
float _czm_shadowDepthCompare(sampler2D shadowMap, vec2 uv, float depth){
    return step(depth, _czm_sampleShadowMap(shadowMap, uv));
}
float _czm_shadowVisibility(sampler2D shadowMap, czm_shadowParameters shadowParameters){
    float depthBias = shadowParameters.depthBias;
    float depth = shadowParameters.depth;
    float nDotL = shadowParameters.nDotL;
    float normalShadingSmooth = shadowParameters.normalShadingSmooth;
    float darkness = shadowParameters.darkness;
    vec2 uv = shadowParameters.texCoords;
    depth -= depthBias;
    vec2 texelStepSize = shadowParameters.texelStepSize;
    float radius = 1.0;
    float dx0 = -texelStepSize.x * radius;
    float dy0 = -texelStepSize.y * radius;
    float dx1 = texelStepSize.x * radius;
    float dy1 = texelStepSize.y * radius;
    float visibility =
    (
    _czm_shadowDepthCompare(shadowMap, uv, depth)
    +_czm_shadowDepthCompare(shadowMap, uv + vec2(dx0, dy0), depth) +
    _czm_shadowDepthCompare(shadowMap, uv + vec2(0.0, dy0), depth) +
    _czm_shadowDepthCompare(shadowMap, uv + vec2(dx1, dy0), depth) +
    _czm_shadowDepthCompare(shadowMap, uv + vec2(dx0, 0.0), depth) +
    _czm_shadowDepthCompare(shadowMap, uv + vec2(dx1, 0.0), depth) +
    _czm_shadowDepthCompare(shadowMap, uv + vec2(dx0, dy1), depth) +
    _czm_shadowDepthCompare(shadowMap, uv + vec2(0.0, dy1), depth) +
    _czm_shadowDepthCompare(shadowMap, uv + vec2(dx1, dy1), depth)
    ) * (1.0 / 9.0)
    ;
    return visibility;
}
vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point){
    vec3 v01 = point -planeOrigin;
    float d = dot(planeNormal, v01) ;
    return (point - planeNormal * d);
}
float ptm(vec3 pt){
    return sqrt(pt.x*pt.x + pt.y*pt.y + pt.z*pt.z);
}
void main()
{
    const float PI = 3.141592653589793;
    vec4 color = texture2D(colorTexture, v_textureCoordinates);
    vec4 currD = texture2D(depthTexture, v_textureCoordinates);

    // vec4 stcc = texture2D(dasShadow, v_textureCoordinates);
    // gl_FragColor = currD;
    // return;
    if(currD.r>=1.0){
        gl_FragColor = color;
        return;
    }

    float depth = getDepth(currD);
    // gl_FragColor = vec4(depth,0.0,0.0,1.0);
    // return;
    // float depth = czm_unpackDepth(texture2D(depthTexture, v_textureCoordinates));
    vec4 positionEC = toEye(v_textureCoordinates, depth);
    vec3 normalEC = vec3(1.0);
    czm_shadowParameters shadowParameters;
    shadowParameters.texelStepSize = shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.xy;
    shadowParameters.depthBias = shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.z;
    shadowParameters.normalShadingSmooth = shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.w;
    shadowParameters.darkness = shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w;
    shadowParameters.depthBias *= max(depth * 0.01, 1.0);
    vec3 directionEC = normalize(positionEC.xyz - shadowMap_lightPositionEC.xyz);
    float nDotL = clamp(dot(normalEC, -directionEC), 0.0, 1.0);
    vec4 shadowPosition = _shadowMap_matrix * positionEC;
    shadowPosition /= shadowPosition.w;
    if (any(lessThan(shadowPosition.xyz, vec3(0.0))) || any(greaterThan(shadowPosition.xyz, vec3(1.0))))
    {
        gl_FragColor = color;
        return;
    }

    //坐标与视点位置距离，大于最大距离则舍弃阴影效果
    vec4 lw = vec4(shadowMap_lightPositionWC,1.0);
    vec4 vw = czm_inverseView* vec4(positionEC.xyz, 1.0);
    if(distance(lw.xyz,vw.xyz)>dis){
        gl_FragColor = color;
        return;
    }


    //水平夹角限制
    vec3 ptOnSP = pointProjectOnPlane(shadowMap_lightUp,lw.xyz,vw.xyz);
    directionEC = ptOnSP - lw.xyz;
    float directionECMO = ptm(directionEC.xyz);
    float shadowMap_lightDirMO = ptm(shadowMap_lightDir.xyz);
    float cosJJ = dot(directionEC,shadowMap_lightDir)/(directionECMO*shadowMap_lightDirMO);
    float degJJ = acos(cosJJ)*(180.0 / PI);
    degJJ = abs(degJJ);
    if(degJJ>spzj/2.0){
        gl_FragColor = color;
        return;
    }

    //垂直夹角限制
    vec3 ptOnCZ = pointProjectOnPlane(shadowMap_lightRight,lw.xyz,vw.xyz);
    vec3 dirOnCZ = ptOnCZ - lw.xyz;
    float dirOnCZMO = ptm(dirOnCZ);
    float cosJJCZ = dot(dirOnCZ,shadowMap_lightDir)/(dirOnCZMO*shadowMap_lightDirMO);
    float degJJCZ = acos(cosJJCZ)*(180.0 / PI);
    degJJCZ = abs(degJJCZ);
    if(degJJCZ>czzj/2.0){
        gl_FragColor = color;
        return;
    }

    shadowParameters.texCoords = shadowPosition.xy;
    shadowParameters.depth = shadowPosition.z;
    shadowParameters.nDotL = nDotL;
    float visibility = _czm_shadowVisibility(dasShadow, shadowParameters);
    if(visibility==1.0){
        gl_FragColor = mix(color,vec4(visibleColor,1.0),mixNum);
    }else{
        // if(abs(shadowPosition.z-0.0)<0.01){
        //     return;
        // }
        gl_FragColor = mix(color,vec4(disVisibleColor,1.0),mixNum);
    }
}
