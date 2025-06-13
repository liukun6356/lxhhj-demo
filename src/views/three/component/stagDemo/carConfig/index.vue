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
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import nxPng from "@/assets/images/pbrMatrial/nx.png"
import nyPng from "@/assets/images/pbrMatrial/ny.png"
import nzPng from "@/assets/images/pbrMatrial/nz.png"
import pxPng from "@/assets/images/pbrMatrial/px.png"
import pyPng from "@/assets/images/pbrMatrial/py.png"
import pzPng from "@/assets/images/pbrMatrial/pz.png"

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
    group, textureCube

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();
  textureCube = cubeTextureLoader.load([pxPng, nxPng, pyPng, nyPng, pzPng, nzPng]);
  // scene.background = textureCube;

  directionalLight = new THREE.DirectionalLight("#fff", 1);
  directionalLight.position.set(100, 100, 100);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight("#fff");
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  // 创建透视相机
  camera.fov = 60
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(100, 100, 100);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  addModel()

  ;(function render() {
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const addModel = async () => {
  group = new THREE.Group();
  const gltf = await gltfLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + '/car.glb')
  group.add(gltf.scene);
  gltf.scene.traverse((obj) => {
    if (obj.material?.isMeshPhysicalMaterial) {
      obj.material.envMap = textureCube;
      obj.material.envMapIntensity = 2;
    }
    if (obj.name === '车身') {
      obj.material.metalness = 0.9;
      obj.material.roughness = 0.2;
      obj.material.clearcoat = 1;
      obj.material.clearcoatRoughness = 0;
      carBodyFolder.addColor(obj.material, 'color');
      carBodyFolder.add(obj.material, 'metalness', 0, 1);
      carBodyFolder.add(obj.material, 'roughness', 0, 1);
      carBodyFolder.add(obj.material, 'clearcoat', 0, 1);
      carBodyFolder.add(obj.material, 'clearcoatRoughness', 0, 1);
    }
    if (obj.name === '车窗') {
      obj.material.color.set('white');
      obj.material.transmission = 1;
      obj.material.ior = 1.3;
      carWinFolder.addColor(obj.material, 'color');
      carWinFolder.add(obj.material, 'transmission', 0, 1);
      carWinFolder.add(obj.material, 'ior', 1, 2.3);
      carWinFolder.add(obj.material, 'metalness', 0, 1);
      carWinFolder.add(obj.material, 'roughness', 0, 1);
    }
  });
  gltf.scene.scale.set(40, 40, 40);
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
let gui, carBodyFolder, carWinFolder
const formData = {
  axesHelper: true
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  carBodyFolder = gui.addFolder('车身');
  carWinFolder = gui.addFolder('车窗');
}

</script>

<style lang="scss" scoped>
.aaa-wrap {

}
</style>
