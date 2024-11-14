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
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const drawEllipse = () => {

}

const drawRectangle = () => {

}

const drawPolygon = () => {

}

const clearDraw = () => {

}

console.log("范围查询")
</script>

<style lang="scss" scoped>
.rangeSearch-wrap {
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
