<template>
  <div class="triangularMesh-wrap">

    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, toRefs} from "vue"
import {usemapStore} from "@/store/modules/cesiumMap";
import {createFloodPrimitive} from './flood-primitives';
import proj4 from 'proj4'

// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"


const mapStore = usemapStore()
const model = reactive({
  isFlat: false,// 是否展开
  curId: '',//当前选中图例
})
const {isFlat, curId} = toRefs(model)

onMounted(() => {
  viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider() // 关闭地形
  addVerticesPromitive()
})

const addVerticesPromitive = async () => {
  const res = await fetch(import.meta.env.VITE_APP_MODELDATA + `/2dFluidModel.json`)
  const jsonData = await res.json()
  let { vertices, triangles} = jsonData
  vertices = new Float64Array(JSON.parse(vertices).map((item) => proj4('EPSG:4547', 'EPSG:4326', item)).flat());
  triangles = new Uint32Array(JSON.parse(triangles).flat())
  const projVertices = new Float64Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 3) {
    const lon = vertices[i];
    const lat = vertices[i + 1];
    const world = Cesium.Cartesian3.fromDegrees(lon, lat);
    projVertices[i] = world.x;
    projVertices[i + 1] = world.y;
    projVertices[i + 2] = world.z;
  }
  primitive = createFloodPrimitive({vertices: projVertices, triangles,})
  viewer.scene.primitives.add(primitive);
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(113.048730, 25.777123, 6005.74),
    orientation: {
      heading: Cesium.Math.toRadians(342),
      pitch: Cesium.Math.toRadians(-61.3),
      roll: Cesium.Math.toRadians(360)
    },
  });
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let primitive

</script>
