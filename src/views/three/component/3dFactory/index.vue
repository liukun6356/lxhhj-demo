<template>
  <div class="Factory-wrap">
    <div class="map-operation-wrap">
      <el-tooltip :content="item.label" placement="left-start" v-for="item in mapOperationImgs" :key="item.label">
        <div :class="[item.select ? 'select' : '', 'icon-wrap']">
          <div class="icon" @click="mapOperationClick(item)"></div>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs} from "vue";

const model =reactive({
  mapOperationImgs: [
    {label: '显示系统名称', select: false},
    {label: '热需风险预警', select: false},
    {label: '放大'},
    {label: '缩小'},
    {label: '定位'}
  ],
})
const {mapOperationImgs} = toRefs(model)

const mapOperationClick = (item) =>{
  console.log(item,88)
}

console.log("3d厂区")
</script>

<style lang="scss" scoped>
.Factory-wrap {
  .map-operation-wrap {
    position: fixed;
    top: 50%;
    right: 32px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transform: translateY(-50%);
    width: 32px;
    opacity: 0.95;
    background: transparent;
    z-index: 1;

    .icon-wrap {
      margin-bottom: 3px;
      border-radius: 4.5px;
      border: 1px solid transparent;
      // background-color: #393939;
      background: rgba(57, 57, 57, 0.6);
      box-sizing: border-box;
      box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.6);
      backdrop-filter: brightness(110%) blur(6px) !important;

      &.select {
        //border: 1px solid #ffbe06;

        .icon {
          background-color: #ffbe06;
        }
      }

      &:nth-child(1) {
        .icon {
          mask: url('@/assets/images/3dFactory/u4901_mouseOver.svg') no-repeat center/17px 17px;
        }
      }

      &:nth-child(2) {
        .icon {
          mask: url('@/assets/images/3dFactory/u4904.svg') no-repeat center/17px 17px;
        }
      }

      &:nth-child(3) {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        margin-bottom: 1px;

        .icon {
          mask: url('@/assets/images/3dFactory/u4914.svg') no-repeat center/17px 17px;
        }
      }

      &:nth-child(4) {
        border-top-left-radius: 0;
        border-top-right-radius: 0;

        .icon {
          mask: url('@/assets/images/3dFactory/u4911.svg') no-repeat center/17px 2px;
        }
      }

      &:nth-child(5) {
        .icon {
          mask: url('@/assets/images/3dFactory/u4907.svg') no-repeat center/17px 17px;
        }
      }

      .icon {
        width: 32px;
        height: 32px;
        background: #fff;
      }
    }
  }
}
</style>
