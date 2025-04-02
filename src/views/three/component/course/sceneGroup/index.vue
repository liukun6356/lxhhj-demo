<template>
  <div class="sceneGroup-wrap">

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
  addGroup()
})

onUnmounted(() => {
  gui.destroy()
  cancelAnimationFrame(timer)
  renderer.clear()
})

// 场景逻辑
let scene, material, mesh, directionLight, axesHelper, camera, orbitControls, timer, group
const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加平行灯光 Light
  directionLight = new THREE.DirectionalLight(0xffffff); // 平行光
  // directionLight .intensity = 1e4
  directionLight.position.set(2000, 2000, 2000);// 80,80,80 的位置，默认照向 0,0,0 的方向
  scene.add(directionLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4);
  camera.position.set(1000, 1000, 1000);// 在200,200,200的位置
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

const addGroup = () => {
  group = new THREE.Group()
  const geometry = new THREE.BoxGeometry(100, 100, 100);
  const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name ='cube'
  group.add(mesh)
  scene.add(group)
  // mesh.translateZ(200);
  // scene.add(mesh)
  group.position.x = 200
  group.translateZ(200);
  mesh.position.x = 200;
  // 局部坐标和世界坐标的区别
  const pos = new THREE.Vector3()
  mesh.getWorldPosition(pos)
  console.log(pos)
  console.log(group.position)
  console.log(mesh.position)
  // 场景中遍历是否为 mesh 的对象
  scene.traverse((obj) => {
    if(obj.isMesh) {
      obj.material.color = new THREE.Color('pink');
    }
  });
  // 场景中遍历 name
  const cube = scene.getObjectByName('cube');
  cube.material.color = new THREE.Color('lightgreen');
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
  axesHelper: true
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
}

</script>

<style lang="scss" scoped>
.sceneGroup-wrap {

}
</style>
