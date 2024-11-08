<template>
  <div>
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted} from "vue";
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

onMounted(() => {
  console.log(211)
})

</script>

<style lang="scss" scoped></style>