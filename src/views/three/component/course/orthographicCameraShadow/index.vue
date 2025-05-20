<template>
  <div class="orthographicCameraShadow-wrap">

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
let scene, material, mesh, directionalLight, ambientLight, axesHelper, camera, orbitControls, timer, cameraHelper,
    camerHelper1

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  // 添加灯光 Light
  directionalLight = new THREE.DirectionalLight(0xffffff); // 颜色白色#ffffff
  directionalLight.position.set(400, 200, 300);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4);

  camera.position.set(400, 200, 300);
  camera.lookAt(0, 0, 0);
  // 轨道控制器
  orbitControls = new OrbitControls(camera, renderer.domElement)
  orbitControls.addEventListener('change', () => {
    // console.log(camera.position)
  })

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
  let geometry, mesh, vertices, attribute, material
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
    case "light":
      if (camerHelper1) scene.remove(camerHelper1)
      scene.remove(directionalLight);
      switch (v) {
        case "平行光":
          debugger
          directionalLight = new THREE.DirectionalLight(0xffffff)
          scene.add(directionalLight);
          typeControl.setValue("阴影")
          break
        case "点光源":
          directionalLight = new THREE.PointLight(0xffffff, 1e7)
          scene.add(directionalLight);
          typeControl.setValue("阴影")
          break
        case "聚光源":
          directionalLight = new THREE.SpotLight(0xffffff, 1e7)
          scene.add(directionalLight);
          typeControl.setValue("阴影")
          break
      }
      directionalLight.castShadow = true
      directionalLight.position.set(1000, 1000, 500)
      directionalLight.shadow.camera.left = -500;
      directionalLight.shadow.camera.right = 500;
      directionalLight.shadow.camera.top = 500;
      directionalLight.shadow.camera.bottom = -500;
      directionalLight.shadow.camera.near = 0.1;
      directionalLight.shadow.camera.far = 3000;
      camerHelper1 = new THREE.CameraHelper(directionalLight.shadow.camera)
      scene.add(camerHelper1)
      break
    case "type":
      renderer.shadowMap.enabled = v
      directionalLight.castShadow = v
      switch (v) {
        case "相机":
          if (camerHelper1) scene.remove(camerHelper1)
          break
        case "阴影":
          directionalLight.castShadow = true
          directionalLight.position.set(1000, 1000, 500)
          directionalLight.shadow.camera.left = -500;
          directionalLight.shadow.camera.right = 500;
          directionalLight.shadow.camera.top = 500;
          directionalLight.shadow.camera.bottom = -500;
          directionalLight.shadow.camera.near = 0.1;
          directionalLight.shadow.camera.far = 3000;
          camerHelper1 = new THREE.CameraHelper(directionalLight.shadow.camera)
          scene.add(camerHelper1)
          break
      }
      break
    case "camera":
      const aspectRatio = window.innerWidth / window.innerHeight
      const num = 500
      if (cameraHelper) scene.remove(cameraHelper)
      switch (v) {
        case "透视相机":
          camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4);
          camera.position.set(400, 200, 300);
          camera.lookAt(0, 0, 0);
          break
        case "正投影相机":
          camera = new THREE.OrthographicCamera(-num * aspectRatio, num * aspectRatio, num, -num, 0.1, 1e4)
          camera.position.set(400, 200, 300);
          camera.lookAt(0, 0, 0);
          break
        case "透视+正投影相机":
          camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
          camera.position.set(1000, 2000, 1000);
          camera.lookAt(0, 0, 0);
          const camera2 = new THREE.OrthographicCamera(-num * aspectRatio, num * aspectRatio, num, -num, 0.1, 5000);
          camera2.position.set(400, 200, 300);
          camera2.lookAt(0, 0, 0);
          cameraHelper = new THREE.CameraHelper(camera2);
          scene.add(cameraHelper);
          break
      }
      // 更新轨道控制器
      orbitControls = new OrbitControls(camera, renderer.domElement)
      orbitControls.target.set(0, 0, 0)
      orbitControls.update();
      break
    case "mesh":
      reset()
      switch (v) {
        case "正方体":
          camera.position.set(400, 200, 300);
          geometry = new THREE.BoxGeometry(100, 100, 100);
          material = new THREE.MeshLambertMaterial({
            color: new THREE.Color('orange')
          });
          mesh = new THREE.Mesh(geometry, material);
          break
        case "平面立方体":
          camera.position.set(1900, 1200, 1300);
          const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
          const planeMaterial = new THREE.MeshLambertMaterial({
            color: new THREE.Color('skyblue')
          });
          const plane = new THREE.Mesh(planeGeometry, planeMaterial);
          plane.rotateX(-Math.PI / 2);
          plane.position.y = -50;
          const boxGeometry = new THREE.BoxGeometry(200, 600, 200);
          const boxMaterial = new THREE.MeshLambertMaterial({
            color: new THREE.Color('orange')
          });
          const box = new THREE.Mesh(boxGeometry, boxMaterial);
          box.position.y = 200;
          const box2 = box.clone();
          box2.position.x = 500;
          plane.receiveShadow = true; // 接受阴影
          box.castShadow = true; // 产生阴影
          box2.castShadow = true;
          mesh = new THREE.Group();
          mesh.add(plane);
          mesh.add(box);
          mesh.add(box2);
          break
      }
      scene.add(mesh)
      mesh.customType = '1'
      console.log(mesh, 1)
      break
  }
}

// lil-gui逻辑
let gui, meshControl, typeControl, lightControl
const formData = {
  axesHelper: true,
  mesh: "",
  type: "相机",
  camera: "透视相机",
  cameraHelper: false,
  light: "平行光",
  position: {x: 400, y: 200, z: 300}
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["相机", "阴影"]).onChange(type => {
    if (type === '阴影') {
      cameraFolder.hide()
      shadowFolder.show()
      meshControl.setValue("平面立方体")
    } else {
      cameraFolder.show()
      shadowFolder.hide()
    }
    formDatachange("type", type)
  })
  const cameraFolder = gui.addFolder('相机');
  cameraFolder.add(formData, "camera", ["透视相机", "正投影相机", "透视+正投影相机"]).onChange(camera => formDatachange("camera", camera))
  meshControl = cameraFolder.add(formData, "mesh", ["正方体", "平面立方体"]).onChange(mesh => formDatachange("mesh", mesh)).setValue("正方体")
  const shadowFolder = gui.addFolder('阴影');
  shadowFolder.hide()
  lightControl = shadowFolder.add(formData, "light", ["平行光", "点光源", "聚光源"]).onChange(light => formDatachange("light", light))
  shadowFolder.add(formData.position, 'x', 0, 10000).onChange(x => scene.traverse(obj => {
    if (obj instanceof THREE.Light )obj.position.x = x
  }));
  shadowFolder.add(formData.position, 'y', 0, 10000).onChange(y => scene.traverse(obj => {
    if (obj instanceof THREE.Light) obj.position.y = y
  }));
  shadowFolder.add(formData.position, 'z', 0, 10000).onChange(z => scene.traverse(obj => {
    if (obj instanceof THREE.Light) obj.position.z = z
  }));
}

</script>

<style lang="scss" scoped>
.orthographicCameraShadow-wrap {

}
</style>
