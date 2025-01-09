<!--子流域分区 wms-->
<template></template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import {onMounted, onUnmounted} from "vue";

const mapStore = usemapStore()

onMounted(() => {
  const viewer = mapStore.getCesiumViewer();
  const WmsMapService = new Cesium.WebMapServiceImageryProvider({
    url: import.meta.env.VITE_APP_GEOSERVE_URL + '/geoserver/chenzhou/wms',
    layers: 'chenzhou:space_subcatchment', // 服务名称
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
  const viewer = mapStore.getCesiumViewer();
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layers === 'chenzhou:space_subcatchment')
  viewer.imageryLayers.remove(layer)
})
</script>
