<template>
  <div class="switchCamera-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import GUI from "lil-gui";
import {onMounted, onUnmounted} from "vue";
import * as Cesium from "cesium";

// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(async () => {
  initGui()
  add3dtiles()
  addEntity()
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
    model: {uri: import.meta.env.VITE_APP_MODELVIEW + '/gc.glb', scale: 0.5},
  })
}

const add3dtiles = async () => {
  tileset =await Cesium.Cesium3DTileset.fromUrl('https://zhx.dashuiyun.cn/gisdata/tileset.json')
  viewer.scene.primitives.add(tileset)
}

const flyAnimation = () => {
  const flycenter = {x: 114.387137, y: 30.551429, z: 1e4}
  viewer.camera.setView({destination: Cesium.Cartesian3.fromDegrees(flycenter.x, flycenter.y, 23000000)});
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(flycenter.x, flycenter.y, 15000000), // 设置位置
    duration: 3, // 设置飞行持续时间，默认会根据距离来计算
    flyOverLongitude: 117, // 如果到达目的地有2种方式，设置具体值后会强制选择方向飞过这个经度
    complete: () => viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(flycenter.x, flycenter.y, flycenter.z), // 设置位置
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: Cesium.Math.toRadians(0),
      },
      duration: 2,
      easingFunction: Cesium.EasingFunction.LINEAR_NONE,
      complete: () => 1
    })
  });
}

// lil-gui逻辑
let gui, cameraFolder, lonlatFolder, entityFolder, tilesFolder
const initGui = () => {
  gui = new GUI({title: "switchCamera"});
  gui.add(formData, "flyAnimation").name("旋转入场动画")
  gui.add(formData, "flyHome").name("重置主视图")
  cameraFolder = gui.addFolder("相机")
  cameraFolder.add(formData, "zoomIn")
  cameraFolder.add(formData, "zoomOut")
  lonlatFolder = gui.addFolder("经纬度定位")
  lonlatFolder.add(formData, "setView")
  lonlatFolder.add(formData, "flyTo")
  entityFolder = gui.addFolder("实体")
  entityFolder.add(formData, "entityFlyTo").name("flyTo")
  entityFolder.add(formData, "entityZoomTo").name("zoomTo")
  entityFolder.add(formData, "trackedEntity").name("实体跟踪1")
  entityFolder.add(formData, "cancelTrackedEntity").name("取消实体跟踪1")
  entityFolder.add(formData, "lookAtEntity").name("实体跟踪2")
  entityFolder.add(formData, "cancelLookAtEntity").name("取消实体跟踪2")
  tilesFolder = gui.addFolder("瓦片")
  tilesFolder.add(formData, "tilesFlyTo").name("flyTo")
  tilesFolder.add(formData, "tilesZoomTo").name("zoomTo")
  tilesFolder.add(formData, "tilesSetView").name("setView")
  tilesFolder.add(formData, "viewBoundingSphere")
  tilesFolder.add(formData, "flyToBoundingSphere")
  tilesFolder.add(formData, "lookAtTiles").name("瓦片跟踪")
  tilesFolder.add(formData, "cancelLookAtTiles").name("取消瓦片跟踪")
}

const formData = {
  flyHome: () => viewer.camera.flyHome(1),
  flyAnimation,
  zoomIn: () => viewer.camera.zoomIn(1000),
  zoomOut: () => viewer.camera.zoomOut(1000),
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
  entityZoomTo: () => viewer.zoomTo(entity),
  trackedEntity: () => viewer.trackedEntity = entity,
  cancelTrackedEntity: () => viewer.trackedEntity = undefined,
  lookAtEntity: () => viewer.camera.lookAt(entity.position.getValue(), new Cesium.Cartesian3(0, 0, 1000)),
  cancelLookAtEntity: () => viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY),
  tilesFlyTo: () => viewer.flyTo(tileset),
  tilesZoomTo: () => viewer.zoomTo(tileset),
  tilesSetView: () => viewer.camera.setView({
    destination: tileset.boundingSphere.center,
    orientation: {heading: 0, pitch: -Math.PI / 4, roll: 0}
  }),
  viewBoundingSphere: () => viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0)),
  flyToBoundingSphere: () => viewer.camera.flyToBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0)),
  lookAtTiles: () => viewer.camera.lookAt(tileset.boundingSphere.center, new Cesium.Cartesian3(0, 0, 1000)),
  cancelLookAtTiles: () => viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY),
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
