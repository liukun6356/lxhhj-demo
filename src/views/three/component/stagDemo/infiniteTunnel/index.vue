<template>
  <div class="infiniteTunnel-wrap">
    1234
  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import stormPNG from "@/assets/images/three/storm.png"

const threeBoxStore = usethreeBoxStore()

onMounted(() => {
  init()
  initGui()
})

onUnmounted(() => {
  renderer.clear()
})


// 场景逻辑
let scene, material, mesh, pointLight, axesHelper, camera, orbitControls, timer

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加灯光 Light
  pointLight = new THREE.PointLight(0xffffff, 1e4); // 颜色白色#ffffff， 光照强度 1e4
  // pointLight.intensity = 1e4
  pointLight.position.set(80, 80, 80);// 80,80,80 的位置，默认照向 0,0,0 的方向
  scene.add(pointLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e6);
  camera.lookAt(0, 0, 0); // 看向 0,0,0
  camera.position.set(0.9, -520, 6.5);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);
  // 添加管道
  const geometry = new THREE.CylinderGeometry(30, 50, 1000, 32, 32, true);
  const loader = new THREE.TextureLoader()
  const texture = loader.load(stormPNG)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 2)
  const material = new THREE.MeshBasicMaterial({
    // map: texture,
    alphaMap: texture, // 黑白图
    transparent: true,
    side: THREE.BackSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh)

  let H = 0;
  const clock = new THREE.Clock();
  const render = () => {
    const delta = clock.getDelta();
    H += 0.002;
    if (H > 1) {
      H = 0;
    }
    if (formData.colorChange) mesh.material.color.setHSL(H, 0.5, 0.5);
    if (formData.animation) {
      mesh.material.alphaMap.offset.y += 0.01;
      mesh.rotation.y += delta * 0.5;
    }
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
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
  axesHelper: false,
  animation: false,
  colorChange: false
}

const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "animation")
  gui.add(formData, "colorChange")
}
</script>

<style lang="scss" scoped>
.infiniteTunnel-wrap {

}
</style>
