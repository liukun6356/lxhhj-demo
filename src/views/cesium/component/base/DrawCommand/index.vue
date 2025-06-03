<template>
  <div class="DrawCommand-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap";
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";

const mapStore = usemapStore()
onMounted(async () => {
  initGui()
})

onUnmounted(() => {
  gui.destroy()
})

// lil-gui逻辑
let gui, isFlagControl
const formData = {
  param1: 10,
  param2: 20,
  param3: 3,
  param4: 1000,
  isFlag: false
}
const initGui = () => {
  gui = new GUI({title: "DrawCommand"});
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
</script>

<style lang="scss" scoped>
.DrawCommand-wrap {

}
</style>
