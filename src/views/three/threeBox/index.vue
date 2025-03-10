<template>
  <div id="three-box"  ref="threeBoxRef"></div>
</template>


<script lang="ts" setup>
import {ref, onMounted, onUnmounted, markRaw} from "vue"
import Stats from 'three/addons/libs/stats.module.js';
import {CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer.js";
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
  threeBoxStore.setIsActiveRenderer(true)
  threeBoxStore.setRenderer(markRaw(renderer))

  const labelRenderer = new CSS2DRenderer(); //使用HTML渲染器
  labelRenderer.setSize(threeBoxRef.value.offsetWidth, threeBoxRef.value.offsetHeight);
  threeBoxRef.value.appendChild(labelRenderer.domElement)
  labelRenderer.domElement.className = 'labelRenderer'
  labelRenderer.domElement.style.position = 'fixed';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
  labelRenderer.domElement.style.zIndex = '0';//设置层级
  labelRenderer.domElement.style.pointerEvents = 'none';
  threeBoxStore.setLabelRenderer(labelRenderer)

  addPerformance()
})

onUnmounted(() => {
  threeBoxStore.setIsActiveRenderer(false)
  threeBoxStore.setRenderer(null)
})

// 场景逻辑
let camera, scene

const addPerformance = () => {
  const stats = new Stats(); // 性能监视器
  threeBoxRef.value.appendChild(stats.dom);
  threeBoxStore.setPerformanceState(markRaw(stats))
  stats.setMode(0) // 0: fps, 1: ms, 2: mb
  stats.dom.style.top = "calc(100vh - 53px)"
  stats.dom.style.left = "5px"
}

</script>

<style lang="scss" scoped>
#three-box {
  width: 100%;
  height: 100%;
  pointer-events: auto;
}
</style>
