<template>
  <div class="vertexNormal-wrap">

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
  renderer.clear()
  gui.destroy()
  cancelAnimationFrame(timer)
})


// 场景逻辑
let scene, pointLight, axesHelper, camera, orbitControls, timer

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加灯光 Light
  pointLight = new THREE.DirectionalLight(0xffffff, 2); // 颜色白色#ffffff， 光照强度 1e4
  // pointLight.intensity = 1e4
  pointLight.position.set(80, 80, 80);// 80,80,80 的位置，默认照向 0,0,0 的方向
  scene.add(pointLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e6);
  camera.position.set(200, 200, 200);
  camera.lookAt(0, 0, 0);

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
  let geometry, mesh, vertices, attribute, material
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
    case "type":
      reset()
      switch (v) {
        case "Tube":
          // 添加管道
          const p1 = new THREE.Vector3(-100, 0, 0);
          const p2 = new THREE.Vector3(50, 100, 0);
          const p3 = new THREE.Vector3(100, 0, 100);
          const p4 = new THREE.Vector3(100, 0, 0);
          const curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
          geometry = new THREE.TubeGeometry(curve, 50, 10, 20);
          material = new THREE.MeshPhongMaterial({
            color: new THREE.Color('white'),
            shininess: 1000
          });
          mesh = new THREE.Mesh(geometry, material);
          break
        case "polygon":
          vertices = new Float32Array([
            0, 0, 0,
            100, 0, 0,
            0, 100, 0,
            100, 100, -100
          ]);
          geometry = new THREE.BufferGeometry()
          // 需要加上法线方向，才能看到光照
          // const normals = new Float32Array([
          //   0, 0, 1,
          //   0, 0, 1,
          //   0, 0, 1,
          //   0, 0, 1
          // ]);
          const normals = new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            1, 1, 0
          ]);
          geometry.attributes.normal = new THREE.BufferAttribute(normals, 3);
          attribute = new THREE.BufferAttribute(vertices, 3)
          geometry.attributes.position = attribute;
          const indexes = new Uint16Array([
            0, 1, 2, 2, 1, 3
          ]);
          geometry.index = new THREE.BufferAttribute(indexes, 1)

          material = new THREE.MeshPhongMaterial({
            color: new THREE.Color('orange'),
            shininess: 1000
          });
          mesh = new THREE.Mesh(geometry, material)
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
  axesHelper: false,
  animation: false,
}

const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  const typeControl = gui.add(formData, "type", ["Tube", "polygon",]).onChange(type => formDatachange("type", type))
  typeControl.setValue("Tube")
}

</script>

<style lang="scss" scoped>
.vertexNormal-wrap {

}
</style>
