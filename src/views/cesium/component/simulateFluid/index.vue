<!--模拟流体-->
<template>
  <div class="simulateFluid-wrap">

  </div>
</template>

<script lang="ts" setup>
import {onMounted} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap";
import FluidDemo from "./fluidDemo"

const mapStore = usemapStore()
onMounted(() => {
  const fluid = new FluidDemo(viewer, {})
  viewer.camera.setView({
    destination: { x: -2771064.6756677167, y: 4781829.550624459, z: 3179130.042667584 },
    orientation: {
      heading: Cesium.Math.toRadians(48.72529042457395),
      pitch: Cesium.Math.toRadians(-10.899276751527792),
      roll: Cesium.Math.toRadians(0.0014027234956804583)
    }
  });
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
viewer.scene.msaaSamples = 4; // 多重采样抗锯齿的采样率（大于 1 的值启用 MSAA）
viewer.scene.highDynamicRange = true; // 是否使用高动态范围渲染
// viewer.postProcessStages.fxaa.enabled = true;
viewer.scene.globe.depthTestAgainstTerrain = true; // 深度测试


</script>

<style lang="scss" scoped>
.simulateFluid-wrap {

}
</style>
