/**
* @author: liuk
* @date: 2024-11-28
* @describe:无人机轨道飞行(clock + 后端长连接实时更新)
*/
<template>
  <div class="polylineFly-wrap">
    <el-button @click="start">开始</el-button>
    <el-button @click="pause">暂停</el-button>
    <el-button @click="remove">清除</el-button>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap";
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {onMounted, onUnmounted, reactive} from "vue";

const mapStore = usemapStore()
const model = reactive({
  curRuningArr_i: 0,
  curRuningArr: [],
})
onMounted(() => {
  viewer.dataSources.add(lineDatasource);
  viewer.dataSources.add(wrjModelDatasource);
  addLineEntiy()
  addModelEntity()
})

onUnmounted(() => {
  lineDatasource.entities.removeAll()
  viewer.dataSources.remove(lineDatasource);
  wrjModelDatasource.entities.removeAll()
  viewer.dataSources.remove(wrjModelDatasource);
})

const getlist = () => { // 模拟实时接口
  let apiIndex = 3
  const timer = setInterval(() => {
    if (apiIndex > 7) {
      clearInterval(timer)
      return
    }
    const times = flyPoints.slice(0, apiIndex).map((_, index) => Cesium.JulianDate.addSeconds(viewer.clock.startTime, 2 * index, new Cesium.JulianDate()))
    const positions = flyPoints.slice(0, apiIndex).map(pos => new Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2]))
    positionSampledPositionProperty.addSamples(times, positions)
    apiIndex++
  }, 2000)
}

const start = () => {
  viewer.clock.shouldAnimate = true;
  viewer.clock.currentTime = tempTime ? tempTime.clone() : viewer.clock.startTime.clone();
}

const pause = () => {
  tempTime = viewer.clock.currentTime
  viewer.clock.shouldAnimate = false;
}

const remove = () => {
  viewer.clock.shouldAnimate = false;
  viewer.clock.currentTime = viewer.clock.startTime.clone();
  tempTime = null
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const lineDatasource = new Cesium.CustomDataSource("line")
const wrjModelDatasource = new Cesium.CustomDataSource("wrj")
// 飞行区域边界线坐标
const lineCoordinates = [[116.069898, 31.303655], [116.098708, 31.322126], [116.108063, 31.311256], [116.079317, 31.292959], [116.069898, 31.303655]]
// 飞行路线
const flyPoints = [[116.069898, 31.303655, 200], [116.098708, 31.322126, 200], [116.108063, 31.311256, 200],
  [116.079317, 31.292959, 200]]
let wrjEntity, tempTime
const positionSampledPositionProperty = new Cesium.SampledPositionProperty();
positionSampledPositionProperty.setInterpolationOptions({
  interpolationDegree: 4, //插值程度
});
viewer.clock.startTime = Cesium.JulianDate.fromDate(new Date(1727971200000));
viewer.clock.clockRange = Cesium.ClockRange.CLAMPED // UNBOUNDED CLAMPED LOOP_STOP

const addLineEntiy = () => {
  const pos = Cesium.Cartesian3.fromDegreesArray(lineCoordinates.flat())
  const entity = lineDatasource.entities.add({
    polyline: {
      positions: pos,
      width: 1.5,
      material: Cesium.Color.fromCssColorString("#C0C0C0").withAlpha(0.5),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    }
  })
  viewer.flyTo(entity)
}

const addModelEntity = () => {
  viewer.clock.shouldAnimate = false;
  viewer.clock.stopTime = Cesium.JulianDate.addSeconds(viewer.clock.startTime, 2 * 3, new Cesium.JulianDate())
  viewer.clock.currentTime = viewer.clock.startTime.clone();
  const times = flyPoints.map((_, index) => Cesium.JulianDate.addSeconds(viewer.clock.startTime, 2 * index, new Cesium.JulianDate()))
  const positions = flyPoints.map(pos => new Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2]))
  positionSampledPositionProperty.addSamples(times, positions)
  wrjEntity = viewer.entities.add({
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
</script>

<style lang="scss" scoped>
.polylineFly-wrap {
  position: fixed;
  top: 100px;
  left: 280px;
  pointer-events: auto;
}
</style>
