<template>
  <div class="switchCamera-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap";
import GUI from "lil-gui";
import {onMounted, onUnmounted} from "vue";

// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(async () => {
  add3dtiles()
  addEntity()
  initGui()
})

onUnmounted(() => {
  viewer.entities.remove(entity)
  viewer.scene.primitives.remove(tileset)
  gui.destroy()
})

const addEntity = () => {
  entity = viewer.entities.add({
    name: 'gltf',
    position: Cesium.Cartesian3.fromDegrees(114.387137, 30.551429, 0), // 设置位置
    model: {uri: 'https://file.threehub.cn/models/glb/map_park.glb', scale: 0.5},
  })
}

const add3dtiles = async () => {
  tileset = await Cesium.Cesium3DTileset.fromUrl('https://file.threehub.cn/3dtiles/house/tileset.json')
  viewer.scene.primitives.add(tileset)
}

// lil-gui逻辑
let gui, lonlatFolder, entityFolder
const initGui = () => {
  gui = new GUI({title: "switchCamera"});
  gui.add(formData, "flyHome").name("重置主视图")
  lonlatFolder = gui.addFolder("经纬度定位")
  lonlatFolder.add(formData, "setView")
  lonlatFolder.add(formData, "flyTo")
  entityFolder = gui.addFolder("实体")
  entityFolder.add(formData, "entityFlyTo").name("flyTo")
  entityFolder.add(formData, "entityZoomTo").name("zoomTo")
}

const formData = {
  flyHome: () => viewer.camera.flyHome(1),
  setView: () => viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 2 * 1e4),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0)
    },
  }),
  flyTo: () => viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 2 * 1e4),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0)
    },
    duration: 2
  }),
  entityFlyTo: () => viewer.flyTo(entity),
  entityZoomTo: () => viewer.zoomTo(entity),// 高版本
}

// 地图逻辑
let tileset, entity
const viewer = mapStore.getCesiumViewer()
viewer.scene.globe.depthTestAgainstTerrain = true

</script>

<style lang="scss" scoped>
.switchCamera-wrap {

}
</style>
