<template>
  <div class="generateGeometry-wrap">

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
let scene, material, mesh, pointLight, ambientLight, axesHelper, camera, orbitControls, timer, curve

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加灯光 Light
  // pointLight = new THREE.PointLight(0xffffff, 1e4); // 颜色白色#ffffff， 光照强度 1e4
  // pointLight.intensity = 1e4
  // pointLight.position.set(80, 80, 80);// 80,80,80 的位置，默认照向 0,0,0 的方向
  // scene.add(pointLight);

  // 添加环境光
  ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

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

const formDatachange = (k, v?: any) => {
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
    case "type":
      reset()
      tubeFolder.hide()
      let pointsArr, geometry, geometry2, points2, line2, shape, path
      switch (v) {
        case "LatheGeometry":
          pointsArr = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(50, 50),
            new THREE.Vector2(20, 80),
            new THREE.Vector2(0, 150)
          ];
          geometry = new THREE.LatheGeometry(pointsArr, 32) // 车削缓冲几何体
          mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
            color: new THREE.Color('pink'),
            side: THREE.DoubleSide
          }))
          geometry2 = new THREE.BufferGeometry();
          geometry2.setFromPoints(pointsArr);
          points2 = new THREE.Points(geometry2, new THREE.PointsMaterial({
            color: new THREE.Color('blue'),
            size: 10
          }));
          line2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial());
          mesh.add(points2, line2);
          break
        case "TubeGeometry":
          tubeFolder.show()
          const p1 = new THREE.Vector3(-100, 0, 0);
          const p2 = new THREE.Vector3(50, 100, 0);
          const p3 = new THREE.Vector3(100, 0, 100);
          const p4 = new THREE.Vector3(100, 0, 0);

          curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
          geometry = new THREE.TubeGeometry(curve, 50, 20, 20)// 管道缓冲几何体
          mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
            color: new THREE.Color('orange'),
            side: THREE.DoubleSide,
            wireframe: true
          }))
          geometry2 = new THREE.BufferGeometry();
          geometry2.setFromPoints([p1, p2, p3, p4]);
          const material2 = new THREE.PointsMaterial({
            color: new THREE.Color('blue'),
            size: 10
          });
          points2 = new THREE.Points(geometry2, material2);
          line2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial());
          mesh.add(points2, line2);
          break
        case "ShapeGeometry":
          // 方式1
          // pointsArr = [
          //   new THREE.Vector2(100, 0),
          //   new THREE.Vector2(50, 20),
          //   new THREE.Vector2(0, 0),
          //   new THREE.Vector2(0, 50),
          //   new THREE.Vector2(50, 100)
          // ];
          // const shape = new THREE.Shape(pointsArr)
          // 方式2
          shape = new THREE.Shape();
          shape.moveTo(100, 0);
          shape.lineTo(50, 20);
          shape.lineTo(0, 0);
          shape.lineTo(0, 50);
          shape.lineTo(80, 100);
          path = new THREE.Path();
          path.arc(30, 30, 10, 0, 2 * Math.PI);
          shape.holes.push(path);
          geometry = new THREE.ShapeGeometry(shape) // 形状缓冲几何体
          mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
            color: new THREE.Color('lightgreen'),
            side: THREE.DoubleSide
          }))
          break
        case "ExtrudeGeometry":
          shape = new THREE.Shape();
          shape.moveTo(100, 0);
          shape.lineTo(50, 20);
          shape.lineTo(0, 0);
          shape.lineTo(0, 50);
          shape.lineTo(80, 100);
          path = new THREE.Path();
          path.arc(30, 30, 10, 0, 2 * Math.PI);
          shape.holes.push(path);
          geometry = new THREE.ExtrudeGeometry(shape,{depth:100}) // 挤压缓冲几何体
          mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
            color: new THREE.Color('lightgreen'),
            side: THREE.DoubleSide
          }))
          break
      }
      mesh.customType = '1'
      scene.add(mesh)
      break
    case "tubuChange":
      mesh.geometry = new THREE.TubeGeometry(
          curve,
          formData.tubularSegments,
          formData.radius,
          formData.radialSegments
      );
      break
  }
}

// lil-gui逻辑
let gui, tubeFolder
const formData = {
  axesHelper: true,
  type: "",
  tubularSegments: 50,
  radius: 20,
  radialSegments: 20
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "type", ["LatheGeometry", "TubeGeometry", "ShapeGeometry", "ExtrudeGeometry"]).onChange(type => formDatachange("type", type))
  tubeFolder = gui.addFolder('Tube');
  tubeFolder.add(formData, 'tubularSegments', 3, 100, 1).name('管道方向分段数').onChange(() => formDatachange("tubuChange"))
  tubeFolder.add(formData, 'radius', 10, 100, 0.1).name('半径').onChange(() => formDatachange("tubuChange"))
  tubeFolder.add(formData, 'radialSegments', 3, 100, 1).name('分段').onChange(() => formDatachange("tubuChange"))
  tubeFolder.hide()
  // tubeFolder.
}

</script>

<style lang="scss" scoped>
.generateGeometry-wrap {

}
</style>
