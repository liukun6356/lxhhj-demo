<template>
  <div class="pieChart-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
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
let scene, material, directionalLight, ambientLight, axesHelper, orbitControls, timer, composer, group

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(300, 200, 400);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(1e3);
  scene.add(axesHelper);

  // 创建透视相机
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(500, 600, 800);
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  const render = () => {
    composer.render();
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    // renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const createPieChart = () => {
  group = new THREE.Group()
  group.customType = "111"
  scene.add(group)
  const data = [
    {name: '春节销售额', value: 1000},
    {name: '夏节销售额', value: 3000},
    {name: '秋节销售额', value: 800},
    {name: '冬节销售额', value: 500}
  ];
  let total = 0;
  data.forEach(item => {
    total += item.value;
  });

  let usedColor = [];
  let colors = ['red', 'pink', 'blue', 'purple', 'orange', 'lightblue', 'green', 'lightgreen']

  function getRandomColor() {
    let index = Math.floor(Math.random() * colors.length);
    while (usedColor.includes(index)) {
      index = Math.floor(Math.random() * colors.length);
    }
    usedColor.push(index);
    return colors[index];
  }

  let startAngle = 0, R = 200

  const angles = data.map(item => {
    return item.value / total * 360;
  });

  angles.map((angle, i) => {
    const curvePath = new THREE.CurvePath();

    const rad = THREE.MathUtils.degToRad(angle);
    const endAngle = startAngle + rad;

    const x1 = R * Math.cos(startAngle);
    const y1 = R * Math.sin(startAngle);

    const x2 = R * Math.cos(endAngle);
    const y2 = R * Math.sin(endAngle);

    const v1 = new THREE.Vector2(0, 0);
    const v2 = new THREE.Vector2(x1, y1);
    const v3 = new THREE.Vector2(x2, y2);

    const line1 = new THREE.LineCurve(v1, v2);
    curvePath.add(line1);

    const arc = new THREE.EllipseCurve(0, 0, R, R, startAngle, endAngle);
    curvePath.add(arc);

    const line2 = new THREE.LineCurve(v1, v3);
    curvePath.add(line2);

    const points = curvePath.getPoints(100);
    const shape = new THREE.Shape(points);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 100
    })
    const material = new THREE.MeshPhongMaterial({
      color: getRandomColor()
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    startAngle += rad;
  })
  group.rotateX(-Math.PI / 2)
}

const addMesh = () => {
  const curvePath = new THREE.CurvePath();
  const v1 = new THREE.Vector2(0, 0);
  const v2 = new THREE.Vector2(0, 300);
  const v3 = new THREE.Vector2(300, 0);

  const line1 = new THREE.LineCurve(v1, v3);
  curvePath.add(line1);

  const arc = new THREE.EllipseCurve(0, 0, 300, 300, 0, Math.PI / 2);
  curvePath.add(arc);

  const line2 = new THREE.LineCurve(v1, v2);
  curvePath.add(line2);

  const points = curvePath.getPoints(100);
  const shape = new THREE.Shape(points);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 100
  })
  const material = new THREE.MeshPhongMaterial({
    color: 'orange'
  });

  group = new THREE.Mesh(geometry, material);
  group.customType = "111"

  group.rotateX(-Math.PI / 2);
  scene.add(group)
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
  }
}

// lil-gui逻辑
let gui, typeControl
const formData = {
  axesHelper: true,
  type: ""
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type",["mesh","pieChat"]).onChange(type => {
    reset()
    switch (type) {
      case "mesh":
        addMesh()
        break
      case "pieChat":
        createPieChart()
        break
    }
  })
  typeControl.setValue("mesh")
}

</script>

<style lang="scss" scoped>
.pieChart-wrap {

}
</style>
