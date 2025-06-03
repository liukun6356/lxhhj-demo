<template>
  <div class="DrawCommand-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap";
import {MyPrimitive} from "./MyPrimitive"
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import {FluidRenderer} from "../../fluid/heightMap/fluidDemo";

const mapStore = usemapStore()
onMounted(async () => {
  initGui()
})

onUnmounted(() => {
  gui.destroy()
})

const doClick = () => {
  // [[113.010154,25.747772,241.3],[113.041842,25.683832,251.3],[113.13769,25.754968,538.4],[113.106143,25.763953,469.5]]

  prePrimitive = new MyPrimitive()
  viewer.scene.primitives.add(prePrimitive)

}
const doDestry = () => {
  prePrimitive.destroy()
}

// lil-gui逻辑
let gui, isFlagControl, prePrimitive
const formData = {
  param1: 10,
  doClick,
  doDestry
}
const initGui = () => {
  gui = new GUI({title: "DrawCommand"});
  gui.add(formData, "doClick").name("生成")
  gui.add(formData, "doDestry").name("销毁")
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
viewer.scene.globe.depthTestAgainstTerrain = true
</script>

<style lang="scss" scoped>
.DrawCommand-wrap {

}
</style>
