<!--影像底图-->
<template></template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap.ts";
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
  if(!viewer)return
  viewer.imageryLayers.addImageryProvider(ImageryProvider);
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'img_d')
  viewer.imageryLayers.raiseToTop(layer)
})

onUnmounted(() => {
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'img_d')
  viewer.imageryLayers.remove(layer)
})
</script>
