<template>
  <div class="gradientBtn-wrap">
    <div class="building-floor-menu">
      <div :class="['building-floor-menu-item', item.select ? 'select' : '']" v-for="item in listData"
           :key="item.floor_level_type" @click="setCamera(item)" @mouseleave="item.select = false">
        <div class="inner-box">
          <div class="real-box">
            <div class="name">
              <span class="tit">{{ item.floor_level_type }}</span>
              <span class="pos">{{ item.pos }}</span>
            </div>
            <div class="con">
              <div class="con-list">
                <p>
                  <span class="temperature">{{ item.tt401_value_avg }}</span>
                  <span style="color: #cacaca; margin-left: 3px">°C</span>
                </p>
                <span class="average">平均室温</span>
              </div>
              <div class="con-list">
                <p>
                  <span class="temperature">{{ item.household_type_low }}</span>户
                </p>
                <span class="average">过冷住户</span>
              </div>
              <div class="con-list">
                <p>
                  <span class="temperature">{{ item.household_type_high }}</span>户
                </p>
                <span class="average">过热住户</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, toRefs} from "vue";

const model = reactive({
  listData:[]
})
const {listData} = toRefs(model)

onMounted(()=>{
  model.listData =  [
    {
      floor_level_type: '高区组名称', // 名称
      select: false,
      pos: '16F~22F', // 楼层
      tt401_value_avg: '20.1', // 平均室温
      household_type_low: 2,
      household_type_high: 3
    },
    {
      floor_level_type: '中区组名称',
      pos: '9F~15F',
      select: false,
      tt401_value_avg: '24.4',
      household_type_low: 2,
      household_type_high: 3
    },
    {
      floor_level_type: '低区组名称',
      pos: '1F~8F',
      select: false,
      tt401_value_avg: '23.7',
      household_type_low: 2,
      household_type_high: 3
    }
  ]
})

const setCamera = (row) => {
  model.listData.forEach((x) => (x.select = false));
  row.select = true;
}

</script>

<style lang="scss" scoped>
.gradientBtn-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 500px;
  height: max-content;

  .building-floor-menu {
    display: flex;

    .building-floor-menu-item {
      display: flex;
      flex-direction: column;
      width: 112px;
      height: 112px;
      padding: 12px;
      border: 1px solid transparent;
      background: rgba(38, 38, 38, 0.8);
      box-shadow: -10px 0px 22px 0px rgba(0, 0, 0, 0.22);
      border-radius: 4px;
      box-sizing: border-box;
      margin-right: 10px;
      user-select: none;
      transition: all 0.5s ease-in-out 0.3s;
      cursor: pointer;

      &.select {
        width: 250px;
        border: 1px solid #fff;

        .inner-box {
          width: 250px;
        }
      }

      .inner-box {
        width: 80px;
        overflow: hidden;
        transition: all 0.5s ease-in-out 0.3s;

        .real-box {
          width: 225px;

          .name {
            display: flex;
            justify-content: space-between;
            flex-wrap: nowrap;
            overflow: hidden;

            .tit {
              font-size: 14px;
              color: #ffffff;
              letter-spacing: 0;
              font-weight: 500;
            }

            .pos {
              font-size: 12px;
              color: #cccccc;
              letter-spacing: 0;
              font-weight: 400;
            }
          }

          .con {
            display: flex;
            justify-content: space-between;

            .con-list {
              width: 80px;
              height: 68px;
              margin-right: 18px;

              p {
                margin: 15px 0 5px;

                .temperature {
                  font-size: 24px;
                  color: #ffffff;
                  letter-spacing: 0;
                  line-height: 16px;
                  font-weight: 400;
                }

                span {
                  font-size: 12px;
                  color: #cacaca;
                  letter-spacing: 0;
                  font-weight: 200;
                }
              }

              .average {
                opacity: 0.5;
                font-size: 12px;
                color: #ffffff;
                letter-spacing: 0;
                line-height: 16px;
                font-weight: 400;
              }
            }
          }
        }
      }
    }
  }
}
</style>
