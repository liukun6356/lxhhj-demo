/**
* @author: liuk
* @date: 2024-11-18
* @describe:楼层叠加
*/
<template>
  <div class="floorsStacking-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import {onMounted, onUnmounted} from "vue"
import * as Cesium from "cesium";
import GUI from "lil-gui";
// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {ElMessage} from "element-plus";

const mapStore = usemapStore()
onMounted(() => {
  initGui()
  viewer.dataSources.add(floorsStackingDatasource);
  addEntity()
  mapResetCamera()
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
})

onUnmounted(() => {
  handler.destroy()
  floorsStackingDatasource?.entities?.removeAll()
  viewer.dataSources.remove(floorsStackingDatasource);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
const floorsStackingDatasource = new Cesium.CustomDataSource("floorsStacking");
let handler

const addEntity = () => {
  new Array(20).fill("").forEach((_, index) => {
    floorsStackingDatasource.entities.add({
      customType: "floorsStacking",
      floor: index + 1,
      position: Cesium.Cartesian3.fromDegrees(113.136103, 25.720441, 673 + index * 3 - (index && 2.3)),
      model: {
        uri: getGlbUrl(index + 1),
      },
    });
  })
}

const spreadFloor = () => {
  floorsStackingDatasource.entities.values.forEach((entity, index) => {
    const pos = cartesianToWgs84(entity.position.getValue())
    entity.position = Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2] + 4 * entity.floor)
  })
}

const closeFloor = () => {
  floorsStackingDatasource.entities.values.forEach((entity, index) => {
    const pos = cartesianToWgs84(entity.position.getValue())
    entity.position = Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2] - 4 * entity.floor)
  })
}

const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  const entity = pickedObject.id;
  if (entity instanceof Cesium.Entity && entity.customType === "floorsStacking") {
    floorNumControl.setValue( entity.floor)
    ElMessage.success(`点击了${entity.floor}层`)
    floorsStackingDatasource.entities.values.forEach(entity => {
      if (entity.floor > formData.floorNum) entity.show = false
    })
  }
}

const reset = () => {
  floorNumControl.setValue( 20)
  floorsStackingDatasource.entities.values.forEach(entity => entity.show = true)
}

const getGlbUrl = (i) => {
  switch (true) {
    case i === 1:
      return `${import.meta.env.VITE_APP_MODELVIEW}/floorsStackGlb/1.glb`
    case i < 7:
      return `${import.meta.env.VITE_APP_MODELVIEW}/floorsStackGlb/${i}.glb`
    case i < 16:
      return `${import.meta.env.VITE_APP_MODELVIEW}/floorsStackGlb/6.glb`
    case i === 16:
      return `${import.meta.env.VITE_APP_MODELVIEW}/floorsStackGlb/16.glb`
    case i < 19:
      return `${import.meta.env.VITE_APP_MODELVIEW}/floorsStackGlb/17.glb`
    default:
      return `${import.meta.env.VITE_APP_MODELVIEW}/floorsStackGlb/${i}.glb`
  }
}

const mapResetCamera = () => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(113.139392, 25.720645, 792.29),
    orientation: {
      heading: Cesium.Math.toRadians(275),
      pitch: Cesium.Math.toRadians(-17.7),
      roll: 0.0
    }
  });
}

const cartesianToWgs84 = (cartesian) => {
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const longitude = Cesium.Math.toDegrees(cartographic.longitude);
  const latitude = Cesium.Math.toDegrees(cartographic.latitude);
  const height = cartographic.height;
  return [longitude, latitude, height]
}

// lil-gui逻辑
let gui, floorNumControl
const formData = {
  floorNum: 20,
  spreadFloor,
  closeFloor,
  reset,
  mapResetCamera
}

const initGui = () => {
  gui = new GUI({title: "floorsStacking"});
  floorNumControl = gui.add(formData, "floorNum").disable()
  gui.add(formData, "spreadFloor").name("展开楼层")
  gui.add(formData, "closeFloor").name("合上")
  gui.add(formData, "reset")
  gui.add(formData, "mapResetCamera")
}

</script>

<style lang="scss" scoped>
.floorsStacking-wrap {

}
</style>
