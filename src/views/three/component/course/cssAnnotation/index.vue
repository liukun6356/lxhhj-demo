<template>
  <div class="cssAnnotation-wrap">

  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {usethreeBoxStore} from "@/store/modules/threeBox"
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {CSS2DObject} from 'three/examples/jsm/Addons.js';
import {CSS3DObject} from 'three/examples/jsm/Addons.js';
import SpriteText from "three-spritetext";
import {onMounted, onUnmounted} from "vue";
import heartPng from "@/assets/images/three/heart.png"
import GUI from "lil-gui";

const threeBoxStore = usethreeBoxStore()
onMounted(() => {
  init()
  initGui()
})

onUnmounted(() => {
  reset()
  gui.destroy()
  cancelAnimationFrame(timer)
  renderer.clear()
})

// 场景逻辑
let scene, material, mesh, directionalLight, ambientLight, axesHelper, orbitControls, timer, composer,
    group

const renderer = threeBoxStore.getRenderer()
const css2DRenderer = threeBoxStore.getCss2DRenderer()
const css3DRenderer = threeBoxStore.getCss3DRenderer()
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

  // 创建透视相机
  camera.position.set(500, 600, 800);// 在200,200,200的位置
  camera.lookAt(0, 0, 0); // 看向 0,0,0

  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera); // 渲染 3D 场景
  composer.addPass(renderPass);

  // 创建轨道控制器 OrbitControls
  orbitControls = new OrbitControls(camera, renderer.domElement);

  renderer.domElement.addEventListener('click', (e) => {
    const y = -((e.offsetY / window.innerHeight) * 2 - 1);
    const x = (e.offsetX / window.innerWidth) * 2 - 1;

    console.log(x, y, 1234)
    console.log('📌 屏幕坐标:', e.offsetX, e.offsetY);
    console.log('📐 NDC 坐标:', x, y);
    const rayCaster = new THREE.Raycaster();
    rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersections = rayCaster.intersectObjects(group.children);

    if (intersections.length) {
      const obj = intersections[0].object;
      const tag = obj.getObjectByName('tag');
      if (tag) tag.visible = !tag.visible;
    }
  });

  const render = () => {
    if (css2DRenderer) css2DRenderer.render(scene, camera)
    if (css3DRenderer) css3DRenderer.render(scene, camera)
    composer.render();
    //  Renderer把 Scene 渲染到canvas上,把 camera 看到的场景 scene 的样子渲染出来
    // renderer.render(scene, camera);
    // 渲染循环,requestAnimationFrame的调用频率和显示器刷新率一致
    timer = requestAnimationFrame(render);
    threeBoxStore.performanceState.update()
  }
  render()
}

const addCSS2DObject = () => {
  group = new THREE.Group();
  group.customType = "1111"
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -50;

  const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);

  const box2 = box.clone();
  box2.position.x = 200;

  group.add(plane);
  group.add(box);
  group.add(box2);

  const ele = document.createElement('div');
  ele.className = "aaa"
  ele.innerHTML = '<p style="background:#ccc;padding: 10px;">这是 box1</p>';
  const obj = new CSS2DObject(ele);
  obj.position.y = 100;
  box.add(obj);
  obj.name = "tag"
  obj.visible = false

  const ele2 = document.createElement('div');
  ele2.innerHTML = '<p style="background:#ccc;padding: 10px;">这是 box2</p>';
  const obj2 = new CSS2DObject(ele2);
  obj2.position.y = 100;
  box2.add(obj2);
  obj2.name = "tag"
  obj2.visible = true
  obj2.remove()

  scene.add(group)
}

const addCSS3DObject1 = () => {
  group = new THREE.Group();
  group.customType = "1111"
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -50;

  const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);

  const box2 = box.clone();
  box2.position.x = 200;


  group.add(plane);
  group.add(box);
  group.add(box2);

  const ele = document.createElement('div');
  ele.className = "label3d"
  ele.innerHTML = '<p>这是 box1</p>';
  const obj = new CSS3DObject(ele);
  obj.position.y = 100;
  box.add(obj);
  obj.name = "tag"
  obj.visible = true

  const ele2 = document.createElement('div');
  ele2.className = "label3d"
  ele2.innerHTML = '<p>这是 box2</p>';
  ele2.style.backfaceVisibility = "hidden"
  const obj2 = new CSS3DObject(ele2);
  obj2.position.y = 100;
  box2.add(obj2);
  obj2.name = "tag"
  obj2.visible = false

  scene.add(group)
}

const addCSS3DObject2 = () => {
  group = new THREE.Group();
  group.customType = "1111"
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -50;

  const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);

  const box2 = box.clone();
  box2.position.x = 200;


  group.add(plane);
  group.add(box);
  group.add(box2);

  // 创建正面
  const front = document.createElement('div');
  front.innerHTML = '<p class="label3d">这是 box1</p>';
  front.style.backfaceVisibility = "hidden"
  const frontObj = new CSS3DObject(front);
  frontObj.position.y = 100;
  box.add(frontObj);
  frontObj.name = "tag"
  frontObj.visible = true

  // 创建反面
  const back = document.createElement('div');
  back.innerHTML = '<p class="label3d">这是 box1</p>';
  back.style.backfaceVisibility = "hidden"
  const backObj = new CSS3DObject(back);
  backObj.position.y = 100;
  backObj.rotation.y = Math.PI; // 旋转 180 °
  // backObj.visible = false
  box.add(backObj);
  backObj.name = "tag"
  backObj.visible = true


  const ele2 = document.createElement('div');
  ele2.className = "label3d"
  ele2.innerHTML = '<p>这是 box2</p>';
  const obj2 = new CSS3DObject(ele2);
  obj2.position.y = 100;
  box2.add(obj2);
  obj2.name = "tag"
  obj2.visible = false

  scene.add(group)
}

const add3dMesh = () => {
  const geometry = new THREE.BoxGeometry(800, 500, 100);
  const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  group = new THREE.Mesh(geometry, material);
  group.customType = "1111"

  const ele = document.createElement('div');
  ele.innerHTML = `<div style="background:#ccc;width:700px;height:400px;pointer-events: none">
    <h1>这是网页</h1>
    <div style="display:flex;">
        <img src="https://wx4.sinaimg.cn/mw690/001wNYJjly1huwhn2t7x3j61401wgtp502.jpg" style="max-height:300px"/>
        <div>
            <p>这是一条新闻</p>
            <p>这是一条新闻</p>
            <p>这是一条新闻</p>
            <p>这是一条新闻</p>
        </div>
    </div>
</div>`;
  ele.style.backfaceVisibility = 'hidden';

  const obj = new CSS3DObject(ele);
  obj.position.y = 0;
  obj.name = "tag"
  group.add(obj);

  scene.add(group)
}

const addSpriteMesh = () => {
  group = new THREE.Group();
  group.customType = "1111"
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -50;

  const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);

  const box2 = box.clone();
  box2.position.x = 200;

  const spriteMaterial = new THREE.SpriteMaterial({
    color: 'lightgreen'
  });
  const tag1 = new THREE.Sprite(spriteMaterial);
  tag1.scale.set(80, 50);
  tag1.position.y = 100;
  box.add(tag1);
  const tag2 = new THREE.Sprite(spriteMaterial);
  tag2.scale.set(80, 50);
  tag2.position.y = 100;
  box2.add(tag2);

  group.add(plane);
  group.add(box);
  group.add(box2);

  scene.add(group)
}

const addCanvasSpriteMesh = async () => {
  group = new THREE.Group();
  group.customType = "1111"
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -50;

  const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);

  const box2 = box.clone();
  box2.position.x = 200;
  const img = await loadImageAsync(heartPng)
  const textture1 = new THREE.CanvasTexture(createCanvas('这是box1', img))
  textture1.colorSpace = THREE.SRGBColorSpace
  const spriteMaterial1 = new THREE.SpriteMaterial({
    map: textture1
  });
  const tag1 = new THREE.Sprite(spriteMaterial1);
  tag1.scale.set(80, 50);
  tag1.position.y = 100;
  box.add(tag1);
  const textture2 = new THREE.CanvasTexture(createCanvas('这是box2', img))
  textture2.colorSpace = THREE.SRGBColorSpace
  const spriteMaterial2 = new THREE.SpriteMaterial({
    map: textture2,
    // aoMap: new THREE.CanvasTexture(createCanvas('这是box1')),
  });
  const tag2 = new THREE.Sprite(spriteMaterial2);
  tag2.scale.set(80, 50);
  tag2.position.y = 100;
  box2.add(tag2);

  group.add(plane);
  group.add(box);
  group.add(box2);

  scene.add(group)
}

const addSpritetext = () =>{
  group = new THREE.Group();
  group.customType = "1111"
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('skyblue')
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -50;

  const boxGeometry = new THREE.BoxGeometry(100, 100, 100);
  const boxMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color('orange')
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  const box2 = box.clone();
  box2.position.x = 200;

  const spriteText = new SpriteText('aaa测试', 21); // [文本，文本高度，颜色]
  spriteText.padding = 5;
  // spriteText.strokeWidth = 1;
  // spriteText.strokeColor = '#fff';
  // spriteText.borderColor = '#ffffff';
  // spriteText.fontSize = 90
  spriteText.fontWeight = "normal"
  spriteText.borderWidth = 1;
  spriteText.borderRadius = 1;
  spriteText.backgroundColor = '#ccc';
  spriteText.position.set(200,70,0)

  scene.add(spriteText)

  group.add(plane);
  group.add(box);
  group.add(box2);

  scene.add(group)
}

const createCanvas = (text, img?: HTMLImageElement) => {
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio;
  const w = canvas.width = 80 * dpr;
  const h = canvas.height = 50 * dpr;
  const c = canvas.getContext('2d');
  switch (formData.canvasType) {
    case "text":
      c.fillStyle = "#ccc";
      c.fillRect(0, 0, w, h);

      // c.fillStyle = "green";
      // c.fillRect(10, 10, w - 20, h - 20);

      c.translate(w / 2, h / 2);
      c.fillStyle = "#ffffff";
      c.font = "normal 16px 微软雅黑";
      c.textBaseline = "middle";
      c.textAlign = "center";
      c.fillText(text, 0, 0);
      break
    case "img":
      c.drawImage(img, 0, 0, w / 2, h / 2);
      c.translate(w / 2, h / 2);
      c.fillStyle = "#ffffff";
      c.font = "normal 14px 微软雅黑";
      c.textBaseline = "middle";
      c.textAlign = "center";
      c.fillText(text, 0, 0)
      break
  }
  return canvas;
}

const loadImageAsync = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = (err) => reject(err);
  img.src = src;
});

const reset = () => {
  scene.children.forEach(child => {
    if (child.customType) {
      child.traverse(obj => {
        if (obj instanceof CSS2DObject || obj instanceof CSS3DObject) obj.name === 'tag' && obj?.element?.parentNode?.removeChild(obj.element);
      });
      scene.remove(child)
    }
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
let gui, typeControl, canvasTypeFolder, canvasTypeControl
const formData = {
  axesHelper: true,
  type: "",
  canvasType: ""
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "axesHelper").onChange(axesHelper => formDatachange("axesHelper", axesHelper))
  typeControl = gui.add(formData, "type",
      ["CSS2DObject", "CSS3DObject1", "CSS3DObject(正反)", "3dMesh", "spriteMesh", "canvasSpriteMesh", "spritetext"]
  ).name("类型").onChange(type => {
    reset()
    if (canvasTypeFolder) canvasTypeFolder.destroy()
    formData.canvasType = ""
    switch (type) {
      case "CSS2DObject":
        addCSS2DObject()
        break
      case "CSS3DObject1":
        addCSS3DObject1()
        break
      case "CSS3DObject(正反)":
        addCSS3DObject2()
        break
      case "3dMesh":
        add3dMesh()
        break
      case "spriteMesh" :
        addSpriteMesh()
        break
      case "canvasSpriteMesh":
        canvasTypeFolder = gui.addFolder('canvas类型');
        canvasTypeControl = canvasTypeFolder.add(formData, "canvasType", ["text", "img"]).onChange(type => {
          reset()
          switch (type) {
            case "text":
              addCanvasSpriteMesh()
              break
            case "img":
              addCanvasSpriteMesh()
              break
          }
        })
        canvasTypeControl.setValue("text")
        break
      case "spritetext":
        addSpritetext()
        break
    }
  })
  typeControl.setValue("spritetext")
}

</script>

<style lang="scss" scoped>
.cssAnnotation-wrap {

}
</style>

<style lang="scss">
.label3d {
  background: #ccc;
  padding: 10px;
}
</style>
