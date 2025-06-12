<template>
  <div class="factory-wrap">
    <div class="map-operation-wrap">
      <el-tooltip :content="item.label" placement="left-start" v-for="item in mapOperationImgs" :key="item.label">
        <div :class="[item.select ? 'select' : '', 'icon-wrap']">
          <div class="icon" @click="mapOperationClick(item)"></div>
        </div>
      </el-tooltip>
    </div>
    <div class="three_miniMap" ref="miniMapRef">
      <div class="three_miniMap_title">系统地图</div>
      <div class="three_miniMap_content">
        <div class="three_miniMap_box" v-for="(_,index) in listData.flat()" :key="index"></div>
      </div>
      <div class="three_miniMap_choose" ref="miniMapChooseRef"></div>
    </div>
    <teleport to="body">
      <div class="baseModel-content" v-show="showPopup"
           :style="{ transform: `translate(${popupPos.x }px, ${popupPos.y}px)`}">
        <div class="floor-box-title">{{ info.system_name }}</div>
        <div class="floor-box-date">供热时间：{{ info.timePeriod }}</div>
        <div class="floor-box-list">
          <div class="floor-box-item">
            <img :src="info.supplyType === 1 ? ph : (info.supplyType === 0 ? qg : gg)"/>
            <div>{{ info.supplyType === 1 ? '平衡' : (info.supplyType === 0 ? '欠供' : '过供') }}</div>
            <div style="font-size: 14px">{{ info.heatTotalForecast }}%</div>
          </div>
          <div class="floor-box-item">
            <img :src="info.warningSum > 0 ? tsyj : yj">
            <div>预警</div>
            <div>{{ info.warningSum }}</div>
          </div>
          <div class="floor-box-item">
            <img :src="info.EiModelLock ? EI : EI2">
            <div>AI调控</div>
            <div>{{ info.EiModelLock ? 'ON' : 'OFF' }}</div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';

import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {GammaCorrectionShader, ShaderPass, OutlinePass, SMAAPass} from 'three/addons/Addons.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FontLoader} from "three/examples/jsm/loaders/FontLoader";
import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry";
import {CSS2DObject} from "three/examples/jsm/Addons";
import {onMounted, onUnmounted, reactive, ref, toRefs} from "vue";
import {Tween, Easing, Group} from '@tweenjs/tween.js';
import GUI from "lil-gui";
import jsonData from "./data.json"
import {ElMessage} from "element-plus";
// 图片
import linePng from "@/assets/images/3dFactory/line.png"
import ph from '@/assets/images/3dFactory/ph.svg'
import qg from '@/assets/images/3dFactory/qg.svg'
import gg from '@/assets/images/3dFactory/gg.svg'
import tsyj from '@/assets/images/3dFactory/tsyj.svg'
import yj from '@/assets/images/3dFactory/yj.svg'
import EI from '@/assets/images/3dFactory/EI.svg'
import EI2 from '@/assets/images/3dFactory/EI2.svg'
import yellowCirSvg from "@/assets/images/3dFactory/u2890.svg"
import redCirSvg from "@/assets/images/3dFactory/u2891.svg"
import * as TWEEN from "three/examples/jsm/libs/tween.module";

// Refs
const miniMapRef = ref(null)
const miniMapChooseRef = ref(null)

const threeBoxStore = usethreeBoxStore()
const model = reactive({
  listData: [],
  curId: "",
  info: {},
  showPopup: false,
  popupPos: {
    x: 0,
    y: 0
  },
  mapOperationImgs: [
    {label: '显示系统名称', select: false},
    {label: '热需风险预警', select: false},
    {label: '放大'},
    {label: '缩小'},
    {label: '定位'}
  ],
})
const {listData, info, showPopup, popupPos, mapOperationImgs} = toRefs(model)
onMounted(() => {
  const tempArr = jsonData, result = [];
  while (tempArr.length) result.push(tempArr.splice(0, 5))
  model.listData = result;
  init()
  initminiMap()
  initGui()
})

onUnmounted(() => {
  gui.destroy()
  tweenGroup.removeAll()
  renderer.domElement.removeEventListener('click', onMouseClick);
  renderer.domElement.removeEventListener('mousemove', onMouseMove);
  cancelAnimationFrame(timer)
  renderer.clear()

  orbitControls.dispose()

  scene.traverse(object => {
    if (object.geometry) object.geometry.dispose()
    if (object.material) Array.isArray(object.material) ? object.material.forEach((m) => m.dispose()) : object.material.dispose()
    if (object instanceof CSS2DObject) object.element.remove()
  })
  scene.clear()
})

const mapOperationClick = (item) => {
  switch (item.label) {
    case '显示系统名称':
      item.select = !item.select
      break;
    case '热需风险预警':
      item.select = !item.select
      break;
  }
}

const initminiMap = () => {
  // 水平方向最大偏移量
  const MaxOffsetWidth = Math.abs(miniMapRef.value.getBoundingClientRect().width - miniMapChooseRef.value.getBoundingClientRect().width - 3);
  const offsetLeft = miniMapRef.value.getBoundingClientRect().left
  miniMapRef.value.addEventListener('mousedown', (event) => {
    event.stopPropagation()
    model.isDragging = true
  })
  miniMapRef.value.addEventListener('mousemove', (event) => {
    if (!model.isDragging) return
    event.stopPropagation()
    event.preventDefault()
    miniMapChooseRef.value.style.cursor = "move"
    let x = event.pageX - offsetLeft - 5
    if (x > MaxOffsetWidth) {
      x = MaxOffsetWidth + 5
    } else if (x <= 5) {
      x = 3;
    }
    miniMapChooseRef.value.style.left = x + 'px';
  })
  document.addEventListener('mouseup', (event) => {
    if (!model.isDragging) return
    model.isDragging = false
    miniMapChooseRef.value.style.cursor = "default"
    miniMapChooseRef.value.style.transition = "all 0.4s"
    const temp = parseInt(miniMapChooseRef.value.style.left)
    switch (Math.floor(temp / 60)) {
      case 0:
        resetCamera()
        break;
      case 1:
        resetCamera({
          x: 124.86853721209943, y: 60.42910387437398, z: 56.80108035071835
        }, {
          x: 86.6597689949791, y: -43.18340783483775, z: 10.498009772403371
        })
        break;
      case 2:
        resetCamera({
          x: 187.59159242732647, y: 58.345062490980084, z: 54.76788087838962
        }, {
          x: 136.47346172958586, y: -67.39697829189964, z: -1.7146774934691238
        })
        break;
      case 3:
        resetCamera({
          x: 219.29263973349742, y: 68.16618551116329, z: 51.79412373493084
        }, {
          x: 194.09381571197312, y: -81.35617744421617, z: 20.849660357666743
        })
        break;
      case 4:
        resetCamera({
          x: 272.19120684509306, y: 69.111650752749, z: 30.44998706599706
        }, {
          x: 267.585770932641, y: -22.798840455922317, z: 19.642483952209318
        })
        break;
    }
    const left = Math.floor(temp / 60) * 58
    miniMapChooseRef.value.style.left = 13 + left + 'px';

    setTimeout(() => {
      miniMapChooseRef.value.style.transition = 'none'
    }, 500)
  })
}

// 场景逻辑
let scene, directionalLight, ambientLight, rectLight, axesHelper, orbitControls, timer, composer,
    outlinePass, gridPanel, meshGroup, labelObj3d, tweenGroup, preBillboard

const renderer = threeBoxStore.getRenderer()
// renderer.useLegacyLights = true; // 是否启用传统光照模型
renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 设置阴影映射类型，这里使用PCFSoftShadowMap以获得更柔和的阴影效果
const camera = threeBoxStore.getCamera()
const gltfLoader = new GLTFLoader()
const fontLoader = new FontLoader();
const textureLoader = new THREE.TextureLoader()
const css2DRenderer = threeBoxStore.getCss2DRenderer()
const rayCaster = new THREE.Raycaster();
const defaultCameraPosition = {x: 42.70363028585678, y: 57.06887828250089, z: 78.20262412839936}
const defaultOrbitControlTarget = {x: 1.4849148487544956, y: -14.111340134046443, z: 35.54181586595351}

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#212121");

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.castShadow = true
  directionalLight.intensity = 1
  directionalLight.position.set(60.5, 80, -97.5)
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  directionalLight.shadow.camera.near = 2;
  directionalLight.shadow.camera.far = 1000;
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight("#fff", 6);
  scene.add(ambientLight);

  rectLight = new THREE.RectAreaLight("#fff", 500, 10, 10);
  rectLight.position.set(5, 40, -20);
  scene.add(rectLight);
  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);

  // 创建透视相机
  camera.fov = 50
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(42.70363028585678, 57.06887828250089, 78.20262412839936);
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const gammaPass = new ShaderPass(GammaCorrectionShader);
  composer.addPass(gammaPass);
  const pixelRatio = renderer.getPixelRatio();
  const smaaPass = new SMAAPass(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
  composer.addPass(smaaPass);
  const v = new THREE.Vector2(window.innerWidth, window.innerWidth);
  outlinePass = new OutlinePass(v, scene, camera);
  outlinePass.visibleEdgeColor.set('#000');
  outlinePass.edgeStrength = 2.0;
  outlinePass.edgeThickness = 3;
  outlinePass.pulsePeriod = 0;
  outlinePass.hiddenEdgeColor.set('#fff');
  composer.addPass(outlinePass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.maxDistance = 200;
  orbitControls.target.set(1.4849148487544956, -14.111340134046443, 35.54181586595351)
  orbitControls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE
  }
  orbitControls.addEventListener('change', () => {
    // 限制相机的高度，确保它始终在水平面以上
    if (camera.position.y < 10) camera.position.y = 10;
  })

  tweenGroup = new Group()

  createBasePanel()
  addFactoryModel()
  createGradientPlane()
  createSystem()

  renderer.domElement.addEventListener('click', onMouseClick);
  renderer.domElement.addEventListener('mousemove', onMouseMove);

  ;(function render(time) {
    tweenGroup.update(time)
    css2DRenderer.render(scene, camera)
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const onMouseClick = (e) => {
  e.stopPropagation();
  model.curId = ""
  if (preBillboard) preBillboard.visible = false
  const y = -((e.offsetY / window.innerHeight) * 2 - 1);
  const x = (e.offsetX / window.innerWidth) * 2 - 1;
  rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const targetMeshes = meshGroup.children.filter(obj => ['gltf'].includes(obj.customType))
  const intersections = rayCaster.intersectObjects(targetMeshes);
  if (!intersections.length) return
  let mesh = intersections[0]?.object
  while (mesh.isChild) mesh = mesh.parent

  model.curId = mesh.data.system_id
  ElMessage.success(`点击了${mesh.data.system_name}系统`)
  outlinePass.edgeGlow = 2;
  outlinePass.edgeThickness = 4;
  outlinePass.visibleEdgeColor.set(mesh.data.sourceT > 0 ? "#fc1553" : "#ffffff");
  outlinePass.selectedObjects = [mesh];
  meshGroup.traverse(child => {
    if (child instanceof CSS2DObject && child.customType === "billboardPanel" && child.curId === model.curId && child.type === mesh.type) {
      preBillboard = child
      child.visible = true
    }
  })
}

const onMouseMove = (e) => {
  e.stopPropagation();
  if (model.curId) return
  outlinePass.selectedObjects = []
  const y = -((e.offsetY / window.innerHeight) * 2 - 1);
  const x = (e.offsetX / window.innerWidth) * 2 - 1;
  rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const targetMeshes = meshGroup.children.filter(obj => ['floorPanel', 'gltf'].includes(obj.customType))
  const intersections = rayCaster.intersectObjects(targetMeshes);
  model.showPopup = false
  if (!intersections.length) return
  let mesh = intersections[0]?.object
  switch (mesh.customType) {
    case "floorPanel": // 系统底板
      outlinePass.visibleEdgeColor.set("#fff");
      outlinePass.selectedObjects = [mesh];
      model.info = mesh.data
      model.showPopup = true
      model.popupPos.x = e.clientX + 10;
      model.popupPos.y = e.clientY - 60 + 10
      break
    case "gltf": // 模型  热源 机组 热单元
      outlinePass.edgeGlow = 2;
      outlinePass.edgeThickness = 4;
      while (mesh.isChild) mesh = mesh.parent
      outlinePass.visibleEdgeColor.set(mesh.data.sourceT > 0 ? "#fc1553" : "#ffffff");
      outlinePass.selectedObjects = [mesh];
      break
  }
}

// 创建地面
const createBasePanel = () => {
  const group = new THREE.Group();
  gridPanel = new THREE.GridHelper(1200, 540, "#fff", "#fff");
  gridPanel.material.opacity = 0.08;
  gridPanel.material.depthWrite = true;
  gridPanel.material.transparent = true;
  gridPanel.p_name = "gridPanel"
  // 设置网格的位置
  gridPanel.position.set(0, -1, 0);
  group.add(gridPanel);
  const geometry = new THREE.BoxGeometry(1200, 1200, 0.1);
  const material = new THREE.MeshPhongMaterial({color: "#2A2A2A",});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotateX(-Math.PI / 2)
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.position.set(0, -1.5, 0);
  group.add(mesh);

  scene.add(group)
}

// 绘制两边模型
const addFactoryModel = async () => {
  const group = new THREE.Group();
  const gltf = await gltfLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + '/gc.glb')
  const model = gltf.scene;
  model.scale.set(0.05, 0.05, 0.05);
  model.position.set(20, 0, -40);
  model.rotation.set(0, 0, 0);
  model.rotateY(-Math.PI / 2)

  const material = new THREE.MeshStandardMaterial({color: "#0C0B0B", metalness: 0.6, roughness: 0.6,});
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  group.add(model)
  const model2 = model.clone();
  model2.position.set(20, 0, 85);
  model2.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  group.add(model2);

  scene.add(group)
}

// 绘制中间模型地面
const createGradientPlane = () => {
  if (!model.listData.length) return

  const width = 60 * model.listData.length;
  const height = 12 * 5;
  const geometry = new THREE.PlaneGeometry(width, height);
  const vertexShader = `varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  const fragmentShader = `
    varying vec2 vUv;
    uniform vec3 colorStart;
    uniform vec3 colorEnd;
    void main() {
      // 控制渐变方向：从左上到右下
      vec2 gradientDirection = normalize(vec2(1.0, 1.0));
      float gradient = dot(vUv, gradientDirection);

      // 设置透明度为1.0
      gl_FragColor = vec4(mix(colorStart, colorEnd, gradient), 1.0);
    }`;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      colorStart: {value: new THREE.Color("#111")},
      colorEnd: {value: new THREE.Color("#141414")}
    },
    vertexShader,
    fragmentShader,
    transparent: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.customType = "basePanel";
  mesh.rotateX(-Math.PI / 2)
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.position.set(width / 2 - 20, 0.1, height / 2);
  scene.add(mesh)
}

// 创建系统
const createSystem = () => {
  meshGroup = new THREE.Group()
  labelObj3d = new THREE.Object3D()
  meshGroup.add(labelObj3d)
  model.listData.forEach((group, i) => {
    group.forEach((row, j) => {
      const position = {x: 10 + 60 * i, y: 0, z: 10.5 + 9 * j}
      const floorPanelMesh = addFloorPanel(row, position)
      addHotSourceModel(row, position, floorPanelMesh)
      addUnitModel(row, position, floorPanelMesh)
      addFloorModel(row, position, floorPanelMesh)
      addIndicatorBar(row, position)
      addRollMat(floorPanelMesh)
      addSystemPanel(row, floorPanelMesh)
    })
  })
  scene.add(meshGroup)
}

// 添加底座平面
const addFloorPanel = (data, position) => {
  const geometry = new THREE.BoxGeometry(50, 6, 0.5)
  const material = new THREE.MeshStandardMaterial({color: "#201F1F", metalness: 0.6, roughness: 0.6,});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotateX(-Math.PI / 2)
  mesh.receiveShadow = true;
  mesh.position.set(position.x, position.y + 0.5, position.z);
  mesh.customType = "floorPanel";
  mesh.data = data
  meshGroup.add(mesh)
  return mesh
}

// 添加热源厂模型
const addHotSourceModel = async (data, position, floorPanelMesh) => {
  let offsetX, offsetY, offsetZ, rotationY, modelName
  switch (data.hotSource) {
    case 0:
      offsetX = -21
      offsetY = 0.8
      offsetZ = 0
      rotationY = -0.5
      modelName = 'model10'
      break
    case 1:
      offsetX = -21
      offsetY = 0.5
      offsetZ = -1
      rotationY = 1
      modelName = 'model6'
      break
    case 2:
      offsetX = -23
      offsetY = 0.5
      offsetZ = -1.5
      rotationY = -0.5
      modelName = 'model4'
      break
  }
  const gltf = await gltfLoader.loadAsync(`${import.meta.env.VITE_APP_MODELVIEW}/${modelName}.glb`)
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      if (child.material.name.indexOf("发光") === -1) {
        child.material = new THREE.MeshStandardMaterial({color: "#232222", metalness: 0.8, roughness: 0.6,});
        ;
      }
      if (child.material.name.indexOf("发光") > -1 && data.sourceT > 0) {
        child.material = new THREE.MeshBasicMaterial({color: '#FA1554',});
      }
    }
    child.customType = "gltf";
    child.receiveShadow = true;
    child.isChild = true;
  })
  gltf.scene.position.set(position.x + offsetX, position.y + offsetY + 0.5, position.z + offsetZ);
  gltf.scene.rotateY(rotationY * Math.PI)
  gltf.scene.data = data;
  gltf.scene.type = "热源厂";
  gltf.scene.isChild = false;
  meshGroup.add(gltf.scene)

  const font = await fontLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/PingFangSC-Medium_Medium.json")
  const textGeometry = new TextGeometry("热源厂", {font: font, size: 0.7, depth: 0.01});
  const textMaterial = new THREE.MeshBasicMaterial({color: "#fff", side: THREE.DoubleSide});
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(-17, 1.6 - 3, 0.5);
  textMesh.rotateZ(Math.PI / 2)
  floorPanelMesh.add(textMesh)
  const info = {
    system_id: data.system_id,
    label: "热源厂",
    val: data.sourceT,
    total: data.sourceB
  }
  addBillboard(info, {x: -23, y: 0.8, z: 0}, floorPanelMesh)
  addImgBubble(data.sourceT, {x: -22, y: 0.8, z: 6}, floorPanelMesh)
  addWall(floorPanelMesh)
}

// 添加机组模型
const addUnitModel = async (data, position, floorPanelMesh) => {
  const gltf = await gltfLoader.loadAsync(`${import.meta.env.VITE_APP_MODELVIEW}/model7.glb`)
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      if (child.material.name.indexOf("发光") === -1) {
        child.material = new THREE.MeshStandardMaterial({color: "#232222", metalness: 0.8, roughness: 0.6,});
        ;
      }
      if (child.material.name.indexOf("发光") > -1 && data.sourceT > 0) {
        child.material = new THREE.MeshBasicMaterial({color: '#FA1554',});
      }
    }
    child.customType = "gltf";
    child.receiveShadow = true;
    child.isChild = true;
  })
  gltf.scene.position.set(0 + position.x, 0.5 + position.y + 0.5, -0.5 + position.z);
  gltf.scene.rotateY(-Math.PI / 2)
  gltf.scene.data = data;
  gltf.scene.type = "机组";
  gltf.scene.isChild = false;
  meshGroup.add(gltf.scene)

  const font = await fontLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/PingFangSC-Medium_Medium.json")
  const textGeometry = new TextGeometry("机组", {font: font, size: 0.7, depth: 0.01});
  const textMaterial = new THREE.MeshBasicMaterial({color: "#fff", side: THREE.DoubleSide});
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(6, 2 - 3, 0.5);
  textMesh.rotateZ(Math.PI / 2)
  floorPanelMesh.add(textMesh)
  const info = {
    system_id: data.system_id,
    label: "机组",
    val: data.unitT,
    total: data.unitB
  }
  addBillboard(info, {x: -1, y: 0.8, z: 0}, floorPanelMesh)
  addImgBubble(data.unitT, {x: 0, y: 0.8, z: 6}, floorPanelMesh)
}

// 添加热单元模型
const addFloorModel = async (data, position, floorPanelMesh) => {
  const gltf = await gltfLoader.loadAsync(`${import.meta.env.VITE_APP_MODELVIEW}/zz.glb`)
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      if (child.material.name.indexOf("发光") === -1) {
        child.material = new THREE.MeshStandardMaterial({color: "#232222", metalness: 0.8, roughness: 0.6,});
        ;
      }
      if (child.material.name.indexOf("发光") > -1 && data.sourceT > 0) {
        child.material = new THREE.MeshBasicMaterial({color: '#FA1554',});
      }
    }
    child.customType = "gltf";
    child.receiveShadow = true;
    child.isChild = true;
  })
  gltf.scene.position.set(20 + position.x, 0.5 + position.y + 0.5, 0.5 + position.z);
  gltf.scene.rotateY(-Math.PI)
  gltf.scene.data = data;
  gltf.scene.type = "热单元";
  gltf.scene.isChild = false;
  meshGroup.add(gltf.scene)
  const font = await fontLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/PingFangSC-Medium_Medium.json")
  const textGeometry = new TextGeometry("热单元/栋", {font: font, size: 0.7, depth: 0.01});
  const textMaterial = new THREE.MeshBasicMaterial({color: "#fff", side: THREE.DoubleSide});
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(24, 0.8 - 3, 0.5);
  textMesh.rotateZ(Math.PI / 2)
  floorPanelMesh.add(textMesh)
  const info = {
    system_id: data.system_id,
    label: "热单元",
    val: data.hallT,
    total: data.hallB
  }
  addBillboard(info, {x: 21, y: 0.8, z: 0}, floorPanelMesh)
  addImgBubble(data.hallT, {x: 21, y: 0.8, z: 6}, floorPanelMesh)
}

// 添加指示条
const addIndicatorBar = (data, position) => {
  const geometry = new THREE.BoxGeometry(3, 0.2, 0.1)
  const material = new THREE.MeshStandardMaterial({
    color: data.warningSum > 0 ? '#FFBF00' : '#484848',
    metalness: 0.6,
    roughness: 0.6
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotateX(-Math.PI / 2);
  mesh.rotateZ(Math.PI / 2)
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.position.set(position.x + 25.5, position.y + 0.5, position.z + 3 / 2);
  meshGroup.add(mesh)

  const mesh2 = mesh.clone()
  mesh2.material = mesh2.material.clone();
  mesh2.material.color.set(data.supplyType == 0 ? '#2978FF' : data.supplyType == 2 ? '#EA6C01' : '#484848')
  mesh2.rotation.copy(mesh.rotation)
  mesh2.receiveShadow = true;
  mesh2.castShadow = false;
  mesh2.position.set(position.x + 25.5, position.y + 0.5, position.z - 3 / 2);
  meshGroup.add(mesh2)
}

// 添加呼吸灯带
const addRollMat = (floorPanelMesh) => {
  const fragmentShader = `
        varying vec2 vUv;
        uniform float time;
        uniform vec2 resolution;
        uniform vec2 lightDirection;
        uniform sampler2D map;
        uniform float speed;
        uniform float amplitude;
        uniform vec3 color1; // 添加一个 uniform 变量来传递颜色 color1
        uniform vec3 color2; // 添加一个 uniform 变量来传递颜色 color2
        float smoothStep(float edge0, float edge1, float x) {
            float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
            return t * t * (3.0 - 2.0 * t);
        }
        void main() {
            // 计算纹理坐标
            vec2 uv = vUv;
            // 根据光照方向计算当前像素点到光源的向量
            vec2 lightVector = normalize(lightDirection);
            // 计算从光源到当前像素的距离比例
            float distanceFromLight = dot(uv, lightVector);
            // 计算呼吸灯效果的周期
            float period = 0.8;
            // 计算呼吸灯效果的幅度
            float amplitude1 = amplitude;
            // 计算呼吸灯效果的强度，从光源方向向外逐渐减弱
            float intensity = amplitude1 * sin(time / period -1.5 + distanceFromLight * 3.14) + amplitude1;
            float repeatFactor = 0.35;
            // 计算偏移量，确保在一轮循环结束后重新从绿色开始渐变
            float offset = mod(time * speed, repeatFactor);
            // 将uv坐标的x值映射到[0, 1]区间，并乘以repeatFactor来控制循环次数
            float x = (vUv.x + 0.0) * repeatFactor;
            // 对x做平滑转换
            float smoothedX = smoothStep(0.0, 1.0, x);
            // 插值颜色从color1到color2，离起点越远颜色越深

            vec3 color = mix(color1, color2, smoothedX);
            vec4 textureColor = texture2D(map, vec2(x, vUv.y));
            gl_FragColor =vec4(color, textureColor.a)* intensity;
        }`
  const vertexShader = `
      varying vec2 vUv;
      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }  `;
  const texture = textureLoader.load(linePng)
  const color1 = new THREE.Color("#ffcc99")
  const color2 = new THREE.Color("#ff9933")
  const color3 = new THREE.Color("#0099cc")
  const color4 = new THREE.Color("#ccffff")
  const material1 = new THREE.ShaderMaterial({
    uniforms: {
      map: {value: texture},
      time: {value: 0.0}, // 控制时间变量，实现贴图运动
      speed: {value: 0.2}, // 运动速度控制
      resolution: {value: new THREE.Vector2()},
      lightDirection: {value: new THREE.Vector2(1.0, 0.0)}, // 默认光照方向为右侧
      amplitude: {value: 0.35},
      color1: {value: new THREE.Vector3(color1.r, color1.g, color1.b)},
      color2: {value: new THREE.Vector3(color2.r, color2.g, color2.b)},
    },
    vertexShader, // 设置顶点着色器
    fragmentShader, // 设置片段着色器
    transparent: true,
  });
  const material2 = new THREE.ShaderMaterial({
    uniforms: {
      map: {value: texture},
      time: {value: 0.0}, // 控制时间变量，实现贴图运动
      speed: {value: 0.2}, // 运动速度控制
      resolution: {value: new THREE.Vector2()},
      lightDirection: {value: new THREE.Vector2(1.0, 0.0)}, // 默认光照方向为右侧
      amplitude: {value: 0.35},
      color1: {value: new THREE.Vector3(color3.r, color3.g, color3.b)},
      color2: {value: new THREE.Vector3(color4.r, color4.g, color4.b)},
    },
    vertexShader,
    fragmentShader,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(8, 0.6)
  const mesh = new THREE.Mesh(geometry, material1);
  mesh.rotateZ(Math.PI);
  mesh.position.set(-10, -1, 0.5);
  floorPanelMesh.add(mesh)
  // mesh.material.uniforms.time.value = 0;

  const tween = new Tween({time: 0})
      .to({time: 10}, 10000)
      .onUpdate(obj => {
        material1.uniforms.time.value = obj.time;
        material2.uniforms.time.value = obj.time;
      })
      .repeat(Infinity)
      .repeatDelay(500)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .start();

  tweenGroup.add(tween)

  const mesh2 = mesh.clone()
  mesh.rotateZ(Math.PI);
  mesh2.material = material2;
  mesh2.position.set(-10, 1, 0.5);
  floorPanelMesh.add(mesh2)

  const mesh3 = mesh.clone()
  mesh3.position.set(13, -1, 0.5)
  floorPanelMesh.add(mesh3)

  const mesh4 = mesh2.clone()
  mesh4.position.set(13, 1, 0.5)
  floorPanelMesh.add(mesh4)
}

// 添加系统面板
const addSystemPanel = (data, floorPanelMesh) => {
  const ele = document.createElement('div');
  ele.className = "system-panel"
  ele.innerHTML = `
    <div class="content">
        <img src="${data.supplyType === 1 ? ph : (data.supplyType === 0 ? qg : gg)}">
        <img src="${data.warningSum > 0 ? tsyj : yj}">
        <img src="${data.EiModelLock ? EI : EI2}">
        <span>${data.system_name}</span>
    </div>
  `
  const obj = new CSS2DObject(ele);
  obj.customType = "systemPanel"
  obj.position.set(28, 3, 0)
  obj.visible = false
  floorPanelMesh.add(obj)
}

// 添加广告牌
const addBillboard = (info, position, floorPanelMesh) => {
  const {label, val, total, system_id} = info
  const ele = document.createElement('div');
  ele.className = "billboard-panel"
  ele.innerHTML = `
    <div class="pop-container">
      <div class="pop-box">
        <div class="monitor_tips_content">
          <div class="Billboard_bt">
              <span>${label}</span>
          </div>
          <div class="Billboard_str">
            <span class='Billboard_red'>${val}</span>
            <span>/${total}</span>
          </div>
        </div>
      </div>
      <div class="Billboard_line"></div>
    </div>
  `
  const obj = new CSS2DObject(ele);
  obj.position.set(position.x - 2, position.y, position.z);
  obj.customType = "billboardPanel"
  obj.curId = system_id
  obj.type = label
  obj.visible = false
  floorPanelMesh.add(obj)
}

// 添加图片图标
const addImgBubble = async (text, position, floorPanelMesh) => {
  if (!text) return
  const texture = await textureLoader.loadAsync(yellowCirSvg)
  texture.colorSpace = THREE.SRGBColorSpace
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio;
  const ctx = canvas.getContext('2d');
  canvas.width = texture.image.width * dpr;
  canvas.height = texture.image.height * dpr;
  ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height)
  ctx.font = `14px Arial`;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toString(), canvas.width / 2, canvas.height / 2);

  const canvasTexture = new THREE.CanvasTexture(canvas)
  const spriteMaterial = new THREE.SpriteMaterial({
    map: canvasTexture,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(position.x, position.y, position.z + 2);
  sprite.scale.set(2.5, 2.5, 2.5);
  sprite.center.set(0.5, 0);
  sprite.customType = "yellow-bubble"
  sprite.visible = false
  floorPanelMesh.add(sprite)

  const texture2 = await textureLoader.loadAsync(redCirSvg)
  texture2.colorSpace = THREE.SRGBColorSpace
  const canvas2 = document.createElement("canvas");
  const ctx2 = canvas2.getContext('2d');
  canvas2.width = texture2.image.width * dpr;
  canvas2.height = texture2.image.height * dpr;
  ctx2.drawImage(texture2.image, 0, 0, canvas2.width, canvas2.height)
  ctx2.font = `14px Arial`;
  ctx2.fillStyle = "#fff";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(text.toString(), canvas2.width / 2, canvas2.height / 2);

  const canvasTexture2 = new THREE.CanvasTexture(canvas2)
  const spriteMaterial2 = new THREE.SpriteMaterial({
    map: canvasTexture2,
  });
  const sprite2 = new THREE.Sprite(spriteMaterial2);
  sprite2.position.set(position.x, position.y, position.z);
  sprite2.scale.set(2, 2, 2);
  sprite2.center.set(0.5, 0);
  sprite2.customType = "red-bubble"
  sprite2.visible = true
  floorPanelMesh.add(sprite2)

  const endPosition = new THREE.Vector3(position.x, position.y, position.z + 1);
  const tween1 = new Tween(sprite.position)
      .to(endPosition, 1000)
      .yoyo(true)
      .repeat(Infinity)
      .repeatDelay(100)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .start();
  const tween2 = new Tween(sprite2.position)
      .to(endPosition, 1000)
      .yoyo(true)
      .repeat(Infinity)
      .repeatDelay(100)
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .start();
  tweenGroup.add(tween1, tween2)
}

// 添加墙体
const addWall = (floorPanelMesh) => {
  const numLines = 4
  const geometry = floorPanelMesh.geometry
  const planeWidth = geometry.parameters.width;
  const planeHeight = geometry.parameters.height;
  for (let i = 0; i < numLines; i++) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-planeWidth / 2, -planeHeight / 2, i / 2 + 0.55),
      new THREE.Vector3(-planeWidth / 2, planeHeight / 2, i / 2 + 0.55),
      new THREE.Vector3(planeWidth / 2, planeHeight / 2, i / 2 + 0.55),
      new THREE.Vector3(planeWidth / 2, -planeHeight / 2, i / 2 + 0.55),
      new THREE.Vector3(-planeWidth / 2, -planeHeight / 2, i / 2 + 0.55),
    ]);
    const material = new THREE.LineBasicMaterial({color: "#BC800F", transparent: true, opacity: 0.3});
    const mesh = new THREE.Line(geometry, material);
    mesh.customType = "wall"
    mesh.visible = false
    floorPanelMesh.add(mesh);
    const endPosition = new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z + Math.random() * 0.5);
    const tween = new Tween(mesh.position)
        .to(endPosition, 1000)
        .yoyo(true)
        .repeat(Infinity)
        .repeatDelay(100)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .start();
    tweenGroup.add(tween)
  }
}

const resetCamera = (cameraPosition = defaultCameraPosition, controlsTarget = defaultOrbitControlTarget) => {
  const cameraStartPosition = camera.position.clone();
  const cameraEndPosition = new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
  const controlsStartTarget = orbitControls.target.clone();
  const controlsEndTarget = new THREE.Vector3(controlsTarget.x, controlsTarget.y, controlsTarget.z);
  const tween1 = new Tween(cameraStartPosition)
      .to(cameraEndPosition, 500)
      .onUpdate((obj) => {
        camera.position.copy(cameraStartPosition)
        camera.lookAt(controlsStartTarget.x, controlsStartTarget.y, controlsStartTarget.z)
      })
      .repeat(0)
      .easing(Easing.Quadratic.Out)
      .start()
  const tween2 = new Tween(controlsStartTarget)
      .to(controlsEndTarget, 500)
      .onUpdate(() => {
        orbitControls.target.set(controlsStartTarget.x, controlsStartTarget.y, controlsStartTarget.z);
      })
      .repeat(0)
      .easing(Easing.Quadratic.Out)
      .start()
  tweenGroup.add(tween1, tween2)
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
  axesHelper: false,
  systemPanel: false,
  billboardPanel: false,
  bubbleType: "气泡2",
  wall: false,
  add() {
    const targetZoom = camera.zoom * 1.1;
    const maxZoom = 1.5;
    if (targetZoom < maxZoom) {
      const tween = new Tween({zoom: camera.zoom})
          .to({zoom: targetZoom}, 500)
          .onUpdate(obj => {
            camera.zoom = obj.zoom;
            camera.updateProjectionMatrix();
          })
          .easing(Easing.Quadratic.Out)
          .start();
      tweenGroup.add(tween)
    }
  },
  minus() {
    const targetZoom = camera.zoom / 1.1;
    const minZoom = 0.5;

    if (targetZoom > minZoom) {
      const tween = new Tween({zoom: camera.zoom})
          .to({zoom: targetZoom}, 500)
          .onUpdate(obj => {
            camera.zoom = obj.zoom;
            camera.updateProjectionMatrix();
          })
          .easing(Easing.Quadratic.Out)
          .start();
      tweenGroup.add(tween)
    }
  },
  reset() {
    resetCamera()
  }
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "systemPanel").name("系统面板").onChange(bool => {
    meshGroup.traverse(child => {
      if (child instanceof CSS2DObject && child.customType === "systemPanel") child.visible = bool
    })
  })
  gui.add(formData, "billboardPanel").name("广告牌").onChange(bool => {
    meshGroup.traverse(child => {
      if (child instanceof CSS2DObject && child.customType === "billboardPanel") child.visible = bool
    })
  })
  gui.add(formData, "bubbleType", ['', "气泡1", "气泡2"]).name("气泡类型").onChange(type => {
    meshGroup.traverse(child => {
      if (child instanceof THREE.Sprite && child.customType === "yellow-bubble") child.visible = type === "气泡1"
      if (child instanceof THREE.Sprite && child.customType === "red-bubble") child.visible = type === "气泡2"
    })
  })
  gui.add(formData, "wall").name("围栏").onChange(bool => {
    meshGroup.traverse(child => {
      if (child instanceof THREE.Line && child.customType === "wall") child.visible = bool
    })
  })
  gui.add(formData, "reset").name("复位")
  gui.add(formData, "add").name("放大")
  gui.add(formData, "minus").name("缩小")
}

</script>

<style lang="scss" scoped>
.factory-wrap {
  pointer-events: auto;

  .three_miniMap {
    position: absolute;
    right: 20px;
    bottom: 20px;
    width: 200px;
    height: 150px;
    background: #0A0A0A;
    padding: 11px;
    box-sizing: border-box;
    border-radius: 4px;

    .three_miniMap_title {
      width: 100%;
      height: 14px;
      opacity: 0.5;
      font-family: PingFangSC-Regular;
      font-size: 12px;
      color: #FFFFFF;
      letter-spacing: 0;
      font-weight: 400;
      user-select: none;
    }

    .three_miniMap_content {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      height: 110px;
      margin-top: 10px;

      .three_miniMap_box {
        width: 50px;
        height: 14px;
        background: url("@/assets/images/3dFactory/map_bg.png") no-repeat 100% 100%;
        margin: 4px;
      }
    }

    .three_miniMap_choose {
      position: absolute;
      left: 12px;
      top: 34px;
      width: 120px;
      height: 112px;
      border: 1px solid rgba(190, 190, 190, 1);
      box-shadow: inset 2px 2px 1px 0 rgba(0, 0, 0, 0.5);
    }
  }

  .map-operation-wrap {
    position: fixed;
    top: 50%;
    right: 32px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transform: translateY(-50%);
    width: 32px;
    opacity: 0.95;
    background: transparent;
    z-index: 1;

    .icon-wrap {
      margin-bottom: 3px;
      border-radius: 4.5px;
      border: 1px solid transparent;
      // background-color: #393939;
      background: rgba(57, 57, 57, 0.6);
      box-sizing: border-box;
      box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.6);
      backdrop-filter: brightness(110%) blur(6px) !important;

      &.select {
        //border: 1px solid #ffbe06;

        .icon {
          background-color: #ffbe06;
        }
      }

      &:nth-child(1) {
        .icon {
          mask: url('@/assets/images/3dFactory/u4901_mouseOver.svg') no-repeat center/17px 17px;
        }
      }

      &:nth-child(2) {
        .icon {
          mask: url('@/assets/images/3dFactory/u4904.svg') no-repeat center/17px 17px;
        }
      }

      &:nth-child(3) {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        margin-bottom: 1px;

        .icon {
          mask: url('@/assets/images/3dFactory/u4914.svg') no-repeat center/17px 17px;
        }
      }

      &:nth-child(4) {
        border-top-left-radius: 0;
        border-top-right-radius: 0;

        .icon {
          mask: url('@/assets/images/3dFactory/u4911.svg') no-repeat center/17px 2px;
        }
      }

      &:nth-child(5) {
        .icon {
          mask: url('@/assets/images/3dFactory/u4907.svg') no-repeat center/17px 17px;
        }
      }

      .icon {
        width: 32px;
        height: 32px;
        background: #fff;
      }
    }
  }
}
</style>

<style lang="scss">
.system-panel {
  color: white;
  background: rgba(149, 149, 149, 0.11);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 8px 16px;
  box-sizing: border-box;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 1;
    z-index: -1;
    border: 1px solid rgba(85, 85, 85, 1) !important;
    box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.5) !important;
    border-radius: 4px !important;
    backdrop-filter: brightness(80%) blur(5px) !important;
    background-color: rgba(149, 149, 149, 0.22) !important;
  }

  .content {
    font-family: HuaweiFont-Bold;
    font-size: 20px;
    line-height: 26px;
    font-weight: 500;
    display: flex;
    justify-content: space-around;

    img {
      margin-right: 5px;
    }

    span {
      margin-left: 10px;
    }
  }
}

.billboard-panel {

  .pop-container {
    position: absolute;
    bottom: 0;
    left: 0;

    .pop-box {
      min-width: 140px;
      background: rgba(149, 149, 149, 0.11);
      border: 1px solid rgba(85, 85, 85, 1);
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      padding: 10px 70px 10px 16px;
      box-sizing: border-box;
      z-index: 1;
      backdrop-filter: brightness(70%) blur(5px) !important;
      position: relative;
      left: -20px;

      &:before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.5;
        /* border: 1px solid rgba(85, 85, 85, 1) !important; */
        box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.5) !important;
        border-radius: 4px !important;
        backdrop-filter: brightness(80%) blur(5px) !important;
        background-color: rgba(149, 149, 149, 0.11) !important;
      }

      .monitor_tips_content {
        color: #fff;

        .Billboard_bt {
          font-size: 16px;
        }

        .Billboard_str {
          display: flex;
          font-family: "HuaweiFont-Regular", "Arial";
          font-size: 20px;
          font-weight: 400;
          margin-top: 8px;
          line-height: 20px;
          letter-spacing: 1.2px;

          .Billboard_red {
            color: red
          }
        }
      }
    }

    .Billboard_line {
      width: 2px;
      height: 100px;
      background: rgba(255, 255, 255, 0.7);

      &:after {
        content: "";
        width: 10px;
        height: 10px;
        background: rgba(255, 255, 255, 1);
        border-radius: 50%;
        position: absolute;
        bottom: 0;
        left: 0;
        transform: translateX(-50%);
      }
    }
  }
}

.baseModel-content {
  position: fixed;
  left: 0;
  top: 0;
  background: rgba(149, 149, 149, 0.11);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 10px 16px 5px 16px;
  box-sizing: border-box;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 1;
    z-index: -1;
    border: 1px solid rgba(85, 85, 85, 1);
    box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    backdrop-filter: brightness(110%) blur(10px);
    background-color: rgba(0, 0, 0, 0.4);
  }

  .floor-box-title {
    font-size: 16px;
    color: #FFFFFF;
    letter-spacing: 0;
    font-weight: 500;
    z-index: 1;
  }

  .floor-box-date {
    margin: 12px 0;
    opacity: 0.5;
    font-size: 12px;
    color: #FFFFFF;
    letter-spacing: 0;
    line-height: 16px;
    font-weight: 400;
    z-index: 1;
  }

  .floor-box-list {
    margin-top: 10px;
    display: flex;
    z-index: 1;

    .floor-box-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      font-size: 12px;
      color: #EDEDED;
      line-height: 30px;
      font-weight: 400;

      img {
        margin-bottom: 5px;
      }
    }
  }
}
</style>
