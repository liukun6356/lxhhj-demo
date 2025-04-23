<template>
  <div class="vertexNormal-wrap">

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
  renderer.clear()
  gui.destroy()
  cancelAnimationFrame(timer)
})


// 场景逻辑
let scene, material, mesh, pointLight, axesHelper, camera, orbitControls, timer

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

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e6);
  camera.lookAt(0, 0, 0); // 看向 0,0,0
  camera.position.set(0.9, -520, 6.5);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);
  // 添加管道
  const p1 = new THREE.Vector3(-100, 0, 0);
  const p2 = new THREE.Vector3(50, 100, 0);
  const p3 = new THREE.Vector3(100, 0, 100);
  const p4 = new THREE.Vector3(100, 0, 0);

  const curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);

  const geometry = new THREE.TubeGeometry(curve, 50, 10, 20);

  const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color('white')
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh)
  const render = () => {
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
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
  axesHelper: false,
  animation: false,
}

const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "animation")
}

</script>

<style lang="scss" scoped>
.vertexNormal-wrap {

}
</style>
