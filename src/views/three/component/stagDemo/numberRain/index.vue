<template>
  <div class="numberRain-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import SpriteText from "three-spritetext";
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
let scene, material, mesh, directionalLight, ambientLight, axesHelper, orbitControls, timer, composer,
    group, columns

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()

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
  camera.near = 300
  camera.far = 1e4

  camera.position.set(window.innerWidth / 2, window.innerHeight / 2, 500);
  camera.lookAt(window.innerWidth / 2, window.innerHeight / 2, 0);
  // camera.updateProjectionMatrix();

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  // orbitControls = new OrbitControls(camera, renderer.domElement); // 把 OrbitControls 注释掉，因为它默认会把 lookAt 重置到 0,0，0

  addMesh()

  const render = () => {
    composer.render();
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    // renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    if (formData.pause) columns.forEach(column => {
      column.forEach(sprite => {
        sprite.position.y -= 3 + 3 * Math.random()
        if (sprite.position.y < 0) {
          sprite.position.y = window.innerHeight
        }
      })
    })

    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const addMesh = () => {
  group = new THREE.Group()
  const columnWidth = 50;
  const columnNum = Math.floor(window.innerWidth / columnWidth);

  const fontSize = 30;
  const lineHeight = fontSize * 1.3;

  const textNumOfColumn = Math.ceil(window.innerHeight * 2 / lineHeight);

  columns = [];

  for (let i = 0; i < columnNum; i++) {
    const column = [];

    for (let j = 0; j < textNumOfColumn; j++) {
      const text = Math.floor(Math.random() * 10) + '';

      const spriteText = new SpriteText(text, 20, 'green');
      spriteText.strokeWidth = 1;
      spriteText.strokeColor = 'lightgreen';

      const x = i * columnWidth;
      const y = j * lineHeight + Math.random() * 60;
      spriteText.position.set(x, y, 0);
      spriteText.material.opacity = 0.5 + 0.5 * Math.random()

      group.add(spriteText);
      column.push(spriteText);
    }
    columns.push(column);
  }
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
  pause: true
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "pause")
}

</script>

<style lang="scss" scoped>
.numberRain-wrap {

}
</style>
