<template>
  <div class="materialTexture-wrap"></div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
  initGui()
})

onUnmounted(() => {
  gui.destroy()
  cancelAnimationFrame(timer)
  renderer.clear()
})

// 场景逻辑
let scene, meshBasicMaterial,geometry, mesh, axesHelper, camera, orbitControls, timer

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // geometry = new THREE.PlaneGeometry(3000, 3000, 100, 100);
  //
  // meshBasicMaterial = new THREE.MeshBasicMaterial({ // 基础网格材质,不受光照影响
  //   color: new THREE.Color('orange'),
  //   wireframe: true,
  //   side: THREE.DoubleSide
  // });
  // mesh = new THREE.Mesh(geometry, meshBasicMaterial);
  // mesh.rotateX(Math.PI / 2); // 绕 x 轴旋转 90 度
  // scene.add(mesh);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(450, 150, 100);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.addEventListener('change',()=>{
    // console.log(camera.position)
  })

  const render = () => {
    renderer.render(scene, camera);
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}
const formDatachange = (k, v) => {
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
  }
}

// lil-gui逻辑
let gui
const formData = {
  changeType: "",
  axesHelper: true
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
}


</script>

<style lang="scss" scoped>
.materialTexture-wrap{

}
</style>
