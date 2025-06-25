<template>
  <div class="threejsEditor-wrap">
    <div class="menu">
      <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
        <el-sub-menu :index="item.label" v-for="item in menus" :key="item.label">
          <template #title> {{ item.label }}</template>
          <el-menu-item-group :title="menu.label" v-for="menu in item.options" :key="menu.label">
            <el-menu-item :index="x.value" v-for="x in menu.children" :key="x.value">{{ x.label }}</el-menu-item>
          </el-menu-item-group>
        </el-sub-menu>
      </el-menu>
    </div>
    <div class="editor">
      <div class="main"></div>
      <div class="properties">
        <el-tabs
            v-model="activeName"
            type="card"
            class="demo-tabs"
        >
          <el-tab-pane label="属性" name="attr">
            <div>selectedObj: {{ threejsEditorStore.selObj?.name }}</div>
            <el-tree
                style="max-width: 600px"
                :data="treeData"
                :default-expanded-keys="['root']"
                node-key="key"
                :props="{ children: 'children',  label: 'title'}"
                @node-click="handleNodeClick"
            />
            <div>
              <div>几何体： {{ threejsEditorStore.selObj?.geometry.type }}</div>
              <div>材质： {{ threejsEditorStore.selObj?.material.type }}</div>
            </div>
            <el-form v-if="threejsEditorStore.selObj">
              <el-form-item label="颜色">
                <el-color-picker v-model="formData.color" @change="handleValuesChange('color',$event)"/>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="Json" name="Json">
            <pre>{{ JSON.stringify(threejsEditorStore.meshArr, null, 2) }}</pre>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <div class="map-operation-wrap">
      <el-tooltip :content="item.label" placement="left-start" v-for="item in modelOptions" :key="item.label">
        <div class='icon-wrap' @click="modelClick(item.type)">
          <el-icon size="20" :color="transformMode===item.type ?'#ffbe06':'#fff'">
            <component :is="item.icon"/>
          </el-icon>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore,} from "@/store/modules/threeBox"
import {usethreejsEditorStore, MeshTypes} from "@/store/modules/threejsEditor";
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutlinePass, ShaderPass, GammaCorrectionShader} from 'three/addons/Addons.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {markRaw, onMounted, onUnmounted, reactive, toRefs, watch} from "vue";

const threejsEditorStore = usethreejsEditorStore()
const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  const data = localStorage.getItem("threejsEditor")
  if (data) threejsEditorStore.meshArr = JSON.parse(data)
  init()
})

onUnmounted(() => {
  localStorage.setItem("threejsEditor", JSON.stringify(threejsEditorStore.meshArr))
  renderer.domElement.removeEventListener('click', onMouseClick);
  window.removeEventListener('keydown', handleKeydown);

  orbitControls.dispose()
  // transformControls.dispose()
  cancelAnimationFrame(timer)
  renderer.clear()
  scene.clear()
})

watch(() => threejsEditorStore.meshArr, () => {
  addMesh()
})

const model = reactive({
  activeIndex: '2',
  transformMode: "translate",
  treeData: [],
  activeName: "attr",
  formData: {
    color: "#FFA500"
  }
})
const {activeIndex, transformMode, treeData, activeName, formData} = toRefs(model)

const handleSelect = (key) => threejsEditorStore.addMesh(<MeshTypes>key)

const handleNodeClick = (node) => {
  if (!node.name) return
  const mesh = scene.getObjectByName(node.name);
  threejsEditorStore.setSelObj(markRaw(mesh))
  transformControls.attach(mesh);
  outlinePass.selectedObjects = [mesh]
  model.formData.color = "#" + mesh.material.color.getHexString()
}

const handleValuesChange = (key, value) => {
  threejsEditorStore.updateMaterial(threejsEditorStore.selObj.name, {[key]: value})
  threejsEditorStore.selObj.material.color = new THREE.Color(value);
}

const menus = [
  {
    label: "add",
    options: [
      {
        type: 'group',
        label: 'Mesh',
        children: [
          {label: '立方体', value: 'Box'},
          {label: '圆柱', value: 'Cylinder'},
        ],
      },
      {
        type: 'group',
        label: 'Light',
        children: [
          {label: '点光源', value: 'PointLight'},
          {label: '平行光', value: 'DirectionalLight'},
        ],
      },
    ]
  }
]

const modelOptions = [
  {label: '移动', icon: "Rank", type: "translate"},
  {label: '旋转', icon: "Refresh", type: "rotate"},
  {label: '缩放', icon: "DCaret", type: "scale"},
]
// 场景逻辑
let scene, material, mesh, directionalLight, ambientLight, axesHelper, orbitControls, timer, composer,
    outlinePass, transformControls

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()

const init = () => {
  // 创建场景scene
  scene = new THREE.Scene();

  directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(500, 400, 300);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  const gridHeper = new THREE.GridHelper(1000);
  scene.add(gridHeper);

  // 创建透视相机
  camera.fov = 60
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();
  camera.position.set(680.646419307439, 669.5360239992983, 631.2010103189621);
  camera.lookAt(0, 0, 0)
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);
  const v = new THREE.Vector2(window.innerWidth, window.innerWidth);
  outlinePass = new OutlinePass(v, scene, camera);
  outlinePass.pulsePeriod = 1;
  composer.addPass(outlinePass);
  const gammaPass = new ShaderPass(GammaCorrectionShader);
  composer.addPass(gammaPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.target.set(7.051919931103576, 72.7364801137755, -104.63027517541752)
  transformControls = new TransformControls(camera, renderer.domElement);
  scene.add(transformControls.getHelper());
  transformControls.addEventListener('change', () => {
    const obj = transformControls.object;
    if (!obj) return
    switch (transformControls.mode) {
      case "translate":
        threejsEditorStore.updateMeshInfo(obj.name, obj.position, transformControls.mode)
        break
      case "scale":
        threejsEditorStore.updateMeshInfo(obj.name, obj.scale, transformControls.mode)
        break
      case "rotate":
        threejsEditorStore.updateMeshInfo(obj.name, obj.rotation, transformControls.mode)
        break
    }
  });
  transformControls.addEventListener('dragging-changed', function (event) {
    orbitControls.enabled = !event.value;
  });

  renderer.domElement.addEventListener('click', onMouseClick);
  window.addEventListener('keydown', handleKeydown);

  addMesh()

  ;(function render() {
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const onMouseClick = (e) => {
  const y = -((e.offsetY / window.innerHeight) * 2 - 1);
  const x = (e.offsetX / window.innerWidth) * 2 - 1;

  const rayCaster = new THREE.Raycaster();
  rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const objs = scene.children.filter(item => item.name.startsWith('Box') || item.name.startsWith('Cylinder'))
  const intersections = rayCaster.intersectObjects(objs);
  if (!intersections.length) {
    outlinePass.selectedObjects = []
    threejsEditorStore.setSelObj(null)
    transformControls.detach();
    return
  }
  const obj = intersections[0].object;
  outlinePass.selectedObjects = [obj]
  threejsEditorStore.setSelObj(markRaw(obj))
  transformControls.attach(obj);
  model.formData.color = "#" + obj.material.color.getHexString()
}

const handleKeydown = (e) => {
  switch (e.key) {
    case "Delete":
      transformControls.detach();
      threejsEditorStore.selObj && threejsEditorStore.removeMesh(threejsEditorStore.selObj.name)
      threejsEditorStore.setSelObj(null)
      break
  }
}

const modelClick = (v) => {
  model.transformMode = v
  transformControls.setMode(v)
}

const addMesh = () => {
  // reset()
  let mesh, geometry, material, height, color
  threejsEditorStore.meshArr.forEach(item => {
    mesh = scene.getObjectByName(item.name);
    switch (item.type) {
      case MeshTypes.Box:
        const {width, depth} = item.props;
        height = item.props.height
        color = item.props.material.color
        if (!mesh) {
          geometry = new THREE.BoxGeometry(width, height, depth);
          material = new THREE.MeshPhongMaterial({color});
          mesh = new THREE.Mesh(geometry, material);
          mesh.name = item.name;
        }
        break
      case MeshTypes.Cylinder:
        const {radiusTop, radiusBottom} = item.props;
        height = item.props.height
        color = item.props.material.color
        mesh = scene.getObjectByName(item.name);
        if (!mesh) {
          geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height);
          material = new THREE.MeshPhongMaterial({color});
          mesh = new THREE.Mesh(geometry, material);
          mesh.name = item.name;
        }
        break
    }

    const {position, scale, rotation} = item.props
    mesh.position.copy(position)
    mesh.scale.copy(scale)
    mesh.rotation.x = rotation.x;
    mesh.rotation.y = rotation.y;
    mesh.rotation.z = rotation.z;
    scene.add(mesh);
  })
  model.treeData = [{
    title: 'Scene',
    key: 'root',
    children: scene.children.map(item => item.isTransformControlsRoot ? null : {
      title: item.isMesh ? item.geometry.type : item.type,
      key: item.type + item.name + item.id,
      name: item.name
    }).filter(Boolean)
  }]
}

const reset = () => {
  transformControls.detach();
  scene.children.forEach(child => {
    if (child.name) scene.remove(child)
  });
}

const formDatachange = (k, v) => {
  switch (k) {
    case "axesHelper":
      v ? scene.add(axesHelper) : scene.remove(axesHelper)
      break
  }
}

</script>

<style lang="scss" scoped>
.threejsEditor-wrap {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1;
  height: calc(100vh - 20px);
  width: 100vw;
  margin-top: 20px;
  display: flex;
  flex-direction: column;

  .map-operation-wrap {
    position: absolute;
    top: 50%;
    right: 410px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transform: translateY(-50%);
    width: 32px;
    opacity: 0.95;
    background: transparent;
    pointer-events: auto;

    .icon-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 3px;
      border-radius: 4.5px;
      border: 1px solid transparent;
      background: rgba(57, 57, 57, 0.6);
      box-sizing: border-box;
      box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.6);
      backdrop-filter: brightness(110%) blur(6px) !important;

      &.select {
        //background-color: #ffbe06;
      }
    }
  }

  .menu {
    height: 60px;
    border-bottom: 1px solid red;
    pointer-events: auto;
  }

  .editor {
    flex: 1;
    display: flex;
    flex-direction: row;

    .main {
      flex: 1;
      border-right: 1px solid red;
    }

    .properties {
      width: 400px;
      pointer-events: auto;
    }
  }
}
</style>

<style lang="scss">
.el-menu--popup {
  min-width: 80px;
}
</style>
