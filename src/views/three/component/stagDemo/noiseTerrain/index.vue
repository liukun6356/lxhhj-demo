<template>
  <div class="noiseTerrain-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {onMounted, onUnmounted} from "vue";
import {createNoise2D} from 'simplex-noise';
import GUI from "lil-gui";

const noise2D = createNoise2D();

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
let scene, meshBasicMaterial, geometry, mesh, axesHelper, camera, orbitControls, timer

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  geometry = new THREE.PlaneGeometry(3000, 3000, 100, 100);

  meshBasicMaterial = new THREE.MeshBasicMaterial({ // 基础网格材质,不受光照影响
    color: new THREE.Color('orange'),
    wireframe: true,
    side: THREE.DoubleSide
  });
  mesh = new THREE.Mesh(geometry, meshBasicMaterial);
  mesh.rotateX(Math.PI / 2); // 绕 x 轴旋转 90 度
  scene.add(mesh);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(450, 150, 100);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.addEventListener('change', () => {
    // console.log(camera.position)
  })

  const render = () => {
    if (formData.animation) {
      updatePosition()
      mesh.rotateZ(0.003)
    }
    renderer.render(scene, camera);
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const updatePosition = () => {
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);

    const z = noise2D(x / 300, y / 300) * 50;
    const sinNum = Math.sin(Date.now() * 0.002 + x * 0.05) * 10;

    positions.setZ(i, z + sinNum);
  }
  positions.needsUpdate = true; // 触发更新
}

const formDatachange = (k, v) => {
  let positions
  switch (k) {
    case "type":
      animationControl.hide()
      animationControl.setValue(false)
      formData.animation = false
      switch (v) {
        case "随机地形":
          positions = geometry.attributes.position;

          for (let i = 0; i < positions.count; i++) {
            positions.setZ(i, Math.random() * 50);
          }
          positions.needsUpdate = true
          break
        case "噪声地形":
          animationControl.show()
          positions = geometry.attributes.position;

          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            // const z = noise2D(x / 100, y / 100) * 50;
            const z = noise2D(x / 300, y / 300) * 50;
            positions.setZ(i, z);
          }
          positions.needsUpdate = true
          break
      }
      mesh.geometry = geometry
      break
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
  }
}

// lil-gui逻辑
let gui, animationControl
const formData = {
  type: "",
  axesHelper: true,
  animation: false
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "type", ["随机地形", "噪声地形"]).onChange(type => formDatachange("type", type))
  animationControl = gui.add(formData, "animation").hide()
}

</script>

<style lang="scss" scoped>
.noiseTerrain-wrap {

}
</style>
