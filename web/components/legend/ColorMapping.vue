<template>
    <component :is="CompMap[type]" v-bind="data"></component>
</template>

<script setup lang="ts">
import type { Component, ComponentPropsOptions } from 'vue';
import Classbreak from './Classbreak.vue';
import Ramp from './Ramp.vue';
const props = defineProps<{
    type: 'classbreak' | 'ramp',
    data: ComponentPropsOptions<typeof Ramp | typeof Classbreak>
}>();
const CompMap = {
    'ramp': Ramp,
    'classbreak': Classbreak
} as Record<string, Component>;
</script>

<style lang="scss"></style>