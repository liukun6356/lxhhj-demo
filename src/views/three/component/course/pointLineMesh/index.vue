<template>
  <div class="pointLineMesh-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {usethreeBoxStore} from "@/store/modules/threeBox";
import {onMounted, onUnmounted} from "vue";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
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
let scene, material, mesh, pointLight, axesHelper, camera, orbitControls, timer
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
  material = new THREE.MeshBasicMaterial({ // 基础网格材质,不受光照影响
    color: new THREE.Color('orange')
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  // 添加灯光 Light
  pointLight = new THREE.PointLight(0xffffff, 1e4);
  // pointLight.intensity = 1e4
  pointLight.position.set(80, 80, 80);
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
  let geometry, vertices, indexes, attribute
  switch (k) {
    case "geometry":
      scene.remove(mesh)
      SegmentsFolder.hide()
      switch (v) {
        case "点模型":
          geometry = new THREE.BufferGeometry()
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
          material = new THREE.PointsMaterial({
            color: new THREE.Color('orange'),
            size: 10
          });
          mesh = new THREE.Points(geometry, material);
          break
        case "线模型":
          geometry = new THREE.BufferGeometry();
          vertices = new Float32Array([// 顶点
            0, 0, 0,
            100, 0, 0,
            0, 100, 0,
            0, 0, 100,
            100, 100, 0
          ]);
          attribute = new THREE.BufferAttribute(vertices, 3);
          geometry.attributes.position = attribute;
          material = new THREE.LineBasicMaterial({
            color: new THREE.Color('red')
          });
          mesh = new THREE.Line(geometry, material);
          break
        case "线模型(loop)":
          geometry = new THREE.BufferGeometry();
          vertices = new Float32Array([// 顶点
            0, 0, 0,
            100, 0, 0,
            0, 100, 0,
            0, 0, 100,
            100, 100, 0
          ]);
          attribute = new THREE.BufferAttribute(vertices, 3);
          geometry.attributes.position = attribute;
          material = new THREE.LineBasicMaterial({
            color: new THREE.Color('red')
          });
          mesh = new THREE.LineLoop(geometry, material); // 首尾相连
          break
        case "线模型(LineSegments)":
          geometry = new THREE.BufferGeometry();
          vertices = new Float32Array([// 顶点
            0, 0, 0,
            100, 0, 0,
            0, 100, 0,
            0, 0, 100,
            100, 100, 0,
            0, 0, 50
          ]);
          attribute = new THREE.BufferAttribute(vertices, 3);
          geometry.attributes.position = attribute;
          material = new THREE.LineBasicMaterial({
            color: new THREE.Color('red')
          });
          mesh = new THREE.LineSegments(geometry, material); // 每两个点练成一条线段
          break
        case "网格模型":
          geometry = new THREE.BufferGeometry();
          vertices = new Float32Array([// 顶点
            0, 0, 0,
            100, 0, 0,
            0, 100, 0,
            100, 100, 0
          ]);
          attribute = new THREE.BufferAttribute(vertices, 3);
          geometry.attributes.position = attribute;
          indexes = new Uint16Array([0, 1, 2, 2, 1, 3])
          // indexes = new Uint16Array([0, 1, 2, 2, 3, 1])
          geometry.index = new THREE.BufferAttribute(indexes, 1)
          material = new THREE.MeshBasicMaterial({
            color: new THREE.Color('orange'),
            side: THREE.DoubleSide // 双面可见,从相机看过去的方向，如果一个三角形是逆时针连接的顶点，就是正面，顺时针就是反面
          })
          mesh = new THREE.Mesh(geometry, material)
          break
        case "PlaneGeometry":
          SegmentsFolder.show()
          SegmentsFolder.children.find(item=>item.property === 'widthSegments').show()
          SegmentsFolder.children.find(item=>item.property === 'heightSegments').show()
          SegmentsFolder.children.find(item=>item.property === 'radiusSegments').hide()
          geometry = new THREE.PlaneGeometry(100, 100, 2, 3); // 宽高分段数
          material = new THREE.MeshBasicMaterial(({
            color: new THREE.Color('orange'),
            wireframe: true,
          }));
          mesh = new THREE.Mesh(geometry, material);
          break
        case "CylinderGeometry":
          SegmentsFolder.show()
          SegmentsFolder.children.find(item=>item.property === 'widthSegments').hide()
          SegmentsFolder.children.find(item=>item.property === 'heightSegments').hide()
          SegmentsFolder.children.find(item=>item.property === 'radiusSegments').show()
          geometry = new THREE.CylinderGeometry(50, 50, 80)
          material = new THREE.MeshBasicMaterial(({
            color: new THREE.Color('orange'),
          }));
          mesh = new THREE.Mesh(geometry, material);
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
    case "wireframe":
      material.wireframe = v
      break
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
    case "widthSegments":
      geometry = new THREE.PlaneGeometry(100, 100, v, mesh.geometry.parameters.heightSegments);
      mesh.geometry = geometry
      break
    case "heightSegments":
      geometry = new THREE.PlaneGeometry(100, 100, mesh.geometry.parameters.widthSegments, v);
      mesh.geometry = geometry
      break
    case "radiusSegments":
      geometry = new THREE.CylinderGeometry(50, 50, 80, v)
      mesh.geometry = geometry
      break
  }
}

// lil-gui逻辑
let gui, SegmentsFolder
const formData = {
  geometry: '',
  axesHelper: true,
  widthSegments: 1,
  heightSegments: 1,
  radiusSegments: 32,
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  const geometryControl =  gui.add(formData, "geometry", ["点模型", "线模型", "线模型(loop)", "线模型(LineSegments)", "网格模型", "PlaneGeometry", "CylinderGeometry"]).onChange(geometry => formDatachange("geometry", geometry))
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  const meshFolder = gui.addFolder('Mesh');
  meshFolder.addColor(mesh.material, 'color');
  meshFolder.add(mesh.position, 'x', 0, 50, 1).name("X").onChange(x => formDatachange("x", x))
  meshFolder.add(mesh.position, 'y', 0, 50, 1).name("Y").onChange(y => formDatachange("y", y))
  meshFolder.add(mesh.position, 'z', 0, 50, 1).name("Z").onChange(z => formDatachange("z", z))
  const materialFolder = gui.addFolder('MeshBasicMaterial');
  materialFolder.add(material, "wireframe").onChange(wireframe => formDatachange("wireframe", wireframe))
  SegmentsFolder = gui.addFolder('Segments');
  SegmentsFolder.hide()
  SegmentsFolder.add(formData, "widthSegments", 1, 30, 1).onChange(widthSegments => formDatachange("widthSegments", widthSegments))
  SegmentsFolder.add(formData, "heightSegments", 1, 30, 1).onChange(heightSegments => formDatachange("heightSegments", heightSegments))
  SegmentsFolder.add(formData, "radiusSegments", 1, 64, 1).onChange(radiusSegments => formDatachange("radiusSegments", radiusSegments))
  geometryControl.setValue("点模型")
}
</script>

<style lang="scss" scoped>
.pointLineMesh-wrap {

}
</style>
