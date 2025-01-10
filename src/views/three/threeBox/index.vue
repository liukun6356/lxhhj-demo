<template>
  <div class="three-box" ref="threeBoxRef"></div>
</template>


<script lang="ts" setup>
import {ref, onMounted, onUnmounted, markRaw} from "vue"
import Stats from 'three/addons/libs/stats.module.js';
import {
  WebGLRenderer,
} from "three";
import {usethreeBoxStore} from "@/store/modules/threeBox"
// Refs
const threeBoxRef = ref(null)

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  const renderer = new WebGLRenderer();
  threeBoxRef.value.appendChild(renderer.domElement)
  threeBoxStore.setRenderer(markRaw(renderer))
  threeBoxStore.setIsActiveRenderer(true)
  const stats = new Stats(); // 性能监视器
  threeBoxRef.value.appendChild(stats.dom);
  threeBoxStore.setPerformanceState(markRaw(stats))
  stats.dom.style.marginTop = "15px"
})

onUnmounted(() => {
  threeBoxStore.setIsActiveRenderer(false)
  threeBoxStore.setRenderer(null)
})

</script>

<style lang="scss" scoped>
.three-box {
  width: 100%;
  height: 100%;
  pointer-events: auto;
}
</style>
