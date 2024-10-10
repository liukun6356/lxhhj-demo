<!--仿真模拟-->
<template>
  <div class="simulate-wrap">
    <div class="head_title_arrow">仿真模拟</div>
    <div class="topbar">
      <div class="item" :class="{ active: activeLabel === item }" v-for="item in labelItems" :key="item"
           @click="itemClick(item)">{{ item }}
      </div>
    </div>
    <template v-if="mapStore.isActivewaterPrimitiveCollection">
      <river-simulate v-if="activeLabel === '水位涨落'"/>
      <reservoir-simulate v-if="activeLabel === '水库蓄水'"/>
      <dam-simulate v-if="activeLabel === '闸坝启闭'"/>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {markRaw, nextTick, onMounted, onUnmounted, reactive, toRefs} from "vue";
// Components
import RiverSimulate from "./riverSimulate/index.vue"
import ReservoirSimulate from "./reservoirSimulate/index.vue"
import DamSimulate from "./damSimulate/index.vue"
import mittBus from "@/utils/mittBus";

const model = reactive({
  activeLabel: "水位涨落",
})
const {activeLabel} = toRefs(model)

onMounted(() => {
  waterCollection = new Cesium.PrimitiveCollection
  viewer.scene.primitives.add(waterCollection)
  mapStore.setWaterPrimitiveCollection(markRaw(waterCollection))
  addWaterPrimitive()
  mittBus.emit('toggleLayer', {key: '5', bool: true}) // 开启所有倾斜模型
})

onUnmounted(() => {
  mittBus.emit('toggleLayer', {key: '5', bool: false}) // 关闭所有倾斜模型
  nextTick(() => {
    mittBus.emit('toggleLayer', {key: '51', bool: true}) // 开启5cm倾斜模型
  })
  waterCollection.removeAll()
  viewer.scene.primitives.remove(waterCollection)
  mapStore.setIsActivewaterPrimitiveCollection(false)
})

const labelItems = ['水位涨落', '水库蓄水', '闸坝启闭']

const itemClick = (str) => model.activeLabel = str

// 地图逻辑
import segmentedDrainage from "@/assets/data/segmented_drainage.json"
import {usemapStore} from "@/store/modules/cesiumMap";
import waterNormalsJpg from "@/assets/images/cesiumMap/waterNormals.jpg"

let waterCollection

const mapStore = usemapStore()
const viewer = mapStore.getCesiumViewer()
const addWaterPrimitive = async () => {
  segmentedDrainage.features.forEach(feature => {
    const polygonInstance = new Cesium.GeometryInstance({
      id: feature.properties.OBJECTID,
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArrayHeights(feature.geometry.coordinates[0].map(([lon, lat]) => ([lon, lat, 0])).flat())
        ),
        extrudedHeight: 310,
      })
    });
    const primitive = new Cesium.Primitive({
      show: false,
      geometryInstances: polygonInstance,
      releaseGeometryInstances:false,
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
          fabric: {
            type: "Water",
            uniforms: {
              baseWaterColor: new Cesium.Color.fromCssColorString('#7B8773').withAlpha(0.9),
              normalMap: waterNormalsJpg,
              frequency: 9000.0,
              animationSpeed: 0.03,
              amplitude: 5,
              specularIntensity: 1,
              blendColor: new Cesium.Color.fromCssColorString('#7B8773').withAlpha(0.9)
            }
          }
        })
      }),
    });
    waterCollection.add(primitive)
  })
  mapStore.setIsActivewaterPrimitiveCollection(true)
}

</script>

<style lang="scss" scoped>
.simulate-wrap {
  position: absolute;
  top: 60px;
  right: 65px;
  font-size: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  font-family: PingFang SC Regular;
  color: white;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  overflow: auto;
  width: 300px;
  border-radius: 4px;

  .topbar {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0 15px;

    .item {
      background: rgba(46, 165, 255, 0.3);
      border: 1px solid #2ea5ff;
      padding: 3px 20px;
      cursor: pointer;
      font-size: 14px;

      &.active {
        background: #2ea5ff;
        border: 1px solid #2ea5ff;
      }
    }
  }

  :deep(.btn-area) {
    display: flex;
    justify-content: space-between;
    margin-left: 10px;

    button {
      width: calc(50% - 5px);
    }
  }
}
</style>