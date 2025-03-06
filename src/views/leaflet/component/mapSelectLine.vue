/**
* @author: liuk
* @date: 2025-03-01
* @describe:地图点位选取路线
*/
<template>
  <div class="leafletMapSelectLine-wrap">
    <el-form-item label="巡检路点位" label-width="100" prop="pointList">
      <el-tag v-for="(item,index) in lineArr" :key="item.id" closable @close="closeFn(item)"
              :draggable="true" @dragenter="dragenter(index)"
              @dragend="dragend(item,index)" style="margin-right: 10px">
        <span class="index">{{ index + 1 }}</span>
        <span>{{ item.name }}</span>
      </el-tag>
    </el-form-item>
    <div ref="leafletMapRef" class="leafletMap"></div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs, onMounted, ref, defineEmits, computed, watch, defineProps, defineExpose, nextTick} from "vue";
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import 'leaflet-fullscreen'
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css'

// Props
const props = defineProps(['modelValue', 'irrigatedAreaId', 'type'])

// Emit
const emit = defineEmits(['update:modelValue'])

// ref
const leafletMapRef = ref(null)


const model = reactive({
  posData: [
    {id: "efdcb5294c7e46059d0367e8f81c18d9", name: "站点1", longitude: 112.276154, latitude: 30.09151},
    {id: "957ecf37afbe45ae87d236e0b221c71e", name: "站点2", longitude: 112.307053, latitude: 30.116229},
    {id: "25c7176818bf442e8a7f1aa31d944ebb", name: "站点3", longitude: 112.183456, latitude: 30.07503},
    {id: "11b18ecc9d3048a9bab0973de277405d", name: "站点4", longitude: 112.127838, latitude: 30.107989}
  ],
  moveIndex: 0,
  lineArr: []
})
const {lineArr} = toRefs(model)

onMounted(() => {
  nextTick(() => {
    initLeaflet()
  })
})

watch(() => [props.type, props.irrigatedAreaId], () => {
  getlist()
})

const dragenter = (index) => {
  model.moveIndex = index
}

const dragend = (val, index) => {
  lineArr.value.splice(index, 1)
  lineArr.value.splice(model.moveIndex, 0, val)
  lineArr.value.forEach((item, index) => item.index = index + 1)
  nextTick(() => {
    updateMarkers()
  })
}

const getlist = async () => {
  layerGroup?.remove()
  addEntity()
  if (lineArr.value) updateMarkers()
}

const closeFn = (row) => {
  lineArr.value = lineArr.value.filter(item => item.id !== row.id).map(item => ({
    ...item, index: row.index < item.index ? item.index - 1 : item.index
  }))
  nextTick(() => {
    updateMarkers()
  })
}

// 地图逻辑
let map, layerGroup, polyline
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

  map.setView([30.0609391, 112.2240645], 10)
  getlist()
}

const addEntity = () => {
  const markers = model.posData.map(item => {
    const className = 'leaflet-div-icon' + item.id
    const myIcon = L.divIcon({
      className,
      iconSize: [24, 32],
      iconAnchor: [10, 32]
    });
    const popup = L.popup({
      minWidth: 30,
      autoPanPadding: [1, 1],
      className: 'leaflet-div-icon-popup',
      closeButton: false
    }).setContent(item.name)
    return L.marker([+item.latitude, +item.longitude], {
      id: item.id,
      name: item.name,
      longitude: item.longitude,
      latitude: item.latitude,
      icon: myIcon,
      divIconClassName: className
    })
        .bindPopup(popup)
        .on('click', (e) => {
          const {id, name, longitude, latitude} = e.target.options
          if (lineArr.value.find(item => item.id === id)) return
          e.target.options.index = lineArr.value.length + 1
          lineArr.value.push({id, name, longitude, latitude, index: lineArr.value.length + 1})
          updateMarkers()
        });
  })
  layerGroup = L.layerGroup(markers).addTo(map)
}

const updateMarkers = () => {
  const layers = layerGroup.getLayers()
  layers.forEach(layer => {
    const {divIconClassName, id} = layer.options
    const index = lineArr.value.find(item => id === item.id)?.index
    if (!index) layer.options.index = ''
    const doms = [...document.getElementsByClassName(divIconClassName)]
    doms.forEach(dom => dom.innerHTML = index || '')
  })
  polyline?.remove()
  if (lineArr.value.length < 2) return
  polyline = L.polyline(lineArr.value.map(item => [item.latitude, item.longitude]), {color: '#409eff'}).addTo(map);
}

</script>

<style lang="scss" scoped>
.leafletMapSelectLine-wrap {
  width: 100%;
  height: 100%;
  position: relative;

  .leafletMap {
    width: 100%;
    height: calc(100% - 50px);

    &.isFullScreen {
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
    }
  }

  .index {
    color: blue;
    margin-right: 5px;
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
