/**
* @author: liuk
* @date: 2025-03-01
* @describe:地图点位选取区域
*/
<template>
  <div class="leafletMapSelect-wrap">
    <el-form-item label="坐标" prop="geom">
      <el-tag v-for="(item,index) in formData.posData" :key="index" style="margin:0 5px 5px 0">
        <span class="index">{{ index + 1 }}</span>
        <span>{{ item + "" }}</span>
      </el-tag>
    </el-form-item>
    <div ref="leafletMapRef" class="leafletMap"></div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs, onMounted, onUnmounted, ref, computed, nextTick} from "vue";
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import 'leaflet-fullscreen'
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css'
import {generateUUID} from "@/utils/dictionary";

// ref
const leafletMapRef = ref(null)

const model = reactive({
  formData: {
    posData: []
  },
})
const {editFlag, formData} = toRefs(model)

onMounted(() => {
  nextTick(() => {
    initLeaflet()
  })
})

// 地图逻辑
let map, drawLayerGrounp, drawControl, markerDraw, polygon

const myIcon = L.divIcon({
  className: 'leaflet-div-icon',
  iconSize: [24, 32],
  iconAnchor: [10, 32]
});

const initLeaflet = () => {
  map = L.map(leafletMapRef.value,
      {
        crs: L.CRS.EPSG4326,
        attributionControl: false,
        fullscreenControl: {
          pseudoFullscreen: false
        }
      }
  )
  L.tileLayer('http://t0.tianditu.gov.cn/DataServer?T=vec_c&x={x}&y={y}&l={z}&tk=902014349629fe7d6d4b5273211a2fd6', {
    tileSize: 256,
    zoomOffset: 1
  }).addTo(map);
  L.tileLayer('http://t0.tianditu.gov.cn/DataServer?T=cva_c&x={x}&y={y}&l={z}&tk=93724b915d1898d946ca7dc7b765dda5', {
    tileSize: 256,
    zoomOffset: 1
  }).addTo(map);
  drawLayerGrounp = new L.FeatureGroup([]);
  map.addLayer(drawLayerGrounp);
  map.setView([30.0609391, 112.2240645], 10)
  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: true,
    edit: {
      featureGroup: drawLayerGrounp,
      edit: false,
      remove: false,
      allowIntersection: true
    }
  });
  L.drawLocal.draw.handlers.polygon = {
    tooltip: {
      start: "点击地图开始绘制多边形",
      cont: "继续选择",
      end: "点击第一个顶点完成绘制"
    }
  };
  new L.Draw.Polygon(map, drawControl.options.draw.polygon).enable()
  map.on(L.Draw.Event.CREATED, (e) => {
    let drawLayer = e.layer;
    if (polygon) {
      polygon.remove()
      polygon = null
    }
    const posArr = drawLayer.getLatLngs()[0]
    addPolygon(posArr)
    model.formData.posData = posArr.map(item => [item.lng.toFixed(6), item.lat.toFixed(6)])
    new L.Draw.Polygon(map, drawControl.options.draw.polygon).enable()
  });
  map.on('draw:deleted', function () {
    new L.Draw.Polygon(map, drawControl.options.draw.polygon).enable()
  });
}

const addPolygon = (latlngs) => {
  polygon = L.polygon(latlngs, {
    color: "#3388ff",
    fill: true, fillColor: null,
    fillOpacity: 0.2,
    opacity: 0.5,
    stroke: true,
    weight: 4
  }).addTo(map);
  map.fitBounds(polygon.getBounds());
}
</script>

<style lang="scss" scoped>
.leafletMapSelect-wrap {
  width: 100%;
  height: 100%;
  position: relative;

  .leafletMap {
    width: 100%;
    height: calc(100% - 32px);

    &.isFullScreen {
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
    }
  }

  .switch-area {
    position: absolute;
    right: 0;
    top: 50px;
    z-index: 999;
  }

  .index {
    color: blue;
    margin-right: 5px;
  }
  :deep(.el-form-item--default){
    margin-bottom: 0;
  }
}
</style>

<style lang="scss">
.leaflet-marker-icon {
  cursor: pointer;
  font-size: 14px;
  line-height: 24px;
  text-align: center;
  color: #000;
  border: 0;
  background: url("@/assets/images/icons/marker-icon.png") no-repeat center/contain;
}
</style>
