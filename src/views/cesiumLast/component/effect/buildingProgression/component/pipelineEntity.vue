<template>
  <div></div>
</template>

<script lang="ts" setup>
import pipeline from "../data/pipeline.json"
import {onMounted, onUnmounted} from "vue";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";

const mapStore = usemapStore()
onMounted(() => {
  viewer.dataSources.add(heatDatasource);
  addEntity()
})

onUnmounted(() => {
  viewer.dataSources.remove(heatDatasource);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const heatDatasource = new Cesium.CustomDataSource("pipelineSourceData");
const addEntity = () => {
  let features = pipeline.features || [];
  features.forEach(el => {
    let pos = Cesium.Cartesian3.fromDegreesArray(el.geometry.coordinates.map(el1 => el1.join(',')).join(',').split(',').map(Number));
    let type = el.properties.GROUNDLINE;
    heatDatasource.entities.add({
      customType: "pipelineEntity",
      show: true,
      polyline: {
        show: true,
        positions: pos,
        width: 3,
        material: Cesium.Color.fromCssColorString(type == "主干线" ? "#D51D1D" : "#02A7F0").withAlpha(1),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
  });
}
</script>
