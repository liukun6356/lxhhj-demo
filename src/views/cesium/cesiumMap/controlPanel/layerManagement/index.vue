<!--/**
* @author: liuk
* @date: 2024-07-14
* @describe:图层管理
*/-->
<template>
  <div class="showContainer">
    <div class="head_title_arrow">图层管理</div>
    <div class="content">
      <el-tree
          ref="treeRef"
          :data="treeData"
          show-checkbox
          @check-change="checkChange"
          :default-expanded-keys="[]"
          :default-checked-keys="[11,21,41]"
          node-key="id"/>
    </div>

    <Tdt_img_d v-if="showTypeList.includes('img_d')"/>
    <Tdt_img_z v-if="showTypeList.includes('img_z')"/>
    <Tdt_vec_d v-if="showTypeList.includes('vec_d')"/>
    <Tdt_vec_z v-if="showTypeList.includes('vec_z')"/>
    <Tdt_ter_d v-if="showTypeList.includes('ter_d')"/>
    <Tdt_ter_z v-if="showTypeList.includes('ter_z')"/>

    <CountyBoundaries v-if="showTypeList.includes('county_boundaries')"/>
    <TownshipBoundary v-if="showTypeList.includes('townshipBoundary')"/>

    <CatchmentLine v-if="showTypeList.includes('catchmentLine')"/>
    <SubbasinZoning v-if="showTypeList.includes('subbasinZoning')"/>

    <DrainageLine v-if="showTypeList.includes('drainageLine')"/>

    <CentralCity5cm v-if="showTypeList.includes('centralCity5cm')"/>
    <RiverReservoir3cm v-if="showTypeList.includes('riverReservoir3cm')"/>
    <SiqingReservoir3cm v-if="showTypeList.includes('siqingReservoir3cm')"/>
    <XianlingReservoir3cm v-if="showTypeList.includes('xianlingReservoir3cm')"/>
    <WangxianhuDam3cm v-if="showTypeList.includes('wangxianhuDam3cm')"/>
    <Suxianhudam3cm v-if="showTypeList.includes('suxianhudam3cm')"/>
    <SuXianqiao3cm v-if="showTypeList.includes('suXianqiao3cm')"/>
    <Suyuanqiao3cm v-if="showTypeList.includes('suyuanqiao3cm')"/>
    <EastStreetBridge3cm v-if="showTypeList.includes('eastStreetBridge3cm')"/>

    <RainfallStation v-if="showTypeList.includes('rainfallStation')"/>
    <RiverStation v-if="showTypeList.includes('riverStation')"/>
    <ReservoirStation v-if="showTypeList.includes('reservoirStation')"/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, ref, toRefs} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import mittBus from "@/utils/mittBus";
import {useRoute} from 'vue-router';
// 基础图层树
import treeDataJson from './panelConfig.ts';
// 基础地图
import Tdt_img_d from "./basicMap/tdt_img_d.vue"
import Tdt_img_z from "./basicMap/tdt_img_z.vue"
import Tdt_vec_d from "./basicMap/tdt_vec_d.vue"
import Tdt_vec_z from "./basicMap/tdt_vec_z.vue"
import Tdt_ter_d from "./basicMap/tdt_ter_d.vue"
import Tdt_ter_z from "./basicMap/tdt_ter_z.vue"
// 行政区划
import CountyBoundaries from "./administrativeDivision/countyBoundaries.vue"
import TownshipBoundary from "./administrativeDivision/townshipBoundary.vue"
// 流域分区
import CatchmentLine from "./basinZoning/catchmentLine.vue"
import SubbasinZoning from "./basinZoning/subbasinZoning.vue"
// 水系
import DrainageLine from "./drainage/drainageLine.vue"
// 倾斜模型
import CentralCity5cm from "./tiltModel/centralCity5cm.vue"
import RiverReservoir3cm from "./tiltModel/riverReservoir3cm.vue"
import SiqingReservoir3cm from "./tiltModel/siqingReservoir3cm.vue"
import XianlingReservoir3cm from "./tiltModel/xianlingReservoir3cm.vue"
import WangxianhuDam3cm from "./tiltModel/wangxianhuDam3cm.vue"
import Suxianhudam3cm from "./tiltModel/suxianhudam3cm.vue"
import SuXianqiao3cm from "./tiltModel/suXianqiao3cm.vue"
import Suyuanqiao3cm from "./tiltModel/suyuanqiao3cm.vue"
import EastStreetBridge3cm from "./tiltModel/eastStreetBridge3cm.vue"

// 测站
import RainfallStation from "./surveyStation/rainfallStation/index.vue"
import ReservoirStation from "./surveyStation/reservoirStation/index.vue"
import RiverStation from "./surveyStation/riverStation/index.vue"

// Refs
const treeRef = ref(null)

const mapStore = usemapStore()
const route = useRoute()
const model = reactive({
  treeData: [],
  showTypeList: ['img_d', 'county_boundaries', "drainageLine"],
})

const {treeData, showTypeList} = toRefs(model)

onMounted(async () => {
  model.treeData = treeDataJson as any
  mittBus.on('toggleLayer', mittBusFn)
})

onUnmounted(() => {
  mittBus.off('toggleLayer', mittBusFn)
})

const mittBusFn = (obj) => {
  const {key, bool} = obj
  setChecked(key, bool)
}

const checkChange = (node) => {
  if (node.children) node.children.forEach(item => checkChange(item))
  if (treeRef.value.getCheckedNodes().find(item => item.type === node.type)) {
    model.showTypeList.includes(node.type) || model.showTypeList.push(node.type)
  } else {
    const index = model.showTypeList.indexOf(node.type)
    if (index < 0) return
    model.showTypeList.splice(index, 1)
  }
}

const setChecked = (key, bool) => treeRef.value && treeRef.value.setChecked(key, bool, true)
</script>

<style lang="scss" scoped>
.showContainer {
  position: absolute;
  top: 10px;
  right: 65px;
  font-size: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  color: white;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  overflow: auto;
  width: 220px;
  border-radius: 4px;

  .content {
    max-height: 690px;
    margin-top: 10px;
  }
}
</style>