<template>
  <teleport to="body">
    <ul v-show="showPopup" class="surveyStation-popup" ref="popupRef"
        :style="{ transform: `translate(${popupPos.x }px, ${popupPos.y}px)`}">
      <li>节点 {{ curName }}</li>
    </ul>
  </teleport>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, ref, toRefs} from "vue";
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import {wfsGetFeaturei} from "@/api/map"
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import Point from "@arcgis/core/geometry/Point.js";
import mittBus from "@/utils/mittBus";
import rainTextBg from "./rain.png"

// Ref
const popupRef = ref(null)

const mapStore = usearcgisMapStore()
const model = reactive({
  curId: null,
  curName:"",
  showPopup: false,
  popupPos: {
    x: 0,
    y: 0,
    width:0,
    height:0
  },
})
const {curId,curName, showPopup, popupPos} = toRefs(model)

onMounted(() => {
  createNode()
  mittBus.on("nodeOnMouseClick", onMouseClick)
  mittBus.on("nodeOnMouseMove", onMouseMove)
  mittBus.on("nodeOnMouseRender", showPopupBox)
})

onUnmounted(() => {
  layer.visible = false
  if (highlightHandle) highlightHandle.remove()
  mittBus.off("nodeOnMouseClick", onMouseClick)
  mittBus.off("nodeOnMouseMove", onMouseMove)
  mittBus.on("nodeOnMouseRender", showPopupBox)
})

const showPopupBox = () => {
  if (!preGraphic) {
    model.showPopup = false
    return
  }
  const point = new Point({
    x: preGraphic.geometry.x,
    y: preGraphic.geometry.y,
    spatialReference: preGraphic.geometry.spatialReference
  })
  const {x, y} = viewer.toScreen(point)
  model.showPopup = true
  const {width,height} = model.popupPos
  model.popupPos.x = x - (width / 2) - 15
  model.popupPos.y = y - height - 32
}

// 地图逻辑
let layer, layerView, highlightHandle,preGraphic
const viewer = mapStore.getArcgisViewer();

const createNode = async () => {
  if (viewer.map.layers.find((result) => result.customType === "node")) {
    layer = viewer.map.layers.find((result) => result.customType === "node")
    layer.visible = true
    viewer.map.layers.reorder(layer, viewer.map.layers.length);
    return
  }
  const params = {
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    outputFormat: "application/json",
    srs: "EPSG:4326",
    typeName: "zhsw:basic_node",
    viewparams: "planId:84;regionId:451300"
  }
  const {data} = await wfsGetFeaturei(params)
  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  layer = new GeoJSONLayer({
    url,
    renderer: {
      type: 'simple',
      symbol: {
        type: 'picture-marker', // 使用图片作为图标
        url: rainTextBg, // 替换为你的图标 URL
        width: '24px', // 图标宽度
        height: '24px' // 图标高度
      }
    },
    fields: [
      {name: "element_id", type: "string"},
      {name: "name", type: "string"},
    ],
    outFields: ["*"]
  });
  layer.customType = 'node'
  layer.editingEnabled = true
  viewer.map.layers.add(layer)
}

const onMouseClick = (graphic) => {
  if (!graphic) return
  if (highlightHandle) highlightHandle.remove()
  highlightHandle = layerView.highlight(graphic);
  preGraphic = graphic
  showPopupBox()
  model.curId = graphic.attributes.element_id

  // 删除
  // layer.applyEdits({deleteFeatures: [{objectId: movement.results[0].graphic.attributes.__OBJECTID}]})
  // model.curId = ""
}

const onMouseMove = async (graphic) => {
  try {
    if (model.curId)return
    if (!layerView) {
      layerView = await viewer.whenLayerView(layer)
      layerView.highlightOptions = {
        color: "rgb(51,255,153)", // 高亮颜色，例如红色
        haloOpacity: 0.9, // 光晕透明度
        fillOpacity: 0.2  // 填充透明度
      }
    }
    if (!layerView) return
    if (highlightHandle) {
      highlightHandle.remove()
      model.showPopup = false
      preGraphic = null
    }
    if (graphic) {
      highlightHandle = layerView.highlight(graphic);
      preGraphic = graphic
      model.curName = graphic.attributes.name
      model.popupPos.width = parseInt(getComputedStyle(popupRef.value).width)
      model.popupPos.height = parseInt(getComputedStyle(popupRef.value).height)
      showPopupBox()
    }
  } catch (e) {
  }
}

</script>
