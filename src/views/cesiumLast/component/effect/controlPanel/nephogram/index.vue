<!--云图-->
<template>
  <div class="nephogram-wrap"></div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive} from "vue";
import img1 from "./img/cloud01.png"
import img2 from "./img/cloud02.png"
import img3 from "./img/cloud03.png"
import img4 from "./img/cloud04.png"
import img5 from "./img/cloud05.png"
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import mittBus from "@/utils/mittBus"

const mapStore = usemapStore()
const urlArr = [img1, img2, img3, img4, img5]

const model = reactive({
  step: 0,
  alphaStep: 0.01
})

onMounted(() => {
  mittBus.emit("mapResetCamera")
  addImageryProvider()
})

onUnmounted(() => {
  viewer.imageryLayers._layers.filter(item => item.customType).forEach(layer => viewer.imageryLayers.remove(layer))
  window.clearInterval(idxTimer)
  layerArr.length = 0
})

// 地图逻辑
const layerArr = []
const viewer = mapStore.getCesiumViewer();
const addImageryProvider = () => {
  urlArr.forEach(url => {
    const imageryProvider = new Cesium.SingleTileImageryProvider({
      url,
      tileWidth: 256,
      tileHeight: 256,
      rectangle: Cesium.Rectangle.fromDegrees(112.848443, 25.554061, 113.213276, 25.949843),
    });
    const imagelayer = new Cesium.ImageryLayer(imageryProvider, {alpha: 0})
    imagelayer.customType = "nephogram"
    viewer.imageryLayers.add(imagelayer);
    layerArr.push(imagelayer)
  })
  model.step = 0
  changeRadarAlpha()
}

let idxTimer
const changeRadarAlpha = () => {
  if (model.step > layerArr.length - 1) {
    model.step = 0;
    layerArr[layerArr.length - 1].alpha = 0;
  }
  const layer1 = layerArr[model.step];
  const layer2 = layerArr[model.step + 1];
  if (!layer1 || !layer2) return;
  layer1.alpha = 1;
  layer2.alpha = 0;
  window.clearInterval(idxTimer);
  idxTimer = window.setInterval(function () {
    layer1.alpha -= model.alphaStep;
    layer2.alpha += model.alphaStep;
    if (layer1.alpha < model.alphaStep) {
      layer1.alpha = 0;
      model.step++;
      changeRadarAlpha()
    }
  }, 1 * 1000 * model.alphaStep);
}
</script>

<style lang="scss" scoped>
.nephogram-wrap {

}
</style>
