<!--水库蓄水-->
<template>
  <el-form :model="formData" :rules="rules" ref="formRef" label-width="95" label-position="right" :disabled="curWaterLevel">
    <el-row>
      <el-col :span="24">
        <el-form-item label="水库名称：" prop="name">
          <el-select v-model="formData.name" placeholder="请选择水库" @change="stationChange">
            <el-option v-for="item in reservoirData" :key="item.name" :label="item.name" :value="item.name"/>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="当前水位：" prop="reservoirWaterLevel">
          <el-input v-model="formData.reservoirWaterLevel" placeholder="请输入" disabled style="width: 100%"/>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="坝顶高程：" prop="dbgc">
          <el-input v-model="formData.dbgc" placeholder="请输入" disabled style="width: 100%"/>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="模拟水位：" prop="simulatedWaterLevel">
          <el-input v-model="formData.simulatedWaterLevel" placeholder="请输入" style="width: 100%"/>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="模拟速度：" prop="speedType">
          <el-select v-model="formData.speedType" placeholder="">
            <el-option v-for="item in speedOptions" :key="item.value" :label="item.label" :value="item.value"/>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="过程：">
          <el-progress :percentage="percentage" status="success" color="#409EFF" style="width: 100%"/>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
  <div class="btn-area">
    <el-button type="primary" :disabled="curWaterLevel" @click="submit">开始</el-button>
    <el-button :disabled="!curWaterLevel" type="primary" @click="cancel">清除</el-button>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, onUnmounted, reactive, toRefs, ref} from "vue";
import reservoirData from "./reservoirData.json"
import {usemapStore} from "@/store/modules/cesiumMap";
import {getreservoirStationList} from "@/api/cesiumMap";
import {getSelectReservoirDataNew} from "@/api/cesiumMap";
import waterNormalsJpg from "@/assets/images/cesiumMap/waterNormals.jpg";
import {ElMessage} from "element-plus";

// Ref
const formRef = ref(null)

const mapStore = usemapStore()
const percentage = computed(() => !model.curWaterLevel ? 0 : (model.curWaterLevel - model.formData.reservoirWaterLevel) * 100 / (model.formData.simulatedWaterLevel - model.formData.reservoirWaterLevel))

const model = reactive({
  formData: {},
  listData: [],
  curWaterLevel: 0
})
const {formData, listData,curWaterLevel} = toRefs(model)

onMounted(() => {
  getlist()
})

onUnmounted(() => {
  waterCollection._primitives.forEach(primitive => primitive.show = false)
})

const getlist = async () => {
  // const {data} = await getSelectReservoirDataNew({isNoDataStation:true})
  const data = [
    {
      "id": "5aecbb69507811efa44d0242ac110002",
      "name": "潭家垅水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 14:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 223.3,
      "compareReservoirWaterLevel": -1.27,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aed2a00507811efa44d0242ac110002",
      "name": "四清（人工报讯）",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 08:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 293.24,
      "compareReservoirWaterLevel": null,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 0.19
    },
    {
      "id": "5aed65cb507811efa44d0242ac110002",
      "name": "四清水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 14:00:00",
      "type": "MIDDLE",
      "reservoirWaterLevel": 293.88,
      "compareReservoirWaterLevel": -12.26,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aebe0ef507811efa44d0242ac110002",
      "name": "上源冲水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 14:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 249.35,
      "compareReservoirWaterLevel": 1.65,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aedae1e507811efa44d0242ac110002",
      "name": "江源",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 08:00:00",
      "type": "MIDDLE",
      "reservoirWaterLevel": 310.11,
      "compareReservoirWaterLevel": 8.91,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 1.18
    },
    {
      "id": "5aeb976b507811efa44d0242ac110002",
      "name": "仙岭（人工报讯）",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 08:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 250.96,
      "compareReservoirWaterLevel": null,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 0.38
    },
    {
      "id": "5aec0946507811efa44d0242ac110002",
      "name": "赵家水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 14:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 411.3,
      "compareReservoirWaterLevel": null,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aebbd8b507811efa44d0242ac110002",
      "name": "高峰（人工报讯）",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 08:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 650.05,
      "compareReservoirWaterLevel": -9.95,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": 3.4
    },
    {
      "id": "5aed0d8d507811efa44d0242ac110002",
      "name": "香塘岭水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 14:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 233.08,
      "compareReservoirWaterLevel": 0.08,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aec54ad507811efa44d0242ac110002",
      "name": "牛角塘水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 13:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 332.46,
      "compareReservoirWaterLevel": -15.18,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aec2e43507811efa44d0242ac110002",
      "name": "金钟岭水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 08:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 381.85,
      "compareReservoirWaterLevel": -2.15,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aec9b87507811efa44d0242ac110002",
      "name": "八里排水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 14:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 210.99,
      "compareReservoirWaterLevel": null,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aecd6d6507811efa44d0242ac110002",
      "name": "十二渡垅水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": "2024-09-09 14:00:00",
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": 819.76,
      "compareReservoirWaterLevel": -2.64,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aed8fd2507811efa44d0242ac110002",
      "name": "高峰水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": null,
      "type": "MIDDLE",
      "reservoirWaterLevel": null,
      "compareReservoirWaterLevel": null,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aed44c0507811efa44d0242ac110002",
      "name": "仙岭水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": null,
      "type": "MIDDLE",
      "reservoirWaterLevel": 240,
      "compareReservoirWaterLevel": null,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aeb1b29507811efa44d0242ac110002",
      "name": "立新水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": null,
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": null,
      "compareReservoirWaterLevel": null,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aec786d507811efa44d0242ac110002",
      "name": "五星水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": null,
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": null,
      "compareReservoirWaterLevel": null,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    },
    {
      "id": "5aeb6300507811efa44d0242ac110002",
      "name": "凉伞坪水库",
      "drainageBasinId": null,
      "drainageBasinName": null,
      "monitoringTime": null,
      "type": "SMALL_Ⅰ",
      "reservoirWaterLevel": null,
      "compareReservoirWaterLevel": null,
      "compareNormalHighWaterLevel": null,
      "reservoirInboundFlow": null,
      "reservoirOutboundFlow": null
    }
  ]
  model.listData = data || []
  model.formData.name = reservoirData[2].name
  stationChange(model.formData.name)
}

let timer
const submit = () => {
  if (!model.formData.reservoirWaterLevel) {
    ElMessage.warning("该站点数据缺失，暂不支持模拟")
    return
  }
  formRef.value.validate(async (valid) => {
    if (valid) {
      if (timer) return
      model.curWaterLevel = model.formData.reservoirWaterLevel
      timer = setInterval(() => {
        updateWaterMatrixHeight(0.2)
        model.curWaterLevel += 0.1
        if (model.curWaterLevel >= model.formData.simulatedWaterLevel) {
          clearInterval(timer)
          timer = null
        }
      }, 200 / model.formData.speedType)
    }
  });
}

const cancel = () => {
  clearInterval(timer)
  timer = null
  model.curWaterLevel = 0
  model.formData.simulatedWaterLevel = 0
  updateWaterHeight(model.formData.reservoirWaterLevel)
}

const stationChange = (name) => {
  cancel()
  waterCollection._primitives.forEach(primitive => primitive.show = false)
  const curInfo = reservoirData.find(item => item.name === name)
  const oldName = model.formData.name
  model.formData = model.listData.find(item => item.id === curInfo.id) || {}
  model.formData.name = oldName
  model.formData.speedType = 1
  model.formData.dbgc = curInfo.dbgc
  updateWaterHeight(model.formData.reservoirWaterLevel || curInfo.reservoirWaterLevel)
}

const rules = {
  simulatedWaterLevel: [
    {required: true, trigger: "blur", message: "请输入模拟水位"},
    {
      validator: (rule: any, value: any, callback: any) => {
        switch (true) {
          case Number.isNaN(+value):
            return callback(new Error(`请输入数字！`))
          case value < model.formData.reservoirWaterLevel:
            return callback(new Error(`应大于当前水位：${model.formData.reservoirWaterLevel}m！`))
          case value > model.formData.warningWaterLevel:
            return callback(new Error(`请不要超过警戒水位：${model.formData.dbgc}m！`))
          default:
            return callback()
        }
      }, trigger: "blur"
    },
  ]
}

const speedOptions = [
  {label: "0.5x", value: 0.5},
  {label: "1x", value: 1},
  {label: "2x", value: 2},
  {label: "3x", value: 3},
]
// 地图逻辑
const viewer = mapStore.getCesiumViewer();

const waterCollection = mapStore.getWaterPrimitiveCollection()

// 更新矢量面高度
const updateWaterHeight = (height: number) => {
  const curInfo = reservoirData.find(item => item.name === model.formData.name)
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(curInfo.lat, curInfo.lng, curInfo.z),
    orientation: {
      heading: Cesium.Math.toRadians(curInfo.heading),
      pitch: Cesium.Math.toRadians(curInfo.pitch),
      roll: Cesium.Math.toRadians(curInfo.roll),
    },
    duration: 2,
  });
  curInfo.objectId.forEach(objectId => {
    const primitive = waterCollection._primitives.find(primitive => primitive.geometryInstances.id === objectId)
    primitive.show = true
    const polygonInstance = primitive.geometryInstances
    polygonInstance.geometry._height = height
    waterCollection.remove(primitive)
    const new_primitive = new Cesium.Primitive({
      show: true,
      geometryInstances: polygonInstance,
      releaseGeometryInstances: false,
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
          fabric: {
            type: "Water",
            uniforms: {
              baseWaterColor: new Cesium.Color.fromCssColorString('#7B8773').withAlpha(0.9),
              normalMap: waterNormalsJpg,
              frequency: 9000.0,
              animationSpeed: 0.03,
              amplitude: 5,
              specularIntensity: 1,
              blendColor: new Cesium.Color.fromCssColorString('#7B8773').withAlpha(0.9)
            }
          }
        })
      }),
    });
    waterCollection.add(new_primitive)
  })
}

// 向上偏移矢量面高度
const updateWaterMatrixHeight = (moveDistance) => {
  const curInfo = reservoirData.find(item => item.name === model.formData.name)
  curInfo.objectId.forEach(objectId => {
    const primitive = waterCollection._primitives.find(primitive => primitive.geometryInstances.id === objectId)
    let curMatrix = primitive.modelMatrix || Cesium.Matrix4.IDENTITY;
    let newTranslation = new Cesium.Cartesian3(0, 0, moveDistance);
    let translationMatrix = Cesium.Matrix4.fromTranslation(newTranslation);
    curMatrix = Cesium.Matrix4.multiply(translationMatrix, curMatrix, new Cesium.Matrix4());
    primitive.modelMatrix = curMatrix;
  })
}
</script>

<style lang="scss" scoped>
:deep(.el-progress__text) {
  min-width: 15px;
}
</style>