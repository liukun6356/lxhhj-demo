<template>
  <div class="MusicPlayer-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass, GammaCorrectionShader} from 'three/addons/Addons.js';
import {createNoise2D} from 'simplex-noise';
import {onMounted, onUnmounted} from "vue";
import {Easing, Group, Tween} from '@tweenjs/tween.js';
import GUI from "lil-gui";
import _ from "lodash-es";
import axios from "axios";

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
  initGui()
})

onUnmounted(() => {
  renderer.domElement.removeEventListener('click', onMouseClick);
  gui.destroy()
  orbitControls.dispose()
  cancelAnimationFrame(timer)
  renderer.clear()
  scene.clear()
})

// 场景逻辑
let scene, material, mesh, directionalLight, ambientLight, axesHelper, orbitControls, timer, composer,
    group, audio, analyser, analyserGroup, playGroup, lyricGroup, lyricPositions, startTime = 0, costTime = 0,
    noteGroup, tweenGroup

const renderer = threeBoxStore.getRenderer()
const camera = threeBoxStore.getCamera()
const noise2D = createNoise2D();

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

  // 创建透视相机
  camera.fov = 60
  camera.near = 300
  camera.far = 1e4
  camera.updateProjectionMatrix();

  camera.position.set(0, 800, 1500);
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const gammaPass = new ShaderPass(GammaCorrectionShader); // 伽马校正，用了后期通道后颜色异常的修复
  composer.addPass(gammaPass)

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  group = new THREE.Group()

  addAudio()
  addBtn()
  addAnalyser()
  addLyric()
  addNote()

  scene.add(group)

  renderer.domElement.addEventListener('click', onMouseClick);

  tweenGroup = new Group();

  ;(function render() {
    if (lyricGroup) updateLyric()
    if (analyserGroup) updateAnalyser()
    if (noteGroup) updateNote2()

    tweenGroup.update();
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
  const playerBtn = group.getObjectByName('playBtn');
  const pauseBtn = group.getObjectByName('pauseBtn');
  const intersections = rayCaster.intersectObjects([playerBtn, pauseBtn]);

  if (intersections.length) {
    const obj = intersections[0].object.target;
    if (!obj) return
    if (obj.name === 'playBtn') {
      obj.scale.y = 0.6;
      obj.position.y = -80 * 0.4 / 2;

      startTime = Date.now();
      pauseBtn.scale.y = 1;
      pauseBtn.position.y = 0;
      audio.play();
    } else if (obj.name === 'pauseBtn') {
      obj.scale.y = 0.6;
      obj.position.y = -80 * 0.4 / 2;

      costTime += Date.now() - startTime;
      playerBtn.scale.y = 1;
      playerBtn.position.y = 0;
      audio.pause();
    }
  }
}

const addAudio = async () => {
  const listener = new THREE.AudioListener();
  audio = new THREE.Audio(listener);
  analyser = new THREE.AudioAnalyser(audio);
  const loader = new THREE.AudioLoader();
  const buffer = await loader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/superman.mp3")
  audio.setBuffer(buffer);
}

const addBtn = () => {
  playGroup = new THREE.Group()

  const dpr = window.devicePixelRatio;
  const canvas = document.createElement("canvas");
  const w = canvas.width = 100 * dpr;
  const h = canvas.height = 100 * dpr;

  const c = canvas.getContext('2d');
  c.translate(w / 2, h / 2);
  c.arc(0, 0, 40 * dpr, 0, Math.PI * 2);
  c.fillStyle = "orange";
  c.fill();
  c.beginPath();
  c.moveTo(-10 * dpr, -20 * dpr);
  c.lineTo(-10 * dpr, 20 * dpr);
  c.lineTo(20 * dpr, 0);
  c.closePath();
  c.fillStyle = "white";
  c.fill();

  const geometry = new THREE.BoxGeometry(100, 80, 100)
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshPhysicalMaterial({
    color: "white",
    // map: texture,
    roughness: 0.3
  })
  const mesh = new THREE.Mesh(geometry, material);

  const g = new THREE.PlaneGeometry(100, 100);
  const m = new THREE.MeshPhysicalMaterial({
    color: 'white',
    map: texture,
    transparent: true,
    roughness: 0.3
  });
  const plane = new THREE.Mesh(g, m);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = 41;
  plane.target = mesh
  mesh.target = mesh
  mesh.name = "playBtn"
  mesh.add(plane); // 只有一面有标识
  playGroup.add(mesh)

  const canvas1 = document.createElement("canvas");
  const w1 = canvas1.width = 100 * dpr;
  const h1 = canvas1.height = 100 * dpr;
  const c1 = canvas1.getContext('2d');
  c1.translate(w1 / 2, h1 / 2);
  c1.arc(0, 0, 40 * dpr, 0, Math.PI * 2);
  c1.fillStyle = "orange";
  c1.fill();
  c1.beginPath();
  c1.moveTo(-10 * dpr, -20 * dpr);
  c1.lineTo(-10 * dpr, 20 * dpr);
  c1.moveTo(10 * dpr, -20 * dpr);
  c1.lineTo(10 * dpr, 20 * dpr);
  c1.closePath();
  c1.lineWidth = 10;
  c1.lineCap = 'round';
  c1.strokeStyle = "white";
  c1.stroke();
  const mesh1 = mesh.clone()
  // const plane1 = plane.clone()
  // plane1.material = plane.material.clone()
  const texture1 = new THREE.CanvasTexture(canvas1);
  mesh1.children[0].material = new THREE.MeshPhysicalMaterial({
    map: texture1,
    transparent: true,
    roughness: 0.3
  });
  mesh1.position.x = 200
  mesh1.children[0].target = mesh1
  mesh1.target = mesh1
  mesh1.name = "pauseBtn"
  playGroup.add(mesh1)

  group.add(playGroup)
  playGroup.position.x = 1100;
  playGroup.position.z = 800;
}

const addAnalyser = () => {
  analyserGroup = new THREE.Group()
  const color1 = new THREE.Color('yellow');
  const color2 = new THREE.Color('blue');
  for (let i = 1; i <= 21; i++) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, i * 50, 0, Math.PI * 2);

    const path = new THREE.Path();
    path.absarc(0, 0, i * 50 - 20, 0, Math.PI * 2);
    shape.holes.push(path)

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 300,
      curveSegments: 50
    });

    const percent = i / 21;
    const color = color1.clone().lerp(color2, percent);
    const material = new THREE.MeshPhysicalMaterial({
      color
    });

    const mesh = new THREE.Mesh(geometry, material);
    analyserGroup.add(mesh)
  }
  analyserGroup.rotateX(-Math.PI / 2);
  analyserGroup.position.y = -200;
  analyserGroup.scale.z = 0.5;
  analyserGroup.rotateX(Math.PI / 8);

  group.add(analyserGroup)
}

const updateAnalyser = () => {
  if (!analyser || !group) return
  // const sumArr = _.map(_.chunk(analyser.getFrequencyData(), 50), (arr) => _.sum(arr)).reverse();
  const sumArr = _.map(_.chunk(analyser.getFrequencyData(), 50), (arr) => _.sum(arr));
  for (let i = 0; i < analyserGroup.children.length; i++) {
    const mesh = analyserGroup.children[i];
    const height = sumArr[i] / 5000;
    mesh.scale.z = height;
  }
}

const addLyric = async () => {
  lyricGroup = new THREE.Group()
  lyricPositions = [];

  const {data} = await axios.get(import.meta.env.VITE_APP_MODELVIEW + `/superman.lrc`)
  const lyrics = data.split('\n');
  lyrics.forEach((item, i) => {
    const timeStr = item.slice(0, 10);
    if (timeStr.length) {
      const minute = parseInt(timeStr.slice(1, 3));
      const second = parseInt(timeStr.slice(4, 6));
      const mSecond = parseInt(timeStr.slice(7, 9));

      const time = minute * 60 * 1000 + second * 1000 + mSecond;
      lyricPositions.push([time, i * 1000]);
    }

    const lyricItem = createLyricItem(item.slice(10));
    lyricGroup.add(lyricItem);
    lyricItem.position.z = -i * 1000;
  })
  lyricGroup.position.y = 650;
  group.add(lyricGroup)
}

let i = 0
const updateLyric = () => {
  if (lyricPositions.length && audio.isPlaying) {
    let currentTime = costTime + Date.now() - startTime;
    const mSeconds = currentTime;
    // const mSeconds = Math.floor(audio.context.currentTime * 1000);
    if (i >= lyricPositions.length - 1) {
      lyricGroup.position.z = lyricPositions[lyricPositions.length - 1][1];
    } else if (mSeconds > lyricPositions[i][0] && mSeconds < lyricPositions[i + 1][0]) {
      const tween = new Tween(lyricGroup.position).to({z: lyricPositions[i][1] + 300}, 300)
          .easing(Easing.Quadratic.InOut)
          .repeat(0)
          .start()
          .onComplete(() => tweenGroup.remove(tween))
      tweenGroup.add(tween);
      i++;
    }
  }
}

const createLyricItem = (text) => {
  const width = text.length * 30
  const dpr = window.devicePixelRatio;
  const canvas = document.createElement("canvas");
  const w = canvas.width = width * dpr;
  const h = canvas.height = 100 * dpr;

  const c = canvas.getContext('2d');
  c.translate(w / 2, h / 2);
  c.fillStyle = "#ffffff";
  c.font = "normal 24px 微软雅黑";
  c.textBaseline = "middle";
  c.textAlign = "center";
  c.fillText(text, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  const g = new THREE.PlaneGeometry(width * 10, 500);
  const m = new THREE.MeshPhysicalMaterial({
    map: texture,
    transparent: true,
    roughness: 0.3
  });
  const plane = new THREE.Mesh(g, m);
  plane.position.y = 41;
  return plane;
}

const addNote = () => {
  noteGroup = new THREE.Group()
  for (let i = 0; i < 100; i++) {
    const note = createNoteItem();
    const x = -1000 + 2000 * Math.random();
    const y = -1000 + 2000 * Math.random();
    const z = -2000 + 4000 * Math.random();
    note.position.set(x, y, z);
    noteGroup.add(note);
  }
  group.add(noteGroup)
}

let time = 0
const updateNote = () => {
  if (!audio.isPlaying) return
  noteGroup.children.forEach(sprite => {
    const {x, y, z} = sprite.position;
    const x2 = x + noise2D(x, time) * 100;
    const y2 = y + noise2D(y, time) * 100;
    const z2 = z + noise2D(z, time) * 100;
    // sprite.position.set(x2, y2, z2);
    const tween = new Tween(sprite.position).to({x: x2, y: y2, z: z2}, 300)
        .easing(Easing.Quadratic.InOut)
        .repeat(0)
        .start()
        .onComplete(() => {
          tweenGroup.remove(tween);
        })
    tweenGroup.add(tween);
  });
  time++;
}
const updateNote2 = _.throttle(updateNote, 500)

const createNoteItem = () => {
  const dpr = window.devicePixelRatio;
  const canvas = document.createElement("canvas");
  const w = canvas.width = 100 * dpr;
  const h = canvas.height = 100 * dpr;

  const ctx = canvas.getContext('2d');
  ctx.translate(w / 2, h / 2);

  ctx.moveTo(-20 * dpr, 40 * dpr);
  ctx.lineTo(-20 * dpr, -10 * dpr);
  ctx.lineTo(20 * dpr, -10 * dpr);
  ctx.lineTo(20 * dpr, 30 * dpr);

  ctx.lineWidth = 10;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = "yellow";
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(10, 30, 10, 15, Math.PI / 2, 0, Math.PI * 2);
  ctx.fillStyle = "yellow";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(-30, 40, 10, 15, Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();


  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture
  });
  const mesh = new THREE.Sprite(material);
  mesh.scale.set(100, 100);
  return mesh
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
let gui
const formData = {
  axesHelper: true
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  gui.add(playGroup, "visible").name("播放按钮")
  gui.add(analyserGroup, "visible").name("频谱")
  gui.add(lyricGroup, "visible").name("歌词")
  gui.add(noteGroup, "visible").name("音符")
}

</script>

<style lang="scss" scoped>
.MusicPlayer-wrap {

}
</style>
