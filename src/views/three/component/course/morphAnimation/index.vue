<template>
  <div class="morphAnimation-wrap">

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
    animationMixer,group

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
  axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4);
  camera.position.set(500, 500, 500);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  const clock = new THREE.Clock();
  const render = () => {
    const delta = clock.getDelta();
    if (animationMixer) animationMixer.update(delta);
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
  const geometry = new THREE.BoxGeometry(300, 300, 300);
  const material = new THREE.MeshLambertMaterial({
    color: 'orange'
  });

  const positions = geometry.attributes.position.clone();
  for (let i = 0; i < positions.count; i++) {
    positions.setY(i, positions.getY(i) * 2);
  }

  const positions2 = geometry.attributes.position.clone();
  for (let i = 0; i < positions2.count; i++) {
    positions2.setX(i, positions2.getX(i) * 2);
  }

  geometry.morphAttributes.position = [positions, positions2]; // 变形目标

  mesh = new THREE.Mesh(geometry, material);
  mesh.customType = 111
  mesh.morphTargetInfluences[0] = 0; // 变形目标影响 100%
  mesh.morphTargetInfluences[1] = 1; // 变形目标影响  0
  scene.add(mesh)
}

const addModel = async () => {
  const loader = new GLTFLoader();
  const group = new THREE.Group();
  group.customType = 111
  const gltf =await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/Flamingo.glb")
  console.log(gltf,123)
  group.add(gltf.scene);
  gltf.scene.scale.set(3, 3, 3);
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
let gui, typeControl, meshFolder
const formData = {
  axesHelper: true,
  type: "",
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["mesh", "meshAnimation", "model"]).name("类型").onChange(type => {
    reset()
    switch (type) {
      case "mesh":
        addMesh()
        meshFolder = gui.addFolder("变形")
        meshFolder.add(mesh.morphTargetInfluences, '0', 0, 1);
        meshFolder.add(mesh.morphTargetInfluences, '1', 0, 1);
        break
      case "meshAnimation":
        meshFolder.destroy()
        addMesh()
        mesh.name = "Kkk";
        const track1 = new THREE.KeyframeTrack('Kkk.morphTargetInfluences[0]', [0, 3], [0, 0.5]);
        const track2 = new THREE.KeyframeTrack('Kkk.morphTargetInfluences[1]', [3, 6], [0, 1]);
        const clip = new THREE.AnimationClip("aaaa", 6, [track1, track2]);

        animationMixer = new THREE.AnimationMixer(mesh);
        const clipAction = animationMixer.clipAction(clip);
        clipAction.play();
        break
      case "model":
        meshFolder.destroy()
        addModel()
        break
    }
  })
  typeControl.setValue("mesh")
}

</script>

<style lang="scss" scoped>
.morphAnimation-wrap {

}
</style>
