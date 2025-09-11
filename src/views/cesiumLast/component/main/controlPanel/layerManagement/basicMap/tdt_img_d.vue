<!--影像底图-->
<template></template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import {onMounted, onUnmounted} from "vue";
import * as Cesium from "cesium";

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
    maximumLevel: 18,
    // url: new Cesium.Resource({
    //   url: 'https://img.net/access/rest/services/MosaicMap_2022_05M/Transfer?&tilematrixset=EPSG:4326&Service=WMTS&Request=GetTile&Format=image/webp&TileMatrix={TileMatrix}&TileCol={TileCol}&TileRow={TileRow}&version=1.0.0',
    //   headers: {
    //     "x-gistack-token": "eyJraWQiOiJrMSIsImFsZyI6IlJTMjU2In0.eyJpc3MiOiJhZG1pbkBnaXN1bmkuY29tIiwiYXVkIjoidXVtcyIsImV4cCI6MTc1NTIyNDEzNiwianRpIjoiNWxNMmlOV19kcE5WZDdQbFZxbjlPdyIsImlhdCI6MTc1NDYxOTMzNiwibmJmIjoxNzU0NjE5MDM2LCJzdWIiOiJjenNzbGoiLCJpZCI6IjJjOTA4MGFmOTVlYTE1N2EwMTk2YTMyOWVkNTgxZWI0IiwibmFtZSI6ImN6c3NsaiIsInR5cGUiOiIwIiwiY2xpZW50aWQiOm51bGwsImZyb20iOiJ1dW1zIiwiZXhwaXJlcyI6IjE3NTUyMjQxMzY0OTgiLCJyb2xlcyI6W119.lNCVLFFamI-Moc110vWwsAk7EFSTBfU2CTbMjjdx0-8m-dA46NQxQW6i6oOqwCGEneBcCMW75BDfFb5y2rsLUN08WbiUlD5Q7RV5mq86GNwQBPbB8bgoaS_nWMAKAFTt62nrqoENg0Qd8nNu_Uf5Dpe6axuUtjz7iQJdkhRVvhajCbuqXrNnx9hp2BLiriz64R6nAvnTcllmcfHj5XqoqeOXFkEXSi9jNoP-TkuzoBfDdWtj_d2saDha8srGc4W4DYMRC_-7HD93aV1ntoH2383cug4pAPgTL1l5eeUAYU0d1TBTioInAcWSKjiXe9CzTlk46XWjQJhIXg2iZtx5gQ",
    //     "security-token": "e2_4tmXO4QqHLWe5KxJmm5cfjrM9TM-EfVwfiTWyKwa0DwhQFCFM2b18k."
    //   }
    // }),
  });
  if (!viewer) return
  viewer.imageryLayers.addImageryProvider(ImageryProvider);
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'img_d')
  viewer.imageryLayers.raiseToTop(layer)
})

onUnmounted(() => {
  const layer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'img_d')
  viewer.imageryLayers.remove(layer)
})
</script>
