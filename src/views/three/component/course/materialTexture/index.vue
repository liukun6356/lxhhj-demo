<template>
  <div class="materialTexture-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import diqiuJPG from "@/assets/images/threeCourse/diqiu.jpg"
import zhuanJPG from "@/assets/images/threeCourse/zhuan.jpg"

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
  pointLight = new THREE.PointLight(0xffffff, 1e4); // 颜色白色#ffffff， 光照强度 1e4
  // pointLight.intensity = 1e4
  pointLight.position.set(80, 80, 80);// 80,80,80 的位置，默认照向 0,0,0 的方向
  scene.add(pointLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e5);
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
  if (!v) return
  scene.remove(mesh)
  let geometry, vertices, texture, attribute
  const loader = new THREE.TextureLoader();
  switch (k) {
    case "pointType":
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
      switch (v) {
        case "PointsMaterial":
          material = new THREE.PointsMaterial({
            color: new THREE.Color('orange'),
            size: 10
          });
          mesh = new THREE.Points(geometry, material);
          break
      }
      break
    case "lineType":
      pointFolder.children[0].setValue('')
      gridFolder.children[0].setValue('')
      const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
      geometry = new THREE.EdgesGeometry(boxGeometry); // 边缘几何体
      switch (v) {
        case "LineBasicMaterial":
          material = new THREE.LineBasicMaterial({
            color: new THREE.Color('orange')
          });
          mesh = new THREE.Line(geometry, material);
          break
        case "LineDashedMaterial":
          material = new THREE.LineDashedMaterial(({
            color: new THREE.Color('orange'),
            dashSize: 10,
            gapSize: 10
          }))
          mesh = new THREE.Line(geometry, material);
          mesh.computeLineDistances(); // 计算虚线长度
          break
      }

      break
    case "gridType":
      pointFolder.children[0].setValue('')
      lineFolder.children[0].setValue('')
      geometry = new THREE.PlaneGeometry(100, 100);
      switch (v) {
        case "材质":
          geometry = new THREE.PlaneGeometry(100, 100);
          material = new THREE.MeshBasicMaterial(({
            color: new THREE.Color('orange')
          }));
          console.log(material.color.getHexString(), "hex")
          console.log(material.color.getStyle(), "css")
          material.color.setStyle("rgb(255,255,0)")
          mesh = new THREE.Mesh(geometry, material);
          break
        case "地球":
          texture = loader.load(diqiuJPG);
          texture.colorSpace = THREE.SRGBColorSpace
          geometry = new THREE.SphereGeometry(100); // 球状几何体 SphereGeometry，半径为 100
          material = new THREE.MeshBasicMaterial(({
            // color: new THREE.Color('orange'),
            // transparent: true,
            // opacity: 0.5,
            // side:THREE.DoubleSide
            map: texture,// 颜色贴图
          }));
          mesh = new THREE.Mesh(geometry, material)
          break
        case "砖":
          texture = loader.load(zhuanJPG);
          texture.wrapS = THREE.RepeatWrapping // 设置在水平（wrapS）方向重复
          texture.wrapT = THREE.RepeatWrapping// 设置在竖直（wrapT）方向重复
          texture.repeat.set(4, 4);//设置重复次数
          texture.colorSpace = THREE.SRGBColorSpace
          geometry = new THREE.PlaneGeometry(1000, 1000);
          material = new THREE.MeshBasicMaterial({
            map: texture,
            aoMap: texture,// 受环境光的凹凸不平感,基于光线对贴图的影响来做一次计算
          });
          mesh = new THREE.Mesh(geometry, material)
          break
      }
      break
  }
  scene.add(mesh);
}

// lil-gui逻辑
let gui, pointFolder, lineFolder, gridFolder
const formData = {
  pointType: '',
  lineType: '',
  gridType: ''
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  pointFolder = gui.addFolder('point');
  const pointTypeControl = pointFolder.add(formData, "pointType", ["PointsMaterial"]).onChange(pointType => formDatachange("pointType", pointType))
  lineFolder = gui.addFolder('line');
  lineFolder.add(formData, "lineType", ["LineBasicMaterial", "LineDashedMaterial"]).onChange(lineType => formDatachange("lineType", lineType))
  gridFolder = gui.addFolder('gird');
  gridFolder.add(formData, "gridType", ["材质", "地球", "砖"]).onChange(gridType => formDatachange("gridType", gridType))
  pointTypeControl.setValue("PointsMaterial")
}

</script>

<style lang="scss" scoped>
.materialTexture-wrap {

}
</style>
