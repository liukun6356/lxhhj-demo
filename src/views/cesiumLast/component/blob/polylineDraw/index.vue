<template>
  <div class="polylineDraw-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import GUI from "lil-gui";
import {onMounted, onUnmounted} from "vue";
import * as Cesium from "cesium";

// Component
import Tdt_img_d from "@/views/cesiumLast/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(async () => {
  initGui()
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(onLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  handler.setInputAction(onRightClick, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  handler.setInputAction(onLeftDoubleClick, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
})

onUnmounted(() => {
  gui.destroy()
  handler.destroy()
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let handler
const positionsDraw = []

const startDraw = () => {
  console.log(111)
}

const onMouseMove = () => {
  // console.log("move")

}

const onLeftClick = (movement) => {
  console.log("LeftClick1")
  let cartographic = viewer.scene.pickPosition(movement.position); // 获取该点的笛卡尔坐标
  //在绘制点基础自动设置贴地，height设为 0
  const car = Cesium.Cartographic.fromCartesian(cartographic);
  cartographic = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, 0)
  positionsDraw.push(cartographic)

  // if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  // const entity = pickedObject.id;
}

const onRightClick = () => {
  console.log("RightClick")
}

const onLeftDoubleClick = () => {
  console.log("LeftDoubleClick")
}

const reset = () => {
  console.log(1)
}

// lil-gui逻辑
let gui
const formData = {
  startDraw,
  reset,
}

const initGui = () => {
  gui = new GUI({title: "polylineDraw"});
  gui.add(formData, "startDraw")
  gui.add(formData, "reset")
}

</script>

<style lang="scss" scoped>
.polylineDraw-wrap {

}
</style>
