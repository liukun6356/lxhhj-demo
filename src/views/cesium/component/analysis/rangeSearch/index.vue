<!--范围查询 todo-->
<!--需要封装一个 draw 类-->
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
        <li @click="drawEllipse">圆形</li>
        <li @click="drawRectangle">矩形</li>
        <li @click="drawPolygon">多边形</li>
      </ul>
      <el-icon class="close-icon" size="15" @click="$emit('close')">
        <Close/>
      </el-icon>
    </div>
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {usemapStore} from "@/store/modules/cesiumMap";
import * as mars3d from "mars3d";
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import {cartesianToWgs84} from "@/utils/dictionary";

const mapStore = usemapStore()
const model = reactive({
  info: {}
})
const {info} = toRefs(model)

onMounted(() => {
  graphicLayer.on(mars3d.EventType.drawCreated, drawCreatedFn)
  viewer.addLayer(graphicLayer)
})

onUnmounted(() => {
  graphicLayer.off(mars3d.EventType.drawCreated, drawCreatedFn)
  graphicLayer.clear()
  viewer.removeLayer(graphicLayer)
})

const drawEllipse = () => {
  clearDraw()
  graphicLayer.startDraw({
    type: "circle",
    style: {
      color: "#00C4FF",      //颜色
      opacity: 0.2,
      outline: true,
      outlineColor: "#00C4FF",
      clampToGround: true
    },
  })
}

const drawRectangle = () => {
  clearDraw()
  graphicLayer.startDraw({
    type: "rectangle",
    style: {
      color: "#00C4FF",      //颜色
      opacity: 0.2,
      outline: true,
      outlineColor: "#00C4FF",
      clampToGround: true
    },
  })
}

const drawPolygon = () => {
  clearDraw()
  graphicLayer.startDraw({
    type: "polygon",
    style: {
      color: "#00C4FF",      //颜色
      opacity: 0.2,
      outline: true,
      outlineColor: "#00C4FF",
      clampToGround: true
    },
  })
}


const clearDraw = () => {
  graphicLayer.clear()
}

const drawCreatedFn = (e) => {
  const geometry = toWKT(e.sourceTarget.outlinePositions.map(pos => cartesianToWgs84(pos)))
  console.log(geometry)
}

// 转wkt
const toWKT = (posArr) => {
  let temp = [];
  posArr.forEach(pos => {
    let newArr = [pos[0].toFixed(3), pos[1].toFixed(3)];
    let str = newArr.join(" ");
    temp.push(str);
  })
  debugger
  return 'POLYGON((' + temp.join() + '))';
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
const graphicLayer = new mars3d.layer.GraphicLayer({
  // isRestorePositions: true,
  // hasEdit: true,
  // isAutoEditing: true // 绘制完成后是否自动激活编辑
})

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
