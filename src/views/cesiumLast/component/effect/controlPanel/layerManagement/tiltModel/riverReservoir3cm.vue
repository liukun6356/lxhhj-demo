<!--江源水库3cm 倾斜模型-->
<template></template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import {onMounted, onUnmounted} from "vue";

const mapStore = usemapStore()
onMounted(async () => {
  tileset = await Cesium.Cesium3DTileset.fromUrl(
      import.meta.env.VITE_APP_GISDATA + '/cz/3dt/SK/JY/tileset.json',
      {
        maximumScreenSpaceError: 25,
        maximumMemoryUsage: 1024,
      }
  );

  const heightOffset = 368;
  const boundingSphere = tileset.boundingSphere;
  const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
  const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
  const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
  const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

  viewer.scene.primitives.add(tileset)
  viewer.camera.flyToBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0))
})

onUnmounted(() => {
  viewer.scene.primitives.remove(tileset)
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let tileset

</script>
