<template>
  <div class="bufferGeometry-wrap">

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
let scene, meshBasicMaterial, mesh, pointLight, axesHelper, camera, orbitControls, timer

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加 BufferGeometry 几何体
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([// 顶点
  ]);
  const attribute = new THREE.BufferAttribute(vertices, 3);
  geometry.attributes.position = attribute;
  meshBasicMaterial = new THREE.MeshBasicMaterial({ // 基础网格材质,不受光照影响
    color: new THREE.Color('orange')
  });
  mesh = new THREE.Mesh(geometry, meshBasicMaterial);
  scene.add(mesh);
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

const formDatachange = (k, v) => {
  switch (k) {
    case "planeGeometry":
      scene.remove(mesh)
      let geometry, vertices, indexes, attribute
      switch (v) {
        case "2个三角形":
          geometry = new THREE.BufferGeometry();
          vertices = new Float32Array([// 顶点
            0, 0, 0,
            100, 0, 0,
            0, 100, 0,
            0, 0, 10,
            0, 0, 100,
            100, 0, 10
          ]);
          attribute = new THREE.BufferAttribute(vertices, 3);
          geometry.attributes.position = attribute;
          mesh = new THREE.Mesh(geometry, meshBasicMaterial);
          break
        case "1个三角形":
          geometry = new THREE.BufferGeometry();
          vertices = new Float32Array([// 顶点
            0, 0, 0,
            100, 0, 0,
            0, 100, 0,
          ]);
          attribute = new THREE.BufferAttribute(vertices, 3);
          geometry.attributes.position = attribute;
          mesh = new THREE.Mesh(geometry, meshBasicMaterial);
          break
        case "正方形":
          geometry = new THREE.BufferGeometry();
          vertices = new Float32Array([// 顶点
            0, 0, 0,
            100, 0, 0,
            0, 100, 0,
            0, 100, 0,
            100, 0, 0,
            100, 100, 0
          ]);
          attribute = new THREE.BufferAttribute(vertices, 3);
          geometry.attributes.position = attribute;
          mesh = new THREE.Mesh(geometry, meshBasicMaterial);
          break
        case "优化顶点存储":
          geometry = new THREE.BufferGeometry();
          vertices = new Float32Array([// 优化顶点存储
            0, 0, 0,
            100, 0, 0,
            0, 100, 0,
            // 0, 100, 0,
            // 100, 0, 0,
            100, 100, 0
          ]);
          indexes = new Uint16Array([0, 1, 2, 2, 1, 3]); //存储一份顶点索引
          attribute = new THREE.BufferAttribute(vertices, 3);
          geometry.attributes.position = attribute;
          if (indexes) geometry.index = new THREE.BufferAttribute(indexes, 1)
          mesh = new THREE.Mesh(geometry, meshBasicMaterial);
          break
        case "planeGeometry":
          geometry = new THREE.PlaneGeometry(100, 100);
          mesh = new THREE.Mesh(geometry, meshBasicMaterial);
          break
        case "boxGeometry":
          geometry = new THREE.BoxGeometry(100, 100, 100);
          mesh = new THREE.Mesh(geometry, meshBasicMaterial);
          break
      }
      console.log(mesh)
      scene.add(mesh);
      break

    case "x":
      mesh.position.x = v;
      break
    case "y":
      mesh.position.y = v;
      break
    case "z":
      mesh.position.z = v;
      break
  }
}

// lil-gui逻辑
let gui
const formData = {
  planeGeometry: ''
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "planeGeometry", ["2个三角形", "1个三角形", "正方形", "优化顶点存储", "planeGeometry", "boxGeometry"]).onChange(planeGeometry => formDatachange("planeGeometry", planeGeometry))
  const meshFolder = gui.addFolder('Mesh');
  meshFolder.addColor(mesh.material, 'color');
  meshFolder.add(mesh.position, 'x', 0, 50, 1).name("X").onChange(x => formDatachange("x", x))
  meshFolder.add(mesh.position, 'y', 0, 50, 1).name("Y").onChange(y => formDatachange("y", y))
  meshFolder.add(mesh.position, 'z', 0, 50, 1).name("Z").onChange(z => formDatachange("z", z))
  const materialFolder = gui.addFolder('MeshBasicMaterial');
  materialFolder.add(meshBasicMaterial, "wireframe")
}

</script>

<style lang="scss" scoped>
.bufferGeometry-wrap {

}
</style>
