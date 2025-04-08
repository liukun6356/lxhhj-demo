<template>
  <div class="rangeSearch-wrap">
    <div class="measure-box">
      <div class="tit-wrap">
        <span>范围查询</span>
        <el-icon class="close-icon" color="red" size="16" @click="clearDraw">
          <delete/>
        </el-icon>
        <i class="el-icon-delete close-icon" color="red" size="18" @click="clearDraw"></i>
      </div>
      <ul>
        <li @click="startDrawing('circle')">圆形</li>
        <li @click="startDrawing('rectangle')">矩形</li>
        <li @click="startDrawing('polygon')">多边形</li>
      </ul>
      <el-icon class="close-icon" size="15" @click="$emit('close')">
        <Close/>
      </el-icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import {onMounted, onUnmounted, reactive} from "vue"
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic';
import Draw from '@arcgis/core/views/draw/Draw';
import Point from '@arcgis/core/geometry/Point'
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine.js'
import Circle from "@arcgis/core/geometry/Circle.js";
import Extent from '@arcgis/core/geometry/Extent'
import * as projection from '@arcgis/core/geometry/projection'

const mapStore = usearcgisMapStore()
const model = reactive({
  type: ""
})

onMounted(() => {
  viewer.map.layers.add(graphicsLayer)
})

onUnmounted(() => {
  viewer.map.layers.remove(graphicsLayer)
  graphicsLayer.removeAll()
})


// 地图逻辑
let action
const viewer = mapStore.getArcgisViewer();
const graphicsLayer = new GraphicsLayer();
const draw = new Draw({
  view: viewer
});

const startDrawing = (type) => {
  if (action) action.destroy()
  switch (type) {
    case 'circle':
      action = draw.create("circle", {mode: "click"});
      model.type = "circle"
      break
    case 'rectangle':
      action = draw.create("rectangle", {mode: "click"});
      model.type = "rectangle"
      break
    case 'polygon':
      action = draw.create("polygon", {mode: "click"});
      model.type = "polygon"
      break
  }
  action.on(["vertex-add", "cursor-update", "draw-complete", "vertex-remove"], (evt) => measureLine(evt));
}


const clearDraw = () => {
  graphicsLayer?.removeAll()
}

const measureLine = (evt) => {
  graphicsLayer.removeAll();
  const {vertices, type} = evt
  let geometry
  let point1, point2, radius = 10
  switch (model.type) {
    case "circle":
      point1 = new Point({x: vertices[0][0], y: vertices[0][1], spatialReference: viewer.spatialReference})
      if (vertices[1]) {
        point2 = new Point({x: vertices[1][0], y: vertices[1][1], spatialReference: viewer.spatialReference})
        radius = geometryEngine.distance(point1, point2, "meters")
      }
      geometry = new Circle({center: point1, radius, radiusUnit: "meters", spatialReference: viewer.spatialReference})
      if (type === "draw-complete") mercatorToWgs84(geometry.rings[0])
      break
    case "rectangle":
      point1 = vertices[0];
      point2 = vertices[1] || vertices[0];
      const xmin = Math.min(point1[0], point2[0])
      const xmax = Math.max(point1[0], point2[0])
      const ymin = Math.min(point1[1], point2[1])
      const ymax = Math.max(point1[1], point2[1])
      geometry = new Extent({xmin, ymin, xmax, ymax, spatialReference: viewer.spatialReference})
      if (type === "draw-complete") mercatorToWgs84([[xmin, ymin], [xmin, ymax], [xmax, ymin], [xmax, ymax]])
      break
    case "polygon":
      geometry = {type: "polygon", rings: vertices, spatialReference: viewer.spatialReference}
      if (type === "draw-complete") mercatorToWgs84(geometry.rings)
      break
  }
  const graphic = new Graphic({
    geometry,
    symbol: {
      type: "simple-fill",
      color: "rgba(0,196,255,.2)", // 填充颜色
      style: "solid", // 填充样式（默认就是 solid）
      outline: {
        width: 2,
        color: "#00C4FF"
      }
    }
  });
  graphicsLayer.add(graphic);
}

const mercatorToWgs84 = (mercatorCoords) => {
  const points = mercatorCoords.map(([x, y]) => {
    const point = new Point({x, y, spatialReference: viewer.spatialReference})
    const pt = projection.project(point, {wkid: 4326})
    return [+pt.longitude.toFixed(6), +pt.latitude.toFixed(6)]
  })
  return points
}

</script>

<style lang="scss" scoped>
.rangeSearch-wrap {
  pointer-events: auto;

  .measure-box {
    position: fixed;
    left: 300px;
    top: 100px;
    width: 230px;
    height: 100px;
    padding: 20px 15px;
    background: rgba(33, 40, 32, 0.7);
    color: #fff;
    font-size: 13px;
    box-sizing: border-box;
    z-index: 99;

    .close-icon {
      position: absolute;
      right: 5px;
      top: 5px;
    }

    .tit-wrap {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      span {
        padding: 4px 8px;
        border-radius: 5px;
        background: #131111;
      }
    }

    ul {
      display: flex;
      justify-content: space-between;

      li {
        padding: 5px 15px;
        border-radius: 5px;
        background: #163143;
        cursor: pointer;
      }
    }
  }
}
</style>
