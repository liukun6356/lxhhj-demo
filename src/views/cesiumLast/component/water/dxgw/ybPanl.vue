<!--/**
* @author: liuk
* @date: 2024-12-12
* @describe:预报进度面板
*/-->
<template>
  <teleport to="body">
    <div :class="'ybPanl-area ' + props.class">
      <div class="ctrl-row" v-if="false">
        <el-form-item label="开始时间">
          <el-date-picker v-model="formData.startTime" type="datetime" placeholder="开始时间"
                          :disabled-date="disabledDateFn"
                          format="YYYY-MM-DD HH:mm" :clearable="false" popper-class="hour-picker-popper"
                          @change="startTimeChange"/>
        </el-form-item>
        <el-form-item label="时段">
          <el-input-number v-model="formData.range" :min="1" :max="maxTimeFrame"/>
          &nbsp h
        </el-form-item>
        <el-form-item label="">
          <el-button class="submitBtn" type="primary" @click="submit">确定</el-button>
        </el-form-item>
      </div>
      <div class="time-player">
        <span class="play-icon" @click="togglePlay" :class="playFlag ? 'icon-pause' : 'icon-play'"/>
        <el-slider v-model="curTime" :disabled="playFlag"
                   :show-tooltip="false" :min="sliderTimeRang[0]" :max="sliderTimeRang[1]" tooltip-class="toolTip"
                   :step="60*60*1e3" style="width: 800px;margin-left: 10px"/>
        <div class="tip-area">
          <div class="tip" ref="tipRef">
            <slot name="tip" :time="curTime"/>
            <!--<span>{{ moment(curTime).format(`YYYY-MM-DD HH:mm:ss`) }}</span>-->
          </div>
          <div class="min-val">
            <slot name="val" :time="sliderTimeRang[0]"/>
            <!--{{ moment(sliderTimeRang[0]).format(`YYYY-MM-DD HH:mm:ss`) }}-->
          </div>
          <div class="max-val">
            <slot name="val" :time="sliderTimeRang[1]"/>
            <!--{{ moment(sliderTimeRang[1]).format(`YYYY-MM-DD HH:mm:ss`) }}-->
          </div>
        </div>
        <el-select class="tip-area-select" v-model="speedType" size="small" style="width: 35px" :disabled="playFlag"
                   @change="playFlag = false">
          <el-option v-for="item in speedOptions" :key="item.value" :label="item.label" :value="item.value"/>
        </el-select>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import {reactive, toRefs, onMounted, watch, ref, withDefaults} from "vue";
import moment from "moment"
import {ElMessage} from "element-plus";

// Props
interface SelTimeRang {
  start: number // 开始时间戳
  end: number // 结束时间戳
}

interface Props {
  selTimeRang: SelTimeRang //必传，数据时间区间
  class?: string // 类目
  timeType?: "h" | "m" | "s" // 需反应时间点类型,小时级|分钟级|秒级
  defaultRange?: number // 默认时段数
  defaultStartTime?: number// 默认开始时间戳
}

const props = withDefaults(defineProps<Props>(), {
  defaultRange: 48,
  timeType: "h"
})

// Emits
const emits = defineEmits<{
  (e: "timeChange", timestamp: number): void // 时间段变化(过滤器所需格式，如小时级，分钟级)
}>()

// Refs
const tipRef = ref(null)

const model = reactive({
  formData: {
    startTime: 0, // 开始时间
    range: 24,// 时段数
  },
  speedType: 1,// 播放速度
  playFlag: false,// 是否播放
  curTime: 0, // 当前时间
  sliderTimeRang: [0, 0],// 滑块时间段
  maxTimeFrame: 1,//时段数可选择的最大值
})

const {formData, speedType, playFlag, curTime, sliderTimeRang, maxTimeFrame} = toRefs(model)

watch(() => model.curTime, (v) => {
  tipRef.value.style.left = (v - model.sliderTimeRang[0]) / (model.sliderTimeRang[1] - model.sliderTimeRang[0]) * 100 + "%"
  if (model.curTime % getTimeType(props.timeType) === 0) emits("timeChange", model.curTime)
})

onMounted(() => {
  // 如果 defaultStartTime不在数据时间区间，默认取数据时间区间的第一个时间点
  if (props.defaultStartTime && props.defaultStartTime >= props.selTimeRang.start && props.defaultStartTime <= props.selTimeRang.end) {
    model.formData.startTime = props.defaultStartTime
    model.maxTimeFrame = (props.selTimeRang.end - props.defaultStartTime) / (1e3 * 60 ** 2)
    model.formData.range = model.maxTimeFrame < props.defaultRange ? model.maxTimeFrame : props.defaultRange
  } else {
    model.formData.startTime = props.selTimeRang.start
    model.maxTimeFrame = (props.selTimeRang.end - props.selTimeRang.start) / (1e3 * 60 ** 2)
    model.formData.range = model.maxTimeFrame < props.defaultRange ? model.maxTimeFrame : props.defaultRange
  }
  submit()
})

const disabledDateFn = (time: any) => time.getTime() < props.selTimeRang.start - 24 * 60 * 60 * 1e3 || time.getTime() > props.selTimeRang.end

const startTimeChange = (v) => {
  if (moment(v).valueOf() > props.selTimeRang.end || moment(v).valueOf() < props.selTimeRang.start) {
    ElMessage.warning(`选择时间请在${moment(props.selTimeRang.start).format("YYYY-MM-DD HH:00")}到${moment(props.selTimeRang.end).format("YYYY-MM-DD HH:00")}区间内`)
    model.formData.startTime = props.selTimeRang.start || moment().valueOf()
    return
  }
  model.maxTimeFrame = (props.selTimeRang.end - v) / (1e3 * 60 ** 2)
}

let timer
const togglePlay = () => {
  model.playFlag = !model.playFlag
  if (model.playFlag) {
    if (model.curTime >= model.sliderTimeRang[1]) model.curTime = model.sliderTimeRang[0]
    timer = window.setInterval(() => {
      if (model.curTime >= model.sliderTimeRang[1]) {
        window.clearInterval(timer)
        model.playFlag = false
        return
      }
      model.curTime += 60 * 1e3
    }, 1000 / model.speedType / 60)
  } else {
    window.clearInterval(timer)
  }
}

const submit = () => {
  model.playFlag && togglePlay()
  model.sliderTimeRang = [+model.formData.startTime, +model.formData.startTime + model.formData.range * 60 * 60 * 1e3]
  model.curTime = model.sliderTimeRang[0]
}

const getTimeType = (type) => {
  switch (type) {
    case "h":
      return 60 ** 2 * 1e3
    case "m":
      return 60 ** 1 * 1e3
    case "s":
      return 1e3
  }
}

const speedOptions = [
  {label: "0.5x", value: 0.5},
  {label: "1x", value: 1},
  {label: "2x", value: 2},
  {label: "3x", value: 3},
]

</script>

<style lang="scss" scoped>
.ybPanl-area {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 930px;
  height: 60px;
  background-color: rgba(0, 31, 50, 0.50);
  padding: 10px 5px 0;
  box-sizing: border-box;

  .ctrl-row {
    display: flex;
    align-items: center;
    padding-left: 5px;
    box-sizing: border-box;

    .submitBtn {
      width: 80px;
      background: rgba(51, 173, 183, 1);
    }
  }

  .time-player {
    display: flex;
    align-items: center;
    position: relative;

    .play-icon {
      display: inline-block;
      width: 22px;
      height: 22px;
      margin-left: 10px;

      &.icon-play {
        background: url("@/assets/images/playeCircle.png") no-repeat center/cover;
      }

      &.icon-pause {
        background: url("@/assets/images/pauseCircle.png") no-repeat center/cover;
      }
    }

    .tip-area {
      position: absolute;
      top: 16px;
      left: 42px;
      height: 1px;
      width: 800px;
      font-size: 12px;

      .tip {
        position: absolute;
        top: 46px;
        left: 0;
        z-index: 1;
        pointer-events: none;
        padding: 0px 3px;
        transform: translate(-50%, calc(-100% - 20px));
        white-space: nowrap;
        background: rgba(46, 165, 255, 1);
        filter: drop-shadow(0 0 2px black);
        font-size: 12px;
        color: #fff;
        border-radius: 50px;

        &::before {
          content: "";
          position: absolute;
          left: 50%;
          top: -18px;
          width: 0px;
          height: 0px;
          border: 10px solid transparent;
          border-right-color: rgba(46, 165, 255, 1);
          border-bottom-color: rgba(46, 165, 255, 1);
          transform: translate(-50%, 50%) rotate(-135deg) scale(0.5);
        }
      }

      .min-val {
        position: absolute;
        top: 10px;
        left: 0;
      }

      .max-val {
        position: absolute;
        top: 10px;
        right: 0;
      }
    }

    .tip-area-select {
      margin-left: 15px;

      :deep(.el-select__wrapper) {
        .el-select__suffix {
          display: none;
        }
      }
    }
  }
}

:deep(.el-slider) {
  --el-slider-disabled-color: #409eff;

  .el-slider__button-wrapper {
    .el-slider__button {
      width: 11px;
      height: 11px;
      border: 2px solid rgba(46, 165, 255, 1);
    }
  }
}

:deep(.el-form-item) {
  margin-right: 20px;

  &.el-form-item--default {
    margin-bottom: 0;
  }

  label {
    color: #fff;
  }

  .el-checkbox {
    .el-checkbox__label {
      color: #fff;
    }

    .el-checkbox__input {
      .el-checkbox__inner {
        background-color: transparent; /* 设置选中时的背景色 */
      }

      &.is-checked {
        .el-checkbox__inner {
          background-color: rgb(51, 173, 183); /* 设置选中时的背景色 */
          border-color: #20A0AA; /* 设置选中时的边框颜色 */

        }
      }
    }
  }

  .el-input {
    background: rgba(51, 173, 183, 0.20);
  }

  .el-input-number {
    .el-input-number__decrease, .el-input-number__increase {
      background: rgba(51, 173, 183, 0.8);

      .el-icon {
        color: #fff;
      }
    }
  }

  .el-select {
    width: 150px;
    background: rgba(51, 173, 183, 0.20);
  }
}
</style>
