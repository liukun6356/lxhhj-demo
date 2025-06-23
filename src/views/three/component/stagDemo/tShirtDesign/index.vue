<template>
  <div class="tShirtDesign-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {DRACOLoader, GLTFLoader} from 'three/examples/jsm/Addons.js';
import {DecalGeometry} from 'three/addons/geometries/DecalGeometry.js';
import heartPng from "@/assets/images/three/heart.png"
import xiaoxinPng from "@/assets/images/threeCourse/xiaoxin.png"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";

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
    group

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
const loader = new THREE.TextureLoader();
let texture = loader.load(heartPng);
texture.colorSpace = THREE.SRGBColorSpace;

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

  camera.position.set(0, 500, 500);
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  renderer.domElement.addEventListener('click', onMouseClick);

  // addMesh()
  addModel()

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

  const geometry = new THREE.BoxGeometry(100, 100, 100)
  const material = new THREE.MeshLambertMaterial({
    color: "orange"
  })
  const mesh = new THREE.Mesh(geometry, material)
  group.add(mesh)
  scene.add(group)
}

const addModel = async () => {
  group = new THREE.Group()
  group.customType = "111"

  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  gltfLoader.setDRACOLoader(dracoLoader);
  const gltf = await gltfLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + '/tshirt.glb')
  group.add(gltf.scene)
  gltf.scene.traverse(obj => {
    if (obj.isMesh) {
      console.log(obj.name, 12)
    }
  })
  gltf.scene.scale.setScalar(1000)

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
  color: "#ffffff",
  type:"爱心"
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.addColor(formData, "color").name("颜色").onChange(color=>{
    console.log(color,1234)
    const tshirt = group.getObjectByName('tshirt');
    if(tshirt) {
      tshirt.material.color.set(color);
    }
  })
  gui.add(formData,"type",["小新","爱心"]).onChange(type=>{
    switch (type){
      case "小新":
        texture = loader.load(xiaoxinPng);
        texture.colorSpace = THREE.SRGBColorSpace;
        break
      case "爱心":
        texture = loader.load(heartPng);
        texture.colorSpace = THREE.SRGBColorSpace;
        break
    }
  })
}

</script>

<style lang="scss" scoped>
.tShirtDesign-wrap {

}
</style>
