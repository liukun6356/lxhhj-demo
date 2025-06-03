<template>
  <div class="drawFlood-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap";
import {MyPrimitive} from "./MyPrimitive"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import proj4 from "proj4";

const mapStore = usemapStore()
onMounted(async () => {
  initGui()
  addVerticesPromitive()
})

onUnmounted(() => {
  gui.destroy()
})

const doClick = () => {
  prePrimitive = new MyPrimitive(vertices, triangles)
  viewer.scene.primitives.add(prePrimitive)

}
const doDestry = () => {
  prePrimitive.destroy()
}

// lil-gui逻辑
let gui, isFlagControl, prePrimitive
const formData = {
  param1: 10,
  doClick,
  doDestry
}
const initGui = () => {
  gui = new GUI({title: "drawFlood"});
  gui.add(formData, "doClick").name("生成")
  gui.add(formData, "doDestry").name("销毁")
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let vertices, triangles

const addVerticesPromitive = async () => {
  const res = await fetch(import.meta.env.VITE_APP_MODELDATA + `/2dFluidModel/2dFluidModel.json`)
  const jsonData = await res.json()
  vertices = new Float64Array(JSON.parse(jsonData.vertices).map((item) => proj4('EPSG:4547', 'EPSG:4326', item)).flat());
  triangles = new Uint32Array(JSON.parse(jsonData.triangles).flat())
  const projVertices = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 3) {
    const lon = vertices[i];
    const lat = vertices[i + 1];
    const world = Cesium.Cartesian3.fromDegrees(lon, lat);
    projVertices[i] = world.x;
    projVertices[i + 1] = world.y;
    projVertices[i + 2] = world.z;
  }
  vertices = projVertices
}
</script>

<style lang="scss" scoped>
.drawFlood-wrap {

}
</style>
