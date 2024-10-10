czm_material czm_getMaterial( czm_materialInput cmi )
{
    czm_material material = czm_getDefaultMaterial(cmi);
    vec2 st = cmi.st;
    float t = fract(czm_frameNumber/speed) * direction;
    vec2 st1 = vec2(st.s,fract(st.t - t));
    vec4 color = vec4(0.,0.,0.,0.);
    float tt = 0.5 - abs(0.5 - st1.t);
    float ss = st1.s ;
    float alpha = tt * 2.;
    color = vec4(u_color.rgb * u_color.a, alpha * 1.2);
    material.diffuse = color.rgb;
    material.alpha = color.a;
    return material;
}
