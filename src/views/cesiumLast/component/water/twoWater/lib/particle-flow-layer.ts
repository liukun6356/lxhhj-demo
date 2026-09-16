import * as Cesium from "cesium";
import type { DecodeResult } from "./lerc.worker";
import { ParticleSim } from "./particle-sim";
import { loadFence, type FenceMeta } from "./fence";
import { quadGeometry, uvToGeo, geoToUV, cornersFromBBox, terrainGridGeometry, getHeightGrid, heightAt, sampleZValid, type Corners, type HeightGrid } from "./geo";
const FRAME_CAP = 50;
const MAX_CANVAS_SIDE = 4096;
const MIN_CANVAS_SIDE = 96;
const VIEW_PAD = 0.05;
const SUPERSAMPLE = 1.1;
const Z_GRID_MAX_SIDE = 128;
const Z_BLEND_EPS = 0.05;
const Z_FORCE_ZERO_T = 600;  // 该模型时刻(首个输出帧)的 Z 水位数据异常, 水面高程统一按 0 水位处理
type Meta = {
  variables: string[];
  chunkSize: number;
  grid: { width: number; height: number; cellsize?: number };
  bbox: { west: number; south: number; east: number; north: number };
  nodata: number;
  ranges: Record<string, { min: number; max: number; p95?: number; p97?: number; p99?: number }>;
  quantiles?: { frames95: number[]; frames97: number[]; frames99: number[] };
  fence?: FenceMeta;
  mask?: {
    file: string;
    format?: string;
    grid?: { width: number; height: number; cellsize?: number };
    bbox?: { u0: number; v0: number; u1: number; v1: number };
  };
  times: number[];
  chunks: { variable: string; index: number; file: string; bandTimes: number[]; bands: number }[];
  crs?: string;
  corners?: Corners;
};
interface Frame { t: number; file: string; band: number; gidx: number; }
type VarName = "U" | "V" | "Z";
export type BlendMode = "add" | "alpha" | "normal";
export interface ParticleParams {
  advect?: number;
  speedMax?: number;
  fade?: number;
  life?: number;
  dropRate?: number;
  brightness?: number;
  pointSize?: number;
  blendMode?: BlendMode;
  alpha?: number;
}
export interface ParticleOptions extends ParticleParams {
  viewer: Cesium.Viewer;
  /** 工况名(如 "0.5P"), 模型数据根 = GISDATA/jz/model/<dataDir>/ */
  dataDir: string;
  count?: number;
  alpha?: number;
  startTime?: number;
  followView?: boolean;
  onViewChange?: (s: { canvas: string; view: string }) => void;
}
export class ParticleFlowLayer {
  meta!: Meta;
  viewer: Cesium.Viewer;
  times: number[] = [];
  startT = 0;
  private base = "";
  private corners: Corners = cornersFromBBox({ west: 0, south: 0, east: 1, north: 1 });
  private heightGrid: HeightGrid | null = null;
  private framesZ: Frame[] = [];
  private zIdxByTime: Map<number, number> | null = null;
  private zi: Float32Array | null = null;
  private zj: Float32Array | null = null;
  private zGrid: HeightGrid | null = null;
  private lastZBlend = -1;
  private curT = -1; // 最近一次 setTime 的时刻(已钳制到首末帧之间)
  private sim!: ParticleSim;
  private trailTex!: Cesium.Texture;
  private primitive?: Cesium.Primitive;
  private material?: Cesium.Material;
  private framesU: Frame[] = [];
  private framesV: Frame[] = [];
  private chunkFrames = new Map<string, Frame[]>(); 
  private worker: Worker;
  private taskSeq = 0;
  private taskPending = new Map<number, (r: DecodeResult) => void>();
  private cache = new Map<string, Float32Array>(); 
  private chunkInflight = new Map<string, Promise<Float32Array[] | null>>();
  private currentPairKey: string | null = null;
  private loadingPairKey: string | null = null;
  private token = 0;
  private targetBlend = 0;
  private seeded = false;
  private view = { x0: 0, y0: 0, x1: 1, y1: 1, w: 0, h: 0 };
  private validCells: Uint32Array = new Uint32Array(0);
  private hasFence = false;
  private fenceInitialized = false;
  private fenceTris: Float32Array | null = null;
  private fenceOverlayVisible = false;
  private fenceOverlayFull: Cesium.PolylineCollection | null = null;
  private fenceOverlayCulled: Cesium.PolylineCollection | null = null;
  private empty = true;
  private fenceCulledEdges: Cesium.Polyline[] = [];
  private followView = true;
  private lastViewCheck = 0;
  private _terrainSamples: { u: number; v: number }[] = [];
  private onViewChange?: (s: { canvas: string; view: string }) => void;
  speedMax = 1;
  alpha = 1;
  private userPointSize = 1;
  private preRenderRemover?: () => void;
  private destroyed = false;
  private _loopErr = false;
  constructor(opts: ParticleOptions) {
    this.viewer = opts.viewer;
    // 模型数据根 = GISDATA/jz/model/<工况名>/, 工况由 index.vue 经 dataDir 传入(补尾斜杠)
    this.base = `${import.meta.env.VITE_APP_GISDATA}/jz/model/${opts.dataDir}/`;
    this.alpha = opts.alpha ?? 1;
    this.followView = opts.followView ?? true;
    this.onViewChange = opts.onViewChange;
    this.worker = new Worker(new URL("./lerc.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (e: MessageEvent<DecodeResult>) => {
      const r = e.data;
      const cb = this.taskPending.get(r.taskId);
      if (cb) { this.taskPending.delete(r.taskId); cb(r); }
    };
  }
  static async create(opts: ParticleOptions): Promise<ParticleFlowLayer> {
    const layer = new ParticleFlowLayer(opts);
    const resp = await fetch(`${layer.base}meta.json`);
    layer.meta = (await resp.json()) as Meta;
    layer.corners = layer.meta.corners ? layer.meta.corners : cornersFromBBox(layer.meta.bbox);
    layer.speedMax = opts.speedMax ?? layer.meta.ranges.speed?.max ?? 3;
    layer.buildFrames();
    const { width, height } = layer.meta.grid;
    layer.sim = new ParticleSim(width, height, opts.count ?? 262144);
    layer.sim.cellsize = layer.meta.grid.cellsize ?? 5;
    layer.sim.minSpeed = layer.meta.ranges.speed?.min ?? 0.001;
    layer.applyParams(opts);
    // 有 Z 水位数据时水面高程直接取模型 Z, 不再采样地形; 仅无 Z 的旧工况用地形兜底
    if (layer.framesZ.length === 0) {
      layer.heightGrid = await getHeightGrid(layer.viewer.terrainProvider, layer.corners, layer.base);
    }
    layer.buildPrimitive();
    await layer.loadFence();
    layer.startLoop();
    layer.startT = opts.startTime ?? layer.times[20] ?? layer.times[layer.times.length - 1] ?? 0;
    await layer.setTime(layer.startT);
    return layer;
  }
  applyParams(p: ParticleParams) {
    const s = this.sim;
    if (!s) return;
    if (p.advect !== undefined) s.advect = p.advect;
    if (p.speedMax !== undefined) { s.speedMax = p.speedMax; this.speedMax = p.speedMax; }
    if (p.fade !== undefined) s.fade = p.fade;
    if (p.life !== undefined) s.life = p.life;
    if (p.dropRate !== undefined) s.dropRate = p.dropRate;
    if (p.brightness !== undefined) s.brightness = p.brightness;
    if (p.pointSize !== undefined) { this.userPointSize = p.pointSize; s.pointSize = p.pointSize * SUPERSAMPLE; }
    if (p.blendMode !== undefined) s.blendMode = p.blendMode;
    if (p.alpha !== undefined) {
      this.alpha = p.alpha;
      if (this.material) this.material.uniforms.u_alpha = p.alpha;
    }
  }
  private async loadFence() {
    const tris = await loadFence(this.meta.fence, this.base);
    if (tris) {
      this.fenceTris = tris;
      this.sim.setFenceTriangles(tris);
      this.hasFence = true;
    }
  }
  showFenceOverlay(visible: boolean) {
    this.fenceOverlayVisible = visible;
    if (visible) {
      if (!this.fenceOverlayFull) this.buildFenceOverlay();
      else { this.fenceOverlayFull.show = true; this.fenceOverlayCulled!.show = true; }
      this.refreshFenceOverlay();
    } else {
      if (this.fenceOverlayFull) this.fenceOverlayFull.show = false;
      if (this.fenceOverlayCulled) this.fenceOverlayCulled.show = false;
    }
  }
  private fenceUVToGeo(u: number, v: number) {
    // 优先贴水面(zGrid), 无 Z 时贴地形; 全量 fence overlay 只在首次 showFenceOverlay 时构建一次, 不随水位重建(调试用途)
    const hg = this.zGrid ?? this.heightGrid;
    return { ...uvToGeo(this.corners, u, v), h: hg ? heightAt(hg, u, v) : 0 };
  }
  private addTriEdges(
    col: Cesium.PolylineCollection,
    a: { lon: number; lat: number; h?: number },
    b: { lon: number; lat: number; h?: number },
    c: { lon: number; lat: number; h?: number },
    color: Cesium.Color,
    width: number
  ) {
    const edge = (p: { lon: number; lat: number; h?: number }, q: { lon: number; lat: number; h?: number }) => {
      const mat = Cesium.Material.fromType("Color");
      mat.uniforms.color = color;
      col.add({
        positions: [
          Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.h ?? 0),
          Cesium.Cartesian3.fromDegrees(q.lon, q.lat, q.h ?? 0),
        ],
        width,
        material: mat,
      });
    };
    edge(a, b);
    edge(b, c);
    edge(c, a);
  }
  private buildFenceOverlay() {
    if (!this.fenceTris) return;
    const full = new Cesium.PolylineCollection();
    const tris = this.fenceTris;
    const n = tris.length / 6;
    const faint = Cesium.Color.WHITE.withAlpha(0.3);
    for (let i = 0; i < n; i++) {
      const a = this.fenceUVToGeo(tris[i * 6], tris[i * 6 + 1]);
      const b = this.fenceUVToGeo(tris[i * 6 + 2], tris[i * 6 + 3]);
      const c = this.fenceUVToGeo(tris[i * 6 + 4], tris[i * 6 + 5]);
      this.addTriEdges(full, a, b, c, faint, 1);
    }
    this.fenceOverlayFull = this.viewer.scene.primitives.add(full) as Cesium.PolylineCollection;
    const culled = new Cesium.PolylineCollection();
    this.fenceCulledEdges = [];
    for (let i = 0; i < n * 3; i++) {
      const p0 = Cesium.Cartesian3.fromDegrees(this.meta.bbox.west, this.meta.bbox.south);
      const p1 = Cesium.Cartesian3.fromDegrees(this.meta.bbox.west + 0.0001, this.meta.bbox.south);
      const mat = Cesium.Material.fromType("Color");
      mat.uniforms.color = Cesium.Color.ORANGE.withAlpha(0.95);
      const pl = culled.add({ positions: [p0, p1], width: 2, show: false, material: mat });
      this.fenceCulledEdges.push(pl);
    }
    this.fenceOverlayCulled = this.viewer.scene.primitives.add(culled) as Cesium.PolylineCollection;
    this.refreshFenceOverlay();
  }
  private refreshFenceOverlay() {
    const edges = this.fenceCulledEdges;
    if (!edges.length) return;
    const v = this.sim.culledViewUV;
    const n = v.length / 6;
    const { domainX: dx, domainY: dy, domainW: dw, domainH: dh } = this.sim;
    const maxT = Math.floor(edges.length / 3);
    for (let i = 0; i < edges.length; i++) {
      const t = Math.floor(i / 3), e = i % 3;
      if (t < n && t < maxT) {
        const toGeo = (j: number) => this.fenceUVToGeo(dx + v[t * 6 + j] * dw, dy + v[t * 6 + j + 1] * dh);
        const a = toGeo(0), b = toGeo(2), c = toGeo(4);
        const pts = e === 0 ? [a, b] : e === 1 ? [b, c] : [c, a];
        edges[i].positions = pts.map((p) => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.h ?? 0));
        edges[i].show = true;
      } else {
        edges[i].show = false;
      }
    }
  }
  private buildFrames() {
    const mk = (vname: string) => {
      const chunks = this.meta.chunks.filter((c) => c.variable === vname).sort((a, b) => a.index - b.index);
      const out: Frame[] = [];
      let g = 0;
      for (const c of chunks) {
        const list: Frame[] = [];
        for (let b = 0; b < c.bandTimes.length; b++) {
          const f: Frame = { t: c.bandTimes[b], file: c.file, band: b, gidx: g };
          list.push(f); out.push(f); g++;
        }
        this.chunkFrames.set(c.file, list);
      }
      return out;
    };
    this.framesU = mk("U");
    this.framesV = mk("V");
    this.framesZ = mk("Z");
    this.times = this.framesU.map((f) => f.t);
    // Z 时间轴应与 U 一致; 不一致时建 t→zGidx 映射兜底, 过半对不上则视为无 Z
    if (this.framesZ.length) {
      const aligned = this.framesZ.length === this.framesU.length && this.framesZ.every((f, k) => f.t === this.framesU[k]?.t);
      if (!aligned) {
        const m = new Map<number, number>();
        this.framesZ.forEach((f, k) => m.set(f.t, k));
        const hit = this.times.filter((t) => m.has(t)).length;
        if (hit * 2 >= this.times.length) this.zIdxByTime = m;
        else this.framesZ = [];
      }
    }
  }
  private zGidx(gidx: number): number | null {
    if (!this.framesZ.length) return null;
    if (!this.zIdxByTime) return gidx;
    return this.zIdxByTime.get(this.times[gidx]) ?? null;
  }
  private visibleUVFromTerrain(gx = 6, gy = 3): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const scene = this.viewer.scene;
    const cam = scene.camera;
    const vw = scene.canvas.clientWidth;
    const vh = scene.canvas.clientHeight;
    if (vw <= 0 || vh <= 0) return null;
    this._terrainSamples.length = 0; 
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, n = 0;
    const pick = new Cesium.Cartesian2();
    for (let j = 0; j < gy; j++) {
      pick.y = ((j + 0.5) / gy) * vh;
      for (let i = 0; i < gx; i++) {
        pick.x = ((i + 0.5) / gx) * vw;
        const ray = cam.getPickRay(pick);
        if (!ray) continue;
        const hit = scene.globe.pick(ray, scene); 
        if (!hit) continue;
        const carto = Cesium.Cartographic.fromCartesian(hit);
        const uv = geoToUV(this.corners, Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude));
        this._terrainSamples.push({ u: uv.u, v: uv.v }); 
        if (uv.u < minX) minX = uv.u;
        if (uv.u > maxX) maxX = uv.u;
        if (uv.v < minY) minY = uv.v;
        if (uv.v > maxY) maxY = uv.v;
        n++;
      }
    }
    if (n < 4) return null; 
    return { minX, minY, maxX, maxY };
  }
  private computeView(): { x0: number; y0: number; x1: number; y1: number; w: number; h: number } | null {
    const scene = this.viewer.scene;
    let x0: number, y0: number, x1: number, y1: number;
    const picked = this.visibleUVFromTerrain();
    if (picked) {
      const padX = (picked.maxX - picked.minX) * VIEW_PAD;
      const padY = (picked.maxY - picked.minY) * VIEW_PAD;
      x0 = Math.max(0, picked.minX - padX);
      x1 = Math.min(1, picked.maxX + padX);
      y0 = Math.max(0, picked.minY - padY);
      y1 = Math.min(1, picked.maxY + padY);
    } else {
      const rect = scene.camera.computeViewRectangle(scene.globe.ellipsoid);
      if (!rect) return null;
      const vSW = geoToUV(this.corners, Cesium.Math.toDegrees(rect.west), Cesium.Math.toDegrees(rect.south));
      const vNE = geoToUV(this.corners, Cesium.Math.toDegrees(rect.east), Cesium.Math.toDegrees(rect.north));
      const padX = (vNE.u - vSW.u) * VIEW_PAD;
      const padY = (vNE.v - vSW.v) * VIEW_PAD;
      x0 = Math.max(0, vSW.u - padX);
      x1 = Math.min(1, vNE.u + padX);
      y0 = Math.max(0, vSW.v - padY);
      y1 = Math.min(1, vNE.v + padY);
    }
    if (x1 - x0 < 1e-3 || y1 - y0 < 1e-3) return null;
    const dpr = window.devicePixelRatio || 1;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const toWin = (g: { lon: number; lat: number }) =>
      Cesium.SceneTransforms.worldToWindowCoordinates(scene, Cesium.Cartesian3.fromDegrees(g.lon, g.lat));
    const step = 0.02;
    const measure = (u: number, v: number): { pu: number; pv: number } | null => {
      const u2 = Math.min(1, u + step), v2 = Math.min(1, v + step);
      const a = toWin(uvToGeo(this.corners, u, v));
      const b = toWin(uvToGeo(this.corners, u2, v));
      const c = toWin(uvToGeo(this.corners, u, v2));
      if (!a || !b || !c) return null;
      return {
        pu: Cesium.Cartesian2.distance(b, a) / Math.max(1e-4, u2 - u),
        pv: Cesium.Cartesian2.distance(c, a) / Math.max(1e-4, v2 - v),
      };
    };
    const NI = 5, dv = (y1 - y0) / (NI - 1), du = (x1 - x0) / (NI - 1);
    let screenW = 0, screenH = 0, prevPU = -1, prevPV = -1;
    for (let k = 0; k < NI; k++) {
      const mv = measure(cx, y0 + dv * k); 
      if (mv) { if (prevPV > 0) screenH += (mv.pv + prevPV) / 2 * dv; prevPV = mv.pv; } else prevPV = -1;
      const mu = measure(x0 + du * k, cy); 
      if (mu) { if (prevPU > 0) screenW += (mu.pu + prevPU) / 2 * du; prevPU = mu.pu; } else prevPU = -1;
    }
    if (screenW <= 0 || screenH <= 0) return null;
    screenW *= dpr * SUPERSAMPLE;
    screenH *= dpr * SUPERSAMPLE;
    const { width: fw, height: fh } = this.meta.grid;
    const dataW = (x1 - x0) * fw;
    const dataH = (y1 - y0) * fh;
    const w = Math.min(MAX_CANVAS_SIDE, Math.max(MIN_CANVAS_SIDE, Math.round(Math.max(screenW, dataW))));
    const h = Math.min(MAX_CANVAS_SIDE, Math.max(MIN_CANVAS_SIDE, Math.round(Math.max(screenH, dataH))));
    return { x0, y0, x1, y1, w, h };
  }
  private updateView(now: number) {
    if (!this.followView || this.destroyed) return;
    if (now - this.lastViewCheck < 150) return;
    this.lastViewCheck = now;
    const v = this.computeView();
    if (!v) return;
    const cur = this.view;
    if (cur.w === 0) { this.applyView(v); return; }
    const dw = (v.x1 - v.x0), dh = (v.y1 - v.y0), cw = (cur.x1 - cur.x0), ch = (cur.y1 - cur.y0);
    const sizeChanged =
      Math.abs(dw - cw) > 0.15 * cw || Math.abs(dh - ch) > 0.15 * ch ||
      Math.abs(v.w - cur.w) > 0.15 * cur.w || Math.abs(v.h - cur.h) > 0.15 * cur.h;
    const centerMoved =
      Math.hypot((v.x0 + v.x1 - cur.x0 - cur.x1) / 2, (v.y0 + v.y1 - cur.y0 - cur.y1) / 2) > 0.12 * Math.min(cw, ch);
    if (sizeChanged || centerMoved) this.applyView(v);
  }
  private emitView() {
    this.onViewChange?.({
      canvas: `${this.sim.W}×${this.sim.H}`,
      view: `${this.view.x0.toFixed(3)},${this.view.y0.toFixed(3)}–${this.view.x1.toFixed(3)},${this.view.y1.toFixed(3)}`,
    });
  }
  get viewRect() { return { ...this.view }; }
  get cornersGeo() { return this.corners; }
  get terrainSamplesUV() { return this._terrainSamples; }
  private applyView(v: { x0: number; y0: number; x1: number; y1: number; w: number; h: number }) {
    const sizeChanged = v.w !== this.view.w || v.h !== this.view.h;
    this.view = v;
    if (sizeChanged) this.sim.resize(v.w, v.h);
    const { width, height } = this.meta.grid;
    this.sim.setField(width, height, v.x0, v.y0, v.x1, v.y1);
    if (this.hasFence) {
      this.empty = this.sim.cullFence() === 0;
      if (this.fenceOverlayVisible) this.refreshFenceOverlay();
    } else {
      const uvs = this.domainSeedUVs();
      this.empty = uvs.length === 0;
      if (uvs.length) this.sim.setSeed(uvs, true);
    }
    this.rebuildTrail();
    this.emitView();
  }
  private domainSeedUVs(): Float32Array {
    const { width: w, height: h } = this.meta.grid;
    const { x0, y0, x1, y1 } = this.view;
    const cells = this.validCells;
    const uvs: number[] = [];
    for (let k = 0; k < cells.length; k++) {
      const c = cells[k];
      const fx = (c % w + Math.random()) / w;
      const fy = (Math.floor(c / w) + Math.random()) / h;
      if (fx >= x0 && fx <= x1 && fy >= y0 && fy <= y1) {
        uvs.push((fx - x0) / (x1 - x0), (fy - y0) / (y1 - y0));
      }
    }
    return Float32Array.from(uvs);
  }
  private rebuildTrail() {
    const w = this.sim.W, h = this.sim.H;
    if (this.primitive) { this.viewer.scene.primitives.remove(this.primitive); this.primitive = undefined; }
    if (!this.trailTex || this.trailTex.width !== w || this.trailTex.height !== h) {
      this.trailTex = new Cesium.Texture({
        context: this.viewer.scene.context,
        width: w, height: h,
        pixelFormat: Cesium.PixelFormat.RGBA,
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
        flipY: true,
        sampler: new Cesium.Sampler({
          minificationFilter: Cesium.TextureMinificationFilter.LINEAR_MIPMAP_LINEAR,
          magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR,
          wrapS: Cesium.TextureWrap.CLAMP_TO_EDGE,
          wrapT: Cesium.TextureWrap.CLAMP_TO_EDGE,
          maximumAnisotropy: 8,
        }),
      });
      this.trailTex.generateMipmap();
      this.material!.uniforms.u_trail = this.trailTex;
    }
    const { x0, y0, x1, y1 } = this.view;
    const c = this.corners;
    // 水面高程优先取模型水位 Z(zGrid 覆盖全 UV 域, terrainGridGeometry 子域裁剪天然兼容); 无 Z 时才用地形网格兜底
    const hg = this.zGrid ?? this.heightGrid;
    const geometry = hg
      ? terrainGridGeometry(c, hg, x0, y0, x1, y1, (u, v) => [(u - x0) / (x1 - x0), (v - y0) / (y1 - y0)])
      : quadGeometry(
          [
            uvToGeo(c, x0, y0), 
            uvToGeo(c, x1, y0), 
            uvToGeo(c, x1, y1), 
            uvToGeo(c, x0, y1), 
          ],
          [0, 0, 1, 0, 1, 1, 0, 1]
        );
    this.primitive = this.viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({ geometry }),
        appearance: new Cesium.MaterialAppearance({ material: this.material!, translucent: true, closed: false, flat: true }),
        asynchronous: false,
      })
    );
  }
  // 由当前 Z 帧对(zi/zj, 已 flipV)按 targetBlend 混合并降采样出全域名水面高程网格, 然后重建几何
  private updateZGrid() {
    const { zi, zj } = this;
    if (!zi || !zj) return;
    const blend = this.targetBlend;
    const { width: W, height: H } = this.meta.grid;
    const zr = this.meta.ranges.Z;
    const fb = 302; // 干区/无效点兜底高度, 用水位最低值避免 -9999 深坑
    const lo = this.meta.nodata + 1; // 有效值阈值(防 lerc 解码漂移, 不用等值比较)
    // 降采样: 最长边 Z_GRID_MAX_SIDE, 保持模型网格宽高比 — 直接传全分辨率会让 terrainGridGeometry 生成百万级顶点
    const s = Math.min(1, Z_GRID_MAX_SIDE / Math.max(W, H));
    const gw = Math.max(2, Math.round(W * s)), gh = Math.max(2, Math.round(H * s));
    const heights = new Float32Array(gw * gh);
    // t=600 的 Z 帧数据有问题: 两帧统一取 0 水位高程(经下方下限钳制后为平床面)
    const forceZero = this.curT <= Z_FORCE_ZERO_T;
    for (let gy = 0; gy < gh; gy++) {
      const v = gy / (gh - 1);
      for (let gx = 0; gx < gw; gx++) {
        const u = gx / (gw - 1);
        const a = forceZero ? 0 : sampleZValid(zi, W, H, u, v, lo, zr);
        const b = forceZero ? 0 : sampleZValid(zj, W, H, u, v, lo, zr);
        const temp = (a ?? fb) * (1 - blend) + (b ?? fb) * blend
        heights[gy * gw + gx] = temp < 295.8 ? 295.8:temp;
      }
    }
    this.zGrid = { gridW: gw, gridH: gh, heights };
    this.lastZBlend = blend;
    this.rebuildTrail();
  }
  private buildPrimitive() {
    const ctx = this.viewer.scene.context;
    this.material = new Cesium.Material({
      fabric: {
        type: "ParticleFlow",
        uniforms: { u_trail: Cesium.Material.DefaultImageId, u_alpha: this.alpha },
        source: `
          czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec4 c = texture(u_trail, materialInput.st);
            // 纯颜色直出: 画布颜色原样输出(与 flow-test 显示一致).
            // 试过反gamma pow(x,1/2.2) 提亮 → 亮色被推近 1.0 发白掉饱和, 已撤销.
            material.diffuse = c.rgb;
            // 不走 Cesium 光照/伽马(配合下面 flat:true 的 MaterialAppearance).
            // alpha 用画布自身 alpha, 与 flow-test 直接显示 canvas 的合成方式一致,
            // 不随相机倾斜变暗(czm_phong 的 N·L 光照会被压暗).
            material.alpha = clamp(c.a, 0.0, 1.0) * u_alpha;
            return material;
          }
        `,
      },
    });
    this.view = { x0: 0, y0: 0, x1: 1, y1: 1, w: this.meta.grid.width, h: this.meta.grid.height };
    this.rebuildTrail();
    this.emitView();
  }
  private startLoop() {
    let lastNow = 0;
    this.preRenderRemover = this.viewer.scene.preRender.addEventListener(() => {
      if (this.destroyed) return;
      try {
        const now = performance.now();
        this.updateView(now);
        const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.1) : 1 / 60;
        lastNow = now;
        if (this.empty) this.sim.fadeOnly();
        else this.sim.step(dt);
        this.trailTex.copyFrom({ source: this.sim.canvas });
        this.trailTex.generateMipmap();
      } catch (e) {
        if (!this._loopErr) { console.error("[particle] loop", e); this._loopErr = true; }
      }
    });
  }
  private requestDecode(bytes: ArrayBuffer): Promise<DecodeResult> {
    const taskId = ++this.taskSeq;
    return new Promise((resolve) => {
      this.taskPending.set(taskId, resolve);
      this.worker.postMessage({ taskId, bytes }, [bytes]);
    });
  }
  private decodeChunk(file: string, vname: VarName): Promise<Float32Array[] | null> {
    const inflight = this.chunkInflight.get(file);
    if (inflight) return inflight;
    const list = this.chunkFrames.get(file);
    if (!list) return Promise.resolve(null);
    const p = (async () => {
      try {
        const resp = await fetch(`${this.base}${file}`);
        if (!resp.ok) throw new Error(`fetch ${file} -> ${resp.status}`);
        const bytes = await resp.arrayBuffer();
        const d = await this.requestDecode(bytes);
        if (!d.ok || !d.pixels) throw new Error(d.error || "decode failed");
        for (let k = 0; k < list.length && k < d.pixels.length; k++) {
          const key = `${vname}:${list[k].gidx}`;
          this.cache.delete(key);
          this.cache.set(key, d.pixels[k]);
        }
        while (this.cache.size > FRAME_CAP) this.cache.delete(this.cache.keys().next().value as string);
        return d.pixels;
      } finally {
        this.chunkInflight.delete(file);
      }
    })();
    this.chunkInflight.set(file, p);
    return p;
  }
  private async getFrame(vname: VarName, gidx: number): Promise<Float32Array | undefined> {
    const key = `${vname}:${gidx}`;
    const hit = this.cache.get(key);
    if (hit) { this.cache.delete(key); this.cache.set(key, hit); return hit; }
    const frames = vname === "U" ? this.framesU : vname === "V" ? this.framesV : this.framesZ;
    const pixels = await this.decodeChunk(frames[gidx].file, vname);
    return pixels?.[frames[gidx].band];
  }
  async setTime(t: number): Promise<void> {
    if (this.times.length === 0) return;
    const tc = Math.min(Math.max(t, this.times[0]), this.times[this.times.length - 1]);
    this.curT = tc;
    let i = 0;
    while (i < this.times.length - 1 && this.times[i + 1] <= tc) i++;
    const j = Math.min(i + 1, this.times.length - 1);
    const span = this.times[j] - this.times[i];
    this.targetBlend = i === j ? 0 : span > 0 ? (tc - this.times[i]) / span : 0;
    const key = `${i}:${j}`;
    if (this.currentPairKey === key) {
      this.sim.blend = this.targetBlend;
      // 同一帧对内 blend 连续变化时按阈值节流重建水面几何, 避免每 tick 重建
      if (this.zi && Math.abs(this.targetBlend - this.lastZBlend) >= Z_BLEND_EPS) this.updateZGrid();
      return;
    }
    if (this.loadingPairKey === key) return; 
    this.loadingPairKey = key;
    void this.ensurePair(i, j, key);
  }
  private async ensurePair(i: number, j: number, key: string): Promise<void> {
    const token = ++this.token;
    try {
      const gzi = this.zGidx(i);
      const gzj = this.zGidx(j);
      const [ui, uj, vi, vj, zri, zrj] = await Promise.all([
        this.getFrame("U", i), this.getFrame("U", j),
        this.getFrame("V", i), this.getFrame("V", j),
        gzi === null ? Promise.resolve(undefined) : this.getFrame("Z", gzi),
        gzj === null ? Promise.resolve(undefined) : this.getFrame("Z", gzj),
      ]);
      if (token !== this.token) return;
      if (!ui || !uj || !vi || !vj) {
        if (this.loadingPairKey === key) this.loadingPairKey = null;
        return;
      }
      const { width: w, height: h } = this.meta.grid;
      // Z 帧与 U/V 同样只在缓存外 flipV 一次(cache 中保持原始, 避免重复命中时重复翻转)
      if (zri && zrj) { this.zi = this.flipV(zri, w, h); this.zj = this.flipV(zrj, w, h); }
      else { this.zi = this.zj = null; }
      const fui = this.flipV(ui, w, h);
      const fuj = this.flipV(uj, w, h);
      const fvi = this.flipV(vi, w, h);
      const fvj = this.flipV(vj, w, h);
      this.sim.uploadField("u0", fui); this.sim.uploadField("u1", fuj);
      this.sim.uploadField("v0", fvi); this.sim.uploadField("v1", fvj);
      if (this.hasFence) {
        if (!this.fenceInitialized) {
          this.fenceInitialized = true;
          this.seeded = true;
          this.empty = this.sim.cullFence() === 0;
          if (this.fenceOverlayVisible) this.refreshFenceOverlay();
        }
      } else {
        const cells = this.flowCellsOf(fui, fvi);
        this.validCells = cells;
        const uvs = this.domainSeedUVs();
        this.empty = uvs.length === 0;
        if (uvs.length) this.sim.setSeed(uvs, false);
        this.seeded = this.seeded || cells.length > 0;
      }
      this.currentPairKey = key;
      if (this.loadingPairKey === key) this.loadingPairKey = null;
      this.sim.blend = this.targetBlend;
      this.updateZGrid();
      this.prefetchNext(i, j);
    } catch (e) {
      if (this.loadingPairKey === key) this.loadingPairKey = null;
    }
  }
  private prefetchNext(i: number, j: number) {
    const next = j + 1;
    if (next >= this.framesU.length) return;
    for (const [vname, frames] of [["U", this.framesU] as const, ["V", this.framesV] as const, ["Z", this.framesZ] as const]) {
      const idx = vname === "Z" ? this.zGidx(next) : next;
      if (idx === null || idx >= frames.length) continue;
      const file = frames[idx].file;
      if (this.cache.has(`${vname}:${idx}`)) continue;
      const list = this.chunkFrames.get(file);
      if (!list) continue;
      const anyCached = list.some((f) => this.cache.has(`${vname}:${f.gidx}`));
      if (!anyCached) void this.decodeChunk(file, vname);
    }
  }
  private flowCellsOf(u: Float32Array, v: Float32Array): Uint32Array {
    const { width: w, height: h } = this.meta.grid;
    const eps = this.sim.minSpeed; 
    const cells: number[] = [];
    for (let i = 0; i < w * h; i++) {
      if (Math.abs(u[i]) >= eps || Math.abs(v[i]) >= eps) cells.push(i);
    }
    return Uint32Array.from(cells);
  }
  private flipV(data: Float32Array, w: number, h: number): Float32Array {
    const out = new Float32Array(data.length);
    for (let r = 0; r < h; r++) out.set(data.subarray(r * w, (r + 1) * w), (h - 1 - r) * w);
    return out;
  }
  setDisplayRange(_min?: number, max?: number) {
    if (max !== undefined) this.applyParams({ speedMax: max });
  }
  reseed() {
    this.sim?.reseed();
  }
  flyTo() {
    const g = uvToGeo(this.corners, 0.5, 0.5);
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(g.lon, g.lat, 12000),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
    });
  }
  getStats() {
    return {
      particles: this.sim.count,
      posDim: this.sim.posDim,
      cachedUVFrames: this.cache.size,
      speedMax: this.speedMax,
      seeded: this.seeded,
      canvas: `${this.sim.W}×${this.sim.H}`,
      view: `${this.view.x0.toFixed(3)},${this.view.y0.toFixed(3)}–${this.view.x1.toFixed(3)},${this.view.y1.toFixed(3)}`,
      fence: this.hasFence ? { tris: this.sim.fenceCount, culled: this.sim.culledCount } : null,
    };
  }
  destroy() {
    this.token++;
    this.destroyed = true;
    this.preRenderRemover?.();
    if (this.primitive) this.viewer.scene.primitives.remove(this.primitive);
    if (this.fenceOverlayFull) this.viewer.scene.primitives.remove(this.fenceOverlayFull);
    if (this.fenceOverlayCulled) this.viewer.scene.primitives.remove(this.fenceOverlayCulled);
    if (this.trailTex && !this.trailTex.isDestroyed()) this.trailTex.destroy();
    this.primitive = undefined;
    this.fenceOverlayFull = null;
    this.fenceOverlayCulled = null;
    this.fenceCulledEdges = [];
    this.sim?.destroy();
    this.worker.terminate();
    this.cache.clear();
    this.taskPending.clear();
  }
}
