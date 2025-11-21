<template>
  <div class="my-header">
    <div class="left_title">{{ props.data.label }}</div>
    <div class="close_box" @click="emit('icon-close')">
      <img src="@/assets/images/close@2x.png" alt=""/>
      <span>返回</span>
    </div>
  </div>
  <div class="content_wrap">
    <div class="chart-area">
      <station-information :data="chartData"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, toRefs} from "vue";
// Component
import StationInformation from "./numericalValueDialogChart.vue"
// Props
const props = defineProps(['data'])
// Emits
const emit = defineEmits(['icon-close'])

const model = reactive({
  chartData: [],
})

const {chartData} = toRefs(model)

onMounted(() => {
  getlist()
})

const getlist = () => {
  // const data = prolusionStore.waterData.map(item => ({
  //   time: +item.timeStamp,
  //   flow: item.flow[props.data.index],
  //   water: item.waterSurface[props.data.index],
  // }))
  // setTimeout(() => {
  //   model.chartData = data
  // }, 500)
}

</script>

<style lang="scss" scoped>
.content_wrap {
  margin-top: 20px;
  height: calc(100% - 55px);
  .chart-area{
    width: 100%;
    height: 100%;
  }
}
</style>