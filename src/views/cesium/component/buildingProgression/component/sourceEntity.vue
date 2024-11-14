<!--/**
 * @author: liuk
 * @date: 2023/8/22
 * @describe: 热源
 * @email:1229223630@qq.com
*/-->
<template>
  <div class="heat-source-info" v-if="showPopup" :style="{top:popupPos.top,left:popupPos.left}">
    <div class="name">西青一区热源</div>
    <div class="bottom_div">
      <div>
        <div class="num">20.3&nbsp;<span>%</span></div>
        <div style="margin-top: 6px;">负荷率</div>
        <div class="num" style="margin-top:16px ;">69.2&nbsp;<span>℃</span></div>
        <div style="margin-top: 6px;">供水温度</div>
      </div>
      <div>
        <div class="num">5678&nbsp;<span>MW</span></div>
        <div style="margin-top: 6px;">当前功率</div>
        <div class="num" style="margin-top:16px ;">52.2&nbsp;<span>℃</span></div>
        <div style="margin-top: 6px;">回水温度</div>
      </div>
      <div>
        <div class="num">7888&nbsp;<span>MW</span></div>
        <div style="margin-top: 6px;">额定功率</div>
        <div class="num" style="margin-top:16px ;">热电联产</div>
        <div style="margin-top: 6px;">热源类型</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import HeatSourceNormalImg from '@/assets/images/buildingProgression/heatSource-normal.svg';
import HeatSourceNormalOverImg from '@/assets/images/buildingProgression/heatSource-normal-over.svg';
import {usemapStore} from "@/store/modules/cesiumMap";
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

})


// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const tempPosition = [[125.215454, 44.023299], [125.261585, 43.865346], [125.292529, 43.88078]];
const heatDatasource = new Cesium.CustomDataSource("heatSourceEntitySourceData");
let handler, preSelEntity

const addEntity = () => {
  tempPosition.forEach(el => {
    heatDatasource.entities.add({
      customType: "heatSourceEntity",
      position: Cesium.Cartesian3.fromDegrees(el[0], el[1]),
      show: true,
      label: {
        text: "西青热源",
        font: '14px PingFangSC-Regular, PingFang SC',
        verticalOrigin: Cesium.VerticalOrigin.BASELINE,
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        pixelOffset: new Cesium.Cartesian2(-25, 30),
        fillColor: Cesium.Color.fromCssColorString("#707070").withAlpha(1),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      billboard: {
        image: HeatSourceNormalImg,
        width: 80,
        height: 80,
        scale: '1',
        verticalOrigin: Cesium.VerticalOrigin.Top,
        pixelOffset: new Cesium.Cartesian2(0, -10),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
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
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "heatSourceEntity") {
    resetSelectedEntity();
    return;
  }
  if (entity !== preSelEntity) {
    resetSelectedEntity();
    entity.label.fillColor = Cesium.Color.fromCssColorString("#FF8C00").withAlpha(1);
    entity.billboard.image = HeatSourceNormalOverImg;
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
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "heatSourceEntity") {
    resetSelectedEntity();
    return;
  }
  ElMessage.success("点击厂区")
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
  preSelEntity.billboard.image = HeatSourceNormalImg;
  preSelEntity = null;
}

</script>

<style lang="scss" scoped>
.heat-source-info {
  position: absolute;
  width: 320px;
  min-height: 190px;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(84, 84, 84, 1);
  box-shadow: -10px 0px 22px 0px rgba(0, 0, 0, 0.22);
  border-radius: 4px;
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
