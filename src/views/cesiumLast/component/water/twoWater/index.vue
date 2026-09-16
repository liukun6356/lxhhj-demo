<template>
  <div class="prolusionkz-container">
    <!-- 时间播放条(下中): ybPanl(面板为相对毫秒, timeOffset 仅用于把显示日期校准到当天零点) -->
    <yb-panl v-if="ready" :selTimeRang="selTimeRang" :defaultStartTime="startTime"
             timeType="s" :step="10 * 60 * 1e3" :timeOffset="baseTs" showRefresh
             :defaultRange="panelRangeHours"
             @timeChange="timeChange" @refresh="buildLayer"/>

    <!-- 图例(右下) -->
    <div class="legend" v-if="ready">
      <div class="legend-title">{{ mode === "particle" ? "流速 m/s" : VAR_CFG[variable].unitLabel }}</div>
      <div class="legend-main">
        <div class="bar"></div>
        <div class="legend-labels">
          <span>{{ mode === "particle" ? displayMax.toFixed(2) : displayMax }}</span>
          <span>{{ displayMin }}</span>
        </div>
      </div>
    </div>

    <!-- 鹰眼图(左下, 调试): 白框=原始数据范围 / 蓝=当前计算的可视域 / 橙=相机实际可视多边形 / 红点=相机 -->
    <canvas ref="minimapEl" class="minimap" v-if="mode === 'particle'" width="200" height="200"></canvas>

    <div class="loading" v-if="!ready">加载中…</div>

    <Tdt_img_d/>
  </div>
</template>

<script setup lang="ts">
import * as Cesium from "cesium";
import {computed, markRaw, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef} from "vue";
import GUI from "lil-gui";
import {TimeSeriesLayer, type Meta} from "./lib/time-series-layer";
import {ParticleFlowLayer} from "./lib/particle-flow-layer";
import {geoToUV} from "./lib/geo";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import {useprolusionStore} from "@/store/modules/prolusion";
import YbPanl from "./ybPanl.vue";
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue";


type AnyLayer = TimeSeriesLayer | ParticleFlowLayer;

const mapStore = usemapStore()
const prolusionStore = useprolusionStore()
const viewer = mapStore.getCesiumViewer();

// 播放节奏: 挂载期间覆盖为二维水动力节奏(真实 0.2s 推进 1 分钟, 等价 2s 推进 10 分钟), 卸载时恢复默认
const PLAY_BACK_DEFAULT = {advanceMs: 60 * 1e3, baseIntervalMs: 1000 / 60};
const PLAY_BACK_2D = {advanceMs: 60 * 1e3, baseIntervalMs: 200};

/** 可选工况(模型数据根 GISDATA/jz/model/<工况名>/): 工况名的 P = 年超标频率(%), 重现期 = 100/P 年 */
const scenarios = ["0.5P", "1P", "2P", "5P"];

/** 工况名 → 下拉显示名: 0.5P=200年一遇, 1P=100年一遇, 2P=50年一遇, 5P=20年一遇(重现期=100/P, 以此类推) */
function scenarioLabel(name: string): string {
  const p = parseFloat(name);
  if (!Number.isFinite(p) || p <= 0) return name;
  const yrs = 100 / p;
  return `${Number.isInteger(yrs) ? yrs : yrs.toFixed(1)}年一遇(${name})`;
}

/** lil-gui 下拉选项 {显示名: 工况名}, 值仍是数据目录用的原始工况名 */
const scenarioOptions = Object.fromEntries(scenarios.map((s) => [scenarioLabel(s), s]));

/** 色带 min/max 一律读 meta.ranges(数据管线生成, H.min 已在管线写死 0), 前端不做特判 */
const VAR_CFG: Record<string, { label: string; unitLabel: string }> = {
  H: {label: "水深 H (m)", unitLabel: "水深 m"},
  Z: {label: "水位 Z (m)", unitLabel: "水位 m"},
  Vel: {label: "流速 Vel (m/s)", unitLabel: "流速 m/s"},
};

const layerRef = shallowRef<AnyLayer | null>(null);

const ready = ref(false);
const scenario = ref("0.5P");
const mode = ref<"scalar" | "particle">("scalar");
const variable = ref("H");
const duration = ref(0);
/** 图例上下限(H/Vel 下限=0; Z=水位高程, 取数据实际值域下限) */
const displayMax = ref(10);
const displayMin = ref(0);
/** 粒子流参数(默认即用户调好的那组, lil-gui 可改) */
const particle = ref({
  advect: 2.5,
  fade: 0.93,
  life: 6,
  dropRate: 0.02,
  brightness: 1.0,
  pointSize: 1.0,
  blendMode: "normal" as "add" | "alpha" | "normal",
  count: 262144,
  followView: true,
});
/** 图层整体透明度(0~1, H/VEL/UV 共用; 默认 1 全不透明) */
const opacity = ref(0.5);
/** 粒子层画布/视口域实时读数: 图层 applyView 时经 onViewChange 回调更新(lil-gui listen 展示) */
const pStats = reactive({canvas: "—", view: "—"});
/** fence 三角形调试叠加开关(默认关; 需要时勾选查看后台预生成的 union 流区三角形) */
const showFence = ref(false);

// ---- 时间轴(ybPanl): 面板时间域 = 数据相对毫秒; baseTs 仅作 timeOffset 把显示日期校准到当天零点 ----
const baseTs = new Date().setHours(0, 0, 0, 0);
/** 面板开始时刻(数据起始, 相对毫秒), 每次图层重建后更新 */
const startTime = ref(0);
/** 当前时刻(数据相对秒) */
const currentTime = ref(0);
/** 面板时间区间(相对毫秒) */
const selTimeRang = computed(() => ({start: startTime.value, end: toPanelTime(duration.value)}));
/** 面板时段数(小时, 向上取整覆盖全程) */
const panelRangeHours = computed(() => Math.ceil((selTimeRang.value.end - selTimeRang.value.start) / (60 * 60 * 1e3)));

function toPanelTime(sec: number) {
  return Math.round(sec * 1000);
}

function toLayerTime(timestamp: number) {
  return timestamp / 1000;
}

/** 图层时刻更新(唯一入口): 夹取到 [startT, duration] 并下发给图层. */
function updateTime(time: number) {
  currentTime.value = Math.min(Math.max(time, startT), duration.value);
  layerRef.value?.setTime(currentTime.value);
}

/** ybPanl 时间变化(面板毫秒) → 数据相对秒. */
function timeChange(timestamp: number) {
  updateTime(toLayerTime(timestamp));
}

/** lil-gui 信息读数(listen 自动刷新) */
const guiStats = {frames: 0, chunks: 0, hint: ""};

/** 鹰眼图(左下, 调试): 对比原始数据范围 / 计算可视域 / 相机实际可视多边形 */
const minimapEl = ref<HTMLCanvasElement | null>(null);
let postRenderRemover: (() => void) | null = null;
/** 鹰眼图重绘节流: globe.pick 较贵, 每 100ms 重画一次跟手且不卡 */
let lastMinimapDraw = 0;

let meta: Meta | null = null;
/** 本图层开始时间(数据起始, 0) */
let startT = 0;
/** 重建图层(切工况/模式/粒子数)前保存相机, 重建后恢复, 避免每次 flyTo 重置视口 */
let savedCam: { pos: Cesium.Cartesian3; hpr: Cesium.HeadingPitchRoll } | null = null;
/** 防重入: 图层重建期间忽略新的切换请求(lil-gui 常驻, 加载中仍可点) */
let building = false;

// lil-gui 逻辑
let gui: GUI | null = null;
let particleFolder: GUI | null = null;
let brightnessCtrl: any = null;
let scenarioCtrl: any = null;
let seriesCtrl: any = null;
/** lil-gui 绑定的普通对象(工况/类型/透明度), 其余直接绑 particle.value/pStats */
const guiParams = {scenario: "0.5P", series: "H", opacity: 0.5};

function saveCam() {
  const c = viewer?.camera;
  if (!c) return;
  savedCam = {pos: c.position.clone(), hpr: new Cesium.HeadingPitchRoll(c.heading, c.pitch, c.roll)};
}

function restoreCam() {
  if (!viewer || !savedCam) return;
  viewer.camera.setView({
    destination: savedCam.pos,
    orientation: {heading: savedCam.hpr.heading, pitch: savedCam.hpr.pitch, roll: savedCam.hpr.roll},
  });
}

/** 粒子参数实时下发给图层(不重建, 下一帧生效). */
function onParticleParam() {
  const l = layerRef.value;
  if (mode.value === "particle" && l instanceof ParticleFlowLayer) {
    l.applyParams({
      advect: particle.value.advect,
      fade: particle.value.fade,
      life: particle.value.life,
      dropRate: particle.value.dropRate,
      brightness: particle.value.brightness,
      pointSize: particle.value.pointSize,
      blendMode: particle.value.blendMode,
    });
  }
}

/** 切换混合模式时, 给该模式一个合适的默认亮度(加法强度语义随混合模式不同, 与 flow-test 一致). */
function onBlendMode() {
  const def = {add: 0.05, alpha: 0.15, normal: 1.0}[particle.value.blendMode];
  particle.value.brightness = def;
  onParticleParam();
}

/** 粒子数/跟随视口变化需重建图层(count 在构造时固定). */
async function rebuildParticle() {
  await buildLayer();
}

function resetParticles() {
  if (mode.value === "particle" && layerRef.value instanceof ParticleFlowLayer) {
    layerRef.value.reseed();
  }
}

/** fence 三角形调试叠加开关. */
function onShowFence() {
  if (mode.value === "particle" && layerRef.value instanceof ParticleFlowLayer) {
    layerRef.value.showFenceOverlay(showFence.value);
  }
}

/** 图层透明度实时下发(不重建; H/VEL 走标量层 setAlpha, UV 走粒子层 applyParams). */
function onOpacity() {
  const l = layerRef.value;
  if (!l) return;
  if (l instanceof TimeSeriesLayer) l.setAlpha(opacity.value);
  else if (l instanceof ParticleFlowLayer) l.applyParams({alpha: opacity.value});
}

// ---- 倾斜摄影(3D Tiles, 参考 jz/web tiltModel): lil-gui 开关控制, 默认加载 ----
const showTilt = ref(true);
let tiltset: Cesium.Cesium3DTileset | null = null;
let tiltLoading = false;
/** 组件已卸载: viewer 是共享实例, 在途加载完成后不得再上屏 */
let tiltAborted = false;

async function loadTiltModel() {
  if (tiltLoading || tiltAborted) return;
  tiltLoading = true;
  try {
    const ts = await Cesium.Cesium3DTileset.fromUrl(`${import.meta.env.VITE_APP_GISDATA}/jz/3dtiles/tileset.json`, {
      skipLevelOfDetail: true,
      maximumMemoryUsage: 1024,
      maximumScreenSpaceError: 25,
      loadSiblings: true,
      cullRequestsWhileMoving: true,
      cullRequestsWhileMovingMultiplier: 10,
      preferLeaves: true,
      progressiveResolutionHeightFraction: 0.5,
      dynamicScreenSpaceError: true,
      preloadWhenHidden: true,
    });
    tiltset = ts;
    if (showTilt.value && !tiltAborted) viewer.scene.primitives.add(ts);
    else ts.destroy(); // 加载完成前已被关闭/卸载
  } catch (e) {
    console.error("倾斜摄影加载失败", e);
  } finally {
    tiltLoading = false;
  }
}

function destroyTilt() {
  if (!tiltset) return;
  if (viewer.scene.primitives.contains(tiltset)) viewer.scene.primitives.remove(tiltset); // remove 会同时销毁
  else tiltset.destroy();
  tiltset = null;
}

/** lil-gui 开关回调: 倾斜摄影加载/卸载. */
function onShowTilt(v: boolean) {
  if (!v) {
    destroyTilt();
    return;
  }
  if (tiltset) {
    if (!viewer.scene.primitives.contains(tiltset)) viewer.scene.primitives.add(tiltset);
  } else {
    loadTiltModel();
  }
}

async function buildLayer() {
  if (building) return;
  building = true;
  scenarioCtrl?.disable();
  seriesCtrl?.disable();
  ready.value = false;
  if (layerRef.value) saveCam(); // 仅当存在旧图层时保留当前视角
  layerRef.value?.destroy();
  layerRef.value = null;

  try {
    if (mode.value === "particle") {
      const layer = await ParticleFlowLayer.create({
        viewer: viewer!,
        dataDir: scenario.value,
        count: particle.value.count,
        advect: particle.value.advect,
        fade: particle.value.fade,
        life: particle.value.life,
        dropRate: particle.value.dropRate,
        brightness: particle.value.brightness,
        pointSize: particle.value.pointSize,
        blendMode: particle.value.blendMode,
        followView: particle.value.followView,
        alpha: opacity.value,
        startTime: 0, // 从数据开始时间(第 0 帧)起播
        onViewChange: (s) => {
          pStats.canvas = s.canvas;
          pStats.view = s.view;
        },
      });
      meta = layer.meta;
      layerRef.value = markRaw(layer);
      (window as unknown as { __pLayer?: ParticleFlowLayer }).__pLayer = layer;
      if (showFence.value) layer.showFenceOverlay(true);
      duration.value = layer.times[layer.times.length - 1] || 0;
      startT = layer.startT;
      startTime.value = toPanelTime(startT);
      guiStats.frames = layer.times.length;
      // 色阶上限默认取直方图 95% 分位数(meta.ranges.speed.p95, build-meta-quantiles.mjs 生成)
      displayMax.value = layer.meta.ranges?.speed?.p95 ?? 2.5;
      // 图例下限 = meta.ranges.speed.min(UV 管线为 0.001, 低于该值的流速视为 0)
      displayMin.value = layer.meta.ranges?.speed?.min ?? 0;
      layer.applyParams({speedMax: displayMax.value}); // 图例与归一化一致
      guiStats.chunks = layer.meta.chunks.filter((c) => c.variable === "U").length;
      guiStats.hint = `${layer.getStats().particles.toLocaleString()} 粒子 · GPU ping-pong 位置 + 拖尾`;
    } else {
      const layer = await TimeSeriesLayer.create({
        viewer: viewer!,
        dataDir: scenario.value,
        variable: variable.value,
        alpha: opacity.value, // 不传 displayRange: 层内默认即 meta.ranges 实际值域
      });
      // 色带 min/max 一律读 meta: min=ranges.min(H 由管线写死 0), max=p95(抗离群, 缺省回退数据 max)
      const r = layer.meta.ranges[variable.value] ?? {min: 0, max: 1};
      const rmax = r.p95 ?? r.max;
      layer.setDisplayRange(r.min, rmax); // 层内默认 min/max, 上限换成 p95
      displayMin.value = Math.round(r.min);
      displayMax.value = Math.round(rmax);
      meta = layer.meta;
      layerRef.value = markRaw(layer);
      (window as unknown as { __tsLayer?: TimeSeriesLayer }).__tsLayer = layer;
      duration.value = layer.times[layer.times.length - 1];
      startT = 0;
      startTime.value = toPanelTime(startT);
      guiStats.frames = layer.times.length;
      guiStats.chunks = layer.meta.chunks.filter((c) => c.variable === variable.value).length;
      guiStats.hint = `${guiStats.chunks} 分块 · GPU 相邻帧插值`;
    }
    ready.value = true;
    if (savedCam) restoreCam(); // 切工况/模式: 保持原视口
    else layerRef.value?.flyTo(); // 首次加载: 飞到图层范围
    // 图层已建: 停止播放并归零到图层起始(面板经 setYbTime 同步, watch 变化时回发 timeChange, 幂等)
    prolusionStore.stopYbPlay();
    updateTime(startT);
    prolusionStore.setYbTime({curTime: toPanelTime(startT)});
  } finally {
    building = false;
    scenarioCtrl?.enable();
    seriesCtrl?.enable();
  }
}

/** 类型切换: H=水深 / Z=水位 / VEL=流速 / UV=粒子流(GPU). */
function onSeries(s: "H" | "Z" | "VEL" | "UV") {
  if (s === "UV") {
    if (mode.value === "particle") return;
    mode.value = "particle";
  } else {
    const v = s === "H" ? "H" : s === "VEL" ? "Vel" : "Z";
    if (mode.value === "scalar" && variable.value === v) return;
    mode.value = "scalar";
    variable.value = v;
  }
  if (mode.value === "particle") particleFolder?.show();
  else particleFolder?.hide();
  buildLayer();
}

/** 切换工况: 销毁重建整个图层, 数据与时间条/图例/色阶均随新工况 meta 重置(时间回到起点). */
function onScenarioChange() {
  buildLayer();
}

function flyTo() {
  layerRef.value?.flyTo();
}

/** 打印当前相机位置/姿态 + 粒子层视口域/画布尺寸, 用于对照"特定角度流速异常"复现. */
function dumpCamera() {
  const c = viewer?.camera;
  if (!c) return;
  const carto = Cesium.Cartographic.fromCartesian(c.positionWC);
  const lon = Cesium.Math.toDegrees(carto.longitude).toFixed(6);
  const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(6);
  const hgt = carto.height.toFixed(1);
  const hdg = Cesium.Math.toDegrees(c.heading).toFixed(1);
  const pit = Cesium.Math.toDegrees(c.pitch).toFixed(1);
  const rll = Cesium.Math.toDegrees(c.roll).toFixed(1);
  const stats = (window as unknown as { __pLayer?: ParticleFlowLayer }).__pLayer?.getStats?.();
  console.log("%c=== 相机姿态 ===", "color:#0af;font-weight:bold");
  console.log(`位置: lon=${lon}  lat=${lat}  hgt=${hgt}m`);
  console.log(`姿态: heading=${hdg}°  pitch=${pit}°  roll=${rll}°`);
  if (stats) {
    console.log(
        `粒子层: canvas=${stats.canvas}  域=${stats.view}  speedMax=${stats.speedMax}  ` +
        (stats.fence ? `fence=tris ${stats.fence.tris}/culled ${stats.fence.culled}` : "fence=无")
    );
  }
  console.log("%c=== /相机姿态 ===", "color:#0af;font-weight:bold");
  return {lon: +lon, lat: +lat, hgt: +hgt, hdg: +hdg, pit: +pit, rll: +rll};
}

/** 鹰眼图(左下): 白框=原始数据范围, 蓝=当前计算的可视域(域), 橙=相机实际可视多边形,
 *  红点=相机位置. 用于核对 computeViewRectangle 算出的可视域与屏幕上实际看到的是否一致. */
function drawMinimap() {
  const now = performance.now();
  if (now - lastMinimapDraw < 100) return;
  lastMinimapDraw = now;
  const cv = minimapEl.value;
  const l = layerRef.value;
  if (!cv || !viewer || !(l instanceof ParticleFlowLayer)) return;
  if (cv.offsetParent === null) return; // 鹰眼图隐藏时(display:none)不绘制
  const {cornersGeo, viewRect} = l;
  const W = cv.width, H = cv.height, M = 12;
  const fw = W - M * 2, fh = H - M * 2;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const X = (u: number) => M + u * fw;
  const Y = (v: number) => M + (1 - v) * fh; // v 反转: 上=北(与场纹理一致)
  ctx.clearRect(0, 0, W, H);

  // 1) 原始数据范围(全场 [0,1]²): 左上角 = (X(0), Y(1))(南/下 v=0 → y 大, 北/上 v=1 → y 小)
  ctx.strokeStyle = "rgba(230,240,255,0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(X(0), Y(1), fw, fh);
  ctx.fillStyle = "rgba(230,240,255,0.07)";
  ctx.fillRect(X(0), Y(1), fw, fh);

  // 2) 当前计算的可视域(bbox): 蓝框(先画, 供橙多边形作底衬)
  const {x0, y0, x1, y1} = viewRect;
  const bx = X(x0), by = Y(y1), bw = X(x1) - X(x0), bh = Y(y0) - Y(y1); // 顶 = v 大, 向下延伸
  ctx.fillStyle = "rgba(102,194,255,0.22)";
  ctx.strokeStyle = "#66c2ff";
  ctx.lineWidth = 1.5;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeRect(bx, by, bw, bh);

  // 3) 相机实际地形可见点云(橙): 复用图层采样缓存(零额外 globe.pick), 与蓝色计算域同口径,
  //    直观看蓝框是否包住真实可见范围; 远处被山遮挡 → 该处无橙点.
  const scene = viewer.scene, cam = scene.camera;
  ctx.save();
  ctx.beginPath();
  ctx.rect(X(0), Y(1), fw, fh);
  ctx.clip();
  ctx.fillStyle = "rgba(255,150,40,0.9)";
  for (const s of l.terrainSamplesUV) {
    ctx.beginPath();
    ctx.arc(X(s.u), Y(s.v), 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4) 相机位置
  const cc = Cesium.Cartographic.fromCartesian(cam.positionWC);
  const cg = geoToUV(cornersGeo, Cesium.Math.toDegrees(cc.longitude), Cesium.Math.toDegrees(cc.latitude));
  ctx.fillStyle = "#ff5566";
  ctx.beginPath();
  ctx.arc(X(cg.u), Y(cg.v), 3.5, 0, Math.PI * 2);
  ctx.fill();
}

/** lil-gui 参数面板: 工况/类型切换 + 透明度 + 粒子流参数 + 调试动作/读数. */
function initGui() {
  gui = new GUI({title: "twoWater 洪水演示", width: 300});

  // 工况 & 类型切换(均销毁重建图层)
  scenarioCtrl = gui.add(guiParams, "scenario", scenarioOptions).name("工况").onChange((v: string) => {
    scenario.value = v;
    onScenarioChange();
  });
  seriesCtrl = gui.add(guiParams, "series", {"水深 H": "H", "水位 Z": "Z", "流速 VEL": "VEL", "粒子流 UV": "UV"})
      .name("类型").onChange((v: "H" | "Z" | "VEL" | "UV") => onSeries(v));

  // 通用: 图层透明度(H/VEL/UV 共用, 实时生效)
  gui.add(guiParams, "opacity", 0, 1, 0.01).name("透明度").onChange((v: number) => {
    opacity.value = v;
    onOpacity();
  });

  // 倾斜摄影(3D Tiles): 默认加载
  gui.add({tilt: showTilt.value}, "tilt").name("倾斜摄影").onChange((v: boolean) => {
    showTilt.value = v;
    onShowTilt(v);
  });

  // 调试动作
  const actions = {定位: () => flyTo(), 打印相机: () => dumpCamera()};
  gui.add(actions, "定位").name("🎯 定位");
  gui.add(actions, "打印相机").name("📷 打印相机");

  // 粒子流参数(仅 UV 模式显示, 与 flow-test 面板一致)
  particleFolder = gui.addFolder("粒子流 (GPU)");
  particleFolder.add(particle.value, "blendMode", {
    "覆盖式(缩放不淡, 推荐)": "normal",
    "纯加法 (ONE, ONE)": "add",
    "src_alpha 加权加法": "alpha",
  }).name("混合模式").onChange(() => {
    onBlendMode();
    brightnessCtrl.updateDisplay(); // 混合模式切换会重置亮度默认值
  });
  particleFolder.add(particle.value, "count", {"65k": 65536, "262k": 262144, "1M": 1048576})
      .name("粒子数").onChange(() => rebuildParticle()); // count 构造时固定, 需重建
  particleFolder.add(particle.value, "advect", 0.5, 20, 0.5).name("推进").onChange(onParticleParam);
  particleFolder.add(particle.value, "fade", 0.9, 0.999, 0.001).name("拖尾保留").onChange(onParticleParam);
  brightnessCtrl = particleFolder.add(particle.value, "brightness", 0.005, 1, 0.005).name("亮度").onChange(onParticleParam);
  particleFolder.add(particle.value, "pointSize", 0.5, 4, 0.5).name("粒子大小(px)").onChange(onParticleParam);
  particleFolder.add(particle.value, "life", 1, 20, 1).name("寿命(s)").onChange(onParticleParam);
  particleFolder.add(particle.value, "dropRate", 0, 0.2, 0.005).name("回收流速(m/s)").onChange(onParticleParam);
  particleFolder.add(particle.value, "followView").name("跟随视口渲染").onChange(() => rebuildParticle());
  particleFolder.add({fence: showFence.value}, "fence").name("fence三角形(调试)").onChange((v: boolean) => {
    showFence.value = v;
    onShowFence();
  });
  particleFolder.add({重置: resetParticles}, "重置").name("↻ 重置粒子");
  // 粒子层画布/视口域实时读数(转动相机时动态刷新, 排查极限尺寸/退化画布)
  particleFolder.add(pStats, "canvas").name("画布").listen().disable();
  particleFolder.add(pStats, "view").name("域").listen().disable();
  particleFolder.hide(); // 标量模式默认隐藏

  // 信息读数
  const infoFolder = gui.addFolder("信息");
  infoFolder.add(guiStats, "frames").name("帧数").listen().disable();
  infoFolder.add(guiStats, "chunks").name("分块").listen().disable();
  infoFolder.add(guiStats, "hint").name("说明").listen().disable();
  infoFolder.close();
}

let prevRootFontSize = "";

onMounted(async () => {
  // ybPanl 按 jz/web 的 rem 基准设计(1rem=10px), 本仓库无全局 rem 初始化, 挂载期间临时设置
  prevRootFontSize = document.documentElement.style.fontSize;
  document.documentElement.style.fontSize = "10px";
  prolusionStore.setYbTime(PLAY_BACK_2D);
  initGui();

  viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(import.meta.env.VITE_APP_GISDATA + '/jz/dem')
  loadTiltModel(); // 倾斜摄影默认加载(异步, 不阻塞图层构建)
  // 调试用深链: #/prolusionkz?t=12000 初始定位到某时刻(秒)
  const hashQ = window.location.hash.split("?")[1];
  const tParam = hashQ ? new URLSearchParams(hashQ).get("t") : null;
  const deepT = tParam ? Math.max(0, parseFloat(tParam) || 0) : null;

  await buildLayer();

  // 等 ybPanl 挂载完成(initTimeRang 已跑)后经 store 定位到深链时刻
  if (deepT !== null) {
    await nextTick();
    prolusionStore.setYbTime({curTime: Math.min(deepT * 1e3, toPanelTime(duration.value))});
  }

  // 鹰眼图: 每帧相机变化后重绘
  postRenderRemover = viewer.scene.postRender.addEventListener(() => drawMinimap());
});

onBeforeUnmount(() => {
  gui?.destroy();
  tiltAborted = true;
  destroyTilt();
  prolusionStore.stopYbPlay();
  prolusionStore.setYbTime(PLAY_BACK_DEFAULT);
  document.documentElement.style.fontSize = prevRootFontSize;
  postRenderRemover?.();
  layerRef.value?.destroy();
});
</script>

<style lang="scss" scoped>
.prolusionkz-container {
  position: relative;
  width: 100%;
  height: 100%;
}

/* ---- 图例(右下) ---- */
.legend {
  position: absolute;
  right: 20px;
  bottom: 150px;
  z-index: 10;
  display: flex; /* 标题(上) + 主区(色带+数值, 下) 竖排 */
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: rgba(8, 18, 32, 0.78);
  border: 1px solid rgba(80, 160, 255, 0.35);
  border-radius: 8px;
  backdrop-filter: blur(4px);
  pointer-events: none;
  /* 顶部单位说明, 独立一行, 不与数值列混排(不挤占 max) */
  .legend-title {
    color: #cfe4ff;
    font-size: 14px;
  }

  .legend-main {
    display: flex; /* 色带与数值列横排 */
    align-items: stretch;
    gap: 8px;

    .bar {
      width: 16px; /* 竖向色带 */
      height: 160px;
      border-radius: 3px;
      background: linear-gradient(
          to top,
          #002166 0%,
          #008cd9 25%,
          #33bf4c 50%,
          #f2d933 75%,
          #d91a1a 100%
      );
    }

    .legend-labels {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 13px;
      color: #9db8d6;
      /* 数值列: 上=最大值(顶住色带顶端), 下=最小值 0(底住色带底端) */
    }
  }
}

.loading {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e6f0ff;
  background: rgba(8, 18, 32, 0.6);
  font-size: 14px;
}

/* 鹰眼图(左下角): 白框=原始数据范围, 蓝=计算可视域, 橙=相机实际可视多边形, 红点=相机位置 */
.minimap {
  display: none; /* 调试鹰眼图, 默认隐藏; 调试时改为 display:block */
  position: absolute;
  left: 20px;
  bottom: 20px;
  z-index: 10;
  width: 200px;
  height: 200px;
  background: rgba(8, 18, 32, 0.72);
  border: 1px solid rgba(80, 160, 255, 0.35);
  border-radius: 8px;
  backdrop-filter: blur(4px);
  pointer-events: none;
}
</style>
