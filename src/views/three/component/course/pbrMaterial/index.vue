<template>
  <div class="pbrMaterial-wrap">

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
    textureCube

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();
  textureCube = cubeTextureLoader.load([pxPng, nxPng, pyPng, nyPng, pzPng, nzPng]);
  scene.background = textureCube;

  directionalLight = new THREE.DirectionalLight("#ffffff", 2);
  directionalLight.position.set(500, 400, 300);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  // 创建透视相机
  camera.fov = 60
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(500, 600, 800);
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  ;(function render() {
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const addMesh = () => {
  const geometry = new THREE.CylinderGeometry(200, 200, 500)
  material = new THREE.MeshStandardMaterial({
    color: "orange",
    roughness: 0.1,//粗糙程度
    metalness: 1,//材质与金属的相似度
    envMap: textureCube, // 环境贴图
    envMapIntensity: 1,//通过乘以环境贴图的颜色来缩放环境贴图的效果
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.customType = "1111"
  scene.add(mesh)
}

const addMesh2 = () => {
  const geometry = new THREE.DodecahedronGeometry(300);
  material = new THREE.MeshPhysicalMaterial({
    color: 'blue',
    metalness: 0,
    roughness: 0,
    envMap: textureCube,
    transmission: 0.9,
    ior: 1.8,
  });
  const mesh = new THREE.Mesh(geometry, material)
  mesh.customType = "1111"
  scene.add(mesh)
}

const addMesh3 = () => {
  const geometry = new THREE.BoxGeometry(300, 300, 300);
  material = new THREE.MeshPhysicalMaterial({
    color: 'black',
    metalness: 0.8,
    roughness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMap: textureCube
  });
  const mesh = new THREE.Mesh(geometry, material)
  mesh.customType = "1111"
  scene.add(mesh)
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
let gui, typeControl, materialFolder, roughnessControl, clearcoatControl, clearcoatRoughnessControl
const formData = {
  axesHelper: true,
  type: "",
  frosted() {
    roughnessControl.setValue(0.5)
  },
  coat(){
    clearcoatControl.setValue(0.1)
    clearcoatRoughnessControl.setValue(0.25)
  }
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["金属pbr", "玻璃pbr", "油漆pbr"]).onChange(type => {
    reset()
    if (materialFolder) materialFolder.destroy()
    switch (type) {
      case "金属pbr":
        addMesh()
        materialFolder = gui.addFolder("material")
        materialFolder.addColor(material, 'color');
        materialFolder.add(material, 'roughness', 0, 1).name("粗糙度");
        materialFolder.add(material, 'metalness', 0, 1).name("金属相似度");
        materialFolder.add(material, 'envMapIntensity', 0, 5).name("环境贴图");
        break
      case "玻璃pbr":
        addMesh2()
        materialFolder = gui.addFolder("material")
        materialFolder.addColor(material, 'color');
        materialFolder.add(material, 'transmission', 0, 1).name("透明度");
        materialFolder.add(material, 'ior', 0, 2.33).name("折射率");
        materialFolder.add(material, 'metalness', 0, 1).name("金属相似度");
        roughnessControl = materialFolder.add(material, 'roughness', 0, 1).name("光泽层的粗糙度");
        materialFolder.add(formData, 'frosted')
        break
      case "油漆pbr":
        addMesh3()
        materialFolder = gui.addFolder("material")
        materialFolder.addColor(material, 'color');
        materialFolder.add(material, 'metalness', 0, 1).name("金属相似度");
        materialFolder.add(material, 'roughness', 0, 1).name("光泽层的粗糙度");
        clearcoatControl = materialFolder.add(material, 'clearcoat', 0, 1).name("清漆度");
        clearcoatRoughnessControl = materialFolder.add(material, 'clearcoatRoughness', 0, 1).name("清漆层的粗糙度");
        materialFolder.add(formData, 'coat')
        break
    }
  })
  typeControl.setValue("金属pbr")
}

</script>

<style lang="scss" scoped>
.pbrMaterial-wrap {

}
</style>
