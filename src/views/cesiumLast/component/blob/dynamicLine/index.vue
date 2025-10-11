<template>
  <div class="dynamicLine-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
// Component
import Tdt_img_d from "@/views/cesiumLast/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(() => {
  initGui()
  viewer.scene.primitives.add(primitiveCollection);
})

onUnmounted(() => {
  gui.destroy()
  viewer.scene.primitives.remove(primitiveCollection);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const primitiveCollection = new Cesium.PrimitiveCollection()
const addLine1 = () => {
  reset()
  let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100], [114.367137, 30.551429, 100], [114.377137, 30.551429, 100]]
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArrayHeights (positions.flat()),
        width: 8,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            image: icons['line1'],
            speed: 2,
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st =  materialInput.st;

                vec2 uv = vec2(fract((st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                material.alpha = colorImage.a;
                material.diffuse = colorImage.rgb;

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}
const addLine2 = () => {
  reset()
  let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100], [114.367137, 30.551429, 100], [114.377137, 30.551429, 100]]
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArrayHeights (positions.flat()),
        width: 18,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            color: Cesium.Color.fromCssColorString("#a6d96a"),
            repeat: new Cesium.Cartesian2(10.0, 1.0),
            image: icons['line2'],
            speed: 20,
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st =  repeat * materialInput.st;

                vec2 uv = vec2(fract((st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                material.alpha = colorImage.a * color.a;
                material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}
const addLine3 = () => {
  reset()
  let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100], [114.367137, 30.551429, 100], [114.377137, 30.551429, 100]]
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArrayHeights (positions.flat()),
        width: 6,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            color: Cesium.Color.fromCssColorString("#00FFFF"),
            image: icons['line3'],
            speed: 2,
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st =  materialInput.st;

                vec2 uv = vec2(fract((st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                material.alpha = colorImage.a * color.a;
                material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}
const addLine4 = () => {
  reset()
  let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100]]
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArrayHeights (positions.flat()),
        width: 10,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            color: Cesium.Color.fromCssColorString("#1a9850"),
            image: icons['line4'],
            speed: 4,
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st =  materialInput.st;

                vec2 uv = vec2(fract((st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                material.alpha = colorImage.a * color.a;
                material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}
const addLine5 = () => {
  reset()
  let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100]]
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArrayHeights (positions.flat()),
        width: 8,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            color: Cesium.Color.fromCssColorString("#66bd63"),
            repeat: new Cesium.Cartesian2(2.0, 1.0),
            image: icons['line5'],
            speed: 10,
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = repeat * materialInput.st;

                vec2 uv = vec2(fract((st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                material.alpha = colorImage.a * color.a;
                material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}
const addLine6 = () => {
  reset()
  let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100]]
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArrayHeights (positions.flat()),
        width: 5,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            color: Cesium.Color.fromCssColorString("#7FFF00"),
            image: icons['line6'],
            speed: 20,
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = materialInput.st;

                vec2 uv = vec2(fract((st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                material.alpha = colorImage.a * color.a;
                material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}
const addLine7 = () => {
  reset()
  let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100]]
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArrayHeights (positions.flat()),
        width: 20,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            color: Cesium.Color.fromCssColorString("red"),
            repeat: new Cesium.Cartesian2(20, 1),
            image: icons['line7'],
            speed: 30,
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = repeat * materialInput.st;

                vec2 uv = vec2(fract((st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                material.alpha = colorImage.a * color.a;
                material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}

const reset = () => {
  primitiveCollection.removeAll()
}

// lil-gui逻辑
let gui, materalFolder
const formData = {
  addLine1,
  addLine2,
  addLine3,
  addLine4,
  addLine5,
  addLine6,
  addLine7,
  reset
}
const initGui = () => {
  gui = new GUI({title: "dynamicLine"});
  materalFolder = gui.addFolder("自定义材质")
  materalFolder.add(formData, "addLine1").name("1 空中彩色渐变颜色")
  materalFolder.add(formData, "addLine2").name("2 空中动态箭头")
  materalFolder.add(formData, "addLine3").name("3 空中流动线")
  materalFolder.add(formData, "addLine4").name("4 地面动态箭头")
  materalFolder.add(formData, "addLine5").name("5 地面椎状流动线")
  materalFolder.add(formData, "addLine6").name("6 地面流动渐变线")
  materalFolder.add(formData, "addLine7").name("7 箭头线")
  gui.add(formData,"reset")
}

// 图标
const icons = (() => {
  const raw = import.meta.glob('/src/views/cesiumLast/component/blob/dynamicLine/*.png', {eager: true, import: 'default'});
  return Object.keys(raw).reduce((obj, path) => {
    obj[path.match(/dynamicLine\/(.*)\.png$/)[1]] = raw[path];
    return obj;
  }, {})
})()
</script>

<style lang="scss" scoped>
.dynamicLine-wrap {
}
</style>
