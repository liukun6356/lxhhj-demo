<template>
  <div class="building-wrap">
    <div class="three-floor-details" ref="threeFloorDetailsRef">
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
    </div>
    <div class="building-floor-menu">
      <div :class="['building-floor-menu-item', item.select ? 'select' : '']" v-for="item in bottomData"
           :key="item.floor_level_type" @click="setCamera(item)" @mouseleave="item.select = false">
        <div class="inner-box">
          <div class="real-box">
            <div class="name">
              <span class="tit">{{ item.floor_level_type }}</span>
              <span class="pos">{{ item.pos }}</span>
            </div>
            <div class="con">
              <div class="con-list">
                <p>
                  <span class="temperature">{{ item.tt401_value_avg }}</span
                  ><span style="color: #cacaca; margin-left: 3px">°C</span>
                </p>
                <span class="average">平均室温</span>
              </div>
              <div class="con-list">
                <p>
                  <span class="temperature">{{ item.household_type_low }}</span>户
                </p>
                <span class="average">过冷住户</span>
              </div>
              <div class="con-list">
                <p>
                  <span class="temperature">{{ item.household_type_high }}</span>户
                </p>
                <span class="average">过热住户</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs, ref} from "vue";
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass'; // 后处理
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry';
import T1 from "@/assets/images/3dBuilding/T1.jpg"
import T2 from "@/assets/images/3dBuilding/T2.jpg"
import T3 from "@/assets/images/3dBuilding/T3.jpg"
import {usethreeBoxStore} from "@/store/modules/threeBox";
import {ElMessage} from "element-plus";

// Ref
const threeFloorDetailsRef = ref(null)

const threeBoxStore = usethreeBoxStore()
const model = reactive({
  houseData: {
    floorCount: 18, // 层高
    houseCount: 6, // 户数
    unitCount: 5 // 单元数
  },
  info: {},
  bottomData: [
    {
      floor_level_type: '高区组名称', // 名称
      select: false,
      pos: '16F~22F', // 楼层
      tt401_value_avg: '20.1', // 平均室温
      household_type_low: 2,
      household_type_high: 3
    },
    {
      floor_level_type: '中区组名称',
      pos: '9F~15F',
      select: false,
      tt401_value_avg: '24.4',
      household_type_low: 2,
      household_type_high: 3
    },
    {
      floor_level_type: '低区组名称',
      pos: '1F~8F',
      select: false,
      tt401_value_avg: '23.7',
      household_type_low: 2,
      household_type_high: 3
    }
  ],
})
const {bottomData, info} = toRefs(model)

onMounted(() => {
  console.log("3d楼栋")
  scene = new three.Scene()
  scene.background = new three.Color("#212121");
  camera = new three.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
  renderer.setClearColor(0x000000, 0);

  initControls()
  initLight()
  initComposer()
  initCamera()
  // 初始化模型
  init()
})

onUnmounted(() => {
  renderer.dispose()
})

const setCamera = (item) => { // 切换视角
  if (!item) {
    camera.position.set(-80, 30, 26)
    return
  }//默认视角
  model.bottomData.forEach((x) => (x.select = false));
  item.select = true;
  const {floor_level_type} = item
  if (floor_level_type && floor_level_type == '低区组名称') {
    camera.position.set(-58, 10, 26.5); //低区
  } else if (floor_level_type && floor_level_type == '中区组名称') {
    camera.position.set(-45, 20, 26.5); //中区
  } else if (floor_level_type && floor_level_type == '高区组名称') {
    camera.position.set(-40, 47, 26); //高区
  }
  controls.update()
}

// 场景逻辑
let scene, ctx, texture, camera, raycaster, controls, outlinePass, animationFrameId, building = [], composer,
    ellipse

const renderer = threeBoxStore.getRenderer()

const initControls = () => { // 轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 0)
  controls.minPolarAngle = Math.PI / 4;// 禁止上下旋转
  controls.maxPolarAngle = (Math.PI / 4) * 3; // 禁止上下旋转
}

const initLight = () => { // 环境光
  const ambLight = new three.AmbientLight('#ffffff', 2); // 基本光源
  scene.add(ambLight);
}

const initComposer = () => {
  composer = new EffectComposer(renderer);//效果合成器，负责管理渲染通道
  const renderPass = new RenderPass(scene, camera); // 后期处理中的一个 Pass，用于将场景进行基本的渲染
  composer.addPass(renderPass)

  outlinePass = new OutlinePass(new three.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  outlinePass.resolution.set(window.innerWidth * 2, window.innerHeight * 2);
  composer.addPass(outlinePass)
  const outputPass = new OutputPass();
  composer.addPass(outputPass)

  const effectFXAA = new ShaderPass(FXAAShader);
  effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  composer.addPass(effectFXAA);
  outlinePass.hiddenEdgeColor.set('#000000') //边线颜色
  outlinePass.edgeStrength = 2.0; // 轮廓边缘强度
  outlinePass.edgeGlow = 1; // 轮廓边缘发光强度
  outlinePass.edgeThickness = 1; // 轮廓边缘厚度
  outlinePass.pulsePeriod = 3; // 脉冲周期
  outlinePass.visibleEdgeColor.set(0xffffff); // 可见边缘颜色
  renderer.domElement.style.touchAction = 'none'
}

const initCamera = () => {
  camera.position.set(-50, 30, 50);
  controls.update();
}

const init = () => {
  raycaster = new three.Raycaster();
  const textureLoader = new three.TextureLoader()
  texture = [T1, T1, T2, T2, T3, T3].map(path => textureLoader.load(path))

  createBuilding(model.houseData.floorCount, model.houseData.houseCount, model.houseData.unitCount);
  setupCameraAndControls()
  setCamera(null)
  initEvent()
}

const createBuilding = (floorCount = 25, houseCount = 5, unitCount = 3) => {
  if (houseCount === 0 || floorCount === 0 || unitCount === 0) return;
  if (houseCount > 20) houseCount = 20;
  const houseWidth = (8.0 * 2) / 3;
  const houseDepth = 3.0 * 1.5;
  const houseHeight = 1.5;
  const groupWidth = (houseWidth + 0.3) * unitCount * Math.ceil(houseCount / 2) + ((unitCount - 1) * houseWidth) / 2;
  const groupDepth = houseCount > 1 ? houseDepth * 2 : houseDepth;
  const zPosition = ((houseWidth + 0.3) * Math.ceil(houseCount / 2)) / 2 + houseWidth / 2 + ((unitCount - 1) * houseWidth) / 4;
  buildOhter(groupWidth, groupDepth, zPosition, houseCount, floorCount, houseHeight, houseDepth);
  buildEllipse(groupWidth, groupDepth, houseCount > 1 ? houseDepth / 2 : 0, -5, zPosition);

  // k: 楼层  j: 单元  i: 房屋
  for (let k = 0; k < floorCount; k++) {
    let unitOffset = 0;
    // 创建牌子
    if (k + 1 === 1 || (k + 1) % 5 === 0) {
      floorTip(houseDepth / 2, k * (houseHeight + 0.3), -houseWidth, k);
    }

    for (let j = 0; j < unitCount; j++) {
      let front = true; // 为true时候，生成的build在前排
      if (j > 0)
        unitOffset = -j * (houseWidth + 0.3) * Math.ceil(houseCount / 2) - (houseWidth * j) / 2;
      for (let i = 0; i < houseCount; i++) {
        const boxGeometry = new three.BoxGeometry(houseDepth, houseHeight, houseWidth);

        let material = null;
        let outlineOpacity = false;
        let color;
        const temperature = Math.random() * 15 + 10
        if (temperature > 18) {
          color = temperature ? buildColor(temperature) : '0xffffff';
          if (color != 0xffffff) {
            material = new three.MeshPhysicalMaterial({
              color: color,
              metalness: 0.3,
              roughness: 0.1,
              emissive: color,
              emissiveIntensity: 0
            });
          } else {
            material = new three.MeshPhongMaterial({
              color: color,
              refractionRatio: 0.6,
              reflectivity: 0.95,
              transparent: true,
              opacity: 0.5
            });
            outlineOpacity = true;
          }
        } else {
          material = texture.map(texture => new three.MeshBasicMaterial({map: texture}));
          outlineOpacity = true;
        }

        const boxMesh = new three.Mesh(boxGeometry, material);
        boxMesh._name = 'build';
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

        buildOutline(boxMesh, color, boxGeometry, outlineOpacity);
        building.push(boxMesh);
        scene.add(boxMesh);
      }
    }
  }
}

const setupCameraAndControls = () => {
  const boundingBox = new three.Box3();
  for (const boxMesh of scene.children) {
    if (boxMesh instanceof three.Mesh) {
      boxMesh.updateMatrixWorld(); // 更新矩阵
      boundingBox.expandByObject(boxMesh);
    }
  }

  const modelCenter = new three.Vector3();
  boundingBox.getCenter(modelCenter);

  const modelSize = boundingBox.getSize(new three.Vector3()).length();
  const distance =
      modelSize / Math.tan((Math.PI * camera.fov) / 360);

  camera.position.set(
      modelCenter.x,
      modelCenter.y,
      modelCenter.z + distance
  );
  controls.target.copy(modelCenter);
  controls.enablePan = false;
}

const initEvent = () => {
  renderer.domElement.addEventListener('mousemove', event => {
    handleMouseMove(event);
  });
  renderer.domElement.addEventListener('click', event => {
    handleClick(event);
  });
  // 开始动画循环
  animate();
}

const buildOhter = (groupWidth, groupDepth, zPosition, houseCount, floorCount, houseHeight, houseDepth) => {
  // 创建上方的模型
  const upperBoxGeometry = new three.BoxGeometry(groupWidth + 6, 0.8, groupDepth + 10);
  const upperBoxMaterial = new three.MeshStandardMaterial({color: '#606060', metalness: 0.8, roughness: 0.6});
  const upperBoxMesh = new three.Mesh(upperBoxGeometry, upperBoxMaterial);
  upperBoxMesh.position.set(houseCount > 1 ? houseDepth / 2 : 0, (floorCount + 1) * (houseHeight + 0.3) + 1, groupWidth / 2 - 3);
  upperBoxMesh.rotateY(Math.PI / 2);
  scene.add(upperBoxMesh);
  // ----------2----------------
  const upperBoxGeometry2 = new three.BoxGeometry(groupWidth + 6 + 4, 1, groupDepth + 10 + 2);
  const upperBoxMesh2 = new three.Mesh(upperBoxGeometry2,
      new three.MeshStandardMaterial({color: '#606060', metalness: 0.9, roughness: 0.6}));
  upperBoxMesh2.position.set(houseCount > 1 ? houseDepth / 2 : 0, (floorCount + 1) * (houseHeight + 0.3) + 1.8, groupWidth / 2 - 3);
  upperBoxMesh2.rotateY(Math.PI / 2);
  scene.add(upperBoxMesh2);
  // ----------3----------------
  const upperBoxGeometry3 = new three.BoxGeometry(groupWidth + 6 + 8, 1, groupDepth + 10 + 4);
  const upperBoxMesh3 = new three.Mesh(upperBoxGeometry3, new three.MeshStandardMaterial({
    color: '#606060',
    metalness: 0.95,
    roughness: 0
  }));
  upperBoxMesh3.position.set(houseCount > 1 ? houseDepth / 2 : 0, (floorCount + 1) * (houseHeight + 0.3) + 2.8, groupWidth / 2 - 3);
  upperBoxMesh3.rotateY(Math.PI / 2);
  scene.add(upperBoxMesh3);
  // 创建下方的模型
  const lowerBoxMesh = upperBoxMesh.clone();
  lowerBoxMesh.position.set(houseCount > 1 ? houseDepth / 2 : 0, -5, groupWidth / 2 - 3);
  scene.add(lowerBoxMesh);
  const lowerBoxMesh2 = upperBoxMesh2.clone();
  lowerBoxMesh2.position.set(houseCount > 1 ? houseDepth / 2 : 0, -6, groupWidth / 2 - 3);
  scene.add(lowerBoxMesh2);
}

const buildEllipse = (groupWidth, groupDepth, x, y, z) => {
  ellipse = new three.Shape();

  const xRadius = groupWidth - 10;
  const yRadius = groupDepth + 20;
  const centerX = 0;
  const centerY = 0;
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = centerX + xRadius * Math.cos(theta);
    const y = centerY + yRadius * Math.sin(theta);

    if (i === 0) {
      ellipse.moveTo(x, y);
    } else {
      ellipse.lineTo(x, y);
    }
  }

  const geometry = new three.ShapeGeometry(ellipse);
  const material = new three.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0});

  const ellipseMesh = new three.Mesh(geometry, material);
  ellipseMesh.rotateX(Math.PI / 2);
  ellipseMesh.rotateZ(Math.PI / 2);
  ellipseMesh.position.set(x, y, groupWidth / 2 - 3);
  ellipse = ellipseMesh
  outlinePass.selectedObjects.push(ellipseMesh);
  scene.add(ellipseMesh)
}

const floorTip = (x, y, z, k) => {
  // 创建牌子
  const signGeometry = new three.PlaneGeometry(4, 1.5); // 牌子的宽度和高度
  const signMaterial = new three.MeshBasicMaterial({
    color: 0x292929,
    side: three.DoubleSide
  });
  // 创建牌子正前方的 mesh
  const frontSignMesh = new three.Mesh(signGeometry, signMaterial);
  frontSignMesh.position.set(x - 0.1, y, z - 2);
  frontSignMesh.rotateY(-Math.PI / 2); // 使牌子面向场景内部
  createTextMesh(`${k + 1}F`, frontSignMesh); // 创建牌子上的文字

  // 创建牌子正后方的 mesh
  const backSignMesh = new three.Mesh(signGeometry, signMaterial);
  backSignMesh.position.set(x + 0.1, y, z - 2);
  backSignMesh.rotateY(Math.PI / 2); // 使牌子面向场景内部
  createTextMesh(`${k + 1}F`, backSignMesh); // 创建牌子上的文字
}

const buildOutline = (boxMesh, color, boxGeometry, opacity) => {// build的描边
  const outlineWidth = 0.05; // 描边宽度
  const outlineSegments = 3; // 描边线段数

  // 判断是否需要添加描边
  // 创建描边的材质
  const option = {
    color: color,
    transparent: opacity,
    opacity: 0.05
  };
  const outlineMaterial = new three.LineBasicMaterial(option);
  const edgesGeometry = new three.EdgesGeometry(boxGeometry);

  // 创建多个线条来模拟加宽的描边效果
  for (let s = 0; s < outlineSegments; s++) {
    const angle = (s / outlineSegments) * Math.PI * 2;
    const xOffset = Math.cos(angle) * outlineWidth;
    const yOffset = Math.sin(angle) * outlineWidth;

    const outlineEdges = new three.LineSegments(
        edgesGeometry,
        outlineMaterial
    );
    outlineEdges.position.set(xOffset, yOffset, 0);
    outlineEdges.scale.set(1.01, 1.01, 1.01); // 扩大一点以避免覆盖
    boxMesh.add(outlineEdges);
  }
}

const createTextMesh = (text, frontSignMesh) => {
  const fontLoader = new FontLoader();
  fontLoader.load("./data/PingFangSC-Medium_Medium.json", font => {
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: 1,
      height: 0.01 // 文字的厚度
    });

    const textMaterial = new three.MeshBasicMaterial({color: 0xffffff});
    const textMesh = new three.Mesh(textGeometry, textMaterial);

    textMesh.position.set(-1, -0.5, 0.01); // 文字的位置
    frontSignMesh.add(textMesh);
    scene.add(frontSignMesh);
  });
}

const animate = () => {
  animationFrameId = requestAnimationFrame(() => animate());
  renderer.render(scene, camera);
  controls.update();
  composer.render();
}

const handleMouseMove = (event) => {
  const container = renderer.domElement; // 获取Three.js场景容器
  const rect = container.getBoundingClientRect(); // 获取容器的边界信息

  const mouse = new three.Vector2();
  mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const alwaysShowOutlineMesh = ellipse;

  const intersects = raycaster.intersectObjects(building);
  if (intersects.length > 0) {
    const selectedMesh = intersects[0].object; // 后处理
    if (selectedMesh.parent && selectedMesh.parent._name === 'build') {
      outlinePass.selectedObjects = [selectedMesh.parent, alwaysShowOutlineMesh];
      const build = selectedMesh.parent
      showDetails(event, build.info)
    }
  } else {
    hideDetails()
    // 清空选中，底座一直显示
    outlinePass.selectedObjects = [alwaysShowOutlineMesh];
  }
}


const handleClick = () => {
  const intersects = raycaster.intersectObjects(building);
  if (intersects.length > 0) {
    const selectedMesh = intersects[0].object; // 后处理
    if (selectedMesh.parent && selectedMesh.parent._name === 'build') {
      const build = selectedMesh.parent
      ElMessage.success(build.info.title)
    }
  }
}

const hideDetails = () => {
  threeFloorDetailsRef.value.style.display = 'none'
}

const showDetails = (event, info) => {
  model.info = info
  // 更新盒子的位置
  threeFloorDetailsRef.value.style.display = 'block'
  threeFloorDetailsRef.value.style.left = event.clientX + 10 + 'px';
  threeFloorDetailsRef.value.style.top = event.clientY - 60 + 10 + 'px';
}

const buildColor = (temperature) => {// 根据温度返回颜色
  switch (true) {
    case temperature > 26:
      return 0xbd0000;
    case temperature >= 24 && temperature <= 26:
      return 0xe76200;
    case temperature >= 22 && temperature < 24:
      return 0xeb7926;
    case temperature >= 20 && temperature < 22:
      return 0xee914c;
    case temperature >= 18 && temperature < 20:
      return 0xf2a872;
    case temperature < 18:
      return 0x2692ff;
  }
}

</script>

<style lang="scss" scoped>
.building-wrap {
  pointer-events: auto;

  .three-floor-details {
    width: 200px;
    position: absolute;
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

  .building-floor-menu {
    position: absolute;
    bottom: 30px;
    right: 50px;
    display: flex;
    z-index: 99;

    .building-floor-menu-item {
      display: flex;
      flex-direction: column;
      width: 112px;
      height: 112px;
      padding: 12px;
      border: 1px solid transparent;
      background: rgba(38, 38, 38, 0.8);
      box-shadow: -10px 0px 22px 0px rgba(0, 0, 0, 0.22);
      border-radius: 4px;
      box-sizing: border-box;
      margin-right: 10px;
      user-select: none;
      transition: all 0.5s ease-in-out 0.3s;
      cursor: pointer;

      &.select {
        width: 250px;
        border: 1px solid #fff;

        .inner-box {
          width: 250px;
        }
      }

      .inner-box {
        width: 80px;
        overflow: hidden;
        transition: all 0.5s ease-in-out 0.3s;

        .real-box {
          width: 225px;

          .name {
            display: flex;
            justify-content: space-between;
            flex-wrap: nowrap;
            overflow: hidden;

            .tit {
              font-size: 14px;
              color: #ffffff;
              letter-spacing: 0;
              font-weight: 500;
            }

            .pos {
              font-size: 12px;
              color: #cccccc;
              letter-spacing: 0;
              font-weight: 400;
            }
          }

          .con {
            display: flex;
            justify-content: space-between;

            .con-list {
              width: 80px;
              height: 68px;
              margin-right: 18px;

              p {
                margin: 15px 0 5px;

                .temperature {
                  font-size: 24px;
                  color: #ffffff;
                  letter-spacing: 0;
                  line-height: 16px;
                  font-weight: 400;
                }

                span {
                  font-size: 12px;
                  color: #cacaca;
                  letter-spacing: 0;
                  font-weight: 200;
                }
              }

              .average {
                opacity: 0.5;
                font-size: 12px;
                color: #ffffff;
                letter-spacing: 0;
                line-height: 16px;
                font-weight: 400;
              }
            }
          }
        }
      }
    }
  }
}
</style>
