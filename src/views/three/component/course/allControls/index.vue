<template>
  <div class="allControls-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {DragControls} from 'three/addons/controls/DragControls.js';
import {FlyControls} from 'three/addons/controls/FlyControls.js';
import {FirstPersonControls} from 'three/addons/controls/FirstPersonControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
  initGui()
})

onUnmounted(() => {
  gui.destroy()
  orbitControls.dispose()
  cancelAnimationFrame(timer)
  renderer.clear()
  scene.clear()
})

// 场景逻辑
let scene, material, mesh, directionalLight, ambientLight, axesHelper, orbitControls, timer, composer,
    group

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(500, 400, 300);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  // 创建透视相机
  camera.fov = 60
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(500, 500, 500);
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  addMesh()

  const clock = new THREE.Clock();
  ;(function render() {
    if (["FlyControls", "FirstPersonControls"].includes(orbitControls?.customType)) orbitControls.update(clock.getDelta());
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const addMesh = () => {
  group = new THREE.Group();
  group.customType = "111"

  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -50;

  const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.name = 'box';

  const box2 = box.clone();
  box2.material = box.material.clone();
  box2.position.x = 200;
  box2.name = 'box2';

  group.add(plane);
  group.add(box);
  group.add(box2);
  scene.add(group)
}

const reset = () => {
  scene.children.forEach(child => {
    if (child.customType) scene.remove(child)
  });
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
  axesHelper: true,
  type: "OrbitControls"
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "type", ["OrbitControls", "DragControls", "FlyControls", "FirstPersonControls", "TransformControls", "MapControls"]).onChange(type => {
    if(orbitControls.detach)orbitControls.detach()
    orbitControls.dispose()
    orbitControls.customType = ""
    let box1, box2
    switch (type) {
      case "OrbitControls":
        orbitControls = new OrbitControls(camera, renderer.domElement);
        break
      case "DragControls":
        box1 = scene.getObjectByName('box');
        box2 = scene.getObjectByName('box2');
        orbitControls = new DragControls([box1, box2], camera, renderer.domElement);
        orbitControls.addEventListener('dragstart', function (event) {
          event.object.material.color.set('lightgreen');
        });
        orbitControls.addEventListener('dragend', function (event) {
          event.object.material.color.set('orange');
        });
        orbitControls.addEventListener('hoveron', (event) => {
          event.object.material.wireframe = true;
        });
        orbitControls.addEventListener('hoveroff', (event) => {
          event.object.material.wireframe = false;
        });
        break
      case "FlyControls":
        orbitControls = new FlyControls(camera, renderer.domElement);
        orbitControls.customType = "FlyControls"
        orbitControls.movementSpeed = 100;
        orbitControls.rollSpeed = Math.PI / 10;
        break
      case "FirstPersonControls":
        orbitControls = new FirstPersonControls(camera, renderer.domElement);
        orbitControls.customType = "FirstPersonControls"
        orbitControls.movementSpeed = 100;
        break
      case "TransformControls":
        box1 = scene.getObjectByName('box');
        box2 = scene.getObjectByName('box2');
        orbitControls = new TransformControls(camera, renderer.domElement);
        orbitControls.attach(box1);
        orbitControls.showX = false;// 禁用掉 x 轴的箭头
        orbitControls.setMode('scale') // 默认 mode 是 translate，分别修改为 rotate 和 scale
        scene.add(orbitControls.getHelper());
        break
      case "MapControls":
        orbitControls = new MapControls(camera, renderer.domElement);
        break
    }
  })
}

</script>

<style lang="scss" scoped>
.allControls-wrap {

}
</style>
