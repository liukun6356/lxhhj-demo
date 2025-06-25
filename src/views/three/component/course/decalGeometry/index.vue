<template>
  <div class="decalGeometry-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {DecalGeometry} from 'three/addons/geometries/DecalGeometry.js';
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import xiaoxinPng from "@/assets/images/threeCourse/xiaoxin.png"

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
  initGui()
})

onUnmounted(() => {
  renderer.domElement.removeEventListener('click', onMouseClick);
  gui.destroy()
  orbitControls.dispose()
  cancelAnimationFrame(timer)
  renderer.clear()
  scene.clear()
})

// 场景逻辑
let scene, material, mesh, directionalLight, ambientLight, axesHelper, orbitControls, timer, composer,
    group, texture

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const textureLoader = new THREE.TextureLoader();

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

  camera.position.set(500, 600, 400);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  renderer.domElement.addEventListener('click', onMouseClick);

  ;(function render() {
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const onMouseClick = (e) => {
  const y = -((e.offsetY / window.innerHeight) * 2 - 1);
  const x = (e.offsetX / window.innerWidth) * 2 - 1;
  const rayCaster = new THREE.Raycaster();
  rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const intersections = rayCaster.intersectObjects(group.children);
  if (!intersections.length) return
  const position = intersections[0].point;
  const orientation = new THREE.Euler();
  const size = new THREE.Vector3(100, 100, 100);
  const geometry = new DecalGeometry(intersections[0].object, position, orientation, size);
  const material = new THREE.MeshPhongMaterial({
    polygonOffset: true,
    polygonOffsetFactor: -4,
    map: texture,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

const addMesh = () => {
  group = new THREE.Group()
  group.customType = "111"

  const geometry = new THREE.SphereGeometry(200);
  const material = new THREE.MeshPhongMaterial({
    color: 'orange'
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  const position = new THREE.Vector3(0, 0, 200);
  const orientation = new THREE.Euler();
  const size = new THREE.Vector3(100, 100, 100);
  const geometry2 = new DecalGeometry(mesh, position, orientation, size);

  texture = textureLoader.load(xiaoxinPng);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material2 = new THREE.MeshPhongMaterial({
    polygonOffset: true,
    polygonOffsetFactor: -4,
    // color: 'green',
    map: texture,
    transparent: true
  });
  const mesh2 = new THREE.Mesh(geometry2, material2);
  group.add(mesh2);

  scene.add(group)
}

const addMesh1 = () => {
  group = new THREE.Group()
  group.customType = "111"

  const geometry = new THREE.DodecahedronGeometry(200);
  const material = new THREE.MeshPhongMaterial({
    color: 'orange'
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  const position = new THREE.Vector3(0, 0, 200);
  const orientation = new THREE.Euler();
  const size = new THREE.Vector3(100, 100, 100);
  const geometry2 = new DecalGeometry(mesh, position, orientation, size);

  texture = textureLoader.load(xiaoxinPng);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material2 = new THREE.MeshPhongMaterial({
    polygonOffset: true,
    polygonOffsetFactor: -4,
    // color: 'green',
    map: texture,
    transparent: true
  });
  const mesh2 = new THREE.Mesh(geometry2, material2);
  group.add(mesh2);

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
let gui, typeControl
const formData = {
  axesHelper: true,
  type: "",
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["贴图", "贴图交互"]).onChange(type => {
    reset()
    switch (type) {
      case "贴图":
        addMesh()
        break
      case "贴图交互":
        addMesh1()
        break
    }
  })
  typeControl.setValue("贴图")
}

</script>

<style lang="scss" scoped>
.decalGeometry-wrap {

}
</style>
