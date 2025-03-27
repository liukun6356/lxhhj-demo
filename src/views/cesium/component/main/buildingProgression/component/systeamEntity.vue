<!--/**
 * @author: liuk
 * @date: 2023/8/10
 * @describe: 系统视角
 * @email:1229223630@qq.com
*/-->
<template>
  <div>
    <div class="heat-info" v-if="showPopup" :style="{top:popupPos.top,left:popupPos.left}">
      <div class="name">供热系统C名称占位</div>
      <div class="pjsw">22.4 <span>℃</span></div>
      <div class="bottom_div">平均室温</div>
      <div class="bottom_div" style="margin-top: 20px;">
        <div>室温达标率</div>
        <div class="num">95.4%</div>
      </div>
      <div class="bottom_div" style="margin-top: 12px;">
        <div>每万平方米投诉率</div>
        <div class="num">0.14个/万㎡</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap";
import heatSystemList from "../data/heat-system.json"
// Emits
const emit = defineEmits(['hideSysteamEntity'])

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
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
})

onUnmounted(() => {
  handler.destroy()
  viewer.dataSources.remove(heatDatasource);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const heatDatasource = new Cesium.CustomDataSource("systeamEntityDataSource");
let handler, preSelEntity
const addEntity = () => {
  let features = heatSystemList.features || [];
  features.forEach(el => {
    let pos = Cesium.Cartesian3.fromDegreesArray(el.geometry.coordinates[0].map(el1 => el1.join(',')).join(',').split(',').map(Number));
    let boundingSphere = new Cesium.BoundingSphere.fromPoints(pos);
    let center = boundingSphere.center;
    heatDatasource.entities.add({
      position: center,
      customType: "systeamEntity",
      label: {
        text: el.properties.name,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        horizontalOrigin: Cesium.HorizontalOrigin.Top,
        scaleByDistance: new Cesium.NearFarScalar(2000, 1, 500000, 0.1)
      },
      show: true,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(pos),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        material: Cesium.Color.fromCssColorString("white").withAlpha(0),
      },
      polyline: {
        show: true,
        positions: pos,
        width: 3,
        material: Cesium.Color.fromCssColorString("#C0C0C0"),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
  })
}

const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return;
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "systeamEntity") return;
  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromCartesianArray(entity.polygon.hierarchy.getValue().positions),
    complete: () => {
      emit('hideSysteamEntity')
    }
  });
}

const onMouseMove = (movement) => {
  const pickedObject = viewer.scene.pick(movement.endPosition);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) {
    resetSelectedEntity()
    return;
  }
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "systeamEntity") {
    resetSelectedEntity();
    return;
  }
  if (entity !== preSelEntity) {
    resetSelectedEntity();
    entity.polygon.material = Cesium.Color.fromCssColorString("#FF8C00").withAlpha(0.3);
  }
  preSelEntity = entity;
  showPopupBox(movement.endPosition);
}

const showPopupBox = (movement) => {
  model.showPopup = true
  model.popupPos.left = `${movement.x + 10}px`;
  model.popupPos.top = `${movement.y + 10}px`;
}

const resetSelectedEntity = () => {
  if (!preSelEntity) return
  model.showPopup = false
  preSelEntity.polygon.material = Cesium.Color.fromCssColorString("red").withAlpha(0);
  preSelEntity = null;
}

</script>

<style lang="scss" scoped>
.heat-info {
  position: absolute;
  width: 240px;
  min-height: 200px;
  border: 1px solid rgba(84, 84, 84, 1);
  box-shadow: -10px 0px 22px 0px rgba(0, 0, 0, 0.22);
  border-radius: 4px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  z-index: 9999;
  pointer-events: none;


  .name {
    font-family: PingFangSC-Medium;
    font-size: 16px;
    color: #FFFFFF;
    letter-spacing: 0;
    font-weight: 500;
  }

  .pjsw {
    font-size: 28px;
    line-height: 34px;
    font-weight: 500;
    letter-spacing: 0;
    font-family: PingFangSC-Medium;
    margin-top: 24px;

    span {
      font-size: 16px;
      line-height: 34px;
      font-weight: 500;
    }
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

    .num {
      font-size: 16px;
      color: #FFFFFF;
      letter-spacing: 0;
      line-height: 16px;
      font-weight: 400;
    }
  }
}
</style>
