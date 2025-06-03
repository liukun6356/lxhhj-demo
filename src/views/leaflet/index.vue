<template>
  <div class="leaflet-container">
    <div class="showContainer">
      <div class="head_title_arrow">MenuList</div>
      <div class="content">
        <el-tree :data="route.matched[0].children"
                 :filter-node-method="(_,data)=>!data.meta.noShow"
                 :props="{ children: 'children', label: 'name' }"
                 accordion
                 :default-expanded-keys="[route.matched[0].children[0].name]"
                 node-key="name"
                 @node-click="handleNodeClick">
          <template #default="{ data }">
            <span :style="{color:route.name.includes(data.name)?'rgb(255, 187, 31)':''}">{{ data.meta.title }}</span>
          </template>
        </el-tree>
      </div>
    </div>
    <section class="complete-main" >
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
.leaflet-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  pointer-events: auto;

  .complete-main {
    display: flex;
    justify-content: center;
    align-items: center;

    width: 600px;
    height: 500px;
    background: rgba(204, 204, 204, 1);
  }

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
    border-radius: 4px;
    pointer-events: auto;

    .content {
      max-height: 690px;
      margin-top: 10px;
    }
  }
}
</style>
