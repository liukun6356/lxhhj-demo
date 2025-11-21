<!--台风-->
<template>
  <teleport to="body">
    <div class="typhoon-wrap" v-show="showPopup" :style="{ transform: `translate(${popupPos.x }px, ${popupPos.y}px)`}">
      <div class="device-title">苏拉台风</div>
      <div class="device-name">
        <span>等级：</span>
        <span class="value">12</span>
        <span class="unit">级</span>
      </div>
      <div class="device-num" style="top:85px">
        <span>气压：</span>
        <span class="value">892</span>
        <span class="unit">hPa</span>
      </div>
      <div class="device-name" style="top:110px">
        <span>速度：</span>
        <span class="value">36.9</span>
        <span class="unit">米/秒</span>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs, ref} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap";
import LineFlowMaterialProperty from "@/utils/material/LineFlowMaterialProperty.ts"
import arrowPng from "@/assets/images/cesiumMap/controlPanel/ArrowOpacity.png"
import mittBus from "@/utils/mittBus"

const mapStore = usemapStore()
const model = reactive({
  popupPos: {
    x: 0,
    y: 0
  },
  showPopup:true
})
const {popupPos,showPopup} = toRefs(model)

onMounted(() => {
   mittBus.emit("mapResetCamera")
  viewer.dataSources.add(typhoonDatasource);
  addEntity()
  viewer.scene.postRender.addEventListener(showPopupBox);
})

onUnmounted(() => {
  typhoonDatasource.entities.removeAll()
  viewer.dataSources.remove(typhoonDatasource);
  viewer.scene.postRender.removeEventListener(showPopupBox);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
const typhoonDatasource = new Cesium.CustomDataSource("typhoon")

let curPosition

const addEntity = () => {
  typhoonDatasource.entities.add({
    position: Cesium.Cartesian3.fromDegrees(113.129544, 25.630585),
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([113.129544, 25.630585, 112.91728, 25.816368]),
      width: 10,
      material: new LineFlowMaterialProperty({//动画线材质
        color: Cesium.Color.fromCssColorString("red"),
        repeat: new Cesium.Cartesian2(10.0, 1.0),
        image: arrowPng,
        speed: 20, //速度，建议取值范围1-100
      }),
      clampToGround: true,
    },
    point: {
      color: Cesium.Color.fromCssColorString("#2ea5ff").withAlpha(0),
      pixelSize: 10,
      clampToGround: true,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
  startRun()
}

const startRun = () => {
  const startTime = Cesium.JulianDate.now()
  // 初始点位和目标点位
  const startPosition = Cesium.Cartesian3.fromDegrees(113.129544, 25.630585);
  const targetPosition = Cesium.Cartesian3.fromDegrees(112.91728, 25.816368);
  curPosition = new Cesium.Cartesian3()
  typhoonDatasource.entities.values[0].position = new Cesium.CallbackProperty(function (time) {
    const elapsedTime = Cesium.JulianDate.secondsDifference(time, startTime);
    const ratio = elapsedTime / 10;
    switch (true){
      case ratio >= 1.0:
        curPosition = targetPosition.clone()
            break
      case ratio <=0:
        curPosition = startPosition.clone()
        break
      default:
        Cesium.Cartesian3.lerp(startPosition, targetPosition, ratio, curPosition);
    }
    return curPosition
  }, false);
}

const showPopupBox = () => {
  const {x, y} = viewer.scene.cartesianToCanvasCoordinates(curPosition)
  model.popupPos.x = x + 50
  model.popupPos.y = y - 50
}
</script>

<style lang="scss" scoped>
.typhoon-wrap {
  position: fixed;
  left: 0;
  top: 0;
  padding: 5px;
  border: 1px solid;
  background-color: #fff;
  color: #000;
  &::after {
    content: "";
    position: absolute;
    top: 0px;
    left: -100px;
    width: 100px;
    height: 100px;
    background: url("@/assets/images/cesiumMap/controlPanel/tf.gif") no-repeat center/cover;
  }

  .device-name {
    .value {
      font-size: 15px;
      font-weight: bolder;
      color: #FFE103;
    }

    .unit {
      font-size: 14px;
      font-weight: 100;
      margin-left: 5px;
    }
  }
}
</style>
