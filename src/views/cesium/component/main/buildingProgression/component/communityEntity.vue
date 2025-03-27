<!--/**
 * @author: liuk
 * @date: 2023/8/10
 * @describe: 小区视角
 * @email:1229223630@qq.com
*/-->
<template>
  <div>
    <div class="heat-info" v-if="showPopup" :style="{top:popupPos.top,left:popupPos.left}">
      <div class="name">大有坊小区</div>
      {{ showPopup }}
      <div class="bottom_div">
        <div>
          <div class="num">20.3&nbsp;<span>℃</span></div>
          <div style="margin-top: 6px;">住户均温</div>
        </div>
        <div>
          <div class="num">92.9&nbsp;<span>%</span></div>
          <div style="margin-top: 6px;">室温达标率</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import communityList from "../data/community.json"
import {usemapStore} from "@/store/modules/cesiumMap";
// Emits
const emit = defineEmits(['hideCommunityEntity'])

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
  let features = communityList.features || [];
  features.forEach(el => {
    let pos = Cesium.Cartesian3.fromDegreesArray(el.geometry.coordinates[0].map(el1 => el1.join(',')).join(',').split(',').map(Number));
    let boundingSphere = new Cesium.BoundingSphere.fromPoints(pos);
    let center = boundingSphere.center;
    heatDatasource.entities.add({
      position: center,
      customType: "communityEntity",
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
        width: 1.5,
        material: Cesium.Color.fromCssColorString("#C0C0C0").withAlpha(0.5),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
  })
}

const onMouseClick = (movement) => {
  const preSelEntity = viewer.scene.pick(movement.position);
  if (!Cesium.defined(preSelEntity) || !Cesium.defined(preSelEntity.id)) return;
  var entity = preSelEntity.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "communityEntity") return;
  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromCartesianArray(entity.polygon.hierarchy.getValue().positions),
    complete: () => {
      emit('hideCommunityEntity')
    }
  });
}

const onMouseMove = (movement) => {
  const pickedObject = viewer.scene.pick(movement.endPosition);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) {
    resetSelectedEntity();
    return;
  }
  var entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "communityEntity") {
    resetSelectedEntity();
    return;
  }
  if (entity !== preSelEntity) {
    resetSelectedEntity();
    entity.polygon.material = Cesium.Color.fromCssColorString("white").withAlpha(0.1);
    entity.polyline.material = Cesium.Color.fromCssColorString("white").withAlpha(1);
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
  preSelEntity.polygon.material = Cesium.Color.fromCssColorString("white").withAlpha(0);
  preSelEntity.polyline.material = Cesium.Color.fromCssColorString("#C0C0C0").withAlpha(0.5);
  preSelEntity = null;
}

</script>

<style lang="scss" scoped>
.heat-info {
  position: absolute;
  width: 196px;
  min-height: 124px;
  padding: 12px;
  border: 1px solid rgba(85, 85, 85, 1);
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
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
    margin-top: 21px;

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
