<template>
  <div class="tubeTravel-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import stonePNG from "@/assets/images/threeCourse/stone.png"

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
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(200, 200, 200);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  // 添加管道
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-100, 20, 90),
    new THREE.Vector3(-40, 80, 100),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(60, -60, 0),
    new THREE.Vector3(100, -40, 80),
    new THREE.Vector3(150, 60, 60)
  ]);

  const geometry = new THREE.TubeGeometry(path, 100, 5, 30);

  const loader = new THREE.TextureLoader()
  const texture = loader.load(stonePNG)
  texture.wrapS = THREE.RepeatWrapping
  texture.repeat.x = 20
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    aoMap: texture,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh)

  const tubePoints = path.getSpacedPoints(1000) // 获取一千个均匀的间隔点

  let i = 0
  const render = () => {
    if (formData.animation) {
      if (i < tubePoints.length - 1) {
        camera.position.copy(tubePoints[i]);
        camera.lookAt(tubePoints[i + 1]);
        i += 1;
      } else {
        i = 0;
      }
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
  axesHelper: true,
  animation: false
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "animation")
}

</script>

<style lang="scss" scoped>
.tubeTravel-wrap {

}
</style>
