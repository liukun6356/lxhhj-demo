<!--导航条-->
<template>
  <div class="navbar-box" :style="{marginTop:arrowType?'-70px':'0'}">
    <div class="top-title">
      <span>{{ curMenu }}</span>
    </div>
    <div class="menu-area">
      <div class="menu-item" v-for="(item,index) in menus" :key="index"
           :class="{ active:new RegExp(item.name).test(curMenu)}"
           @click="changeActiveId(item)">
        <div class="menu-item-inner">
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>
    <div class="operation" @click="arrowType=!arrowType">
      <el-icon v-if="arrowType">
        <CaretBottom/>
      </el-icon>
      <el-icon v-else>
        <CaretTop/>
      </el-icon>
    </div>
  </div>

</template>

<script lang="ts" setup>
import {computed, reactive, toRefs} from 'vue'
import {useRoute, useRouter} from "vue-router"
// Component
const route = useRoute()
const router = useRouter()

const curMenu = computed(() => route.name)
const model = reactive({
  arrowType: false
})
const {arrowType} = toRefs(model)

const changeActiveId = ({name}) => {
  router.push({name})
}

const menus = [
  {label: '四全', name: 'Cesium'},
  {label: '四预', name: 'Three'},
  {label: '四制', name: 'WebGl'},
];
</script>

<style lang="scss" scoped>
.navbar-box {
  display: flex;
  justify-content: space-between;
  position: absolute;
  top: 0px;
  left: 0;
  right: 0;
  min-width: 1750px;
  height: 100px;
  padding: 0 20px;
  z-index: 9;
  overflow: visible;
  user-select: none;
  background: url("@/assets/images/top.png") no-repeat center/100% 100%;
  pointer-events: auto;
  transition: all 0.5s ease-in-out;

  .top-title {
    width: 1100px;
    font-size: 40px;
    line-height: 80px;
    font-family: PangMenZhengDao;
  }

  .menu-area {
    display: flex;
    width: 1300px;
    padding-top: 15px;
    font-size: 24px;
    font-family: YouSheBiaoTiHei;
    font-weight: 400;
    cursor: pointer;
    color: #fff;
    white-space: nowrap;


    .menu-item {
      height: 100%;
      width: 115px;

      .menu-item-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        height: 40px;
        box-sizing: border-box;
        background: url("@/assets/images/no-select.png") no-repeat center/cover;

        .iconfont {
          font-size: 18px;
        }
      }

      &.active {
        .menu-item-inner {
          color: rgba(255, 187, 31, 1);
          //background: rgba(255, 187, 31, 0.1);
          //border-radius: 17px;
          //border: 1px solid #ffbb1f;
          background: url("@/assets/images/select.png") no-repeat center/cover;
        }
      }
    }
  }

  .operation {
    width: 60px;
    height: 20px;
    margin-top: 70px;
    background: #215073;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    text-align: center;
    font-size: 15px;
    cursor: pointer;
    user-select: none;
    //background: rgb(130, 150, 163, .15);
  }

  .top-bar-right {
    display: flex;
    justify-content: space-between;
    width: 250px;
    padding-top: 20px;
  }
}

:deep(.el-popover) {
  --el-bg-color-overlay: red;
}
</style>

