<!--/**
 * @author: liuk
 * @date: 2024-07-30
 * @describe: 测站-河道站点位弹框-降雨过程图表 / 预演-断面弹框图表
 */-->
<template>
  <div ref="chatDom" class="numericalValueDialogChart"></div>
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
  option.xAxis[0].data = data.map(item => item.time)
  option.series[0].data = data.map(item => item.water)
  option.series[1].data = data.map(item => item.flow)
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
      formatter: function (param) {
        return `
          <div class="numericalValueDialogChart-popup">
            <p class="top">
                <span>${moment(+param[0]?.axisValue).format('YYYY-MM-DD HH:mm')} </span>
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
        type: 'inside'
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
        formatter: (val) => {
          return `${moment(new Date(+val)).format('YYYY-MM-DD')}\n${moment(new Date(+val)).format('HH:mm')}`
        }
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '水位 m',
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
          color: '#fff',
          formatter: (v) => formatToFixed(v, 0)
        }
      },
      {
        type: 'value',
        name: '流量 (m³/s)',
        nameLocation: 'end',
        nameTextStyle: {
          color: 'rgba(255,255,255,0.8)',
        },
        axisLabel: {
          color: '#fff',
          formatter: (v) => formatToFixed(v, 0)
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: false,
        },
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
          color: '#33ff99',
        },
        data: [],
        yAxisIndex: 0
      },
      {
        name: '流量',
        type: 'line',
        smooth: true,
        showSymbol: false,
        barWidth: '30%',
        lineStyle: {
          width: 1,
          color: '#33a1ff',
        },
        data: [],
        yAxisIndex: 1
      }
    ],
  };
  option && myChart.setOption(option)
}

</script>

<style lang="scss">
.numericalValueDialogChart {
  width: 100%;
  height: 100%;
}

.numericalValueDialogChart-popup {
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


