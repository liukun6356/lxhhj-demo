<template>
  <teleport to="body">
    <div :class="'ybPanl-area ' + props.class">
      <div class="time-player">
        <span class="play-icon" @click="prolusionStore.toggleYbPlay()" :class="playFlag ? 'icon-pause' : 'icon-play'"/>
        <el-slider v-model="curTime" :disabled="playFlag"
                   :show-tooltip="false" :min="sliderTimeRang[0]" :max="sliderTimeRang[1]" tooltip-class="toolTip"
                   :step="props.step" :style="{width: sliderWidth, marginLeft: '1rem'}"/>
        <div class="tip-area" :style="{width: sliderWidth}">
          <div class="tip" ref="tipRef">
            <span>{{ moment(curTime + props.timeOffset).format(`YYYY-MM-DD HH:mm`) }}</span>
          </div>
          <div class="min-val">{{ moment(sliderTimeRang[0] + props.timeOffset).format(`YYYY-MM-DD HH:mm`) }}</div>
          <div class="max-val">{{ moment(sliderTimeRang[1] + props.timeOffset).format(`YYYY-MM-DD HH:mm`) }}</div>
        </div>
        <el-select class="tip-area-select bottomCenterScale" v-model="speedType" size="small" style="width: 35px"
                   :disabled="playFlag"
                   popper-class="leftTopScale overFlowOut select190" @change="prolusionStore.stopYbPlay()">
          <el-option v-for="item in speedOptions" :key="item.value" :label="item.label" :value="item.value"/>
        </el-select>
        <span v-if="props.showRefresh" class="refresh-btn" title="刷新" @click="emits('refresh')"><el-icon><Refresh/></el-icon></span>
      </div>
    </div>
  </teleport>
</template>
<script lang="ts" setup>
import {onMounted, watch, ref, withDefaults, computed, toRefs} from "vue";
import moment from "moment"
import {useprolusionStore} from "@/store/modules/prolusion";
interface SelTimeRang {
  start: number
  end: number
}
interface Props {
  selTimeRang: SelTimeRang
  class?: string
  timeType?: "h" | "m" | "s"
  defaultRange?: number
  defaultStartTime?: number
  step?: number
  timeOffset?: number
  showRefresh?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  defaultRange: 24,
  timeType: "h",
  step: 60 * 60 * 1e3,
  timeOffset: 0,
  showRefresh: false,
})
const emits = defineEmits<{
  (e: "timeChange", timestamp: number): void
  (e: "refresh"): void
}>()
const tipRef = ref(null)
const prolusionStore = useprolusionStore()
const {curTime, sliderTimeRang, playFlag, speedType} = toRefs(prolusionStore.ybTime)
const sliderWidth = computed(() => props.showRefresh ? '79rem' : '81rem')
const initTimeRang = () => {
  let startTime
  if (props.defaultStartTime && props.defaultStartTime >= props.selTimeRang.start && props.defaultStartTime <= props.selTimeRang.end) {
    startTime = props.defaultStartTime
  } else {
    startTime = props.selTimeRang.start
  }
  const maxTimeFrame = (props.selTimeRang.end - startTime) / (1e3 * 60 ** 2)
  const range = maxTimeFrame < props.defaultRange ? maxTimeFrame : props.defaultRange
  const [min, max] = prolusionStore.ybTime.sliderTimeRang
  if (prolusionStore.ybTime.playFlag && min === +startTime && max === +startTime + range * 60 * 60 * 1e3) return
  prolusionStore.resetYbTime(startTime, range)
}
watch(() => props.timeOffset, (v) => prolusionStore.setYbTime({timeOffset: v || 0}), {immediate: true})
watch(() => prolusionStore.ybTime.curTime, (v) => {
  tipRef.value.style.left = (v - sliderTimeRang.value[0]) / (sliderTimeRang.value[1] - sliderTimeRang.value[0]) * 100 + "%"
  if (v % getTimeType(props.timeType) === 0) emits("timeChange", v)
})
watch(() => props.defaultStartTime, () => prolusionStore.setYbTime({curTime: props.defaultStartTime}))
watch(() => props.defaultRange, initTimeRang)
onMounted(initTimeRang)
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
  display: flex;
  position: fixed;
  bottom: 3.8rem;
  left: 50%;
  transform: translateX(-50%);
  width: 93rem;
  height: 5rem;
  background-color: rgba(0, 31, 50, 0.6);
  padding: 0 0.5rem;
  box-sizing: border-box;
  .time-player {
    display: flex;
    align-items: center;
    position: relative;
    .play-icon {
      display: inline-block;
      width: 2.2rem;
      height: 2.2rem;
      margin-left: 1rem;
      &.icon-play {
        background: url("@/assets/images/playeCircle.png") no-repeat center/cover;
      }
      &.icon-pause {
        background: url("@/assets/images/pauseCircle.png") no-repeat center/cover;
      }
    }
    .tip-area {
      position: absolute;
      top: 1.6rem;
      left: 4.2rem;
      height: 0.1rem;
      font-size: 1.2rem;
      .tip {
        position: absolute;
        top: 5.2rem;
        left: 0;
        z-index: 1;
        pointer-events: none;
        padding: 0 0.3rem;
        transform: translate(-50%, calc(-100% - 2rem));
        white-space: nowrap;
        background: rgba(46, 165, 255, 1);
        filter: drop-shadow(0 0 0.2rem black);
        font-size: 1.2rem;
        color: #fff;
        border-radius: 5rem;
        &::before {
          content: "";
          position: absolute;
          left: 50%;
          top: -1.8rem;
          width: 0;
          height: 0;
          border: 1rem solid transparent;
          border-right-color: rgba(46, 165, 255, 1);
          border-bottom-color: rgba(46, 165, 255, 1);
          transform: translate(-50%, 50%) rotate(-135deg) scale(0.5);
        }
      }
      .min-val {
        position: absolute;
        top: 1rem;
        left: 0;
        color: #fff;
      }
      .max-val {
        position: absolute;
        top: 1rem;
        right: 0;
        color: #fff;
      }
    }
    .refresh-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.4rem;
      height: 2.4rem;
      margin-left: 1rem;
      color: #66c2ff;
      font-size: 1.6rem;
      cursor: pointer;
      &:hover {
        color: #fff;
      }
    }
    .tip-area-select {
      margin-left: 1.5rem;
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
      width: 1.1rem;
      height: 1.1rem;
      border: 0.2rem solid rgba(46, 165, 255, 1);
    }
  }
}
:deep(.el-form-item) {
  margin-right: 2rem;
  &.el-form-item--default {
    margin-bottom: 0;
  }
  label {
    color: #fff;
  }
  .el-select {
    width: 15rem;
    background: rgba(51, 173, 183, 0.20);
  }
}
</style>
