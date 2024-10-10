//水域相关场景效果
import * as Cesium from "cesium";

//创建水面Primitive
export function createWaterPrimitive(polygon, opts) {
  var primitiveOpts = {
    geometryInstances: new Cesium.GeometryInstance({
      geometry: polygon,
      id: opts.id || "water"
    }),
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      aboveGround: false,
      material: new Cesium.Material({
        fabric: {
          type: "Water",
          uniforms: {
            normalMap: opts.normalMap, //水正常扰动的法线图。
            frequency: opts.frequency || 8000.0, //控制波数的数字。
            animationSpeed: opts.animationSpeed || 0.03, //控制水的动画速度的数字。
            amplitude: opts.amplitude || 5.0, //控制水波振幅的数字。
            specularIntensity: opts.specularIntensity || 0.8, //控制镜面反射强度的数字。
            baseWaterColor: Cesium.Color.fromCssColorString(opts.baseWaterColor || "#123e59"), //rgba颜色对象基础颜色的水。#00ffff,#00baff,#006ab4
            blendColor: Cesium.Color.fromCssColorString(opts.blendColor || "#123e59") //从水中混合到非水域时使用的rgba颜色对象。
          }
        }
      }),
      fragmentShaderSource: getWaterShader(opts.opacity)
    }),
    show: true
  };
  if (opts.clampToGround) {
    primitiveOpts.classificationType = opts.classificationType || Cesium.ClassificationType.TERRAIN;
    return new Cesium.GroundPrimitive(primitiveOpts);
  } else {
    return new Cesium.Primitive(primitiveOpts);
  }
}

// 水面shader
function getWaterShader(opacity) {
  opacity = Cesium.defaultValue(opacity, 0.5);

  return (
    "varying vec3 v_positionMC;\n\
            varying vec3 v_positionEC;\n\
            varying vec2 v_st;\n\
            \n\
            void main()\n\
            {\n\
                czm_materialInput materialInput;\n\
                vec3 normalEC = normalize(czm_normal3D * czm_geodeticSurfaceNormal(v_positionMC, vec3(0.0), vec3(1.0)));\n\
            #ifdef FACE_FORWARD\n\
                normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);\n\
            #endif\n\
                materialInput.s = v_st.s;\n\
                materialInput.st = v_st;\n\
                materialInput.str = vec3(v_st, 0.0);\n\
                materialInput.normalEC = normalEC;\n\
                materialInput.tangentToEyeMatrix = czm_eastNorthUpToEyeCoordinates(v_positionMC, materialInput.normalEC);\n\
                vec3 positionToEyeEC = -v_positionEC;\n\
                materialInput.positionToEyeEC = positionToEyeEC;\n\
                czm_material material = czm_getMaterial(materialInput);\n\
            #ifdef FLAT\n\
                gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);\n\
            #else\n\
                gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);\n\
                gl_FragColor.a = " +
    opacity +
    ";\n\
            #endif\n\
            }"
  ); //czm_lightDirectionEC在cesium1.66开始加入的
}
