czm_material czm_getMaterial(czm_materialInput materialInput)
{
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = repeat * materialInput.st;
    vec4 colorImage = texture2D(image, vec2(fract((axisY?st.t:st.s) - speed*czm_frameNumber/1000.0), st.t));
    if(color.a == 0.0)
    {
        material.alpha = colorImage.a;
        material.diffuse = colorImage.rgb;
    }
    else
    {
        material.alpha = colorImage.a * color.a;
        material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);
    }

    if(hasImage2)
    {
        vec4 colorBG = texture2D(image2,materialInput.st);
        if(colorBG.a>0.5){
            material.diffuse = color2.rgb;
        }
    }
    return material;
}
