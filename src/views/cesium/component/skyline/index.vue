<!--天际线分析 todo-->
<template>
  <div class="skyline-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue"
import fragmentShaderSource from "./Skyline.glsl";
import {usemapStore} from "@/store/modules/cesiumMap";
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(() => {

  viewer.scene.postProcessStages.add(postProcess);
})

onUnmounted(() => {
  viewer.scene.postProcessStages.remove(postProcess);
})
// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let postProcess = new Cesium.PostProcessStage({
  fragmentShader: fragmentShaderSource,
  uniforms: {
    height: function () {
      return viewer.camera.positionCartographic.height;
    },
    lineWidth: 2, //天际线宽度
    strokeType: new Cesium.Cartesian3(true, false, false), //天际线，物体描边，全描边
    tjxColor: new Cesium.Color(1.0, 0.0, 0.0), //边际线颜色
    bjColor: new Cesium.Color(0.0, 0.0, 1.0),//物体描边颜色
    cameraPos: function () {
      return viewer.scene.camera.position;
    },
    mbDis: 500, //物体描边距离
  }
});
postProcess.enabled = true
</script>

<style lang="scss" scoped>
.skyline-wrap {

}
</style>
