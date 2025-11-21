<template>
  <div class="mapSplit-wrap">
    <div class="slider" ref="sliderRef" @mouseup="moveActive = false">
      <div class="sliderImg" @mousedown="moveActive = true"></div>
    </div>
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import GUI from "lil-gui";
import {onMounted, onUnmounted, reactive, ref, toRefs} from "vue";
// Component
import Tdt_img_d from "@/views/cesiumLast/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
// Ref
const sliderRef = ref(null)

const mapStore = usemapStore()
const model = reactive({
  moveActive: false
})
const {moveActive} = toRefs(model)
onMounted(async () => {
  initGui()
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  viewer.scene.splitPosition = sliderRef.value.offsetLeft / viewer.scene.canvas.offsetWidth;
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  addSplitDirection()
})

onUnmounted(() => {
  gui.destroy()
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let handler, imageryProviderL, imageryProviderR

const addSplitDirection = async () => {
  imageryProviderL = await viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://{s}.tianditu.gov.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + import.meta.env.VITE_APP_TDT_KEY,
    layer: 'vec_d',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'GoogleMapsCompatible',
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    maximumLevel: 18
  }));
  imageryProviderL.splitDirection = -1

  imageryProviderR = await viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + import.meta.env.VITE_APP_TDT_KEY,
    layer: 'img_d',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'GoogleMapsCompatible',
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    maximumLevel: 18
  }));
  imageryProviderR.splitDirection = 1
}

const onMouseMove = (movement) => {
  if (!model.moveActive) return
  const splitPosition = movement.endPosition.x / viewer.scene.canvas.offsetWidth;
  sliderRef.value.style.left = `${100 * splitPosition}%`;
  viewer.scene.splitPosition = splitPosition;
}

// lil-gui逻辑
let gui
const formData = {
}

const initGui = () => {
  gui = new GUI({title: "mapSplit"});
}

</script>
<style lang="scss" scoped>
.mapSplit-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;

  .slider {
    position: absolute;
    left: 50%;
    top: 0px;
    height: 100%;
    width: 5px;
    background: #1F1E1D;
    z-index: 1;
    pointer-events: auto;

    .sliderImg {
      position: absolute;
      width: 52px;
      height: 40px;
      background: url("@/assets/images/cesiumMap/center.png") no-repeat center/cover;
      top: 50%;
      left: -23px;
      transform: translateY(-50%);
    }
  }
}
</style>
