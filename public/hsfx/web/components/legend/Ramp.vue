<template>
    <div :class="direction === 'horizon' ? $style.h : $style.v" :style="{ '--h': height + 'px' }">
        <img :src="src"></img>
        <label max>{{ format(range?.[1]) }}</label>
        <label min>{{ format(range?.[0]) }}</label>
    </div>
</template>

<script lang="ts">
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
</script>
<script setup lang="ts">
import {ref,watch,} from "vue"
import { buildRampImage, type Stops } from 'web/arcgis/supports/colorMapping/ramp';

const props = withDefaults(defineProps<{
    direction?: 'vertical' | 'horizon';
    height?: number, //vertical 需要提供
    stops: Stops
    range: number[],
    format?: (v: number) => any
}>(), {
    direction: "horizon",
    height: 120,
    format: (v: number) => v ?? ''
});
const src = ref<string>();
watch(() => props.stops, async s => {
    if (!s) return src.value = null;
    if (typeof s === 'string') {
        src.value = s;
    } else {
        const image = buildRampImage(s);
        canvas ??= document.createElement('canvas');
        ctx ??= canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.putImageData(image, 0, 0)
        const imgSrc = canvas.toDataURL();
        if (s !== props.stops) return;
        src.value = imgSrc;
    }
}, { immediate: true })

</script>

<style lang="scss" module>
.h {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    overflow: hidden;
    padding: 10px 20px;
    gap: 4px;

    :global {
        img {
            width: 100%;
            height: 24px;
            object-fit: fill;
        }

        label[max] {
            order: 1;
        }
    }
}

.v {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    position: relative;
    height: var(--h);
    margin: 10px;
    padding-left: 30px;

    :global {
        img {
            position: absolute;
            left: 0;
            top: 0;
            width: var(--h);
            height: 24px;
            object-fit: fill;
            transform-origin: 0 0;
            transform: rotate(-90deg) translateX(-100%);
        }
    }
}
</style>
