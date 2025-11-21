<!--灰色影像底图-->
<template></template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import {onMounted, onUnmounted} from "vue";

// Props
const props = defineProps<{
  isDualMap?: boolean
}>()

const mapStore = usemapStore()
const viewer = props.isDualMap ? mapStore.getDualCesoumViewer() : mapStore.getCesiumViewer();

onMounted(() => {
  let ImageryProvider = new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + import.meta.env.VITE_APP_TDT_KEY,
    layer: 'img_d',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'GoogleMapsCompatible',
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    maximumLevel: 18
  });
  viewer.imageryLayers.addImageryProvider(ImageryProvider);
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'img_d')
  layer.brightness = 4.2// 图像亮度，取值范围为 -1 到 1 之间的浮点数，其中 -1 表示最暗，1 表示最亮。
  layer.contrast = 0.6//图像对比度，取值范围为 -1 到 1 之间的浮点数，其中 -1 表示最低对比度，1 表示最高对比度。
  layer.gamma = 0.35 //图像伽马校正，取值范围为大于 0 的浮点数，其中 1 表示无伽马校正。
  layer.hue = 0 //图像色调，取值范围为 -1 到 1 之间的浮点数，其中 -1 表示最低色调，1 表示最高色调。
  layer.saturation = 0.2 //饱和度
  viewer.imageryLayers.raiseToTop(layer)
})

onUnmounted(() => {
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'img_d')
  viewer.imageryLayers.remove(layer)
})
</script>
