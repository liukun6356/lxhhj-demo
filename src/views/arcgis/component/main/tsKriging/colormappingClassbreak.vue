<template>
  <div class="wrapper">
    <div class="item" v-for="item in breaks" :style="{'--color': item.color  }">
      <span class="icon"></span>
      <span class="text">{{ item.min?.toFixed(2) }}</span>
    </div>
    <span style="margin-left: 25px;transform: translateY(50%);">{{ max }}</span>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, computed, watch} from "vue"

type ClassBreakColorMapping = {
  type: "class-break";
  truncHead?: boolean; //截断头部, 若截断, 小于第一个min的值 会变为透明色, 默认false
  truncTail?: boolean; //截断尾部, 若截断, 大于最后一个max的值 会变为透明色, 默认false
  breaks: /*
        所有颜色均匀分配[min,max]区间
        { min:0, max:1, colors:[red,green,blue] }
        等价于 =>
        { min:0, max: 1/3, color: red},
        { min:1/3, max: 2/3, color: green},
        { min:2/3, max: 1, color: blue},
    */
     { min: number;  max: number; colors: string[]}
};

const props = defineProps<{
  data: ClassBreakColorMapping;
}>();

const breaks = ref<{ min: number; max: number; color: string }[]>([]);
const max = computed(() => {
  const arr = breaks.value
  if (!arr?.length) return ''
  return arr.slice(-1)[0].max.toFixed(2)
})

watch(()=>props.data,()=>{
  console.log(props.data)
  if(!props.data)return
  breaks.value =  props.data.breaks;
},{immediate:true})

</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column-reverse;
  padding: 0 20px;
  margin-bottom: 10px;

  .item {
    display: flex;
    align-items: flex-start;
  }

  .icon {
    width: 20px;
    height: 30px;
    display: inline-block;
    background-color: var(--color);
    margin-right: 5px;
  }

  .text {
    transform: translateY(24px);
  }
}
</style>
