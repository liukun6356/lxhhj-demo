<template>
  <div class="geojsonShow-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import * as Cesium from "cesium";
import GUI from "lil-gui";
import * as turf from '@turf/turf'
import {onMounted, onUnmounted} from "vue";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import geojson from "./mapData.json"
import {cartesianToWgs84} from "@/utils/dictionary";
import imgPng from '@/assets/images/cesiumMap/line.png'
import LineFlowMaterialProperty from "@/utils/material/LineFlowMaterialProperty.ts"

// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(async () => {
  initGui()
  mapResetCamera()
})

onUnmounted(() => {
  gui.destroy()
  viewer.dataSources.remove(irrigatedAreaDatasource);
})

const addirrigatedAreaData = async () => {
  if (irrigatedAreaDatasource) {
    irrigatedAreaDatasource.show = true
    return
  } else {
    irrigatedAreaDatasource = await Cesium.GeoJsonDataSource.load({
      type: "FeatureCollection",
      features: geojson['irrigatedArea'],
    },{

    });
    viewer.dataSources.add(irrigatedAreaDatasource);
    irrigatedAreaDatasource.entities.values.forEach((entity) => {
      entity.name = entity.properties.IRR_NAME.getValue()
      const temp = entity.polygon.hierarchy.getValue().positions.map(item => cartesianToWgs84(item, 2))
      const center = turf.centerOfMass(turf.polygon([temp]));
      const [longitude, latitude] = center.geometry.coordinates
      entity.position = Cesium.Cartesian3.fromDegrees(longitude, latitude)
      const positions = entity.polygon.hierarchy.getValue().positions
      const cartographicPositions = positions.map(position => Cesium.Cartographic.fromCartesian(position))
      let minimumHeights = cartographicPositions.map(item => item.height)
      let maximumHeights = cartographicPositions.map(item => item.height + 50)
      entity.label = new Cesium.LabelGraphics({
        text: entity.name,
        font: "14px",
        pixelOffset: new Cesium.Cartesian2(0, 15),
        outlineColor: new Cesium.Color.fromCssColorString('black'),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        fillColor: Cesium.Color.fromCssColorString("#fff").withAlpha(1),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      });
      // entity.polyline = new Cesium.PolylineGraphics({
      //   positions: positions.map(position => {
      //     const cartographic = Cesium.Cartographic.fromCartesian(position);
      //     return Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 45);
      //   }),
      //   width: 8,
      //   material: new LineFlowMaterialProperty({
      //     color: Cesium.Color.fromCssColorString(getColor(entity.name)),
      //     repeat: new Cesium.Cartesian2(3.0, 2.0),
      //     image: imgPng,
      //     speed: 2,
      //   }),
      //   distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2000000),
      // })
      // entity.wall = new Cesium.WallGraphics({
      //   positions: entity.polyline.positions,
      //   outlineWidth: 2,
      //   minimumHeights,
      //   maximumHeights,
      //   heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      //   material: Cesium.Color.fromCssColorString("#D9D9D9")
      // })
      // entity.polyline.material = Cesium.Color.fromCssColorString('rgb(0,0,0)').withAlpha(0)
      entity.polygon.material = Cesium.Color.fromCssColorString('rgb(0,0,0)').withAlpha(0)
    });
  }
}

const getColor = (name) => {
  switch (name) {
    case "南五洲垸灌区":
      return '#B9FF8A'
    case "孟溪大垸灌区":
      return '#8C7EFF'
    case "荆江灌区":
      return '#5FEFFF'
    case "合顺垸灌区":
      return '#EDF76C'
    case "东港垸灌区":
      return '#6CF7B8'
    case "中和垸灌区":
      return '#F990FF'
    case "三善垸灌区":
      return '#0d4f53'
    case "永和垸灌区":
      return '#2653a6'
    case "曹咀垸灌区":
      return '#316981'
    default:
      return "#fff"
  }
}

const adddamStationData = () => {

}

const reset = () => {

}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let irrigatedAreaDatasource, damStationDatasource
// const irrigatedAreaDatasource = new Cesium.GeoJsonDataSource("irrigatedArea")
// const damStationDatasource = new Cesium.GeoJsonDataSource("damStation")

const mapResetCamera = () => {
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(112.304747, 30.010384, 168000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0)
    }
  });
}

// lil-gui逻辑
let gui
const formData = {
  irrigatedAreaShow: false,
  damStationShow: false,
  reset
}

const initGui = () => {
  gui = new GUI({title: "geojsonShow"});
  gui.add(formData, "irrigatedAreaShow").name("面").onChange(bool => {
    if (bool) addirrigatedAreaData()
    else irrigatedAreaDatasource.show = false
  })
  gui.add(formData, "damStationShow").name("点")
  gui.add(formData, "reset")
}

</script>

<style lang="scss" scoped>
.geojsonShow-wrap {

}
</style>