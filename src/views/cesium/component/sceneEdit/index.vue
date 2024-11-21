<!--场景编辑-->
<template>
  <div class="sceneEdit-wrap">
    <div class="material-area">
      <div class="setting-tabs">配置</div>
      <div class="operate-area">
        <div class="model-title">
          <span></span>
          三维模型
        </div>
        <div class="model-item">
          <div class="son-item" v-for="(item,index) in modelArr" :key="index" @click="drwaModel(item.label)">
            <img :src="item.img" alt=""/>
            <div>{{ item.label }}</div>
          </div>
        </div>
        <div class="model-title">
          <span></span>
          二维标注
        </div>
        <div class="model-item-btn">
          <el-button v-for="str in draw2dArr" :key="str" @click="drwaModel(str)" size="small">{{ str }}</el-button>
        </div>
        <div class="model-title">
          <span></span>
          三维标注
        </div>
        <div class="model-item-btn">
          <el-button v-for="str in draw3dArr" :key="str" @click="drwaModel(str)" size="small">{{ str }}</el-button>
        </div>
        <div class="model-title">
          <span></span>
          场景特效
        </div>
        <div class="model-item">
          <div class="son-item" v-for="(item,index) in effectArr" :key="index" @click="drwaModel(item.label)">
            <img :src="item.img" alt=""/>
            <div>{{ item.label }}</div>
          </div>
        </div>
      </div>
      <div class="operate">
        <el-button type="primary" plain @click="cutImg">截取封面</el-button>
        <el-button type="primary" plain @click="mapResetCamera">默认视角</el-button>
        <el-button type="primary" class="preserve" @click="saveConfig">保存</el-button>
      </div>
    </div>
    <div class="render-area">
      <div class="head_title_arrow">展示管理</div>
      <div class="content">
        <el-tree
            ref="treeRef"
            :data="treeData"
            show-checkbox
            @check-change="checkChange"
            node-key="id"/>
      </div>
    </div>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs, ref, onMounted, onUnmounted} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import jsonData from "./data.ts"
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
// Refs
const treeRef = ref()

const mapStore = usemapStore()
const model = reactive({
  treeData: []
})
const {treeData} = toRefs(model)

onMounted(() => {
  model.treeData = jsonData
})
onUnmounted(() => {

})

const drwaModel = (type) => {
  switch (type) {

  }
}

const saveConfig = () => {

}

const checkChange = () => {

}



// 地图逻辑
const viewer = mapStore.getCesiumViewer()

const mapResetCamera = () => {
  viewer.camera.flyTo({
    destination: new Cesium.Cartesian3.fromDegrees(113.048936, 25.755645, 77805.77),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0),
    },
    duration: 2,
  })
}

const cutImg = () => {
   viewer.expImage({type:"image/png"})
}

import png1 from "@/assets/images/sceneEdit/sm@2x.jpg"
import png2 from "@/assets/images/sceneEdit/cd@2x.jpg"
import png3 from "@/assets/images/sceneEdit/jz@2x.jpg"
import png4 from "@/assets/images/sceneEdit/dl@2x.jpg"
import png5 from "@/assets/images/sceneEdit/hl@2x.jpg"
import png6 from "@/assets/images/sceneEdit/hb@2x.jpg"
import png7 from "@/assets/images/sceneEdit/js@2x.jpg"
import png8 from "@/assets/images/sceneEdit/dn@2x.jpg"
import png9 from "@/assets/images/sceneEdit/kz@2x.jpg"

const modelArr = [
  {label: "树木", img: png1},
  {label: "草地", img: png2},
  {label: "建筑", img: png3},
  {label: "道路", img: png4},
  {label: "河流", img: png5},
  {label: "湖泊", img: png6},
  {label: "教室", img: png7},
  {label: "电脑", img: png8},
  {label: "课桌", img: png9},
]

import png11 from "@/assets/images/sceneEdit/h@2x.png"
import png22 from "@/assets/images/sceneEdit/y@2x.png"
import png33 from "@/assets/images/sceneEdit/dgy@2x.png"
import png44 from "@/assets/images/sceneEdit/jgy@2x.png"
import png55 from "@/assets/images/sceneEdit/s@2x.png"

const effectArr = [
  {label: "火", img: png11},
  {label: "烟", img: png22},
  {label: "点光源", img: png33},
  {label: "聚光源", img: png44},
  {label: "水", img: png55},
]

const draw2dArr = ['线', '虚线', '面', '矩形', '圆', '文字']
const draw3dArr = ['墙体', '动态墙', '箭头']
</script>

<style lang="scss" scoped>
.sceneEdit-wrap {
  pointer-events: auto;

  .material-area {
    position: fixed;
    top: 100px;
    right: 20px;
    width: 330px;
    height: calc(100% - 130px);
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
            max-width: 100%;
          }
        }
      }

      .model-item-btn {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        grid-gap: 10px;
        padding-left: 5px;
        margin-bottom: 10px;

        button {
          width: 50px;
          margin-left: 0;
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

  .render-area {
    position: fixed;
    top: 100px;
    left: 280px;
    padding: 10px;
    width: 220px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
  }
}
</style>
