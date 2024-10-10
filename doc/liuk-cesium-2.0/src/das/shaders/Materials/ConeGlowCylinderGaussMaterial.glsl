uniform vec4 u_color;
czm_material czm_getMaterial(czm_materialInput materialInput){
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st;
    float powerRatio = 1./(fract(czm_frameNumber / 30.0) +  1.) ;
    float alpha = pow(1. - st.t,powerRatio);
    vec4 color = vec4(u_color.rgb, alpha*u_color.a);
    material.diffuse = color.rgb;
    material.alpha = color.a;
    return material;
}
