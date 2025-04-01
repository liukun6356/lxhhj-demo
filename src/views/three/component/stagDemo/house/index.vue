<template>
  <div class="house-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import grassPNG from "@/assets/images/threeCourse/house/grass.png"
import shuiniPNG from "@/assets/images/threeCourse/house/shuini.png"
import wapianPNG from "@/assets/images/threeCourse/house/wapian.png"
import zhuanJPG from "@/assets/images/threeCourse/house/zhuan.jpg"

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
  initGui()
  createHouse()
})

onUnmounted(() => {
  gui.destroy()
  cancelAnimationFrame(timer)
  renderer.clear()
})

const createHouse = () => {
  house = new THREE.Group()
  scene.add(house)
  addFoundation()
  addsideWall()
  addbehindwall()
  addfrontwall()
  addroof()
  adddoorstep()
  addgrass()
  addfog()
}

// 场景逻辑
let scene, material, mesh, directionLight, axesHelper, camera, orbitControls, timer, house, ambientLight
const renderer = threeBoxStore.getRenderer()

const init = () => {
  renderer.setClearColor(new THREE.Color('skyblue'));
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加灯光 Light
  directionLight = new THREE.DirectionalLight(0xffffff); // 平行光
  // directionLight .intensity = 1e4
  directionLight.position.set(3000, 3000, 3000);// 80,80,80 的位置，默认照向 0,0,0 的方向
  scene.add(directionLight);

  // 添加环境光
  // ambientLight = new THREE.AmbientLight();
  // scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(2 * 1e4);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3 * 1e4);
  camera.position.set(3000, 3000, 3000);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  const render = () => {
    if(formData.animation)rotateFn()
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

let roof
const loader = new THREE.TextureLoader()
const addFoundation = () => {
  const geometry = new THREE.BoxGeometry(4000, 300, 3000);
  const texture = loader.load(shuiniPNG)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshLambertMaterial({
    // color: new THREE.Color('grey'),
    map: texture,
    aoMap: texture
  });
  const foundation = new THREE.Mesh(geometry, material);
  // foundation.translateY(10) // 贴合问题可通过渲染器添加 logarithmicDepthBuffer 属性
  house.add(foundation)
}

const addsideWall = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, 2000);
  shape.lineTo(-1500, 3000);
  shape.lineTo(-3000, 2000);
  shape.lineTo(-3000, 0);

  const windowPath = new THREE.Path(); // 添加路径镂空
  windowPath.moveTo(-600, 400);
  windowPath.lineTo(-600, 1600);
  windowPath.lineTo(-2400, 1600);
  windowPath.lineTo(-2400, 400);
  shape.holes.push(windowPath);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 100
  });
  const texture = loader.load(zhuanJPG)
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.0005, 0.0005); // 2000 * 0.0005 约等于 1    uv坐标不一样
  texture.colorSpace = THREE.SRGBColorSpace
  const sideWall = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
    map: texture,
    aoMap: texture
  }));
  const sideWall2 = sideWall.clone()

  sideWall.rotateY(Math.PI / 2)
  sideWall.translateZ(-2000)
  sideWall.translateX(1500)
  sideWall.translateY(150)

  sideWall2.rotateY(Math.PI / 2)
  sideWall2.translateZ(1900)
  sideWall2.translateX(1500)
  sideWall2.translateY(150)

  house.add(sideWall)
  house.add(sideWall2)
  console.log(sideWall, 333)
}

const addbehindwall = () => {
  const geometry = new THREE.BoxGeometry(4000, 2000, 100);
  const texture = loader.load(zhuanJPG)
  texture.wrapS = THREE.RepeatWrapping // 设置在水平（wrapS）方向重复
  texture.repeat.x = 2 // 水平重复为 2
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshLambertMaterial({
    map: texture,
    aoMap: texture
  });
  const behindWall = new THREE.Mesh(geometry, material);
  behindWall.translateY(1150);
  behindWall.translateZ(-1450);
  house.add(behindWall)
}

const addfrontwall = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(4000, 0);
  shape.lineTo(4000, 2000);
  shape.lineTo(0, 2000);

  const door = new THREE.Path();
  door.moveTo(1000, 0);
  door.lineTo(2000, 0);
  door.lineTo(2000, 1500);
  door.lineTo(1000, 1500);
  shape.holes.push(door);

  const win = new THREE.Path();
  win.moveTo(2500, 500);
  win.lineTo(3500, 500);
  win.lineTo(3500, 1500);
  win.lineTo(2500, 1500);
  shape.holes.push(win);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 100
  });
  const texture = loader.load(zhuanJPG)
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.0005, 0.0005); // 2000 * 0.0005 约等于 1    uv坐标不一样
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshLambertMaterial({
    // color: new THREE.Color('lightgrey'),
    map: texture,
    aoMap: texture
  });
  const frontWall = new THREE.Mesh(geometry, material);
  frontWall.translateX(-2000);
  frontWall.translateZ(1400);
  frontWall.translateY(150);
  house.add(frontWall)
}

const addroof = () => {
  const geometry = new THREE.BoxGeometry(4200, 2000, 100);
  const texture = loader.load(wapianPNG)
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1); // 2000 * 0.0005 约等于 1    uv坐标不一样
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshLambertMaterial({
    // color: new THREE.Color('red')
    map: texture,
    aoMap: texture
  });
  roof = new THREE.Mesh(geometry, material);
  roof.position.y = 2600;
  roof.position.z = -800;
  roof.rotation.x = 55 / 180 * Math.PI;
  const roof2 = roof.clone();
  roof2.rotateX(70 / 180 * Math.PI);
  roof2.position.z = -roof.position.z;
  // 开发过程中，确定位置时，可以用lil-gui调整位置
  roofFolder.add(roof.position, 'y').min(-10000).max(10000).step(100);
  roofFolder.add(roof.position, 'z').min(-10000).max(10000).step(100);

  house.add(roof)
  house.add(roof2);
}

const adddoorstep = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(200, 0);
  shape.lineTo(200, -100);
  shape.lineTo(400, -100);
  shape.lineTo(400, -200);
  shape.lineTo(600, -200);
  shape.lineTo(600, -300);
  shape.lineTo(0, -300);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1000
  });
  const texture = loader.load(shuiniPNG)
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.001, 0.001);
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshLambertMaterial({
    // color: new THREE.Color('grey'),
    map: texture,
    aoMap: texture
  });

  const doorstep = new THREE.Mesh(geometry, material);
  doorstep.rotateY(-Math.PI / 2);
  doorstep.position.z = 1500;
  doorstep.position.y = 150;
  house.add(doorstep)
}

const addgrass = () => {
  const geometry = new THREE.PlaneGeometry(100000, 100000);
  const texture = loader.load(grassPNG)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(20, 20)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshLambertMaterial({
    // color: new THREE.Color('green')
    map: texture,
    aoMap: texture
  });
  const grass = new THREE.Mesh(geometry, material);
  grass.rotateX(-Math.PI / 2);
  grass.position.y = -150;
  house.add(grass)
}

const addfog = () => {
  scene.fog = new THREE.Fog(0xcccccc, 1000, 40000) // 添加雾
  fogFolder.add(scene.fog, 'near', 1, 1e4, 1)
  fogFolder.add(scene.fog, 'far', 100, 1e5, 1)
}

let angle = 0, r = 5000
const rotateFn = () => { // 相机旋转
  angle += 0.01
  if (angle >= Math.PI * 2) {
    angle -= Math.PI * 2;
    r = 5000 + Math.random() * 10000;
    camera.position.y = 1000 + Math.random() * 10000;
  }
  camera.position.x = r * Math.cos(angle);
  camera.position.z = r * Math.sin(angle);
  camera.lookAt(0, 0, 0)
}

const formDatachange = (k, v?: any) => {
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
    case "rotateX":
      roof.rotation.x = v / 180 * Math.PI;
      break
    case "width":
      roof.geometry = new THREE.BoxGeometry(4200, v, 100);
      break
  }
}

// lil-gui逻辑
let gui, roofFolder, fogFolder
const formData = {
  axesHelper: true,
  rotateX: 0,
  width: 2000,
  animation: false
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "animation")
  roofFolder = gui.addFolder('roof');
  roofFolder.add(formData, "rotateX", 0, 180, 0.1).onChange(rotateX => formDatachange("rotateX", rotateX))
  roofFolder.add(formData, "width", 1000, 5000, 100).onChange(width => formDatachange("width", width))
  fogFolder = gui.addFolder('fog');
}

</script>

<style lang="scss" scoped>
.house-wrap {

}
</style>
