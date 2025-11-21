<!--测站-河道站点位-->
<template>
  <teleport to="body">
    <ul v-show="showPopup" :class="['surveyStation-popup','map'+mapStore.mapType]" ref="popupRef"
        :style="{ transform: `translate(${popupPos.x }px, ${popupPos.y}px)`}">
      <li>名称：{{ info.name }}</li>
      <li>类型：河道站</li>
      <li>时间：{{ formatData(info.monitoringTime, 'MM-DD HH:mm') }}</li>
      <li>水位：{{ info.riverwayWaterLevel ? info.riverwayWaterLevel : '--' }} m</li>
    </ul>
  </teleport>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import {markRaw, onMounted, onUnmounted, reactive, ref, toRefs, watch} from "vue";
import iconTypes from "@/views/cesium/cesiumMap/iconTypes";
import {cartesianToWgs84, formatData} from "@/utils/dictionary"

// Component
import mittBus from "@/utils/mittBus";
// Refs
const popupRef = ref(null)
const mapStore = usemapStore()
const model = reactive({
  listData: [],
  info: {},
  showPopup: false,
  popupPos: {
    x: 0,
    y: 0
  },
  dialogVisible: false,
  curId: "",
})
const {info, showPopup, popupPos, dialogVisible, listData, curId} = toRefs(model)

onMounted(() => {
  getlist()
  riverStationDatasource = new Cesium.CustomDataSource("riverStation");
  viewer.dataSources.add(riverStationDatasource);
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  viewer.scene.postRender.addEventListener(showPopupBox);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  // mittBus.on("skipRiverStationDialog", mittBusFn)
})

onUnmounted(() => {
  handler.destroy()
  // mittBus.off("skipRiverStationDialog", mittBusFn)
  riverStationDatasource?.entities?.removeAll()
  viewer.dataSources.remove(riverStationDatasource);
})

watch(() => mapStore.mapType, (type) => {
  riverStationDatasource.entities._entities._array.forEach(async (entity) => {
    entity.position = Cesium.Cartesian3.fromDegrees(entity.data.longitude, entity.data.latitude, mapStore.mapType === '2d' ? 0 : entity.data.heightZ)
    entity.billboard.scale = mapStore.mapType === '2d' ? 0.6 : 0.4
    entity.billboard.image = iconTypes["river"][mapStore.mapType][1]
  })
})

const mittBusFn = (row) => {
  const {id} = row
  const curEntity = riverStationDatasource.entities.values.find(entity => entity.id === id)
  if (!curEntity || row.flyToDisabled) {
    model.dialogVisible = true
    model.curId = id
  } else {
    const cartographic = Cesium.Cartographic.fromCartesian(curEntity.position.getValue());
    const topPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height + 3 * 1e4)
    // viewer.dataSources.raiseToTop (riverStationDatasource);
    viewer.camera.flyTo({
      destination: topPosition,
      duration: 1,
      complete: () => {
        model.dialogVisible = true
        model.curId = id
      }
    });
  }
}

const getlist = async () => {
  setTimeout(() => {
    model.listData = mapStore.allPointPosList["riverStationEntity"]
    addEntity(model.listData || [])
  }, 500)

}

const showPopupBox = async () => {
  if (!PreSelEntity) {
    model.showPopup = false
    return
  }
  const width = parseInt(getComputedStyle(popupRef.value).width)
  const height = parseInt(getComputedStyle(popupRef.value).height)
  const [longitude, latitude] = cartesianToWgs84(PreSelEntity.position.getValue())
  const curPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, mapStore.mapType === '2d' ? 0 : PreSelEntity.data.heightZ);
  const {x, y} = viewer.scene.cartesianToCanvasCoordinates(curPosition)
  model.showPopup = true
  model.popupPos.x = x - (width / 2);
  model.popupPos.y = y - height
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let riverStationDatasource, PreSelEntity, handler
const addEntity = (data) => {
  data.forEach(async (item) => {
    riverStationDatasource.entities.add({
      customType: "riverStationEntity",
      position: Cesium.Cartesian3.fromDegrees(+item.longitude, +item.latitude, mapStore.mapType === "2d" ? 0 : item.heightZ),
      id: item.id,
      data: item,
      label: {
        text: item.name,
        font: '14px PingFangSC-Regular, PingFang SC',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, 15),
        outlineColor: new Cesium.Color.fromCssColorString('black'),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        fillColor: Cesium.Color.fromCssColorString("#fff").withAlpha(1),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 80000)
      },
      billboard: {
        image: iconTypes["river"][mapStore.mapType][1],
        scale: mapStore.mapType === '2d' ? 0.6 : 0.4,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
        disableDepthTestDistance: Number.POSITIVE_INFINITY, //解决遮挡问题
        // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 85000),
      }
    });
  });

}
const onMouseMove = (movement) => {
  PreSelEntity = null
  const pickedObject = viewer.scene.pick(movement.endPosition);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "riverStationEntity") return
  // mittBus.emit('showPointStaionList', {pos: null})
  const pickeds = viewer.scene.drillPick(movement.endPosition, 15, 1, 1).filter(picked => picked.id?.customType);
  let listData = pickeds.map(pickeds => pickeds.id.data)
  listData = listData.reduce((acc, curr) => {
    if (!acc.some(item => item.id === curr.id)) acc.push(curr);
    return acc;
  }, []);
  if (listData.length > 1) {
    // mittBus.emit('showPointStaionList', {data: listData, pos: markRaw(entity)})
  }
  if (entity !== PreSelEntity) {
    PreSelEntity = entity;
    model.info = entity.data || {}
  }
}

const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "riverStationEntity") return
  model.dialogVisible = true
  model.curId = entity.id
}
</script>
