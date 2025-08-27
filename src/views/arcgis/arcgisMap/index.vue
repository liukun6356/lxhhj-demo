<template>
  <!--主地图-->
  <div class="map-area">
    <div id="arcgisContainer" @mouseleave="mouseleaveFn"></div>
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
import {onMounted, markRaw, onUnmounted, reactive, toRefs} from "vue";
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import {formatToFixed} from "@/utils/dictionary";
import config from "@arcgis/core/config";
import SpatialReference from "@arcgis/core/geometry/SpatialReference.js";
import mittBus from "@/utils/mittBus";
import {throttle} from "lodash-es";

const mapStore = usearcgisMapStore()
const model = reactive({
  locationData: {
    longitude: "100.586029",//经度
    latitude: "30.889587",//纬度
    zoom: "",
    scale: ""
  }
})
const {locationData} = toRefs(model)

const mouseleaveFn = () =>{
  mittBus.emit("nodeOnMouseMove")
  mittBus.emit("pipelineOnMouseMove")
  mittBus.emit("waterWorkOnMouseMove")
}

onMounted(async () => {
  config.assetsPath = import.meta.env.VITE_ARCGIS_API + "/arcgis-core-es/assets";
  config.workers.loaderUrl = import.meta.env.VITE_ARCGIS_API + "/worker/system.min.js";
  config.workers.workerPath = import.meta.env.VITE_ARCGIS_API + "/worker/RemoteClient.js";
  const rawViewer = await initMap("arcgisContainer")
  mapStore.setArcgisViewer(rawViewer);
  mapStore.setIsActiveMap(true)
})

onUnmounted(() => {
  const viewer = mapStore.getArcgisViewer();
  viewer.destroy()
  pointerMoveHandler.remove()
  pointerClickHandler.remove()
  watchFn.remove()
  mapStore.setArcgisViewer(null);
  mapStore.setIsActiveMap(false)
})

let viewer, pointerMoveHandler, pointerClickHandler, watchFn
const initMap = (domId) => new Promise((resolve) => {
  viewer = new MapView({
    container: domId,
    center: [100.586029, 30.889587],
    zoom: 7,
    map: new Map({
      basemap: 'satellite',
      // spatialReference: SpatialReference.WGS84
    }),
    // spatialReference: SpatialReference.WGS84
    // spatialReference: { wkid: 4326 }
  })
  reactiveUtils.when(() => viewer.ready, () => {
    console.log("Truthy", viewer.ready)
    const rawViewer = markRaw(viewer)
    resolve(rawViewer)
  });
  pointerMoveHandler = viewer.on("pointer-move", throttle(onMouseMove, 16.66, {leading: true, trailing: true}))
  pointerClickHandler = viewer.on("click", throttle(onMouseClick, 16.66, {leading: true, trailing: true}))

  watchFn = reactiveUtils.watch(() => viewer.extent, throttle(onRender, 16.6, {leading: true, trailing: true}))
})

const onRender = () => {
  model.locationData.zoom = formatToFixed(viewer.zoom, 2)
  model.locationData.scale = formatToFixed(viewer.scale, 0)
  mittBus.emit("pipelineOnMouseRender")
  mittBus.emit("nodeOnMouseRender")
  mittBus.emit("waterWorkOnMouseRender")
}

let preType
const onMouseMove = async (event) => {
  const p = viewer.toMap(event);
  model.locationData.longitude = formatToFixed(p.longitude, 6);
  model.locationData.latitude = formatToFixed(p.latitude, 6);
  const movement = await viewer.hitTest(event);
  const result = movement.results.find((result) => result.layer?.customType);
  if (!result) {
    if (preType) {
      triggerMove(preType)
      preType = ""
    }
    return
  }
  if (preType && preType !== result.graphic.layer.customType) triggerMove(preType)
  preType = result.graphic.layer.customType
  triggerMove(preType, result.graphic)
}

const onMouseClick = async (event) => {
  const movement = await viewer.hitTest(event)
  const result = movement.results.find((result) => result.layer?.customType);
  if (!result) return
  triggerClick(result.layer.customType, result.graphic)
}

const triggerMove = (type, graphic?: any) => {
  switch (type) {
    case "node":
      mittBus.emit("nodeOnMouseMove", graphic)
      break
    case "pipeline":
      mittBus.emit("pipelineOnMouseMove", graphic)
      break
    case "waterWork":
      mittBus.emit("waterWorkOnMouseMove", graphic)
      break
  }
}

const triggerClick = (type, graphic) => {
  switch (type) {
    case "node":
      mittBus.emit("nodeOnMouseClick", graphic)
      break
    case "pipeline":
      mittBus.emit("pipelineOnMouseClick", graphic)
      break
    case "waterWork":
      mittBus.emit("waterWorkOnMouseClick", graphic)
      break
  }
}
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
