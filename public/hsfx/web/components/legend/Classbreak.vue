<template>
    <div :class="[$style.wrapper, direction === 'horizon' ? 'h' : 'v']" :style="{ '--h': breaks.length * 24 + 'px' }">
        <div :style="style" class="colorbar"></div>
        <div class="inner">
            <label>{{ format(breaks[0]?.min) }}</label>
            <label v-for="(item, index) in breaks" :style="{
                '--d': 100 * (index + 1) / breaks.length + '%'
            }">{{ format(item.max) }}</label>
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref,shallowRef,computed,watch   } from "vue"
import { type Break, type ColorMappingClassbreakProperties, formatBreaks } from 'web/arcgis/supports/colorMapping/classbreak';

const props = withDefaults(defineProps<{
    direction?: 'vertical' | 'horizon';
    breaks: ColorMappingClassbreakProperties['breaks']
    format?: (v: number) => any
}>(), {
    direction: "horizon",
    format: (v: number) => v ?? ''
});
const colors = ref<string>();
const breaks = shallowRef<Break[]>([]);
const style = computed(() => {
    const dir = props.direction === 'horizon' ? 'right' : 'top';
    return {
        'background-image': colors.value
            ? `linear-gradient(to ${dir}, ${colors.value})`
            : null,
    }
});
watch(() => props.breaks, b => {
    if (!b) return colors.value = null;
    const bs = breaks.value = formatBreaks(b);
    const per = 100 / bs.length;
    colors.value = bs.map((b, index) => {
        return `${b.color} ${(index * per).toFixed(1)}%, ${b.color} ${((index + 1) * per).toFixed(1)}%`;
    }).join(',');
}, { immediate: true })

</script>

<style lang="scss" module>
.wrapper {
    --d: 0;

    &:global(.h) {
        padding: 0 20px;

        :global {
            .inner {
                position: relative;
                height: 24px;
                margin-top: 5px;
            }

            .colorbar {
                height: 24px;
                width: 100%;
            }

            label {
                position: absolute;
                left: var(--d);
                transform: translateX(-50%);
            }
        }
    }

    &:global(.v) {
        display: flex;
        padding: 10px;
        align-items: stretch;
        :global {
            .inner {
                position: relative;
            }

            .colorbar {
                width: 24px;
                height: var(--h);
            }

            label {
                position: absolute;
                bottom: var(--d);
                left: 5px;
                transform: translateY(50%);
            }
        }
    }
}
</style>
