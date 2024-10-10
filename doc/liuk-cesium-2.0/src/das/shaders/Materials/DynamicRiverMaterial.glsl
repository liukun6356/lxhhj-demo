czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st;
    if(move){
        float r = sqrt((st.x-0.8)*(st.x-0.8) + (st.y-0.8)*(st.y-0.8));
        float r2 = sqrt((st.x-0.2)*(st.x-0.2) + (st.y-0.2)*(st.y-0.2));
        float z = cos(moveVar.x*r + czm_frameNumber/100.0*moveVar.y)/moveVar.z;
        float z2 = cos(moveVar.x*r2 + czm_frameNumber/100.0*moveVar.y)/moveVar.z;
        st += sqrt(z*z+z2*z2);
        st.s += reflux * czm_frameNumber/1000.0 * speed;
        st.s = mod(st.s,1.0);
    }
    if(flipY){
        st = vec2(st.t,st.s);
    }
    vec4 colorImage = texture2D(image, st);
    material.alpha = alpha;
    material.diffuse = colorImage.rgb;
    return material;
}
