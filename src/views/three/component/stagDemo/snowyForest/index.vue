<template>
  <div class="snowyForest-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {createNoise2D} from "simplex-noise";
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
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
let scene, material, mesh, directionalLight, ambientLight, axesHelper, camera, orbitControls, timer, composer,
    tree, positions, noiseTerrain, group

const renderer = threeBoxStore.getRenderer()
renderer.shadowMap.enabled = true;
renderer.setClearColor(new THREE.Color('darkblue'));

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight(0xffffff, 5);
  directionalLight.position.set(1000, 1000, 1000);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -2000;
  directionalLight.shadow.camera.right = 2000;
  directionalLight.shadow.camera.top = 2000;
  directionalLight.shadow.camera.bottom = -2000;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 10000;
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 100, 1e4);
  camera.position.set(300, 300, 500);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.maxPolarAngle = Math.PI * 80 / 180

  addNoiseTerrain()
  addTree()
  addSprite()

  const clock = new THREE.Clock();
  const render = () => {
    const delta = clock.getDelta();
    if (group) group.children.forEach(sprite => {
      sprite.position.y -= delta * 30;
      if (sprite.position.y < 0) {
        sprite.position.y = 1000;
      }
    });
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const addNoiseTerrain = () => {
  const geometry = new THREE.PlaneGeometry(3000, 3000, 100, 100);
  const noise2D = createNoise2D();
  positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = noise2D(x / 800, y / 800) * 50;
    positions.setZ(i, z);
  }

  const heightArr = [];
  for (let i = 0; i < positions.count; i++) {
    heightArr.push(positions.getZ(i));
  }
  heightArr.sort();

  const minHeight = heightArr[0];
  const maxHeight = heightArr[heightArr.length - 1];
  const height = maxHeight - minHeight;

  const colorsArr = [];
  const color1 = new THREE.Color('#eee');
  const color2 = new THREE.Color('white');

  for (let i = 0; i < positions.count; i++) {
    const percent = (positions.getZ(i) - minHeight) / height;
    const c = color1.clone().lerp(color2, percent);
    colorsArr.push(c.r, c.g, c.b);
  }
  const colors = new Float32Array(colorsArr);
  geometry.attributes.color = new THREE.BufferAttribute(colors, 3);

  const material = new THREE.MeshLambertMaterial({
    // color: new THREE.Color('white'),
    // wireframe: true
    vertexColors: true,
  });

  noiseTerrain = new THREE.Mesh(geometry, material);
  noiseTerrain.rotateX(-Math.PI / 2);
  noiseTerrain.receiveShadow = true;
  scene.add(noiseTerrain)

}

const addTree = async () => {
  tree = new THREE.Group();
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + '/gltf/tree.gltf')
  gltf.scene.scale.set(10, 10, 10);
  tree.add(gltf.scene);
  // gltf.scene.traverse(obj => {
  //   obj.castShadow = true;
  //   if (obj.isMesh) {
  //     if (obj.name === "leaves001") {
  //       obj.material.color.set('green');
  //     } else {
  //       obj.material.color.set('brown');
  //     }
  //   }
  // })
  tree.getObjectByName('leaves001').material.color.set('green');
  tree.getObjectByName('tree001').material.color.set('brown');
  gltf.scene.traverse(obj => {
    obj.castShadow = true;
  })
  let i = 0;
  while (i < positions.count) {
    const newTree = tree.clone();
    newTree.position.x = positions.getX(i);
    newTree.position.y = positions.getY(i);
    newTree.position.z = positions.getZ(i);
    noiseTerrain.add(newTree);
    newTree.rotateX(Math.PI / 2);

    i += Math.floor(300 * Math.random());
  }
}

const addSprite = () => {
  group = new THREE.Group();
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
  axesHelper: true
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
}

</script>

<style lang="scss" scoped>
.snowyForest-wrap {

}
</style>
