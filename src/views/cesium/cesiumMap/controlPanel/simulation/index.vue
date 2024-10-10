<!--/**
* @author: liuk
* @date: 2024-08-22
* @describe:仿真
*/-->
<template>
  <teleport to="body">
    <ul v-show="item.visible"
        v-for="(item,index) in listData" :key="index"
        :class="['surveyStation-popup',`simulationEntityDom${props.isDualMap ? 'DualMap' : ''}${index}`,
        'simulation-popup',item.offsetPopupBoxType,item?.levelOverflow >= 0.01 ? 'waterlevel-overflow' : '']"
        :style="{
            transform: `translate(${item.AABB?.offsetX || 0}px, ${item.AABB?.offsetY ||0}px)`,
            '--img':`url(${item.waterSurface - item.warningWaterLevel >= 0.01?iconTypes['river']['board'][2]:iconTypes['river']['board'][1]})`
         }">
      <li class="title"><span class="label">{{ item.shortLabel }}</span></li>
      <li>
        水位：
        <span class="num">{{ item.waterSurface || 0 }}</span>m
      </li>
      <li>流量：<span class="num">{{ item.flow || 0 }}</span> mm</li>
    </ul>
  </teleport>
  <cplusplus-service/>
</template>

<script lang="ts" setup>
import {nextTick, onMounted, onUnmounted, reactive, toRefs, watch} from "vue";
import iconTypes from "@/views/cesium/cesiumMap/iconTypes"
import {usemapStore} from "@/store/modules/cesiumMap";
import mittBus from "@/utils/mittBus";
// Componenent
import CplusplusService from "./cplusplusService/index.vue"
// Props
const props = defineProps<{
  isDualMap?: boolean
}>()

const mapStore = usemapStore()
const model = reactive({
  listData: []
})
const {listData} = toRefs(model)

onMounted(() => {
  getlist()
  mittBus.emit('toggleLayer', {key: '51', bool: true}) // 开启5cm倾斜模型
  viewer.dataSources.add(simulationDatasource);
  viewer.camera.percentageChanged = 0;
  viewer.scene.camera.changed.addEventListener(showPopupBox);
})

onUnmounted(() => {
  mittBus.emit('toggleLayer', {key: '51', bool: false}) // 关闭5cm倾斜模型
  simulationDatasource.entities.removeAll()
  viewer.dataSources.remove(simulationDatasource);
  viewer.scene.camera.changed.removeEventListener(showPopupBox);
})

watch(()=> mapStore.mapType,()=>{
  simulationDatasource.entities.removeAll()
  getlist()
})



const getlist = () => {
  // model.listData = prolusionStore.poiSections.map(item => ({visible: true, ...item})) || []
  addEntity()
  nextTick(() => showPopupBox())
}

// 地图逻辑
const viewer = props.isDualMap ? mapStore.getDualCesoumViewer() : mapStore.getCesiumViewer();
const simulationDatasource = new Cesium.CustomDataSource("simulation");

const addEntity = () => {
  model.listData.forEach(async (item) => {
    simulationDatasource.entities.add({
      customType: "simulationEntity",
      id: item.index,
      data: item,
      position: Cesium.Cartesian3.fromDegrees(item.longitude, item.latitude, mapStore.mapType === "2d" ? 0 : item.heightZ),
      point: {
        color: Cesium.Color.fromCssColorString("#2ea5ff").withAlpha(1),
        pixelSize: 10,
        clampToGround: true
      },
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    })
  })
}

const offsetPopupBoxOptions = {
  top: [0, -1],
}

const showPopupBox = () => {
  // 碰撞检测
  const {left, top, bottom, right} = viewer.container.getBoundingClientRect()
  const CanvasWidth = parseInt(getComputedStyle(viewer.container).width)
  model.listData.forEach(async (item, index) => {
    let width, height, area
    if (!item.AABB) {
      const dom = document.querySelector(`.simulationEntityDom${props.isDualMap ? 'DualMap' : ''}${index}`)
      width = parseInt(getComputedStyle(dom).width)
      height = parseInt(getComputedStyle(dom).height)
      area = width * height
      item.AABB = {width, height, area: width * height}
    } else {
      width = item.AABB.width
      height = item.AABB.height
      area = item.AABB.area
    }
    const curPosition = Cesium.Cartesian3.fromDegrees(item.longitude, item.latitude, mapStore.mapType === "2d" ? 0 : item.heightZ);
    let x, y;
    try {
      const obj = viewer.scene.cartesianToCanvasCoordinates(curPosition)
      x = obj.x
      y = obj.y
    } catch (e) {
      item.visible = false
    } //todo
    if (!x) return
    if (index === 0) {
      item.offsetPopupBoxType = "top";
      item.AABB.offsetX = x + offsetPopupBoxOptions["top"][0] * width + (props.isDualMap ? CanvasWidth : 0)
      item.AABB.offsetY = y + offsetPopupBoxOptions["top"][1] * height
      item.visible = true
      return
    }
    const offsetPopupBoxKeys = Object.keys(offsetPopupBoxOptions)
    const toChecks = model.listData.slice(0, index) // 需要测试碰撞的单位
    offsetPopupBoxKeys.some((type) => {
      item.offsetPopupBoxType = ""
      item.AABB.offsetX = x + offsetPopupBoxOptions[type][0] * width + (props.isDualMap ? CanvasWidth : 0)
      item.AABB.offsetY = y + offsetPopupBoxOptions[type][1] * height
      const check = toChecks.every(checkItem => {
        const box1 = checkItem.AABB
        const box2 = item.AABB
        let intersectionArea = 0 // 相交面积
        // 计算在每个轴上的重叠部分
        const overlapX = Math.min(box1.offsetX + box1.width, box2.offsetX + box2.width) - Math.max(box1.offsetX, box2.offsetX);
        const overlapY = Math.min(box1.offsetY + box1.height, box2.offsetY + box2.height) - Math.max(box1.offsetY, box2.offsetY);
        // 如果在两个轴上都有重叠，则计算相交区域的面积
        if (overlapX > 0 && overlapY > 0) intersectionArea = overlapX * overlapY;
        return intersectionArea <= area * 0.35;
      });
      if (check) {
        item.offsetPopupBoxType = type
      }
      return check
    })
    switch (true) { // 屏幕边界限制
      case item.AABB.offsetX + width <= right && item.AABB.offsetX >= left && item.AABB.offsetY >= top && item.AABB.offsetY + height <= bottom:
        item.visible = !!item.offsetPopupBoxType;
        break
      default:
        item.visible = false;
        break
    }
  })
}

</script>


<style lang="scss">
.simulation-popup {
  width: 180px;
  height: 180px;
  margin-top: 14px;
  margin-left: -28px;
  padding: 12px 0 0 50px;
  box-sizing: border-box;
  background-color: transparent;
  background-image: var(--img);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center;

  &::before {
    display: none;
  }

  li {
    margin-top: 5px;
    box-sizing: border-box;

    &.title {
      justify-content: center;
      padding-right: 20px;
      font-size: 16px;
      display: flex;
    }

    .label {
      color: #00ff00;
    }

    .num {
      color: orange;
    }
  }


}
</style>