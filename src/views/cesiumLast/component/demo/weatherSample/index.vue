<template>
  <div class="weatherSample-wrap">
    <yb-panl class="triangularMesh-panl" v-if="selTimeRang" :selTimeRang="selTimeRang"
             :defaultStartTime="selTimeRang.start" :defaultRange="times.length"
             timeType="m" @timeChange="timeChange"/>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import GUI from "lil-gui";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import axios from "axios";
import {loadKrigingRainPrimitive} from './kriging.ts';
import jsonData from "./data.ts"
// Component
import YbPanl from "@/components/ybPanl/index.vue"
import Tdt_img_d from "@/views/cesiumLast/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {
  Appearance, Cartesian2,
  Cartesian3,
  GeometryInstance,
  GroundPrimitive, Material,
  PolygonGeometry,
  PolygonHierarchy,
  VertexFormat
} from "cesium";
import {glsl_colorMapping, glsl_pack} from "kriging-webgl";

const mapStore = usemapStore()
const model = reactive({
  selTimeRang: null,
  times: [],//所有数据时间点
})
const {selTimeRang, times} = toRefs(model)

onMounted(() => {
  initGui()
  getlist()
  viewer.scene.primitives.add(primitiveCollection);
})

onUnmounted(() => {
  gui.destroy()
  viewer.scene.primitives.remove(primitiveCollection);
})

const getlist = async () => {
  const {data} = await axios.get(import.meta.env.VITE_APP_MODELDATA + `/2dFluidModel/getTime.json`)
  model.times = data.map(Number)
  const start = model.times[0]
  const end = model.times[model.times.length - 1]
  model.selTimeRang = {start, end}
}

let i = 1
const timeChange = (timestamp) => {
  const index = model.times.findIndex(t => t === timestamp)
  if (index < 0) return
  if (prePrimitive) prePrimitive.setTime(i += 0.1);
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let prePrimitive
const primitiveCollection = new Cesium.PrimitiveCollection()

const addCustomPrimitive = () => {
  // 获知边界
  class CustomPrimitive {
    private _packValueRange = [0, 1000];
    private _rings
    private _cols
    private _rows
    private minTime
    private maxTime
    private _uniforms


    constructor(viewer, points, timeRange, rainDataGetter, minSideSize) {
      const lons = points.map(i => i[0]);
      const lats = points.map(i => i[1]);
      const xmin = Math.min.apply(null, lons);
      const xmax = Math.max.apply(null, lons);
      const ymin = Math.min.apply(null, lats);
      const ymax = Math.max.apply(null, lats);
      const width = xmax - xmin, height = ymax - ymin;
      this._rings = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]];
      const cellSize = Math.max(width, height) / minSideSize;
      this._cols = Math.round(width / cellSize);
      this._rows = Math.round(height / cellSize);
      this.addPrmitive()

    }

    addPrmitive() {
      const prmitive = new GroundPrimitive({
        allowPicking: false,
        geometryInstances: new GeometryInstance({
          geometry: new PolygonGeometry({
            vertexFormat: VertexFormat.POSITION_AND_ST,
            polygonHierarchy: new PolygonHierarchy(Cartesian3.fromDegreesArray(rings.flat())),
          }),
        }),
        appearance: new Appearance({
          material: new Material({
            fabric: {
              type: 'KrigingRain',
              uniforms: {
                u_image1: 'czm_defaultImage',
                u_image2: 'czm_defaultImage',
                u_unpackRange: Cartesian2.fromArray(this._packValueRange),
                u_imageSize: Cartesian2.fromArray([this._cols, this._rows]),
                u_percent: -1
              },
              source: `
                  #define texture2D texture
                  ${glsl_colorMapping}
                  ${glsl_pack}

                  float samplingData(sampler2D tex, vec2 uv){
                      vec4 packData = texture(tex, uv);
                      float normalizeVal = unpackRGBToNormalizeFloat(packData.rgb);
                      return mix(u_unpackRange.x, u_unpackRange.y, normalizeVal);
                  }

                  float lookupValue(vec2 uv, sampler2D tex){
                      vec2 onePixel = 1.0 / u_imageSize;
                      vec2 uv0 = floor(uv / onePixel) * onePixel + onePixel * 0.5;

                      //manual bilinear
                      vec2 offset = vec2(
                          uv.x > uv0.x ? 1.0 : -1.0,
                          uv.y > uv0.y ? 1.0 : -1.0
                      );
                      vec2 uv1 = uv0 + offset * onePixel * vec2(1,0);
                      vec2 uv2 = uv0 + offset * onePixel * vec2(0,1);
                      vec2 uv3 = uv0 + offset * onePixel * vec2(1,1);

                      float v0 = samplingData(tex, uv0);
                      float v1 = samplingData(tex, uv1);
                      float v2 = samplingData(tex, uv2);
                      float v3 = samplingData(tex, uv3);

                      float v01 = mix(v0, v1, (uv.x - uv0.x) / (uv1.x - uv0.x));
                      float v23 = mix(v2, v3, (uv.x - uv2.x) / (uv3.x - uv2.x));
                      return mix(v01, v23, (uv.y - uv0.y) / ( uv2.y - uv0.y));
                  }

                  ivec3 getColor(float v){
                      if(v <= 10.0) return ivec3(166, 255, 176);
                      if(v <= 25.0) return ivec3(30, 186, 37);
                      if(v <= 50.0) return ivec3(95, 207, 255);
                      if(v <= 100.0) return ivec3(0, 0, 255);
                      if(v <= 100.0) return ivec3(0, 0, 255);
                      if(v <= 250.0) return ivec3(249, 0, 241);
                      return ivec3(255, 0, 0);
                  }

                  czm_material czm_getMaterial(czm_materialInput materialInput){
                      czm_material m = czm_getDefaultMaterial(materialInput);
                      bool enable = u_percent >= 0.0;
                      vec2 uv = vec2(materialInput.st.x, 1.0 - materialInput.st.y);
                      float rain1 = enable ? lookupValue(uv, u_image1) : 0.0;
                      float rain2 = enable ? lookupValue(uv, u_image2) : 0.0;
                      float rain = mix(rain1, rain2, u_percent);
                      m.diffuse = enable ? vec3(getColor(rain)) / 255.0 : vec3(0,0,0);
                      m.alpha = enable ? m.alpha * 0.5 : 0.0;
                      return m;
                  }
              `
            }
          })
        }),
      });
      primitiveCollection.add(this.prmitive);
      this._uniforms = prmitive.appearance.material.uniforms;
    }

  }

  console.log(123)
}

const addKrigingRainPrimitive = () => {
  prePrimitive = loadKrigingRainPrimitive({
    viewer,
    points: jsonData,
    timeRange: {min: 1, max: 100, interval: 1},
    rainDataGetter() {
      return Promise.resolve(new Array(jsonData.length).fill(0).map(() => Math.random() * 100))
    },
    minSideSize: 200
  });
  prePrimitive.setTime(1)
  viewer.camera.setView({
    destination: new Cesium.Cartesian3.fromDegrees(109.661114, 26.109445, 67000),
    orientation: {
      heading: Cesium.Math.toRadians(350),
      pitch: Cesium.Math.toRadians(-57.4),
      roll: Cesium.Math.toRadians(0),
    },
  })
}

// lil-gui逻辑
let gui
const formData = {
  addCustomPrimitive,
  addKrigingRainPrimitive
}
const initGui = () => {
  gui = new GUI({title: "weatherSample"});
  gui.add(formData, "addKrigingRainPrimitive").name("生成等值图1")
  // gui.add(formData, "addCustomPrimitive").name("生成等值图")

}
</script>

<style lang="scss" scoped>
.weatherSample-wrap {

}
</style>
