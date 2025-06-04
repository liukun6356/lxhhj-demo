<template>
  <div class="sprite-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GammaCorrectionShader, ShaderPass,} from 'three/addons/Addons.js';
import spritePng from "@/assets/images/threeCourse/sprite.png"
import snowPng from "@/assets/images/threeCourse/snow.png"
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
let scene, material, mesh, directionalLight, ambientLight, axesHelper, camera, orbitControls, timer,
    composer, gammaPass, group

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
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e3);
  camera.position.set(0, 0, 10);//
  camera.lookAt(0, 0, 0); //

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  gammaPass = new ShaderPass(GammaCorrectionShader); // 伽马校正，用了后期通道后颜色异常的修复
  composer.addPass(gammaPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  addMesh()

  const clock = new THREE.Clock()
  const render = () => {
    const delta = clock.getDelta()
    if (group.customType) group.children.forEach(sprite => {
      sprite.position.y -= delta * 10
      if (sprite.position.y < 10) sprite.position.y = 1000
    })
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
  scene.remove(group)
  group = new THREE.Group();
  const spriteMaterial = new THREE.SpriteMaterial({color: 'orange'});
  const sprite = new THREE.Sprite(spriteMaterial);
  group.add(sprite);

  const geometry = new THREE.PlaneGeometry(1, 1)
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: "lightblue"}))
  mesh.position.y = 3
  group.add(mesh)
  // PlaneGeometry 是可以随着 camera 位置的变化，看到侧面、反面的，而 Sprite 永远正对相机
  scene.add(group)
}

const addMesh2 = () => {
  scene.remove(group)

  // 创建十二面体
  function createMesh(color, x) {
    const geometry = new THREE.DodecahedronGeometry(1);
    const material = new THREE.MeshBasicMaterial({
      color: color
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = x;
    return mesh;
  }

  const mesh = createMesh('orange', 0);
  const mesh2 = createMesh('skyblue', 5);
  const mesh3 = createMesh('lightgreen', -5);

  group = new THREE.Group();
  group.add(mesh);
  group.add(mesh2);
  group.add(mesh3);

  // 添加sprite
  function createSprite(x, y) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(spritePng);

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.x = x;
    sprite.position.y = y;
    return sprite;
  }

  const sprite1 = createSprite(0, 1.5);
  const sprite2 = createSprite(5, 1.5);
  const sprite3 = createSprite(-5, 1.5);
  group.add(sprite1);
  group.add(sprite2);
  group.add(sprite3);
  // Sprite 的贴图都始终正对相机
  scene.add(group)
}

const addMesh3 = () => {
  scene.remove(group)
  const loader = new THREE.TextureLoader();
  const texture = loader.load(snowPng);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture
  });

  group = new THREE.Group();
  group.customType = "snow"

  for (let i = 0; i < 10000; i++) {
    const sprite = new THREE.Sprite(spriteMaterial);

    const x = 1000 * Math.random();
    const y = 1000 * Math.random();
    const z = 1000 * Math.random();
    sprite.position.set(x, y, z);

    group.add(sprite);
  }
  camera.position.set(200, 200, 200);
  scene.add(group)
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
  type:"颜色sprite"
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData,"type",["颜色sprite","贴图sprite","下雪效果"]).name("类型").onChange(type=>{
    switch (type){
      case "颜色sprite":
        addMesh()
        break
      case "贴图sprite":
        addMesh2()
        break
      case "下雪效果":
        addMesh3()
        break
    }
  })
}

</script>

<style lang="scss" scoped>
.sprite-wrap {

}
</style>
