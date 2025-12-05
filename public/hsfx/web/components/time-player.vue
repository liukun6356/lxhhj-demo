<template>
    <div class="time-player" v-show="!!timeRange" v-bind="$attrs">
        <span class="play-icon" @click="play = !play" :class="play ? 'icon-pause' : 'icon-play'"></span>
        <div class="slider-wrapper">
            <CustomSlider class="timer" always-show :model-value="curTime"
                @update:model-value="(v: number) => curTime = v" :step="step || 1" :min="timeRange?.min || 0"
                :max="timeRange?.max || 1" :format-tooltip="timeFormat" @start-drag="isDrag = true"
                @end-drag="isDrag = false">
            </CustomSlider>
            <span class="begin">{{ startLabel }}</span>
            <span class="end">{{ endLabel }}</span>
        </div>
        <el-tooltip placement="top">
            <template #content>
                <div class="rate-item" v-for="item in rates" @click="handleToggelRate(item)"
                    :class="playRate === item ? 'is-active' : null">
                    {{ item }}x
                </div>
            </template>
            <span class="play-rate">{{ playRate?.toFixed(1) + "" }}X</span>
        </el-tooltip>
    </div>
</template>

<script setup lang="ts">
import { isNil } from "es-toolkit";
import CustomSlider from "./custom-slider.vue";
import { ElTooltip } from "element-plus";
defineOptions({
    inheritAttrs: true
});
const play = defineModel<boolean>('play');
const curTime = defineModel<number>('curTime');
const playSpeed = defineModel<number>('playSpeed');
const playRate = defineModel<number>('playRate', { default: 1 });

const $props = withDefaults(
    defineProps<{
        timeRange: { min: number; max: number };
        step: number; //手动拖拽或键盘触发的间隔
        timeFormat?: (v: number) => string | number;
        playingBefore?: (t: number) => boolean;
        rates?: number[]; //倍率选择列表
    }>(),
    {
        timeFormat: (time: number) => time,
        rates: () => [0.5, 1.0, 2.0, 3.0],
    }
);

const startLabel = computed(() => {
    const v = $props.timeRange?.min;
    if (isNil(v) || isNaN(v)) return "";
    return $props.timeFormat ? $props.timeFormat(v) : v;
});
const endLabel = computed(() => {
    const v = $props.timeRange?.max;
    if (isNil(v) || isNaN(v)) return "";
    return $props.timeFormat ? $props.timeFormat(v) : v;
});

const isDrag = ref(false);

let timer: number;
watch(
    () => play.value,
    (v) => {
        if (!v) {
            cancelAnimationFrame(timer);
            return;
        }
 
        if (!$props.timeRange) return;
        const { min, max } = $props.timeRange;

        if (curTime.value >= max) {
            curTime.value = min;
        }

        timer = requestAnimationFrame(function step() {
            const forward = (playSpeed.value || 1) * playRate.value;
            const nextTime = curTime.value + forward;

            const beforeCheck = $props.playingBefore ? $props.playingBefore(nextTime) : true;
            if (!beforeCheck || isDrag.value) {
                timer = requestAnimationFrame(step);
                return;
            }
            curTime.value = nextTime;
            if (nextTime >= max) {
                play.value = false;
                return;
            }
            timer = requestAnimationFrame(step);
        });
    },
    { immediate: true }
);

function handleToggelRate(rate: number) {
    playRate.value = rate;
}
</script>

<style lang="scss">
.time-player {
    background-color: rgba(0, 0, 0, 0.6);
    padding: 10px 20px;
    border-radius: 40px;
    color: white;
    pointer-events: auto;
    display: flex;
    align-items: center;

    .el-slider {
        --el-slider-main-bg-color: rgba(159, 197, 255, 1);
        --el-slider-runway-bg-color: rgba(56, 141, 252, 0.5);
        --el-slider-height: 3px;
        --el-slider-button-size: 16px;
        --el-slider-button-wrapper-size: 32px;
    }

    .el-slider__button {
        background-color: rgba(159, 197, 255, 1);
    }

    .play-icon {
        display: inline-block;
        width: 20px;
        height: 20px;
        transform: scale(1.2);
        cursor: pointer;
        background-size: cover;

        &.icon-play {
            background-image: url("web/assets/playeCircle.png");
        }

        &.icon-pause {
            background-image: url("web/assets/pauseCircle.png");
        }
    }

    .slider-wrapper {
        flex: 1;
        margin: 0 10px 0 20px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        font-family: SourceHanSansCN-Medium;
        color: yellowgreen;
        transform: translateY(10px);

        span.begin {
            text-align: left;
            transform: translateY(-10px);
            color: rgba(159, 197, 255, 1);
        }

        span.end {
            text-align: right;
            color: rgba(159, 197, 255, 1);
            transform: translateY(-10px);
        }
    }

    .custom-slider {
        grid-column: span 2;
    }

    .play-rate {
        margin-left: 10px;
    }

    .rate-item {
        cursor: pointer;

        &:hover,
        &.is-active {
            color: var(--el-color-primary);
        }
    }
}
</style>
