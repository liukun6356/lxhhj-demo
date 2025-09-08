<!--克里金实践-->
<template>
  <div class="ts-kriging-wrap">
    <Teleport :to="gui2Dom" :disabled="!gui2Dom">
      <colormapping-gradient :data="curColorMapping" v-if="formData.colorMapping === 'gradient'"/>
      <colormapping-classbreak :data="curColorMapping" v-if="formData.colorMapping === 'class-break'"/>
    </Teleport>
    <teleport to="body">
      <label class="tsKriging-label" v-for="item in showListData" :key="item.index"
             :style="{ '--x': item.screenX + 'px', '--y': item.screenY + 'px' }" v-if="showPopup">
        {{ item.value.toFixed(1) }}</label>
    </teleport>
    <yb-panl v-if="selTimeRang" :selTimeRang="selTimeRang" :defaultStartTime="selTimeRang.start"
             timeType="m" @timeChange="timeChange"/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, ref, toRefs} from "vue"
import GUI from "lil-gui";
import {KrigingDataMeta} from "./data/index.ts"
import {TimeSeriesKrigingLayer} from "./layer";
import {usearcgisMapStore} from "@/store/modules/arcgisMap";
import Polygon from "@arcgis/core/geometry/Polygon";
import Extent from "@arcgis/core/geometry/Extent";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import {MathUtils} from "three";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
// Component
import ColormappingGradient from "./colormappingGradient.vue"
import ColormappingClassbreak from "./colormappingClassbreak.vue"
import YbPanl from "@/components/ybPanl/index.vue"

// Refs
const gui2Dom = ref(null)

const mapStore = usearcgisMapStore()
const model = reactive({
  formData: {
    label: true,
    grid:true,
    clip: true,
    splitCount: 50,
    colorMapping: 'class-break',
    renderSampling: 'linear' as "nearest" | "linear",
    truncHead: false,
    truncTail: false
  },
  selTimeRang: null,
  valueRange: [0, 0],// 数据区间 [min , max]
  times: [],//所有数据时间点
  curColorMapping: null,
  showPopup: true,
  showListData: KrigingDataMeta.points.map((item, index) => ({
    ...item,
    index,
    value: NaN,
    screenX: NaN,
    screenY: NaN,
  })),// 点位label {index,x,y,screenY,screenX,value}
})
const {formData, selTimeRang, curColorMapping, showPopup, showListData} = toRefs(model)

onMounted(() => {
  initGui()
  viewer.goTo(KrigingDataMeta.center)
  layer = new TimeSeriesKrigingLayer({
    source: {
      points: KrigingDataMeta.points,
      spatialReference: {wkid: 4326} as __esri.SpatialReference,
      times: KrigingDataMeta.data.map(i => i.time),
      dataGetter: (t: number, tIndex: number) => Promise.resolve(KrigingDataMeta.data[tIndex].value)
    },
    renderOpts: {
      colorMapping: KrigingDataMeta.colorMap.find(i => i.type === 'class-break'),
      renderSampling: "linear",
      krigingOpts: {splitCount: 50}
    },
  });
  getlist()
  addRect()
  if (KrigingDataMeta.grids) addGrid()
  viewer.map.add(layer);
  viewer.map.layers.reorder(gsLayer, viewer.map.layers.length - 1);
  viewer.map.layers.reorder(gridlayer, viewer.map.layers.length - 1);
  viewer.map.layers.reorder(labelLayer, viewer.map.layers.length - 1);
  // layer.debug = true;

  model.times = KrigingDataMeta.data.map(i => i.time);
  const start = model.times[0]
  const end = model.times[model.times.length - 1]
  model.selTimeRang = {start, end}
  layer.curTime = start
  const temp = KrigingDataMeta.colorMap.find(i => i.type === "class-break")
  const {truncHead, truncTail} = model.formData
  model.curColorMapping = {...temp, truncHead, truncTail}
})

onUnmounted(() => {
  gui1.destroy()
  viewer.map?.remove(layer);
  layer.destroy();
  viewer.map?.remove(gsLayer);
  gsLayer.destroy();
  viewer.map?.remove(gridlayer);
  gridlayer.destroy();
  viewer.map?.remove(labelLayer);
  labelLayer.destroy();
  labelWatch.remove()
})


const getlist = async () => {
  layer.renderOpts.clipPolygon = KrigingDataMeta.polygons;
  showPopupBox()
  labelWatch = reactiveUtils.watch(() => viewer.extent, showPopupBox, {initial: true});
}

const timeChange = (timestamp) => {
  layer.curTime = timestamp
  let afterIndex = KrigingDataMeta.data.findIndex((i) => i.time > layer.curTime);
  if (afterIndex === -1) afterIndex = KrigingDataMeta.data.length - 1;
  const beforeIndex = Math.max(afterIndex - 1, 0);
  const beforeData = KrigingDataMeta.data[beforeIndex];
  const afterData = KrigingDataMeta.data[afterIndex];
  const per = afterIndex === beforeIndex ? 1 : (layer.curTime - beforeData.time) / (afterData.time - beforeData.time);
  if (KrigingDataMeta.grids) labelLayer.graphics.items.forEach((graphic, index) => {
    graphic.symbol = new TextSymbol({
      text: MathUtils.lerp(beforeData.value[index], afterData.value[index], per).toFixed(1), // 标签文字
      color: 'white', // 文字颜色，可调整
      yoffset: -5,
      font: {
        size: 16, // 字体大小（单位：像素）
        family: 'Arial', // 字体类型
      },
    })
  })
  showPopupBox()
}

const formDatachange = (k, v) => {
  switch (k) {
    case "label":
      model.showPopup = v
      break
    case "grid":
      if(gridlayer)gridlayer.visible = v
      if(labelLayer)labelLayer.visible = v
      break
    case "clip":
      layer.renderOpts.useClip = v
      break
    case "splitCount":
      layer.renderOpts.krigingOpts = {...layer.renderOpts.krigingOpts, splitCount: v}
      break
    case "colorMapping":
      const temp = KrigingDataMeta.colorMap.find(i => i.type === v)
      const {truncHead, truncTail} = model.formData
      model.curColorMapping = v === "gradient" ? temp : {...temp, truncHead, truncTail}
      layer.renderOpts.colorMapping = model.curColorMapping
      break
    case "renderSampling":
      layer.renderOpts.renderSampling = v
      break
    case "truncHead":
      layer.renderOpts.colorMapping = {...layer.renderOpts.colorMapping, truncHead: v,}
      break
    case "truncTail":
      layer.renderOpts.colorMapping = {...layer.renderOpts.colorMapping, truncTail: v,}
      break
  }
}

const showPopupBox = () => {
  let afterIndex = KrigingDataMeta.data.findIndex((i) => i.time > layer.curTime);
  if (afterIndex === -1) afterIndex = KrigingDataMeta.data.length - 1;
  const beforeIndex = Math.max(afterIndex - 1, 0);
  const beforeData = KrigingDataMeta.data[beforeIndex];
  const afterData = KrigingDataMeta.data[afterIndex];
  const per = afterIndex === beforeIndex ? 1 : (layer.curTime - beforeData.time) / (afterData.time - beforeData.time);
  model.showListData.forEach((item) => {
    const {index} = item;
    item.value = MathUtils.lerp(beforeData.value[index], afterData.value[index], per); // 线性插值
    const {x, y} = item;
    const screen = viewer.toScreen({type: "point", x, y, spatialReference: {wkid: 4326}});
    item.screenX = screen.x;
    item.screenY = screen.y;
  });


}

// 地图逻辑
const viewer = mapStore.getArcgisViewer();
let layer, gsLayer, labelWatch, gridlayer, labelLayer

const addGrid = () => {
  gridlayer = new GraphicsLayer({
    graphics: KrigingDataMeta.grids.map(rings => new Graphic({
      geometry: new Polygon({
        spatialReference: {wkid: 4326},
        rings,
      }),
      symbol: new SimpleFillSymbol({
        color: 'transparent',
        outline: {
          width: 1,
          color: 'white'
        }
      }),
    }))
  })
  labelLayer = new GraphicsLayer({
    graphics: KrigingDataMeta.grids.map(rings => {
      const polygon = new Polygon({
        spatialReference: {wkid: 4326},
        rings,
      });
      const centroid = polygon.centroid;
      return new Graphic({
        geometry: centroid, // 使用中心点作为几何位置
        symbol: new TextSymbol({
          text: '1', // 标签文字
          color: 'white', // 文字颜色，可调整
          yoffset: 13,
          font: {
            size: 20, // 字体大小（单位：像素）
            family: 'Arial', // 字体类型
          },
        }),
      })
    })
  })
  viewer.map.add(labelLayer)
  viewer.map.add(gridlayer)
}

const addRect = () => {
  const originExtent = new Extent(KrigingDataMeta.pointsExtent);
  const renderExtent = originExtent.clone().expand(1.5);
  gsLayer = new GraphicsLayer({
    graphics: [
      new Graphic({
        geometry: originExtent,
        symbol: {
          type: "simple-fill",
          color: "transparent",
          outline: {
            color: "cyan",
            width: 2,
          },
        } as __esri.SimpleFillSymbolProperties,
      }),
      new Graphic({
        geometry: renderExtent,
        symbol: {
          type: "simple-fill",
          color: "transparent",
          outline: {
            color: "red",
            width: 2,
          },
        } as __esri.SimpleFillSymbolProperties,
      }),
    ],
  });
  viewer.extent = new Extent({
    spatialReference: {
      wkid: 3857,
    },
    xmin: 12498441.441558694,
    ymin: 4423230.213006246,
    xmax: 12548692.01910981,
    ymax: 4475993.319434917,
  });
  viewer.map.add(gsLayer)
}

// lil-gui逻辑
let gui1, gui2, seriesControl
const initGui = () => {
  gui1 = new GUI({title: "Controls"});
  gui1.add(model.formData, "label").onChange(label => formDatachange("label", label));
  gui1.add(model.formData, "grid").onChange(grid => formDatachange("grid", grid));
  gui1.add(model.formData, "clip").onChange(clip => formDatachange("clip", clip));
  gui2 = new GUI({parent: gui1, title: "kriging"});
  gui2Dom.value = gui2.domElement
  gui2.add(model.formData, "splitCount", 10, 200, 1).onChange(splitCount => formDatachange("splitCount", splitCount))
  gui2.add(model.formData, "colorMapping", ["class-break", "gradient"]).onChange(colorMapping => formDatachange("colorMapping", colorMapping))
  gui2.add(model.formData, "renderSampling", ["nearest", "linear"]).onChange(renderSampling => formDatachange("renderSampling", renderSampling))
  gui2.add(model.formData, "truncHead").onChange(truncHead => formDatachange("truncHead", truncHead))
  gui2.add(model.formData, "truncTail").onChange(truncTail => formDatachange("truncTail", truncTail))
}
</script>

<style lang="scss" scoped>
.ts-kriging-wrap {

}
</style>
<style lang="scss">
.tsKriging-label {
  position: absolute;
  display: block;
  left: 0;
  top: 0;
  color: white;
  line-height: 30px;
  transform: translate(var(--x), var(--y)) translateX(-50%);
  --b: 4px;
  text-shadow: 1px 1px var(--b) black, 1px -1px var(--b) black, -1px 1px var(--b) black, -1px -1px var(--b) black;
  pointer-events: none;

  &::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 0;
    width: 10px;
    height: 10px;
    background-color: black;
    border-radius: 5px;
    transform: translate(-50%, -50%);
  }
}
</style>
