<template>
  <div class="geometryColor-wrap">

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
})

onUnmounted(() => {
  gui.destroy()
  cancelAnimationFrame(timer)
  renderer.clear()
})

// 场景逻辑
let scene, pointLight, axesHelper, camera, orbitControls, timer

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
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
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
    case "type":
      reset()
      let geometry, mesh, vertices, attribute, material, colors
      geometry = new THREE.BufferGeometry();
      const point1 = new THREE.Vector3(0, 0, 0);
      const point2 = new THREE.Vector3(0, 100, 0);
      const point3 = new THREE.Vector3(100, 0, 0);
      geometry.setFromPoints([point1, point2, point3]);
      switch (v) {
        case "points":
          colors = new Float32Array([ // rgb
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
          ]);
          geometry.attributes.color = new THREE.BufferAttribute(colors, 3); // 一个点对于一个颜色
          material = new THREE.PointsMaterial({vertexColors: true, size: 30,});// vertexColors为true才会用你自定义顶点颜色
          mesh = new THREE.Points(geometry, material);
          break
        case "line":
          colors = new Float32Array([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
          ]);
          geometry.attributes.color = new THREE.BufferAttribute(colors, 3);
          material = new THREE.LineBasicMaterial({
            vertexColors: true
          });
          mesh = new THREE.LineLoop(geometry, material);
          break
        case "mesh":
          colors = new Float32Array([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
          ]);
          geometry.attributes.color = new THREE.BufferAttribute(colors, 3);
          material = new THREE.MeshBasicMaterial({
            vertexColors: true
          });
          mesh = new THREE.Mesh(geometry, material)
          break
        case "curve":
          geometry = new THREE.BufferGeometry();

          const p1 = new THREE.Vector2(0, 0);
          const p2 = new THREE.Vector2(50, 200);
          const p3 = new THREE.Vector2(100, 0);
          const curve = new THREE.QuadraticBezierCurve(p1, p2, p3);
          const pointsArr = curve.getPoints(20);
          geometry.setFromPoints(pointsArr);
          const positions = geometry.attributes.position;
          const colorsArr = [];
          for (let i = 0; i < positions.count; i++) {
            const percent = i / positions.count;
            colorsArr.push(0, percent, 1 - percent);
          }
          colors = new Float32Array(colorsArr);
          geometry.attributes.color = new THREE.BufferAttribute(colors, 3);
          material = new THREE.LineBasicMaterial({
            vertexColors: true
          });
          mesh = new THREE.Line(geometry, material);
          break
      }
      scene.add(mesh)
      mesh.customType = '1'
      console.log(mesh, 1)
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
  const typeControl = gui.add(formData, "type", ["points", "line", "mesh", "curve"]).onChange(type => formDatachange("type", type))
  typeControl.setValue("points")
}

</script>

<style lang="scss" scoped>
.aaa-wrap {

}
</style>
