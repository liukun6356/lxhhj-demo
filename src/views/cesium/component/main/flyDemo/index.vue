/**
* @author: liuk
* @date: 2025-05-21
* @describe:实时轨迹demo
*/
<template>
  <div class="polylineFly-wrap">
    <el-button @click="init">演示</el-button>
    <el-button @click="start">开始</el-button>
    <el-button @click="pause">暂停</el-button>
    <el-button @click="remove">清除</el-button>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap";
import {onMounted, onUnmounted, reactive} from "vue";
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
const model = reactive({
  allposData: []
})
onMounted(() => {
  model.allposData = new Array(30).fill("").map((_, i) => {
    var longitude = 116.069898 + Math.random() * 0.01
    var latitude = 31.303655 + Math.random() * 0.01
    return [longitude, latitude]
  })
  viewer.dataSources.add(lineDatasource);
  addLineEntiy()
  viewer.dataSources.add(wrjModelDatasource);

})

onUnmounted(() => {
  lineDatasource.entities.removeAll()
  viewer.dataSources.remove(lineDatasource);
  wrjModelDatasource.entities.removeAll()
  viewer.dataSources.remove(wrjModelDatasource);
})

const init = () =>{
  addModelEntity()
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
let wrjEntity, tempTime
const lineDatasource = new Cesium.CustomDataSource("line")
const wrjModelDatasource = new Cesium.CustomDataSource("wrj")
const positionSampledPositionProperty = new Cesium.SampledPositionProperty();
positionSampledPositionProperty.setInterpolationOptions({
  interpolationDegree: 4, //插值程度
});

viewer.clock.startTime = Cesium.JulianDate.fromDate(new Date(1727971200000));
viewer.clock.clockRange = Cesium.ClockRange.CLAMPED // UNBOUNDED CLAMPED LOOP_STOP

const addModelEntity = () => {
  viewer.clock.shouldAnimate = false;
  // viewer.clock.stopTime = Cesium.JulianDate.addSeconds(viewer.clock.startTime, 2 * 30, new Cesium.JulianDate())
  viewer.clock.currentTime = viewer.clock.startTime.clone();
  // 初始线路
  const times = model.allposData.slice(0, 5).map((_, index) => Cesium.JulianDate.addSeconds(viewer.clock.startTime, 2 * index, new Cesium.JulianDate()))
  const positions = model.allposData.slice(0, 5).map(pos => new Cesium.Cartesian3.fromDegrees(pos[0], pos[1], 5))
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
      minimumPixelSize: 60, //模型最小像素
      maximumScale: 100, //模型最大放大倍数,
    },
  });
  start()
  // 每隔两秒加一条数据
  let apiIndex = 5
  const timer = window.setInterval(() => {
    if (apiIndex > 30) {
      clearInterval(timer)
      return
    }
    const pos = model.allposData[apiIndex - 1]
    positionSampledPositionProperty.addSample(
        Cesium.JulianDate.addSeconds(viewer.clock.startTime, 2 * apiIndex, new Cesium.JulianDate()),
        new Cesium.Cartesian3.fromDegrees(pos[0], pos[1], 5)
    )
    console.log(positionSampledPositionProperty._property._times,232323)
    apiIndex++
  }, 2000)
}

// 绘制轨迹线
const addLineEntiy = () => {
  const pos = Cesium.Cartesian3.fromDegreesArray(model.allposData.flat())
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

</script>

<style lang="scss" scoped>
.polylineFly-wrap {
  position: fixed;
  top: 100px;
  left: 280px;
  pointer-events: auto;
}
</style>