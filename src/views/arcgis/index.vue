<template>
  <div class="arcgis-container">
    <div class="showContainer">
      <div class="head_title_arrow">MenuList</div>
      <div class="content">
        <el-tree :data="treeData" accordion default-expand-all @node-click="handleNodeClick">
          <template #default="{data}">
            <span :style="{color:route.name ===data.name?'#FFBB1F':''}">{{ data.label }}</span>
          </template>
        </el-tree>
      </div>
    </div>
    <arcgis-map/>
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

<script lang="ts" setup>
import {onMounted, reactive, toRefs} from "vue";
import {useRouter, useRoute} from "vue-router";
import treeDataJson from "./menuList";
// Component
import ArcgisMap from "./arcgisMap/index.vue"
import {usemapStore} from "@/store/modules/arcgisMap";

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

// 地图逻辑
const mapStore = usemapStore()
</script>

<style lang="scss" scoped>
.arcgis-container {
  width: 100%;
  height: 100%;
  pointer-events: auto;

  .complete-main {
    width: 100%;
    height: 100%;
  }

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
