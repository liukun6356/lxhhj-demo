<!--/**
 * @author: liuk
 * @date: 2024-07-30
 * @describe: 测站-水库站点位弹框-降雨过程图表
 */-->
<template>
  <div ref="chatDom" class="reservoirProcessChart"></div>
</template>

<script lang="ts" setup>
import {ref, onMounted, watch, nextTick, defineProps} from "vue"
import * as echarts from 'echarts'
import {getEquiUnit, formatToFixed} from "@/utils/dictionary"
import moment from "moment";
// Props
const props = defineProps(['data'])

let myChart = null // Vue3 使用 proxy 对象代理，而 echarts 则使用了大量的全等（===）, 对比失败从而导致了bug。
const chatDom = ref(null)

watch(() => props.data, (data) => {
  nextTick(() => {
    drawChart()
    const option = myChart.getOption()
    if (data.length) {
      myChart.clear()
      myChart.setOption(renderFn(option, data))
    }
  })
}, {immediate: true})

const renderFn = (option, data) => {
  const temp = data.map(item => {
    const {reservoir, maximumFloodLevel, restrictedWaterLevel} = item
    return Object.values({reservoir, maximumFloodLevel, restrictedWaterLevel})
  }).flat().filter(item => item)
  const maxValue = Math.max.apply(null, temp) + 20
  const minValue = Math.min.apply(null, temp) - 20
  option.dataZoom[0].end = data.length ? 48 * 1e2 / data.length : 100
  option.yAxis[0].min = minValue - 5 > 0 ? formatToFixed(minValue - 5, 0) : 0
  option.yAxis[0].max = formatToFixed(maxValue + 5, 0)
  option.xAxis[0].data = data.map(item => item.time)
  option.series[0].data = data.map(item => item.reservoir)//水位
  option.series[1].data = data.map(item => item.maximumFloodLevel || 0)//校核洪水位
  option.series[2].data = data.map(item => item.restrictedWaterLevel)//汛限水位
  return option
}

onMounted(() => {
  nextTick(() => {
    drawChart()
  })
  window.addEventListener('resize', () => {
    drawChart()
    const option = myChart.getOption()
    myChart.clear()
    myChart.setOption(renderFn(option, props.data,))
  }, {passive: true});
})

const drawChart = () => {
  let chartDom = chatDom.value
  if (chartDom == null) {
    return
  }
  echarts.dispose(chartDom)
  myChart = echarts.init(chartDom)
  const option = {
    tooltip: {
      trigger: 'axis',
      padding: [0, 10, 10, 10],
      // axisPointer: {
      //   type: 'cross',
      //   crossStyle: {
      //     color: '#384757',
      //   },
      // },
      formatter: function (param) {
        return `
          <div class="reservoirProcessChart-popup">
            <p class="top">
                <span>${param[0]?.axisValue} </span>
            </p>
            ${
            param.map(item => `
                  <p class="item">
                      <i class="icon" style="background-color:${item.color}"></i>
                      <span class="name">${item.seriesName}</span>
                      <span class="value"><b>${formatToFixed(item.data)}</b>${item.data !== '--' ? getEquiUnit(item.seriesName) : ''}</span>
                  </p>`).join("")
        }
          </div>
        `
      }
    },
    grid: {
      left: 40,
      top: 40,
      right: 40,
      bottom: 40,
    },
    dataZoom: [
      {
        type: 'slider',
        height: 15,
        bottom: '7%',
        borderColor: "#90979c",
        moveHandleSize:3
      }
    ],
    legend: {
      show: false,
    },
    xAxis: {
      axisTick: {
        alignWithLabel: true,
      },
      data: [],
      splitLine: {
        show: false,
        lineStyle: {
          width: 1,
          color: '#ccc',
        },
      },
      axisLabel: {
        color: '#eee',
        fontSize: 14,
        formatter: (val) => `${moment(new Date(val)).format('YYYY-MM-DD')}\n${moment(new Date(val)).format('HH:mm')}`
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '水位m',
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        nameTextStyle: {
          color: '#fff',
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          color: '#fff'
        }
      },
    ],
    series: [
      {
        name: '水位',
        type: 'line',
        smooth: true,
        showSymbol: false,
        barWidth: '30%',
        lineStyle: {
          width: 1,
          color: '#33a1ff',
        },
        data: [],
        yAxisIndex: 0
      },
      {
        name: '校核洪水位',
        type: 'line',
        showSymbol: false,
        lineStyle: {
          color: 'rgba(118, 255, 106, 1)',
          width: 1,
          type: 'dotted',
        },
        label: {
          show: true,
          formatter: '校核洪水位',
          color: 'rgba(118, 255, 106, 1)',
          position: 'top',
        },
        data: [],
        yAxisIndex: 0,
      },
      {
        name: '汛限水位',
        type: 'line',
        showSymbol: false,
        lineStyle: {
          color: 'rgba(255, 98, 18, 1)',
          width: 1,
          type: 'dotted',
        },
        label: {
          show: true,
          formatter: '汛限水位',
          color: 'rgba(255, 98, 18, 1)',
          position: 'top',
        },
        data: [],
        yAxisIndex: 0,
      }
    ],
  };
  option && myChart.setOption(option)
}

</script>

<style lang="scss">
.reservoirProcessChart {
  width: 100%;
  height: 100%;
}

.reservoirProcessChart-popup {
  overflow: hidden;
  //margin: 3px 10px;

  .top {
    //margin-bottom: 16px;
    font-weight: bold;
  }

  .item {
    display: flex;
    align-items: center;
    margin: 10px 0;

    &:last-child {
      margin-bottom: 0;
    }

    .icon {
      display: inline-block;
      width: 12px;
      height: 12px;
      margin-right: 10px;
      border-radius: 50%;
    }

    .name {
      width: 90px;
      margin-right: 10px;
    }

    .value {
      flex: 1;
      text-align: right;
    }
  }
}
</style>


