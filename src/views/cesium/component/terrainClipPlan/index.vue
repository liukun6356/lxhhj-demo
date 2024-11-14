<!--挖方分析-->
<template>
  <div class="terrainClipPlan-wrap">
    <div>
      <el-button @click="selecteHeight" type="primary">挖方分析</el-button>
    </div>
    <ul :style="{top:popupPos.top+'px',left:popupPos.left+'px'}">
      <li>计算结果</li>
      <li>体积:{{ formatToFixed(resObj.cut) }}m³</li>
      <li>横切面积:{{ formatToFixed(resObj.area) }}㎡</li>
      <li>最大海拔:{{ formatToFixed(resObj.maxHeight) }}m</li>
      <li>最小海拔:{{ formatToFixed(resObj.minHeight) }}m</li>
    </ul>
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
    <Dom/>
    <Boundary/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import {formatToFixed} from "@/utils/dictionary"
import * as mars3d from "mars3d";
import {usemapStore} from "@/store/modules/cesiumMap";
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import Dom from "./component/dom.vue"
import Boundary from "./component/boundary.vue"

const mapStore = usemapStore()
const model = reactive({
  resObj: {
    cut: null,//体积
    area: null,//横切面积
    maxHeight: null,//最大高度
    minHeight: null,//最小高度
  },
  popupPos: {
    left: 400,
    top: 100
  }
})
const {resObj, popupPos} = toRefs(model)

onMounted(() => {
  add3dtileset()
  addDem()
})

onUnmounted(() => {
  const primitive = viewer.scene.primitives._primitives.find(primitive => primitive.name === 'terrainClipPlan')
  viewer.scene.primitives.remove(primitive)
})

const selecteHeight = () => {

}
// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let cctlLayer
const add3dtileset = () => {
  cctlLayer = new mars3d.layer.TilesetLayer({
    name: "terrainClipPlan",
    url: import.meta.env.VITE_APP_GISDATA + '/baoshan/3dtiles/tileset.json', //数据地址
    maximumScreenSpaceError: 25,
    maximumMemoryUsage: 1024,
    enableCollision: true,
    flyTo: true,
  })
  viewer.addLayer(cctlLayer)
  mapResetCamera()
}

const addDem = () => {
  const terrainProvider = new Cesium.CesiumTerrainProvider({
    url: import.meta.env.VITE_APP_GISDATA + "/baoshan/dem",
  });
  viewer.terrainProvider = terrainProvider;
}


const mapResetCamera = () => {

}
</script>

<style lang="scss" scoped>
.terrainClipPlan-wrap {
  display: flex;
  position: absolute;
  left: 300px;
  top: 100px;
  pointer-events: auto;

  ul {
    position: fixed;
    margin-left: 20px;
    padding: 10px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.6);

    li {
      margin-top: 2px;

      &:nth-child(1) {
        font-weight: bold;
        text-align: center;
      }
    }
  }
}
</style>
