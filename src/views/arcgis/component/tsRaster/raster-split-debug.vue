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
  if (!props.debugData) return
  model.tileSplits = props.debugData.tileSplit.map(item => ({...item, show: false}))
  const {projected, trigs} = props.debugData.projectData;
  addEntity(projected, trigs)
})

onUnmounted(() => {

})

watch(() => props.debugData, () => {
  if (!props.debugData) return
  model.tileSplits = props.debugData.tileSplit.map(item => ({...item, show: false}))
  const {projected, trigs} = props.debugData.projectData;
  addEntity(projected, trigs)
})

watch(() => props.showProjectMesh, () => {
  projectMeshLayer.visible = props.showProjectMesh
})

const itemClick = (row) => {
  console.log(row,123)
  model.curId = row.id
}

// 地图逻辑
const viewer = mapStore.getArcgisViewer();
let projectMeshLayer

const addEntity = (projected, trigs) => {
  const graphics = trigs.map(([ia, ib, ic]) => new Graphic({
        geometry:{
          type: "polyline",
          paths: [[projected[ia], projected[ib], projected[ic], projected[ia]]],
          spatialReference: {wkid: 3857},
        }
      })
  )
  projectMeshLayer = new GraphicsLayer({graphics})
  viewer.map.add(projectMeshLayer);
  projectMeshLayer.visible = false
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
