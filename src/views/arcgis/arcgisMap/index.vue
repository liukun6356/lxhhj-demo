<template>
  <!--主地图-->
  <div class="map-area">
    <div id="arcgisContainer"></div>
  </div>
  <div class="locationbar" :style="{paddingRight:'30px'}">
    <span>经度: {{ locationData.longitude }}</span>
    <span>纬度: {{ locationData.latitude }}</span>
    <span>层级：{{ locationData.zoom }}</span>
    <span>比例尺：1:{{ locationData.scale }}</span>
  </div>
</template>

<script lang="ts" setup>
import MapView from "@arcgis/core/views/MapView.js";
import Map from "@arcgis/core/Map.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import {onMounted, markRaw, onUnmounted, reactive, toRefs, ref, watch} from "vue";
import {usemapStore} from "@/store/modules/arcgisMap";
import {formatToFixed, throttle} from "@/utils/dictionary";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer.js";

const mapStore = usemapStore()
const model = reactive({
  locationData: {
    longitude: "100.586029",//经度
    latitude: "30.889587",//纬度
    zoom: "",
    scale: ""
  }
})
const {locationData} = toRefs(model)

onMounted(async () => {
  const rawViewer = await initMap("arcgisContainer")
  mapStore.setArcgisViewer(rawViewer);
  mapStore.setIsActiveMap(true)
})

onUnmounted(() => {
  const viewer = mapStore.getArcgisViewer();
  viewer.destroy()
  mapStore.setArcgisViewer(null);
  mapStore.setIsActiveMap(false)
})

const ImageryProvider = new WebTileLayer({
  layer: 'img_d',
  urlTemplate: `http://{subDomain}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}&tk=${import.meta.env.VITE_APP_TDT_KEY}`,
  subDomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
})
const initMap = (domId) => new Promise((resolve) => {
  const viewer = new MapView({
    container: domId,
    center: [100.586029, 30.889587],
    zoom: 7,
    map: new Map({
      layers: [ImageryProvider]
    }),
  })
  reactiveUtils.when(() => viewer.ready, () => {
    console.log("Truthy", viewer.ready)
    const rawViewer = markRaw(viewer)
    resolve(rawViewer)
  });
  viewer.on("pointer-move", throttle((e) => {
    const p = viewer.toMap(e);
    model.locationData.longitude = formatToFixed(p.longitude, 6);
    model.locationData.latitude = formatToFixed(p.latitude, 6);
  }, 300))
  reactiveUtils.watch(() => viewer.extent, throttle(() => {
    model.locationData.zoom = formatToFixed(viewer.zoom, 2)
    model.locationData.scale = formatToFixed(viewer.scale, 0)
  }, 300))
})
</script>

<style lang="scss" scoped>
.map-area {
  width: 100%;
  height: 100%;

  #arcgisContainer {
    width: 100%;
    height: 100%;
  }
}

.locationbar {
  display: flex;
  justify-content: flex-end;
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 3px 0;
  font-size: 13px;
  color: #e9e9e9;
  text-shadow: 2px 2px 2px #000;
  background-color: rgba(0, 0, 0, .25);
  pointer-events: none;
  box-sizing: border-box;
  z-index: 0;
  transition: all 0.5s ease-in-out;
  user-select: none;

  span {
    margin-left: 15px;
  }
}
</style>
