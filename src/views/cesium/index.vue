<template>
  <div class="cesium-container">
    <cesium-map/>
    <div class="showContainer">
      <div class="head_title_arrow">MenuList</div>
      <div class="content">
        <el-tree
            ref="treeRef"
            :data="treeData"
            show-checkbox
            accordion
            @check="checkChange"
            :default-checked-keys="checkedKeys"
            node-key="id"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CesiumMap from "@/views/cesium/cesiumMap/index.vue"
import {nextTick, onMounted, reactive, ref, toRefs} from "vue";
import treeDataJson from "./menuList";

// Refs
const treeRef = ref(null)
const model = reactive({
  treeData: [],
  checkedKeys: [11]
})

const {treeData, checkedKeys} = toRefs(model)

const checkChange = (node, checked) => {
  const isLeaf = !node.children || node.children.length === 0;
  if (!isLeaf) {
    treeRef.value.setChecked(node.id, false, true)
    return;
  }
  if (checked) {
    model.checkedKeys = [];
    model.checkedKeys.push(node.id);
  } else {
    model.checkedKeys = model.checkedKeys.filter(key => key !== node.id);
  }
  treeRef.value.setCheckedKeys(model.checkedKeys);
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