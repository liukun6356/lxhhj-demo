<!--测站-水库站点位弹框-测站信息-->
<template>
  <div class="stationInformation-wrap">
    <div class="item" v-for="(value, key, index) in keyArr" :key="index">
      <div class="label">{{ key }}</div>
      <div class="value">{{ props.data[value] }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Props
const props = defineProps(['data'])

const keyArr = {
  "测站名称": "stnm",
  "测站编码": "stcd",
  "河流名称": "rvnm",
  "水系名称": "hnnm",
  "流域名称": "bsnm",
  "站址": "stlc",
  "经度": "lgtd",
  "纬度": "lttd",
  "行政区划代码": "addvcd",
  "基面名称": "dtmnm",
  "基面高程": "dtmel",
  "基面修正值": "dtpr",
  "站类": "sttp",
  "报讯等级": "frgrd",
  "建站年月": "esstym",
  "信息管理单位": "atcunit",
  "交换管理单位": "locality",
  "测站岸别": "stbk",
  "测站方位": "stazt",
  "至河口距离": "dstrvm",
  "集水面积": "drna",
  "拼音码": "phcd",
  "启用标志": "usfl",
  "备注": "comments",
  "时间戳": "moditime",
}
</script>

<style lang="scss" scoped>

.stationInformation-wrap {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  flex-grow: 1;
  overflow: hidden;

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-grow: 0;
    flex-shrink: 0;
    width: 30%;
    margin-top: 20px;
    .label {
      font-size: 14px;
      font-weight: 400;
      color: #fff;
      width: 100px;
      text-align: right;
      white-space: nowrap;
    }

    .value {
      flex-grow: 1;
      margin-left: 10px;
      font-size: 13px;
      font-weight: 300;
      color: #ffffff;
      background: rgba(216, 216, 216, 0.05);
      border-radius: 2px;
      height: 35px;
      line-height: 35px;
      padding-left: 8px;
      white-space: nowrap;
    }
  }
}
</style>