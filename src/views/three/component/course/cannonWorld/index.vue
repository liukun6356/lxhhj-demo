<template>
  <div class="cannonWorld-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {onMounted, onUnmounted} from "vue";
import * as CANNON from 'cannon-es';
import GUI from "lil-gui";

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
  initGui()
})

onUnmounted(() => {
  gui.destroy()
  orbitControls.dispose()
  cancelAnimationFrame(timer)
  renderer.clear()
  scene.clear()
})

// 场景逻辑
let scene, material, mesh, directionalLight, ambientLight, axesHelper, orbitControls, timer, composer,
    group, boxBody, box, contactMaterial

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const world = new CANNON.World()
world.gravity.set(0, -200, 0)

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(500, 600, 800);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(1000);
  scene.add(axesHelper);

  // 创建透视相机
  camera.fov = 60
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

  ;(function render() {
    world.fixedStep();
    if (box) {
      box.position.copy(boxBody.position);
      box.quaternion.copy(boxBody.quaternion);
    }
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const addMesh = () => {
  group = new THREE.Group()
  group.customType = '111'

  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);

  const boxGeometry = new THREE.BoxGeometry(50, 50, 50);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.y = 300;

  group.add(plane);
  group.add(box);

  const planeShape = new CANNON.Plane();
  const planeCannonMaterial = new CANNON.Material();
  const planeBody = new CANNON.Body({
    shape: planeShape,
    mass: 0, // 质量为0
    material: planeCannonMaterial
  });
  planeBody.position.set(0, 0, 0);
  planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(planeBody);

  const boxShape = new CANNON.Box(new CANNON.Vec3(25, 25, 25));
  const boxCannonMaterial = new CANNON.Material();
  boxBody = new CANNON.Body({
    shape: boxShape,
    mass: 1,
    material: boxCannonMaterial
  });
  boxBody.position.set(0, 300, 0)
  world.addBody(boxBody);

  contactMaterial = new CANNON.ContactMaterial(
      boxCannonMaterial,
      planeCannonMaterial,
      {
        friction: 0.2, // 摩擦力
        restitution: 0.6 // 弹性
      }
  );
  world.addContactMaterial(contactMaterial);

  scene.add(group)
}

const addMesh1 = () => {
  group = new THREE.Group()
  group.customType = "111"

  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);

  const boxGeometry = new THREE.SphereGeometry(50);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.y = 300

  group.add(plane);
  group.add(box);

  const boxShape = new CANNON.Sphere(50);
  const boxCannonMaterial = new CANNON.Material();
  boxBody = new CANNON.Body({
    shape: boxShape,
    mass: 1,
    material: boxCannonMaterial
  });
  boxBody.position.set(0, 300, 0)
  world.addBody(boxBody);

  const planeShape = new CANNON.Plane();
  const planeCannonMaterial = new CANNON.Material();
  const planeBody = new CANNON.Body({
    shape: planeShape,
    mass: 0,
    material: planeCannonMaterial
  });
  planeBody.position.set(0, 0, 0);
  planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(planeBody);

  contactMaterial = new CANNON.ContactMaterial(
      boxCannonMaterial,
      planeCannonMaterial,
      {
        friction: 0.2, // 摩擦力
        restitution: 0.6 // 弹性
      }
  );
  world.addContactMaterial(contactMaterial);

  scene.add(group)
}

const addMesh2 = () => {
  group = new THREE.Group()
  group.customType = "111"

  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);

  const boxGeometry = new THREE.SphereGeometry(50, 3);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.y = 300

  group.add(plane);
  group.add(box);


  const vertices = [];
  const faces = [];
  const positions = box.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    vertices.push(new CANNON.Vec3(x, y, z));
  }
  const index = box.geometry.index;
  for (let i = 0; i < index.length; i += 3) {
    const index1 = index[i];
    const index2 = index[i + 1];
    const index3 = index[i + 2];
    faces.push([index1, index2, index3]);
  }
  const boxShape = new CANNON.ConvexPolyhedron({vertices, faces})
  const boxCannonMaterial = new CANNON.Material();
  boxBody = new CANNON.Body({
    shape: boxShape,
    mass: 1,
    material: boxCannonMaterial
  });
  boxBody.position.set(0, 300, 0)
  world.addBody(boxBody);

  const planeShape = new CANNON.Plane();
  const planeCannonMaterial = new CANNON.Material();
  const planeBody = new CANNON.Body({
    shape: planeShape,
    mass: 0,
    material: planeCannonMaterial
  });
  planeBody.position.set(0, 0, 0);
  planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(planeBody);

  contactMaterial = new CANNON.ContactMaterial(
      boxCannonMaterial,
      planeCannonMaterial,
      {
        friction: 0.2, // 摩擦力
        restitution: 0.6 // 弹性
      }
  );
  world.addContactMaterial(contactMaterial);

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
  type: "",
  run() {
    boxBody.position.set(0, 300, 0)
  }
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["square", "ball", "buff"]).onChange(type => {
    reset()
    if (contactMaterial) world.removeContactMaterial(contactMaterial);
    switch (type) {
      case "square":
        addMesh()
        break
      case "ball":
        addMesh1()
        break
      case "buff":
        addMesh2()
        break
    }
  })
  typeControl.setValue("buff")
  gui.add(formData, "run")
}

</script>

<style lang="scss" scoped>
.cannonWorld-wrap {

}
</style>
