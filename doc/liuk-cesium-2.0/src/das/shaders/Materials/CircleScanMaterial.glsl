czm_material czm_getMaterial(czm_materialInput materialInput)
{
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st;
    vec4 imgC = texture2D(scanImg,st);
    if(imgC.a>.0){
        material.diffuse = color.rgb;
    }
    material.alpha = imgC.a;
    return material;
}
