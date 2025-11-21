<!--水位涨落-->
<template>
  <el-form :model="formData" :rules="rules" ref="formRef" label-width="95" label-position="right" :disabled="curWaterLevel">
    <el-row>
      <el-col :span="24">
        <el-form-item label="河道名称：" prop="type">
          <el-select v-model="formData.name" placeholder="请选择河道" @change="stationChange">
            <el-option v-for="item in riverData" :key="item.name" :label="item.name" :value="item.name"/>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="当前水位：" prop="riverwayWaterLevel">
          <el-input v-model="formData.riverwayWaterLevel" disabled style="width: 100%"/>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="警戒水位：" prop="warningWaterLevel">
          <el-input v-model="formData.warningWaterLevel" disabled style="width: 100%"/>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="模拟水位：" prop="simulatedWaterLevel">
          <el-input v-model="formData.simulatedWaterLevel" placeholder="请输入"
                   :disabled="curWaterLevel"
                    style="width: 100%"/>
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
import riverData from "./riverData.json"
import {usemapStore} from "@/store/modules/cesiumMap";
import {getSelectRiverwayDataNew} from "@/api/cesiumMap";
import waterNormalsJpg from "@/assets/images/cesiumMap/waterNormals.jpg";
import {getriverStationList} from "@/api/cesiumMap";
import {ElMessage} from "element-plus";

// Ref
const formRef = ref(null)

const mapStore = usemapStore()
const percentage = computed(() => !model.curWaterLevel ? 0 : (model.curWaterLevel - model.formData.riverwayWaterLevel) * 100 / (model.formData.simulatedWaterLevel - model.formData.riverwayWaterLevel))
const model = reactive({
  formData: {
    name: "",
    riverwayWaterLevel: 0,
    warningWaterLevel: 1,
    speedType: 1,
    simulatedWaterLevel: 0
  },
  listData: [],
  curWaterLevel: 0
})
const {formData, listData, curWaterLevel} = toRefs(model)

onMounted(() => {
  getlist()
})

onUnmounted(() => {
  waterCollection._primitives.forEach(primitive => primitive.show = false)
})

const getlist = async () => {
  const {data: data1} = await getriverStationList({})
  const {data: data2} = await getSelectRiverwayDataNew({isNoDataStation: true})
  const data = data1.rows.map(item => {
    const temp = data2.find(x => item.id === x.id)
    if (!temp) return item
    return {
      warningWaterLevel: item.warningWaterLevel,
      riverwayWaterLevel: temp.riverwayWaterLevel,
      name: temp.name,
      id: item.id
    }
  })
  // const data = [
  //   {
  //     "warningWaterLevel": 148.89,
  //     "riverwayWaterLevel": 145.88,
  //     "name": "郴州",
  //     "id": "7529ffc3507d11efa44d0242ac110002"
  //   },
  //   {
  //     "warningWaterLevel": 198.8,
  //     "riverwayWaterLevel": 196.97,
  //     "name": "坳上",
  //     "id": "752a5741507d11efa44d0242ac110002"
  //   },
  //   {
  //     "warningWaterLevel": 169.11,
  //     "riverwayWaterLevel": null,
  //     "name": "海泉",
  //     "id": "752a7a02507d11efa44d0242ac110002"
  //   },
  //   {
  //     "warningWaterLevel": null,
  //     "riverwayWaterLevel": null,
  //     "name": "秧溪河",
  //     "id": "752a88cc507d11efa44d0242ac110002"
  //   },
  //   {
  //     "warningWaterLevel": 150,
  //     "riverwayWaterLevel": 137.89,
  //     "name": "潘家湾",
  //     "id": "752a99bb507d11efa44d0242ac110002"
  //   },
  //   {
  //     "warningWaterLevel": 150,
  //     "riverwayWaterLevel": 145.3,
  //     "name": "四普庄",
  //     "id": "752abe36507d11efa44d0242ac110002"
  //   }
  // ]
  model.listData = data || []
  model.formData.name = riverData[0].name
  stationChange(model.formData.name)
}

let timer
const submit = () => {
  if(!model.formData.riverwayWaterLevel){
    ElMessage.warning("该站点数据缺失，暂不支持模拟")
    return
  }
  formRef.value.validate(async (valid) => {
    if (valid) {
      if (timer) return
      model.curWaterLevel = model.formData.riverwayWaterLevel
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
  updateWaterHeight(model.formData.riverwayWaterLevel)
}

const stationChange = (name) => {
  cancel()
  waterCollection._primitives.forEach(primitive => primitive.show = false)
  const curInfo = riverData.find(item => item.name === name)
  curInfo.objectId.forEach(objectId => {
    const primitive = waterCollection._primitives.find(primitive => primitive.geometryInstances.id === objectId)
    if (primitive) primitive.show = true
  })
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(curInfo.lat, curInfo.lng, curInfo.z),
    orientation: {
      heading: Cesium.Math.toRadians(curInfo.heading),
      pitch: Cesium.Math.toRadians(curInfo.pitch),
      roll: Cesium.Math.toRadians(curInfo.roll),
    },
    duration: 2,
  });
  const oldName = model.formData.name
  model.formData = model.listData.find(item => item.id === curInfo.id) || {}
  model.formData.name = oldName
  model.formData.speedType = 1
  updateWaterHeight(model.formData.riverwayWaterLevel || curInfo.riverwayWaterLevel)
}

const rules = {
  simulatedWaterLevel: [
    {required: true, trigger: "blur", message: "请输入模拟水位"},
    {
      validator: (rule: any, value: any, callback: any) => {
        switch (true) {
          case Number.isNaN(+value):
            return callback(new Error(`请输入数字！`))
          case value < model.formData.riverwayWaterLevel:
            return callback(new Error(`应大于当前水位：${model.formData.riverwayWaterLevel}m！`))
          case value > model.formData.warningWaterLevel:
            return callback(new Error(`请不要超过警戒水位：${model.formData.warningWaterLevel}m！`))
          default:
            return callback()
        }
      }, trigger: "blur"
    },
  ],
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
  const curInfo = riverData.find(item => item.name === model.formData.name)
  curInfo.objectId.forEach(objectId => {
    const primitive = waterCollection._primitives.find(primitive => primitive.geometryInstances.id === objectId)
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
  const curInfo = riverData.find(item => item.name === model.formData.name)
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