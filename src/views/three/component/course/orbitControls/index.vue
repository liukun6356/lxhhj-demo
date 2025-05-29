<template>
  <div class="orbitControls-wrap">

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
let scene, material, mesh, directionalLight, axesHelper, camera, orbitControls, timer, group

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加灯光 Light
  directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(500, 400, 300);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight();
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
  orbitControls.target.set(0, 0, 0) //  设置控制器的焦点
  orbitControls.addEventListener('change', () => {
    // console.log(camera.position, orbitControls.target); // 相机坐标    控制器的焦点
  })
  orbitControls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE, // 左键旋转
    RIGHT: THREE.MOUSE.PAN // 右键平移
  }
  group = new THREE.Group();
  scene.add(group)
  const geometry = new THREE.BoxGeometry(100, 100, 100);
  const material = new THREE.MeshPhongMaterial({
    color: 'orange'
  });

  const box = new THREE.Mesh(geometry, material);
  group.add(box);

  renderer.domElement.addEventListener('click', (e) => {
    if (!formData.click) return
    const y = -((e.offsetY / window.innerHeight) * 2 - 1);
    const x = (e.offsetX / window.innerWidth) * 2 - 1;

    const rayCaster = new THREE.Raycaster();
    rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersections = rayCaster.intersectObjects(group.children);
    const arrowHelper = new THREE.ArrowHelper(rayCaster.ray.direction, rayCaster.ray.origin, 3000);
    arrowHelper.customType = '111'
    scene.add(arrowHelper);

    intersections.forEach(item => item.object.material.color = new THREE.Color('red'));
  });

  const render = () => {
    orbitControls.update();
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
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
  }
}

// lil-gui逻辑
let gui, orbitControlsControl
const formData = {
  axesHelper: true,
  click: false
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(orbitControls, "autoRotate").name("自动旋转(autoRotate)").onChange(bool => bool ? orbitControlsControl.show() : orbitControlsControl.hide())
  orbitControlsControl = gui.add(orbitControls, "autoRotateSpeed", 1, 10).hide()
  gui.add(orbitControls, "enableDamping").name("惯性(enableDamping)")
  gui.add(orbitControls, "enableRotate").name("旋转(enableRotate )")
  gui.add(orbitControls, "enablePan").name("平移(enablePan)")
  gui.add(orbitControls, "enableZoom").name("缩放(enableZoom)")
  gui.add(orbitControls, "maxPolarAngle", 0, Math.PI).name("旋转角上限(maxPolarAngle)")
  gui.add(formData, "click").onChange(bool => {
    if (!bool) scene?.traverse(obj => {
      if (obj.isMesh) obj.material.color = new THREE.Color('orange');
    })
  })
}

</script>

<style lang="scss" scoped>
.orbitControls-wrap {

}
</style>
