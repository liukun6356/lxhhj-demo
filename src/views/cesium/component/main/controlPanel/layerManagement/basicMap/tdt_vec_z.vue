<!--矢量注记-->
<template></template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import {onMounted, onUnmounted} from "vue";

const mapStore = usemapStore()

onMounted(() => {
  const viewer = mapStore.getCesiumViewer();
  let ImageryProvider = new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://{s}.tianditu.gov.cn/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk='+import.meta.env.VITE_APP_TDT_KEY,
    layer: 'vec_z',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'GoogleMapsCompatible',
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    maximumLevel: 18
  });
  viewer.imageryLayers.addImageryProvider(ImageryProvider);
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'vec_z')
  viewer.imageryLayers.raiseToTop(layer)
})

onUnmounted(() => {
  const viewer = mapStore.getCesiumViewer();
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'vec_z')
  viewer.imageryLayers.remove(layer)
})
</script>
