<!--水系线 wms-->
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
  const WmsMapService = new Cesium.WebMapServiceImageryProvider({
    url: import.meta.env.VITE_GEOSERVE_URL + '/geoserver/chenzhou/wms',
    layers: 'chenzhou:drainage_line_group', // 服务名称
    parameters: {
      service: 'WMS',
      format: 'image/png',
      srs: 'EPSG:4326',
      transparent: true, //透明
    },
  });
  const layer = viewer.imageryLayers.addImageryProvider(WmsMapService);
  viewer.imageryLayers.raiseToTop(layer)
})

onUnmounted(() => {
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layers === 'chenzhou:drainage_line_group')
  viewer.imageryLayers.remove(layer)
})
</script>