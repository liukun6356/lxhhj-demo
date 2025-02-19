<template>
  <div class="raster-split-debug-wrap" v-show="props.showTileSplit">
    <div v-for="item in tileSplits" @click="itemClick(item)"
         :class="[curId === item.id ? 'is-active' : null,'tile-item']">
      {{ item.id }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs, watch} from "vue"
import {TimeSeriesRasterLayer} from './layer';
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";

// Props
const props = defineProps<{
  debugData: TimeSeriesRasterLayer['debugData'];
  showTileSplit: boolean;
  showProjectMesh: boolean;
}>();

const mapStore = usearcgisMapStore()
const model = reactive({
  tileSplits: [],
  curId: "",
})
const {tileSplits, curId} = toRefs(model)

onMounted(() => {
  tileSplitLayer = new GraphicsLayer({graphics: []})
  viewer.map.add(tileSplitLayer);
  viewer.map.layers.reorder(tileSplitLayer, viewer.map.layers.length - 1);
  projectMeshLayer = new GraphicsLayer({graphics: []})
  projectMeshLayer.visible = false
  viewer.map.add(projectMeshLayer);
  viewer.map.layers.reorder(projectMeshLayer, viewer.map.layers.length - 1);
  if (!props.debugData) return
  model.tileSplits = props.debugData.tileSplit.map(item => ({...item, show: false}))
  const {projected, trigs} = props.debugData.projectData;
  addprojectMeshEntity(projected, trigs)
})

onUnmounted(() => {
  viewer.map?.remove(projectMeshLayer);
  projectMeshLayer.destroy();
  viewer.map?.remove(tileSplitLayer);
  tileSplitLayer.destroy();
})

watch(() => props.debugData, () => {
  if (!props.debugData) return
  console.log(props.debugData, 1234213)
  model.tileSplits = props.debugData.tileSplit.map(item => ({...item, show: false}))
  const {projected, trigs} = props.debugData.projectData;
  addprojectMeshEntity(projected, trigs)
})

watch(() => props.showProjectMesh, () => {
  projectMeshLayer.visible = props.showProjectMesh
})

const itemClick = (row) => {
  model.curId = row.id
  const graphics1 = row.debugData.raw.map(([A, B, C]) => new Graphic({
    geometry: new Polygon({
      rings: [[A, B, C, A]],
      spatialReference: viewer.spatialReference,
    }),
    symbol: {
      type: "simple-fill",
      color: "transparent",
      outline: {
        color: "red",
      },
    }
  }))
  const graphics2 = row.debugData.optimize.map(([A, B, C]) => new Graphic({
    geometry: new Polygon({
      rings: [[A, B, C, A]],
      spatialReference: viewer.spatialReference,
    }),
    symbol: {
      type: "simple-fill",
      color: "transparent",
      outline: {
        color: "cyan",
        width: 2,
      },
    }
  }))
  tileSplitLayer.removeAll()
  tileSplitLayer.addMany([...graphics1, ...graphics2]);
}

// 地图逻辑
const viewer = mapStore.getArcgisViewer();
let projectMeshLayer, tileSplitLayer

const addprojectMeshEntity = (projected, trigs) => {
  const graphics = trigs.map(([ia, ib, ic]) => new Graphic({
    geometry: {
      type: "polyline",
      paths: [[projected[ia], projected[ib], projected[ic], projected[ia]]],
      spatialReference: {wkid: 3857},
    }
  }))
  projectMeshLayer.addMany(graphics)
}

</script>

<style lang="scss" scoped>
.raster-split-debug-wrap {
  position: fixed;
  right: 315px;
  top: 25px;
  padding: 10px;
  height: auto;
  max-height: 500px;
  background-color: bisque;
  color: black;
  pointer-events: auto;
  overflow: auto;

  .tile-item {
    cursor: default;

    &.is-active {
      background-color: blueviolet;
    }
  }
}
</style>
