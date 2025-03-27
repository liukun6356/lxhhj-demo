<!--泄洪溃坝模拟-->
<template>
  <div class="ts-raster-wrap">
    <Teleport :to="gui2Dom" :disabled="!gui2Dom">
      <colormapping-gradient :data="curColorMapping" v-if="formData.colorMapping === 'gradient'"/>
      <colormapping-classbreak :data="curColorMapping" v-if="formData.colorMapping === 'class-break'"/>
    </Teleport>
    <Teleport :to="arrowDom" :disabled="!arrowDom">
      <img v-show="arrowDom" :src="curArrowImg" style="background-color: white;height:32px;display: block;"/>
    </Teleport>
    <RasterSplitDebug v-if="isActiveLayer" :debug-data="debugData" :show-tile-split="formData.showTileSplit"
                      :show-project-mesh="formData.showProjectMesh"/>
    <yb-panl v-if="selTimeRang" :selTimeRang="selTimeRang" :defaultStartTime="selTimeRang.start"
             :defaultRange="defaultRange" timeType="m" @timeChange="timeChange"/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs, ref, markRaw} from "vue";
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import GUI from "lil-gui";
import {TileGridLayer} from "./tile-grid-layer";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import {TimeSeriesRasterLayer} from "./layer/index";
import {RasterSimpleRenderOpts} from "./layer/misc"
import {ClassBreakColorMapping, GradientColorMapping} from './layer/color-mapping';
import {VectorFieldRenderOpts} from './layer/vector-field-render-opts';
import {getDataClud, getDataDam, getDataDamVectorField, getDataLake, getDataUIS} from "./datas";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import arrowImg1 from '@/assets/images/tsRaster/arrow-1.svg';
import arrowImg2 from '@/assets/images/tsRaster/arrow-2.png';
import arrowImg3 from '@/assets/images/tsRaster/arrow-3.png';
// Component
import YbPanl from "@/components/ybPanl/index.vue"
import ColormappingGradient from "./colormappingGradient.vue"
import ColormappingClassbreak from "./colormappingClassbreak.vue"
import RasterSplitDebug from "./raster-split-debug.vue"
// Refs
const gui2Dom = ref(null)
const arrowDom = ref(null)

const mapStore = usearcgisMapStore()
const model = reactive({
  isActiveLayer: false,
  formData: {
    geoDataName: "",
    showGrid: false,
    opacity: 1,
    showDebugBorder: false,
    renderSampling: "linear",
    showTileSplit: false,
    showProjectMesh: false,
    colorMapping: "gradient",
    colorSelect: "色带映射",
    arrowColor: "#000",
    showArrow: true,
    arrow: "arrow-1",
    gap: 10,
    minSize: 20,
    maxSize: 40,
    showBackground: false,
    backgroundAlpha: 1,
  },
  curArrowImg: "",
  curTime: 0,
  selTimeRang: null,
  defaultRange: 0,
  curColorMapping: null,
  debugData: null,
  // valueRange: [0, 0],// 数据区间 [min , max]
})
const {
  isActiveLayer,
  formData,
  curArrowImg,
  curTime,
  selTimeRang,
  defaultRange,
  curColorMapping,
  debugData
} = toRefs(model)

onMounted(() => {
  initGui()
  viewer.goTo({
    center: [115.925372, 29.662379],
    zoom: 13
  })
  const tileInfo = TileInfo.create({spatialReference: viewer.spatialReference, size: 256});
  gridLayer = new TileGridLayer()
  gridLayer.tileInfo = tileInfo;
  gridLayer.visible = false
  viewer.map.add(gridLayer);
  layer = new TimeSeriesRasterLayer();
  layer.tileInfo = tileInfo;
  layer.debug = true;
  viewer.map.add(layer);
  model.isActiveLayer = true
  debugDataWatch = reactiveUtils.watch(() => layer.debugData, v => model.debugData = markRaw(v))
})

onUnmounted(() => {
  gui1.destroy()
  viewer.map?.remove(gridLayer);
  gridLayer.destroy();
  viewer.map?.remove(layer);
  gridLayer.destroy(layer);
  debugDataWatch.remove()
})

const timeChange = (timestamp) => {
  layer.curTime = timestamp / (60 ** 2 * 1e3)
}

const formDatachange = (k, v) => {
  switch (k) {
    case "showGrid":
      gridLayer.visible = v
      break
    case "opacity":
      layer.opacity = v
      break
    case "showDebugBorder":
      layer.showDebugBorder = v
      break
    case "renderSampling":
      layer.renderOpts.renderSampling = v
      break
    case "showTileSplit":
      break
    case "showProjectMesh":
      break
    case "colorMapping":
      const meta = typelist.find(item => item.name === model.formData.geoDataName).meta
      layer.renderOpts.colorMapping = meta.mappings.find((i) => i.type === v)
      model.curColorMapping = meta.mappings.find((i) => i.type === v)
      break
    case "colorSelect":
      switch (v) {
        case "色带映射":
          layer.renderOpts.enableArrowColorMapping = true;
          colorMappingControl.setValue("gradient")
          formDatachange("colorMapping", "gradient")
          gui2.children.find(controller => controller.property === "colorMapping").show()
          gui2.children.find(controller => controller.property === "arrowColor").hide()
          break
        case "箭头图片":
          layer.renderOpts.enableArrowColorMapping = false;
          layer.renderOpts.arrowDefaultColor = null
          model.formData.colorMapping = ""
          gui2.children.find(controller => controller.property === "colorMapping").hide()
          gui2.children.find(controller => controller.property === "arrowColor").hide()
          break
        case "自选颜色":
          layer.renderOpts.enableArrowColorMapping = false;
          layer.renderOpts.arrowDefaultColor = model.formData.arrowColor
          model.formData.colorMapping = ""
          gui2.children.find(controller => controller.property === "colorMapping").hide()
          gui2.children.find(controller => controller.property === "arrowColor").show()
          break
      }
      break
    case "arrowColor":
      layer.renderOpts.arrowDefaultColor = v
      break
    case "showArrow":
      layer.renderOpts.showArrow = v
      break
    case "arrow":
      switch (v) {
        case "arrow-1":
          model.curArrowImg = arrowImg1
          layer.renderOpts.arrowImg = arrowImg1
          break
        case "arrow-2":
          model.curArrowImg = arrowImg2
          layer.renderOpts.arrowImg = arrowImg2
          break
        case "arrow-3":
          model.curArrowImg = arrowImg3
          layer.renderOpts.arrowImg = arrowImg3
          break
      }
      break
    case "gap":
      layer.renderOpts.gap = v
      break
    case "minSize":
      if (v > model.formData.maxSize) {
        model.formData.minSize = model.formData.maxSize;
        return;
      }
      layer.renderOpts.arrowSize = [model.formData.minSize, model.formData.maxSize]
      break
    case "maxSize":
      if (v < model.formData.minSize) {
        model.formData.minSize = model.formData.maxSize;
        return;
      }
      layer.renderOpts.arrowSize = [model.formData.minSize, model.formData.maxSize]
      break
    case "showBackground":
      layer.renderOpts.background = v;
      break
    case "backgroundAlpha":
      layer.renderOpts.backgroundAlpha = v;
      break
  }
}

// 地图逻辑
const viewer = mapStore.getArcgisViewer();
let gridLayer, layer, debugDataWatch

const handleSelectData = (name) => {
  const meta = typelist.find(item => item.name === name).meta
  if (meta.extent) {
    viewer.extent = meta.extent as __esri.Extent;
  } else {
    viewer.center = meta.center as __esri.Point;
    viewer.scale = meta.scale;
  }
  layer.source = meta.source;

  curTime.value = meta.timeRange.min;
  layer.curTime = meta.timeRange.min
  model.defaultRange = meta.timeRange.max
  model.selTimeRang = {start: meta.timeRange.min * 60 ** 2 * 1e3, end: meta.timeRange.max * 60 ** 2 * 1e3}
  // model.valueRange = [meta.timeRange.min, meta.timeRange.max];
  switch (meta.source.type) {
    case "simple":
      layer.renderOpts = new RasterSimpleRenderOpts({
        colorMapping: meta.mappings[0],
        renderSampling: "linear",
      })
      break
    case "vector-field":
      layer.renderOpts = new VectorFieldRenderOpts({
        gap: 40,
        arrowImg: arrowImg1,
        valueRange: [0, 10],
        colorMapping: meta.mappings[0] as GradientColorMapping | ClassBreakColorMapping,
        arrowSize: [20, 40],
        showArrow: true,
        background: false,
      });
      break
  }
  switch (name) {
    case "湖泊COD扩散(675x731)":
      colorMappingControl.options(["gradient", "class-break"])
      colorMappingControl.setValue("gradient")
      formDatachange("colorMapping", "gradient")
      break
    case "溃坝水位模拟(1298x927)":
      colorMappingControl.options(["class-break"])
      colorMappingControl.setValue("class-break")
      formDatachange("colorMapping", "class-break")
      break
    case "溃坝流场模拟(1298x927)":
      colorMappingControl.options(["gradient", "class-break"])
      colorMappingControl.setValue("gradient")
      formDatachange("colorMapping", "gradient")
      break
    case "土地分类模拟(3502x1832)":
      colorMappingControl.options(["unique-value", "gradient"])
      colorMappingControl.setValue("unique-value")
      formDatachange("colorMapping", "unique-value")
      break
    case "UIS(15814x7114)":
      colorMappingControl.options(["gradient"])
      colorMappingControl.setValue("gradient")
      formDatachange("colorMapping", "gradient")
      break
  }
}

// lil-gui逻辑
let gui1, gui2, gui3, seriesControl, colorMappingControl
const initGui = () => {
  gui1 = new GUI({title: "Controls"});
  gui1.add(model.formData, "showGrid").onChange(showGrid => formDatachange("showGrid", showGrid));
  gui1.add(model.formData, "geoDataName", typelist.map(item => item.name)).name("数据源").onChange(name => {
    gui2.title(name)
    gui2.show()
    handleSelectData(name)
    gui2.children.forEach(controller => controller.hide())
    gui2.children.forEach(controller => typelist.find(item => item.name === name).series.includes(controller.property) && controller.show())
    name === "溃坝流场模拟(1298x927)" ? gui3.show() : gui3.hide()
  })
  gui2 = new GUI({parent: gui1, title: "图层渲染控制"});
  gui2.hide()
  gui2Dom.value = gui2.domElement
  gui2.add(model.formData, "showDebugBorder").onChange(showDebugBorder => formDatachange("showDebugBorder", showDebugBorder))
  gui2.add(model.formData, "showTileSplit").onChange(showTileSplit => formDatachange("showTileSplit", showTileSplit))
  gui2.add(model.formData, "showProjectMesh").onChange(showProjectMesh => formDatachange("showProjectMesh", showProjectMesh))
  gui2.add(model.formData, "renderSampling", ["nearest", "linear"]).onChange(renderSampling => formDatachange("renderSampling", renderSampling))
  gui2.add(model.formData, "showArrow").onChange(showArrow => formDatachange("showArrow", showArrow))
  const arrowGui = gui2.add(model.formData, 'arrow', ['arrow-1', 'arrow-2', 'arrow-3']).onChange(arrow => formDatachange("arrow", arrow));
  arrowDom.value = arrowGui.domElement
  model.curArrowImg = arrowImg1
  gui2.add(model.formData, "gap", 10, 100, 1).onChange(gap => formDatachange("gap", gap));
  gui2.add(model.formData, 'minSize', 10, 100, 1).onChange(minSize => formDatachange("minSize", minSize));
  gui2.add(model.formData, 'maxSize', 10, 100, 1).onChange(maxSize => formDatachange("maxSize", maxSize));
  gui2.add(model.formData, "opacity", 0, 1, 0.01).onChange(opacity => formDatachange("opacity", opacity));
  gui2.add(model.formData, 'colorSelect', ['色带映射', '箭头图片', '自选颜色']).onChange(colorSelect => formDatachange("colorSelect", colorSelect))
  colorMappingControl = gui2.add(model.formData, "colorMapping", ["gradient", "class-break"]).onChange(colorMapping => formDatachange("colorMapping", colorMapping))
  gui2.addColor(model.formData, 'arrowColor').onChange(arrowColor => formDatachange("arrowColor", arrowColor));
  gui3 = new GUI({parent: gui1, title: "background"});
  gui3.add(model.formData, 'showBackground').onChange(showBackground => formDatachange("showBackground", showBackground));
  gui3.add(model.formData, 'backgroundAlpha', 0, 1, 0.01).onChange(backgroundAlpha => formDatachange("backgroundAlpha", backgroundAlpha));
  gui3.hide()
}

const typelist = [
  {
    name: "湖泊COD扩散(675x731)",
    meta: getDataLake(),
    series: ["opacity", "showDebugBorder", "renderSampling", "showTileSplit", "showProjectMesh", "colorMapping"],
  },
  {
    name: "溃坝水位模拟(1298x927)",
    meta: getDataDam(),
    series: ["opacity", "showDebugBorder", "renderSampling", "showTileSplit", "showProjectMesh", "colorMapping"],
  },
  {
    name: "溃坝流场模拟(1298x927)",
    meta: getDataDamVectorField(),
    series: ["opacity", "showArrow", "arrow", "gap", "minSize", "maxSize", "colorSelect", "colorMapping"],
  },
  {
    name: "土地分类模拟(3502x1832)",
    meta: getDataClud(),
    series: ["opacity", "showDebugBorder", "renderSampling", "showTileSplit", "showProjectMesh", "colorMapping"],
  },
  {
    name: "UIS(15814x7114)",
    meta: getDataUIS(),
    series: ["opacity", "showDebugBorder", "renderSampling", "showTileSplit", "showProjectMesh", "colorMapping"],
  },
]
</script>

<style lang="scss" scoped>
.ts-raster-wrap {

}
</style>
