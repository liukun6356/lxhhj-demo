<template>
  <div class="curve-wrap">

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
let scene, material, pointLight, axesHelper, camera, orbitControls, timer

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
  let geometry, mesh, curve, pointsArr, geometry2, points2, line2, p1, p2, p3, p4, arc
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
    case "type":
      reset()
      switch (v) {
        case "EllipseCurve":
          arc = new THREE.EllipseCurve(0, 0, 100, 50, 0, Math.PI / 2);
          // 椭圆中心是 0,0，长短半轴长分别是 100、50, 0°到90°
          const pointsList = arc.getPoints(20);// 从中取出一些点的坐标，传入的是分段数20,就是 21 个点
          geometry = new THREE.BufferGeometry();
          geometry.setFromPoints(pointsList);
          mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: new THREE.Color('orange'),
            size: 10
          }));
          scene.add(mesh)
          break
        case "SplineCurve":
          const arr = [
            new THREE.Vector2(-100, 0),
            new THREE.Vector2(-50, 50),
            new THREE.Vector2(0, 0),
            new THREE.Vector2(50, -50),
            new THREE.Vector2(100, 0)
          ];
          curve = new THREE.SplineCurve(arr);
          pointsArr = curve.getPoints(20); // 越大越接近曲线
          geometry = new THREE.BufferGeometry();
          geometry.setFromPoints(pointsArr);
          mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: new THREE.Color('orange'),
          }));
          const points = new THREE.Points(geometry, new THREE.PointsMaterial({
            color: new THREE.Color('pink'),
            size: 5
          }));
          mesh.add(points)
          geometry2 = new THREE.BufferGeometry();
          geometry2.setFromPoints(arr);
          points2 = new THREE.Points(geometry2, new THREE.PointsMaterial({
            color: new THREE.Color('green'),
            size: 10
          }));
          line2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial());
          mesh.add(points2, line2);
          break
        case "QuadraticBezierCurve":
          p1 = new THREE.Vector2(0, 0);
          p2 = new THREE.Vector2(50, 100);
          p3 = new THREE.Vector2(100, 0);
          curve = new THREE.QuadraticBezierCurve(p1, p2, p3);
          pointsArr = curve.getPoints(20);
          geometry = new THREE.BufferGeometry();
          geometry.setFromPoints(pointsArr);
          const material = new THREE.LineBasicMaterial({
            color: new THREE.Color('orange')
          });
          mesh = new THREE.Line(geometry, material);
          geometry2 = new THREE.BufferGeometry();
          geometry2.setFromPoints([p1, p2, p3]);
          points2 = new THREE.Points(geometry2, new THREE.PointsMaterial({
            color: new THREE.Color('pink'),
            size: 5
          }));
          line2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial());
          mesh.add(points2, line2);
          break
        case "CubicBezierCurve3":
          p1 = new THREE.Vector3(-100, 0, 0);
          p2 = new THREE.Vector3(50, 100, 0);
          p3 = new THREE.Vector3(100, 0, 100);
          p4 = new THREE.Vector3(100, 0, 0);
          curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
          pointsArr = curve.getPoints(20);
          geometry = new THREE.BufferGeometry();
          geometry.setFromPoints(pointsArr);
          mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: new THREE.Color('orange')
          }));
          geometry2 = new THREE.BufferGeometry();
          geometry2.setFromPoints([p1, p2, p3, p4]);
          points2 = new THREE.Points(geometry2, new THREE.PointsMaterial({
            color: new THREE.Color('pink'),
            size: 5
          }));
          line2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial());
          mesh.add(points2, line2);
          break
        case "CurvePath":
          p1 = new THREE.Vector2(0, 0);
          p2 = new THREE.Vector2(100, 100);
          const line1 = new THREE.LineCurve(p1, p2);
          arc = new THREE.EllipseCurve(0, 100, 100, 100, 0, Math.PI);
          p3 = new THREE.Vector2(-100, 100);
          p4 = new THREE.Vector2(0, 0);
          line2 = new THREE.LineCurve(p3, p4);
          const curvePath = new THREE.CurvePath();
          curvePath.add(line1);
          curvePath.add(arc);
          curvePath.add(line2);
          pointsArr = curvePath.getPoints(20);
          geometry = new THREE.BufferGeometry();
          geometry.setFromPoints(pointsArr);
          mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: new THREE.Color('pink')
          }));
          break
      }
      mesh.customType = "1"
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
  const typeControl =  gui.add(formData, "type", ["EllipseCurve", "SplineCurve", "QuadraticBezierCurve", "CubicBezierCurve3", "CurvePath"]).onChange(type => formDatachange("type", type))
  typeControl.setValue("EllipseCurve")
}

</script>

<style lang="scss" scoped>
.curve-wrap {

}
</style>
