<template>
  <div class="keyframesAnimation-wrap">

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
    animationMixer, gltf

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

  const clock = new THREE.Clock()
  const render = () => {
    composer.render();
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    // renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
    const delta = clock.getDelta()
    if (animationMixer) animationMixer.update(delta)
  }
  render()
}

const addMesh = () => {
  reset()
  const geometry = new THREE.BoxGeometry(100, 100, 100);
  const material = new THREE.MeshLambertMaterial({color: 'orange',});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.customType = "111"
  mesh.name = "Box";
  scene.add(mesh)
  const times = [0, 2, 5];
  const values = [0, 0, 0, 0, 100, 0, 0, 0, -100];
  const track = new THREE.KeyframeTrack('Box.position', times, values);

  const times2 = [0, 1, 4];
  const values2 = [1, 1, 1, 1, 2, 1, 1, 0.5, 1];
  const track2 = new THREE.KeyframeTrack('Box.scale', times2, values2);

  const clip = new THREE.AnimationClip("hello", 5, [track, track2]);
  animationMixer = new THREE.AnimationMixer(mesh);
  const clipAction = animationMixer.clipAction(clip);
  clipAction.timeScale = 2; // 调整播放速度
  // clipAction.paused = false;
  clipAction.play();
  setTimeout(() => {
    clipAction.paused = true;
  }, 2000)
}

const addModel = async () => {
  reset()
  const loader = new GLTFLoader();
  const group = new THREE.Group();
  group.customType = "111"
  gltf = await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/gltf/gltf/Horse.gltf")
  group.add(gltf.scene);
  gltf.scene.scale.set(30, 30, 30);
  group.getObjectByName('Cylinder').material.color.set('white');
  group.getObjectByName('Cylinder_1').material.color.set('pink');

  animationMixer = new THREE.AnimationMixer(gltf.scene);
  const clipAction = animationMixer.clipAction(gltf.animations[0]);
  clipAction.play();

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
let gui, typeControl, anmationTypeControl
const formData = {
  axesHelper: true,
  type: "",
  anmationType: 0
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["mesh", "model"]).onChange(type => {
    switch (type) {
      case "mesh":
        animationFolder.hide()
        addMesh()
        break
      case "model":
        addModel()
        animationFolder.show()
        break
    }
  })
  const animationFolder = gui.addFolder('模型动画');
  animationFolder.hide()
  animationFolder.add(formData, "anmationType", [0, 1, 2, 3, 4]).onChange(index => {
    animationMixer.uncacheRoot(gltf.scene)
    const clipAction = animationMixer.clipAction(gltf.animations[index]);
    clipAction.play();
  })
  typeControl.setValue("mesh")
}

</script>

<style lang="scss" scoped>
.aaa-wrap {

}
</style>
