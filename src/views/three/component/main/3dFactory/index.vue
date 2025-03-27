<template>
  <div class="Factory-wrap">
    <div class="map-operation-wrap">
      <el-tooltip :content="item.label" placement="left-start" v-for="item in mapOperationImgs" :key="item.label">
        <div :class="[item.select ? 'select' : '', 'icon-wrap']">
          <div class="icon" @click="mapOperationClick(item)"></div>
        </div>
      </el-tooltip>
    </div>
    <div class="baseModel-content" v-show="baseModelContentShow" ref="baseModelContentRef">
      <div class="floor-box-title">{{ info.name }}</div>
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
          <img :src="info.EI ? EI : EI2">
          <div>AI调控</div>
          <div>{{ info.EI ? 'ON' : 'OFF' }}</div>
        </div>
      </div>
    </div>
    <div class="three_miniMap" ref="miniMapRef">
      <div class="three_miniMap_title">系统地图</div>
      <div class="three_miniMap_content">
        <div class="three_miniMap_box" v-for="(_,index) in initData.flat()" :key="index"></div>
      </div>
      <div class="three_miniMap_choose" ref="miniMapChooseRef"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs, onMounted, ref, onUnmounted} from "vue";
import {usethreeBoxStore} from "@/store/modules/threeBox";
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader';
import {SMAAPass} from "three/examples/jsm/postprocessing/SMAAPass.js";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as TWEEN from 'three/examples/jsm/libs/tween.module.js';
import heatingSystem from './js/heatingSystem.js';
// 数据
import jsonData from "./data.json"
// 图片
import ph from '@/assets/images/3dFactory/ph.svg'
import qg from '@/assets/images/3dFactory/qg.svg'
import gg from '@/assets/images/3dFactory/gg.svg'
import tsyj from '@/assets/images/3dFactory/tsyj.svg'
import yj from '@/assets/images/3dFactory/yj.svg'
import EI from '@/assets/images/3dFactory/EI.svg'
import EI2 from '@/assets/images/3dFactory/EI2.svg'

// Refs
const baseModelContentRef = ref(null)
const miniMapRef = ref(null)
const miniMapChooseRef = ref(null)

const threeBoxStore = usethreeBoxStore()
const model = reactive({
  mapOperationImgs: [
    {label: '显示系统名称', select: false},
    {label: '热需风险预警', select: false},
    {label: '放大'},
    {label: '缩小'},
    {label: '定位'}
  ],
  info: {
    name: "test1114",
    timePeriod: "2023.11.15-2024.01.08",
    supplyType: 1,
    heatTotalForecast: "--",
    warningSum: "0",
  },
  baseModelContentShow: false,//弹框显示
  isSelectState: false,// 是否为选中状态
  isDragging: false,//是否可拖拽
  initData: []
})
const {mapOperationImgs, info, baseModelContentShow, isSelectState, initData} = toRefs(model)

onMounted(() => {
  initScene()
  initCamera()
  initRenderer()
  initControls()
  initLight()
  initComposer()

  init()
  initminiMap()
})

onUnmounted(() => {
  renderer.dispose()
  cancelAnimationFrame(animationFrameId)
})

const mapOperationClick = (item) => {
  let targetZoom, tweenDuration
  switch (item.label) {
    case '显示系统名称':
      if (item.select) {
        item.select = false;
        systemMeshArr.forEach(item => {
          item.hideSystemInfo()
        })
        return;
      } else {
        item.select = true;
        model.mapOperationImgs[1].select = false;
        systemMeshArr.forEach(item => {
          item.showSystemInfo()
          item.hideWallLine()
        })
      }
      break;
    case '热需风险预警':
      if (item.select) {
        item.select = false;
        systemMeshArr.forEach(item => {
          item.hideWallLine()
        })
        return;
      } else {
        item.select = true;
        model.mapOperationImgs[0].select = false;
        systemMeshArr.forEach(item => {
          item.hideSystemInfo()
          for (let i = 0; i < item.gltfArr.length; i++) {
            let temp = item.gltfArr[i]
            if (temp.obj && temp.obj.wraningType) {
              item.showWallLine()
            }
          }
        })
      }
      break;
    case '放大':
      targetZoom = camera.zoom * 1.1;
      tweenDuration = 1000; // 过渡动画的持续时间，单位毫秒
      const maxZoom = 1.5; // 设置最大的缩放倍数
      if (targetZoom < maxZoom) {
        new TWEEN.Tween({zoom: camera.zoom})
            .to({zoom: targetZoom}, tweenDuration)
            .onUpdate(obj => {
              camera.zoom = obj.zoom;
              camera.updateProjectionMatrix();
            })
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
      }
      break;
    case '缩小':
      targetZoom = camera.zoom / 1.1;
      tweenDuration = 1000; // 过渡动画的持续时间，单位毫秒
      const minZoom = 0.5; // 设置最小的缩放倍数

      if (targetZoom > minZoom) {
        new TWEEN.Tween({zoom: camera.zoom})
            .to({zoom: targetZoom}, tweenDuration)
            .onUpdate(obj => {
              camera.zoom = obj.zoom;
              camera.updateProjectionMatrix();
            })
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
      }
      break;
    case '定位':
      resetCamera(defaultCameraPosition, defaultControlsTarget)
      break;
  }
}

// 地图逻辑
let scene, camera, grid, controls, directionalLight, composer, outlinePass, effectFXAA, animationFrameId,
    systemMeshArr = [], systemAnimateArr = [], labelRendererArr = [],// 广告牌数组
    lastLabelGltfMesh,//上一个选中的广告牌
    preSystem//上一个选中的系统

const dom = document.getElementById("three-box")
const renderer = threeBoxStore.getRenderer()
const labelRenderer = threeBoxStore.getLabelRenderer()
const mouse = new three.Vector2();
const raycaster = new three.Raycaster();
const defaultCameraPosition = {x: 42.70363028585678, y: 57.06887828250089, z: 78.20262412839936}//默认相机位置
const defaultControlsTarget = {x: 1.4849148487544956, y: -14.111340134046443, z: 35.54181586595351}//默认轨道控制器位置

const initScene = () => {//创建scene
  scene = new three.Scene();
  scene.background = new three.Color("#212121");
  grid = new three.GridHelper(1200, 540, 0xffffff, 0xffffff);
  grid.material.opacity = 0.08;
  grid.material.depthWrite = true;
  grid.material.transparent = true;
  grid.p_name = "gridPanel"
  // 设置网格的位置
  grid.position.set(0, -1, 0); // 这里的坐标根据你的需求来设置
  scene.add(grid);
}

const initCamera = () => {//创建相机
  camera = new three.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 5000);
  // 设置相机的位置
  camera.position.set(defaultCameraPosition.x, defaultCameraPosition.y, defaultCameraPosition.z);
}

const initRenderer = () => {//创建构造器
  renderer.useLegacyLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = three.PCFSoftShadowMap; // 设置阴影映射类型，这里使用PCFSoftShadowMap以获得更柔和的阴影效果
  renderer.toneMapping = three.NoToneMapping; // 将色调映射设置为无色调映射
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const initControls = () => {// 创建轨道控制器
  controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.maxDistance = 200;
  controls.target.set(defaultControlsTarget.x, defaultControlsTarget.y, defaultControlsTarget.z);
  controls.addEventListener('change', () => {
    const minHeight = 10; // 设置水平面以上的最小高度
    // 获取相机的位置
    const cameraPosition = camera.position.clone();
    // 限制相机的高度，确保它始终在水平面以上
    if (cameraPosition.y < minHeight) {
      cameraPosition.y = minHeight;
      camera.position.copy(cameraPosition);
      // controls.target.y = minHeight; // 同时调整控制器的目标位置，以防止相机下沉
    }
  })
  // controls.enableRotate = false; // 禁用旋转
  // controls.enablePan = false;   // 禁用平移
  // controls.enableZoom  = false;   // 禁用缩放
  controls.mouseButtons = {
    LEFT: three.MOUSE.PAN,
    MIDDLE: three.MOUSE.DOLLY,
    RIGHT: three.MOUSE.ROTATE
  };
}

const initLight = () => {// 创建光源
  const ambLight = new three.AmbientLight('#ffffff', 1) // 基本光源
  scene.add(ambLight)
  const rectLight = new three.RectAreaLight(0xffffff, 500, 10, 10);
  rectLight.position.set(5, 40, -20);
  scene.add(rectLight);
  directionalLight = new three.DirectionalLight("#ffffff");
  directionalLight.position.set(60.5, 80, -97.5);
  directionalLight.intensity = 1
  directionalLight.shadow.camera.near = 2; //产生阴影的最近距离
  directionalLight.shadow.camera.far = 1000; //产生阴影的最远距离
  directionalLight.shadow.camera.left = -100; //产生阴影距离位置的最左边位置
  directionalLight.shadow.camera.right = 100; //最右边
  directionalLight.shadow.camera.top = 100; //最上边
  directionalLight.shadow.camera.bottom = -100; //最下面
  //这两个值决定使用多少像素生成阴影 默认512
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.mapSize.width = 1024;
  //告诉平行光需要开启阴影投射
  directionalLight.castShadow = true;
  scene.add(directionalLight);
}

const initComposer = () => {// 后处理
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  outlinePass = new OutlinePass(new three.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  outlinePass.resolution.set(window.innerWidth * 2, window.innerHeight * 2);
  composer.addPass(outlinePass);

  effectFXAA = new ShaderPass(FXAAShader);
  composer.addPass(effectFXAA);
  effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
  composer.addPass(smaaPass);
  // const outputPass = new OutputPass();
  // composer.addPass(outputPass);
  renderer.domElement.style.touchAction = 'none';
  renderer.domElement.className = 'renderer'
  outlinePass.hiddenEdgeColor.set("#000000"); //边线颜色
  outlinePass.edgeStrength = 2.0; // 轮廓边缘强度
  outlinePass.edgeGlow = 1; // 轮廓边缘发光强度
  outlinePass.edgeThickness = 0.1; // 轮廓边缘厚度
  outlinePass.pulsePeriod = 0; // 脉冲周期
  outlinePass.visibleEdgeColor.set(0xffffff); // 可见边缘颜色
}

const init = () => {
  createBasePanel()// 创建地板
  addFactoryModel()// 绘制两边模型
  addHeatingSystem()// 绘制中间模型

  createListener() // 创建时间
  renderer.setAnimationLoop(() => {//每个可用帧都会调用的函数
    for (let i = 0; i < systemAnimateArr.length; i++) {
      systemAnimateArr[i](systemMeshArr[i])
    }
    for (let i = 0; i < labelRendererArr.length; i++) {
      labelRendererArr[i].render(scene, camera);
    }
    labelRenderer.render(scene, camera);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
    composer.render();
    threeBoxStore.performanceState.update()
  });
  window.addEventListener('resize', (event) => {
    event.stopPropagation(); // 阻止事件冒泡到其他监听器
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  });
}

const createBasePanel = () => {// 创建地板
  const planeGeometry = new three.BoxGeometry(1200, 1200, 0.1);
  const planeMaterial = new three.MeshPhongMaterial({color: '#4d4d4d',});
  const plane = new three.Mesh(planeGeometry, planeMaterial); // 创建地板模型
  plane.rotation.x = -0.5 * Math.PI; // 默认平行于xoy面，沿着X轴旋转-90°至xoz面
  plane.receiveShadow = true;
  plane.castShadow = false;
  plane.position.set(0, -1.5, 0);
  scene.add(plane); // 向场景中添加创建的地板
}

const addFactoryModel = () => {// 添加工厂模型
  const loader = new GLTFLoader()
  loader.load('./data/gc.glb', function (gltf) {
    const obj = gltf.scene;
    obj.scale.set(0.05, 0.05, 0.05);
    obj.position.set(20, 0, -40);
    obj.rotation.set(0, 0, 0);

    obj.rotation.y = -Math.PI / 2;
    // 创建黑色材质
    const blackMaterial = new three.MeshStandardMaterial({
      color: "#2f2e2e",
      metalness: 0.6,
      roughness: 0.6,
    });

    obj.traverse(function (child) {
      if (child.isMesh) {
        child.material = blackMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(obj);
    const model2 = obj.clone();
    model2.position.set(20, 0, 85);
    model2.traverse(function (child) {
      if (child.isMesh) {
        child.material = blackMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(model2);
  });
}

const addHeatingSystem = () => {// 绘制中间模型
  if (!jsonData.length) return
  // 一列五个系统
  model.initData = jsonData.map(item => {
    item.EI = item.EiModelLock
    item.name = item.system_name
    item.id = item.system_id
    item.warningNum = item.sourceT
    item.warningNum_2 = item.unitT
    item.warningNum_3 = item.hallT
    item.type = item.warningSum
    item.typeNum = item.heatTotalForecast
    return item
  })
  const tempArr = JSON.parse(JSON.stringify(model.initData)), result = [];
  while (tempArr.length) {
    result.push(tempArr.splice(0, 5));
  }
  model.initData = result;
  // 创建地面
  createGradientPlane(model.initData);
  // 创建系统
  createSystem(model.initData)
}

const createGradientPlane = (initData) => {
  const group = initData.length
  const width = 60 * group;
  const height = 12 * 5;
  const colorStart = new three.Color(0x4C4C4C)
  const colorEnd = new three.Color(0x535353)
  const planeGeometry = new three.PlaneGeometry(width, height); // 创建平面几何体
  // 顶点着色器代码
  const vertexShader = `varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  // 片段着色器代码
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
  const gradientMaterial = new three.ShaderMaterial({
    uniforms: {
      colorStart: {value: colorStart}, // 转换为数组
      colorEnd: {value: colorEnd} // 转换为数组
    },
    vertexShader,
    fragmentShader,
    transparent: false
  });
  const plane = new three.Mesh(planeGeometry, gradientMaterial); // 创建平面模型
  plane.p_name = "basePanel";
  plane.rotation.x = -0.5 * Math.PI; // 默认平行于xoy面，沿着X轴旋转-90°至xoz面
  plane.receiveShadow = true;
  plane.castShadow = false;
  plane.position.set(width / 2 - 20, 0.1, height / 2);
  scene.add(plane)
}

const createSystem = (initData) => {
  initData.forEach((group, i) => {
    group.forEach((item, j) => {
      const mesh = new heatingSystem({
        scene: scene,
        camera: camera,
        outlinePass: outlinePass,
        labelRenderer: labelRenderer,
        position: {x: 10 + 60 * i, y: 0, z: 10.5 + 9 * j},
        options: item,
        systemClick: function (obj) {
          console.log(obj.options.system_name, 111)
        }
      })
      systemMeshArr.push(mesh)
      systemAnimateArr.push(mesh.animate)
    })
  })
}

const createListener = () => {// 创建时间
  dom.addEventListener('pointermove', (event) => {
    if (model.isSelectState) return
    event.stopPropagation(); // 阻止事件冒泡到其他监听器
    if (event.isPrimary === false) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    outlinePass.edgeGlow = 1;
    outlinePass.edgeThickness = 0.1;
    const intersects = raycaster.intersectObject(scene, true);
    if (intersects.length === 0) return;
    let selectedObject = intersects[0].object;
    const objName = selectedObject.p_name;
    if (objName !== "floorPanel") model.baseModelContentShow = false
    outlinePass.selectedObjects = [];
    switch (objName) {
      case "floorPanel": // 系统底板
        outlinePass.visibleEdgeColor.set(0xffffff);
        outlinePass.selectedObjects = [selectedObject];
        model.info = selectedObject.options
        model.baseModelContentShow = true
        // 更新盒子的位置
        baseModelContentRef.value.style.left = event.clientX + 10 + 'px';
        baseModelContentRef.value.style.top = event.clientY + 10 + 'px';
        break
      case "gltf": // 模型  热源 机组 热单元
        outlinePass.edgeGlow = 2;
        outlinePass.edgeThickness = 4;
        if (selectedObject.wraningType) {
          outlinePass.visibleEdgeColor.set(0xfc1553);
        } else {
          outlinePass.visibleEdgeColor.set(0xffffff);
        }
        while (selectedObject.isChild) {//gltf的hover只显示边线
          selectedObject = selectedObject.parent
        }
        outlinePass.selectedObjects = [selectedObject];
        break
    }
  })
  dom.addEventListener("click", (event) => {
    outlinePass.selectedObjects = [];
    event.stopPropagation(); // 阻止事件冒泡到其他监听器

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(scene, true);
    if (intersects.length === 0) return;
    let selectedObject = intersects[0].object;
    console.log(selectedObject.systemId, 222, selectedObject.p_name)
    const objName = selectedObject.p_name;
    switch (objName) {
      case "gltf":
        if (selectedObject.wraningType) {
          outlinePass.visibleEdgeColor.set(0xfc1553);
        } else {
          outlinePass.visibleEdgeColor.set(0xffffff);
        }
        while (selectedObject.isChild) {//gltf的hover只显示边线
          selectedObject = selectedObject.parent
        }
        outlinePass.selectedObjects = [selectedObject];
        // 去除所有广告牌
        // systemMeshArr.forEach(item => item.deleteBillboard())
        if (lastLabelGltfMesh) lastLabelGltfMesh.deleteBillboard();
        if (preSystem) preSystem.gltfArrarr.forEach(gltf => gltf.obj.deleteBillboard())
        if (selectedObject.showBillboard) {
          selectedObject.showBillboard(labelRendererArr);
          lastLabelGltfMesh = selectedObject;
        }
        console.log(selectedObject.modelInfo.type,333)
        model.isSelectState = true
        model.baseModelContentShow = false
        break
      case "floorPanel": // 系统底板
        outlinePass.visibleEdgeColor.set(0xffffff);
        outlinePass.selectedObjects = [selectedObject];
        model.isSelectState = true
        model.baseModelContentShow = false
        if (lastLabelGltfMesh) lastLabelGltfMesh.deleteBillboard();
        if (preSystem) preSystem.gltfArrarr.forEach(gltf => gltf.obj.deleteBillboard())
        selectedObject.clickEvent(outlinePass, labelRendererArr);
        const curSys = systemMeshArr.find(sys => sys.options.id === selectedObject.options.id)
        preSystem = curSys
        break
      default:
        model.isSelectState = false
        outlinePass.selectedObjects = [];
        if (lastLabelGltfMesh) lastLabelGltfMesh.deleteBillboard();
        if (preSystem) preSystem.gltfArrarr.forEach(gltf => gltf.obj.deleteBillboard())
        break
    }

  }, false);
}

const initminiMap = () => {
  // 水平方向最大偏移量
  const MaxOffsetWidth = Math.abs(miniMapRef.value.getBoundingClientRect().width - miniMapChooseRef.value.getBoundingClientRect().width - 3);
  const offsetLeft = miniMapRef.value.getBoundingClientRect().left
  miniMapRef.value.addEventListener('mousedown', (event) => {
    event.stopPropagation()
    model.isDragging = true
    model.baseModelContentShow = false
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

const resetCamera = (cameraPosition = defaultCameraPosition, controlsTarget = defaultControlsTarget) => { // 移动相机
  const tweenDuration = 2000; // 过渡动画的持续时间，单位毫秒
  camera.zoom = 1
  const cameraStartPosition = camera.position.clone();
  const cameraEndPosition = new three.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z);

  const controlsStartTarget = controls.target.clone();
  const controlsEndTarget = new three.Vector3(controlsTarget.x, controlsTarget.y, controlsTarget.z);
  new TWEEN.Tween(cameraStartPosition)
      .to(cameraEndPosition, tweenDuration)
      .onUpdate(() => {
        camera.position.copy(cameraStartPosition);
        camera.updateProjectionMatrix();
      })
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  new TWEEN.Tween(controlsStartTarget)
      .to(controlsEndTarget, 2000)
      .onUpdate(() => {
        controls.target.copy(controlsStartTarget);
      })
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
}

</script>

<style lang="scss" scoped>
.Factory-wrap {
  pointer-events: auto;

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

  .baseModel-content {
    position: absolute;
    top: 50px;
    left: 50px;
    background: rgba(149, 149, 149, 0.11);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    padding: 10px 16px 5px 16px;
    box-sizing: border-box;
    z-index: 1;

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
}

</style>

<style lang="scss">
.three_systemName { // 弹框
  color: white;
  background: rgba(149, 149, 149, 0.11);
  /* border: 1px solid rgba(85, 85, 85, 1); */
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

.pop-container { // 广告牌
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
</style>
