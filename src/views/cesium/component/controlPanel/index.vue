<!--地图工具栏-->
<template>
  <div class="controlPanel-wrap">
    <!-- <div class="topTool">-->
    <!--   <div v-for="(item, index) in topToolList" :key="index" class="toolBtn topBtn"-->
    <!--        :class="{ active: mapStore.mapType === item.label }" @click="topToolActive(item.label)">-->
    <!--     <img :src="item.src" style="width: 20px"/>-->
    <!--     <div style="font-size: 12px">{{ item.label }}</div>-->
    <!--   </div>-->
    <!-- </div>-->
    <div class="rightTool">
      <div v-for="(item, index) in rightToolList2" :key="index" class="toolBtn topBtn"
           :class="{ select: mapStore.curSelectTool === item.label }" @click="topToolSelectRightTool(item)">
        <img :src="item.src"/>
        <div>{{ item.label }}</div>
      </div>
      <!-- 反遮罩-->
      <Boundary v-if="boundaryShow"/>
      <!-- 概化图-->
      <Teleport to="body">
        <diagram v-if="diagramShow" @close="diagramShow=false"/>
      </Teleport>
      <data-panel3d v-show="mapStore.curSelectTool === '图层'"/>
      <!-- <Teleport to="body">-->
      <!--   <Legend v-if="mapStore.curSelectTool === '图例'"/>-->
      <!-- </Teleport>-->
      <map-scene v-if="mapStore.curSelectTool === '环境'"/>
      <!-- <roam v-if="mapStore.curSelectTool === '漫游'"/>-->
      <!-- <simulate v-if="mapStore.curSelectTool === '模拟'"/>-->
      <numerical-value v-if="mapStore.curSelectTool === '数值'"/>
      <!-- <simulation v-if="mapStore.curSelectTool === '仿真'"/>-->
    </div>
  </div>
</template>

<script lang="ts" setup>
import twoD from '@/assets/images/cesiumMap/2D@2x.png'
import threeD from '@/assets/images/cesiumMap/3D@2x.png'
import ghtPng from "@/assets/images/cesiumMap/ght@2x.png"
import tc from '@/assets/images/cesiumMap/tc@2x.png'
import tl from '@/assets/images/cesiumMap/tl@2x.png'
import gj from '@/assets/images/cesiumMap/gj@2x.png'
import my from '@/assets/images/cesiumMap/my@2x.png'
import fz from '@/assets/images/cesiumMap/fzmn.png'
import dt from '@/assets/images/cesiumMap/dtfw@2x.png'
import sz from '@/assets/images/cesiumMap/sz@2x.png'
import {computed, nextTick, onMounted, onUnmounted, reactive, toRefs, ref} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import mittBus from "@/utils/mittBus";
import {useRoute} from "vue-router";
import {ElMessage} from "element-plus";
import * as mars3d from "mars3d";

// Components
import Boundary from "./boundary/index.vue"
import DataPanel3d from "./layerManagement/index.vue"
import MapScene from "./mapScene/index.vue"
import Legend from "./legend.vue"
import Roam from "./roam.vue"
import Diagram from "./diagram.vue"
import NumericalValue from "./numericalValue/index.vue"
import Simulate from "./simulate/index.vue"
import Simulation from "./simulation/index.vue"

const route = useRoute()
const rightToolList2 = computed(() => {
  return [
    {label: '图层', src: tc},
    {label: '图例', src: tl},
    {label: '环境', src: gj},
    {label: '漫游', src: my},
    {label: '模拟', src: fz},
    {label: '全图', src: dt},
  ]
})
const model = reactive({
  boundaryShow: false,// 返遮罩层显隐
  diagramShow: false,//概化图显隐
  mapPointList: [],//地图重叠站点列表
  showPopup: false,
  popupPos: {
    left: '',
    top: ''
  },
})
const {boundaryShow, diagramShow} = toRefs(model)

// onMounted(() => {
//   model.boundaryShow = true
//   nextTick(() => {
//     resetCamera({type: "2d"})
//   })
//   mittBus.on('toggmap2dOr3d', toggmap2dOr3dMittBusFn)
//   mittBus.on('resetControlPanel', topToolSelectRightTool)
//   mittBus.on('mapResetCamera', resetCamera)
// })

onUnmounted(() => {
  mittBus.off('toggmap2dOr3d', toggmap2dOr3dMittBusFn)
  mittBus.off('resetControlPanel', topToolSelectRightTool)
  mittBus.off('mapResetCamera', resetCamera)
})

const toggmap2dOr3dMittBusFn = ({type}) => {
  if (!["2d", "3d"].includes(type)) return
  resetCamera({type})
}

const topToolSelectRightTool = (item) => {
  if (item?.label === '全图') {
    resetCamera()
    return
  }
  mapStore.setCurSelectTool(mapStore.curSelectTool === item?.label ? "" : item?.label)
}

const topToolActive = (type) => {
  if (type === '概化图') {
    model.diagramShow = true
    return
  }
  resetCamera({type})
}

const topToolList = [
  {label: '概化图', src: ghtPng},
  {label: '2d', src: twoD},
  {label: '3d', src: threeD}
]

// 地图逻辑
const mapStore = usemapStore()
const viewer = mapStore.getCesiumViewer();
const resetCamera = async (obj?: any) => {
  const type = obj?.type || mapStore.mapType
  mapStore.setMapType(type)
  switch (type) {
    case "2d":
      if (viewer.terrainProvider.isFlag) {
        viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider()
        if (mapStore.getDualCesoumViewer()) mapStore.getDualCesoumViewer().scene.terrainProvider = new Cesium.EllipsoidTerrainProvider()
      }

      viewer.scene.screenSpaceCameraController.enableTilt = false;
      if (mapStore.getDualCesoumViewer()) mapStore.getDualCesoumViewer().scene.screenSpaceCameraController.enableTilt = false;
      // scene.screenSpaceCameraController.enableRotate = false;
      // Cesium.MouseOperationController._rotationLock = true;
      viewer.camera.flyTo({
        destination: obj?.destination2d || new Cesium.Cartesian3.fromDegrees(113.048936, 25.755645, 77805.77),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: Cesium.Math.toRadians(0),
        },
        duration: 2,
      })
      mittBus.emit('toggleLayer', {key: '5', bool: false})
      break
    case "3d":
      if (!viewer.terrainProvider.isFlag && mapStore.curSelectTool !== "数值") {
        const terrainProvider = await mars3d.LayerUtil.createTerrainProvider({
          url: import.meta.env.VITE_APP_TERRAIN_URL,
        })
        viewer.scene.terrainProvider = terrainProvider;
        viewer.scene.terrainProvider.isFlag = true
        if (mapStore.getDualCesoumViewer()) mapStore.getDualCesoumViewer().scene.terrainProvider = terrainProvider
      }
      viewer.scene.screenSpaceCameraController.enableTilt = true;
      if (mapStore.getDualCesoumViewer()) mapStore.getDualCesoumViewer().scene.screenSpaceCameraController.enableTilt = true;
      // scene.screenSpaceCameraController.enableRotate = true;
      // Cesium.MouseOperationController._rotationLock = false;
      viewer.camera.flyTo({
        destination: obj?.destination3d || new Cesium.Cartesian3.fromDegrees(112.986319, 25.250485, 56587.05),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45.5),
          roll: Cesium.Math.toRadians(360),
        },
        duration: 2,
      })
      break
  }
}
</script>

<style lang="scss" scoped>
.controlPanel-wrap {
  display: flex;
  flex-direction: column;
  align-items: end;
  position: fixed;
  top: 110px;
  right: 20px;
  width: 200px;
  height: 400px;
  transition: all 0.5s ease-in-out;
  user-select: none;
  z-index: 8;
  pointer-events: auto;

  .topTool {
    display: flex;
    justify-content: space-between;
    width: 100px;
    margin-left: 80px;
    color: #fff;
    padding: 5px;
    box-sizing: border-box;
    border-radius: 6px;
    background: rgb(5, 9, 9, 0.5);
    backdrop-filter: blur(2px);

    .toolBtn {
      width: 48px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;

      &:nth-child(1) {
        position: absolute;
        left: -70px;

        &::after {
          content: "";
          position: absolute;
          left: 0;
          top: -5px;
          width: 50px;
          height: 50px;
          border-radius: 6px;
          background: rgb(5, 9, 9, 0.5);
          z-index: -1;
        }
      }
    }

    .topBtn {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      &.active {
        background: rgba(43, 126, 244, .8);
      }
    }
  }

  .rightTool {
    width: 50px;
    margin-top: -8px;
    padding: 2px;
    padding-bottom: 10px;
    border-radius: 6px;
    background: rgba(5, 9, 9, 0.8);
    backdrop-filter: blur(2px);

    & > .toolBtn {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: 48px;
      height: 40px;
      margin-top: 10px;
      font-size: 13px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #ffffff;
      line-height: 1;
      border-radius: 2px;
      border: 1px solid transparent;
      cursor: pointer;

      img {

        width: 14px;
        height: 14px;
      }

      div {
        margin-top: 5px;
      }
    }

    .select {
      background: rgba(46, 165, 255, 0.6);
      border-radius: 2px;
      border: 1px solid #2ea5ff;
      transition: all 0.2s ease-in-out;
    }
  }
}

</style>
<style lang="scss">
// 全局过过渡
.global_transition-enter-select,
.global_transition-leave-select {
  transition: opacity 0.3s ease;
}

.global_transition-enter-from,
.global_transition-leave-to {
  opacity: 0;
}

//带箭头的title
.head_title_arrow {
  font-size: 16px;
  /*   font-family: PingFang SC Regular; */
  font-weight: 400;
  color: #ffffff;
  position: relative;
  padding-left: 15px;

  &::before {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 14px;
    background: url('@/assets/images/cesiumMap/zs@2x.png');
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }
}
</style>