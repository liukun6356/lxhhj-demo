<template>
  <div class="lightHelper-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
  initGui()
  addMesh()
})

onUnmounted(() => {
  gui.destroy()
  cancelAnimationFrame(timer)
  renderer.clear()
})

// 场景逻辑
let scene, material, mesh, light, axesHelper, camera, orbitControls, timer, helper

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4);
  camera.position.set(1000, 1000, 1000);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  const render = () => {
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const addMesh = () => {
  const group = new THREE.Group()
  scene.add(group)
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -50;
  const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  const box2 = box.clone();
  box2.position.x = 200;
  group.add(plane)
  group.add(box)
  group.add(box2)
}

const reset = () => {
  // 场景中遍历是否为 mesh 的对象
  scene.remove(helper)
  scene.remove(light)

}

const formDatachange = (k, v) => {
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
    case "type":
      reset()
      LightFolder?.hide()
      switch (v) {
        case "DirectionalLight":
          light = new THREE.DirectionalLight(0xffffff);
          light.position.set(400, 500, 300);
          light.lookAt(0, 0, 0);
          scene.add(light)
          helper = new THREE.DirectionalLightHelper(light, 100) // 正方形边长为 100
          helper.name = "helper"
          scene.add(helper)

          LightFolder = gui.addFolder("平行光")
          LightFolder.add(light.position, 'x', 10, 1000, 1).onChange(() => light.lookAt(0, 0, 0))
          LightFolder.add(light.position, 'y', 10, 1000, 1).onChange(() => light.lookAt(0, 0, 0))
          LightFolder.add(light.position, 'z', 10, 1000, 1).onChange(() => light.lookAt(0, 0, 0))
          LightFolder.add(light, 'intensity', 0, 10, 1)
          break
        case "PointLight":
          light = new THREE.PointLight(0xffffff, 1000000);
          light.position.set(400, 500, 300);
          light.lookAt(0, 0, 0);
          scene.add(light)
          helper = new THREE.PointLightHelper(light, 100);
          scene.add(helper)

          LightFolder = gui.addFolder("点光源")
          LightFolder.add(light.position, 'x', 10, 1000, 1).onChange(() => light.lookAt(0, 0, 0))
          LightFolder.add(light.position, 'y', 10, 1000, 1).onChange(() => light.lookAt(0, 0, 0))
          LightFolder.add(light.position, 'z', 10, 1000, 1).onChange(() => light.lookAt(0, 0, 0))
          LightFolder.add(light, 'intensity', 0, 1e6, 1)
          break
        case "AmbientLight":
          light = new THREE.AmbientLight();
          scene.add(light);

          LightFolder = gui.addFolder("环境光")
          break
        case "SpotLight":
          light = new THREE.SpotLight(0xffffff, 1000000);
          light.distance = 1000;
          light.angle = Math.PI / 6;
          light.position.set(400, 500, 300);
          light.lookAt(0, 0, 0);
          scene.add(light)
          helper = new THREE.SpotLightHelper(light);
          scene.add(helper);

          LightFolder = gui.addFolder("聚光源")
          LightFolder.add(light.position, 'x',10,1000,1).onChange(() => light.lookAt(0, 0, 0));
          LightFolder.add(light.position, 'y',10,1000,1).onChange(() => light.lookAt(0, 0, 0));
          LightFolder.add(light.position, 'z',10,1000,1).onChange(() => light.lookAt(0, 0, 0));
          LightFolder.add(light, 'angle', {'30': Math.PI / 6, '60': Math.PI / 3,}).onChange(() => light.lookAt(0, 0, 0));
          LightFolder.add(light, 'intensity', 0, 1e6, 1)
          LightFolder.add(light, 'distance',800,2000,1).min(800).max(2000);
          break
      }
      break
  }
}

// lil-gui逻辑
let gui, LightFolder
const formData = {
  axesHelper: true,
  type: "",
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  const typeControl = gui.add(formData, "type", ["DirectionalLight", "PointLight","AmbientLight", "SpotLight"]).onChange(type => formDatachange("type", type))
  typeControl.setValue("PointLight")
}

</script>

<style lang="scss" scoped>
.lightHelper-wrap {

}
</style>
