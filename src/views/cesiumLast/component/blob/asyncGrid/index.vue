<template>
  <div class="dynamicLine-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
// Component
import Tdt_img_d from "@/views/cesiumLast/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(() => {
  initGui()
  viewer.scene.primitives.add(primitiveCollection);
})

onUnmounted(() => {
  gui.destroy()
  viewer.scene.primitives.remove(primitiveCollection);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const primitiveCollection = new Cesium.PrimitiveCollection()
let provider

const gridImageryProvider = async () =>{
  provider =  await viewer.imageryLayers.addImageryProvider(new Cesium.TileCoordinatesImageryProvider());
}

const addLodPoint = () =>{

}

const reset = () => {
  viewer.imageryLayers.remove(provider)
}

// lil-gui逻辑
let gui
const formData = {
  reset,
  gridImageryProvider,
  addLodPoint
}
const initGui = () => {
  gui = new GUI({title: "dynamicLine"});
  gui.add(formData,"gridImageryProvider").name("瓦片信息")
  gui.add(formData,"addLodPoint").name("添加lod点位")
  gui.add(formData,"reset")
}

</script>
