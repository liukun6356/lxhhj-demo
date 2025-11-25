<template>
  <div class="modelRotation-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import GUI from "lil-gui";
import {onMounted, onUnmounted, reactive} from "vue";
import * as Cesium from "cesium";

// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
const model = reactive({
  hpr: {
    heading: 0, //方位角  表示物体的水平方向（与北向之间的夹角），以弧度为单位
    pitch: 0, //俯仰角   表示物体的上下方向（与水平面之间的夹角），以弧度为单位
    roll: 0,//滚转角   表示物体的侧倾方向（与水平面之间的夹角），以弧度为单位
  }
})

onMounted(async () => {
  initGui()
})

onUnmounted(() => {
  gui.destroy()
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let preEntity

const rotateFn = () => {
  if (!preEntity) return
  model.hpr.heading += +0.01
  const hpr = new Cesium.HeadingPitchRoll(model.hpr.heading, model.hpr.pitch, model.hpr.roll)
  preEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(preEntity._position.getValue(), hpr);
}

const addModelRotation = async () => {
  reset()
  const position =  Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 2000)
  const hpr = new Cesium.HeadingPitchRoll(model.hpr.heading, model.hpr.pitch, model.hpr.roll)
  preEntity = viewer.entities.add({
    name: 'Model',
    position,
    orientation: Cesium.Transforms.headingPitchRollQuaternion(position, hpr),
    model: {uri: import.meta.env.VITE_APP_MODELVIEW + '/model4.glb',}
  });
  viewer.flyTo(preEntity);
  viewer.trackedEntity = preEntity
  viewer.clock.onTick.addEventListener(()=>{
    model.hpr.heading += 0.01
    const hpr = new Cesium.HeadingPitchRoll(model.hpr.heading, model.hpr.pitch, model.hpr.roll)
    preEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(preEntity._position.getValue(), hpr);
  });
}

const addMultipleModel = async () => {
  reset()
  const parentModel = viewer.scene.primitives.add(await Cesium.Model.fromGltfAsync({url: import.meta.env.VITE_APP_MODELVIEW + '/model7.glb',}));
  const childModel = viewer.scene.primitives.add(await Cesium.Model.fromGltfAsync({url: import.meta.env.VITE_APP_MODELVIEW + '/model6.glb'}));
  const position = Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 0);
  parentModel.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  const position1 = Cesium.Cartesian3.add(new Cesium.Cartesian3(0, 0, 10), position, new Cesium.Cartesian3());
  childModel.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position1);
  const heading = Cesium.Math.toRadians(90.0);
  const pitch = Cesium.Math.toRadians(90);
  const range = 5000.0;
  viewer.camera.lookAt(position, new Cesium.HeadingPitchRange(heading, pitch, range));
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(114.348354, 30.542609, 273.8),
    orientation: {
      heading: Cesium.Math.toRadians(222),
      pitch: Cesium.Math.toRadians(-51),
      roll: 0.0
    }
  });
}

const reset = () => {
  viewer.entities.removeAll()
  viewer.trackedEntity = undefined
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
  viewer.clock.onTick.removeEventListener(rotateFn);
}

// lil-gui逻辑
let gui
const formData = {
  reset,
  addModelRotation,
  addMultipleModel,
}

const initGui = () => {
  gui = new GUI({title: "modelRotation"});
  gui.add(formData, "addModelRotation").name("single模型")
  gui.add(formData, "addMultipleModel").name("multiple模型")
  gui.add(formData, "reset")
}

</script>
