<!--楼层叠加-->
<template>
  <div class="floorsStacking-wrap">
    <p>楼层叠加</p>
    <p>当前楼层：{{ curFloor || 20 }}</p>
    <el-button type="primary" style="width:100px;margin-left: 0" @click='spreadFloor'>展开楼层</el-button>
    <el-button type="primary" style="width:100px;margin-left: 0" @click='closeFloor'>合上楼层</el-button>
    <el-button type="warning" style="width:100px;margin-left: 0" @click="reset">重置</el-button>
    <el-button type="primary" style="width:100px;margin-left: 0" @click="mapResetCamera">视角</el-button>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap";
import {onMounted, onUnmounted, reactive, toRefs} from "vue"
import {cartesianToWgs84} from "@/utils/dictionary";
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {ElMessage} from "element-plus";

const mapStore = usemapStore()
const model = reactive({
  curFloor: ""
})
const {curFloor} = toRefs(model)

onMounted(() => {
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
    model.curFloor = entity.floor
    ElMessage.success(`点击了${entity.floor}层`)
    floorsStackingDatasource.entities.values.forEach(entity => {
      if (entity.floor > model.curFloor) entity.show = false
    })
  }
}

const reset = () => {
  model.curFloor = ""
  floorsStackingDatasource.entities.values.forEach(entity => entity.show = true)
}


const getGlbUrl = (i) => {
  switch (true) {
    case i === 1:
      return `${import.meta.env.VITE_APP_MODELDATA}/floorsStackGlb/1.glb`
    case i < 7:
      return `${import.meta.env.VITE_APP_MODELDATA}/floorsStackGlb/${i}.glb`
    case i < 16:
      return `${import.meta.env.VITE_APP_MODELDATA}/floorsStackGlb/6.glb`
    case i === 16:
      return `${import.meta.env.VITE_APP_MODELDATA}/floorsStackGlb/16.glb`
    case i < 19:
      return `${import.meta.env.VITE_APP_MODELDATA}/floorsStackGlb/17.glb`
    default:
      return `${import.meta.env.VITE_APP_MODELDATA}/floorsStackGlb/${i}.glb`
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
</script>

<style lang="scss" scoped>
.floorsStacking-wrap {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  position: absolute;
  top: 100px;
  left: 280px;
  width: 120px;
  height: 240px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.6);
  pointer-events: auto;

}
</style>
