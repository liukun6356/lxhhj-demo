/**
* @author: liuk
* @date: 2025-03-01
* @describe:地图点位选取路线
*/
<template>
  <div class="leafletMapSelect-wrap">
    <el-form-item label="坐标" prop="geom">
      <el-input v-model="formData.geom" disabled/>
    </el-form-item>
    <div ref="leafletMapRef" class="leafletMap"></div>
    <el-switch v-model="editFlag" @change="switchChange" inactive-text="新增" class="switch-area"/>
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
    geom: []
  },
  editFlag: true
})
const {editFlag, formData} = toRefs(model)

onMounted(() => {
  nextTick(() => {
    initLeaflet()
  })
})

const switchChange = (bool) => {
  if (bool) {
    markerDraw = new L.Draw.Marker(map, {icon: myIcon,})
    markerDraw.enable()
  } else {
    markerDraw.disable()
  }
}

// 地图逻辑
let map, drawLayerGrounp, drawControl, markerDraw, marker

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
  L.tileLayer('http://t0.tianditu.gov.cn/DataServer?T=vec_c&x={x}&y={y}&l={z}&tk=' + import.meta.env.VITE_APP_TDT_KEY, {
    tileSize: 256,
    zoomOffset: 1
  }).addTo(map);
  L.tileLayer('http://t0.tianditu.gov.cn/DataServer?T=cva_c&x={x}&y={y}&l={z}&tk=' + import.meta.env.VITE_APP_TDT_KEY, {
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
  L.drawLocal.draw.handlers.marker = {
    tooltip: {
      start: "点击地图开始选择点位",
    }
  };

  if (model.formData.geom?.length) {
    addPolygon(L.latLng([model.formData.geom[1], model.formData.geom[0]]))
  } else {
    markerDraw = new L.Draw.Marker(map, {icon: myIcon,})
    markerDraw.enable()
  }
  map.on(L.Draw.Event.CREATED, (e) => addPolygon(e.layer.getLatLng()));
}

const addPolygon = (latLng) => {
  marker?.remove()
  const popup = L.popup({
    minWidth: 30,
    autoPanPadding: [1, 1],
    className: 'leaflet-div-icon-popup',
    closeButton: false
  }).setContent(`${latLng.lat.toFixed(6)},${latLng.lng.toFixed(6)}`)
  marker = L.marker(latLng, {
    id: generateUUID(),
    icon: myIcon
  })
      .bindPopup(popup)
      .addTo(map)
  model.formData.geom = [+marker.getLatLng().lng.toFixed(6), +marker.getLatLng().lat.toFixed(6)]
  markerDraw = new L.Draw.Marker(map, {icon: myIcon,})
  markerDraw.enable()
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

  :deep(.el-form-item--default) {
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

.leaflet-div-icon-popup {
  margin-bottom: 52px;
  margin-left: 3px;

  .leaflet-popup-content-wrapper {
    border-radius: 5px;

    .leaflet-popup-content {
      margin: 5px;
      text-align: center;
    }
  }
}
</style>
