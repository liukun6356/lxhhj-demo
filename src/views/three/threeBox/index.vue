<template>
  <div id="three-box" ref="threeBoxRef"></div>
</template>


<script lang="ts" setup>
import {ref, onMounted, onUnmounted, markRaw} from "vue"
import Stats from 'three/addons/libs/stats.module.js';
import {CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {WebGLRenderer,} from "three";
import {usethreeBoxStore} from "@/store/modules/threeBox"
// Refs
const threeBoxRef = ref(null)

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  const renderer = new WebGLRenderer({
    // logarithmicDepthBuffer:true, // 是否使用对数深度缓存
    antialias: true,// 是否执行抗锯齿
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(threeBoxRef.value.offsetWidth, threeBoxRef.value.offsetHeight);
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
  window.addEventListener('resize', () => {
    renderer.setSize(threeBoxRef.value.offsetWidth, threeBoxRef.value.offsetHeight)
  }, {passive: true});
})

onUnmounted(() => {
  threeBoxStore.setIsActiveRenderer(false)
  threeBoxStore.setRenderer(null)
})

// 场景逻辑
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
