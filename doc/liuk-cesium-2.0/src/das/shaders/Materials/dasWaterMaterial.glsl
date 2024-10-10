uniform sampler2D image;
uniform sampler2D normalMap;
uniform vec4 color;
uniform float frequency;
uniform float animationSpeed;
uniform float amplitude;
uniform float specularIntensity;
uniform float fadeFactor;

  czm_material czm_getMaterial(czm_materialInput materialInput)
  {
    czm_material material = czm_getDefaultMaterial(materialInput);

    float time = czm_frameNumber * animationSpeed;

    // 衰减是离碎片的距离和波的频率的函数
    float fade = max(1.0, (length(materialInput.positionToEyeEC) / 10000000000.0) * frequency * fadeFactor);

    float specularMapValue = texture2D(image, materialInput.st).r;
    specularMapValue = 1.0; // vtxf 20190123

    // note: 此时不使用方向运动，只需将角度设置为0.0;
    vec4 noise = czm_getWaterNoise(normalMap, materialInput.st * frequency, time, 0.0);
    vec3 normalTangentSpace = noise.xyz * vec3(1.0, 1.0, (1.0 / amplitude));

    // 当我们离水面越来越远时，正常的扰动会逐渐消失
    normalTangentSpace.xy /= fade;

    // 当我们接近非水域时，尝试淡出正常扰动（低镜面反射贴图值）
    normalTangentSpace = mix(vec3(0.0, 0.0, 50.0), normalTangentSpace, specularMapValue);

    normalTangentSpace = normalize(normalTangentSpace);

    // 获取新法向量与垂直于切平面的向量对齐的比率
    float tsPerturbationRatio = clamp(dot(normalTangentSpace, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);

    // 当镜面反射贴图值减小时淡出水效果
    material.alpha = specularMapValue;

    // 基础颜色是基于镜面反射贴图的值的水和非水颜色的混合
    // 可能需要一个均匀的混合因子来更好地控制这一点
    // material.diffuse = mix(blendColor.rgb, baseWaterColor.rgb, specularMapValue);
    vec2 v = gl_FragCoord.xy / czm_viewport.zw;
    v.y = 1.0 - v.y;
    // material.diffuse = texture2D(image, v).rgb;
    material.diffuse = texture2D(image, v + noise.xy*0.03).rgb;

    // 漫反射高光基于法线的扰动程度
    material.diffuse += (0.1 * tsPerturbationRatio);
    // material.diffuse += (0.1 * tsPerturbationRatio);

    material.diffuse = material.diffuse;

    material.normal = normalize(materialInput.tangentToEyeMatrix * normalTangentSpace);

    material.specular = specularIntensity;
    material.shininess = 10.0;
    material.diffuse = color.rgb * material.diffuse;
    // material.diffuse = mix(material.diffuse,color.rgb, color.a);
    material.alpha = color.a;
    return material;
    }


