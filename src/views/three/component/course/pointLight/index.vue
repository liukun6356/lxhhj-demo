<template>
  <div class="pointLight-wrap"></div>
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
let scene, mesh, pointLight, axesHelper, camera, orbitControls, timer

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加物体 Mesh
  const geometry = new THREE.BoxGeometry(100, 100, 100); // 长100宽100高100
  const material = new THREE.MeshLambertMaterial(({
    color: new THREE.Color('orange')
  }));
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  // 添加灯光 Light
  pointLight = new THREE.PointLight(0xffffff, 1e4); // 颜色白色#ffffff， 光照强度 1e4
  // pointLight.intensity = 1e4
  pointLight.position.set(80, 80, 80);// 80,80,80 的位置，默认照向 0,0,0 的方向
  scene.add(pointLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(200, 200, 200);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

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

// lil-gui逻辑
let gui
const initGui = () =>{
  gui = new GUI({title: "controls"});
  const meshFolder = gui.addFolder('立方体');
  meshFolder.addColor(mesh.material, 'color');
  meshFolder.add(mesh.position, 'x', 0, 50, 1).name("X");
  meshFolder.add(mesh.position, 'y', 0, 50, 1).name("Y");
  meshFolder.add(mesh.position, 'z', 0, 50, 1).name("Z");
  const lightFolder = gui.addFolder('灯光');
  lightFolder.add(pointLight.position, 'x', 0, 100, 1).name("X");
  lightFolder.add(pointLight.position, 'y', 0, 100, 1).name("Y");
  lightFolder.add(pointLight.position, 'z', 0, 100, 1).name("Z");
  lightFolder.add(pointLight, 'intensity', 0, 1e5, 1e3).name("intensity"); // 光照强度
}
</script>

<style lang="scss" scoped>
.pointLight-wrap {

}
</style>
