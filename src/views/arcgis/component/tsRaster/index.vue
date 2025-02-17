<!--泄洪溃坝模拟-->
<template>
  <div class="ts-raster-wrap">
    <Teleport :to="gui2Dom" :disabled="!gui2Dom">
      123
    </Teleport>
    <Teleport :to="arrowDom" :disabled="!arrowDom">
      <img v-show="arrowDom" :src="curArrowImg" style="background-color: white;height:32px;display: block;"/>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs, ref} from "vue";
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import GUI from "lil-gui";
import {TileGridLayer} from "./tile-grid-layer";
import arrowImg1 from '@/assets/images/tsRaster/arrow-1.svg';
import arrowImg2 from '@/assets/images/tsRaster/arrow-2.png';
import arrowImg3 from '@/assets/images/tsRaster/arrow-3.png';
import {TimeSeriesRasterLayer} from "./layer/index";
import {TsRasterDataMeta, getDataClud, getDataDam, getDataDamVectorField, getDataLake, getDataUIS} from "./datas";

// Refs
const gui2Dom = ref(null)
const arrowDom = ref(null)

const mapStore = usearcgisMapStore()
const model = reactive({
  formData: {
    showGrid: false,
    opacity: 1,
    showDebugBorder: false,
    renderSampling: "linear",
    showTileSplit: false,
    showProjectMesh: false,
    colorMapping: "gradient",
    showArrow: false,
    arrow: "arrow-1",
    gap: 10,
    minSize: 20,
    maxSize: 40,
    showBackground: false,
    backgroundAlpha: 1
  },
  curArrowImg: ""
})
const {formData, curArrowImg} = toRefs(model)

onMounted(() => {
  initGui()
  viewer.goTo({
    center: [115.925372, 29.662379],
    zoom: 13
  })
  gridLayer = new TileGridLayer()
  viewer.map.add(gridLayer);
  gridLayer.visible = false
})

onUnmounted(() => {
  gui1.destroy()
  viewer.map?.remove(gridLayer);
  gridLayer.destroy();
})

const formDatachange = (k, v) => {
  console.log(k, v)
  switch (k) {
    case "showGrid":
      gridLayer.visible = v
      break
    case "opacity":
      break
    case "showDebugBorder":
      break
    case "renderSampling":
      break
    case "showTileSplit":
      break
    case "showProjectMesh":
      break
    case "colorMapping":
      break
    case "showArrow":
      break
    case "arrow":
      switch (v) {
        case "arrow-1":
          model.curArrowImg = arrowImg1
          break
        case "arrow-2":
          model.curArrowImg = arrowImg2
          break
        case "arrow-3":
          model.curArrowImg = arrowImg3
          break
      }
      break
    case "gap":
      break
    case "minSize":
      break
    case "maxSize":
      break
    case "showBackground":
      break
    case "backgroundAlpha":
      break
  }
}

// 地图逻辑
const viewer = mapStore.getArcgisViewer();
let gridLayer


// lil-gui逻辑
let gui1, gui2, gui3, seriesControl
const initGui = () => {
  gui1 = new GUI({title: "Controls"});
  gui1.add(model.formData, "showGrid").onChange(showGrid => formDatachange("showGrid", showGrid));
  gui1.add(model.formData, "geoDataName", typelist.map(item => item.name)).name("数据源").onChange(name => {
    gui2.title(name)
    gui2.show()
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
  gui2.add(model.formData, "colorMapping", ["gradient", "class-break"]).onChange(colorMapping => formDatachange("colorMapping", colorMapping))
  gui3 = new GUI({parent: gui1, title: "background"});
  gui3.add(model.formData, 'showBackground').onChange(showBackground => formDatachange("showBackground", showBackground));
  gui3.add(model.formData, 'backgroundAlpha', 0, 1, 0.01).onChange(backgroundAlpha => formDatachange("backgroundAlpha", backgroundAlpha));
  gui3.hide()
}

const typelist = [
  {
    name: "湖泊COD扩散(675x731)",
    series: ["opacity", "showDebugBorder", "renderSampling", "showTileSplit", "showProjectMesh", "colorMapping"],
  },
  {
    name: "溃坝水位模拟(1298x927)",
    series: ["opacity", "showDebugBorder", "renderSampling", "showTileSplit", "showProjectMesh", "colorMapping"],
  },
  {
    name: "溃坝流场模拟(1298x927)",
    series: ["opacity", "showArrow", "arrow", "gap", "minSize", "maxSize", "colorMapping"],
  },
  {
    name: "土地分类模拟(3502x1832)",
    series: ["opacity", "showDebugBorder", "renderSampling", "showTileSplit", "showProjectMesh", "colorMapping"],
  },
  {
    name: "UIS(15814x7114)",
    series: ["opacity", "showDebugBorder", "renderSampling", "showTileSplit", "showProjectMesh", "colorMapping"],
  },
]
</script>

<style lang="scss" scoped>
.ts-raster-wrap {

}
</style>
