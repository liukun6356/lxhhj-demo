<template>
  <div class="aaa-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {onMounted, onUnmounted} from "vue";
import {Tween, Easing, Group} from '@tweenjs/tween.js';
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
let scene, material, mesh, directionalLight, ambientLight, axesHelper, camera, orbitControls, timer, composer,
    group, tubePoints = [],tweenGroup

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(300, 200, 400);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4);
  camera.position.set(200, 200, 200);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  addMesh()
  addTube()

  tweenGroup = new Group()
  const tween = new Tween({
    x: 0,
    y: 500,
    z: 800,
    rotation: 0
  }).to({
    x: 200,
    y: 800,
    z: 800,
    rotation: 180
  }).repeat(0).easing(Easing.Quadratic.InOut).onUpdate((obj) => {
    camera.position.copy(new THREE.Vector3(obj.x, obj.y, obj.z));
    camera.lookAt(0, 0, 0);
    group.rotation.y = obj.rotation / 180 * Math.PI;
  });
  tween.start()
  tweenGroup.add(tween);
  let i = 0, started = false;
  const render = () => {
    if(i< tubePoints.length - 1) {
      camera.position.copy(tubePoints[i]);
      camera.lookAt(tubePoints[i + 1]);
      i += 4;
    } else {
      if(!started) {
        tween.start();
        started = true;
      }
    }

    tweenGroup.update()
    composer.render();
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    // renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const addMesh = () => {
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

  group = new THREE.Group();
  group.add(plane);
  group.add(box);
  group.add(box2);

  scene.add(group)
}

const addTube = () => {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1000, 200, 900),
    new THREE.Vector3(-400, 800, 1000),
    new THREE.Vector3(0, 0, 0)
  ]);
  const geometry = new THREE.TubeGeometry(path, 100, 50, 30);
  const material = new THREE.MeshBasicMaterial({
    color: 'blue',
    wireframe: true
  });
  material.visible = false
  const tube = new THREE.Mesh(geometry, material);
  tube.position.set(0, 500, 800);
  scene.add(tube)

  const pointsMaterial = new THREE.PointsMaterial({
    color: 'orange',
    size: 3
  });
  const points = new THREE.Points(geometry, pointsMaterial);
  tube.add(points);


  tubePoints = path.getSpacedPoints(1000).map(item => {
    return new THREE.Vector3(item.x, item.y + 500, item.z + 800)
  });
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
.aaa-wrap {

}
</style>
