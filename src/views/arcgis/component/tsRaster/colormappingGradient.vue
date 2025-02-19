<template>
  <div class="wrapper">
    <span>{{ valueRange?.[0]?.toFixed(2) }}</span>
    <img :src="src"/>
    <span>{{ valueRange?.[1]?.toFixed(2) }}</span>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from "vue"

type GradientColorMapping = {
  type: "gradient";
  valueRange: number[];
  truncHead?: boolean; //截断头部, 若截断, 小于min的值 会变为透明色, 默认false
  truncTail?: boolean; //截断尾部, 若截断, 大于max的值 会变为透明色, 默认false
  stops: /* 自定义图片url */
      | string
      /*
      颜色数组, 平分0-1区间
      [red,green,blue]
      等价于=>
      {value:1/4, color:red},
      {value:2/4, color:green},
      {value:3/4, color:blue},
  */
      | string[]
}

const props = defineProps<{
  data: GradientColorMapping|null
}>();
const src = ref("");
const valueRange = ref<number[]>();



const createGradientColorMappingFromStops = (stopDef, width, height) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.height = Math.floor(height ?? 1);
  canvas.width = Math.floor(width ?? 128);
  let stops;
  if (typeof stopDef[0] === "string") {
    const length = stopDef.length + 1;
    stops = new Array(stopDef.length).fill(0).map((_, index) => {
      return {
        value: (index + 1) / length,
        color: stopDef[index] as string,
      };
    });
  } else {
    stops = ([...stopDef]).sort((a, b) => a.value - b.value);
  }
  if (!stops.length) throw new Error("GradientColorRamp参数错误");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  for (let {value, color} of stops) {
    gradient.addColorStop(value, color);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("png");
}

watch(()=>props.data,()=>{
  if(!props.data)return
  const d = props.data
  valueRange.value = d.valueRange;
  src.value = Array.isArray(d.stops) ? createGradientColorMappingFromStops(d.stops, 128, 32) : d.stops;
},{immediate:true})
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  align-items: center;
  padding: 10px;

  img {
    display: block;
    width: 128px;
    height: 20px;
    object-fit: fill;
    margin: 0 10px;
  }
}
</style>
