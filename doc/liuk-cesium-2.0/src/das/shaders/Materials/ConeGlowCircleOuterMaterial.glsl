uniform vec4 u_color;
czm_material czm_getMaterial(czm_materialInput materialInput){
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st;
    float time = fract(czm_frameNumber / 90.) ;
    vec2 new_st = fract(st-vec2(time,time));
    vec4 color = texture2D(image,new_st);

    vec3 diffuse = color.rgb;
    float alpha = color.a;
    diffuse *= u_color.rgb;
    alpha *= u_color.a;
    alpha *= u_color.a;
    material.diffuse = diffuse;
    material.alpha = alpha * pow(1. - st.t,u_color.a);
    return material;
}
