<template>
    <div class="custom-slider" ref="el">
        <el-slider v-bind="$attrs" :show-tooltip="false" :min="min" :max="max" :model-value="modelValue"></el-slider>
        <div v-show="showTip" class="tip" :style="tipStyle">
            <span>{{ formatValue }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ElSlider } from 'element-plus';
defineOptions({
    inheritAttrs: false,
});
const props = defineProps<{
    modelValue: number;
    min: number;
    max: number;
    formatTooltip?: (v: number) => number | string;
    alwaysShow?: boolean;
}>();
const emit = defineEmits<{
    (e: "start-drag"): void;
    (e: "end-drag"): void;
}>();
const el = ref<HTMLDivElement>();
const hoverShow = ref(false);
const showTip = computed(() => {
    return props.alwaysShow ? true : hoverShow.value;
});
const formatValue = computed(() => {
    if (props.formatTooltip) {
        return props.formatTooltip(props.modelValue as any);
    } else {
        return props.modelValue;
    }
});
const tipStyle = ref(null as any);
watch(
    () => props.modelValue as number,
    (v) => {
        const min = props.min,
            max = props.max;
        const percent = (v - min) / (max - min);
        if (isNaN(percent)) {
            tipStyle.value = { display: "hidden" };
        } else {
            tipStyle.value = { left: percent * 100 + "%" };
        }
    },
    { immediate: true }
);
const offs = [] as (() => void)[];
onMounted(() => {
    const trigger = el.value.querySelector(".el-slider__button-wrapper") as HTMLElement;
    const ac = new AbortController();
    trigger.addEventListener('mouseenter', () => (hoverShow.value = true), { signal: ac.signal });
    trigger.addEventListener('mouseleave', () => (hoverShow.value = false), { signal: ac.signal });
    let off: () => void;
    trigger.addEventListener('mousedown', () => {
        off?.();
        emit("start-drag");
        const ac1 = new AbortController();
        off = () => ac1.abort();
        document.body.addEventListener('mouseup', () => {
            emit('end-drag');
            off();
            off = null;
        }, { signal: ac1.signal });
    }, { signal: ac.signal });

    offs.push(() => {
        ac.abort();
        off?.();
    });
});
onUnmounted(() => offs.forEach((f) => f()));
</script>

<style lang="scss">
.custom-slider {
    position: relative;

    .tip {
        position: absolute;
        top: 50%;
        pointer-events: none;
        padding: 5px 10px;
        transform: translate(-50%, calc(-100% - 20px));
        white-space: nowrap;
        --color: rgba(0, 0, 0, 0.5);
        background-color: var(--color);
        filter: drop-shadow(0 0 2px black);
        border-radius: 4px;

        &::before {
            content: "";
            position: absolute;
            left: 50%;
            bottom: 0;
            width: 0px;
            height: 0px;
            border: 10px solid transparent;
            border-right-color: var(--color);
            border-bottom-color: var(--color);
            transform: translate(-50%, 50%) rotate(45deg) scale(0.5);
        }
    }
}
</style>
