<template>
  <div class="mapSplit-wrap">
    <div class="slider" ref="sliderRef">
      <div class="sliderImg" ></div>
    </div>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {reactive, onMounted, onUnmounted, ref} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap";
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
// Ref
const sliderRef = ref(null)

const mapStore = usemapStore()
const model = reactive({
  moveActive: false
})

onMounted(() => {
  viewer.scene.splitPosition = sliderRef.value.offsetLeft  / viewer.scene.canvas.offsetWidth;
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(() => model.moveActive = true, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  handler.setInputAction(() => model.moveActive = false, Cesium.ScreenSpaceEventType.LEFT_UP);
  addSplitDirection()
})

onUnmounted(() => {
  viewer.scene.splitPosition = 1;
  handler?.destroy();
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const handler = new Cesium.ScreenSpaceEventHandler(sliderRef.value);
let imageryProviderL, imageryProviderR


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
  viewer.imageryLayers.raiseToTop(imageryProviderL)

  imageryProviderR = await viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://{s}.tianditu.gov.cn/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + import.meta.env.VITE_APP_TDT_KEY,
    layer: 'vec_z',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'GoogleMapsCompatible',
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    maximumLevel: 18,
  }));
  imageryProviderR.splitDirection = 1
  viewer.imageryLayers.raiseToTop(imageryProviderR)
}

const onMouseMove = (movement) => {
  if (!model.moveActive) return
  const relativeOffset = movement.endPosition.x;
  const splitPosition = (relativeOffset) / viewer.scene.canvas.offsetWidth;
  sliderRef.value.style.left = `${100 * splitPosition}%`;
  viewer.scene.splitPosition = splitPosition;
  console.log(splitPosition)
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
