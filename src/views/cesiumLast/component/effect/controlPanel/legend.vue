<!--图例-->
<template>
  <div class="map_legend">
    <div class="legendType">
      <div class="selettiele">
        <div class="msjt"></div>
        <div class="msjtname">雨量站</div>
      </div>
      <div class="itemHyetal" v-for="(item, i) in rainList" :key="i">
        <div class="color" :style="{ backgroundColor: item.color }"></div>
        <span>{{ item.value }}</span>
      </div>
    </div>
    <div class="legendType">
      <div class="selettiele">
        <div class="msjt"></div>
        <div class="msjtname">水库站</div>
      </div>
      <div class="item" v-for="(item, index) in iconTypes.reservoir['2d']" :key="index">
        <img :src="item" alt="" width="15" height="15"/>
        <span>{{ formatStr(index, "reservoir") }}</span>
      </div>
    </div>
    <div class="legendType">
      <div class="selettiele">
        <div class="msjt"></div>
        <div class="msjtname">河道站</div>
      </div>
      <div class="item" v-for="(item, index) in iconTypes.river['2d']" :key="index">
        <img :src="item" alt="" width="15" height="15"/>
        <span>{{ formatStr(index, "river") }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import iconTypes from "@/views/cesium/cesiumMap/iconTypes"

const formatStr = (val, type) => {
  switch (+val) {
    case 1:
      return '正常'
      break
    case 2:
      return type === 'reservoir' ? '超正常' : "超保证"
      break
    case 3:
      return type === 'reservoir' ? '超历史' : '超历史'
      break
    case 4:
      return type === 'reservoir' ? '超汛限' : '超警戒'
      break
  }
}

const rainList = [
  {value: '0', color: '#DFDFDF'},
  {value: '1', color: '#A3F392'},
  {value: '1.5', color: '#39A501'},
  {value: '7', color: '#63B7FF'},
  {value: '15', color: '#F4AB18'},
  {value: '40', color: '#EA1BE7'},
  {value: '50', color: '#9D004F'}
]
</script>

<style lang="scss" scoped>
.map_legend {
  position: absolute;
  left: 450px;
  bottom: 30px;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  z-index: 6;
  padding: 15px;
  -webkit-transition-duration: 0.8s;
  -moz-transition-duration: 0.8s;
  -ms-transition-duration: 0.8s;
  -o-transition-duration: 0.8s;
  transition-duration: 0.8s;
  backdrop-filter: blur(2px);
  border-radius: 4px;
  display: flex;
  white-space: nowrap;
  user-select: none;

  &.left {
    left: 20px;
  }

  .legendType {
    width:80px;

    .selettiele {
      display: flex;
      align-items: center;
      margin-bottom: 10px;

      .msjt {
        width: 8px;
        height: 14px;
        background: url("@/assets/images/cesiumMap/zs@2x.png");
        background-repeat: no-repeat;
        background-size: 100% 100%;
      }

      .msjtname {
        margin-left: 8px;
        font-size: 14px;
        font-family: PingFang SC Regular, SourceHanSansCN;
        font-weight: 400;
        color: #ffffff;
      }
    }

    .itemHyetal {
      margin-top: -1px;
      display: flex;
      align-items: center;
      margin-left: 20px;

      .color {
        width: 5px;
        height: 20px;
        border-radius: 1px;
      }

      span {
        font-family: PingFang SC Regular, SourceHanSansCN;
        margin-left: 6px;
        font-size: 12px;
        margin-top: -15px;
      }
    }

    .item {
      margin-top: 12px;
      display: flex;
      align-items: center;

      .color {
        width: 4px;
        height: 20px;
        border-radius: 1px;
      }

      span {
        font-family: PingFang SC Regular, SourceHanSansCN;
        margin-left: 6px;
        font-size: 13px;
      }
    }
  }
}
</style>
