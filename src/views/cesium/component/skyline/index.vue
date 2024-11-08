<!--/**
   * @author: liuk
   * @date: 2024/3/16
   * @describe: 天际线分析
   * @email:1229223630@qq.com
  */-->
<template></template>

<script lang="ts" setup>
import fragmentShaderSource from "./Skyline.glsl";
import {usemapStore} from "@/store/modules/cesiumMap";
import * as mars3d from "mars3d";

const mapStore = usemapStore()
const viewer = mapStore.getCesiumViewer();
const addSkyLine = () =>{
  const tjxWidth = 2; //天际线宽度
  const strokeType = new Cesium.Cartesian3(true, false, false); //天际线，物体描边，全描边
  const tjxColor = new Cesium.Color(1.0, 0.0, 0.0); //边际线颜色
  const bjColor = new Cesium.Color(0.0, 0.0, 1.0); //物体描边颜色
  const mbDis = 500; //物体描边距离
  const postProcess = new Cesium.PostProcessStage({
    fragmentShader: fragmentShaderSource,
    uniforms: {
      height: function () {
        return viewer.camera.positionCartographic.height;
      },
      lineWidth: tjxWidth,
      strokeType: strokeType,
      tjxColor: tjxColor,
      bjColor: bjColor,
      cameraPos: function () {
        return viewer.scene.camera.position;
      },
      mbDis: mbDis
    }
  });
  postProcess.enabled = true
  viewer.scene.postProcessStages.add(postProcess);
}
const add3dtiles = () => {
  const tileset = new mars3d.layer.TilesetLayer({
    name: "eastStreetBridge3cm",
    url: import.meta.env.VITE_APP_DTILES_URL + '/%E4%B8%9C%E8%A1%97%E6%A1%A5/3dt/tileset.json', //数据地址
    maximumScreenSpaceError: 25,
    maximumMemoryUsage: 1024,
    enableCollision:true,

    flyTo: true,
    position:{
      alt:152.8
    }
  })
  viewer.addLayer(tileset)
}

</script>

<script>
import fragmentShaderSource from "./Skyline.glsl";

export default {
  data() {
    return {}
  },
  methods: {
    addSkyLine() {
      const viewer = window.dasViewer;
      const tjxWidth = 2; //天际线宽度
      const strokeType = new Cesium.Cartesian3(true, false, false); //天际线，物体描边，全描边
      const tjxColor = new Cesium.Color(1.0, 0.0, 0.0); //边际线颜色
      const bjColor = new Cesium.Color(0.0, 0.0, 1.0); //物体描边颜色
      const mbDis = 500; //物体描边距离
      const postProcess = new Cesium.PostProcessStage({
        fragmentShader: fragmentShaderSource,
        uniforms: {
          height: function () {
            return viewer.camera.positionCartographic.height;
          },
          lineWidth: tjxWidth,
          strokeType: strokeType,
          tjxColor: tjxColor,
          bjColor: bjColor,
          cameraPos: function () {
            return viewer.scene.camera.position;
          },
          mbDis: mbDis
        }
      });
      postProcess.enabled = true
      viewer.scene.postProcessStages.add(postProcess);
    },
    add3dtiles() {
      const viewer = window.dasViewer;
      const tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: process.env.VUE_APP_GIS_API + "/baoshan/3dtiles/tileset.json", //数据地址
        maximumScreenSpaceError: 10,  //最大的屏幕空间误差
        maximumNumberOfLoadedTiles: 512, //最大加载瓦片个数
        maximumMemoryUsage: 1024,
      }));
      tileset.readyPromise.then(function (tileset) {
        viewer.zoomTo(tileset)
        window.dasViewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(99.154401, 25.128285, 1856.78),
          orientation: {
            heading: Cesium.Math.toRadians(296.2),
            pitch: Cesium.Math.toRadians(-10.1),
            roll:0
          }
        });
      });
      let terrainProvider = new Cesium.CesiumTerrainProvider({
        url: process.env.VUE_APP_GIS_API + "/baoshan/dem",
      });
      viewer.terrainProvider = terrainProvider;
    }
  },
  mounted() {
    const viewer = mapStore.getCesiumViewer();
    viewer.scene.globe.depthTestAgainstTerrain = true;
    this.addSkyLine()
    this.add3dtiles()
  }
}
</script>