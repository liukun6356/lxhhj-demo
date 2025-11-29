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
import {LRUCache} from 'lru-cache';
import {krigingDataMeta as metaData} from "./data/index.ts"
import {krigingDataMeta as metaData1} from "./data1/index.ts"
import {krigingDataMeta as metaData2} from "./data2/index.ts"
import {krigingDataMeta as metaData3} from "./data3/index.ts"
import {krigingDataMeta as metaData4} from "./data4/index.ts"
import {krigingDataMeta as metaData5} from "./data5/index.ts"
import MyWorker from './worker?worker';
import moment from "moment"
// Component
import YbPanl from "@/components/ybPanl/index.vue"
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
const model = reactive({
  selTimeRang: null,
  times: [],//所有数据时间点
})
const {selTimeRang, times} = toRefs(model)

let krigingDataMeta
onMounted(() => {
  initGui()
  viewer.scene.primitives.add(primitiveCollection);
})

onUnmounted(() => {
  gui.destroy()
  viewer.scene.primitives.remove(primitiveCollection);
})

const getlist = async () => {
  model.times = krigingDataMeta.data.map(item => item.time)
  model.selTimeRang = {start: krigingDataMeta.startTime, end: krigingDataMeta.endTime}
}

const timeChange = (timestamp) => {
  if (!prePrimitive) return
  prePrimitive.setTime(timestamp)
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let prePrimitive
const primitiveCollection = new Cesium.PrimitiveCollection()

const addKrigingPrimitive = () => {
  class KrigingPrimitive {
    private _timeRange
    private _prmitive
    private _grid
    private _pointCollection
    private _labelCollection
    private _points
    private _rings
    private _rainDataGetter
    private _gernerateObj
    private _isSingle
    private _maxIndex

    private _packValueRange = [0, 1000];
    private _uniforms

    private _worker
    private _taskId
    private _taskMap = new Map()
    private _dataMap = new Map()

    private _cache = new LRUCache<number, ImageBitmap>({
      max: 32,
      dispose: (texture, t) => {
        texture.close()
        console.log(`dispose at ${t} --> ${moment(t).format('YYYY-MM-DD HH:mm:ss')}`)
      }
    })
    private _queue = []
    private _loadTask
    private _taskTime
    private _curState: {
      beforeTime: number,
      afterTime: number,
      curTime: number,
      percent: number,
    }

    private destroyed = false

    constructor({points, timeRange, rainDataGetter, rings, minSideSize, colorMapping}) {
      this._points = points
      this._rainDataGetter = rainDataGetter
      this._timeRange = timeRange
      const xs = points.map(i => i[0]);
      const ys = points.map(i => i[1]);
      const xmin = Math.min.apply(null, xs);
      const xmax = Math.max.apply(null, xs);
      const ymin = Math.min.apply(null, ys);
      const ymax = Math.max.apply(null, ys);
      const width = xmax - xmin, height = ymax - ymin;
      this._rings = rings ? rings : [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]];
      const cellSize = Math.max(width, height) / minSideSize;
      const cols = Math.round(width / cellSize);
      const rows = Math.round(height / cellSize);
      this._gernerateObj = {
        xs,
        ys,
        llCorner: [xmin, ymin],
        cellSize,
        gridSize: [cols, rows],
        packValueRange: this._packValueRange,
        xyxy: [xmin, ymin, xmax, ymax]
      }
      this.initWorker()
      this.addGrid()
      this.addLabel()
      this.addPrmitive(colorMapping)
      this.flyToExtent(this._gernerateObj.xyxy)
      const {min, max, interval} = this._timeRange;
      const count = max === min ? 1 : ((max - min) / interval + 1);
      this._maxIndex = count - 1;
      this._isSingle = count === 1;
      this.setTime(min)
    }

    get curTime() {
      return this._curState?.curTime || this._timeRange.min
    }

    set curTime(t) {
      this.setTime(t)
    }

    set labelShow(bool) {
      if (this._grid) this._grid.show = bool
      this._labelCollection.show = bool
      this._pointCollection.show = bool
    }

    addPrmitive(colorMapping) {
      const glsl_getColor = colorMapping ? this.generateGLSLIfStatements(colorMapping) : `
        if(v <= 10.0) return ivec3(166, 255, 176);
        if(v <= 25.0) return ivec3(30, 186, 37);
        if(v <= 50.0) return ivec3(95, 207, 255);
        if(v <= 100.0) return ivec3(0, 0, 255);
        if(v <= 100.0) return ivec3(0, 0, 255);
        if(v <= 250.0) return ivec3(249, 0, 241);
      `
      this._prmitive = new Cesium.GroundPrimitive({
        allowPicking: false,
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
            polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(this._rings.flat())),
          }),
        }),
        appearance: new Cesium.Appearance({
          material: new Cesium.Material({
            fabric: {
              type: 'KrigingRain',
              uniforms: {
                u_image1: 'czm_defaultImage',
                u_image2: 'czm_defaultImage',
                u_unpackRange: Cesium.Cartesian2.fromArray(this._packValueRange),
                u_imageSize: Cesium.Cartesian2.fromArray(this._gernerateObj.gridSize),
                u_percent: -1
              },
              source: `
                  #define texture2D texture
                  struct Node {
                      float min;
                      float max;
                      vec4 color;
                  };
                  Node decode_classbreak(vec4 data){
                      float pack_rg = data.b;
                      float pack_ba = data.a;

                      vec4 color = vec4(
                          floor(pack_rg),
                          clamp(fract(pack_rg) * 1000.0, 0.0, 255.0),
                          floor(pack_ba),
                          clamp(fract(pack_ba) * 1000.0, 0.0, 255.0)
                      ) / 255.0;
                      return Node(data.r, data.g, color);
                  }

                  vec4 mappingColor(sampler2D map, int stopCount, float value){
                      int left = 0;
                      int right = stopCount - 1;

                      vec4 headColor = vec4(0);
                      vec4 tailColor = vec4(0);

                      for(int i = 0; i < 8; i++){
                          if(left > right) break;
                          int middle = (left + right) / 2;
                          float x = (float(middle) + 0.5) / 256.0;
                          vec4 encodeData = texture2D(map, vec2(x, 0.5));
                          Node node = decode_classbreak(encodeData);
                          if(middle == 0) headColor = node.color;
                          if(middle == 256 - 1) tailColor = node.color;
                          if(node.min > value){
                              right = middle - 1;
                          }else if(node.max <= value){
                              left = middle + 1;
                          }else{
                              return node.color;
                          }
                      }
                      if(right < 0) return headColor;
                      if(left >= stopCount) return tailColor;
                  }

                  vec4 packNormalizeFloatToRGBA( in float v ) {
                      vec4 enc = vec4(v, fract(vec3(255.0, 65025.0, 16581375.0) * v));
                      enc.xyz -= enc.yzw / 255.0;
                      return enc;
                  }
                  float unpackRGBAToNormalizeFloat( const in vec4 v ) {
                      return dot(v, vec4(1, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
                  }
                  vec3 packNormalizeFloatToRGB( in float v ) {
                      return packNormalizeFloatToRGBA( v ).xyz;
                  }
                  float unpackRGBToNormalizeFloat( const in vec3 v ) {
                      return unpackRGBAToNormalizeFloat( vec4( v, 0 ) );
                  }

                  float samplingData(sampler2D tex, vec2 uv){
                      vec4 packData = texture(tex, uv);
                      float normalizeVal = unpackRGBToNormalizeFloat(packData.rgb);
                      return mix(u_unpackRange.x, u_unpackRange.y, normalizeVal);
                  }

                  float lookupValue(vec2 uv, sampler2D tex){
                      vec2 onePixel = 1.0 / u_imageSize;
                      vec2 uv0 = floor(uv / onePixel) * onePixel + onePixel * 0.5;

                      //manual bilinear
                      vec2 offset = vec2(uv.x > uv0.x ? 1.0 : -1.0 ,uv.y > uv0.y ? 1.0 : -1.0);
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
                      ${glsl_getColor}
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
      primitiveCollection.add(this._prmitive);
      this._uniforms = this._prmitive.appearance.material.uniforms;
    }

    addGrid() {
      const col = [...new Set(this._gernerateObj.xs)].length
      const row = [...new Set(this._gernerateObj.ys)].length
      if (this._points.length < col + row) return
      const [xmin, ymin, xmax, ymax] = this._gernerateObj.xyxy
      const yy = (ymax - ymin) / (col - 1) / 2
      const xx = (xmax - xmin) / (row - 1) / 2
      const instance = new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
          rectangle: Cesium.Rectangle.fromDegrees(xmin - xx, ymin - yy, xmax + xx, ymax + yy),
        }),
      });
      this._grid = primitiveCollection.add(new Cesium.Primitive({
        geometryInstances: instance,
        asynchronous: false,
        appearance: new Cesium.MaterialAppearance({
          material: new Cesium.Material({
            fabric: {
              type: 'Grid',
              uniforms: {
                color: Cesium.Color.WHITE,
                cellAlpha: 0.0,
                lineCount: new Cesium.Cartesian2(col, row), // 网格列数、行数
                lineThickness: new Cesium.Cartesian2(1.0, 1.0),
                lineOffset: new Cesium.Cartesian2(0.0, 0.0),
              },
            },
          }),
        }),
      }));
    }

    addLabel() {
      this._pointCollection = primitiveCollection.add(new Cesium.PointPrimitiveCollection());
      this._labelCollection = primitiveCollection.add(new Cesium.LabelCollection({scene: viewer.scene}));
      this._points.forEach(pos => {
        this._pointCollection.add({
          position: Cesium.Cartesian3.fromDegrees(pos[0], pos[1], 0),
          color: Cesium.Color.WHITE,
        });
        this._labelCollection.add({
          position: Cesium.Cartesian3.fromDegrees(pos[0], pos[1], 0),
          text: '111',
          font: `14px`,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          fillColor: Cesium.Color.fromCssColorString("#fff").withAlpha(1),
          outlineColor: new Cesium.Color.fromCssColorString('black'),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        })
      })
    }

    generateGLSLIfStatements(colorStops) {
      function hexToRgb(hex) {
        hex = hex.replace("#", "");
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
      }

      return colorStops.map(stop => {
        const [r, g, b] = hexToRgb(stop.color);
        return `if(v <= ${stop.max.toFixed(1)}) return ivec3(${r}, ${g}, ${b});`;
      }).join("\n")
    }

    updateUniforms() {
      const {curTime, beforeTime, afterTime, percent} = this._curState;
      if (curTime >= this._curState.beforeTime && curTime <= this._curState.afterTime && this._cache.has(beforeTime) && this._cache.has(afterTime)) {
        this._uniforms.u_image1 = this._cache.get(beforeTime);
        this._uniforms.u_image2 = this._cache.get(afterTime);
        this._uniforms.u_percent = percent;
        // this._uniforms.u_colorMapping = 2 // 1 2
      } else {
        this._uniforms.u_percent = -1;
      }
    }

    flyToExtent(xyxy) {
      const rectangle = Cesium.Rectangle.fromDegrees.apply(null, xyxy);
      const boundingSphere = Cesium.BoundingSphere.fromRectangle3D(rectangle)
      viewer.camera.flyToBoundingSphere(boundingSphere, {offset: new Cesium.HeadingPitchRange(0.0, Cesium.Math.toRadians(-45.0), boundingSphere.radius * 2.5)});
    }

    setTime(t) {
      const [beforeIndex, afterIndex] = this.getRangeValueIn(t);
      const preloads = [];
      for (let i = 1; i <= 5; i++) {
        const nextIndex = afterIndex + i;
        if (nextIndex > this._maxIndex) break;
        preloads.push(this.getValue(nextIndex));
      }
      const beforeTime = this.getValue(beforeIndex);
      const afterTime = this.getValue(afterIndex);
      this._curState = {
        beforeTime,
        afterTime,
        curTime: t,
        percent: this._isSingle ? 0 : (t - beforeTime) / (afterTime - beforeTime)
      };
      if (this._dataMap.has(t)) this._labelCollection._labels.forEach((label, i) => label.text = this._dataMap.get(t)[i].toFixed(1))
      this._queue = [beforeTime, afterTime, ...preloads].filter(t => t !== this._taskTime && !this._cache.has(t));
      this.startLoad()
      this.updateUniforms()
    }

    getValue(index) {
      const {min, interval} = this._timeRange;
      return min + index * interval
    }

    getRangeValueIn(anyValue) {
      const {min, max, interval} = this._timeRange;
      if (anyValue <= min) return this._isSingle ? [0.0] : [0, 1]
      if (anyValue >= max) return [this._maxIndex, this._maxIndex]
      const after = Math.ceil((anyValue - min) / interval)
      return [after - 1, after]
    }

    startLoad() {
      if (this._loadTask || !this._queue.length) return;
      const timeFrame = this._taskTime = this._queue.shift();
      this._loadTask = this._rainDataGetter(timeFrame)
          .then(data => {
            if (!this._dataMap.has(timeFrame)) {
              this._dataMap.set(timeFrame, data)
              if (timeFrame === this._curState.curTime) this._labelCollection._labels.forEach((label, i) => label.text = data[i].toFixed(1))
            }
            return this.gerenate({...this._gernerateObj, data})
          })
          .then(({packedImagebitmap, generateTime, trainTime}) => {
            if (this.destroyed) return;
            console.log(`data at ${timeFrame} --> ${moment(timeFrame).format('YYYY-MM-DD HH:mm:ss')}, train: ${trainTime.toFixed(1)}ms, generate: ${generateTime.toFixed(1)}ms`);
            this._cache.set(timeFrame, packedImagebitmap);
            this.updateUniforms();
          })
          .finally(() => {
            this._taskTime = this._loadTask = null;
            this.startLoad();
          });
    }

    initWorker() {
      this._worker = new MyWorker();
      this._taskId = 0;
      this._taskMap = new Map();
      this._worker.onmessage = e => {
        const {id, result, success, error} = e.data;
        const handle = this._taskMap.get(id);
        success ? handle.resolve(result) : handle.reject(error)
        this._taskMap.delete(id);
      }
    }

    gerenate(data) {
      let resolve;
      let reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      const id = this._taskId++;
      this._worker.postMessage({data, id});
      this._taskMap.set(id, {resolve, reject});
      return promise;
    }

    destroy() {
      if (this.destroyed) return;
      primitiveCollection.remove(this._prmitive)
      this._taskMap.values().forEach(f => f.reject('close'));
      this._taskMap.clear();
      this._dataMap.clear();
      this._worker.terminate();
      this._cache.clear();
      this.destroyed = true;
    }
  }

  prePrimitive = new KrigingPrimitive({
    points: krigingDataMeta.points,
    rings: krigingDataMeta.rings,
    minSideSize: 200,
    timeRange: {min: krigingDataMeta.startTime, max: krigingDataMeta.endTime, interval: krigingDataMeta.interval},
    colorMapping: krigingDataMeta.colorMap.breaks,
    rainDataGetter(t) {
      return Promise.resolve(krigingDataMeta.data.find(item => item.time === t).value)
    },
  })
}

const destroy = () => {
  if (prePrimitive) prePrimitive.destroy()
}

const reset = () => {
  primitiveCollection.removeAll()
}


// lil-gui逻辑
let gui
const formData = {
  labelShow: true,
  minSideSize: 200,
  data: "",
  destroy,
  reset
}
const initGui = () => {
  gui = new GUI({title: "weatherSample"});
  gui.add(formData, "data", ["jz", "data1", "ga", "data3", "mj","cz"]).onChange(type => {
    reset()
    switch (type) {
      case "jz":
        krigingDataMeta = metaData
        break
      case "data1":
        krigingDataMeta = metaData1
        break
      case "ga":
        krigingDataMeta = metaData2
        break
      case "data3":
        krigingDataMeta = metaData3
        break
      case "mj":
        krigingDataMeta = metaData4
        break
      case "cz":
        krigingDataMeta = metaData5
        break
    }
    getlist()
    addKrigingPrimitive()
  }).setValue("cz")
  gui.add(formData, "labelShow").onChange(bool => prePrimitive.labelShow = bool)
  gui.add(formData, "destroy")
  gui.add(formData, "reset")
}

</script>

<style lang="scss" scoped>
.weatherSample-wrap {

}
</style>
