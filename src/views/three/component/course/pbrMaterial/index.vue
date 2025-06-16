<template>
  <div class="pbrMaterial-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/examples/jsm/Addons.js';
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import nxPng from "@/assets/images/pbrMatrial/nx.png"
import nyPng from "@/assets/images/pbrMatrial/ny.png"
import nzPng from "@/assets/images/pbrMatrial/nz.png"
import pxPng from "@/assets/images/pbrMatrial/px.png"
import pyPng from "@/assets/images/pbrMatrial/py.png"
import pzPng from "@/assets/images/pbrMatrial/pz.png"
import zhuanJPG from "@/assets/images/threeCourse/house/zhuan.jpg"
import matcap1Png from "@/assets/images/pbrMatrial/matcap1.png"
import matcap2Png from "@/assets/images/pbrMatrial/matcap2.png"
import matcap3Png from "@/assets/images/pbrMatrial/matcap3.png"

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
    textureCube, gltf, hdrTexture

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const cubeTextureLoader = new THREE.CubeTextureLoader()
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const rgbeloader = new RGBELoader();

const init = async () => {
  // 创建场景scene
  scene = new THREE.Scene();
  textureCube = cubeTextureLoader.load([pxPng, nxPng, pyPng, nyPng, pzPng, nzPng]);
  hdrTexture = await rgbeloader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/pic.hdr")
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = hdrTexture;

  directionalLight = new THREE.DirectionalLight("#ffffff", 2);
  directionalLight.position.set(500, 400, 300);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  // 添加坐标系工具 AxesHelper
  axesHelper = new THREE.AxesHelper(500);
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
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const addMesh = () => {
  const geometry = new THREE.CylinderGeometry(200, 200, 500)
  material = new THREE.MeshStandardMaterial({
    color: "orange",
    roughness: 0.1,//粗糙程度
    metalness: 1,//材质与金属的相似度
    envMap: textureCube, // 环境贴图
    envMapIntensity: 1,//通过乘以环境贴图的颜色来缩放环境贴图的效果
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.customType = "1111"
  scene.add(mesh)
}

const addMesh2 = () => {
  const geometry = new THREE.DodecahedronGeometry(300);
  material = new THREE.MeshPhysicalMaterial({
    color: 'blue',
    metalness: 0,
    roughness: 0,
    envMap: textureCube,
    transmission: 0.9,
    ior: 1.8,
  });
  const mesh = new THREE.Mesh(geometry, material)
  mesh.customType = "1111"
  scene.add(mesh)
}

const addMesh3 = () => {
  const geometry = new THREE.BoxGeometry(300, 300, 300);
  material = new THREE.MeshPhysicalMaterial({
    color: 'black',
    metalness: 0.8,
    roughness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMap: textureCube
  });
  const mesh = new THREE.Mesh(geometry, material)
  mesh.customType = "1111"
  scene.add(mesh)
}

const addMesh4 = () => {
  const geometry = new THREE.TorusGeometry(300, 100);
  const textrue = textureLoader.load(zhuanJPG)
  textrue.colorSpace = THREE.SRGBColorSpace
  material = new THREE.MeshPhysicalMaterial({
    color: 'blue',
    sheen: 1,
    sheenRoughness: 1,
    sheenColor: 'white',
    sheenColorMap: textrue
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.customType = "1111"
  scene.add(mesh)
}

const addMesh5 = () => {
  const geometry = new THREE.SphereGeometry(300);
  material = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0,
    transmission: 1,
    envMap: textureCube
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.customType = "1111"
  scene.add(mesh)
}

const addMesh6 = async () => {
  const group = new THREE.Group();
  group.customType = "111"
  gltf = await gltfLoader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/duck.glb");
  group.add(gltf.scene);
  gltf.scene.scale.setScalar(3000);
  gltf.scene.position.y = -300;
  const texture = textureLoader.load(matcap1Png);
  gltf.scene.traverse(obj => {
    if (obj.isMesh) {
      obj.material = new THREE.MeshMatcapMaterial({
        color: 'orange',
        matcap: texture
      })
    }
  })
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
let gui, typeControl, materialFolder, roughnessControl, clearcoatControl, clearcoatRoughnessControl,
    sheenControl, sheenRoughnessControl, metalnessControl
const formData = {
  axesHelper: true,
  type: "",
  matcapType: "效果1",
  sceneType:"hdr",
  metalness() {
    roughnessControl.setValue(0)
    metalnessControl.setValue(1)
  },
  frosted() {
    roughnessControl.setValue(0.5)
  },
  coat() {
    clearcoatControl.setValue(0.1)
    clearcoatRoughnessControl.setValue(0.25)
  },
  sheen() {
    sheenControl.setValue(1)
    sheenRoughnessControl.setValue(1)
  }
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(formData,"sceneType",["cubeTexture","hdr"]).name("场景背景类型").onChange(type=>{
    switch (type){
      case "cubeTexture":
        scene.background = textureCube
        break
      case "hdr":
        scene.background = hdrTexture
        break
    }
  })
  typeControl = gui.add(formData, "type", ["金属pbr", "玻璃pbr", "油漆pbr", "毛绒pbr", "虹彩pbr"]).name("材质类型").onChange(type => {
    reset()
    if (materialFolder) materialFolder.destroy()
    switch (type) {
      case "金属pbr":
        addMesh()
        materialFolder = gui.addFolder("material")
        materialFolder.addColor(material, 'color');
        roughnessControl = materialFolder.add(material, 'roughness', 0, 1).name("粗糙度");
        metalnessControl = materialFolder.add(material, 'metalness', 0, 1).name("金属相似度");
        materialFolder.add(material, 'envMapIntensity', 0, 5).name("环境贴图");
        materialFolder.add(formData, 'metalness').name("金属效果")
        break
      case "玻璃pbr":
        addMesh2()
        materialFolder = gui.addFolder("material")
        materialFolder.addColor(material, 'color');
        materialFolder.add(material, 'transmission', 0, 1).name("透明度");
        materialFolder.add(material, 'ior', 0, 2.33).name("折射率");
        materialFolder.add(material, 'metalness', 0, 1).name("金属相似度");
        roughnessControl = materialFolder.add(material, 'roughness', 0, 1).name("光泽层的粗糙度");
        materialFolder.add(formData, 'frosted').name("玻璃效果")
        break
      case "油漆pbr":
        addMesh3()
        materialFolder = gui.addFolder("material")
        materialFolder.addColor(material, 'color');
        materialFolder.add(material, 'metalness', 0, 1).name("金属相似度");
        materialFolder.add(material, 'roughness', 0, 1).name("光泽层的粗糙度");
        clearcoatControl = materialFolder.add(material, 'clearcoat', 0, 1).name("清漆度");
        clearcoatRoughnessControl = materialFolder.add(material, 'clearcoatRoughness', 0, 1).name("清漆层的粗糙度");
        materialFolder.add(formData, 'coat').name("车声材质")
        break
      case "毛绒pbr":
        addMesh4()
        materialFolder = gui.addFolder("material")
        materialFolder.addColor(material, 'color');
        sheenControl = materialFolder.add(material, 'sheen', 0, 1).name("光泽层强度")
        sheenRoughnessControl = materialFolder.add(material, 'sheenRoughness', 0, 1).name("光泽层粗糙度")
        materialFolder.add(formData, 'sheen').name("毛绒材质")
        break
      case "虹彩pbr":
        addMesh5()
        materialFolder = gui.addFolder("material")
        materialFolder.addColor(material, 'color');
        materialFolder.add(material, 'iridescence', 0, 1).name("虹彩层强度");
        materialFolder.add(material, 'iridescenceIOR', 1, 2.33).name("虹彩层折射率");
        materialFolder.add(material, 'reflectivity', 0, 1).name("反射率");
        break
      case "伪光照pbr":
        addMesh6()
        materialFolder = gui.addFolder("material")
        materialFolder.add(formData, "matcapType", ["效果1", "效果2", "效果3"]).onChange(type => {
          // 光泽求链接 https://link.juejin.cn/?target=https%3A%2F%2Fobservablehq.com%2Fd%2F2c53c7ee9f619740%3Fui%3Dclassic
          let texture
          switch (type) {
            case "效果1":
              texture = textureLoader.load(matcap1Png);
              break
            case "效果2":
              texture = textureLoader.load(matcap2Png);
              break
            case "效果3":
              texture = textureLoader.load(matcap3Png);
              break
          }
          gltf.scene.traverse(obj => {
            if (obj.isMesh) {
              obj.material = new THREE.MeshMatcapMaterial({
                color: 'orange',
                matcap: texture
              })
            }
          })
        })
        break
    }
  })
  typeControl.setValue("伪光照pbr")
}

</script>

<style lang="scss" scoped>
.pbrMaterial-wrap {

}
</style>
