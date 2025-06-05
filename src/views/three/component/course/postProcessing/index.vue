<template>
  <div class="postProcessing-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {onMounted, onUnmounted} from "vue";
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GlitchPass} from 'three/addons/postprocessing/GlitchPass.js';
import {
  AfterimagePass,
  BloomPass,
  BokehPass,
  FilmPass,
  GammaCorrectionShader,
  HalftonePass,
  OutlinePass,
  ShaderPass,
  SMAAPass,
  UnrealBloomPass
} from 'three/addons/Addons.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
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
let scene, directionalLight, ambientLight, axesHelper, camera, orbitControls, timer, group, composer, outlinePass,
    bloomPass, glitchPass, afterimagePass, filmPass, halftonePass, smaaPass, gammaPass

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
  camera.position.set(0, 500, 500);
  camera.lookAt(0, 0, 0);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  addMesh()

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  const v = new THREE.Vector2(window.innerWidth, window.innerWidth);
  outlinePass = new OutlinePass(v, scene, camera); // 给选中的物体添加描边
  outlinePass.visibleEdgeColor.set('orange'); // 颜色
  outlinePass.edgeStrength = 10;// 亮度
  outlinePass.edgeThickness = 10; // 描边厚度
  outlinePass.pulsePeriod = 1; // 闪烁频率，每 1 秒闪烁一次
  composer.addPass(outlinePass);

  bloomPass = new UnrealBloomPass(v); // 发光
  bloomPass.strength = 0.5;

  glitchPass = new GlitchPass() // 故障闪屏

  afterimagePass = new AfterimagePass(); // 残影

  filmPass = new FilmPass(0.5, true); // 电影雪花效果

  halftonePass = new HalftonePass({ // 三色圆点效果
    radius: 8
  });

  gammaPass = new ShaderPass(GammaCorrectionShader); // 伽马校正，用了后期通道后颜色异常的修复

  const pixelRatio = renderer.getPixelRatio();
  smaaPass = new SMAAPass(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);

  renderer.domElement.addEventListener('click', (e) => {
    const y = -((e.offsetY / window.innerHeight) * 2 - 1);
    const x = (e.offsetX / window.innerWidth) * 2 - 1;

    const rayCaster = new THREE.Raycaster();
    rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersections = rayCaster.intersectObjects(group.children);
    if (intersections.length) {
      if (outlinePass) outlinePass.selectedObjects = [intersections[0].object];
      // if(!composer.passes.includes(bloomPass)) composer.addPass(bloomPass);
    } else {
      outlinePass.selectedObjects = [];
      composer.removePass(bloomPass);
    }
  });
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

const addMesh = () => {
  scene.remove(group)

  function createMesh(color, x) {
    const geometry = new THREE.DodecahedronGeometry(100);
    const material = new THREE.MeshPhongMaterial({
      color: color
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = x;
    return mesh;
  }

  const mesh = createMesh('orange', 0);
  const mesh2 = createMesh('skyblue', 300);
  const mesh3 = createMesh('lightgreen', -300);

  group = new THREE.Group();
  group.add(mesh);
  group.add(mesh2);
  group.add(mesh3);
  scene.add(group)
}

const addModel = () => {
  scene.remove(group)
  const loader = new GLTFLoader();
  group = new THREE.Group();
  group.customType = 'Horse'
  loader.load(import.meta.env.VITE_APP_MODELVIEW + "/gltf/gltf/Horse.gltf", function (gltf) {
    group.add(gltf.scene);

    gltf.scene.scale.set(50, 50, 50);

    gltf.scene.traverse(obj => {
      if (obj.isMesh) {
        obj.target = gltf.scene
        if (obj.name === 'Cylinder') {
          obj.material.color = new THREE.Color('white');
        } else if (obj.name === 'Cylinder_1') {
          obj.material.color = new THREE.Color('pink');
        }
      }
    });
  })
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
  OutlinePass: true,
  UnrealBloomPass: false,
  GlitchPass: false,
  AfterimagePass: false,
  FilmPass: false,
  HalftonePass: false,
  SMAAPass: false,
  ShaderPass: false,
  type: "mesh"
}
const initGui = () => {
  gui = new GUI({title: "pass"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "type", ["mesh", "horse"]).name("类型").onChange((type) => {
    switch (type) {
      case "mesh":
        addMesh()
        break
      case "horse":
        addModel()
        break
    }
  })
  gui.add(formData, "OutlinePass").name("描边").onChange(bool => bool ? composer.addPass(outlinePass) : composer.removePass(outlinePass))
  gui.add(formData, "UnrealBloomPass").name("发光").onChange(bool => bool ? composer.addPass(bloomPass) : composer.removePass(bloomPass))
  gui.add(formData, "GlitchPass").name("故障闪屏").onChange(bool => bool ? composer.addPass(glitchPass) : composer.removePass(glitchPass))
  gui.add(formData, "AfterimagePass").name("残影").onChange(bool => bool ? composer.addPass(afterimagePass) : composer.removePass(afterimagePass))
  gui.add(formData, "FilmPass").name("电影雪花").onChange(bool => bool ? composer.addPass(filmPass) : composer.removePass(filmPass))
  gui.add(formData, "HalftonePass").name("三色圆点").onChange(bool => bool ? composer.addPass(halftonePass) : composer.removePass(halftonePass))
  gui.add(formData, "SMAAPass").name("抗锯齿").onChange(bool => bool ? composer.addPass(smaaPass) : composer.removePass(smaaPass))
  gui.add(formData, "ShaderPass").name("伽马校正").onChange(bool => bool ? composer.addPass(gammaPass) : composer.removePass(gammaPass))

}

</script>

<style lang="scss" scoped>
.postProcessing-wrap {

}
</style>
