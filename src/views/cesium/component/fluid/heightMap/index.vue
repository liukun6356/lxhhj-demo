<!--高度图-->
<template>
  <div class="heightMap-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap";
import GUI from "lil-gui";
import {onMounted, onUnmounted} from "vue";
import {FluidRenderer} from "./fluidDemo"
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"


const mapStore = usemapStore()

onMounted(async () => {
  initGui()
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
})

onUnmounted(() => {
  gui.destroy()
  handler.destroy()
})

// lil-gui逻辑
let gui,isFlagControl
const formData = {
  param1: 10,
  param2: 20,
  param3: 3,
  param4:1000,
  isFlag: false
}
const initGui = () => {
  gui = new GUI({title: "height-map"});
  gui.add(formData, "param1", 0, 500, 10).name("阈值").onChange(v => {
    if (waterFluid) waterFluid.config.customParams.x = v
  })
  gui.add(formData, "param2", 0, 50, 1).name("混合").onChange(v => {
    if (waterFluid) waterFluid.config.customParams.y = v
  })
  gui.add(formData, "param3", 0, 10, 0.2).name("光强").onChange(v => {
    if (waterFluid) waterFluid.config.customParams.z = v
  })
  gui.add(formData, "param4", 0, 1e4, 1000).name("高度").onChange(v => {
    if (waterFluid) waterFluid.config.maxHeight = v
  })
  isFlagControl  =gui.add(formData, "isFlag").name("捕抓高度图")
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let waterFluid, handler;
// 配置
viewer.shadows = true; // 开启阴影
viewer.resolutionScale = 1.0; // 分辨率
viewer.scene.msaaSamples = 4; // msaa
viewer.scene.globe.depthTestAgainstTerrain = true; // 深度测试
viewer.scene.logarithmicDepthBuffer = true; // log深度
viewer.scene.highDynamicRange = true;
viewer.scene.debugShowFramesPerSecond = true;
viewer.clock.currentTime = Cesium.JulianDate.fromIso8601("2024-12-29T06:00:00Z");

const onMouseClick = (movement) => {
  if (!formData.isFlag) return
  if(waterFluid)waterFluid.destroy()
  let cartesian = viewer.scene.pickPosition(movement.position);
  let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  let lon = Cesium.Math.toDegrees(cartographic.longitude);
  let lat = Cesium.Math.toDegrees(cartographic.latitude);
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, 10000),
    duration: 3, // 飞行时间（秒）
    orientation: {
      heading: Cesium.Math.toRadians(0), // 朝向
      pitch: Cesium.Math.toRadians(-90), // 俯视
      roll: 0
    },
    complete: async () => {
      waterFluid = new FluidRenderer(viewer, {
        lonLat: [lon, lat],
        width: 1024, // 纹理尺寸
        height: 1024,
        dimensions: new Cesium.Cartesian3(10000, 10000, 1000),  // 渲染范围 根据地形自行调整渲染高度
        minHeight: 0, // 归一化高度 最大高与上面的z对齐
        maxHeight: formData.param4
      });
      isFlagControl.setValue(false)
    }
  })
}
</script>

<style lang="scss" scoped>
.heightMap-wrap {

}
</style>
