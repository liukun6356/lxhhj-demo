<template>
  <div class="triangularMesh-wrap">
    <yb-panl class="triangularMesh-panl" v-if="selTimeRang" :selTimeRang="selTimeRang"
             :defaultStartTime="selTimeRang.start" :defaultRange="times.length"
             timeType="m" @timeChange="timeChange"/>
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue"
import {usemapStore} from "@/store/modules/cesiumMap";
import {createFloodPrimitive} from './flood-primitives';
import proj4 from 'proj4'
import axios from "axios";
import {formatToFixed} from "@/utils/dictionary"
// Component
import YbPanl from "@/components/ybPanl/index.vue"
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
const model = reactive({
  isFlat: false,// 是否展开
  curId: '',//当前选中图例
  selTimeRang: null,
  times: [],//所有数据时间点
  curTime: 0
})
const {isFlat, curId, selTimeRang, times} = toRefs(model)

onMounted(() => {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider() // 关闭地形
  addVerticesPromitive()
  getlist()
})

onUnmounted(() => {
  handler.destroy()
  viewer.scene.primitives.remove(primitive);
})

const timeChange = (timestamp) => {
  const index = model.times.findIndex(t => t === (timestamp))
  if (index < 0) return
  if (!primitive) return
  if (preEntity) viewer.entities.remove(preEntity)
  primitive.setCurTime(timestamp);
  model.curTime = timestamp
}

const getlist = async () => {
  const {data} = await axios.get(import.meta.env.VITE_APP_MODELDATA + `/2dFluidModel/getTime.json`)
  model.times = data.map(Number)
  const start = model.times[0]
  const end = model.times[model.times.length - 1]
  model.selTimeRang = {start, end}
  model.curTime = start
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let primitive, preEntity, handler, vertices, triangles, timeData = {}

const addVerticesPromitive = async () => {
  const res = await fetch(import.meta.env.VITE_APP_MODELDATA + `/2dFluidModel/2dFluidModel.json`)
  const jsonData = await res.json()
  vertices = new Float64Array(JSON.parse(jsonData.vertices).map((item) => proj4('EPSG:4547', 'EPSG:4326', item)).flat());
  triangles = new Uint32Array(JSON.parse(jsonData.triangles).flat())
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
  primitive.changeSource({
    times: model.times.map(Number),
    dataGetter: async (time) => {
      const {data} = await axios.get(import.meta.env.VITE_APP_MODELDATA + `/2dFluidModel/timeData/${time}.json`)
      timeData[time] = new Float32Array(data)
      return new Float32Array(data);
    }
  })
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(113.048730, 25.777123, 6005.74),
    orientation: {
      heading: Cesium.Math.toRadians(342),
      pitch: Cesium.Math.toRadians(-61.3),
      roll: Cesium.Math.toRadians(360)
    },
  });
}

const onMouseClick = (movement) => {
  if (preEntity) viewer.entities.remove(preEntity)
  const cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
  if (!cartesian) return
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const longitude = Cesium.Math.toDegrees(cartographic.longitude);
  const latitude = Cesium.Math.toDegrees(cartographic.latitude);
  let min1 = 1, min2 = 1, min1i, min2i, preTriangleIds
  for (let i = 0; i < vertices.length; i += 3) {
    const val = Math.abs(vertices[i] - longitude) + Math.abs(vertices[i + 1] - latitude)
    if (val < 0.000032) {
      min1 = val
      min1i = i
    } else if (min2 > val) {
      min2 = val
      min2i = i
    }
  }
  for (let i = 0; i < triangles.length; i += 3) {
    const triangleIds = [triangles[i], triangles[i + 1], triangles[i + 2]]
    if (triangleIds.includes(Math.round(min1i / 3)) && triangleIds.includes(Math.round(min2i / 3))) {
      if (preTriangleIds) {
        const pre = preTriangleIds.find(item => item !== min1i && item !== min2i)
        const cur = triangleIds.find(item => item !== min1i && item !== min2i)
        const preL = Math.abs(vertices[pre] - longitude) + Math.abs(vertices[pre + 1] - latitude)
        const curL = Math.abs(vertices[cur] - longitude) + Math.abs(vertices[cur + 1] - latitude)
        preTriangleIds = preL < curL ? preTriangleIds : triangleIds
        break
      }
      preTriangleIds = triangleIds
    }
  }
  const cartesianPositions = preTriangleIds.map(i => Cesium.Cartesian3.fromDegrees(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]));
  preEntity = viewer.entities.add({
    position: computeCentroid(cartesianPositions),
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(cartesianPositions),
      material: Cesium.Color.TRANSPARENT, // 填充透明
      height: 0,
      outline: true,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 2
    },
    label: {
      text: formatToFixed(preTriangleIds.reduce((sum, i) => sum + (timeData[model.curTime]?.[i] || 0), 0) / 3),
      font: '14px PingFangSC-Regular, PingFang SC',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, 0),
      fillColor: Cesium.Color.fromCssColorString("#fff").withAlpha(1),
      outlineColor: new Cesium.Color.fromCssColorString('black'),
      outlineWidth: 1,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    }
  })
}

const computeCentroid = (positions) => {
  let x = 0, y = 0, z = 0;
  positions.forEach(p => {
    x += p.x;
    y += p.y;
    z += p.z;
  });
  const count = positions.length;
  return new Cesium.Cartesian3(x / count, y / count, z / count);
}
</script>

<style lang="scss">
.triangularMesh-panl {
  width: 835px !important;
  height: 75px !important;

  .left-area {
    display: none !important;
  }
}
</style>
