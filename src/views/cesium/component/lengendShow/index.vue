<!--图例展示 ys-->
<template>
  <div class="legendShow-wrap">
    <div class="legendBox">
      <div class="lengendBtn" @click='toggleFlat' :class="{select: isFlat === true}">
        图例
        <i class="el-icon-arrow-down" v-show="isFlat"></i>
        <i class="el-icon-arrow-up" v-show="!isFlat"></i>
      </div>
      <ul :class="{hide:!isFlat}">
        <li v-for="item of legendData" :key='item.id' @click="updateProject(item)"
            :class="item.id === curId ? 'select':''">
          <div class="imgBox">
            <img :src="item.img" alt="">
          </div>
          <p>{{ item.text }}</p>
        </li>
      </ul>
    </div>
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {reactive, toRefs} from "vue";

const model = reactive({
  isFlat: false,// 是否展开
  curId: '',//当前选中图例
})
const {isFlat, curId} = toRefs(model)


// 地图逻辑
console.log(1234)
</script>

<style lang="scss" scoped>
.legendShow-wrap {
  .legendBox {
    position: fixed;
    left: calc(var(--panel-width) + 70px);
    bottom: 35px;
    width: 115px;
    border-radius: 4px;
    background: rgba(29, 40, 57, 0.6);
    backdrop-filter: blur(4px);
    z-index: 10;

    .lengendBtn {
      width: calc(100% - 10px);
      height: 35px;
      margin: 5px auto 5px;
      line-height: 35px;
      text-align: center;
      border: 1px solid #7588aab0;
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.8);
      background: rgba(23, 40, 53, 0.4);
      backdrop-filter: blur(4px);
      box-shadow: rgb(7 98 255 / 30%) 0px 0px 2px 1px;
      cursor: pointer;

      &:hover {
        border-color: #4086ffb0;
        color: rgb(255, 255, 255);
        text-shadow: rgb(7 98 255 / 50%) 0px 0px 8px;
      }

      &.select {
        border: 1px solid #4086ffb0;
        color: rgb(255, 255, 255);
        background: rgba(25, 56, 111, 0.6);
        text-shadow: rgb(7 98 255 / 50%) 0px 0px 8px;
      }

      i {
        margin-left: 5px;
      }
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: rgba(255, 255, 255, 0.856);
      transition: all 3s linear 1s; //过渡为什么没用
      &.hide {
        height: 0;
      }

      li {
        display: flex;
        justify-content: center;
        width: 100%;
        margin: 3px 10px;
        opacity: 0.8;
        cursor: pointer;

        &:hover {
          opacity: 1;
        }

        &.select {
          opacity: 1;
          color: #4086ffb0;
          font-weight: 600;
        }

        .imgBox {
          width: 20px;
          margin-right: 15px;

          img {
            width: 100%;
            height: 100%;
          }
        }
      }
    }
  }
}
</style>