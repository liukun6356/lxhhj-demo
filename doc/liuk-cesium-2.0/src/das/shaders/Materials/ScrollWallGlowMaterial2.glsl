czm_material czm_getMaterial( czm_materialInput cmi )
{
    czm_material material = czm_getDefaultMaterial(cmi);
    vec2 st = cmi.st;
    float t = fract(czm_frameNumber/speed) * direction;
    vec2 st1 = vec2(fract(st.s - t),st.t);
    vec4 color = vec4(0.,0.,0.,0.);
    float alpha = 1.-st.t;
    float value = fract(st1.s/0.25);
    alpha *= sin(value * 3.1415926);
    color = vec4(u_color.rgb * u_color.a, alpha * 1.2);
    material.diffuse = color.rgb;
    material.alpha = color.a;
    return material;
}
