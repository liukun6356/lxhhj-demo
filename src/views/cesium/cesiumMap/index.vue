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
      <!--双屏地图-->
      <dual-map v-if="mapStore.isDualScreen"/>
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
import * as mars3d from "mars3d"
import {onMounted, markRaw, onUnmounted, reactive, toRefs, watch, nextTick} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap.ts"
import {copyUrl, formatToFixed, throttle} from "@/utils/dictionary";
import {Viewer} from 'cesium'
import skyBoxBackJpg from "@/assets/images/cesiumMap/lantian/Back.jpg"
import skyBoxDownJpg from "@/assets/images/cesiumMap/lantian/Down.jpg"
import skyBoxFrontJpg from "@/assets/images/cesiumMap/lantian/Front.jpg"
import skyBoxLeftJpg from "@/assets/images/cesiumMap/lantian/Left.jpg"
import skyBoxRightJpg from "@/assets/images/cesiumMap/lantian/Right.jpg"
import skyBoxUpJpg from "@/assets/images/cesiumMap/lantian/Up.jpg"
// Components
import DualMap from "./dualMap.vue"

import {ElMessage} from "element-plus";

const mapStore = usemapStore()

const model = reactive({
  activeMap: false,
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
const {activeMap, locationData} = toRefs(model)

onMounted(async () => {
  const rawViewer = await initMap("cesiumContainer") as Viewer
  mapStore.setCesiumViewer(rawViewer);
  mapStore.setIsActiveMap(true)
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
  new mars3d.Map(domId, {
    scene: {
      center: {lng: 113.064211, lat: 25.709959, alt: 80124.08, "heading": 357, "pitch": -86.9, "roll": 0},
      showSun: true,
      showMoon: true,
      showSkyBox: true,
      showSkyAtmosphere: false, // 关闭球周边的白色轮廓 map.scene.skyAtmosphere = false
      fog: true,
      fxaa: true,
      globe: {
        showGroundAtmosphere: false, // 关闭大气（球表面白蒙蒙的效果）
        depthTestAgainstTerrain: false,
        baseColor: "#546a53"
      },
      cameraController: {
        zoomFactor: 3.0,
        minimumZoomDistance: 1,
        maximumZoomDistance: 50000000,
        enableRotate: true,
        enableZoom: true
      },
      contextOptions: {
        requestWebgl1: false
      }
    },
    control: {
      baseLayerPicker: false, // basemaps底图切换按钮
      homeButton: false, // 视角复位按钮
      sceneModePicker: false, // 二三维切换按钮
      navigationHelpButton: false, // 帮助按钮
      fullscreenButton: false, // 全屏按钮
    },
    contextOptions: {
      webgl: {
        // preserveDrawingBuffer: true, //允许canvas 截图
      },
    }
  }).on(mars3d.EventType.load, async (e) => {
    const viewer = e.target
    const rawViewer = markRaw(viewer);
    resolve(rawViewer)
    // 默认加载郴州地形
    const terrainProvider = await mars3d.LayerUtil.createTerrainProvider({
      url: import.meta.env.VITE_APP_GISDATA + "/cz/dem/chenzhouDem",
    })
    viewer.scene.terrainProvider = terrainProvider;
    viewer.scene.terrainProvider.isFlag = true
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
    // 默认打开深度监测   todo
    viewer.scene.globe.depthTestAgainstTerrain = true;
    // 启用相机与地形的碰撞检测
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true
    // 添加近地天空盒子
    viewer.scene.skyBox = new mars3d.GroundSkyBox({
      sources: {
        positiveX: skyBoxRightJpg,
        negativeX: skyBoxLeftJpg,
        positiveY: skyBoxFrontJpg,
        negativeY: skyBoxBackJpg,
        positiveZ: skyBoxUpJpg,
        negativeZ: skyBoxDownJpg
      },
    });

    // 完善右键方法
    const defaultContextmenuItems = viewer.getDefaultContextMenu()
    defaultContextmenuItems.shift()//  去除 查看此处坐标
    defaultContextmenuItems[0].callback = () => { // 查看当前视角
      // 获取当前相机位置
      const positionCartographic = viewer.camera.positionCartographic;
      const longitude = Cesium.Math.toDegrees(positionCartographic.longitude);
      const latitude = Cesium.Math.toDegrees(positionCartographic.latitude);
      const height = positionCartographic.height;
      // 获取当前相机方向
      const heading = Cesium.Math.toDegrees(viewer.camera.heading);
      const pitch = Cesium.Math.toDegrees(viewer.camera.pitch);
      const roll = Cesium.Math.toDegrees(viewer.camera.roll);
      const viewParams = {
        x: formatToFixed(longitude, 6),
        y: formatToFixed(latitude, 6),
        z: formatToFixed(height, 2),
        heading: formatToFixed(heading, 0),
        pitch: formatToFixed(pitch, 1),
        roll: formatToFixed(roll, 0)
      };
      ElMessage.info(JSON.stringify(viewParams))
      copyUrl(JSON.stringify(viewParams))
    }

    viewer.bindContextMenu(defaultContextmenuItems)
  })
})

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
.cesium-performanceDisplay {
  display: none;
}
</style>
