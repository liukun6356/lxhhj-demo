czm_material czm_getMaterial(czm_materialInput materialInput)
{
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 mst = fract(materialInput.st + vec2(.0,.0));
    mst = vec2(mst.x,mst.y);
    vec2 st = fract(repeat * mst);
    vec4 colorImage = texture2D(image, st);
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
    return material;
}
