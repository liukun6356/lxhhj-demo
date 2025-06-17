<template>
  <div class="reflectorMirror-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {Reflector} from 'three/examples/jsm/Addons.js';
import {RGBELoader} from "three/examples/jsm/Addons";
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
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
    group, hdrTexture, cubeCamera, cubeCamera2

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const rgbeloader = new RGBELoader();

const init = async () => {
  // 创建场景scene
  scene = new THREE.Scene();
  hdrTexture = await rgbeloader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/pic.hdr")
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = hdrTexture;

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(300, 200, 400);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera.fov = 60
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(200, 200, 200);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  ;(function render() {
    if (cubeCamera) {
      const mirror1 = group.getObjectByName('mirror1');
      const mirror2 = group.getObjectByName('mirror2');
      cubeCamera.position.copy(mirror1.position)
      cubeCamera.update(renderer, scene) // 重新拍摄照片
      cubeCamera2.position.copy(mirror2.position)
      cubeCamera2.update(renderer, scene) // 重新拍摄照片
    }
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
  initGui()
}

const addMesh = () => {
  group = new THREE.Group()
  group.customType = "111"
  // 平面1
  const geometry1 = new THREE.PlaneGeometry(1000, 1000);
  const material1 = new THREE.MeshStandardMaterial({
    color: 'white',
    metalness: 1,
    roughness: 0,
    envMap: hdrTexture,
    side: THREE.DoubleSide
  });
  const plane1 = new THREE.Mesh(geometry1, material1);
  plane1.position.z = -500;
  plane1.rotateY(0);
  group.add(plane1)

  // 平面2
  const geometry2 = new THREE.PlaneGeometry(1000, 1000);
  const material2 = new THREE.MeshStandardMaterial({
    color: 'white',
    metalness: 1,
    roughness: 0,
    envMap: hdrTexture,
    side: THREE.DoubleSide
  });
  const plane2 = new THREE.Mesh(geometry2, material2);
  plane2.position.z = 500;
  plane2.rotateY(Math.PI);
  group.add(plane2)

  const geometry = new THREE.SphereGeometry(100);
  const material = new THREE.MeshStandardMaterial({
    color: 'lightgreen'
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh)

  scene.add(group)
}

const addMesh1 = () => {
  group = new THREE.Group()
  group.customType = "111"

  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512); // 64、128、256、512
  cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
  const geometry1 = new THREE.PlaneGeometry(1000, 1000, 10)
  const material1 = new THREE.MeshStandardMaterial({
    color: 'white',
    metalness: 1,
    roughness: 0,
    envMap: cubeRenderTarget.texture
  });
  const plane1 = new THREE.Mesh(geometry1, material1);
  group.add(plane1)
  plane1.position.z = -500;
  plane1.name = "mirror1";
  plane1.rotateY(0);

  const plane2 = plane1.clone();
  const cubeRenderTarget2 = new THREE.WebGLCubeRenderTarget(512);
  cubeCamera2 = new THREE.CubeCamera(1, 1000, cubeRenderTarget2);
  plane2.geometry = plane1.geometry.clone();
  plane2.material = new THREE.MeshStandardMaterial({
    color: 'white',
    metalness: 1,
    roughness: 0,
    envMap: cubeRenderTarget2.texture
  });
  plane2.position.z = 500;
  plane2.name = "mirror2";
  plane2.rotateY(Math.PI);
  group.add(plane2);

  const geometry = new THREE.SphereGeometry(100);
  const material = new THREE.MeshStandardMaterial({
    color: 'lightgreen'
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh)
  scene.add(group)
}

const addMesh2 = () => {
  group = new THREE.Group()
  group.customType = "111"

  const geometry1 = new THREE.PlaneGeometry(1000, 1000, 10)
  const plane1 = new Reflector(geometry1, {
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
  });
  group.add(plane1)
  plane1.position.z = -500;
  plane1.name = "mirror1";
  plane1.rotateY(0);

  const plane2 = new Reflector(plane1.geometry.clone(), {
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
  });
  plane2.position.z = 500;
  plane2.name = "mirror2";
  plane2.rotateY(Math.PI);
  group.add(plane2);

  const geometry = new THREE.SphereGeometry(100);
  const material = new THREE.MeshStandardMaterial({
    color: 'lightgreen'
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh)
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
  type: ""
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["金属材质", "CubeCamera", "Reflector"]).onChange(type => {
    reset()
    switch (type) {
      case "金属材质":
        addMesh()
        break
      case "CubeCamera":
        addMesh1()
        break
      case "Reflector":
        addMesh2()
        break
    }
  })
  typeControl.setValue("Reflector")
}

</script>

<style lang="scss" scoped>
.reflectorMirror-wrap {

}
</style>
