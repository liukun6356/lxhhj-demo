<template>
  <div class="polylineFly-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import {onMounted, onUnmounted, reactive} from "vue";
// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import GUI from "lil-gui";


const mapStore = usemapStore()
const model = reactive({
  curRuningArr_i: 0,
  curRuningArr: [],
})
onMounted(() => {
  initGui()
  viewer.dataSources.add(datasource);
})

onUnmounted(() => {
  gui.destroy()
  viewer.dataSources.remove(datasource);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const datasource = new Cesium.CustomDataSource("single")

const addSingleFly = () => {
  // 飞行区域边界线
  const entity = datasource.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([[114.349890, 30.542732], [114.378705, 30.561203], [114.388060, 30.55033], [114.359314, 30.532035], [114.349890, 30.542732]].flat()),
      width: 1.5,
      material: Cesium.Color.fromCssColorString("#C0C0C0").withAlpha(0.5),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    }
  })
  viewer.flyTo(entity)
  // 飞行路线
  const positionSampledPositionProperty = new Cesium.SampledPositionProperty();
  positionSampledPositionProperty.setInterpolationOptions({interpolationDegree: 4});
  viewer.clock.startTime = Cesium.JulianDate.fromDate(new Date(1727971200000));
  viewer.clock.clockRange = Cesium.ClockRange.CLAMPED // UNBOUNDED CLAMPED LOOP_STOP
  viewer.clock.shouldAnimate = false;
  viewer.clock.stopTime = Cesium.JulianDate.addSeconds(viewer.clock.startTime, 2 * 3, new Cesium.JulianDate())
  viewer.clock.currentTime = viewer.clock.startTime.clone();
  const flyPoints = [[114.349890, 30.542732, 200], [114.378705, 30.561203, 200], [114.388060, 30.55033, 200], [114.359314, 30.532035, 200]]
  const times = flyPoints.map((_, index) => Cesium.JulianDate.addSeconds(viewer.clock.startTime, 2 * index, new Cesium.JulianDate()))
  const positions = flyPoints.map(pos => new Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2]))
  positionSampledPositionProperty.addSamples(times, positions)
  datasource.entities.add({
    position: positionSampledPositionProperty,
    orientation: new Cesium.VelocityOrientationProperty(positionSampledPositionProperty),
    path: {
      leadTime: 0,
      trailTime: 0.3, //路径持续时间
      width: 1, //路径宽度
      resolution: 10, //路径分辨率
      material: Cesium.Color.fromCssColorString("red")
    },
    model: {
      uri: import.meta.env.VITE_APP_MODELVIEW + '/wrj.glb',
      minimumPixelSize: 128, //模型最小像素
      maximumScale: 200, //模型最大放大倍数,
    },
  });
}

const addMultFly = () => {
  const obj = {
    name: "A01",
    speed: 100,
    points: [[117.298794, 31.882442, 500], [117.249731, 31.88091, 600]],
    model: {
      uri: import.meta.env.VITE_APP_MODELVIEW + '/wrj.glb',
      scale: 1,
      minimumPixelSize: 128, //模型最小像素
      maximumScale: 200, //模型最大放大倍数,
    },
    path: {show: true, color: "#ffff00", opacity: 0.5, width: 1, isAll: false},
    shadow: [{show: true, type: "cylinder", color: "#ff0000"}]
  }

  const entity =  datasource.entities.add({
    orientation: new Cesium.VelocityOrientationProperty(positionSampledPositionProperty),
    path: {
      leadTime: 0,
      trailTime: 0.3, //路径持续时间
      width: 1, //路径宽度
      resolution: 10, //路径分辨率
      material: Cesium.Color.fromCssColorString("red")
    },
    model: {
      uri: import.meta.env.VITE_APP_MODELVIEW + '/wrj.glb',
      minimumPixelSize: 128, //模型最小像素
      maximumScale: 200, //模型最大放大倍数,
    },
  });

}

const reset = () => {
  datasource.entities.removeAll()
}

// lil-gui逻辑
let gui, singleFolder, multFolder, typeControl
const formData = {
  type: "",
  start: () => viewer.clock.shouldAnimate = true,
  pause: () => viewer.clock.shouldAnimate = false,
  back: () => viewer.clock.currentTime = viewer.clock.startTime.clone(),
  reset: () => typeControl.setValue()
}

const initGui = () => {
  gui = new GUI({title: "polylineFly"});
  typeControl = gui.add(formData, "type", ["single", "mult"]).onChange(type => {
    reset()
    switch (type) {
      case "single":
        singleFolder.show()
        multFolder.hide()
        addSingleFly()
        break
      case "mult":
        singleFolder.hide()
        multFolder.show()
        addMultFly()
        break
      default:
        singleFolder.hide()
        multFolder.hide()
    }
  })
  singleFolder = gui.addFolder("single")
  singleFolder.add(formData, "start")
  singleFolder.add(formData, "pause")
  singleFolder.add(formData, "back")
  singleFolder.hide()
  multFolder = gui.addFolder("mult")
  multFolder.hide()
  typeControl.setValue("single")
  gui.add(formData, "reset")
}

</script>

<style lang="scss" scoped>
.polylineFly-wrap {
  position: fixed;
  top: 100px;
  left: 280px;
  pointer-events: auto;
}
</style>
