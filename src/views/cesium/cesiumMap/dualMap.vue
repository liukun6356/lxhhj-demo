<!--/**
 * @author: liuk
 * @date: 2024-08-24
 * @describe: 双屏地图实例
 */-->
<template>
  <div id="cesiumContainer2" style="width: 50%;height: 100%;"></div>
  <div class="close_box" @click="closeMap">
    <img src="@/assets/images/cesiumMap/close@2x.png" alt=""/>
    <span>返回</span>
  </div>
  <template v-if="isActiveDualMap">
    <Tdt_img_d isDualMap/>
    <Boundary isDualMap/>
    <CountyBoundaries isDualMap/>
    <DrainageLine isDualMap/>
    <numerical-value v-if="mapStore.curSelectTool === '数值'" isDualMap/>
    <simulation v-if="mapStore.curSelectTool === '仿真'" isDualMap/>
  </template>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap";
import * as mars3d from "mars3d";
import {markRaw, onMounted, onUnmounted, ref} from "vue";
import {copyUrl, formatToFixed} from "@/utils/dictionary";
import {ElMessage} from "element-plus";
import {Viewer} from "cesium";

// Components
import Boundary from "@/views/cesium/component/controlPanel/boundary/index.vue"
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import CountyBoundaries
  from "@/views/cesium/component/controlPanel/layerManagement/administrativeDivision/countyBoundaries.vue"
import DrainageLine from "@/views/cesium/component/controlPanel/layerManagement/drainage/drainageLine.vue"

import NumericalValue from "@/views/cesium/component/controlPanel/numericalValue/index.vue"
import Simulation from "@/views/cesium/component/controlPanel/simulation/index.vue"

const mapStore = usemapStore()
const isActiveDualMap = ref(false)

onMounted(async () => {
  const dualViewer = await initMap("cesiumContainer2") as Viewer
  mapStore.setDualCesoumViewer(dualViewer)
  const viewer = mapStore.getCesiumViewer()
  isActiveDualMap.value = true

  viewer.camera.changed.addEventListener(_map_extentChangeHandler);
  viewer.camera.percentageChanged = 0.01;
  dualViewer.camera.changed.addEventListener(_dualMap_extentChangeHandler);
  dualViewer.camera.percentageChanged = 0.01;
  _map_extentChangeHandler();
})

onUnmounted(() => {
  const viewer = mapStore.getCesiumViewer()
  const dualViewer = mapStore.getDualCesoumViewer()
  viewer.camera.changed.removeEventListener(_map_extentChangeHandler);
  dualViewer.camera.changed.removeEventListener(_dualMap_extentChangeHandler);
  mapStore.getDualCesoumViewer && mapStore.dualCesiumViewer.destroy()
  mapStore.setDualCesoumViewer(null)
})

const closeMap = () => {
  mapStore.setIsDualScreen(false)
}

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
        requestWebgl1: true
      }
    },
    control: {
      baseLayerPicker: false, // basemaps底图切换按钮
      homeButton: false, // 视角复位按钮
      sceneModePicker: false, // 二三维切换按钮
      navigationHelpButton: false, // 帮助按钮
      fullscreenButton: false, // 全屏按钮
    },
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
    // 默认打开深度监测
    viewer.scene.globe.depthTestAgainstTerrain = true;
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
// 双屏交互
const _map_extentChangeHandler = () => {
  const viewer = mapStore.getCesiumViewer();
  const dualViewer = mapStore.getDualCesoumViewer()
  dualViewer.camera.changed.removeEventListener(_dualMap_extentChangeHandler);
  updateView(viewer, dualViewer);
  dualViewer.camera.changed.addEventListener(_dualMap_extentChangeHandler);
}

const _dualMap_extentChangeHandler = () => {
  const viewer = mapStore.getCesiumViewer();
  const dualViewer = mapStore.getDualCesoumViewer()
  viewer.camera.changed.removeEventListener(_map_extentChangeHandler);
  updateView(dualViewer, viewer);
  viewer.camera.changed.addEventListener(_map_extentChangeHandler);
}

//“变化屏”viewerChange变化，将“被更新屏”viewerUpdate同步更新
const updateView = (viewerChange, viewerUpdate) => {
  // 获取当前相机位置
  const positionCartographic = viewerChange.camera.positionCartographic;
  const longitude = Cesium.Math.toDegrees(positionCartographic.longitude);
  const latitude = Cesium.Math.toDegrees(positionCartographic.latitude);
  const height = positionCartographic.height;
  // 获取当前相机方向
  const heading = Cesium.Math.toDegrees(viewerChange.camera.heading);
  const pitch = Cesium.Math.toDegrees(viewerChange.camera.pitch);
  const roll = Cesium.Math.toDegrees(viewerChange.camera.roll);
  viewerUpdate.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
    orientation: {
      heading: Cesium.Math.toRadians(heading),
      pitch: Cesium.Math.toRadians(pitch),
      roll: Cesium.Math.toRadians(roll)
    }
  });
}
</script>

<style lang="scss" scoped>

.close_box {
  display: flex;
  align-items: start;
  position: absolute;
  top: 70px;
  right: 55px;
  padding: 3px 5px;
  cursor: pointer;
  border-radius: 5px;
  background: #2DA4FE;
  z-index: 8;

  img {
    width: 20px;
    height: 18px;
  }

  span {
    margin-left: 5px;
    font-size: 16px;
    font-family: SourceHanSansCN-Regular, SourceHanSansCN;
    font-weight: 400;
    color: #ffffff;
  }
}
</style>
