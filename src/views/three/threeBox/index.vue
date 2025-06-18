<template>
  <div id="three-box" ref="threeBoxRef"></div>
</template>


<script lang="ts" setup>
import {ref, onMounted, onUnmounted, markRaw} from "vue"
import Stats from 'three/addons/libs/stats.module.js';
import {CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {CSS3DRenderer} from 'three/examples/jsm/Addons.js';
import {WebGLRenderer,} from "three";
import {usethreeBoxStore} from "@/store/modules/threeBox"
import * as THREE from "three";
// Refs
const threeBoxRef = ref(null)

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  renderer = new WebGLRenderer({
    // logarithmicDepthBuffer:true, // 是否使用对数深度缓存，可解决贴合问题
    // antialias: true,// 是否执行抗锯齿
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  threeBoxRef.value.appendChild(renderer.domElement)
  threeBoxStore.setRenderer(markRaw(renderer))

  const css2DRenderer = new CSS2DRenderer(); //使用HTML渲染器
  css2DRenderer.setSize(window.innerWidth, window.innerHeight);
  threeBoxRef.value.appendChild(css2DRenderer.domElement)
  css2DRenderer.domElement.className = 'css2DRenderer'
  css2DRenderer.domElement.style.position = 'fixed';
  css2DRenderer.domElement.style.top = '0px';
  css2DRenderer.domElement.style.left = '0px';
  css2DRenderer.domElement.style.zIndex = '0';//设置层级
  css2DRenderer.domElement.style.pointerEvents = 'none';
  threeBoxStore.setCss2DRenderer(markRaw(css2DRenderer))

  const css3DRenderer = new CSS3DRenderer(); //使用HTML渲染器
  css3DRenderer.setSize(window.innerWidth, window.innerHeight);
  threeBoxRef.value.appendChild(css3DRenderer.domElement)
  css3DRenderer.domElement.className = 'css3DRenderer'
  css3DRenderer.domElement.style.position = 'fixed';
  css3DRenderer.domElement.style.top = '0px';
  css3DRenderer.domElement.style.left = '0px';
  css3DRenderer.domElement.style.zIndex = '0';//设置层级
  css3DRenderer.domElement.style.pointerEvents = 'none';
  threeBoxStore.setCss3DRenderer(markRaw(css3DRenderer))

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4)
  threeBoxStore.setCamera(markRaw(camera))

  addPerformance()
  threeBoxStore.setIsActiveRenderer(true)

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    css2DRenderer.setSize(window.innerWidth, window.innerHeight)
    css3DRenderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // 调整完相机参数，更新相机矩阵才能生效
  }, {passive: true});
})

onUnmounted(() => {
  renderer.dispose()
  // renderer.domElement?.remove()
  threeBoxStore.setIsActiveRenderer(false)
  threeBoxStore.setRenderer(null)
})

// 场景逻辑
let renderer
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
