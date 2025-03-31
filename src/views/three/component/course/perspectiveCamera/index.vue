<template>
  <div class="perspectiveCamera-wrap">

  </div>
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
let scene, material, mesh, pointLight, axesHelper, camera, camera2,cameraHelper, orbitControls, timer

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加灯光 Light
  pointLight = new THREE.PointLight(0xffffff, 1e4); // 颜色白色#ffffff， 光照强度 1e4
  // pointLight.intensity = 1e4
  pointLight.position.set(80, 80, 80);// 80,80,80 的位置，默认照向 0,0,0 的方向
  scene.add(pointLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  // scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4);
  camera.position.set(200, 200, 200);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  // 创建相机视锥体
  camera2 = new THREE.PerspectiveCamera(20, 16 / 9, 100, 300)
  // fov — 摄像机视锥体垂直视野角度
  // aspect — 摄像机视锥体长宽比
  // near — 摄像机视锥体近端面
  // far — 摄像机视锥体远端面
  cameraHelper = new THREE.CameraHelper(camera2);
  scene.add(cameraHelper);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  const render = () => {
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const formDatachange = (k, v?:any) => {
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
    case "change":
      scene.remove(cameraHelper);
      cameraHelper = new THREE.CameraHelper(camera2);
      scene.add(cameraHelper);
      break
  }
}

// lil-gui逻辑
let gui
const formData = {
  axesHelper: false
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(camera2, 'fov', [30, 60, 10]).onChange(() => formDatachange("change"));
  gui.add(camera2, 'aspect', {'16/9': 16/9, '4/3': 4/3}).onChange(() => formDatachange("change"));
  gui.add(camera2, 'near', 0, 300).onChange(() => formDatachange("change"));
  gui.add(camera2, 'far', 300, 800).onChange(() => formDatachange("change"));
}

</script>

<style lang="scss" scoped>
.perspectiveCamera-wrap {

}
</style>
