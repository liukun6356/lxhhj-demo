czm_material czm_getMaterial(czm_materialInput materialInput){
    float isRed=step(speed,materialInput.st.x);
    vec3 red;
    if(isRed==0.0){
        red = vec3(1.0,0.0,0.1);
    }
    else{
        red = vec3(1.0,1.0,1.0);
    }
    czm_material material = czm_getDefaultMaterial(materialInput);
    material.diffuse = czm_gammaCorrect(texture2D(image, fract(materialInput.st)).rgb *red);

    material.alpha = texture2D(image, fract(materialInput.st)).a;
    return material;
}
