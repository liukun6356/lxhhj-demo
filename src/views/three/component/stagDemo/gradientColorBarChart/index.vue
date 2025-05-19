<template>
  <div class="gradientColorBarChart-wrap">

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
let scene, material, mesh, directionalLight, ambientLight, axesHelper, camera, orbitControls, timer,
    group, xLine, yLine, xScaleLine, yScaleLine

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加平行光 Light
  directionalLight = new THREE.DirectionalLight(0xffffff, 1e4);
  directionalLight.position.set(500, 400, 300);
  scene.add(directionalLight);

  // 添加环境光
  ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1e4);
  camera.position.set(30, 0, 240);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  group = new THREE.Group();
  // 画 X，Y轴
  xLine = createLine('x');
  yLine = createLine('y');
  xScaleLine = createScaleLine('x')
  yScaleLine = createScaleLine('y')

  const bar = createBar([70, 20, 100, 80, 40, 50]);
  group.add(xLine, yLine, xScaleLine, yScaleLine, bar);
  scene.add(group)

  const render = () => {
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const createLine = (type) => { // x,y轴
  const points = [
    new THREE.Vector3(0, 0, 0),
    type === 'y' ? new THREE.Vector3(0, 125, 0) : new THREE.Vector3(125, 0, 0)
  ]
  const geometry = new THREE.BufferGeometry()
  const material = new THREE.LineBasicMaterial({
    color: "#ffffff"
  })
  geometry.setFromPoints(points)

  const line = new THREE.Line(geometry, material)
  return line
}

const createScaleLine = (type) => { //刻度
  const points = []
  for (let i = 0; i <= 120; i += 10) {
    if (type === 'y') {
      points.push(new THREE.Vector3(0, i, 0))
      points.push(new THREE.Vector3(-5, i, 0))
    } else {
      points.push(new THREE.Vector3(i, 0, 0))
      points.push(new THREE.Vector3(i, -5, 0))
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: "#ffffff"
  })
  const scaleLine = new THREE.LineSegments(geometry, material)
  return scaleLine
}

const createBar = (dataArr) => {
  const bars = new THREE.Group()
  dataArr.forEach((item, i) => {
    const getmetry = new THREE.PlaneGeometry(10, item, 1, 20)
    // 添加渐变
    const positions = getmetry.attributes.position
    const height = 100

    const colorsArr = []
    const color1 = new THREE.Color('green')
    const color2 = new THREE.Color('blue')
    const color3 = new THREE.Color('red')
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i) + item / 2
      if (y <= 50) {
        const percent = y / 50
        const c = color1.clone().lerp(color2, percent)
        colorsArr.push(c.r, c.g, c.b)
      } else if (y > 50 && y <= 100) {
        const percent = (y - 50) / 50
        const c = color2.clone().lerp(color3, percent)
        colorsArr.push(c.r, c.g, c.b)
      }
    }
    const colors = new Float32Array(colorsArr)
    getmetry.attributes.color = new THREE.BufferAttribute(colors, 3)

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true, // 使用自定义顶点颜色
      // side: THREE.DoubleSide
    })
    const bar = new THREE.Mesh(getmetry, material)
    bar.position.x = 10 + i * 20 + 5
    bar.position.y = item / 2
    bars.add(bar)
  })
  bars.add(createNum(dataArr));
  return bars
}

const createCanvas = (text) => {
  const canvas = document.createElement("canvas")
  const w = canvas.width = 100
  const h = canvas.height = 100
  const c = canvas.getContext("2d")
  c.translate(w / 2, h / 2)
  c.fillStyle = "#ffffff"
  c.font = "normal 48px 宋体"
  c.textBaseline = "middle"
  c.textAlign = "center"
  c.fillText(text,0,0)
  return canvas
}

const createNum = (dataArr) => {
  const nums = new THREE.Group()
  dataArr.forEach((item, i) => {
    const texture = new THREE.CanvasTexture(createCanvas(item))
    const geometry = new THREE.PlaneGeometry(10, 10)
    const material = new THREE.MeshBasicMaterial({
      // color: 'orange'
      map:texture,
      // side: THREE.DoubleSide
    })
    const num = new THREE.Mesh(geometry, material)
    num.position.y = item + 10
    num.position.x = 10 + i * 20 + 5
    nums.add(num)
  })
  return nums
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
