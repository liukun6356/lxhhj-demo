<template>
  <div class="collisionTest-wrap">
    <teleport to="body">
      <ul v-show="item.visible" v-for="(item,index) in listData" :key="index"
          :class="['surveyStation-popup',`sectionEntityDom${index}`,'section-popup',item.offsetPopupBoxType,item.waterSurface - item.warningWaterLevel>= 0.01 ? 'waterlevel-overflow' : '']"
          :style="{transform: `translate(${item.AABB?.offsetX || 0}px, ${item.AABB?.offsetY ||0}px)`}">
        <li>名称：<span class="label">{{ item.name }}</span></li>
        <li>水位：<span class="num">--</span>m</li>
        <li>流量：<span class="num">--</span> m³/s</li>
      </ul>
    </teleport>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import GUI from "lil-gui";
import geojson from "./section.json"
import geojson1 from "./section1.json"
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
const model = reactive({
  listData: []
})
const {listData} = toRefs(model)
onMounted(async () => {
  initGui()
  viewer.dataSources.add(sectionDatasource);
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  viewer.camera.percentageChanged = 0;
  viewer.scene.camera.changed.addEventListener(showPopupBox);
  const terrain = await Cesium.createWorldTerrainAsync()
  viewer.terrainProvider = terrain
})

onUnmounted(() => {
  gui.destroy()
  viewer.scene.camera.changed.removeEventListener(showPopupBox);
  handler.destroy()
  sectionDatasource.entities.removeAll()
  viewer.dataSources.remove(sectionDatasource);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const sectionDatasource = new Cesium.GeoJsonDataSource("section");
let handler, PreSelEntity
const addEntity = async (geojson) => {
  model.listData = geojson.features.map((item, index) => ({visible: true, ...item.properties, name: index})) || []
  const updatedPositions = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, model.listData.map(item => Cesium.Cartographic.fromDegrees(+item.longitude, +item.latitude)))
  updatedPositions.forEach((item, index) => model.listData[index].height = item.height)
  sectionDatasource.load(geojson, {
    stroke: Cesium.Color.fromCssColorString("yellow").withAlpha(1),
    strokeWidth: 3,
    describe: () => "section",
    clampToGround: true
  });
}

const onMouseMove = (movement) => {
  if (PreSelEntity) {
    PreSelEntity.polyline.material = Cesium.Color.fromCssColorString("yellow").withAlpha(1)
    PreSelEntity = null
  }
  const pickedObject = viewer.scene.pick(movement.endPosition);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || !entity.description) return
  entity.polyline.material = new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString("red").withAlpha(1))
  if (entity !== PreSelEntity) PreSelEntity = entity;
}

const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  const entity = pickedObject.id;
  if (!(entity instanceof Cesium.Entity) || !entity.description) return
}

const offsetPopupBoxOptions = {
  top: [-0.5, -1],
  bottom: [-0.5, 0],
  right: [0, -0.5],
  left: [-1, -0.5],
}

const showPopupBox = () => {
  // 碰撞检测
  if (!model.listData.length) return
  const {left, top, bottom, right} = viewer.container.getBoundingClientRect()
  model.listData.forEach(async (item, index) => {
    let width, height, area
    if (!item.AABB) {
      const dom = document.querySelector(`.sectionEntityDom${index}`)
      width = parseInt(getComputedStyle(dom).width) + 2 * parseInt(getComputedStyle(dom).padding.split(" ")[1])
      height = parseInt(getComputedStyle(dom).height) + 2 * parseInt(getComputedStyle(dom).padding.split(" ")[0])
      area = width * height
      item.AABB = {width, height, area: width * height}
    } else {
      width = item.AABB.width
      height = item.AABB.height
      area = item.AABB.area
    }
    const curPosition = Cesium.Cartesian3.fromDegrees(+item.longitude, +item.latitude, +item.height);

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
      item.AABB.offsetX = x + offsetPopupBoxOptions["top"][0] * width
      item.AABB.offsetY = y + offsetPopupBoxOptions["top"][1] * height
      item.visible = true
      return
    }
    const offsetPopupBoxKeys = Object.keys(offsetPopupBoxOptions)
    const toChecks = model.listData.slice(0, index) // 需要测试碰撞的单位
    offsetPopupBoxKeys.some((type) => {
      item.offsetPopupBoxType = ""
      item.AABB.offsetX = x + offsetPopupBoxOptions[type][0] * width
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

const reset = () => {
  sectionDatasource.entities.removeAll()
  model.listData = []
}

const mapResetCamera = () => {
  switch (formData.type) {
    case "jz":
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(109.693111, 26.537175, 9596.4),
        orientation: {
          heading: Cesium.Math.toRadians(356),
          pitch: Cesium.Math.toRadians(-72),
          roll: Cesium.Math.toRadians(360)
        }
      });
      break
    case "cz":
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(113.070966, 25.722737, 2212.3),
        orientation: {
          heading: Cesium.Math.toRadians(342),
          pitch: Cesium.Math.toRadians(-21),
          roll: Cesium.Math.toRadians(360)
        }
      });
      break
  }
}

// lil-gui逻辑
let gui
const formData = {
  type: "",
  reset
}

const initGui = () => {
  gui = new GUI({title: "mapSplit"});
  gui.add(formData, "type", ["cz", "jz"]).onChange(type => {
    switch (formData.type) {
      case "jz":
        addEntity(geojson)
        break
      case "cz":
        addEntity(geojson1)
        break
    }
    mapResetCamera()
  })
  gui.add(formData, "reset")
}

</script>

<style lang="scss">
.section-popup {
  margin-left: -8px;
  z-index: 0 !important;

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
