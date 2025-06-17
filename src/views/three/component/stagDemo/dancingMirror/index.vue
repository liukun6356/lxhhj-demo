<template>
  <div class="dancingMirror-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {Reflector} from 'three/examples/jsm/Addons.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
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
    group, animationMixer

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const gltfLoader = new GLTFLoader();

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight("#fff");
  directionalLight.position.set(500, 400, 300);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight("#fff");
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  // 创建透视相机
  camera.fov = 60
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(300, 700, 300);
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  group = new THREE.Group()

  addGround()
  addMirrors()
  addModel()

  scene.add(group)

  const clock = new THREE.Clock();
  ;(function render() {
    const delta = clock.getDelta();
    if (animationMixer) animationMixer.update(delta);
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const addGround = () => {
  const geometry = new THREE.PlaneGeometry(3000, 3000);
  const material = new THREE.MeshPhongMaterial({
    color: 'orange'
  })
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotateX(-Math.PI / 2);
  group.add(mesh)
}

const addMirrors = () => {
  const mirrors = new THREE.Group();
  for (let i = 0; i < Math.PI * 2; i += Math.PI / 2) {
    const geometry = new THREE.PlaneGeometry(1000, 1000);
    const mirror = new Reflector(geometry);

    mirror.position.y = 500;
    mirror.position.x = 500 * Math.sin(i);
    mirror.position.z = 500 * Math.cos(i);
    mirror.rotateY(i);
    mirror.rotateY(-Math.PI);

    mirrors.add(mirror);
  }
  group.add(mirrors)
}

const addModel = async () => {
  const gltf = await gltfLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/Michelle.glb")
  group.add(gltf.scene);
  gltf.scene.scale.set(200, 200, 200);
  animationMixer = new THREE.AnimationMixer(gltf.scene);
  const clipAction = animationMixer.clipAction(gltf.animations[0]);
  clipAction.play();
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
  axesHelper: true
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
}

</script>

<style lang="scss" scoped>
.dancingMirror-wrap {

}
</style>
