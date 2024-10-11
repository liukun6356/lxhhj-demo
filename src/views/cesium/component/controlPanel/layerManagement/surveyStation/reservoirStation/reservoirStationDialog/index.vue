<!--测站-水库站点位弹框-->
<template>
  <div class="my-header">
    <div class="left_title">{{ info.name }}水库站</div>
    <div class="close_box" @click="emit('icon-close')">
      <img src="@/assets/images/close@2x.png" alt=""/>
      <span>返回</span>
    </div>
  </div>
  <div class="content_wrap">
    <div class="tip-wrap">
      <div :class="[ 'item', activeItem === item?'active':'' ]" v-for="item in topBarItems" :key="item"
           @click="activeItem = item">{{ item }}
      </div>
    </div>
    <div class="dialog-info-wrap" v-if="curId">
      <station-information :data="info" v-if="activeItem === '测站信息'"/>
      <reservoir-process v-else :stcdOptions="props.listData" v-model="curId" :info="info"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs, onMounted, watch} from 'vue'
// Component
import ReservoirProcess from "./reservoirProcess.vue"
import StationInformation from "./stationInformation.vue"

// Props
const props = defineProps(['id', 'listData'])
// Emit
const emit = defineEmits(['icon-close'])

const model = reactive({
  curId: '',
  info: {},
  activeItem: "水文过程",
})

const {info, activeItem, curId} = toRefs(model)

watch(() => model.curId, () => getlist())

onMounted(() => {
  model.curId = props.id
  getlist()
})

const getlist = async () => {
  setTimeout(()=>{
    model.info = aaa || {}
  },500)

}

const topBarItems = ['水文过程']

const aaa = {
  "id": "5aedae1e507811efa44d0242ac110002",
  "searchValue": null,
  "orderKey": null,
  "status": "0",
  "createBy": null,
  "createUserName": null,
  "createTime": null,
  "updateBy": null,
  "updateUserName": null,
  "updateTime": null,
  "params": {},
  "name": "江源",
  "type": "MIDDLE",
  "baseElevation": null,
  "restrictedWaterLevel": 328.2,
  "normalHighWaterLevel": null,
  "designFloodLevel": null,
  "maximumFloodLevel": null,
  "totalStorage": null,
  "administrativeRegion": null,
  "longitude": "112.965800",
  "latitude": "25.626110",
  "remark": "611K0500",
  "waterLevelCode": null,
  "inFlowCode": null,
  "outFlowCode": null,
  "riverId": null
}
</script>

<style lang="scss" scoped>
.content_wrap {
  margin-top: 20px;
  height: calc(100% - 55px);

  .tip-wrap {
    display: flex;
    align-items: center;

    .item {
      padding: 5px 10px;
      margin: 0 15px 20px 0;
      line-height: 1;
      transition: all 0.2s ease-in-out;
      white-space: nowrap;
      background: rgba(46, 165, 255, 0.3);
      border-radius: 2px;
      border: 1px solid #2ea5ff;
      font-size: 12px;
      font-family: SourceHanSansCN-Normal, SourceHanSansCN;
      font-weight: 400;
      color: #ffffff;
      cursor: pointer;

      &.active {
        background: #2ea5ff;
      }

      &.activeHover:hover {
        background: #2ea5ff;
      }
    }
  }

  .dialog-info-wrap {
    height: calc(100% - 45px);
  }
}
</style>