<template>
    <div :class="$style.wrapper" :style="{
        '--size': size + 'px'
    }">
        <img v-for="item in arrows" :src="item" @click="active = item"
        :class="[item === active ? 'is-active' : null, $style.item]">
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    arrows: string[],
    size?: number
}>(), {
    size: 32
});
const emits = defineEmits<{

}>();
const active = defineModel<string>();
</script>

<style lang="scss" module>
.wrapper {
    display: flex;
    gap: 10px;
    padding: 2px 0;
}

.item {
    background-size: cover;
    width: var(--size);
    height: var(--size);
    &:hover, &:global(.is-active) {
        box-shadow: 0 0 0 1px rgb(233, 83, 83);
    }
}


</style>