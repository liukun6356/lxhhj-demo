<template>
  <div class="box3-wrap">

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
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

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
let scene, directionalLight, ambientLight, axesHelper, camera, orbitControls, timer, composer, group, box1, box2

const renderer = threeBoxStore.getRenderer()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(500, 300, 600);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);

  // 创建透视相机
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1e4);
  camera.position.set(500, 300, 400);
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  addModel()

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

const addModel = () => {
  scene.remove(group)

  const loader = new GLTFLoader();
  group = new THREE.Group();
  loader.load(import.meta.env.VITE_APP_MODELVIEW + "/Michelle.glb", function (gltf) {
    gltf.scene.scale.setScalar(150);
    group.add(gltf.scene);
    // 用BoxHelper 把包围盒可视化出来
    const helper = new THREE.BoxHelper(gltf.scene, 'pink');
    group.add(helper);

    //  用Box3 的api
    const box = new THREE.Box3()
    box.expandByObject(gltf.scene)

    const width = box.max.x - box.min.x
    const height = box.max.y - box.min.y
    const depth = box.max.z - box.min.z

    console.log('模型大小', {width, height, depth})

    // 验证
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshBasicMaterial({
      color: 'orange',
      transparent: true,
      opacity: 0.5
    })
    const mesh = new THREE.Mesh(geometry, material)
    // mesh.position.set(0,height/2,0)
    group.add(mesh)

    const ringGeometry = new THREE.RingGeometry(width / 2, width / 2 + 10);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 'green',
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    group.add(ring);
    ring.position.y = height / 2;
    ring.rotateX(Math.PI / 2);
  })
  scene.add(group)
}

const addModel1 = async () => {
  scene.remove(group)

  const loader = new GLTFLoader();
  group = new THREE.Group();
  const gltf1 = await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/Michelle.glb")
  gltf1.scene.scale.setScalar(150);
  group.add(gltf1.scene);
  // 用BoxHelper 把包围盒可视化出来
  // const helper = new THREE.BoxHelper(gltf1.scene, 'pink');
  // group.add(helper);

  //  用Box3 的api
  box1 = new THREE.Box3()
  box1.setFromObject(gltf1.scene)
  // box1.expandByScalar(100)
  const helper2 = new THREE.Box3Helper(box1, '#eee');
  group.add(helper2);
  console.log('模型1大小',box1.getSize(new THREE.Vector3()))
  console.log('模型1中心',box1.getCenter(new THREE.Vector3()))
  const gltf2 = await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/duck.glb");
  console.log(gltf2,32)
  gltf2.scene.scale.setScalar(500);

  group.add(gltf2.scene);
  const helper1 = new THREE.BoxHelper(gltf2.scene);
  group.add(helper1);
  box2 = new THREE.Box3();
  box2.setFromObject(gltf2.scene);

  console.log('是否碰撞', box1.intersectsBox(box2))
  // intersect 和 union 计算玩，还改变原先box的大小
  const intersectBox = box2.intersect(box1);
  const helper3 = new THREE.Box3Helper(intersectBox, 'red');
  group.add(helper3);
  const size = intersectBox.getSize(new THREE.Vector3());
  console.log('相交部分大小',size);

  // const unionBox = box2.union(box1);
  // const helper4 = new THREE.Box3Helper(unionBox, 'green');
  // group.add(helper4);
  // const size1 = unionBox.getSize(new THREE.Vector3());
  // console.log('并集大小',size1);

  scene.add(group)


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
  axesHelper: true,
  type: "BoxHelper",
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "type", ["BoxHelper", "Box3Helper"]).name("类型").onChange(type => {
    switch (type) {
      case "BoxHelper":
        addModel()
        break
      case "Box3Helper":
        addModel1()
        break
    }
  })
}

</script>

<style lang="scss" scoped>
.box3-wrap {

}
</style>
