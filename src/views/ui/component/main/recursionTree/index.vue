<template>
  <div class="recursionTree-wrap">
    <tree-chart :json="jsonData"/>
  </div>
</template>

<script lang="ts" setup>
import jsonData from "./data"
// Conponents
import TreeChart from "./treeChart.vue"
</script>

<style lang="scss" scoped>
.recursionTree-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 500px;
  height: max-content;
}
</style>
