<!-- 遮罩层 -->
<template></template>

<script lang="ts" setup>
import boundaryDataOld from "@/assets/data/boundaryOld20240807.json";
import {onMounted, onUnmounted} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import LineFlowMaterialProperty from "@/utils/material/LineFlowMaterialProperty.ts"
import imgPng from '@/assets/images/cesiumMap/line.png'
import mittBus from "@/utils/mittBus";


// Props
const props = defineProps<{
  isDualMap?: boolean
}>()

const mapStore = usemapStore()
const viewer = props.isDualMap ? mapStore.getDualCesoumViewer() : mapStore.getCesiumViewer();

onMounted(() => {
  viewer.dataSources.add(mapBoundaryDatasource);
  toggleMapBoundaryMittBusFn({type: 'hydrology'})
  mittBus.on('toggleMapBoundary', toggleMapBoundaryMittBusFn)
})

onUnmounted(() => {
  mittBus.off('toggleMapBoundary', toggleMapBoundaryMittBusFn)
  mapBoundaryDatasource.entities.removeAll()
  viewer.dataSources.remove(mapBoundaryDatasource);
})

const toggleMapBoundaryMittBusFn = ({type}) => { // old 原有轮廓 hydrology 水文局提供轮廓
  mapBoundaryDatasource?.entities.removeAll()
  const boundaryData = type === 'old' ? boundaryDataOld : boundaryDataOld
  addBoundary(boundaryData)
  const boundingSphere = new Cesium.BoundingSphere.fromPoints(Cesium.Cartesian3.fromDegreesArrayHeights(boundaryData.geometry.coordinates[0].map(el1 => el1.join(',')).join(',').split(',').map(Number)),);
  // if (mapStore.isDualScreen) {
  //   mittBus.emit('mapResetCamera', {
  //     destination2d: markRaw(new Cesium.Cartesian3.fromDegrees(113.053600, 25.787646, 14609)),
  //     destination3d: markRaw(new Cesium.Cartesian3.fromDegrees(113.054047, 25.693366, 10362)),
  //   })
  // } else {
  // viewer.camera.flyToBoundingSphere(boundingSphere)
  // }
}

// 地图逻辑
const mapBoundaryDatasource = new Cesium.GeoJsonDataSource()
const addBoundary = async (boundaryData) => {
  const extent = {xmin: 73.0, xmax: 136.0, ymin: 3.0, ymax: 59.0};
  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [extent.xmin, extent.ymax],
            [extent.xmin, extent.ymin],
            [extent.xmax, extent.ymin],
            [extent.xmax, extent.ymax],
            [extent.xmin, extent.ymax],
          ],
          boundaryData.geometry.coordinates[0][0],
        ],
      ],
    },
  };
  await mapBoundaryDatasource.load(geojson, {
    fill: Cesium.Color.fromCssColorString('rgb(0,0,0)').withAlpha(0.4),
    clampToGround: true
  });
  addLine(boundaryData)
}

const addLine = (boundaryData) => {
  mapBoundaryDatasource.entities.add({
    name: '6 地面椎状流动线',
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(boundaryData.geometry.coordinates[0].map(el1 => el1.join(',')).join(',').split(',').map(Number)),
      width: 8,
      clampToGround: true,
      material: new LineFlowMaterialProperty({
        color: Cesium.Color.fromCssColorString('#16C6FF'),
        repeat: new Cesium.Cartesian2(3.0, 2.0),
        image: imgPng,
        speed: 2, //速度，建议取值范围1-100
      }),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2000000),//按视距距离显示
    },
  });
}
</script>