<!--/**
 * @author: liuk
 * @date: 2024-07-15
 * @describe: 全局球组件
 */-->
<template>
  <div>
    <div class="map-area">
      <!--主地图-->
      <div id="cesiumContainer" :style="{width: mapStore.isDualScreen?'50%':'100%',height: '100%'}"></div>
    </div>
    <div class="locationbar">
      <span>经度:{{ locationData.longitude }}</span>
      <span>纬度:{{ locationData.latitude }}</span>
      <span>层级：{{ locationData.zoom }}</span>
      <span>方向：{{ locationData.heading }}度</span>
      <span>俯仰角：{{ locationData.pitch }}度</span>
      <span>视高：{{ locationData.height }}米</span>
      <span :style="{color:getColorForFPS(parseInt(locationData.fps))}">{{ locationData.fps }}</span>
      <span :style="{color:getColorForLatency(parseInt(locationData.ms))}">{{ locationData.ms }}</span>
    </div>
    <section class="complete-main" v-if="mapStore.isActiveMap">
      <div class="map-reset-toolBtn" @click="mapResetCamera">
        <img src="@/assets/images/cesiumMap/dtfw@2x.png" style="width: 20px"/>
        <div style="font-size: 12px">全图</div>
      </div>
      <router-view v-slot="{ Component, route }">
        <transition name="router-fade" mode="out-in">
          <keep-alive include="[]">
            <component :is="Component" :key="route.fullPath"/>
          </keep-alive>
        </transition>
      </router-view>
    </section>
  </div>
</template>

<script setup lang="ts">
import {onMounted, markRaw, onUnmounted, reactive, toRefs} from "vue";
import {usemapStore} from "@/store/modules/cesiumLastMap"
import {copyUrl, formatToFixed, throttle} from "@/utils/dictionary";
import * as Cesium from "cesium";
import {Viewer} from 'cesium'
import skyBoxBackJpg from "@/assets/images/cesiumMap/lantian/Back.jpg"
import skyBoxDownJpg from "@/assets/images/cesiumMap/lantian/Down.jpg"
import skyBoxFrontJpg from "@/assets/images/cesiumMap/lantian/Front.jpg"
import skyBoxLeftJpg from "@/assets/images/cesiumMap/lantian/Left.jpg"
import skyBoxRightJpg from "@/assets/images/cesiumMap/lantian/Right.jpg"
import skyBoxUpJpg from "@/assets/images/cesiumMap/lantian/Up.jpg"
import {ElMessage} from "element-plus";

const mapStore = usemapStore()

const model = reactive({
  locationData: {
    longitude: "",//经度
    latitude: "",//纬度
    z: "",//海拔
    zoom: 0,
    heading: "",//方向
    pitch: "",//俯仰角
    height: "",//视高
    fps: 0,//帧数
    ms: 0,//ping值
  }
})
const {locationData} = toRefs(model)

onMounted(async () => {
  const rawViewer = await initMap("cesiumContainer") as Viewer
  mapStore.setCesiumViewer(rawViewer);
  mapStore.setIsActiveMap(true)
  mapResetCamera()
})

onUnmounted(() => {
  window.clearInterval(timer)
  const viewer = mapStore.getCesiumViewer();
  if (!viewer) return
  // viewer.scene?.camera.moveStart.removeEventListener(coordinateChange);
  handler.destroy()
  viewer?.destroy()
  mapStore.setCesiumViewer(null);
  mapStore.setIsActiveMap(false)
})

let timer, handler

const initMap = (domId) => new Promise((resolve) => {
  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_APP_ACCESS_KEY
  const viewer = new Cesium.Viewer(domId, {
    animation: false,            // 左下角动画控件（播放/暂停时间轴）
    timeline: false,             // 底部时间轴
    fullscreenButton: false,     // 全屏按钮
    homeButton: false,           // 回到初始视角按钮
    geocoder: false,             // 搜索位置（地名/坐标）
    baseLayerPicker: false,      // 底图选择器（图层切换器，会触发 Cesium Ion）
    sceneModePicker: false,      // 2D/3D/Columbus View 模式切换
    navigationHelpButton: false, // 帮助按钮（提示鼠标/触摸操作）
    infoBox: false,              // 弹出信息框（Entity description）
    selectionIndicator: false,   // 选中实体时的绿色框
    vrButton: false,             // VR 模式按钮
    imageryProvider: false,      // 不加载默认影像（否则会请求 Cesium Ion）
    creditContainer: document.createElement("div") // 自定义版权信息容器（隐藏默认 Cesium logo）
  })
  const rawViewer = markRaw(viewer);
  console.log('Cesium', Cesium.VERSION)
  // 鼠标经纬度提示控件
  coordinateChange()
  // viewer.scene.camera.moveStart.addEventListener(coordinateChange);
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(throttle(coordinateChange, 800), Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  // 帧率,和ping值的计算借助了Cesium中的东西，需要开启debugShowFramesPerSecond
  viewer.scene.debugShowFramesPerSecond = true;
  timer = window.setInterval(() => {
    model.locationData.fps = document.querySelector(".cesium-performanceDisplay-fps")?.innerText || ""
    model.locationData.ms = document.querySelector(".cesium-performanceDisplay-ms")?.innerText || ""
  }, 500)
  // 快速近似抗锯齿
  viewer.scene.postProcessStages.fxaa.enabled = true;
  // 默认打开深度监测   todo
  viewer.scene.globe.depthTestAgainstTerrain = false;
  // 启用相机与地形的碰撞检测
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = true
  // 添加近地天空盒子
  // viewer.scene.skyAtmosphere.show = false;
  // viewer.scene.skyBox = new Cesium.SkyBox({
  //   sources: {
  //     // positiveX: skyBoxRightJpg,
  //     // negativeX: skyBoxLeftJpg,
  //     // positiveY: skyBoxFrontJpg,
  //     // negativeY: skyBoxBackJpg,
  //     // positiveZ: skyBoxUpJpg,
  //     // negativeZ: skyBoxDownJpg
  //     positiveX: `https://file.threehub.cn/` + 'files/cesiumSky/px.png', // 右面
  //     negativeX: `https://file.threehub.cn/` + 'files/cesiumSky/nx.png', // 左面
  //     positiveY: `https://file.threehub.cn/` + 'files/cesiumSky/pz.png', // 将前面用作上面
  //     negativeY: `https://file.threehub.cn/` + 'files/cesiumSky/nz.png', // 将后面用作下面
  //     positiveZ: `https://file.threehub.cn/` + 'files/cesiumSky/py.png', // 将上面用作前面
  //     negativeZ: `https://file.threehub.cn/` + 'files/cesiumSky/ny.png'  // 将下面用作后面
  //   },
  // });
  resolve(rawViewer)
})

const mapResetCamera = () => {
  const viewer = mapStore.getCesiumViewer();
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 2 * 1e4),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0)
    }
  });
}

const coordinateChange = () => {
  const viewer = mapStore.getCesiumViewer();
  if (!viewer) return
  const positionCartographic = viewer.camera.positionCartographic;
  model.locationData.longitude = formatToFixed(Cesium.Math.toDegrees(positionCartographic.longitude), 6);
  model.locationData.latitude = formatToFixed(Cesium.Math.toDegrees(positionCartographic.latitude), 6);
  model.locationData.zoom = heightToZoom(viewer.camera.positionCartographic.height);
  model.locationData.height = viewer.camera.positionCartographic.height.toFixed(1);
  model.locationData.heading = Cesium.Math.toDegrees(viewer.camera.heading).toFixed(0);
  model.locationData.pitch = Cesium.Math.toDegrees(viewer.camera.pitch).toFixed(0);
}

const heightToZoom = (altitude) => {
  const A = 40487.57;
  const B = 0.00007096758;
  const C = 91610.74;
  const D = -40467.74;
  return Math.round(D + (A - D) / (1 + Math.pow(altitude / C, B)));
}
const getColorForFPS = (fps) => {
  switch (true) {
    case fps > 50:
      return 'green'
    case fps > 30:
      return 'orange'
    default:
      return 'red'
  }
}

const getColorForLatency = (ms) => {
  switch (true) {
    case ms <= 50:
      return 'green'
    case ms <= 100:
      return 'yellow'
    case ms <= 200:
      return 'orange'
    default:
      return 'red'
  }
}
</script>

<style lang="scss" scoped>
.map-area {
  display: flex;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.locationbar {
  display: flex;
  justify-content: flex-end;
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 3px 10px;
  font-size: 13px;
  color: #e9e9e9;
  text-shadow: 2px 2px 2px #000;
  background-color: rgba(0, 0, 0, .25);
  pointer-events: none;
  box-sizing: border-box;
  z-index: 0;
  transition: all 0.5s ease-in-out;
  user-select: none;

  &::after {
    content: "";
    position: absolute;
    left: 10px;
    top: 0;
    width: 100px;
    height: 100%;
    background: rgba(32, 32, 32, 1);
    z-index: 1;
  }

  span {
    margin-left: 15px;
  }
}

.complete-main {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
.map-reset-toolBtn {
  pointer-events: auto;
  position: fixed;
  right: 70px;
  bottom: 40px;
  width: 50px;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 5px;
  box-sizing: border-box;
  border-radius: 6px;
  background: rgb(5, 9, 9, 0.5);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(43, 126, 244, .5);
  }
}

.cesium-performanceDisplay {
  display: none;
}
</style>
