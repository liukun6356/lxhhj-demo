<template>
  <div class="ts-kriging-wrap">
    <Teleport :to="gui2Dom" :disabled="!gui2Dom">
      123
    </Teleport>

  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, ref, toRefs} from "vue"
import GUI from "lil-gui";
// Refs
const gui2Dom = ref(null)

const model = reactive({
  formData: {
    clip: false,
    splitCount: 50,
    colorMapping: 'class-break',
    renderSampling: 'linear' as "nearest" | "linear",
    truncHead: false,
    truncTail: false
  },
  geoDataName: "",
  seriesName: "",

})
const {formData} = toRefs(model)

const formDatachange = (k, v) => {
  console.log(k, v)
  switch (k) {
    case "":
      break
  }
}

onMounted(()=>{
  initGui()
})

onUnmounted(()=>{

})

// lil-gui逻辑
let gui1, gui2, seriesControl
const initGui = () => {
  gui1 = new GUI({title: "Controls"});
  gui1.add(model.formData, "clip").onChange(clip => formDatachange("clip", clip));
  gui2 = new GUI({parent: gui1, title: "kriging"});
  gui2Dom.value = gui2.domElement
  gui2.add(model.formData, "splitCount", 10, 200, 1).onChange(splitCount => formDatachange("splitCount", splitCount))
  gui2.add(model.formData, "colorMapping", ["gradient", "class-break"]).onChange(colorMapping => formDatachange("colorMapping", colorMapping))
  gui2.add(model.formData, "renderSampling", ["nearest", "linear"]).onChange(renderSampling => formDatachange("renderSampling", renderSampling))
  gui2.add(model.formData, "truncHead").onChange(truncHead => formDatachange("truncHead", truncHead))
  gui2.add(model.formData, "truncTail").onChange(truncTail => formDatachange("truncTail", truncTail))
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

<style lang="scss" scoped>
.ts-kriging-wrap {

}
</style>
