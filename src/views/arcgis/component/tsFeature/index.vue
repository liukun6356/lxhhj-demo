<template>
  <div class="ts-feature-wrap">
    <Teleport :to="gui2Dom" :disabled="!gui2Dom">
      <colormapping-gradient :data="curColorMapping" v-if="formData.colorMapping === 'gradient'"/>
      <colormapping-classbreak :data="curColorMapping" v-if="formData.colorMapping === 'class-break'"/>
    </Teleport>
    <yb-panl v-if="selTimeRang" :selTimeRang="selTimeRang" :defaultStartTime="selTimeRang.start" @timeChange="timeChange"/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, ref, toRefs, markRaw} from "vue"
import GUI from "lil-gui";
import {usemapStore} from "@/store/modules/arcgisMap";
import {TileGridLayer} from "./tile-grid-layer";
import {TimeSeriesFeatureLayer} from "./layer";
import moment from "moment";
// Component
import ColormappingGradient from "./colormappingGradient.vue"
import ColormappingClassbreak from "./colormappingClassbreak.vue"
import YbPanl from "@/components/ybPanl.vue"
// Refs
const gui2Dom = ref(null)

const model = reactive({
  geoDataName: "",
  seriesName: "",
  showGrid: true,
  formData: {
    pointSize: 6,
    isUpright: false,
    pointStyle: "circle",
    lineWidth: 6,
    colorMapping: "gradient"
  },
  valueRange: [0, 0],// 数据区间 [min , max]
  times: [],//所有数据时间点
  startTime: "",
  endTime: "",
  curColorMapping: {},
  selTimeRang:null
})
const {formData, valueRange, selTimeRang, curColorMapping} = toRefs(model)

onMounted(() => {
  initGui()
  viewer.goTo({
    center: [115.994105, 29.666986],
    zoom: 13
  })
  gridLayer = new TileGridLayer()
  layer = new TimeSeriesFeatureLayer({
    graphics: [],
    tolerance: 0,
    //@ts-ignore
    debug: true,
    renderOpts: {},
  })
  viewer.map.add(layer);

  const start = new Date("2022-02-02 08:00:00").getTime();
  const interval = 1000 * 60 ** 2;
  model.times = new Array(288).fill(0).map((i, index) => index * interval + start);
  const end = model.times[model.times.length - 1]
  model.selTimeRang = {start,end}
})

onUnmounted(() => {
  gui1.destroy()
  viewer.map?.remove(gridLayer);
  gridLayer.destroy();
  viewer.map?.remove(layer);
  layer.destroy();
})

const timeChange = (timestamp) => {
  layer.curTime = timestamp
}

const formDatachange = (k, v) => {
  switch (k) {
    case "pointSize":
      layer.renderOpts.defaultPointSize = model.formData.pointSize
      break
    case "isUpright":
      layer.renderOpts.defaultPointUpright = model.formData.isUpright
      break
    case "pointStyle":
      layer.renderOpts.defaultPointStyle = model.formData.pointStyle
      break
    case "lineWidth":
      layer.renderOpts.defaultLineWidth = model.formData.lineWidth
      break
    case "colorMapping":
      model.curColorMapping = v === "gradient" ?
          {
            type: "gradient",
            stops: colorStops,
            valueRange: model.valueRange,
          } :
          {
            type: "class-break",
            truncHead: false,
            truncTail: false,
            breaks: {
              min: model.valueRange[0],
              max: model.valueRange[1],
              colors: colorStops,
            },
          }
      layer.renderOpts.colorMapping = model.curColorMapping
      break
  }
}

const showGridChange = (bool) => {
  gridLayer.visible = bool
}

const seriesChange = (series) => {


}

// 地图逻辑
const mapStore = usemapStore()
const viewer = mapStore.getArcgisViewer();
let gridLayer, layer
const colorStops = ["rgb(255, 195, 0)", "rgb(255, 90, 31)", "rgb(255, 8, 59)", "rgb(255, 0, 128)", "rgb(180, 0, 201)", "rgb(42, 0, 252)",]

const handleToggleDataSource = async (name) => {
  const meta = typelist.find((i) => i.name === name);
  if (!meta.gs) {
    const res = await fetch(import.meta.env.VITE_APP_MODELDATA + `/timing-graphic/${name}.json`)
    const jsonData = await res.json()
    const gs = jsonData.features.map((i) => {
      switch (i.geometry.type) {
        case "Polygon":
          return {
            attributes: i.properties,
            geometry: {
              type: "polygon",
              spatialReference: {wkid: 4326},
              rings: i.geometry.coordinates,
            },
          }
        case "LineString":
          return {
            attributes: i.properties,
            geometry: {
              type: "polyline",
              spatialReference: {wkid: 4326},
              paths: [i.geometry.coordinates],
            },
          }
        case "Point":
          return {
            attributes: i.properties,
            geometry: {
              type: "point",
              spatialReference: {wkid: 4326},
              x: i.geometry.coordinates[0],
              y: i.geometry.coordinates[1],
            },
          }
      }
    });
    meta.gs = gs;
    layer.graphics = gs;
  } else {
    layer.graphics = meta.gs;
  }
  handleToggleSeries()
}

const handleToggleSeries = async () => {
  const meta = typelist.find((i) => i.name === model.geoDataName);
  const count = meta.gs.length;
  const res = await fetch(import.meta.env.VITE_APP_MODELDATA + `/timing-graphic/${meta.name}/${meta.sPath}${model.seriesName}.bin`)
  const buffer = await res.arrayBuffer()
  const data = new Float32Array(buffer);
  let max = -Infinity;
  data.forEach(item => max = Math.max(max, item))
  max = +max.toFixed(2);
  model.valueRange = [0, max]
  layer.source = {
    times: model.times,
    dataGetter: async (time, index) => {
      return new Float32Array(data.buffer, count * 4 * index, count);
    },
  }
  formDatachange("colorMapping", model.formData.colorMapping)
}

// lil-gui逻辑
let gui1, gui2, seriesControl
const initGui = () => {
  gui1 = new GUI({title: "污染物过程模拟"});
  gui1.add(model, "showGrid").onChange(showGridChange);
  gui1.add(model, "geoDataName", typelist.map(item => item.name)).name("数据源").onChange(name => {
    handleToggleDataSource(name)
    gui2.show()
    seriesControl?.destroy()
    const seriesOption = typelist.find((i) => i.name === name).series;
    seriesControl = gui1.add(model, "seriesName", seriesOption).name("系列").onChange(handleToggleSeries)
    seriesControl.setValue(seriesOption[0])
    gui2.children.forEach(controller => controller.hide())
    switch (name) {
      case "node":
        gui2.children.forEach(controller => ["pointSize", "isUpright", , "pointStyle", "colorMapping"].includes(controller.property) && controller.show())
        gui2.children[0].property
        break
      case "link":
        gui2.children.forEach(controller => ["lineWidth", "colorMapping"].includes(controller.property) && controller.show())
        break
      case "section":
        gui2.children.forEach(controller => ["colorMapping"].includes(controller.property) && controller.show())
        break
    }
  })
  gui2 = new GUI({parent: gui1, title: "图层渲染控制"});
  gui2Dom.value = gui2.domElement
  gui2.hide()
  gui2.add(model.formData, "pointSize", 2, 20, 1).onChange(pointSize => formDatachange("pointSize", pointSize))
  gui2.add(model.formData, "isUpright").onChange(isUpright => formDatachange("isUpright", isUpright))
  gui2.add(model.formData, "pointStyle", {
    圆形: "circle",
    方形: "square",
    三角形: "triangle",
  }).onChange(pointStyle => formDatachange("pointStyle", pointStyle))
  gui2.add(model.formData, "lineWidth", 1, 20, 1).onChange(lineWidth => formDatachange("lineWidth", lineWidth))
  const colorMappingControl =  gui2.add(model.formData, "colorMapping", ["gradient", "class-break"]).name("色带映射").onChange(colorMapping => formDatachange("colorMapping", colorMapping))
}

const typelist = [
  {
    name: "node",
    type: "point",
    gs: null,
    sPath: "001_nd_",
    series: ["COD", "Depth", "flooding", "head", "lateral_inflow", "TN", "total_inflow", "TP", "volume"],
  },
  {
    name: "link",
    type: "polyline",
    gs: null,
    sPath: "001_lk_",
    series: ["capacity", "COD", "depth", "flow", "TN", "TP", "velocitt", "volume"],
  },
  {
    name: "section",
    sPath: "001_sc_",
    type: "polygon",
    gs: null,
    series: ["COD", "infiltration", "runoff", "TN", "TP"],
  },
]
</script>

<style lang="scss" scoped></style>
