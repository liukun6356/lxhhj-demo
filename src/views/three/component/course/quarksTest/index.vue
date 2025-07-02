<template>
  <div class="quarksTest-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {onMounted, onUnmounted} from "vue";
import heartPng from "@/assets/images/three/heart.png"
import {
  BatchedParticleRenderer,
  ConstantValue,
  IntervalValue,
  ParticleSystem,
  PointEmitter,
  RandomColor,
  RenderMode
} from "three.quarks";
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
    group, batchRenderer, particles

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
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
  const renderPass = new RenderPass(scene, camera);
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

const addMesh = () => {
  group = new THREE.Group();
  group.customType = "111"

  batchRenderer = new BatchedParticleRenderer(); // 粒子批量渲染器
  group.add(batchRenderer);
  const texture = textureLoader.load(heartPng);
  particles = new ParticleSystem({ // 粒子系统
    duration: 20,
    looping: true, // 循环
    startLife: new IntervalValue(0, 10),// 生命周期
    startSpeed: new IntervalValue(0, 500),// 速度
    startSize: new IntervalValue(0, 100),// 大小
    startColor: new RandomColor( // 颜色
        new THREE.Vector4(1, 0, 0, 1),
        new THREE.Vector4(0, 1, 0, 1)
    ),
    emissionOverTime: new ConstantValue(100), // 粒子数
    shape: new PointEmitter(), // 点发射器
    material: new THREE.MeshBasicMaterial({ // 材质
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,// 颜色混合模型，改成颜色叠加，默认材质间互不影响
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
  play(){
    particles.stop();
    particles.time = 0;
    particles.play();
  },
  stop(){
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
.quarksTest-wrap {

}
</style>
