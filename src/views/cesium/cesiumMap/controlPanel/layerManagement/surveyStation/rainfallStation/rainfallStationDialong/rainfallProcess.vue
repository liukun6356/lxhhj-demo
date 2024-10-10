<!--测站-雨量站点位弹框-降雨过程-->
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
<!--        <rainfall-process-chart :data="chartData"/>-->
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
import {reactive, toRefs, onMounted, computed, nextTick} from "vue";
import {theHourTime, formatVal, formatExcelDataArr, exportToExcel} from '@/utils/dictionary'
import moment from "moment"
// Components
// import RainfallProcessChart from "@/components/rainfallProcessChart.vue"
// Props
const props = defineProps(['modelValue', "stcdOptions", "name"])
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
    timeRange: [theHourTime - 30 * 24 * 60 * 60 * 1e3, theHourTime],
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
  nextTick(() => {
    getlist()
  })
})

// 前端分页
const changePage = () => {
  const temp = (model.pages.pageNum - 1) * model.pages.pageSize;
  model.listData = model.allListaData.slice(temp, temp + model.pages.pageSize);
}

const getlist = async () => {
  setTimeout(()=>{
    const  data = aaa
    model.allListaData = data.rows?.sort((a, b) => (new Date(b.monitoringTime) - new Date(a.monitoringTime))) || []
    model.listData = model.allListaData.slice(0, model.pages.pageSize);
    model.pages.total = data.result?.length || 0
    // 按时间排序
    model.chartData = data.rows.sort((a, b) => (new Date(a.monitoringTime) - new Date(b.monitoringTime))).map((item, i) => ({
      ...item,
      rainVal: item.rainstormValue,
      total: data.rows.slice(0, i + 1).reduce((sum, item) => sum + item.rainstormValue, 0),
      time: moment(item.monitoringTime).format('YYYY-MM-DD HH:mm'),
    })) || []
  })
}

const exportExcel = () => {
  const excelDaa = formatExcelDataArr(model.allListaData) // 匹配键值
  excelDaa.forEach((item, index) => {// 匹配键名
    Object.keys(item).forEach(key => {
      const cur = keyArr.find(x => x.props === key)
      if (cur) item[cur.name] = item[key]
      delete item[key]
    })
    item["雨量站名称"] = props.name
    item["序号"] = index + 1
  })
  exportToExcel(excelDaa, `${props.name}雨量站降雨过程信息表`, ["序号", "雨量站名称", ...keyArr.map(item => item.name)])
}

const disabledDateFn = (time: any) => time.getTime() > Date.now()

const keyArr = [
  {name: '雨量(mm)', props: 'rainstormValue'},
  {name: '时间', props: 'monitoringTime'}
]
const rules = {}

const aaa = {
  "total": 0,
  "rows": [
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-17 15:00:00",
      "rainstormValue": 0.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-17 03:00:00",
      "rainstormValue": 0.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-16 19:00:00",
      "rainstormValue": 0.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-16 18:00:00",
      "rainstormValue": 0.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-16 05:00:00",
      "rainstormValue": 0.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-16 04:00:00",
      "rainstormValue": 0.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-16 02:00:00",
      "rainstormValue": 7.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-16 01:00:00",
      "rainstormValue": 16
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-15 21:00:00",
      "rainstormValue": 0.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-15 09:00:00",
      "rainstormValue": 0.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-15 08:00:00",
      "rainstormValue": 1.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-15 07:00:00",
      "rainstormValue": 1.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-15 06:00:00",
      "rainstormValue": 2.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-15 05:00:00",
      "rainstormValue": 4.5
    },
    {
      "id": "09c7817b507611efa44d0242ac110002",
      "name": "光明村",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-15 04:00:00",
      "rainstormValue": 0.5
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