<!--/**
 * @author: liuk
 * @date: 2023/8/10
 * @describe: 楼栋视角
*/-->
<template>
  <div>
    <div class="heat-building-info" v-if="showPopup" :style="{top:popupPos.top,left:popupPos.left}">
      <div class="name">大有坊小区 - 6栋</div>
      <div class="bottom_div">
        <div>
          <div class="num">20.3&nbsp;<span>℃</span></div>
          <div style="margin-top: 6px;">住户均温</div>
        </div>
        <div>
          <div class="num">136&nbsp;</div>
          <div style="margin-top: 6px;">温采住户数量</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import {onMounted, onUnmounted, reactive, toRefs} from "vue";

// Emits
const emit = defineEmits(['hideBuildProcessStage'])

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
  viewer.scene.postProcessStages.add(processStage)
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
})

onUnmounted(() => {
  handler.destroy()
  viewer.scene.postProcessStages.remove(processStage);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()

let handler, preSelEntity, silhouetteBlue, processStage
silhouetteBlue = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
silhouetteBlue.uniforms.color = Cesium.Color.WHITE;
silhouetteBlue.uniforms.length = 0.01;
silhouetteBlue.selected = [];
// 创建应用剪影效果的后期处理阶段。
processStage = Cesium.PostProcessStageLibrary.createSilhouetteStage([silhouetteBlue])

const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  if (!Cesium.defined(pickedObject) || !(pickedObject instanceof Cesium.Cesium3DTileFeature)) return
  if (pickedObject.color.alpha == 0.4) {//判断是否非区域外，判断方式后续接入真实数据后需修改
    return;
  }
  emit('hideBuildProcessStage')
}

const onMouseMove = (movement) => {
  onMouseMoveInfo(movement)
  silhouetteBlue.selected = [];
  const pickedFeature = viewer.scene.pick(movement.endPosition);
  if (!Cesium.defined(pickedFeature)) {
    return;
  }
  if (pickedFeature) {
    silhouetteBlue.selected = [pickedFeature];
  }
}

const onMouseMoveInfo = (movement) => {
  const pickedObject = viewer.scene.pick(movement.endPosition);
  if (!Cesium.defined(pickedObject) || !(pickedObject instanceof Cesium.Cesium3DTileFeature)) {
    resetSelectedEntity();
    return;
  }
  if (pickedObject.color.alpha == 0.4) {//判断是否非区域外，判断方式后续接入真实数据后需修改
    resetSelectedEntity();
    return;
  }
  const entity = pickedObject;
  if (entity !== preSelEntity) {
    resetSelectedEntity();
    entity.color.alpha = 0.5;
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
  preSelEntity.color.alpha = 1;
  preSelEntity = null;
}
</script>



<style lang="scss" scoped>
.heat-building-info {
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
