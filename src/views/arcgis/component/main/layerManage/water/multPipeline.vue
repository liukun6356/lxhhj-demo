<template>
  <div class="multPipeline-wrap"></div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import GUI from "lil-gui";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import {wfsGetFeaturei} from "@/api/map"
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";

const mapStore = usearcgisMapStore()
onMounted(() => {
  pointerMoveHandler = viewer.on("pointer-move", onMouseMove);
  pointerClickHandler = viewer.on("click", onMouseClick);
  initGui()
  viewer.goTo({
    center: [109.217583, 23.733192], // 示例经纬度（广州）
    zoom: 13
  })
  createPipelines()
  // createNode()
})

onUnmounted(() => {
  gui.destroy()
  layer.destroy();
  viewer.map?.remove(layer);
  // layer1.destroy();
  // viewer.map?.remove(layer1);
  pointerMoveHandler.remove()
  pointerClickHandler.remove()
})

// 地图逻辑
let layer,layer1, pointerMoveHandler, pointerClickHandler
const viewer = mapStore.getArcgisViewer();

const createPipelines = async () => {
  const params = {
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    outputFormat: "application/json",
    srs: "EPSG:4326",
    typeName: "zhsw:basic_pipeline",
    viewparams: "planId:84;regionId:451300"
  }
  const {data} = await wfsGetFeaturei(params)
  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  layer = new GeoJSONLayer({
    url,
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-line",
        color: "blue",
        width: 2
      }
    },
    fields: [
      { name: "element_id", type: "string" },
      { name: "name", type: "string" },
    ],
    outFields:["*"]
  });
  layer.customType = 'pipeline'
  layer.editingEnabled = true
  viewer.map.layers.add(layer);
  viewer.map.add(graphicsLayer);
}

import rainTextBg from "./rain.png"
const createNode = async () => {
  const params = {
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    outputFormat: "application/json",
    srs: "EPSG:4326",
    typeName: "zhsw:basic_node",
    viewparams: "planId:84;regionId:451300"
  }
  const {data} = await wfsGetFeaturei(params)
  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  layer1 = new GeoJSONLayer({
    url,
    renderer: {
      type: 'simple',
      symbol: {
        type: 'picture-marker', // 使用图片作为图标
        url: rainTextBg, // 替换为你的图标 URL
        width: '24px', // 图标宽度
        height: '24px' // 图标高度
      }
    }
  });
  viewer.map.layers.add(layer1)
}

const onMouseClick = async (event) => {
  const movement = await viewer.hitTest(event)
  // console.log( movement.results[0]?.graphic,888)
  if (movement.results[0]?.graphic?.customType !== "pipeline") return
  // console.log(movement.results[0].graphic.attributes,33)
  layer.applyEdits({deleteFeatures: [{objectId: movement.results[0].graphic.attributes.__OBJECTID}]})
}

let highlightedGraphic = null;
const graphicsLayer = new GraphicsLayer({
  name:"雨量站"
});

const onMouseMove = async (event) => {
  const movement = await viewer.hitTest(event);
  const result = movement.results[0];
  if (!result || result.layer?.customType !== "pipeline") return;

  const graphic = result.graphic;
  // console.log(graphic, 33);

  if (highlightedGraphic) {
    graphicsLayer.remove(highlightedGraphic);
  }

  highlightedGraphic = new Graphic({
    geometry: graphic.geometry,
    symbol: {
      type: "simple-line",
      color: "red",
      width: 2
    }
  });
  highlightedGraphic.name = "pipeline"
  graphicsLayer.add(highlightedGraphic);
}

const formDatachange = (k, v) => {
  switch (k) {
    case "axesHelper":

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
}
</script>

<style lang="scss" scoped>
.multPipeline-wrap {

}
</style>
