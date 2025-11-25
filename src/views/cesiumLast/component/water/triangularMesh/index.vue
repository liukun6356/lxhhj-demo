<template>
  <div class="triangularMesh-wrap">
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
import proj4 from "proj4";
import axios from "axios";
import {Cartesian2, Color} from "cesium";
import colorstopPng from "./colorstop.png"
import {asyncTaskScheduler, calcDataTexSize, findIntervalIndexThatValueIn, getFramePrediction, LRUCache} from "./utils";
import moment from "moment";
// Component
import YbPanl from "@/components/ybPanl/index.vue"
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

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
  const {data: data1} = await axios.get(import.meta.env.VITE_APP_MODELDATA + `/2dFluidModel/2dFluidModel.json`)
  const lonlats = new Float64Array(JSON.parse(data1.vertices).map((item) => proj4('EPSG:4547', 'EPSG:4326', item)).flat());
  triangles = new Uint32Array(JSON.parse(data1.triangles).flat())
  vertices = new Float32Array(lonlats.length);
  for (let i = 0; i < lonlats.length; i += 3) {
    const lon = lonlats[i];
    const lat = lonlats[i + 1];
    const world = Cesium.Cartesian3.fromDegrees(lon, lat);
    vertices[i] = world.x;
    vertices[i + 1] = world.y;
    vertices[i + 2] = world.z;
  }

  gridPrimitiveControl.enable()
  floodPrimitiveControl.enable()
}

const timeChange = (timestamp) => {
  const index = model.times.findIndex(t => t === (timestamp))
  if (index < 0) return
  if (floodPrimitive) floodPrimitive.setCurTime(timestamp);
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let gridPrimitive, floodPrimitive, handler, vertices, triangles, timeData = {}
const primitiveCollection = new Cesium.PrimitiveCollection()

const addGridPrimitive = () => {
  class GridPrimitive {
    private _command
    private _vertices
    private _triangles
    private _dataIndexArr
    private modelMatrix
    private _destroyed
    private name
    private show

    constructor(vertices, triangles) {
      this._vertices = vertices
      this._triangles = triangles
      this._destroyed = false
      this.name = "grid"
      this.show = true;
      this.modelMatrix = Cesium.Matrix4.IDENTITY;
    }

    /**
     * 创建 DrawCommand
     * @param {Cesium.Context} context 用于创建着色器
     * @returns {Cesium.DrawCommand}
     */
    _createCommand(context) {
      const verticesHigh = new Float32Array(this._vertices.length);
      const verticesLow = new Float32Array(this._vertices.length);
      for (let i = 0; i < this._vertices.length; i += 3) {
        const i1 = i + 1, i2 = i + 2;
        const x = this._vertices[i];
        const y = this._vertices[i1];
        const z = this._vertices[i2];
        const [hx, lx] = this._doubleToTwoFloats(x);
        const [hy, ly] = this._doubleToTwoFloats(y);
        const [hz, lz] = this._doubleToTwoFloats(z);
        verticesHigh[i] = hx;
        verticesHigh[i1] = hy;
        verticesHigh[i2] = hz;
        verticesLow[i] = lx;
        verticesLow[i1] = ly;
        verticesLow[i2] = lz;
      }
      const positionHighBuffer = Cesium.Buffer.createVertexBuffer({
        context,
        typedArray: verticesHigh,
        usage: Cesium.BufferUsage.STATIC_DRAW,
      });
      const positionLowBuffer = Cesium.Buffer.createVertexBuffer({
        context,
        typedArray: verticesLow,
        usage: Cesium.BufferUsage.STATIC_DRAW,
      });
      const triangleCount = this._triangles.length / 3;
      const gridLineIndexArr = new Uint32Array(triangleCount * 6);
      for (let i = 0; i < triangleCount; i++) {
        const i3 = i * 3;
        const ia = this._triangles[i3];
        const ib = this._triangles[i3 + 1];
        const ic = this._triangles[i3 + 2];
        const i6 = i * 6;
        // 相当于画了 ab,ac,bc 三条线
        gridLineIndexArr[i6] = ia;
        gridLineIndexArr[i6 + 1] = ib;
        gridLineIndexArr[i6 + 2] = ia;
        gridLineIndexArr[i6 + 3] = ic;
        gridLineIndexArr[i6 + 4] = ib;
        gridLineIndexArr[i6 + 5] = ic;
      }
      const indexBuffer = Cesium.Buffer.createIndexBuffer({
        context,
        typedArray: gridLineIndexArr,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: Cesium.IndexDatatype.UNSIGNED_INT,
      });
      const attributeLocations = {positionHigh: 1, positionLow: 2}
      const vertexArray = new Cesium.VertexArray({
        context,
        attributes: [
          {
            index: 1,
            vertexBuffer: positionHighBuffer,
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            normalize: false,
          },
          {
            index: 2,
            vertexBuffer: positionLowBuffer,
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            normalize: false,
          },
        ],
        indexBuffer,
        attributeLocations
      });
      const vertexShader = `
          #version 300 es
          in vec3 positionHigh;
          in vec3 positionLow;

          void main() {
              vec4 positionRelativeToEye = czm_translateRelativeToEye(positionHigh, positionLow);
              vec4 positionEC = czm_modelViewRelativeToEye * positionRelativeToEye;
              gl_Position = czm_projection * positionEC;
          }
      `;
      const fragmentShader = `
          #version 300 es
          precision highp float;

          uniform vec3 color;
          out vec4 fragColor;

          void main() {
              fragColor = vec4(color, 0.1);
          }
      `;
      const vertexShaderSource = new Cesium.ShaderSource({sources: [vertexShader]});
      const fragmentShaderSource = new Cesium.ShaderSource({sources: [fragmentShader]});
      const shaderProgram = Cesium.ShaderProgram.fromCache({
        context,
        vertexShaderSource,
        fragmentShaderSource,
        attributeLocations
      })
      const uniformMap = {
        color: () => Cesium.Color.WHITE
      }
      const rawRenderState = Cesium.Appearance.getDefaultRenderState(true, false, {});
      const renderState = Cesium.RenderState.fromCache(rawRenderState);
      return new Cesium.DrawCommand({
        vertexArray,
        shaderProgram,
        uniformMap,
        renderState,
        // owner: this,
        pass: Cesium.Pass.OPAQUE,
        primitiveType: Cesium.PrimitiveType.LINES,// 线
        modelMatrix: this.modelMatrix,
      });
    }

    /**
     * 处理高低位精度：高低位分解 2**16，笛卡尔束通常事很大的数字，将坐标分解为高位和低位，提高渲染经度，避免抖动 => 单精度浮点数->双精度浮点数
     * 高位 表示主要位置（粗略网格）     低位 表示相对于高位的偏移量（细节）
     * @param {number} v
     * @returns {array}  [高位，低位]
     */
    _doubleToTwoFloats(v: number) {
      if (v >= 0) {
        const i = 65536 * Math.floor(v / 65536);
        return [i, v - i];
      } else {
        const i = 65536 * Math.floor(-v / 65536);
        return [-i, v + i];
      }
    }

    /**
     * 实现Primitive接口，供Cesium内部在每一帧中调用
     * @param {Cesium.FrameState} frameState
     */
    update(frameState) {
      if (!this.show) return;
      if (this._destroyed) return;
      if (!Cesium.defined(this._command)) this._command = this._createCommand(frameState.context);
      if (Cesium.defined(this._command)) {
        frameState.commandList.push(this._command);
      }
    }

    isDestroyed() {
      return this._destroyed;
    }

    destroy() {
      if (this._destroyed) return
      this._destroyed = true;
      if (Cesium.defined(this._command)) {
        this._command.shaderProgram = this._command.shaderProgram && this._command.shaderProgram.destroy();
        this._command.vertexArray = this._command.vertexArray && this._command.vertexArray.destroy();
        this._command = undefined;
      }
      return Cesium.destroyObject(this);
    }
  }

  gridPrimitive = new GridPrimitive(vertices, triangles)
  primitiveCollection.add(gridPrimitive)
  showGridControl.show()
  showGridControl.setValue(true)
  viewer.camera.setView({
    destination: new Cesium.Cartesian3.fromDegrees(113.041846, 25.776040, 5211.91),
    orientation: {
      heading: Cesium.Math.toRadians(350),
      pitch: Cesium.Math.toRadians(-57.4),
      roll: Cesium.Math.toRadians(0),
    },
  })
}

const removeGridPrimitive = () => {
  const primitive = primitiveCollection._primitives.find(primitive => primitive.name === "grid")
  if (primitive) {
    primitive.destroy()
    showGridControl.hide()
    showGridControl.setValue(false)
  }
}

const addFloodPrimitive = () => {
  type Source = {
    times: number[];
    dataGetter: (t: number) => Promise<Float32Array>;
  };

  class FloodPrimitive {
    private _command
    private _vertices
    private _triangles
    private modelMatrix
    private _destroyed
    private _uniformStore
    private _sourceOpts: Source
    private _dataSource: ReturnType<typeof createDataSource>
    private name
    private show
    private curTime: number

    constructor(vertices, triangles) {
      this._vertices = vertices
      this._triangles = triangles
      this._destroyed = false
      this._uniformStore = {
        mappingRange: new Cartesian2(0, 5),
        colorstopTexture: null,
        lerp: 0,
        tex1: null as Cesium.Texture,
        tex2: null as Cesium.Texture,
        texSize: new Cartesian2(1, 1),
        texDataFlag: new Cartesian2(0, 0),
        gridColor: Color.fromCssColorString('rgba(255, 255, 255, 0.1)'),
      }
      this.name = "flood"
      this.show = true;
      this.modelMatrix = Cesium.Matrix4.IDENTITY;
    }

    /**
     * 创建 DrawCommand
     * @param {Cesium.Context} context 用于创建着色器
     * @returns {Cesium.DrawCommand}
     */
    _createCommand(context) {
      Cesium.Resource.createIfNeeded(colorstopPng).fetchImage().then(img => {
        this._uniformStore.colorstopTexture = new Cesium.Texture({
          context,
          flipY: false,
          sampler: new Cesium.Sampler({
            minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
          }),
          source: img,
          pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
          pixelFormat: Cesium.PixelFormat.RGBA,
        });
      })

      const verticesHigh = new Float32Array(this._vertices.length);
      const verticesLow = new Float32Array(this._vertices.length);
      for (let i = 0; i < this._vertices.length; i += 3) {
        const i1 = i + 1, i2 = i + 2;
        const x = this._vertices[i];
        const y = this._vertices[i1];
        const z = this._vertices[i2];
        const [hx, lx] = this._doubleToTwoFloats(x);
        const [hy, ly] = this._doubleToTwoFloats(y);
        const [hz, lz] = this._doubleToTwoFloats(z);
        verticesHigh[i] = hx;
        verticesHigh[i1] = hy;
        verticesHigh[i2] = hz;
        verticesLow[i] = lx;
        verticesLow[i1] = ly;
        verticesLow[i2] = lz;
      }
      const positionHighBuffer = Cesium.Buffer.createVertexBuffer({
        context,
        typedArray: verticesHigh,
        usage: Cesium.BufferUsage.STATIC_DRAW,
      });
      const positionLowBuffer = Cesium.Buffer.createVertexBuffer({
        context,
        typedArray: verticesLow,
        usage: Cesium.BufferUsage.STATIC_DRAW,
      });
      const dataIndexArr = new Float32Array(this._vertices.length / 3);
      for (let i = dataIndexArr.length; i--;) dataIndexArr[i] = i;
      const dataIndexBuffer = Cesium.Buffer.createVertexBuffer({
        context,
        typedArray: dataIndexArr,
        usage: Cesium.BufferUsage.STATIC_DRAW,
      });
      const indexBuffer = Cesium.Buffer.createIndexBuffer({
        context,
        typedArray: this._triangles,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: Cesium.IndexDatatype.UNSIGNED_INT,
      });
      const attributeLocations = {dataIndex: 0, positionHigh: 1, positionLow: 2}
      const vertexArray = new Cesium.VertexArray({
        context,
        attributes: [
          {
            index: attributeLocations.dataIndex,
            vertexBuffer: dataIndexBuffer,
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 1,
            normalize: false,
          },
          {
            index: attributeLocations.positionHigh,
            vertexBuffer: positionHighBuffer,
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            normalize: false,
          },
          {
            index: attributeLocations.positionLow,
            vertexBuffer: positionLowBuffer,
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            normalize: false,
          },
        ],
        indexBuffer,
        attributeLocations,
      })
      const emptyTex1 = new Cesium.Texture({
        context,
        source: {
          width: 1,
          height: 1,
          arrayBufferView: new Uint8ClampedArray(4),
        },
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
        pixelFormat: Cesium.PixelFormat.RGBA,
      });
      const emptyTex2 = new Cesium.Texture({
        context,
        source: {
          width: 1,
          height: 1,
          arrayBufferView: new Uint8ClampedArray(4),
        },
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
        pixelFormat: Cesium.PixelFormat.RGBA,
      });
      const uniformMap = {
        u_lerp: () => this._uniformStore.lerp,
        u_tex1: () => this._uniformStore.tex1 || emptyTex1,
        u_tex2: () => this._uniformStore.tex2 || emptyTex2,
        u_texDataFlag: () => this._uniformStore.texDataFlag,
        u_texSize: () => this._uniformStore.texSize,
        u_colorstop: () => this._uniformStore.colorstopTexture,
        u_mappingRange: () => this._uniformStore.mappingRange,
      };
      const vertexShader = `
          #define texture2D texture

          uniform vec2 u_texSize;
          uniform vec2 u_texDataFlag;
          uniform float u_lerp;
          uniform sampler2D u_tex1;
          uniform sampler2D u_tex2;
          uniform sampler2D u_colorstop;
          uniform vec2 u_mappingRange;

          in vec3 positionHigh;
          in vec3 positionLow;
          in float dataIndex;

          out vec4 v_color;

          float lookupValue(sampler2D map, float index){
              float pixelIndex = floor(index / 4.0);
              float componentIndex = mod(index, 4.0);
              float col = mod(pixelIndex, u_texSize.x);
              float row = floor(pixelIndex / u_texSize.x);

              vec2 onePixel = 1.0 / u_texSize;
              vec2 uv = (vec2(col, row) + 0.5) * onePixel;

              vec4 v = texture2D(map, uv);

              if(componentIndex == 0.0) return v.x;
              if(componentIndex == 1.0) return v.y;
              if(componentIndex == 2.0) return v.z;
              if(componentIndex == 3.0) return v.w;
          }

          void main(){
              vec4 positionRelativeToEye = czm_translateRelativeToEye(positionHigh, positionLow);
              vec4 positionEC = czm_modelViewRelativeToEye * positionRelativeToEye;
              gl_Position = czm_projection * positionEC;

              float v1 = u_texDataFlag.x > 0.5 ? lookupValue(u_tex1, dataIndex) : 0.0;
              float v2 = u_texDataFlag.y > 0.5 ? lookupValue(u_tex2, dataIndex) : 0.0;

              float v = mix(v1, v2, u_lerp);

              if(v <= 0.0){
                  v_color = vec4(0);
              }else{
                  float ux = (v - u_mappingRange.x) / (u_mappingRange.y - u_mappingRange.x) / 1e4;
                  v_color = texture2D(u_colorstop, vec2(ux, 0.5));
              }
          }
      `
      const fragmentShader = `
          in vec4 v_color;
          void main(){
              vec3 color = czm_gammaCorrect(v_color.rgb);
              out_FragColor = vec4(color, v_color.a);
          }
      `
      const vertexShaderSource = new Cesium.ShaderSource({sources: [vertexShader]});
      const fragmentShaderSource = new Cesium.ShaderSource({sources: [fragmentShader]});
      const shaderProgram = Cesium.ShaderProgram.fromCache({
        context,
        vertexShaderSource,
        fragmentShaderSource,
        attributeLocations
      })
      const rawRenderState = Cesium.Appearance.getDefaultRenderState(true, false, {});
      const renderState = Cesium.RenderState.fromCache(rawRenderState);
      return new Cesium.DrawCommand({
        vertexArray,
        shaderProgram,
        uniformMap,
        renderState,
        // owner: this,
        pass: Cesium.Pass.OPAQUE,
        // primitiveType: Cesium.PrimitiveType.LINES,// 线
        modelMatrix: this.modelMatrix,
      });
    }

    /**
     * 设置数据源
     * @param {Source} opts 数据源
     */
    changeSource(opts: Source) {
      this._sourceOpts = opts;
    }

    /**
     * 设置当前时间
     * @param {number} t 时间点
     */
    setCurTime(t) {
      this.curTime = t;
      if (!this._dataSource) return;
      this._dataSource.setCurTime(t);
    }

    /**
     * 判断当前时间能否渲染
     * @param {number} t 时间点
     */
    canRenderAtTime(t) { // 判断该时间点数据有没准备好
      if (!this._dataSource) return false;
      return !!this._dataSource.getDataAtTime(t);
    }

    /**
     * 处理高低位精度：高低位分解 2**16，笛卡尔束通常事很大的数字，将坐标分解为高位和低位，提高渲染经度，避免抖动 => 单精度浮点数->双精度浮点数
     * 高位 表示主要位置（粗略网格）     低位 表示相对于高位的偏移量（细节）
     * @param {number} v
     * @returns {array}  [高位，低位]
     */
    _doubleToTwoFloats(v: number) {
      if (v >= 0) {
        const i = 65536 * Math.floor(v / 65536);
        return [i, v - i];
      } else {
        const i = 65536 * Math.floor(-v / 65536);
        return [-i, v + i];
      }
    }

    /**
     * 实现Primitive接口，供Cesium内部在每一帧中调用
     * @param {Cesium.FrameState} frameState
     */
    update(frameState) {
      if (!this.show) return;
      if (this._destroyed) return;
      if (!Cesium.defined(this._command)) this._command = this._createCommand(frameState.context);
      if (!this._uniformStore.colorstopTexture) return
      if (this._sourceOpts !== this._dataSource?.sourceOpts) {
        if (this._dataSource) this._dataSource.destroy();
        if (this._sourceOpts) {
          this._dataSource = createDataSource(frameState.context, this._sourceOpts)
          this._dataSource.setCurTime(this.curTime ?? this._dataSource.minTime)
          if (!this.curTime) this.curTime = this._dataSource.minTime
        }
      }
      const resource = this._dataSource.getDataAtTime(this.curTime);
      if (!resource) return
      const {beforeTime, afterTime, data1, data2} = resource;
      if (!data1 || !data2) return
      this._uniformStore.lerp = (this.curTime - beforeTime) / (afterTime - beforeTime);
      this._uniformStore.tex1 = data1;
      this._uniformStore.tex2 = data2;
      this._uniformStore.texDataFlag.x = data1 ? 1 : 0;
      this._uniformStore.texDataFlag.y = data2 ? 1 : 0;
      this._uniformStore.texSize.x = this._dataSource.texSize[0];
      this._uniformStore.texSize.y = this._dataSource.texSize[1];
      frameState.commandList.push(this._command)
    }

    isDestroyed() {
      return this._destroyed;
    }

    destroy() {
      if (this._destroyed) return
      this._destroyed = true;
      if (Cesium.defined(this._command)) {
        this._command.shaderProgram = this._command.shaderProgram && this._command.shaderProgram.destroy();
        this._command.vertexArray = this._command.vertexArray && this._command.vertexArray.destroy();
        this._command = undefined;
        this._uniformStore = this._uniformStore.colorstopTexture?.destroy()
      }
      return Cesium.destroyObject(this);
    }
  }

  floodPrimitive = new FloodPrimitive(vertices, triangles)
  primitiveCollection.add(floodPrimitive);
  floodPrimitive.changeSource({
    times: model.times.map(Number),
    dataGetter: async (time) => {
      const {data: res} = await axios.get(import.meta.env.VITE_APP_MODELDATA + `/2dFluidModel/timeData/filename-${time}.gzip`, {responseType: "blob"})
      const temp = await res.arrayBuffer()
      return new Int32Array(temp)
    }
  })
  showFloodControl.show()
  showFloodControl.setValue(true)
  viewer.camera.setView({
    destination: new Cesium.Cartesian3.fromDegrees(113.041846, 25.776040, 5211.91),
    orientation: {
      heading: Cesium.Math.toRadians(350),
      pitch: Cesium.Math.toRadians(-57.4),
      roll: Cesium.Math.toRadians(0),
    },
  })
}

const removeFloodPrimitive = () => {
  const primitive = primitiveCollection._primitives.find(primitive => primitive.name === "flood")
  if (primitive) {
    primitive.destroy()
    showFloodControl.hide()
    showFloodControl.setValue(false)
  }
}

enum EnumTaskStatus {
  none = 'none',
  pending = 'pending',
  finish = 'finish',
  error = 'error',
}

const createDataSource = (context, opts) => {
  const {times, dataGetter} = opts;
  times.sort((a, b) => a - b);
  const minTime = times[0], maxTime = times[times.length - 1];
  type TaskRecord = {
    key: number; //time
    status: EnumTaskStatus;
    isEmpty: boolean;
  };
  const taskMap = new Map<number /*time*/, TaskRecord>();
  const cache = new LRUCache<Cesium.Texture, number /*time*/>(256, {
    onRemove(obj, key) {
      taskMap.delete(key);
      obj.destroy();
    },
  });
  let dataLength: number;
  let texSize: number[];
  let totalTexBufferLength: number;
  const scheduler = asyncTaskScheduler<TaskRecord, Float32Array>({
    invoke(task) {
      task.status = EnumTaskStatus.pending;
      return dataGetter(task.key);
    },
    onSuccess(dataArr, task) {
      if (!dataLength) {
        dataLength = dataArr.length;
        texSize = calcDataTexSize(dataLength / 4);
        totalTexBufferLength = texSize[0] * texSize[1] * 4;
      }
      if (dataLength !== dataArr.length) throw new Error('时序数据长度不一致');
      let min = 0, max = 0;
      for (let i = dataArr.length; i--;) {
        min = Math.min(min, dataArr[i]);
        max = Math.max(max, dataArr[i]);
      }
      task.status = EnumTaskStatus.finish;
      if (max > 0) {
        const buffer = new Float32Array(totalTexBufferLength);
        buffer.set(dataArr);
        const tex = new Cesium.Texture({
          context: context,
          flipY: false,
          sampler: new Cesium.Sampler({
            minificationFilter:
            Cesium.TextureMinificationFilter.LINEAR,
            magnificationFilter:
            Cesium.TextureMagnificationFilter.NEAREST,
          }),
          source: {
            width: texSize[0], //rgba
            height: texSize[1],
            arrayBufferView: buffer,
          },
          pixelDatatype: Cesium.PixelDatatype.FLOAT,
          pixelFormat: Cesium.PixelFormat.RGBA,
        });
        cache.add(task.key, tex);
        task.isEmpty = false;
      } else {
        task.isEmpty = true;
      }
      console.log(moment(task.key).format('YYYY-MM-DD HH:mm'), `[${min.toFixed(2)}, ${max.toFixed(2)}]`);
    },
    onError(error, task) {
      task.status = EnumTaskStatus.error;
      console.error(`load tile [${moment(task.key).format('YYYY-MM-DD HH:mm')}] fail\n`, error);
      throw error;
    },
    maxConcurrency: 2,
  });
  let curTime = NaN;
  let beforeIndex = NaN;
  let afterIndex = NaN;

  const handleTimeChange = (t: number) => {
    if (curTime === t) return;
    curTime = t;
    const res = getFramePrediction({times, curTime: t, preload: {frame: 10}});
    if (beforeIndex === res.beforeIndex && afterIndex === res.afterIndex) return;
    beforeIndex = res.beforeIndex;
    afterIndex = res.afterIndex;
    const {timeIndexSet} = res;
    scheduler.updateQueue((running, waiting) => {
      const loadTimes = new Set(
          Array.from(timeIndexSet).map((i) => times[i])
      );
      running.forEach(({desc, cancel}) => {
        if (!loadTimes.has(desc.key)) cancel?.('时间超出范围');
      });
      return Array.from(timeIndexSet)
          .sort((A, B) => B - A)
          .map((index) => {
            const time = times[index];
            let task = taskMap.get(time);
            if (!task) {
              task = {
                key: time,
                status: EnumTaskStatus.none,
                isEmpty: null,
              };
              taskMap.set(time, task);
            }
            return task.status === 'none' ? task : null;
          })
          .filter(Boolean);
    });
  }

  return {
    get minTime() {
      return minTime;
    },
    get maxTime() {
      return maxTime;
    },
    get texSize() {
      return texSize;
    },
    get dataLength() {
      return dataLength;
    },
    get sourceOpts() {
      return opts;
    },
    setCurTime: handleTimeChange,
    getDataAtTime: (t: number) => {
      const [beforeIndex, afterIndex] = findIntervalIndexThatValueIn(times, t);
      const beforeTime = times[beforeIndex], afterTime = times[afterIndex];
      const r1 = taskMap.get(beforeTime), r2 = taskMap.get(afterTime);
      return r1?.status === 'finish' && r2?.status === 'finish' ? {
        beforeTime,
        afterTime,
        data1: cache.get(beforeTime),
        data2: cache.get(afterTime),
      } : null;
    },
    destroy() {
      scheduler.clear('');
      cache.clear('');
      taskMap.clear();
    },
  };
}

type TaskRecord = {
  key: number; //time
  status: EnumTaskStatus;
  isEmpty: boolean;
};

class DataSource {
  private times
  private minTime
  private maxTime
  private texSize
  private dataLength

  private _cache
  private _taskMap = new Map<number /*time*/, TaskRecord>();

  constructor(times, dataGetter) {
    this.times = times.sort((a, b) => a - b);
    this.minTime = times[0]
    this.maxTime = times[times.length - 1];
    this._cache = new LRUCache<Cesium.Texture, number /*time*/>(256, {
      onRemove(obj, key) {
        this._taskMap.delete(key);
        obj.destroy();
      },
    });


  }
}

const doClick = () => {
  const aaa = new DataSource([],2)
  debugger
}

const addCustomPrimitive = () => {
  class CustomPrimitive {

    constructor() {

    }
  }
}

const reset = () => {
  primitiveCollection.removeAll()
}

// lil-gui逻辑
let gui, gridFolder, gridPrimitiveControl, showGridControl, floodFolder, floodPrimitiveControl, showFloodControl
const formData = {
  addGridPrimitive,
  showGrid: false,
  removeGridPrimitive,
  addFloodPrimitive,
  showFlood: false,
  removeFloodPrimitive,
  doClick,
  reset
}
const initGui = () => {
  gui = new GUI({title: "triangularMesh"});
  gridFolder = gui.addFolder('网格');
  showGridControl = gridFolder.add(formData, "showGrid").name("show").onChange((bool) => gridPrimitive.show = bool)
  showGridControl.hide()
  gridPrimitiveControl = gridFolder.add(formData, "addGridPrimitive").name("生成网格")
  gridPrimitiveControl.disable()
  gui.add(formData, "removeGridPrimitive").name("销毁网格")
  floodFolder = gui.addFolder('洪水');
  showFloodControl = floodFolder.add(formData, "showFlood").name("show").onChange((bool) => floodPrimitive.show = bool)
  showFloodControl.hide()
  floodPrimitiveControl = floodFolder.add(formData, "addFloodPrimitive").name("生成洪水")
  floodPrimitiveControl.disable()
  floodFolder.add(formData, "removeFloodPrimitive").name("销毁洪水")
  // gui.add(formData, 'doClick').name("todo")
  gui.add(formData, "reset")
}
</script>

<style lang="scss" scoped>
.triangularMesh-wrap {

}
</style>
