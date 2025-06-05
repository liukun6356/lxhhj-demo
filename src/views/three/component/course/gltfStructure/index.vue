<template>
  <div class="gltfStructure-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {usethreeBoxStore} from "@/store/modules/threeBox"
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
let scene, material, mesh, pointLight, axesHelper, camera, orbitControls, timer, loader, group

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加灯光 Light
  pointLight = new THREE.PointLight(0xffffff, 1e4); // 颜色白色#ffffff， 光照强度 1e4
  pointLight.position.set(100, 100, 100);// 80,80,80 的位置，默认照向 0,0,0 的方向
  scene.add(pointLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4);
  camera.position.set(100, 100, 100);// 在100,100,100的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  const group = new THREE.Group();
  scene.add(group)
  loader = new GLTFLoader();

  //  .gltf：所有纹理图片、顶点信息都是 base64 内联在一个文件里
  loader.load(import.meta.env.VITE_APP_MODELVIEW + "/gltf/CesiumMan.gltf", function (gltf) {
    console.log(gltf);
    group.add(gltf.scene);
    gltf.scene.scale.set(50, 50, 50)
    gltf.scene.traverse(obj => {
      if (obj.isMesh) {
        obj.material.wireframe = true
        obj.material.color.set('orange');
        obj.material.map = null
        console.log(obj.name, obj)
      }
    })
  })
  //  .gltf + .bin + .jpg/.png：图片单独存在文件，顶点信息放在 .bin
  loader.load(import.meta.env.VITE_APP_MODELVIEW + "/gltf/gltf/CesiumMan.gltf", function (gltf) {
    group.add(gltf.scene);

    gltf.scene.scale.set(50, 50, 50);
    gltf.scene.translateX(-50);

    gltf.scene.traverse(obj => {
      if (obj.isMesh) {
        obj.material.wireframe = true;
        obj.material.color.set('lightblue');
        obj.material.map = null;
      }
    })
  });

  //  .glb：也是内联所有资源，但是二进制形式体积更小
  loader.load(import.meta.env.VITE_APP_MODELVIEW + "/gltf/CesiumMan.glb", function (gltf) {
    group.add(gltf.scene);

    gltf.scene.scale.set(50, 50, 50);
    gltf.scene.translateX(50);

    gltf.scene.traverse(obj => {
      if (obj.isMesh) {
        obj.material.wireframe = true;
        obj.material.color.set('lightgreen');
        obj.material.map = null;
      }
    })
  });

  const render = () => {
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
  axesHelper: true
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
}

</script>

<style lang="scss" scoped>
.gltfStructure-wrap {

}
</style>
