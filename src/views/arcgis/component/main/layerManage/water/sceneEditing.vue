<template>
  <div class="sceneEditing-wrap">
    <div class="material-area">
      <div class="setting-tabs">物料区</div>
      <ul class="operate-area">
        <li v-for="info in infos" :key="info.name">
          <div class="model-title">
            <span></span>
            {{ info.name }}
          </div>
          <div class="model-item">
            <div class="son-item" v-for="item in info.types" :key="item.label" @click="drawFn(item)">
              <img :src="item.img" alt=""/>
              <div>{{ item.label }}</div>
            </div>
          </div>
        </li>
      </ul>
      <div class="operate">
        <el-button type="primary" @click="cutImg">截取封面</el-button>
        <el-button type="primary" @click="mapResetCamera">默认视角</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import Draw from '@arcgis/core/views/draw/Draw';
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import rainTextBg from "./rain.png"

const mapStore = usearcgisMapStore()
const model = reactive({
  type: ""
})
const {} = toRefs(model)

onMounted(() => {
  viewer.map.layers.add(graphicsLayer)
})

onUnmounted(() => {
  viewer.map.layers.remove(graphicsLayer)
  graphicsLayer.removeAll()
})

const drawFn = (row) => {
  if (action) action.destroy()
  switch (row.type) {
    case "node":
      action = draw.create("point", {mode: "click"});
      model.type = 'node'
      break
  }
  action.on(["vertex-add", "cursor-update", "draw-complete", "vertex-remove"], (evt) => measureLine(evt));
}

const cutImg = () => {

}

const mapResetCamera = () => {

}

// 地图逻辑
let action
const viewer = mapStore.getArcgisViewer();
const graphicsLayer = new GraphicsLayer();
const draw = new Draw({
  view: viewer
});


import Point from "@arcgis/core/geometry/Point.js";

const measureLine = (evt) => {
  graphicsLayer.removeAll();
  const {vertices, type} = evt
  let geometry
  switch (model.type) {
    case "node":
      const point = vertices[0]
      geometry = {type: 'point', x: point[0], y: point[1], spatialReference: viewer.spatialReference}
      break
  }
  const graphic = new Graphic({
    geometry,
    symbol :{
      type: 'picture-marker', // 使用图片作为图标
      url: rainTextBg, // 替换为你的图标 URL
      width: '24px', // 图标宽度
      height: '24px' // 图标高度
    }
  });
  graphicsLayer.add(graphic);
}


import png1 from "@/assets/images/sceneEdit/img (1).png"
import png2 from "@/assets/images/sceneEdit/img (4).png"
import png3 from "@/assets/images/sceneEdit/img (2).png"
import png4 from "@/assets/images/sceneEdit/img (5).png"
import png5 from "@/assets/images/sceneEdit/img (3).png"
import Graphic from "@arcgis/core/Graphic";

const infos = [
  {
    name: "供水系统",
    types: [
      {label: "节点", type: "node", img: png1, drawType: "billboard"},
      {label: "管道", type: "pipeline", img: png2, drawType: "polyline"},
      {label: "阀门", type: "valve", img: png3, drawType: "billboard"},
      {label: "水泵", type: "pump", img: png4, drawType: "billboard"},
      {label: "水库", type: "reservoir", img: png5, drawType: "billboard"},
    ]
  }
]

</script>

<style lang="scss" scoped>
.sceneEditing-wrap {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: auto;

  .material-area {
    position: fixed;
    bottom: 30px;
    right: 20px;
    width: 330px;
    height: 360px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.6);
    overflow: hidden;

    .setting-tabs {
      display: flex;
      width: 100%;
      height: 35px;
      margin-bottom: 5px;
      font-size: 20px;
      line-height: 35px;
      text-indent: 15px;
      font-family: YouSheBiaoTiHei;
      background: rgba(22, 161, 255, 1);
    }

    .operate-area {
      height: calc(100% - 90px);
      overflow-y: auto;
      padding: 0px 5px;
      box-sizing: border-box;

      .model-title {
        display: flex;
        align-items: center;
        text-indent: 8px;
        font-weight: 500;
        margin-bottom: 10px;

        span {
          width: 3px;
          height: 14px;
          background: rgba(22, 161, 255, 1);
        }
      }

      .model-item {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-gap: 10px;
        padding-left: 3px;
        margin-bottom: 10px;

        .son-item {
          position: relative;
          cursor: pointer;

          div {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 20px;
            background: rgba(0, 0, 0, 0.4);
            text-align: center;
            line-height: 20px;
            font-size: 12px;
            color: #fff;
          }

          img {
            display: block;
            border-radius: 5px;
            max-width: 100%;
          }
        }
      }

      .model-item-btn {
        display: flex;
        flex-wrap: wrap;


        button {
          width: max-content;
          min-width: 55px;
          //margin-left: 10;
          margin: 3px;
        }
      }
    }

    .operate {
      display: flex;
      justify-content: flex-end;
      position: absolute;
      left: 0;
      bottom: 8px;
      width: 100%;

      .el-button {
        width: 70px;
        margin: 0 7px 0 3px;
      }

    }
  }
}
</style>
