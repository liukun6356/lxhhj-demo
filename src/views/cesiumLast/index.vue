<template>
  <div class="cesium-container">
    <cesium-map/>
    <div class="showContainer">
      <div class="head_title_arrow">MenuList</div>
      <div class="content">
        <el-tree :data="route.matched[0].children"
                 :filter-node-method="(_,data)=>!data.meta.noShow"
                 :props="{ children: 'children', label: 'name' }"
                 accordion
                 :default-expanded-keys="[route.matched[1].name]"
                 node-key="name"
                 @node-click="handleNodeClick">
          <template #default="{ data }">
            <span :style="{color:route.name.includes(data.name)?'rgb(255, 187, 31)':''}">{{ data.meta.title }}</span>
          </template>
        </el-tree>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CesiumMap from "@/views/cesiumLast/cesiumMap/index.vue"
import {useRouter, useRoute} from "vue-router";

// Refs
const router = useRouter()
const route = useRoute()

const handleNodeClick = (row) => {
  if (row.children) {
    handleNodeClick(row.children[0])
    return
  }
  const {name} = row
  if (!name) return
  router.push({name})
}
</script>

<style lang="scss" scoped>
.cesium-container {
  width: 100%;
  height: 100%;

  .showContainer {
    position: fixed;
    top: 100px;
    left: 20px;
    max-height: 50vh;
    font-size: 12px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    color: white;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    overflow: auto;
    width: 220px;
    height: 340px;
    border-radius: 4px;
    pointer-events: auto;

    .content {
      height: calc(100% - 25px);
      overflow-y: auto;
      margin-top: 10px;
    }
  }
}
</style>
