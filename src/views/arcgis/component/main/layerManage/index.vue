<!--/**
* @author: liuk
* @date: 2024-07-14
* @describe:图层管理
*/-->
<template>
  <div class="layerManage-wrap">
    <div class="head_title_arrow">图层管理</div>
    <div class="content">
      <el-tree
          ref="treeRef"
          :data="treeData"
          show-checkbox
          @check-change="checkChange"
          :default-expanded-keys="[2]"
          :default-checked-keys="[11]"
          node-key="id"/>
    </div>
    <Tdt_img_d v-if="showTypeList.includes('img_d')"/>
    <Tdt_img_z v-if="showTypeList.includes('img_z')"/>
    <Tdt_vec_d v-if="showTypeList.includes('vec_d')"/>

    <mult-pipeline v-if="showTypeList.includes('multPipline')"/>
    <mult-node v-if="showTypeList.includes('multNode')"/>
    <mul-waterwork v-if="showTypeList.includes('multWaterWork')"/>
    <teleport to="body">
      <scene-editing/>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, ref, toRefs} from "vue";
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import mittBus from "@/utils/mittBus";
import {useRoute} from 'vue-router';
// 基础图层树
import treeDataJson from './panelConfig.ts';
// Component
// 基础地图
import Tdt_img_d from "./basicMap/tdt_img_d.vue"
import Tdt_img_z from "./basicMap/tdt_img_z.vue"
import Tdt_vec_d from "./basicMap/tdt_vec_d.vue"

import MultPipeline from "./water/multPipeline.vue"
import MultNode from "./water/multNode.vue"
import MulWaterwork from "./water/mulWaterwork.vue"
import SceneEditing from "./water/sceneEditing.vue"

// Refs
const treeRef = ref(null)

const mapStore = usearcgisMapStore()
const route = useRoute()
const model = reactive({
  treeData: [],
  showTypeList: ['img_d'],
})

const {treeData, showTypeList} = toRefs(model)

onMounted(async () => {
  viewer.goTo({
    center: [109.217583, 23.733192], // 示例经纬度（广州）
    zoom: 13
  })
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

// 地图逻辑
const viewer = mapStore.getArcgisViewer();
</script>

<style lang="scss" scoped>
.layerManage-wrap {
  position: fixed;
  top: 110px;
  right: 20px;
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
