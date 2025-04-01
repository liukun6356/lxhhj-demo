<template>
  <div class="textureUv-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import bgPNG from "@/assets/images/threeCourse/bg.png"
import muxingJPG from "@/assets/images/threeCourse/muxing.jpg"

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

  const render = () => {
    if(mesh?.customType)mesh.material.map.offset.y += 0.001;
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const formDatachange = (k, v) => {
  let geometry, texture, uvs
  const  loader = new THREE.TextureLoader();
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
    case "type":
      scene.remove(mesh)
      switch (v) {
        case "uvAxis":
          geometry = new THREE.PlaneGeometry(200, 100);
          texture = loader.load(bgPNG);
          texture.colorSpace = THREE.SRGBColorSpace;
          material = new THREE.MeshBasicMaterial(({
            map: texture
          }));
          mesh = new THREE.Mesh(geometry, material)
          break
        case "uvAxis(0.5)":
          geometry = new THREE.PlaneGeometry(200, 100);
          texture = loader.load(bgPNG);
          texture.colorSpace = THREE.SRGBColorSpace;
          uvs = new Float32Array([ // 仅显示左下角部分
            0, 0.5,
            0.5, 0.5,
            0, 0,
            0.5, 0
          ])
          geometry.attributes.uv = new THREE.BufferAttribute(uvs, 2)
          material = new THREE.MeshBasicMaterial(({
            map: texture
          }));
          mesh = new THREE.Mesh(geometry, material)
          break
        case "uvAnimation":
          texture = loader.load(muxingJPG);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapT = THREE.RepeatWrapping;
          geometry = new THREE.SphereGeometry(50);
          material = new THREE.MeshBasicMaterial({
            map: texture
          });
          mesh = new THREE.Mesh(geometry, material);
          mesh.customType = 'uvAnimation'
          break
      }
      console.log(mesh, 22)
      scene.add(mesh)
      break
  }
}

// lil-gui逻辑
let gui
const formData = {
  axesHelper: true,
  type: ""
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  const typeControl =  gui.add(formData, "type", ['uvAxis', 'uvAxis(0.5)', "uvAnimation"]).onChange(type => formDatachange("type", type))
  typeControl.setValue('uvAxis')
}

</script>

<style lang="scss" scoped>
.textureUv-wrap {

}
</style>
