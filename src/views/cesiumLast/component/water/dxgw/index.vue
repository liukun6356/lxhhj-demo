<template>
  <div class="dxgw2-wrap">
    <yb-panl class="dxgw2-panl" v-if="selTimeRang" :selTimeRang="selTimeRang" :defaultStartTime="selTimeRang.start"
             @timeChange="timeChange">
      <template #tip="{time}">
        <span>{{ Math.floor(time / (60 ** 2 * 1e3)) }}时</span>
        <span>{{ Math.floor(time % (60 ** 2 * 1e3) / (60 * 1e3)) }}分</span>
      </template>
      <template #val="{time}">
        <span>{{ Math.floor(time / (60 ** 2 * 1e3)) }}时</span>
      </template>
    </yb-panl>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import pipelineJson from "./pipeline.json"
import DataMeta from "./data.ts"
import GUI from "lil-gui";
import axios from "axios";
// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import YbPanl from "./ybPanl.vue"

const model = reactive({
  selTimeRang: null,
  times: [],//所有数据时间点
})
const {isFlat, curId, selTimeRang, times} = toRefs(model)
onMounted(() => {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  initGui()
  viewer.scene.primitives.add(primitiveCollection);
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(109.230515, 23.686560, 18351.54),
    orientation: {
      heading: Cesium.Math.toRadians(6),
      pitch: Cesium.Math.toRadians(-75),
      roll: Cesium.Math.toRadians(0)
    }
  });
  getlist()
})

onUnmounted(() => {
  viewer.scene.primitives.remove(primitiveCollection);
  gui.destroy()
})

const timeChange = (timestamp) => {
  if (!pipelinePrimitive?.show) return
  const pipelineData = modelDataPool.pipeline.get(timestamp) || []
  pipelineData.forEach((num, index) => {
    const attr = pipelinePrimitive.getGeometryInstanceAttributes(index);
    if (!attr) return
    attr.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.fromRandom({alpha: 1.0}))
  })
}

const getlist = () => {
  model.times = DataMeta.times.map(num => num * 1e3)
  const start = DataMeta.times[0];
  const end = model.times[model.times.length - 1]
  model.selTimeRang = {start, end}

  model.times.forEach(async time => {
    const {data} = await axios.get(import.meta.env.VITE_APP_MODELDATA + `/waterSupplyMode/pipeline/pipeline-flow-${time}.json`)
    modelDataPool.pipeline.set(time, data)
  })
}

// 地图逻辑
const mapStore = usemapStore()
const viewer = mapStore.getCesiumViewer();
let handler, pipelinePrimitive, timer
const primitiveCollection = new Cesium.PrimitiveCollection()
const modelDataPool = {
  pipeline: new Map()
}

const addPipeline = () => {
  console.time("pipeline")
  const instances = []
  pipelineJson.features.forEach((feature, i) => {
    const geometry = new Cesium.PolylineGeometry({
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(feature.geometry.coordinates.map(([lon, lat]) => [lon, lat, 0]).flat()),
      width: 3
    })
    const instance = new Cesium.GeometryInstance({
      id: i,
      geometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED.withAlpha(0.8))
      }
    })
    instances.push(instance)
  })
  pipelinePrimitive = primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PolylineColorAppearance({
      translucent: true
    })
  }))
  console.timeEnd("pipeline")
}

const reset = (type) => {
  if (type) {
    switch (type) {
      case "pipeline":
        primitiveCollection.remove(pipelinePrimitive)
        pipelinePrimitive = null
        break
    }
  } else {
    primitiveCollection.removeAll()
    pipelinePrimitive = null
    clearInterval(timer)
  }
}

const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  console.log(pickedObject, 123)
}

// lil-gui逻辑
let gui, pipelineFolder
const formData = {
  reset,
  pipeline: {
    show: false,
    type: "flow",
  },
}
const initGui = () => {
  gui = new GUI({title: "controls"});
  pipelineFolder = gui.addFolder("管道")
  pipelineFolder.add(formData.pipeline, "show").onChange(bool => bool ? addPipeline() : reset("pipeline"))
  gui.add(formData, "reset")
}
</script>
