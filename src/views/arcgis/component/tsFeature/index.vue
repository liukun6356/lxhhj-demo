<template>
  <div class="ts-feature-wrap">
    <Teleport :to="gui2Dom" :disabled="!gui2Dom">
      <colormapping-gradient :data="1" v-if="formData.colorMapping === 'gradient'"/>
      <colormapping-classbreak data="1" v-if="formData.colorMapping === 'class-break'"/>
    </Teleport>
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
// Refs
const gui2Dom = ref(null)

const model = reactive({
  geoDataName: "",
  series: "",
  showGrid: true,
  formData: {
    pointSize: 6,
    isUpright: false,
    pointStyle: "circle",
    lineWidth: 6,
    colorMapping: "gradient"
  }
})
const {formData} = toRefs(model)

onMounted(() => {
  initGui()
  gridLayer = new TileGridLayer()
  layer = new TimeSeriesFeatureLayer({
    graphics: [],
    tolerance: 0,
    //@ts-ignore
    debug: true,
    renderOpts: {},
  })
  viewer.map.add(gridLayer);
})

onUnmounted(() => {
  gui1.destroy()
  viewer.map?.remove(gridLayer);
  gridLayer.destroy();
  viewer.map?.remove(layer);
  layer.destroy();
})

const formDatachange = (k, v) => {
  console.log(k, v)
}

const showGridChange = (bool) => {
  gridLayer.visible = bool
}

const seriesChange = (series) => {
  console.log(series)
}

// 地图逻辑
const mapStore = usemapStore()
const viewer = mapStore.getArcgisViewer();
let gridLayer, layer
const colorStops = [
  "rgb(255, 195, 0)",
  "rgb(255, 90, 31)",
  "rgb(255, 8, 59)",
  "rgb(255, 0, 128)",
  "rgb(180, 0, 201)",
  "rgb(42, 0, 252)",
]

const handleToggleDataSource = async (name) => {
  console.log(123243, name)
  const meta = typelist.find((i) => i.name === name);
  if (!meta.gs) {
    await fetch(`/test-data/timing-graphic/${name}.json`).then(async (res) => {
      const fs = await res.json();
      debugger
      const gs = fs.features.map((i) => {
        if (i.geometry.type === "Polygon") {
          return {
            attributes: i.properties,
            geometry: {
              type: "polygon",
              spatialReference: crs,
              rings: i.geometry.coordinates,
            } as __esri.Polygon,
          }
        } else if (i.geometry.type === "LineString") {
          return {
            // style: {
            //     lineWidth: Math.random() > 0.5 ? 6 : undefined,
            // },
            geometry: {
              type: "polyline",
              spatialReference: crs,
              paths: [i.geometry.coordinates],
            } as __esri.Polyline,
          }
        } else if (i.geometry.type === "Point") {
          const useDefault = Math.random() > 0.5;
          return {

            geometry: {
              type: "point",
              spatialReference: crs,
              x: i.geometry.coordinates[0],
              y: i.geometry.coordinates[1],
            } as __esri.Point,
          }
        }
      });
      //@ts-ignore
      layer.graphics = gs;

      meta.gs = markRaw(gs);
    });
  }
}


// lil-gui逻辑
let gui1, gui2, seriesControl
const initGui = () => {
  gui1 = new GUI({title: "污染物过程模拟"});
  gui1.add(model, "showGrid").onChange(showGridChange);
  gui1.add(model, "geoDataName", typelist.map(item => item.name)).name("数据源").onChange(name => {
    console.log("geoDataName", name)
    handleToggleDataSource(name)
    gui2.show()
    seriesControl?.destroy()
    const seriesOption = typelist.find((i) => i.name === name).series;
    seriesControl = gui1.add(model, "series", seriesOption).name("系列").onChange(seriesChange)
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
  gui2.add(model.formData, "colorMapping", ["gradient", "class-break"]).name("色带映射").onChange(colorMapping => formDatachange("colorMapping", colorMapping))
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
