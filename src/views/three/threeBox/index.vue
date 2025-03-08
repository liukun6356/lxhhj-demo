<template>
  <div class="three-box" ref="threeBoxRef"></div>
</template>


<script lang="ts" setup>
import {ref, onMounted, onUnmounted, markRaw} from "vue"
import Stats from 'three/addons/libs/stats.module.js';
import {PerspectiveCamera, Scene, WebGLRenderer,} from "three";
import {usethreeBoxStore} from "@/store/modules/threeBox"
// Refs
const threeBoxRef = ref(null)

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.z = 1400;
  scene = new Scene();
  const renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(threeBoxRef.value.offsetWidth, threeBoxRef.value.offsetHeight);
  renderer.render(scene, camera);
  threeBoxRef.value.appendChild(renderer.domElement)
  threeBoxStore.setRenderer(markRaw(renderer))
  threeBoxStore.setIsActiveRenderer(true)
  addPerformance()
})

onUnmounted(() => {
  threeBoxStore.setIsActiveRenderer(false)
  threeBoxStore.setRenderer(null)
})

// 场景逻辑
let camera, scene

const addPerformance = () =>{
  const stats = new Stats(); // 性能监视器
  threeBoxRef.value.appendChild(stats.dom);
  threeBoxStore.setPerformanceState(markRaw(stats))
  stats.setMode(0) // 0: fps, 1: ms, 2: mb
  stats.dom.style.top = "calc(100vh - 53px)"
  stats.dom.style.left = "5px"
}

</script>

<style lang="scss" scoped>
.three-box {
  width: 100%;
  height: 100%;
  pointer-events: auto;
}
</style>
