<template>
  <div class="ts-feature-wrap">
    <Teleport :to="gui2Dom" :disabled="!gui2Dom">
      <colormapping-gradient :data="1" v-if="formData.colorMapping === 'gradient'"/>
      <colormapping-classbreak data="1" v-if="formData.colorMapping === 'class-break'"/>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, ref, toRefs} from "vue"
import GUI from "lil-gui";
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
})

onUnmounted(() => {
  gui1.destroy()
})

const formDatachange = (k, v) => {
  console.log(k, v)
}

const showGridChange = (bool) => {
  console.log(bool)
}

const seriesChange = (series) => {
  console.log(series)
}

let gui1, gui2, seriesControl
const initGui = () => {
  gui1 = new GUI({title: "污染物过程模拟"});
  gui1.add(model, "showGrid").onChange(showGridChange);
  gui1.add(model, "geoDataName", typelist.map(item => item.name)).name("数据源").onChange(name => {
    console.log("geoDataName", name)
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
