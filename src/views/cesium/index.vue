<template>
  <div class="cesium-container">
    <cesium-map/>
    <div class="showContainer">
      <div class="head_title_arrow">MenuList</div>
      <div class="content">
        <el-tree :data="treeData" accordion default-expand-all @node-click="handleNodeClick">
          <template #default="{data}">
            <span :style="{color:route.name ===data.name?'red':''}">{{ data.label }}</span>
          </template>
        </el-tree>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CesiumMap from "@/views/cesium/cesiumMap/index.vue"
import {onMounted, reactive, toRefs} from "vue";
import treeDataJson from "./menuList";
import {useRouter,useRoute} from "vue-router";

// Refs
const router = useRouter()
const route = useRoute()
const model = reactive({
  treeData: [],
})

const {treeData} = toRefs(model)

const handleNodeClick = (row) => {
  const {name} = row
  if (!name) return
  router.push({name})
}

onMounted(async () => {
  model.treeData = treeDataJson as any
})
</script>

<style lang="scss" scoped>
.cesium-container {
  width: 100%;
  height: 100%;

  .showContainer {
    position: fixed;
    top: 100px;
    left: 20px;
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
    pointer-events: auto;

    .content {
      max-height: 690px;
      margin-top: 10px;
    }
  }
}
</style>