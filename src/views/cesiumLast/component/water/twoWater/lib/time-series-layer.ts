import * as Cesium from "cesium";
import type {DecodeResult} from "./lerc.worker";
import {
    quadGeometry,
    uvToGeo,
    cornersFromBBox,
    terrainGridGeometry,
    getHeightGrid,
    sampleZValid,
    type Corners,
    type HeightGrid
} from "./geo";

const FRAME_CAP = 60;
const Z_GRID_MAX_SIDE = 128; // Z 水面网格最长边(降采样, 保持模型网格宽高比); 全分辨率会让 terrainGridGeometry 生成百万级顶点
const Z_BLEND_EPS = 0.05;    // 同一帧对内 blend 累计变化超过该阈值才重建水面几何, 避免每 tick 重建
const Z_FORCE_ZERO_T = 600;  // 该模型时刻(首个输出帧)的 Z 水位数据异常, 水面高程统一按 0 水位处理
export interface Meta {
    format: string;
    variables: string[];
    chunkSize: number;
    grid: { width: number; height: number };
    bbox: { west: number; south: number; east: number; north: number };
    nodata: number;
    ranges: Record<string, { min: number; max: number; p95?: number; p97?: number; p99?: number }>;
    quantiles?: { frames95: number[]; frames97: number[]; frames99: number[] };
    times: number[];
    chunks: { variable: string; index: number; file: string; bandTimes: number[]; bands: number }[];
    crs?: string;
    corners?: Corners;
}

interface Frame {
    t: number;
    chunkFile: string;
    band: number;
    globalIdx: number;
}

const FABRIC = `
const float NODATA = -9999.0;      // 无效像元填充值
const float VALID_MIN = -9000.0;   // > 此值视为有效(给 -9999 留巨大余量, 量化抖动无影响)
vec3 ts_colormap(float k) {
  vec3 c0 = vec3(0.0, 0.13, 0.40);
  vec3 c1 = vec3(0.0, 0.55, 0.85);
  vec3 c2 = vec3(0.20, 0.75, 0.30);
  vec3 c3 = vec3(0.95, 0.85, 0.20);
  vec3 c4 = vec3(0.85, 0.10, 0.10);
  k = clamp(k, 0.0, 1.0);
  if (k < 0.25)      return mix(c0, c1, k / 0.25);
  else if (k < 0.5)  return mix(c1, c2, (k - 0.25) / 0.25);
  else if (k < 0.75) return mix(c2, c3, (k - 0.5) / 0.25);
  else               return mix(c3, c4, (k - 0.75) / 0.25);
}
// 手动双线性: NEAREST 取 4 邻域, 跳过 nodata(-9999) 像元, 仅对有效像元按距离加权.
// (用原生 LINEAR 会把 -9999 与有效值一起插值出垃圾.)
float ts_sample(sampler2D tex, vec2 uv) {
  vec2 size = u_texSize;
  vec2 ts = uv * size - 0.5;
  vec2 p = floor(ts);
  vec2 f = fract(ts);
  float wsum = 0.0, vsum = 0.0;
  for (int dy = 0; dy < 2; dy++) {
    for (int dx = 0; dx < 2; dx++) {
      vec2 idx = p + vec2(float(dx), float(dy));
      vec2 tc = (idx + 0.5) / size;          // texel 中心, NEAREST 采样得精确像元
      float val = texture(tex, tc).r;
      if (val > VALID_MIN) {                 // 有效(非 nodata)
        float wx = (dx == 0) ? (1.0 - f.x) : f.x;
        float wy = (dy == 0) ? (1.0 - f.y) : f.y;
        float w = wx * wy;
        wsum += w; vsum += val * w;
      }
    }
  }
  return (wsum > 0.0) ? (vsum / wsum) : NODATA;
}
czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st;
  float v0 = ts_sample(u_tex0, st);
  float v1 = ts_sample(u_tex1, st);
  bool b0 = v0 > VALID_MIN;
  bool b1 = v1 > VALID_MIN;
  if (!b0 && !b1) { material.alpha = 0.0; return material; }   // 两帧皆干 -> 透明
  // 时序插值: nodata 视为 0(无水), 干<->湿平滑过渡
  float v = mix(b0 ? v0 : 0.0, b1 ? v1 : 0.0, u_blend);
  if (v < u_min + 0.01) { material.alpha = 0.0; return material; } // 近似无水 -> 透明
  float k = clamp((v - u_min) / (u_max - u_min), 0.0, 1.0);
  material.diffuse = ts_colormap(k);
  material.alpha = u_alpha;
  return material;
}
`;

export interface LayerOptions {
    viewer: Cesium.Viewer;
    /** 工况名(如 "0.5P"), 模型数据根 = GISDATA/jz/model/<dataDir>/ */
    dataDir: string;
    variable: string;
    displayRange?: { min?: number; max?: number };
    alpha?: number;
    flipY?: boolean;
}

export class TimeSeriesLayer {
    meta!: Meta;
    viewer: Cesium.Viewer;
    variable: string;
    flipY: boolean;
    private base = "";
    private corners: Corners = cornersFromBBox({west: 0, south: 0, east: 1, north: 1});
    private heightGrid: HeightGrid | null = null;
    // Z 水位帧: 水面高程优先取模型 Z, 随帧对/blend 动态重建 (与 particle-flow-layer 一致)
    private framesZ: Frame[] = [];
    private zIdxByTime: Map<number, number> | null = null;
    private zi: Float32Array | null = null;
    private zj: Float32Array | null = null;
    private zGrid: HeightGrid | null = null;
    private lastZBlend = -1;
    private curT = -1; // 最近一次 setTime 的时刻(已钳制到首末帧之间)
    private frames: Frame[] = [];
    private chunkFrames = new Map<string, number[]>();
    private chunkFramesZ = new Map<string, number[]>();
    times: number[] = [];
    private worker: Worker;
    private taskSeq = 0;
    private taskPending = new Map<number, (r: DecodeResult) => void>();
    private lru = new Map<number, Float32Array>();
    private zCache = new Map<number, Float32Array>();
    private chunksDecoded = new Set<string>();
    private zChunksDecoded = new Set<string>();
    private chunkInflight = new Map<string, Promise<void>>();
    private primitive?: Cesium.Primitive;
    private material?: Cesium.Material;
    private slot0?: Cesium.Texture;
    private slot1?: Cesium.Texture;
    private currentPairKey: string | null = null;
    private loadingPairKey: string | null = null;
    private token = 0;
    private targetBlend = 0;

    constructor(opts: LayerOptions) {
        this.viewer = opts.viewer;
        // 模型数据根 = GISDATA/jz/model/<工况名>/, 工况由 index.vue 经 dataDir 传入(补尾斜杠)
        this.base = `${import.meta.env.VITE_APP_GISDATA}/jz/model/${opts.dataDir}/`;
        this.variable = opts.variable;
        this.flipY = opts.flipY ?? true;
        this.worker = new Worker(new URL("./lerc.worker.ts", import.meta.url), {type: "module"});
        this.worker.onmessage = (e: MessageEvent<DecodeResult>) => {
            const r = e.data;
            const cb = this.taskPending.get(r.taskId);
            if (cb) {
                this.taskPending.delete(r.taskId);
                cb(r);
            }
        };
    }

    static async create(opts: LayerOptions): Promise<TimeSeriesLayer> {
        const layer = new TimeSeriesLayer(opts);
        const resp = await fetch(`${layer.base}meta.json`);
        layer.meta = (await resp.json()) as Meta;
        layer.corners = layer.meta.corners ? layer.meta.corners : cornersFromBBox(layer.meta.bbox);
        layer.buildFrames();
        layer.buildZFrames();
        // 有 Z 水位数据时水面高程直接取模型 Z, 不再采样地形; 仅无 Z 的旧工况用地形兜底 (与 particle-flow-layer 一致)
        if (layer.framesZ.length === 0) {
            layer.heightGrid = await getHeightGrid(layer.viewer.terrainProvider, layer.corners, layer.base);
        }
        layer.buildPrimitive(opts);
        await layer.setTime(layer.times[0]);
        return layer;
    }

    private buildFrames() {
        const chunks = this.meta.chunks
            .filter((c) => c.variable === this.variable)
            .sort((a, b) => a.index - b.index);
        const frames: Frame[] = [];
        this.chunkFrames.clear();
        let g = 0;
        for (const c of chunks) {
            const idxs: number[] = [];
            for (let b = 0; b < c.bandTimes.length; b++) {
                frames.push({t: c.bandTimes[b], chunkFile: c.file, band: b, globalIdx: g});
                idxs.push(g);
                g++;
            }
            this.chunkFrames.set(c.file, idxs);
        }
        this.frames = frames;
        this.times = frames.map((f) => f.t);
    }

    private buildZFrames() {
        // Z 水位帧: 时间轴应与显示变量一致; 不一致时建 t→zGidx 映射兜底, 过半对不上则视为无 Z
        const chunks = this.meta.chunks
            .filter((c) => c.variable === "Z")
            .sort((a, b) => a.index - b.index);
        const frames: Frame[] = [];
        this.chunkFramesZ.clear();
        let g = 0;
        for (const c of chunks) {
            const idxs: number[] = [];
            for (let b = 0; b < c.bandTimes.length; b++) {
                frames.push({t: c.bandTimes[b], chunkFile: c.file, band: b, globalIdx: g});
                idxs.push(g);
                g++;
            }
            this.chunkFramesZ.set(c.file, idxs);
        }
        this.framesZ = frames;
        if (this.framesZ.length) {
            const aligned = this.framesZ.length === this.frames.length && this.framesZ.every((f, k) => f.t === this.frames[k]?.t);
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

    private buildPrimitive(opts: LayerOptions) {
        const {width, height} = this.meta.grid;
        const r = this.meta.ranges[this.variable] || {min: 0, max: 1};
        const rmin = opts.displayRange?.min ?? r.min;
        const rmax = opts.displayRange?.max ?? r.max;
        const sampler = new Cesium.Sampler({
            minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            wrapS: Cesium.TextureWrap.CLAMP_TO_EDGE,
            wrapT: Cesium.TextureWrap.CLAMP_TO_EDGE,
        });
        const mk = () =>
            new Cesium.Texture({
                context: this.viewer.scene.context,
                source: {width, height, arrayBufferView: new Float32Array(width * height)},
                pixelFormat: Cesium.PixelFormat.RED,
                pixelDatatype: Cesium.PixelDatatype.FLOAT,
                flipY: this.flipY,
                sampler,
            });
        this.slot0 = mk();
        this.slot1 = mk();
        this.material = new Cesium.Material({
            fabric: {
                type: "TimeSeriesFlood",
                uniforms: {
                    u_tex0: Cesium.Material.DefaultImageId,
                    u_tex1: Cesium.Material.DefaultImageId,
                    u_blend: 0,
                    u_min: rmin,
                    u_max: rmax,
                    u_alpha: opts.alpha ?? 1,
                    u_texSize: new Cesium.Cartesian2(width, height),
                },
                source: FABRIC,
            },
        });
        this.material.uniforms.u_tex0 = this.slot0;
        this.material.uniforms.u_tex1 = this.slot1;
        this.rebuildPrimitive();
    }

    // 重建水面网格: 优先模型 Z 水位(zGrid, 随帧对/blend 动态重建), 无 Z 时退回地形网格, 再退平面
    private rebuildPrimitive() {
        if (this.primitive) {
            this.viewer.scene.primitives.remove(this.primitive);
            this.primitive = undefined;
        }
        const c = this.corners;
        const hg = this.zGrid ?? this.heightGrid;
        const geometry = hg
            ? terrainGridGeometry(c, hg, 0, 0, 1, 1, (u, v) => [u, v])
            : quadGeometry(
                [
                    uvToGeo(c, 0, 0),
                    uvToGeo(c, 1, 0),
                    uvToGeo(c, 1, 1),
                    uvToGeo(c, 0, 1),
                ],
                [0, 0, 1, 0, 1, 1, 0, 1]
            );
        this.primitive = this.viewer.scene.primitives.add(
            new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({geometry}),
                appearance: new Cesium.MaterialAppearance({
                    material: this.material!,
                    translucent: true,
                    closed: false,
                    flat: true
                }),
                asynchronous: false,
            })
        );
    }

    private lruGet(idx: number): Float32Array | undefined {
        const v = this.lru.get(idx);
        if (v) {
            this.lru.delete(idx);
            this.lru.set(idx, v);
        }
        return v;
    }

    private lruSet(idx: number, f: Float32Array) {
        if (this.lru.has(idx)) this.lru.delete(idx);
        this.lru.set(idx, f);
        while (this.lru.size > FRAME_CAP) {
            const oldest = this.lru.keys().next().value as number;
            this.lru.delete(oldest);
        }
    }

    private requestDecode(bytes: ArrayBuffer): Promise<DecodeResult> {
        const taskId = ++this.taskSeq;
        return new Promise((resolve) => {
            this.taskPending.set(taskId, resolve);
            this.worker.postMessage({taskId, bytes}, [bytes]);
        });
    }

    private async decodeChunk(chunkFile: string, z = false): Promise<void> {
        const decoded = z ? this.zChunksDecoded : this.chunksDecoded;
        if (decoded.has(chunkFile)) return;
        const ik = (z ? "Z:" : "") + chunkFile; // inflight 键加前缀, 防显示变量与 Z 的同名 chunk 串扰
        const inflight = this.chunkInflight.get(ik);
        if (inflight) return inflight;
        const p = (async () => {
            try {
                const resp = await fetch(`${this.base}${chunkFile}`);
                if (!resp.ok) throw new Error(`fetch ${chunkFile} -> ${resp.status}`);
                const bytes = await resp.arrayBuffer();
                const d = await this.requestDecode(bytes);
                if (!d.ok || !d.pixels) throw new Error(d.error || "decode failed");
                const idxs = (z ? this.chunkFramesZ : this.chunkFrames).get(chunkFile)!;
                const {pixels, mask, bandMasks} = d;
                for (let k = 0; k < pixels.length; k++) {
                    const f32 = pixels[k];
                    const bm = k === 0 ? mask : bandMasks ? bandMasks[k - 1] : null;
                    if (bm) {
                        for (let i = 0; i < f32.length; i++) if (bm[i] === 0) f32[i] = this.meta.nodata;
                    }
                    const gidx = idxs[k];
                    if (gidx !== undefined) {
                        if (z) this.zSet(gidx, f32);
                        else this.lruSet(gidx, f32);
                    }
                }
                decoded.add(chunkFile);
            } finally {
                this.chunkInflight.delete(ik);
            }
        })();
        this.chunkInflight.set(ik, p);
        return p;
    }

    private zGet(idx: number): Float32Array | undefined {
        const v = this.zCache.get(idx);
        if (v) {
            this.zCache.delete(idx);
            this.zCache.set(idx, v);
        }
        return v;
    }

    private zSet(idx: number, f: Float32Array) {
        if (this.zCache.has(idx)) this.zCache.delete(idx);
        this.zCache.set(idx, f);
        while (this.zCache.size > FRAME_CAP) {
            const oldest = this.zCache.keys().next().value as number;
            this.zCache.delete(oldest);
        }
    }

    private async ensureZFrame(idx: number): Promise<void> {
        if (this.zCache.has(idx)) return;
        await this.decodeChunk(this.framesZ[idx].chunkFile, true);
    }

    private flipV(data: Float32Array, w: number, h: number): Float32Array {
        const out = new Float32Array(data.length);
        for (let r = 0; r < h; r++) out.set(data.subarray(r * w, (r + 1) * w), (h - 1 - r) * w);
        return out;
    }

    private async ensureFrame(idx: number): Promise<void> {
        if (this.lru.has(idx)) return;
        await this.decodeChunk(this.frames[idx].chunkFile);
    }

    private packInto(slot: Cesium.Texture, f: Float32Array) {
        const {width, height} = this.meta.grid;
        slot.copyFrom({source: {width, height, arrayBufferView: f}});
    }

    // 由当前 Z 帧对(zi/zj, 已 flipV)按 targetBlend 混合并降采样出全域名水面高程网格, 然后重建几何 (与 particle-flow-layer 一致)
    private updateZGrid() {
        const {zi, zj} = this;
        if (!zi || !zj) return;
        const blend = this.targetBlend;
        const {width: W, height: H} = this.meta.grid;
        const zr = this.meta.ranges.Z;
        const fb = 302; // 干区/无效点兜底高度, 用水位最低值避免 -9999 深坑
        const lo = this.meta.nodata + 1; // 有效值阈值(防 lerc 解码漂移, 不用等值比较)
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
                heights[gy * gw + gx] = temp < 295.8 ? 295.8 : temp;
            }
        }
        this.zGrid = {gridW: gw, gridH: gh, heights};
        this.lastZBlend = blend;
        this.rebuildPrimitive();
    }

    async setTime(t: number): Promise<void> {
        if (this.times.length === 0) return;
        if (t <= 600) t = 0
        const tClamped = Math.min(Math.max(t, this.times[0]), this.times[this.times.length - 1]);
        this.curT = tClamped;
        let i = 0;
        while (i < this.times.length - 1 && this.times[i + 1] <= tClamped) i++;
        const j = Math.min(i + 1, this.times.length - 1);
        const span = this.times[j] - this.times[i];
        this.targetBlend = i === j ? 0 : span > 0 ? (tClamped - this.times[i]) / span : 0;
        const key = `${i}:${j}`;
        if (this.currentPairKey === key) {
            this.material!.uniforms.u_blend = this.targetBlend;
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
            await Promise.all([
                this.ensureFrame(i),
                this.ensureFrame(j),
                // Z 帧失败不拖垮显示帧: 置空 zi/zj 退回地形/平面即可
                gzi !== null ? this.ensureZFrame(gzi).catch(() => {
                }) : Promise.resolve(),
                gzj !== null ? this.ensureZFrame(gzj).catch(() => {
                }) : Promise.resolve(),
            ]);
            if (token !== this.token) return;
            const fi = this.lruGet(i);
            const fj = this.lruGet(j);
            if (!fi || !fj || !this.slot0 || !this.slot1) {
                if (this.loadingPairKey === key) this.loadingPairKey = null;
                return;
            }
            const {width: w, height: h} = this.meta.grid;
            // Z 帧与显示帧同样只在缓存外 flipV 一次(cache 中保持原始, 避免重复命中时重复翻转)
            const zri = gzi !== null ? this.zGet(gzi) : undefined;
            const zrj = gzj !== null ? this.zGet(gzj) : undefined;
            if (zri && zrj) {
                this.zi = this.flipV(zri, w, h);
                this.zj = this.flipV(zrj, w, h);
            } else {
                this.zi = this.zj = null;
            }
            this.packInto(this.slot0, fi);
            this.packInto(this.slot1, fj);
            this.currentPairKey = key;
            if (this.loadingPairKey === key) this.loadingPairKey = null;
            this.material!.uniforms.u_blend = this.targetBlend;
            this.updateZGrid();
            if (j + 1 < this.frames.length) {
                const nextChunk = this.frames[j + 1].chunkFile;
                if (!this.chunksDecoded.has(nextChunk)) void this.decodeChunk(nextChunk);
                const gzn = this.zGidx(j + 1);
                if (gzn !== null) {
                    const nextZ = this.framesZ[gzn].chunkFile;
                    if (!this.zChunksDecoded.has(nextZ)) void this.decodeChunk(nextZ, true);
                }
            }
        } catch (e) {
            if (this.loadingPairKey === key) this.loadingPairKey = null;
        }
    }

    get range() {
        return this.meta?.ranges?.[this.variable];
    }

    setDisplayRange(min?: number, max?: number) {
        if (!this.material) return;
        if (min !== undefined) this.material.uniforms.u_min = min;
        if (max !== undefined) this.material.uniforms.u_max = max;
    }

    setAlpha(a: number) {
        if (!this.material) return;
        this.material.uniforms.u_alpha = a;
    }

    getStats(): { lruFrames: number; cap: number; chunksDecoded: number } {
        return {lruFrames: this.lru.size, cap: FRAME_CAP, chunksDecoded: this.chunksDecoded.size};
    }

    flyTo() {
        const {west, south, east, north} = this.meta.bbox;
        const lon = (west + east) / 2;
        const lat = (north + south) / 2;
        this.viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, 12000),
            orientation: {heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0},
        });
    }

    destroy() {
        this.token++;
        if (this.primitive) this.viewer.scene.primitives.remove(this.primitive);
        this.slot0?.destroy();
        this.slot1?.destroy();
        this.worker.terminate();
        this.lru.clear();
        this.zCache.clear();
        this.taskPending.clear();
    }
}
