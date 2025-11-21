<!--/**
 * @author: liuk
 * @date: 2023/8/22
 * @describe: 管线站点
 * @email:1229223630@qq.com
*/-->
<template>
  <div>
    <div class="heat-station-info" v-if="showPopup" :style="{top:popupPos.top,left:popupPos.left}">
      <div class="name">滨河道换热站</div>
      <div class="station-group">
        <div class="state"></div>
        A3机组
      </div>
      <div class="bottom_div">
        <div>
          <div class="num">47.5&nbsp;<span>℃</span></div>
          <div style="margin-top: 6px;">一次供温</div>
        </div>
        <div>
          <div class="num">37.3&nbsp;<span>℃</span></div>
          <div style="margin-top: 6px;">一次回温</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import heatStation from "../data/heatStation.json"
import HeatStationImg from '@/assets/images/buildingProgression/heat-station.svg';
import {ElMessage} from "element-plus";

const mapStore = usemapStore()
const model = reactive({
  showPopup: false,
  popupPos: {
    left: '0',
    top: '0'
  },
})
const {showPopup, popupPos} = toRefs(model)

onMounted(() => {
  viewer.dataSources.add(heatDatasource);
  addEntity()
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(onClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
})

onUnmounted(() => {
  handler.destroy()
  viewer.dataSources.remove(heatDatasource);
})


// 地图逻辑
const viewer = mapStore.getCesiumViewer();
const heatDatasource = new Cesium.CustomDataSource("systeamEntityDataSource");
let handler, preSelEntity

const addEntity = () => {
  let features = heatStation.features || [];
  features.forEach(el => {
    let pos = el.geometry.coordinates;
    heatDatasource.entities.add({
      customType: "stationEntity",
      position: Cesium.Cartesian3.fromDegrees(pos[0], pos[1]),
      show: true,
      point: {
        pixelSize: 6,
        color: Cesium.Color.fromCssColorString("#d9734b"),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(30000, 80000)
      },
      label: {
        text: "站点",
        font: '12px PingFangSC-Regular, PingFang SC',
        verticalOrigin: Cesium.VerticalOrigin.BASELINE,
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        pixelOffset: new Cesium.Cartesian2(-15, 22),
        fillColor: Cesium.Color.fromCssColorString("#E9E9E9").withAlpha(1),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 30000)
      },
      billboard: {
        image: HeatStationImg,
        width: 30,
        height: 30,
        scale: '1',
        verticalOrigin: Cesium.VerticalOrigin.Top,
        pixelOffset: new Cesium.Cartesian2(0, -5),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 30000)
      }
    });
  });
}

const onMouseMove = (movement) => {
  const pickedObject = viewer.scene.pick(movement.endPosition);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) {
    resetSelectedEntity()
    return;
  }
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "stationEntity") {
    resetSelectedEntity();
    return;
  }
  if (entity !== preSelEntity) {
    resetSelectedEntity();
    entity.label.fillColor = Cesium.Color.fromCssColorString("#FF8C00").withAlpha(1);
  }
  preSelEntity = entity;
  showPopupBox(movement.endPosition);
}

const onClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) {
    resetSelectedEntity()
    return;
  }
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "stationEntity") {
    resetSelectedEntity();
    return;
  }
  ElMessage.success("点击站点")
}

const showPopupBox = (movement) => {
  model.showPopup = true
  model.popupPos.left = `${movement.x + 10}px`;
  model.popupPos.top = `${movement.y + 10}px`;
}

const resetSelectedEntity = () => {
  if (!preSelEntity) return
  model.showPopup = false
  preSelEntity.label.fillColor = Cesium.Color.fromCssColorString("#E9E9E9").withAlpha(1);
  preSelEntity = null;
}

</script>

<style lang="scss" scoped>
.heat-station-info {
  position: absolute;
  width: 194px;
  min-height: 124px;
  padding: 12px;
  color: #fff;
  box-shadow: -10px 0px 22px 0px rgba(0, 0, 0, 0.22);
  border-radius: 4px;
  border: 1px solid rgba(84, 84, 84, 1);
  background-color: rgba(0, 0, 0, 0.8);
  pointer-events: none;

  .state {
    width: 8px;
    height: 8px;
    background: #00CFA4;
    border-radius: 4px;
    float: left;
    position: relative;
    top: 3px;
    margin-right: 7px;
  }

  .station-group {
    font-family: PingFangSC-Regular;
    font-size: 12px;
    color: #FFFFFF;
    letter-spacing: 0;
    line-height: 16px;
    font-weight: 400;
    margin-top: 12px;
  }

  .name {
    font-family: PingFangSC-Medium;
    font-size: 16px;
    color: #FFFFFF;
    letter-spacing: 0;
    font-weight: 500;
    margin-top: 5px;
  }

  .bottom_div {
    display: flex;
    position: relative;
    justify-content: space-between;
    font-size: 12px;
    color: #A2A3A3;
    letter-spacing: 0;
    font-weight: 400;
    font-family: PingFangSC-Regular;
    margin-top: 16px;

    .num {
      font-size: 20px;
      color: #FFFFFF;
      letter-spacing: 0;
      line-height: 16px;
      font-weight: 400;

      span {
        font-size: 12px;
        color: #FFFFFF;
        letter-spacing: 0;
        font-weight: 200;
        color: #A2A3A3;
      }
    }

  }
}
</style>
