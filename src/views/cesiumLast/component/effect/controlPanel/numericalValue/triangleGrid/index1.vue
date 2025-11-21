<!--/**
* @author: liuk
* @date: 2024-08-22
* @describe:数值 - 显示三角网格
*/-->
<template></template>

<script lang="ts" setup>
import {onMounted, onUnmounted, watch} from "vue";
import {getModel2BasicsInfo, getModel2DataInfo, getModel2Time} from "@/api/cesiumMap";
import {useprolusionStore} from "@/store/modules/prolusion";
import proj4 from 'proj4'
import {createFloodPrimitive} from './flood-primitives';
import {usemapStore} from "@/store/modules/cesiumMap";

const prolusionStore = useprolusionStore()

onMounted(() => {
  addVerticesPromitive()
})

onUnmounted(() => {
  viewer.scene.primitives.remove(primitive)
})

watch(() => prolusionStore.curTime, (time) => {
  if (!prolusionStore.planId) return
  if (!primitive) return
  primitive.setCurTime(time);
})


const addDataSource = async () => {
  const params1 = {
    planId: prolusionStore.planId
  }
  const {data: times} = await getModel2Time(params1)
  const dataGetter = (time) => get2dDataAtTime(prolusionStore.planId, time)
  const get2dDataAtTime = async (id, time) => {
    const params2 = {
      planId: id,
      time
    }
    const res = await getModel2DataInfo(params2)
    const temp = await res.text()
    const data = JSON.parse(temp)
    const waterDepth = JSON.parse(data.waterDepth);
    return new Float32Array(waterDepth);
  }
  primitive.changeSource({times: times.map(Number), dataGetter});
}

let primitive
const mapStore = usemapStore()
const viewer = mapStore.getCesiumViewer();
const addVerticesPromitive = async () => {
  const res = await getModel2BasicsInfo()
  const temp = await res.text()
  const data = JSON.parse(temp)
  let {label, vertices, triangles} = data
  label = new Int8Array(JSON.parse(label));
  vertices = new Float64Array(JSON.parse(vertices).map((item) => proj4('EPSG:4547', 'EPSG:4326', item)).flat());
  triangles = new Uint32Array(JSON.parse(triangles).flat())
  // let xmin = Infinity,
  //     xmax = -Infinity,
  //     ymin = Infinity,
  //     ymax = -Infinity;
  // for (let i = vertices.length; (i -= 3);) {
  //   const x = vertices[i], y = vertices[i + 1];
  //   xmin = Math.min(xmin, x);
  //   xmax = Math.max(xmax, x);
  //   ymin = Math.min(ymin, y);
  //   ymax = Math.max(ymax, y);
  // }
  const projVertices = new Float64Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 3) {
    const lon = vertices[i];
    const lat = vertices[i + 1];
    const world = Cesium.Cartesian3.fromDegrees(lon, lat);
    projVertices[i] = world.x;
    projVertices[i + 1] = world.y;
    projVertices[i + 2] = world.z;
  }

  primitive = createFloodPrimitive({
    vertices: projVertices,
    triangles,
  })
  viewer && viewer.scene.primitives.add(primitive);
  addDataSource()
}


</script>

<style lang="scss" scoped>


</style>