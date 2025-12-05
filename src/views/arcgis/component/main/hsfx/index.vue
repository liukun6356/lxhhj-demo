<template>
  <div class="hsfx-wrap">
    <yb-panl class="triangularMesh-panl" v-if="selTimeRang" :selTimeRang="selTimeRang"
             :defaultStartTime="selTimeRang.start" :defaultRange="times.length"
             timeType="m" @timeChange="timeChange"/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, ref, toRefs, h, render, createApp} from "vue"
import GUI from "lil-gui";
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import YbPanl from "@/components/ybPanl/index.vue"
import axios from "axios";
import moment from "moment";
import {createTileSchemeFromBBoxAndResolution} from "shared/utils/tile";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import {TimeSeriesVectorLayer} from "web/arcgis/layers/TimeSeriesVectorLayer/layer";
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Color from "@arcgis/core/Color";
import {toFixed1} from "web/utils/formatter";
import {createWaterLevelColorMapping, DepthColorMapping} from "./config";
import arrow1 from 'web/assets/arrow/arrow1.png';
import arrow2 from 'web/assets/arrow/arrow2.svg';
import arrow3 from 'web/assets/arrow/arrow3.png';
import {createAndMount} from "./utils";
import proj4 from "proj4";
// Component
import ColorMapping from "web/components/legend/colorMapping.vue";
import ArrowSelect from "web/components/arrow-select.vue";
import Ramp from "web/components/legend/Ramp.vue";

const model = reactive({
  selTimeRang: null,
  times: [],//所有数据时间点
  valueRange: []
})
const {selTimeRang, times} = toRefs(model)

onMounted(() => {
  initGui()
})

onUnmounted(() => {
  viewer?.map?.remove(layer)
  gui.destroy()
})

const getlist = async () => {
  const {data} = await axios.get(import.meta.env.VITE_APP_MODELDATA + `/hsfx/${formData.type}/Depth/meta.json`)
  const startTime = moment("2020-01-01 08:00:00").valueOf();
  const interval = 3600 * 1000;
  model.times = data.times.map((_, index) => startTime + index * interval)
  model.selTimeRang = {start: startTime, end: model.times[model.times.length - 1]}
  model.valueRange = data.valueRange
  addLayer()
}

const timeChange = (timestamp) => {
  if (layer) layer.curTime = timestamp
}

// 地图逻辑
const mapStore = usearcgisMapStore()
const viewer = mapStore.getArcgisViewer();
let layer

const addLayer = async () => {
  const {data} = await axios.get(import.meta.env.VITE_APP_MODELDATA + `/hsfx/${formData.type}/meta.json`)
  const {proj, minSize, extent, hash, primitiveType, series, flow} = data
  const result = await Promise.all([
    axios.get(import.meta.env.VITE_APP_MODELDATA + `/hsfx/${formData.type}/vertices`, {responseType: 'arraybuffer'}),
    axios.get(import.meta.env.VITE_APP_MODELDATA + `/hsfx/${formData.type}/indices`, {responseType: 'arraybuffer'}),
  ]);

  let vertices = new Float32Array(result[0].data)
  let indices = new Uint32Array(result[1].data)
  let arr = []
  for (let i = 0; i < vertices.length / 3; i++) {
    arr.push([vertices[3 * i], vertices[3 * i + 1], vertices[3 * i + 2]])
  }
  vertices = new Float32Array(arr.map(item => proj4('EPSG:4547', 'EPSG:4326', item)).flat());

  const crs = new SpatialReference({wkid: 4326});
  viewer.goTo({
    center: [113.898922, 31.317001],
    zoom: 13
  })
  layer = new TimeSeriesVectorLayer({
    curTime: moment("2020-01-01 08:00:00").valueOf(),
    timeDataRenderOpts: {},
    meshRenderOpts: {
      renderZ: false,
      showMeshLine: false,
      meshLineColor: 'rgba(255,255,255,0.1)',
      zColorMapping: {
        type: 'ramp',
        stops: ['black', 'white'],
        valueRange: [extent.zmin, extent.zmax]
      }
    }
  });
  viewer.map.add(layer);
  layer.geometry = {
    type: "mesh",
    vertices: {
      data: vertices,
      stride: 3,
      x: 0,
      y: 1,
      z: 2,
    },
    indices: {
      data: indices,
      stride: 4,
      components: [0, 1, 2, 3],
    },
    primitiveType,
    spatialReference: crs
  };
  addGrid()
  addHeight(extent)
  addTimeData(series)
  addFlow(flow)
  viewer.graphics.add({
    geometry: {
      type: "extent",
      spatialReference: crs,
      xmin: 113.82572471105611, ymin: 31.252657748515535, xmax: 113.96370828662944, ymax: 31.43991769393482
    },
    symbol: {
      type: 'simple-line',
      color: 'black'
    }
  })
}

const addGrid = () => {
  const params = reactive({
    showMeshLine: layer.meshRenderOpts.showMeshLine,
    meshLineColor: layer.meshRenderOpts.meshLineColor.toCss(false),
    meshLineAlpha: layer.meshRenderOpts.meshLineColor.a,
  })
  gridFolder.add(params, 'showMeshLine').name('show').onChange((v) => layer.meshRenderOpts.showMeshLine = v);
  gridFolder.addColor(params, 'meshLineColor').name('color').onChange(handleMeshLineColorChange);
  gridFolder.addColor(params, 'meshLineAlpha', 0, 1, 0.01).name('alpha').onChange(handleMeshLineColorChange);

  function handleMeshLineColorChange() {
    const color = Color.fromString(params.meshLineColor);
    color.a = params.meshLineAlpha;
    layer.meshRenderOpts.meshLineColor = color;
  }
}

const addHeight = (extent) => {
  const params = reactive({
    showZ: layer.meshRenderOpts.renderZ,
    range: [extent.zmin, extent.zmax],
    stops: layer.meshRenderOpts.zColorMapping.stops,
    format: toFixed1
  })
  const ctrl = heightFolder.add(params, 'showZ').name('show').onChange((show) => layer.meshRenderOpts.renderZ = show);
  const instance = createApp(() => h(Ramp, params))
  instance.mount(document.createElement('div'));
  const target = instance._container.firstElementChild
  ctrl.domElement.parentElement.appendChild(target)
}

const addTimeData = (series) => { // 添加时序数据
  const renderOpts = layer.timeDataRenderOpts;
  const params = reactive({
    show: renderOpts.enable,
    series: series[0],
    opacity: renderOpts.opacity,
  });
  timeFolder.add(params, 'show').onChange((v: boolean) => renderOpts.enable = v);
  timeFolder.add(params, 'opacity', 0, 1, 0.01).onChange((v: number) => renderOpts.opacity = v);
  const ctrl = timeFolder.add(params, 'series', series).name('数据源').onChange(handleSeriesChange)
  const host = document.createElement('div');
  let hasAttach = false;
  reactiveUtils.watch(
      () => renderOpts.colorMapping,
      c => {
        if (!c) return;
        let vnode;
        if (c.type === 'classbreak') {
          vnode = h(ColorMapping, {
            type: 'classbreak',
            data: {
              direction: "vertical",
              format: toFixed1,
              breaks: c.breaks
            }
          });
        } else {
          vnode = h(ColorMapping, {
            type: 'classbreak',
            data: {
              direction: "vertical",
              format: toFixed1,
              stops: c.stops
            }
          });
        }
        render(vnode, host);
        if (!hasAttach) {
          hasAttach = true;
          ctrl.domElement.parentElement.appendChild(host.firstElementChild);
        }
      }, {initial: true}
  )
  handleSeriesChange()

  async function handleSeriesChange() {
    layer.timeSource = {
      meshMappingMode: 'per-vertex',
      times: model.times,
      dataGetter: async (_, timeIndex) => fetch(import.meta.env.VITE_APP_MODELDATA + `/hsfx/${formData.type}/${params.series}/${timeIndex}`).then(res => res.arrayBuffer()).then(buf => new Float32Array(buf))
    };
    renderOpts.colorMapping = params.series === 'Depth' ? DepthColorMapping : createWaterLevelColorMapping(model.valueRange);
  }
}

const addFlow = async (flow) => {
  const {data} = await axios.get(import.meta.env.VITE_APP_MODELDATA + `/hsfx/${formData.type}/${flow}/meta.json`)
  const {valueRange} = data
  layer.vectorFieldTimeSource = {
    meshMappingMode: 'per-vertex',
    times: model.times,
    dataGetter: (_, timeIndex) => fetch(import.meta.env.VITE_APP_MODELDATA + `/hsfx/${formData.type}/${flow}/${timeIndex}`).then(res => res.arrayBuffer()).then(buf => new Float32Array(buf))
  };
  layer.vectorFieldRenderOpts = {
    enableColorMapping: true,
    colorMapping: {
      type: 'ramp',
      stops: ['yellow', 'red', 'purple'],
      clampHead: false,
      clampTail: false,
    },
    minShowFlow: 0.01,
    flowRange: valueRange,
    enableSizeMapping: false,
    sizeMapping: [10, 20],
    //@ts-ignore
    defaultColor: 'red',
    defaultSize: 20,
    gap: 15,
    arrowImg: arrow2
  }
  const renderOpts = layer.vectorFieldRenderOpts;
  const params = reactive({
    show: renderOpts.show,
    opacity: renderOpts.opacity,
    arrow: renderOpts.arrowImg,
    gap: renderOpts.gap,
    enableSizeMapping: renderOpts.enableSizeMapping,
    defaultSize: renderOpts.defaultSize,
    minSize: renderOpts.sizeMapping[0],
    maxSize: renderOpts.sizeMapping[1],
    enableColorMapping: renderOpts.enableColorMapping,
    defaultArrowColor: renderOpts.defaultColor.toCss(),
  });
  flowFolder.add(params, 'show').onChange(v => renderOpts.show = v);
  flowFolder.add(params, 'opacity', 0, 1, 0.01).onChange(v => renderOpts.opacity = v);
  const arrowEl = createAndMount(() => h(ArrowSelect, {
    arrows: [arrow1, arrow2, arrow3],
    modelValue: params.arrow,
    "onUpdate:modelValue": img => params.arrow = renderOpts.arrowImg = img
  }));
  const arrowCtrl = flowFolder.add(params, 'arrow');
  arrowCtrl.domElement.appendChild(arrowEl)
  arrowCtrl.$widget.remove();
  flowFolder.add(params, 'gap', 10, 80, 1).onChange(v => renderOpts.gap = v);
  flowFolder.add(params, 'enableSizeMapping').name('sizeMapping').onChange(handleSizeMappingChange);
  const sizeRangeCtrls = [
    flowFolder.add(params, 'minSize', 10, 80, 1).onChange((v: number) => {
      if (v > params.maxSize) {
        params.minSize = params.maxSize;
      } else {
        renderOpts.sizeMapping = [params.minSize, params.maxSize];
      }
    }),
    flowFolder.add(params, 'maxSize', 10, 80, 1).onChange((v: number) => {
      if (v < params.minSize) {
        params.maxSize = params.minSize;
      } else {
        renderOpts.sizeMapping = [params.minSize, params.maxSize];
      }
    })
  ];
  const defaultSizeCtrl = flowFolder.add(params, 'defaultSize', 10, 80, 1).name('size').onChange(v => renderOpts.defaultSize = v);
  handleSizeMappingChange()

  function handleSizeMappingChange() {
    renderOpts.enableSizeMapping = params.enableSizeMapping;
    if (params.enableSizeMapping) {
      sizeRangeCtrls.forEach(i => i.show());
      defaultSizeCtrl.hide();
    } else {
      sizeRangeCtrls.forEach(i => i.hide());
      defaultSizeCtrl.show();
    }
  }

  const cmOpts = reactive({
    range: model.valueRange,
    stops: renderOpts.colorMapping.stops,
    format: toFixed1,
    direction: "vertical",
    height: 72,
    style: {
      display: 'none',
    }
  });
  const cmCtrlEl = createAndMount(ColorMapping, {type: 'ramp', data: cmOpts});
  const cmCtrl = flowFolder.add(params, 'enableColorMapping').name('colorMapping').onChange(handleColorMappingChange);
  cmCtrl.domElement.parentElement.appendChild(cmCtrlEl);
  const defaultColorCtrl = flowFolder.addColor(params, 'defaultArrowColor').name('arrowColor').onChange((c: string) => renderOpts.defaultColor = Color.fromString(c));
  handleColorMappingChange()

  function handleColorMappingChange() {
    renderOpts.enableColorMapping = params.enableColorMapping;
    if (params.enableColorMapping) {
      cmOpts.style.display = null;
      defaultColorCtrl.hide();
    } else {
      cmOpts.style.display = 'none';
      defaultColorCtrl.show();
    }
  }
}

const reset = () => {
  viewer.map.remove(layer)
  layer = null
  typeControl.setValue("")
}

// lil-gui逻辑
let gui, typeControl, gridFolder, heightFolder, timeFolder, flowFolder
const formData = {
  type: "",
  gridShow: false,
  heightShow: false,
  timeShow: false,
  flowShow: false,
  reset,
}
const initGui = () => {
  gui = new GUI({title: "洪水分析"});
  typeControl = gui.add(formData, "type", ["p_10", "p_20", "p_50", "p_100"]).onChange((type) => {
    if (gridFolder) gridFolder.destroy();
    if (heightFolder) heightFolder.destroy();
    if (timeFolder) timeFolder.destroy();
    if (flowFolder) flowFolder.destroy();
    gridFolder = gui.addFolder("网格")
    heightFolder = gui.addFolder("高程")
    heightFolder.close()
    timeFolder = gui.addFolder("时序数据")
    timeFolder.close()
    flowFolder = gui.addFolder("流场")
    flowFolder.close()
    if (layer) {
      viewer.map.remove(layer)
      layer = null
    }
    if (type) getlist()
  })
  typeControl.setValue("p_10")
  gui.add(formData, "reset")
}
</script>

<style lang="scss" scoped>
.hsfx-wrap {

}
</style>
