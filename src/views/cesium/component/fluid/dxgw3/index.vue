<template>
  <div class="dxgw-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive} from "vue";
import * as mars3d from "mars3d";
import {usemapStore} from "@/store/modules/cesiumMap";
import pipelineJson from "./pipeline.json"
import heartPng from "@/assets/images/three/heart.png"
import zhuanJPG from "@/assets/images/threeCourse/house/zhuan.jpg"
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import GUI from "lil-gui";


const model = reactive({})
onMounted(() => {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  initGui()
  viewer.scene.primitives.add(primitiveCollection);
  viewer.addLayer(graphicLayer)

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(109.230515, 23.686560, 18351.54),
    orientation: {
      heading: Cesium.Math.toRadians(6),
      pitch: Cesium.Math.toRadians(-75),
      roll: Cesium.Math.toRadians(0)
    }
  });
})

onUnmounted(() => {
  viewer.scene.primitives.remove(primitiveCollection);
  graphicLayer.destroy()
  gui.destroy()
})

const addPipline = (positions) => {
  if (!positions) positions = [[118.761045, 39.744918, 100], [118.760468, 39.743905, 100]]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())

  function computeCircle(radius) {
    let position1 = []
    for (let i = 0; i < 60; i++) {
      const radians = Cesium.Math.toRadians(i * 6)
      position1.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)))
    }
    return position1
  }

  const geometry = new Cesium.PolylineVolumeGeometry({
    polylinePositions: positions,
    shapePositions: computeCircle(Math.random() * 10),
  })
  const instance = new Cesium.GeometryInstance({geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
}

const addMulPipeline = () => {
  function computeHollowCircle(radiusOuter, radiusInner, segments = 60) {
    const positions = [];

    // 外圈：逆时针
    for (let i = 0; i < segments; i++) {
      const radians = Cesium.Math.toRadians(i * (360 / segments));
      positions.push(new Cesium.Cartesian2(radiusOuter * Math.cos(radians), radiusOuter * Math.sin(radians)));
    }

    // 内圈：顺时针
    for (let i = segments - 1; i >= 0; i--) {
      const radians = Cesium.Math.toRadians(i * (360 / segments));
      positions.push(new Cesium.Cartesian2(radiusInner * Math.cos(radians), radiusInner * Math.sin(radians)));
    }

    return positions;
  }

  let instances = []
  pipelineJson.features.forEach((feature) => {
    const geometry = new Cesium.PolylineVolumeGeometry({
      polylinePositions: Cesium.Cartesian3.fromDegreesArrayHeights(feature.geometry.coordinates.map(([lon, lat]) => [lon, lat, 100]).flat()),
      shapePositions: computeHollowCircle(5, 4),
    })
    const instance = new Cesium.GeometryInstance({geometry})
    instances.push(instance)
  })

  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'DiffuseMap',
          uniforms: {
            image: zhuanJPG, // 图像的路径
            repeat: new Cesium.Cartesian2(1, 1), // 可调整重复次数
            channels: 'rgb' // 图像通道,需三个字符串,包含 r、g、b 和 a 的任意组合
            // rgb 显示完整彩色图像，忽略 Alpha
            // rrr 将红色通道同时用作 R、G、B，实现单通道可视化
            // aaa 使用透明度通道制作灰度图可视化
          }
        }
      })
    })
  }))
}

const addRandomGraphicByCount = () => {
  graphicLayer.enabledEvent = false // 关闭事件，大数据addGraphic时影响加载时间
  let arrData = []
  pipelineJson.features.forEach((feature) => {
    arrData.push({
      positions: feature.geometry.coordinates.map(([lng, lat, alt]) => new mars3d.LngLatPoint(lng, lat, alt)),
      style: {
        shape: "pipeline",
        radius: 4,
        thicknes: 1,
        // color: Cesium.Color.YELLOW.withAlpha(1)
        material: new Cesium.Material({
          fabric: {
            type: 'DiffuseMap',
            uniforms: {
              image: zhuanJPG, // 图像的路径
              repeat: new Cesium.Cartesian2(1, 1), // 可调整重复次数
              channels: 'rgb' // 图像通道,需三个字符串,包含 r、g、b 和 a 的任意组合
              // rgb 显示完整彩色图像，忽略 Alpha
              // rrr 将红色通道同时用作 R、G、B，实现单通道可视化
              // aaa 使用透明度通道制作灰度图可视化
            }
          }
        })
      },
    })
  })
  console.log(arrData, 123)
  const graphic = new mars3d.graphic.PolylineVolumeCombine({
    instances: arrData,
    // style: {
    //   outline: true,
    //   outlineWidth: 1,
    //   outlineColor: "#ffffff",
    // },
    // 高亮时的样式
    highlight: {
      type: mars3d.EventType.click,
      color: Cesium.Color.YELLOW.withAlpha(0.9)
    },
  })
  graphicLayer.addGraphic(graphic)
  graphicLayer.enabledEvent = true // 恢复事件
}

const reset = () => {
  primitiveCollection.removeAll()
  graphicLayer.clear()
}

// 地图逻辑
const mapStore = usemapStore()
const viewer = mapStore.getCesiumViewer();
let handler
const primitiveCollection = new Cesium.PrimitiveCollection()
const graphicLayer = new mars3d.layer.GraphicLayer()
graphicLayer.on(mars3d.EventType.click, function (event) {
  const pickedItem = event.pickedObject?.data
  // const attr = event.graphic.attr
  console.log("单击了合并对象中的单个值为", pickedItem)
})


const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  console.log(pickedObject, 123)

}

// lil-gui逻辑
let gui, geometryFolder
const formData = {
  reset,
  addPipline,
  addMulPipeline,
  addRandomGraphicByCount
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "addPipline")
  gui.add(formData, "addMulPipeline")
  gui.add(formData, "addRandomGraphicByCount")
  gui.add(formData, "reset")
}
</script>
