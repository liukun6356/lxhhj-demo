<!--/**
* @author: liuk
* @date: 2024-08-20
* @describe:数值
*/-->
<template>
  <div class="numericalValue-wrap" v-if="!props.isDualMap">
    <el-row type="flex" style="flex-direction:column">
      <el-form-item label="">
        <el-checkbox v-model="showTip" @change="toggleShowTip">
          <span>显示断面tip</span>
        </el-checkbox>
      </el-form-item>
      <el-form-item label="">
        <el-checkbox v-model="showGrid">
          <span>显示网格</span>
        </el-checkbox>
      </el-form-item>
    </el-row>
  </div>
  <triangle-grid v-if="showGrid" :isDualMap="props.isDualMap"/>
  <teleport to="body">
    <ul v-show="showTip && item.visible"
        v-for="(item,index) in listData" :key="index"
        :class="['surveyStation-popup',`sectionEntityDom${props.isDualMap ? 'DualMap' : ''}${index}`,'section-popup',item.offsetPopupBoxType,item.waterSurface - item.warningWaterLevel>= 0.01 ? 'waterlevel-overflow' : '']"
        :style="{
            transform: `translate(${item.AABB?.offsetX || 0}px, ${item.AABB?.offsetY ||0}px)`}">
      <li>名称：<span class="label">{{ item.label.split(':')[0] }}</span></li>
      <li>编号：<span class="label">{{ item.label.split(':')[1] }}</span></li>
      <li>
        水位：
        <span class="num">{{ formatToFixed(item.waterSurface,2) }}</span>m
        <span style="color:red" v-if="item.waterSurface - item.warningWaterLevel>= 0.01">
          {{ formatToFixed(item.waterSurface - item.warningWaterLevel) }}↑
        </span>
      </li>
      <li>流量：<span class="num">{{ formatToFixed(item.flow,2) }}</span> mm</li>
    </ul>
  </teleport>
  <el-dialog v-model="dialogVisible" :show-close="false" class="globalDetailDialogClass" append-to-body
             destroy-on-close style="width: 50vw;height:50vh;margin-top: 20vh">
    <numerical-value-dialog :data="curRow" @icon-close="dialogVisible=false"/>
  </el-dialog>

</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, onUnmounted, reactive, toRefs, watch} from "vue";
import {formatToFixed} from "@/utils/dictionary";
import {usemapStore} from "@/store/modules/cesiumMap";
import mittBus from "@/utils/mittBus";

// Components
import NumericalValueDialog from "./numericalValueDialog.vue"
import TriangleGrid from "./triangleGrid/index.vue"
// Props
const props = defineProps<{
  isDualMap?: boolean
}>()

const mapStore = usemapStore()
const showTip = computed({
  get() {
    return mapStore.numericalValueShowTip;
  },
  set(val) {
    mapStore.setNumericalValueShowTip(val);
  }
})
const showGrid = computed({
  get() {
    return mapStore.numericalValueShowGrid;
  },
  set(val) {
    mapStore.setNumericalValueShowGrid(val);
  }
})

const model = reactive({
  listData: [],
  curRow: "",
  dialogVisible: false
})
const {listData, curRow, dialogVisible} = toRefs(model)

onMounted(() => {
  getlist()
  mittBus.emit('toggleLayer', {key: '51', bool: false}) // 关闭5cm倾斜模型
  if (viewer.terrainProvider.isFlag) { // 关闭地形
    viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider()
  }
  viewer.dataSources.add(sectionDatasource);
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  viewer.camera.percentageChanged = 0;
  viewer.scene.camera.changed.addEventListener(showPopupBox);
})

onUnmounted(async () => {
  // const terrainProvider = await mars3d.LayerUtil.createTerrainProvider({
  //   url: import.meta.env.VITE_APP_TERRAIN_URL,
  // })
  if (viewer.scene){
    // viewer.scene.terrainProvider = terrainProvider;
    // viewer.scene.terrainProvider.isFlag = true
    viewer.dataSources.remove(sectionDatasource);
    viewer.scene.camera.changed.removeEventListener(showPopupBox);
  }
  handler.destroy()
  sectionDatasource.entities.removeAll()
})

watch(() => prolusionStore.poiSections, () => {
  model.listData = prolusionStore.poiSections.map(item => ({visible: true, ...item})) || []
  nextTick(() => showPopupBox())
})

const getlist = () => {
  model.listData = prolusionStore.poiSections.map(item => ({visible: true, ...item})) || []
  addEntity()
  nextTick(() => showPopupBox())
}

const toggleShowTip = (bool) => {
  if (bool) showPopupBox()
}

// 地图逻辑
const sectionDatasource = new Cesium.CustomDataSource("section");
let handler, PreSelEntity
const viewer = props.isDualMap ? mapStore.getDualCesoumViewer() : mapStore.getCesiumViewer();
const addEntity = () => {
  model.listData.forEach(async (item) => {
    sectionDatasource.entities.add({
      customType: "sectionEntity",
      id: item.index,
      data: item,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(item.coordinates.flat()),
        material: Cesium.Color.fromCssColorString("yellow").withAlpha(1),
        width: 5,
        clampToGround: true
      }
    })
  })
}

const onMouseMove = (movement) => {
  if (PreSelEntity) {
    PreSelEntity.polyline.material = Cesium.Color.fromCssColorString("yellow").withAlpha(1)
    PreSelEntity = null
  }
  const pickedObject = viewer.scene.pick(movement.endPosition);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "sectionEntity") return
  entity.polyline.material = Cesium.Color.fromCssColorString("red").withAlpha(1)
  if (entity !== PreSelEntity) PreSelEntity = entity;
}

const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || entity.customType !== "sectionEntity") return
  model.curRow = entity.data
  model.dialogVisible = true
}

const offsetPopupBoxOptions = {
  top: [-0.5, -1],
  bottom: [-0.5, 0],
  right: [0, -0.5],
  left: [-1, -0.5],
}

const showPopupBox = () => {
  if (!showTip.value) return
  // 碰撞检测
  const {left, top, bottom, right} = viewer.container.getBoundingClientRect()
  const CanvasWidth = parseInt(getComputedStyle(viewer.container).width)
  model.listData.forEach(async (item, index) => {
    let width, height, area
    if (!item.AABB) {
      const dom = document.querySelector(`.sectionEntityDom${props.isDualMap ? 'DualMap' : ''}${index}`)
      width = parseInt(getComputedStyle(dom).width) + 2 * parseInt(getComputedStyle(dom).padding.split(" ")[1])
      height = parseInt(getComputedStyle(dom).height) + 2 * parseInt(getComputedStyle(dom).padding.split(" ")[0])
      area = width * height
      item.AABB = {width, height, area: width * height}
    } else {
      width = item.AABB.width
      height = item.AABB.height
      area = item.AABB.area
    }
    const curPosition = Cesium.Cartesian3.fromDegrees(item.longitude, item.latitude, 0);
    let x, y;
    try {
      const obj = viewer.scene.cartesianToCanvasCoordinates(curPosition)
      x = obj.x
      y = obj.y
    } catch (e) {
      item.visible = false
    }
    if (!x) return
    if (index === 0) {
      item.offsetPopupBoxType = "top";
      item.AABB.offsetX = x + offsetPopupBoxOptions["top"][0] * width + (props.isDualMap ? CanvasWidth : 0)
      item.AABB.offsetY = y + offsetPopupBoxOptions["top"][1] * height
      item.visible = true
      return
    }
    const offsetPopupBoxKeys = Object.keys(offsetPopupBoxOptions)
    const toChecks = model.listData.slice(0, index) // 需要测试碰撞的单位
    offsetPopupBoxKeys.some((type) => {
      item.offsetPopupBoxType = ""
      item.AABB.offsetX = x + offsetPopupBoxOptions[type][0] * width + (props.isDualMap ? CanvasWidth : 0)
      item.AABB.offsetY = y + offsetPopupBoxOptions[type][1] * height
      const check = toChecks.every(checkItem => {
        const box1 = checkItem.AABB
        const box2 = item.AABB
        let intersectionArea = 0 // 相交面积
        // 计算在每个轴上的重叠部分
        const overlapX = Math.min(box1.offsetX + box1.width, box2.offsetX + box2.width) - Math.max(box1.offsetX, box2.offsetX);
        const overlapY = Math.min(box1.offsetY + box1.height, box2.offsetY + box2.height) - Math.max(box1.offsetY, box2.offsetY);
        // 如果在两个轴上都有重叠，则计算相交区域的面积
        if (overlapX > 0 && overlapY > 0) intersectionArea = overlapX * overlapY;
        return intersectionArea <= area * 0.05;
      });
      if (check) {
        item.offsetPopupBoxType = type
      }
      return check
    })
    switch (true) { // 屏幕边界限制
      case item.AABB.offsetX + width <= right && item.AABB.offsetX >= left && item.AABB.offsetY >= top && item.AABB.offsetY + height <= bottom:
        item.visible = !!item.offsetPopupBoxType;
        break
      default:
        item.visible = false;
        break
    }
  })
}
</script>

<style lang="scss" scoped>
.numericalValue-wrap {
  display: flex;
  justify-content: center;
  position: absolute;
  top: 65px;
  right: 65px;
  font-size: 12px;
  padding: 10px;
  flex-direction: column;
  width: 120px;
  color: white;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  overflow: auto;
  border-radius: 4px;

  :deep(.el-form-item ) {
    margin-bottom: 0;

    .el-checkbox {
      --el-checkbox-text-color: #2da4fe;
    }
  }
}
</style>

<style lang="scss">
@keyframes dm-yj-breathe {
  0% {
    box-shadow: 0 0 5px 2px #ff8080;
  }

  100% {
    box-shadow: 0 0 10px 2px red;
  }
}

.section-popup {
  margin-left: -8px;

  &::before {
    content: "";
    background-color: rgba(0, 0, 0, 0.7);
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 24px;
    height: 10px;
    transform: translate(-50%, 100%) translateY(-0.5px);
    clip-path: polygon(50% 100%, 0 0, 100% 0);
  }

  &.top {
    margin-top: calc(var(--h) * -1);

    &::before {
      top: auto;
      bottom: 0;
      right: auto;
      left: 50%;
      width: var(--w);
      height: var(--h);
      transform: translate(-50%, 100%) translateY(-0.5px);
      clip-path: polygon(50% 100%, 0 0, 100% 0);
    }
  }

  &.bottom {
    margin-top: var(--h);

    &::before {
      top: 0;
      bottom: auto;
      right: auto;
      left: 50%;
      width: var(--w);
      height: var(--h);
      transform: translate(-50%, -100%) translateY(0.5px);
      clip-path: polygon(50% 0, 0 100%, 100% 100%);
    }
  }

  &.right {
    margin-left: var(--h);

    &::before {
      top: 50%;
      bottom: auto;
      right: auto;
      left: 0;
      width: var(--h);
      height: var(--w);
      transform: translate(-100%, -50%) translateX(0.5px);
      clip-path: polygon(100% 0, 0 50%, 100% 100%);
    }
  }

  &.left {
    margin-left: calc(var(--h) * -1);

    &::before {
      top: 50%;
      bottom: auto;
      right: 0;
      left: auto;
      width: var(--h);
      height: var(--w);
      transform: translate(100%, -50%) translateX(-0.5px);
      clip-path: polygon(0 100%, 0 0, 100% 50%);
    }
  }

  &.waterlevel-overflow {
    animation: dm-yj-breathe 800ms ease-in-out infinite;
    animation-direction: alternate;
  }

  .label {
    color: #00ff00;
  }

  .num {
    color: orange;
  }
}
</style>