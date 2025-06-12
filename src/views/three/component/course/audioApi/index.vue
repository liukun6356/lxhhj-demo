<template>
  <div class="audioApi-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {onMounted, onUnmounted} from "vue";
import _ from "lodash-es";
import GUI from "lil-gui";

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
  initGui()
})

onUnmounted(() => {
  gui.destroy()
  renderer.domElement.removeEventListener('click', onMouseClick);
  orbitControls.dispose()
  cancelAnimationFrame(timer)
  renderer.clear()
  scene.clear()
})

// 场景逻辑
let scene, material, mesh, directionalLight, ambientLight, axesHelper, orbitControls, timer, composer,
    audio, analyser, group

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()

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
  camera.fov = 60
  camera.near = 0.1
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(0, 1000, 2000);
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  renderer.domElement.addEventListener('click', onMouseClick);

  ;(function render() {
    updateHeight()
    composer.render();
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  })()
}

const onMouseClick = (e) => {
  // audio.play();
}

const addAudio = async () => {
  const listener = new THREE.AudioListener();
  audio = new THREE.Audio(listener);
  analyser = new THREE.AudioAnalyser(audio);
  const loader = new THREE.AudioLoader();
  const buffer = await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/superman.mp3")
  audio.setBuffer(buffer);

  group = new THREE.Group();
  for (let i = 0; i < 21; i++) {
    const geometry = new THREE.BoxGeometry(100, 500, 100);
    const material = new THREE.MeshPhongMaterial({
      // color: 'orange'
      vertexColors: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 250;
    mesh.position.x = i * 150;
    group.add(mesh);
  }
  scene.add(group);
  group.position.x = -1500;
  group.position.y = -500;
}

const updateHeight = () => {
  if (!analyser || !group) return
  const sumArr = _.map(_.chunk(analyser.getFrequencyData(), 50), (arr) => _.sum(arr));
  for (let i = 0; i < group.children.length; i++) {
    const box = group.children[i];
    const height = sumArr[i] / 10;
    box.geometry.dispose();
    box.geometry = new THREE.BoxGeometry(100, height, 100);
    box.position.y = height / 2;

    const positions = box.geometry.attributes.position;
    const colorsArr = [];
    const color1 = new THREE.Color('blue');
    const color2 = new THREE.Color('red');
    for (let i = 0; i < positions.count; i++) {
      const percent = positions.getY(i) / 300;
      const c = color1.clone().lerp(color2, percent);
      colorsArr.push(c.r, c.g, c.b);
    }
    const colors = new Float32Array(colorsArr);
    box.geometry.attributes.color = new THREE.BufferAttribute(colors, 3);
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
let gui, typeControl, apiFolder
const formData = {
  axesHelper: true,
  type: "",
  volume: 1,
  loop: true,
  playbackRate: 1,
  offset: 0,
  detune: 0,
  play() {
    audio.play();
  },
  pause() {
    audio.pause();
  }
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type", ["api", "111"]).onChange(type => {
    if (apiFolder) apiFolder.destroy()
    switch (type) {
      case "api":
        addAudio()
        apiFolder = gui.addFolder("api")
        apiFolder.add(formData, 'volume', 0, 1).name("音量").onChange(value => {
          audio.setVolume(value);
        });
        apiFolder.add(formData, 'playbackRate', [0.5, 1, 2]).name("速率").onChange(value => {
          audio.playbackRate = value;
          audio.pause();//改了属性后要暂停播放
          audio.play();
        });
        apiFolder.add(formData, 'loop').name("循环").onChange(value => {
          audio.setLoop(value);
          audio.pause();
          audio.play();
        });
        apiFolder.add(formData, 'offset', 0, 150).name("进度").onChange(value => {
          audio.offset = value;
          audio.pause();
          audio.play();
        });
        apiFolder.add(formData, 'detune', 0, 1000).name("音高").onChange(value => {
          audio.detune = value;
          audio.pause();
          audio.play();
        });
        apiFolder.add(formData, 'play');
        apiFolder.add(formData, 'pause');
        break
    }
  })
  typeControl.setValue("api")

}

</script>

<style lang="scss" scoped>
.audioApi-wrap {

}
</style>
