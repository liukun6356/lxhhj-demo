<template>
  <div>
    <teleport to="body">
      <ul v-show="showPopup" class="floor-details"
          :style="{ transform: `translate(${popupPos.x }px, ${popupPos.y}px)`}">
        <div class="content">
          <div class="title">{{ info.title }}</div>
          <div class="info">
            <div class="info-item">
              <span class="temperature">{{ info.temperature }}</span>℃
              <div class="tips">当前室温</div>
            </div>
            <div class="info-item">
              <span class="temperature">{{ info.temperature }}</span>℃
              <div class="tips">24小时均温</div>
            </div>
          </div>
        </div>
      </ul>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs, ref} from "vue";
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader';
import {GammaCorrectionShader, ShaderPass, OutlinePass, SMAAPass} from 'three/addons/Addons.js';
import GUI from "lil-gui";
import T1 from "@/assets/images/3dBuilding/T1.jpg"
import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry";
import {ElMessage} from "element-plus";

const threeBoxStore = usethreeBoxStore()
const model = reactive({
  houseData: {
    floorCount: 18, // 层高
    houseCount: 6, // 户数
    unitCount: 5 // 单元数
  },
  info: {},
  showPopup: false,
  popupPos: {
    x: 0,
    y: 0
  },
})
const {info, showPopup, popupPos} = toRefs(model)
onMounted(() => {
  init()
  initGui()
})

onUnmounted(() => {
  gui.destroy()
  renderer.domElement.removeEventListener('click', onMouseClick);
  renderer.domElement.removeEventListener('mousemove', onMouseMove);
  cancelAnimationFrame(timer)
  renderer.clear()
  scene.clear()
})

// 场景逻辑
let scene, ambientLight, axesHelper, orbitControls, timer, composer, outlinePass,
    ellipseMesh, texture, boxGroup

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const css3DRenderer = threeBoxStore.getCss3DRenderer()
const rayCaster = new THREE.Raycaster();

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#212121");

  ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(200);

  // 创建透视相机
  camera.fov = 50
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();
  camera.position.set(-110.55883959116149, 48.73018592790474, 48.38813544636002);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);
  const gammaPass = new ShaderPass(GammaCorrectionShader); // 伽马校正，用了后期通道后颜色异常的修复
  composer.addPass(gammaPass);
  const pixelRatio = renderer.getPixelRatio();
  const smaaPass = new SMAAPass(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
  composer.addPass(smaaPass);
  const v = new THREE.Vector2(window.innerWidth, window.innerWidth);
  outlinePass = new OutlinePass(v, scene, camera); // 给选中的物体添加描边
  outlinePass.visibleEdgeColor.set('#fff'); // 颜色
  outlinePass.edgeStrength = 3.0;// 亮度
  outlinePass.edgeThickness = 3; // 描边厚度
  outlinePass.pulsePeriod = 0; // 闪烁频率，每 1 秒闪烁一次
  outlinePass.hiddenEdgeColor.set('#000') //边线颜色
  composer.addPass(outlinePass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.minPolarAngle = Math.PI / 4;// 禁止上下旋转
  orbitControls.maxPolarAngle = (Math.PI / 4) * 3; // 禁止上下旋转
  orbitControls.addEventListener('change', () => {
    console.log(camera.position)
    console.log(camera, 1234)
  })

  createBuilding(model.houseData.floorCount, model.houseData.houseCount, model.houseData.unitCount)

  renderer.domElement.addEventListener('click', onMouseClick);
  renderer.domElement.addEventListener('mousemove', onMouseMove);

  ;(function render() {
    composer.render();
    css3DRenderer.render(scene, camera)
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const createBuilding = async (floorCount = 25, houseCount = 5, unitCount = 3) => {
  if (![floorCount, houseCount, unitCount].every(Boolean)) return;
  if (houseCount > 20) houseCount = 20;
  const houseWidth = (8.0 * 2) / 3;
  const houseDepth = 3.0 * 1.5;
  const houseHeight = 1.5;
  // 户与户相隔 0.3，单元与单元相隔 houseWidth/2
  const groupWidth = (houseWidth + 0.3) * unitCount * Math.ceil(houseCount / 2) + ((unitCount - 1) * houseWidth) / 2;
  const groupDepth = houseCount > 1 ? houseDepth * 2 : houseDepth;
  const zPosition = ((houseWidth + 0.3) * Math.ceil(houseCount / 2)) / 2 + houseWidth / 2 + ((unitCount - 1) * houseWidth) / 4;

  orbitControls.target.set(0, groupDepth / 2, groupWidth / 2)
  camera.lookAt(0, groupDepth / 2, groupWidth / 2); // 看向 0,0,0
  camera.position.set(-110.55883959116149, 48.73018592790474, 48.38813544636002);

  addTopMesh(groupWidth, groupDepth, zPosition, houseCount, floorCount, houseHeight, houseDepth)
  addBottomEllipse(groupWidth, groupDepth, houseCount > 1 ? houseDepth / 2 : 0, -5, zPosition);
  addHouse(floorCount, houseCount, unitCount, houseWidth, houseDepth, houseHeight)
}

const onMouseMove = (e) => {
  const y = -((e.offsetY / window.innerHeight) * 2 - 1);
  const x = (e.offsetX / window.innerWidth) * 2 - 1;
  rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const intersections = rayCaster.intersectObjects(boxGroup.children);
  if (intersections.length > 0) {
    const selectedMesh = intersections[0].object; // 后处理
    const mesh = selectedMesh.customType === "build" ? selectedMesh : selectedMesh.parent
    outlinePass.selectedObjects = [mesh, ellipseMesh];
    model.info = mesh.info
    model.showPopup = true
    model.popupPos.x = e.clientX + 10;
    model.popupPos.y = e.clientY - 60 + 10
  } else {
    model.showPopup = false
    outlinePass.selectedObjects = [ellipseMesh];
  }
}

const onMouseClick = (e) => {
  const y = -((e.offsetY / window.innerHeight) * 2 - 1);
  const x = (e.offsetX / window.innerWidth) * 2 - 1;
  rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const intersections = rayCaster.intersectObjects(boxGroup.children);
  if (intersections.length) {
    const selectedMesh = intersections[0]?.object
    const mesh = selectedMesh.customType === "build" ? selectedMesh : selectedMesh.parent
    ElMessage.success("点击了" + mesh.info.title)
  }
}

// 添加上下模型
const addTopMesh = (groupWidth, groupDepth, zPosition, houseCount, floorCount, houseHeight, houseDepth) => {
  const group = new THREE.Group();
  // 第一层
  const upperBoxGeometry = new THREE.BoxGeometry(groupWidth + 6, 0.8, groupDepth + 10);
  const upperBoxMaterial = new THREE.MeshStandardMaterial({color: '#606060', metalness: 0.8, roughness: 0.6});
  const upperBoxMesh = new THREE.Mesh(upperBoxGeometry, upperBoxMaterial);
  upperBoxMesh.position.set(houseCount > 1 ? houseDepth / 2 : 0, (floorCount + 1) * (houseHeight + 0.3) + 1, groupWidth / 2 - 3);
  upperBoxMesh.rotateY(Math.PI / 2);
  group.add(upperBoxMesh);
  // 第二层
  const upperBoxGeometry2 = new THREE.BoxGeometry(groupWidth + 6 + 4, 1, groupDepth + 10 + 2);
  const upperBoxMesh2 = new THREE.Mesh(upperBoxGeometry2,
      new THREE.MeshStandardMaterial({color: '#606060', metalness: 0.9, roughness: 0.6}));
  upperBoxMesh2.position.set(houseCount > 1 ? houseDepth / 2 : 0, (floorCount + 1) * (houseHeight + 0.3) + 1.8, groupWidth / 2 - 3);
  upperBoxMesh2.rotateY(Math.PI / 2);
  group.add(upperBoxMesh2);
  // 第三层
  const upperBoxGeometry3 = new THREE.BoxGeometry(groupWidth + 6 + 8, 1, groupDepth + 10 + 4);
  const upperBoxMesh3 = new THREE.Mesh(upperBoxGeometry3,
      new THREE.MeshStandardMaterial({color: '#606060', metalness: 0.95, roughness: 0}));
  upperBoxMesh3.position.set(houseCount > 1 ? houseDepth / 2 : 0, (floorCount + 1) * (houseHeight + 0.3) + 2.8, groupWidth / 2 - 3);
  upperBoxMesh3.rotateY(Math.PI / 2);
  group.add(upperBoxMesh3);

  // 创建下方的模型
  const lowerBoxMesh = upperBoxMesh.clone();
  lowerBoxMesh.position.set(houseCount > 1 ? houseDepth / 2 : 0, -5, groupWidth / 2 - 3);
  group.add(lowerBoxMesh);
  const lowerBoxMesh2 = upperBoxMesh2.clone();
  lowerBoxMesh2.position.set(houseCount > 1 ? houseDepth / 2 : 0, -6, groupWidth / 2 - 3);
  group.add(lowerBoxMesh2);

  scene.add(group)
}

// 添加椭圆底
const addBottomEllipse = (groupWidth, groupDepth, x, y, z) => {
  const ellipse = new THREE.Shape();

  const xRadius = groupWidth - 10;
  const yRadius = groupDepth + 20;
  const centerX = 0;
  const centerY = 0;
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = centerX + xRadius * Math.cos(theta);
    const y = centerY + yRadius * Math.sin(theta);
    i === 0 ? ellipse.moveTo(x, y) : ellipse.lineTo(x, y)
  }

  const geometry = new THREE.ShapeGeometry(ellipse);
  const material = new THREE.MeshBasicMaterial({color: "#00ff00", transparent: true, opacity: 0,});

  ellipseMesh = new THREE.Mesh(geometry, material);
  ellipseMesh.rotateX(Math.PI / 2);
  ellipseMesh.rotateZ(Math.PI / 2);
  ellipseMesh.position.set(x, y, groupWidth / 2 - 3);

  scene.add(ellipseMesh)
  outlinePass.selectedObjects = [ellipseMesh];
}

// 添加户
const addHouse = async (floorCount, houseCount, unitCount, houseWidth, houseDepth, houseHeight) => {
  boxGroup = new THREE.Group();
  const textureLoader = new THREE.TextureLoader()
  texture = await textureLoader.loadAsync(T1)
  // texture.colorSpace = THREE.SRGBColorSpace
  // k: 楼层  j: 单元  i: 房屋
  for (let k = 0; k < floorCount; k++) {
    let unitOffset = 0;
    // 创建牌子
    if (k + 1 === 1 || (k + 1) % 5 === 0) addTip(houseDepth / 2, k * (houseHeight + 0.3), -houseWidth, k);

    for (let j = 0; j < unitCount; j++) {
      let front = true; // 为true时候，生成的build在前排
      if (j > 0) unitOffset = -j * (houseWidth + 0.3) * Math.ceil(houseCount / 2) - (houseWidth * j) / 2;
      for (let i = 0; i < houseCount; i++) {
        const boxGeometry = new THREE.BoxGeometry(houseDepth, houseHeight, houseWidth);

        let material = null;
        let outlineOpacity = false;
        let color = '#fff';
        const temperature = Math.random() * 17 + 10
        if (temperature > 18) {
          if (temperature) color = buildColor(temperature)
          if (color != '#fff') {
            material = new THREE.MeshPhysicalMaterial({
              color: color,
              metalness: 0.3,
              roughness: 0.1,
              emissive: color,
              emissiveIntensity: 0
            });
          } else {
            material = new THREE.MeshPhongMaterial({
              color: color,
              refractionRatio: 0.6,
              reflectivity: 0.95,
              transparent: true,
              opacity: 0.5
            });
            outlineOpacity = true;
          }
        } else {
          material = new THREE.MeshBasicMaterial(({
            map: texture,// 颜色贴图
          }))
          outlineOpacity = true;
        }

        const boxMesh = new THREE.Mesh(boxGeometry, material);
        boxMesh.customType = 'build';
        boxMesh.info = {
          id: `${(j + 1).toString().padStart(2, '0')}-${(k + 1).toString().padStart(2, '0')}${(i + 1).toString().padStart(2, '0')}`,
          temperature: temperature.toFixed(2),
          title: `${j + 1}单元-${(k + 1).toString().padStart(2, '0')}${(i + 1).toString().padStart(2, '0')}`
        };

        let xOffset = 0,
            yOffset = 0,
            zOffset = Math.floor(i / 2) * (houseWidth + 0.3) - unitOffset;
        if (front) {
          front = false;
          yOffset = k * (houseHeight + 0.3);
        } else {
          xOffset = houseDepth + 0.3;
          yOffset = k * (houseHeight + 0.3);
          if (houseCount % 2 != 0) {
            zOffset += houseWidth / 2;
          }
          front = true;
        }

        boxMesh.position.set(xOffset, yOffset, zOffset);
        const outlineMaterial = new THREE.LineBasicMaterial({color, opacity: 0.1, transparent: true});
        const edgesGeometry = new THREE.EdgesGeometry(boxMesh.geometry);
        const outlineEdges = new THREE.LineSegments(edgesGeometry, outlineMaterial);
        outlineEdges.scale.set(1.01, 1.01, 1.01); // 扩大一点以避免覆盖
        boxMesh.add(outlineEdges);
        boxGroup.add(boxMesh);
      }
    }
  }
  scene.add(boxGroup)
}

// 添加标牌
const addTip = async (x, y, z, k) => {
  const group = new THREE.Group();
  const fontLoader = new FontLoader();
  const font = await fontLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/PingFangSC-Medium_Medium.json")
  const textGeometry = new TextGeometry(`${k + 1}F`, {font: font, size: 1, depth: 0.01});
  const textMaterial = new THREE.MeshBasicMaterial({color: "#fff"});
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(-1, -0.5, 0.01); // 文字的位置

  const signGeometry = new THREE.PlaneGeometry(4, 1.5); // 牌子的宽度和高度
  const signMaterial = new THREE.MeshBasicMaterial({color: "#292929",});
  // 创建牌子正前方的 mesh
  const frontSignMesh = new THREE.Mesh(signGeometry, signMaterial);
  frontSignMesh.position.set(x, y, z - 2);
  frontSignMesh.rotateY(-Math.PI / 2); // 使牌子面向场景内部
  frontSignMesh.add(textMesh)
  group.add(frontSignMesh)
  // 创建牌子正后方的 mesh
  const backSignMesh = new THREE.Mesh()
  backSignMesh.geometry = frontSignMesh.geometry.clone();
  backSignMesh.material = frontSignMesh.material.clone();
  backSignMesh.position.set(x, y, z - 2);
  backSignMesh.rotateY(Math.PI / 2); // 使牌子面向场景内部
  backSignMesh.add(textMesh.clone())
  group.add(backSignMesh)

  scene.add(group)
}

// 根据温度返回颜色
const buildColor = (temperature) => {
  switch (true) {
    case temperature > 26:
      return "#bd0000";
    case temperature >= 24 && temperature <= 26:
      return "#e76200";
    case temperature >= 22 && temperature < 24:
      return "#eb7926";
    case temperature >= 20 && temperature < 22:
      return "#ee914c";
    case temperature >= 18 && temperature < 20:
      return "#f2a872";
    case temperature < 18:
      return "#2692ff";
  }
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
  cameraType: ""
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData, "cameraType", ["高", "中", "低"]).onChange(type => {
    switch (type) {
      case "高":
        camera.position.set(-73, 34, 23); //高区
        break
      case "中":
        camera.position.set(-90, 16, 32); //中区
        break
      case "低":
        camera.position.set(-65, 10, 30); //低区
        break
    }
    camera.lookAt(orbitControls.target.x,orbitControls.target.y,orbitControls.target.z)
  })
}

</script>

<style lang="scss">
.label3d {
  font-size: 1px;
  background: #ccc;
}

.floor-details {
  width: 200px;
  position: fixed;
  left: 0;
  top: 0;
  background: #262626;
  border: 1px solid rgba(84, 84, 84, 1);
  box-shadow: -10px 0 22px 0 rgba(0, 0, 0, 0.22);
  border-radius: 4px;
  color: #fff;
  padding: 16px;
  z-index: 99;

  .info {
    margin-top: 20px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    color: #fff;

    .info-item {
      font-family: DINNextLTPro-Light;
      font-size: 12px;
      color: #ffffff;
      letter-spacing: 0;
      font-weight: 200;

      .temperature {
        font-family: DINNextLTPro-Regular;
        font-size: 20px;
        color: #ffffff;
        letter-spacing: 0;
        line-height: 16px;
        font-weight: 400;
      }

      .tips {
        margin-top: 10px;
        opacity: 0.5;
        font-family: PingFangSC-Regular;
        font-size: 12px;
        color: #ffffff;
        letter-spacing: 0;
        line-height: 16px;
        font-weight: 400;
      }
    }
  }
}
</style>
