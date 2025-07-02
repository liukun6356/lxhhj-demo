<template>
  <div class="pigHeartEmmiter-wrap">

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
import {
  BatchedParticleRenderer,
  ConeEmitter,
  ConstantValue,
  IntervalValue,
  ParticleSystem,
  PointEmitter,
  RandomColor,
  RenderMode,
  SphereEmitter
} from "three.quarks";
import {UnrealBloomPass} from 'three/addons/Addons.js';
import GUI from "lil-gui";
import heartPng from "@/assets/images/three/heart.png"

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
    group, batchRenderer, particles

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(500, 600, 800);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(1000);
  scene.add(axesHelper);

  // 创建透视相机
  camera.fov = 60
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(500, 600, 800);
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);

  const v = new THREE.Vector2(window.innerWidth, window.innerWidth);
  const bloomPass = new UnrealBloomPass(v); // 发光
  // bloomPass.strength = 0.5;
  composer.addPass(bloomPass);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  addMesh()

  const clock = new THREE.Clock();
  ;(function render() {
    const delta = clock.getDelta();
    if (batchRenderer) batchRenderer.update(delta);

    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const addMesh = async () => {
  group = new THREE.Group()
  group.customType = "111"

  const gltf = await gltfLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/pig.glb");
  group.add(gltf.scene)
  gltf.scene.scale.setScalar(5)
  const box = new THREE.Box3();
  box.expandByObject(gltf.scene);
  const xSize = box.max.x - box.min.x;
  const ySize = box.max.y - box.min.y;
  const zSize = box.max.z - box.min.z;
  gltf.scene.position.y = -ySize / 2 + 20;
  gltf.scene.position.z = -zSize / 2;

  batchRenderer = new BatchedParticleRenderer();
  group.add(batchRenderer);
  const texture = textureLoader.load(heartPng);
  particles = new ParticleSystem({
    duration: 20,
    looping: false,
    startLife: new IntervalValue(0, 10),
    startSpeed: new IntervalValue(0, 1000),
    startSize: new IntervalValue(0, 100),
    startColor: new RandomColor(
        new THREE.Vector4(1, 0, 0, 1),
        new THREE.Vector4(0, 1, 0, 1)
    ),
    emissionOverTime: new ConstantValue(1000),
    shape: new ConeEmitter({
      radius: 10,
      thickness: 10,
      arc: Math.PI * 2
    }),
    material: new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
  });
  group.add(particles.emitter);
  batchRenderer.addSystem(particles);

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
  play() {
    particles.stop();
    particles.time = 0;
    particles.play();
  },
  stop() {
    particles.stop();
  }
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "play")
  gui.add(formData, "stop")
}

</script>

<style lang="scss" scoped>
.pigHeartEmmiter-wrap {

}
</style>
