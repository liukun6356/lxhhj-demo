czm_material czm_getMaterial(czm_materialInput materialInput){
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st;
    vec2 center = st - vec2(0.5,0.5);
    float time = -czm_frameNumber * 3.1415926 / 180.;//扫描速度1度
    float sin_t = sin(time);
    float cos_t = cos(time);
    vec2 center_rotate = vec2(center.s*cos_t-center.t*sin_t+0.5,center.s*sin_t+center.t*cos_t+0.5);
    vec4 color = texture2D(image,center_rotate);
    vec3 tColor = color.rgb * u_color.rgb;
    tColor *= u_color.a;
    material.diffuse = tColor;
    float length = 2. - length(center)/0.5;
    material.alpha = color.a * pow(length, 0.5);//color.r = 0 或1
    return material;
}
