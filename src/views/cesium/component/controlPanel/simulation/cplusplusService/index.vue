<!-- 洪水仿真淹没效果 - c++服务接入 -->
<template>

</template>

<script lang="ts" setup>
import {LoadWater} from './LoadWater';
import {onMounted, onUnmounted, watch} from "vue";
import moment from "moment"

onMounted(() => {
  // 默认打开深度监测
  viewer.scene.globe.depthTestAgainstTerrain = false;
  // addWaterModel()
})

onUnmounted(() => {
  load_water?.remove_model();
  load_water = null;
  viewer.scene.globe.depthTestAgainstTerrain = true;
})

const addWaterModel = () =>{
  if(!prolusionStore.planId)return
  if (load_water) {
    load_water.remove_model();
    load_water = null;
  }
  load_water = new LoadWater(import.meta.env.VITE_CPLUSPLUS_API)
  load_water.load_history_data(prolusionStore.planId, viewer);
}

watch(()=>prolusionStore.planId,()=>{
  addWaterModel()
})


// 地图逻辑
import {usemapStore} from "@/store/modules/cesiumMap";
import {useprolusionStore} from "@/store/modules/prolusion";

const mapStore = usemapStore()
const viewer = mapStore.getCesiumViewer();

let load_water
</script>

<style lang="scss" scoped></style>