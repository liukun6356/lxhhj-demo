<!--闸坝启闭-->
<template>
  <el-form :model="formData" :rules="rules" ref="formRef" label-width="90" label-position="right">
    <el-row>
      <el-col :span="24">
        <el-form-item label="闸坝名称：" prop="name">
          <el-select v-model="formData.name" placeholder="请选择闸坝" @change="stationChange">
            <el-option v-for="item in damData" :key="item.name" :label="item.name" :value="item.name"/>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="上游水位：" prop="upstreamWaterLevelGC">
          <el-input v-model="formData.upstreamWaterLevelGC" disabled placeholder="请输入" style="width: 100%"/>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="下游水位：" prop="downstreamWaterLevelGC">
          <el-input v-model="formData.downstreamWaterLevelGC" disabled placeholder="请输入" style="width: 100%"/>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-form-item label="闸坝状态：" prop="damFlag">
          <el-switch v-model="formData.damFlag" @change="damFlagChange" active-color="#13ce66"
                     inactive-color="#ff4949"/>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
  <!--  <div class="btn-area">-->
  <!--    <el-button type="primary">开始</el-button>-->
  <!--    <el-button type="primary">清除</el-button>-->
  <!--  </div>-->
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import damData from "./damData.json"
import {usemapStore} from "@/store/modules/cesiumMap";
import waterNormalsJpg from "@/assets/images/cesiumMap/waterNormals.jpg";

const mapStore = usemapStore()
const model = reactive({
  formData: {}
})
const {formData} = toRefs(model)

onMounted(() => {
  // addParticleSystemEx()
  modelDatasource = new Cesium.CustomDataSource("riverStation");
  viewer.dataSources.add(modelDatasource);
  addEntity()
  model.formData.name = damData[0].name
  stationChange(model.formData.name)
})

onUnmounted(() => {
  waterCollection._primitives.forEach(primitive => primitive.show = false)
  modelDatasource?.entities?.removeAll()
  viewer.dataSources.remove(modelDatasource);
})

const damFlagChange = (bool) => {
  modelDatasource.entities.values.forEach(entity => {
    entity.show = !bool
  })
}

const stationChange = (name) => {
  waterCollection._primitives.forEach(primitive => primitive.show = false)
  const curInfo = damData.find(item => item.name === name)
  const {upstreamWaterLevelGC, downstreamWaterLevelGC, upstreamObjectId, downstreamObjectId} = curInfo
  updateWaterHeight(upstreamObjectId, upstreamWaterLevelGC)
  updateWaterHeight(downstreamObjectId, downstreamWaterLevelGC)
  model.formData.upstreamWaterLevelGC = upstreamWaterLevelGC
  model.formData.downstreamWaterLevelGC = downstreamWaterLevelGC
  model.formData.damFlag = false
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(curInfo.lat, curInfo.lng, curInfo.z),
    orientation: {
      heading: Cesium.Math.toRadians(curInfo.heading),
      pitch: Cesium.Math.toRadians(curInfo.pitch),
      roll: Cesium.Math.toRadians(curInfo.roll),
    },
    duration: 2,
  });
}

const rules = {}
// 地图逻辑
import ParticleSystemEx from "./particleSystemEx.js"

let modelDatasource
import smokePng from "@/assets/images/cesiumMap/smoke.png"

const viewer = mapStore.getCesiumViewer();

const waterCollection = mapStore.getWaterPrimitiveCollection()
const particleSystemExArr = []
// 更新矢量面高度
const updateWaterHeight = (objectId, height: number) => {
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
}

// 添加闸坝模型
const addEntity = () => {
  // 三维模型姿态
  const position = Cesium.Cartesian3.fromDegrees(113.0451585, 25.790520, 153.4)
  const hpr = new Cesium.HeadingPitchRoll(-80.12, 0, 0)
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  // 加载三维模型
  const entity1 = modelDatasource.entities.add({
    name: "sxh-open",
    position: position,
    orientation,
    model: {
      uri: import.meta.env.VITE_APP_GISDATA + '/cz/glb/sxhzb_01.glb',
    }
  })
  const entity2 = modelDatasource.entities.add({
    name: "sxh-open",
    position: position,
    orientation,
    model: {
      uri: import.meta.env.VITE_APP_GISDATA + '/cz/glb/sxhzb_02.glb',
    }
  })
  // 三维模型姿态
  const position1 = Cesium.Cartesian3.fromDegrees(113.055605, 25.772641, 163.8)
  const hpr1 = new Cesium.HeadingPitchRoll(-80.1, 0, 0)
  const orientation1 = Cesium.Transforms.headingPitchRollQuaternion(position1, hpr1);
  const entity3 = modelDatasource.entities.add({
    // show: false,
    name: "wxh-open",
    position: position1,
    orientation: Cesium.Transforms.headingPitchRollQuaternion(Cesium.Cartesian3.fromDegrees(113.055605, 25.772641, 163.8), new Cesium.HeadingPitchRoll(-80.11, 0, 0)),
    model: {
      uri: import.meta.env.VITE_APP_GISDATA + '/cz/glb/wshzb_01.glb',
    }
  })
  const entity4 = modelDatasource.entities.add({
    name: "wxh-open",
    position: position1,
    orientation: Cesium.Transforms.headingPitchRollQuaternion(Cesium.Cartesian3.fromDegrees(113.055605, 25.772641, 163.8), new Cesium.HeadingPitchRoll(-80.11, 0, 0)),
    model: {
      uri: import.meta.env.VITE_APP_GISDATA + '/cz/glb/wshzb_02-1.glb',
    }
  })
  const entity5 = modelDatasource.entities.add({
    name: "wxh-open",
    position: position1,
    orientation: Cesium.Transforms.headingPitchRollQuaternion(Cesium.Cartesian3.fromDegrees(113.055605, 25.772641, 164), new Cesium.HeadingPitchRoll(-80.129, 0, 0)),
    model: {
      uri: import.meta.env.VITE_APP_GISDATA + '/cz/glb/wshzb_02-2.glb',
    }
  })
}

// 添加喷水例子效果
const addParticleSystemEx = () => {
  damData.forEach(item => {
    const {sprayWater} = item
    sprayWater.forEach(pos => {
      const position = Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2]);
      const particleSystemEx = new ParticleSystemEx(viewer, {
        position: position, //位置
        image: "./smoke.png",
        startColor: Cesium.Color.LIGHTCYAN.withAlpha(0.7), //粒子出生时的颜色
        endColor: Cesium.Color.WHITE.withAlpha(0.3), //当粒子死亡时的颜色
        particleSize: 30, //粒子图片的Size大小（单位：像素）
        startScale: 2.0, //粒子在出生时的比例（单位：相对于imageSize大小的倍数）
        endScale: 6.0, //粒子在死亡时的比例（单位：相对于imageSize大小的倍数）
        minimumParticleLife: 1.0, //粒子可能存在的最短寿命时间，实际寿命将随机生成（单位：秒）
        maximumParticleLife: 3.0, //粒子可能存在的最长寿命时间，实际寿命将随机生成（单位：秒）
        emissionRate: 50, //粒子发射器的发射速率 （单位：次/秒）
        gravity: -11, //重力因子，会修改速度矢量以改变方向或速度（基于物理的效果）
        target: new Cesium.Cartesian3(-0.151, 0.294, 0.225), // 粒子的方向
        maxHeight: 5000, //超出该高度后不显示粒子效果
        heightReference: Cesium.HeightReference.NONE
      })

      // viewer.scene.primitives.add(particleSystemEx1)
      particleSystemExArr.push(particleSystemEx)
    })
  })
}

</script>
