<template>
  <div class="map-operation-wrap">
    <el-tooltip :content="item.label" placement="left-start" v-for="item in mapOperationImgs" :key="item.label">
      <div :class="[item.select ? 'select' : '','icon-wrap']">
        <div class="icon" @click="mapOperationClick(item)"></div>
      </div>
    </el-tooltip>
  </div>
</template>

<script lang="ts" setup>
import {ref} from "vue"
import {usemapStore} from "@/store/modules/cesiumMap";
// Emits
const emit = defineEmits(["changeMapType"])

const mapStore = usemapStore()
const mapOperationImgs = ref([
  {label: '系统供热地图', select: true},
  {label: '系统热网地图', select: false},
  {label: '放大',},
  {label: '缩小',},
  {label: '定位',}
])
const mapOperationClick = (item) => {
  let curZoom
  switch (item.label) {
    case '系统供热地图':
      emit("changeMapType", 1);
      item.select = true;
      mapOperationImgs.value[1].select = false
      break;
    case '系统热网地图':
      emit("changeMapType", 2);
      item.select = true;
      mapOperationImgs.value[0].select = false
      break;
    case '放大':
      curZoom = Cesium.Cartographic.fromCartesian(viewer.camera.position).height
      if (curZoom - 30000 < 0) return
      viewer.scene.camera.zoomIn(30000);
      break;
    case '缩小':
      viewer.scene.camera.zoomOut(80000);
      break;
    case '定位':

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(125.251927, 43.904866, 50000),
        orientation: {
          heading: 0,
          pitch: -1.5,
          roll: 0
        },
        duration: 2
      });
      break;
  }
}
// 地图逻辑
const viewer = mapStore.getCesiumViewer()
</script>

<style lang="scss" scoped>
.map-operation-wrap {
  position: fixed;
  top: 50%;
  right: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transform: translateY(-50%);
  width: 32px;
  opacity: 0.95;
  background: transparent;
  pointer-events: auto;

  .icon-wrap {
    margin-bottom: 3px;
    border-radius: 4.5px;
    border: 1px solid transparent;
    background-color: #393939;
    box-sizing: border-box;

    &.select {
      border: 1px solid #FFBE06;

      .icon {
        background-color: #FFBE06;
      }
    }

    &:nth-child(1) {
      .icon {
        mask: url('@/assets/images/buildingProgression/heat-power.svg') no-repeat center/25px 25px;
      }
    }

    &:nth-child(2) {
      .icon {
        mask: url('@/assets/images/buildingProgression/heat-network.svg') no-repeat center/25px 25px;
      }
    }

    &:nth-child(3) {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      margin-bottom: 1px;

      .icon {
        mask: url('@/assets/images/buildingProgression/u4914.svg') no-repeat center/20px 20px;
      }
    }

    &:nth-child(4) {
      border-top-left-radius: 0;
      border-top-right-radius: 0;

      .icon {
        mask: url('@/assets/images/buildingProgression/u4911.svg') no-repeat center/18px 2px;
      }
    }

    &:nth-child(5) {
      .icon {
        mask: url('@/assets/images/buildingProgression/u4907.svg') no-repeat center/20px 20px;
      }
    }

    .icon {
      width: 32px;
      height: 32px;
      background: #fff;
    }
  }

}
</style>
