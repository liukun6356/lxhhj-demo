<template>
  <div class="tweenAnimation-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {onMounted, onUnmounted} from "vue";
import {Tween, Easing, Group} from '@tweenjs/tween.js';
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
let scene, material, mesh, directionalLight, ambientLight, axesHelper, camera, orbitControls, timer, composer,
    tweenGroup, tween1, tween2

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
  tween1 = new Tween(mesh.position)
      .to({x: 100, y: 100}, 2000)
      .easing(Easing.Quadratic.InOut)
      // .repeat(10)// 重复播放 ，无限次可填 Infinity
      // .onUpdate(()=>console.log(11))// 变化的回调
  tween2 = new Tween(mesh.rotation)
      .to({x: Math.PI / 2}, 2000)
      .easing(Easing.Quadratic.InOut)
      // .repeat(0)
  tweenGroup = new Group()
  tweenGroup.add(tween1, tween2);

  const render = () => {
    tweenGroup.update();
    composer.render();
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    // renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const addMesh = () => {
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshPhongMaterial({
    color: 'orange'
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh)
}

const formDatachange = (k, v) => {
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
  }
}

// lil-gui逻辑
let gui, typeControl
const formData = {
  axesHelper: true,
  type: ""
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["位移", "旋转", "同时位移旋转", "先旋转后位移"]).name("类型").onChange(type => {
    mesh.position.set(0, 0, 0)
    switch (type) {
      case "位移":
        tween1.start()
        break
      case "旋转":
        tween2.start()
        break
      case "同时位移旋转":
        tween1.start()
        tween2.start()
        break
      case "先旋转后位移":
        tween2.chain(tween1); // 两个串联成一个
        tween2.start();
        break
    }
  })
  typeControl.setValue("位移")
}

</script>

<style lang="scss" scoped>
.tweenAnimation-wrap {

}
</style>
