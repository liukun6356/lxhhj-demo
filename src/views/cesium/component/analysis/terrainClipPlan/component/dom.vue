<!--影像dom-->
<template></template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import {onMounted, onUnmounted} from "vue";

const mapStore = usemapStore()
const viewer =mapStore.getCesiumViewer();

onMounted(() => {
  const rectangle = [
    [99.146791604, 25.126356954],//99.146791604,25.126356954,99.157223566,25.134304479
    [99.157223566, 25.134304479],
  ];
  const ImageryProvider = new Cesium.UrlTemplateImageryProvider({
    url: import.meta.env.VITE_APP_GISDATA + "/baoshan/dom/{z}/{x}/{y}.png",
    rectangle: Cesium.Rectangle.fromDegrees(rectangle[0][0], rectangle[0][1], rectangle[1][0], rectangle[1][1]),
    minimumLevel: 1,
    maximumLevel: 18,
  });
  ImageryProvider._layer = 'dom'
  if (!viewer) return
  viewer.imageryLayers.addImageryProvider(ImageryProvider);
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'dom')
  viewer.imageryLayers.raiseToTop(layer)
})

onUnmounted(() => {
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'dom')
  viewer.imageryLayers.remove(layer)
})
</script>
