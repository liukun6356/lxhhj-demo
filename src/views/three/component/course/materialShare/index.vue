<template>
  <div class="aaa-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
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
let scene, material, mesh, directionalLight, ambientLight, axesHelper, camera, orbitControls, timer,composer,
    mesh2,mesh3,mesh4

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(300, 200, 400);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(200, 200, 200);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  addMesh()

  const clock = new THREE.Clock();
  const render = () => {
    const delta = clock.getDelta(); // 两次渲染之间的间隔
    mesh.rotateY(delta);

    mesh2.rotation.copy(mesh.rotation);
    mesh3.rotation.copy(mesh.rotation);
    // mesh4.rotation.copy(mesh.rotation);

    composer.render();
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    // renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const addMesh = () =>{
  const geometry = new THREE.BoxGeometry(100, 100, 100)
  const material = new THREE.MeshLambertMaterial({
    color:"orange"
  })
  mesh = new THREE.Mesh(geometry,material)
  scene.add(mesh)

   mesh2 = mesh.clone()
  mesh2.geometry = mesh2.geometry.clone();
  mesh2.material = mesh2.material.clone();
  mesh2.material.color.set("lightgreen")
  mesh2.position.y = 200
  scene.add(mesh2)

  const positions = mesh2.geometry.attributes.position;
  for(let i = 0; i< positions.count; i++) {
    positions.setX(i, positions.getX(i) * 2);
  }

   mesh3 = mesh.clone();
  mesh3.position.x = 200;
   mesh4 = mesh.clone();
  mesh4.position.x = -200;
  scene.add(mesh3, mesh4);
  // mesh3.material.visible = false;
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
  axesHelper:true
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
}

</script>

<style lang="scss" scoped>
.aaa-wrap {

}
</style>
