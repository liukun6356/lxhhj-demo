<template>
  <div class="skybox-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import GUI from "lil-gui";
import {onMounted, onUnmounted} from "vue";
import * as Cesium from "cesium";

// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(async () => {
  initGui()
})

onUnmounted(() => {
  gui.destroy()
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const defaultSkybox = viewer.scene.skyBox;

const adddefault = () => {
  const defaultSkybox = new Cesium.SkyBox({
    // show: true, //近地天空盒
    sources: {
      negativeX: defaultImg.mx,
      negativeY: defaultImg.my,
      negativeZ: defaultImg.mz,
      positiveX: defaultImg.px,
      positiveY: defaultImg.py,
      positiveZ: defaultImg.pz,
    }
  });
  viewer.scene.skyBox = defaultSkybox
  viewer.scene.skyAtmosphere.show = false;
}

const addqingtian = () => {
  const qingtianSkybox = new Cesium.SkyBox({
    sources: {
      negativeX: qingtianImg.leftav9,
      negativeY: qingtianImg.backav9,
      negativeZ: qingtianImg.bottomav9,
      positiveX: qingtianImg.rightav9,
      positiveY: qingtianImg.frontav9,
      positiveZ: qingtianImg.topav9,
    }
  });
  viewer.scene.skyBox = qingtianSkybox
  viewer.scene.skyAtmosphere.show = false;
}

const addwanxia = () => {
  const qingtianSkybox = new Cesium.SkyBox({
    // show: true, //近地天空盒
    sources: {
      positiveX: wanxiaImg.SunSetRight,
      negativeX: wanxiaImg.SunSetLeft,
      positiveY: wanxiaImg.SunSetFront,
      negativeY: wanxiaImg.SunSetBack,
      positiveZ: wanxiaImg.SunSetUp,
      negativeZ: wanxiaImg.SunSetDown
    }
  });
  viewer.scene.skyBox = qingtianSkybox
  viewer.scene.skyAtmosphere.show = false;
}

const addlantian = () => {
  const qingtianSkybox = new Cesium.SkyBox({
    // show: true, //近地天空盒
    sources: {
      negativeX: lantianImg.Left,
      negativeY: lantianImg.Back,
      negativeZ: lantianImg.Down,
      positiveX: lantianImg.Right,
      positiveY: lantianImg.Front,
      positiveZ: lantianImg.Up,
    }
  });
  viewer.scene.skyBox = qingtianSkybox
  viewer.scene.skyAtmosphere.show = false;
}

const reset = () => {
  viewer.scene.skyBox = defaultSkybox
  viewer.scene.skyAtmosphere.show = false;
}

// lil-gui逻辑
let gui
const formData = {
  reset,
  adddefault,
  addqingtian,
  addwanxia,
  addlantian,
  doClick() {
    console.log(viewer.scene.skyBox)
  }
}

const initGui = () => {
  gui = new GUI({title: "skybox"});
  gui.add(formData, "adddefault").name("默认")
  gui.add(formData, "addqingtian").name("晴天")
  gui.add(formData, "addwanxia").name("晚霞")
  gui.add(formData, "addlantian").name("蓝天")
  gui.add(formData, "reset")
  gui.add(formData, "doClick")
}

// 图片
const defaultImg = (() => {
  const raw = import.meta.glob('/src/views/cesiumLast/component/blob/skybox/skybox_near/default/*.jpg', {
    eager: true,
    import: 'default'
  });
  return Object.keys(raw).reduce((obj, path) => {
    obj[path.match(/default\/(.*)\.jpg$/)[1]] = raw[path];
    return obj;
  }, {})
})()

const qingtianImg = (() => {
  const raw = import.meta.glob('/src/views/cesiumLast/component/blob/skybox/skybox_near/qingtian/*.jpg', {
    eager: true,
    import: 'default'
  });
  return Object.keys(raw).reduce((obj, path) => {
    obj[path.match(/qingtian\/(.*)\.jpg$/)[1]] = raw[path];
    return obj;
  }, {})
})()
const wanxiaImg = (() => {
  const raw = import.meta.glob('/src/views/cesiumLast/component/blob/skybox/skybox_near/wanxia/*.png', {
    eager: true,
    import: 'default'
  });
  return Object.keys(raw).reduce((obj, path) => {
    obj[path.match(/wanxia\/(.*)\.png$/)[1]] = raw[path];
    return obj;
  }, {})
})()
const lantianImg = (() => {
  const raw = import.meta.glob('/src/views/cesiumLast/component/blob/skybox/skybox_near/lantian/*.jpg', {
    eager: true,
    import: 'default'
  });
  return Object.keys(raw).reduce((obj, path) => {
    obj[path.match(/lantian\/(.*)\.jpg$/)[1]] = raw[path];
    return obj;
  }, {})
})()
</script>

<style lang="scss" scoped>
.skybox-wrap {

}
</style>
