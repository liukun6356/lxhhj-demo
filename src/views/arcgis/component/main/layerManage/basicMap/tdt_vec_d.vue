<!--矢量地图-->
<template></template>

<script lang="ts" setup>
import {usearcgisMapStore} from "@/store/modules/arcgisMap.ts";
import {onMounted, onUnmounted} from "vue";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";

const mapStore = usearcgisMapStore()
const viewer = mapStore.getArcgisViewer();

let ImageryProvider
onMounted(() => {
  ImageryProvider = new WebTileLayer({
    layer: 'vec_d',
    urlTemplate:  `http://{subDomain}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}&tk=${import.meta.env.VITE_APP_TDT_KEY}`,
    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'GoogleMapsCompatible',
    maximumLevel: 18
  })
  viewer.map.add(ImageryProvider)
  viewer.map.layers.reorder(ImageryProvider, 1);
})

onUnmounted(() => {
  ImageryProvider.destroy();
  viewer.map?.remove(ImageryProvider);
})
</script>
