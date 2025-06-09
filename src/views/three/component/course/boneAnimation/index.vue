<template>
  <div class="boneAnimation-wrap">

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
    group, animationMixer, gltf

const renderer = threeBoxStore.getRenderer()

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
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(200, 300, 300);//
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
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
  group = new THREE.Group();
  group.customType = "1111"
  const bone1 = new THREE.Bone();
  const bone2 = new THREE.Bone();
  const bone3 = new THREE.Bone();

  bone1.add(bone2);
  bone1.position.x = 100;
  bone2.add(bone3);
  bone2.position.y = 100;
  bone3.position.y = 50;

  bone1.rotateZ(Math.PI / 4)
  bone2.rotateZ(Math.PI / 4);
  // bone3.rotateZ(Math.PI/4);

  group.add(bone1);

  const pos = new THREE.Vector3();
  bone3.getWorldPosition(pos);
  console.log(pos);

  const skeletonHelper = new THREE.SkeletonHelper(group);
  group.add(skeletonHelper);
  scene.add(group)
}

const addModel = async () => {
  const loader = new GLTFLoader();

  group = new THREE.Group();
  group.customType = "1111"

  gltf = await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/Michelle.glb")
  console.log(gltf);
  group.add(gltf.scene);
  gltf.scene.scale.set(100, 100, 100);

  gltf.scene.traverse(obj => {
    if (obj.isBone && obj.name === "mixamorigSpine2") obj.rotateX(-Math.PI / 3);
  })

  const helper = new THREE.SkeletonHelper(gltf.scene);
  group.add(helper);

  scene.add(group)
}

const addMeshAnimationMixer = async () => {
  const loader = new GLTFLoader();

  group = new THREE.Group();
  group.customType = "1111"

  gltf = await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/Michelle.glb")
  console.log(gltf);
  group.add(gltf.scene);
  gltf.scene.scale.set(100, 100, 100);

  const track1 = new THREE.KeyframeTrack('mixamorigSpine2.position', [0, 3], [0, 0, 0, 0, 0, 30]);
  const clip = new THREE.AnimationClip("bbb", 3, [track1]);

  animationMixer = new THREE.AnimationMixer(group);
  const clipAction = animationMixer.clipAction(clip);
  clipAction.play();

  const helper = new THREE.SkeletonHelper(gltf.scene);
  group.add(helper);

  scene.add(group)
}

const addMeshAnimation = async () => {
  const loader = new GLTFLoader();

  group = new THREE.Group();
  group.customType = "1111"

  gltf = await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/Michelle.glb")
  console.log(gltf);
  group.add(gltf.scene);
  gltf.scene.scale.set(100, 100, 100);

  animationMixer = new THREE.AnimationMixer(group);
  const clipAction = animationMixer.clipAction(gltf.animations[0]);
  clipAction.play();

  const helper = new THREE.SkeletonHelper(gltf.scene);
  group.add(helper);

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
let gui, typeControl, animationFolder
const formData = {
  axesHelper: true,
  anmationType: 0
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["mesh", "model", "meshAnimationMixer", "meshAnimation",]).name("类型").onChange(type => {
    reset()
    if (animationFolder) animationFolder.destroy()
    switch (type) {
      case "mesh":
        addMesh()
        break
      case "model":
        addModel()
        break
      case "meshAnimationMixer":
        addMeshAnimationMixer()
        break
      case "meshAnimation":
        addMeshAnimation()
        animationFolder = gui.addFolder('模型动画');
        animationFolder.add(formData, "anmationType", {
          SambaDance: 0,
          TPose: 1,
        }).onChange(index => {
          animationMixer.uncacheRoot(gltf.scene)
          animationMixer.stopAllAction()
          const clipAction = animationMixer.clipAction(gltf.animations[index]);
          clipAction.play();
        })
        break
    }

  })
  typeControl.setValue("mesh")
}

</script>

<style lang="scss" scoped>
.boneAnimation-wrap {

}
</style>
