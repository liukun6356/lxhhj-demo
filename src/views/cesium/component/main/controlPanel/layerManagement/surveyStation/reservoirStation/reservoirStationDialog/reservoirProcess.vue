<!--测站-水库站点位弹框-水文过程-->
<template>
  <div class="rainfallProcess-wrap">
    <el-form :model="formData" :rules="rules" ref="formRef">
      <el-row :gutter="30">
        <el-col :span="4">
          <el-form-item label="名称：" prop="stnm">
            <el-select v-model="curId">
              <el-option v-for="item in props.stcdOptions" :key="item.id" :label="item.name" :value="item.id"/>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="7">
          <el-form-item label="时间：" prop="timeRange">
            <el-date-picker v-model="formData.timeRange" type="datetimerange" range-separator="-"
                            :disabled-date="disabledDateFn" :clearable="false" format="YYYY-MM-DD HH:mm"
                            popper-class="hour-picker-popper"/>
          </el-form-item>
        </el-col>
        <el-col :span="11">
          <el-button type="primary" @click="getlist">查询</el-button>
        </el-col>
        <el-col :span="2" align="end">
          <el-button color="rgba(46, 165, 255, 0.3)" @click="exportExcel" style="color:#fff;border: 1px solid #2ea5ff">导出</el-button>
        </el-col>
      </el-row>
    </el-form>
    <div class="content-box">
      <div class="chart-area">
        <reservoir-process-chart :data="chartData"/>
      </div>
      <div class="table-area">
        <el-table height="calc(100% - 60px)" :data="listData">
          <el-table-column align="center" type="index" width="100" label="序号"/>
          <el-table-column v-for="(item, index) in keyArr" :key="index" :label=item.name :prop=item.props
                           align="center" show-overflow-tooltip :width="item.width||'auto'">
            <template #default="scope">
              {{ formatVal(item.props, scope.row[item.props]) }}
            </template>
          </el-table-column>
        </el-table>
        <el-pagination class="dialong-pagination" layout="total,prev, pager, next,sizes" :total="pages.total"
                       @current-change="changePage"
                       @size-change="(pages.pageNum=1, changePage())" v-model:current-page="pages.pageNum"
                       v-model:page-size="pages.pageSize"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs, onMounted, computed} from "vue";
import {theHourTime, formatVal, formatExcelDataArr, exportToExcel} from '@/utils/dictionary'
import moment from "moment"
// Components
import ReservoirProcessChart from "./reservoirProcessChart.vue"

// Props
const props = defineProps(['modelValue', "stcdOptions","info"])
// Emit
const emit = defineEmits(['update:modelValue'])

const curId = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  }
})

const model = reactive({
  formData: {
    timeRange: [theHourTime - 30* 24 * 60 * 60 * 1e3, theHourTime],
  },
  allListaData: [],
  listData: [],
  chartData: {},
  pages: {
    pageNum: 1,
    pageSize: 10,
    total: 0
  },
})
const {formData, listData, chartData, pages} = toRefs(model)

onMounted(() => {
    getlist()
})

// 前端分页
const changePage = () => {
  const temp = (model.pages.pageNum - 1) * model.pages.pageSize;
  model.listData = model.allListaData.slice(temp, temp + model.pages.pageSize);
}

const getlist = async () => {
  setTimeout(()=>{
    const data = aaa
    model.allListaData = data.rows?.sort((a, b) => (new Date(b.monitoringTime) - new Date(a.monitoringTime))).map(item=>({totalStorage:item.totalStorage || "",...item})) || []
    model.listData = model.allListaData.slice(0, model.pages.pageSize);
    model.pages.total = data.rows.length || 0
    // 按时间排序
    model.chartData = data.rows.sort((a, b) => (new Date(a.monitoringTime) - new Date(b.monitoringTime))).map((item, i) => ({
      time: moment(item.monitoringTime).format('YYYY-MM-DD HH:mm'),
      reservoir: item.reservoirWaterLevel,
      maximumFloodLevel: props.info.maximumFloodLevel,
      restrictedWaterLevel:  props.info.restrictedWaterLevel
    }))|| []
  },500)

}

const disabledDateFn = (time: any) => time.getTime() > Date.now()

const exportExcel = () => {
  const excelDaa = formatExcelDataArr(model.allListaData) // 匹配键值
  excelDaa.forEach((item, index) => {// 匹配键名
    Object.keys(item).forEach(key => {
      const cur = keyArr.find(x => x.props === key)
      if (cur) item[cur.name] = item[key]
      delete item[key]
    })
    item["水库站名称"] = props.info.name
    item["序号"] = index + 1
  })
  exportToExcel(excelDaa, `${props.info.name}水库站水文过程信息表`, ["序号", "水库站名称", ...keyArr.map(item => item.name)])
}

const keyArr = [
  {name: '时间', props: 'monitoringTime', width: 170},
  {name: '水位(m)', props: 'reservoirWaterLevel'},
  {name: '入库(m³/s)', props: 'reservoirInboundFlow'},
  {name: '出库(m³/s)', props: 'reservoirOutboundFlow'},
  {name: '蓄量(亿m³)', props: 'totalStorage'},
]
const rules = {}

const aaa = {
  "total": 0,
  "rows": [
    {
      "id": "5aedae1e507811efa44d0242ac110002",
      "name": "江源",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-18 08:00:00",
      "type": "MIDDLE",
      "reservoirWaterLevel": 338.95,
      "compareReservoirWaterLevel": 10.75,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 1.81
    },
    {
      "id": "5aedae1e507811efa44d0242ac110002",
      "name": "江源",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-17 08:00:00",
      "type": "MIDDLE",
      "reservoirWaterLevel": 338.12,
      "compareReservoirWaterLevel": 9.92,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 1.81
    },
    {
      "id": "5aedae1e507811efa44d0242ac110002",
      "name": "江源",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-16 08:00:00",
      "type": "MIDDLE",
      "reservoirWaterLevel": 338.13,
      "compareReservoirWaterLevel": 9.93,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 0.97
    },
    {
      "id": "5aedae1e507811efa44d0242ac110002",
      "name": "江源",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-15 08:00:00",
      "type": "MIDDLE",
      "reservoirWaterLevel": 337.93,
      "compareReservoirWaterLevel": 9.73,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 0.99
    },
    {
      "id": "5aedae1e507811efa44d0242ac110002",
      "name": "江源",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-14 08:00:00",
      "type": "MIDDLE",
      "reservoirWaterLevel": 337.99,
      "compareReservoirWaterLevel": 9.79,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 0.8
    },
    {
      "id": "5aedae1e507811efa44d0242ac110002",
      "name": "江源",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-13 08:00:00",
      "type": "MIDDLE",
      "reservoirWaterLevel": 337.99,
      "compareReservoirWaterLevel": 9.79,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 0.8
    }
  ],
  "code": null,
  "msg": null
}
</script>

<style lang="scss" scoped>
.rainfallProcess-wrap {
  height: 100%;

  .content-box {
    display: flex;
    justify-content: space-between;
    height: calc(100% - 50px);

    .chart-area {
      width: 50%;
    }

    .table-area {
      width: 45%;

      .dialong-pagination {
        display: flex;
        justify-content: center;
      }
    }
  }
}

</style>