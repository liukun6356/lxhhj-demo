import * as Cesium from "cesium";
export interface Corners {
  sw: [number, number]; 
  se: [number, number];
  ne: [number, number];
  nw: [number, number];
}
export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}
export function cornersFromBBox(b: BBox): Corners {
  return {
    sw: [b.west, b.south],
    se: [b.east, b.south],
    ne: [b.east, b.north],
    nw: [b.west, b.north],
  };
}
export function uvToGeo(c: Corners, u: number, v: number): { lon: number; lat: number } {
  const [swLon, swLat] = c.sw;
  const [seLon, seLat] = c.se;
  const [neLon, neLat] = c.ne;
  const [nwLon, nwLat] = c.nw;
  const wLon = swLon + v * (nwLon - swLon), eLon = seLon + v * (neLon - seLon);
  const wLat = swLat + v * (nwLat - swLat), eLat = seLat + v * (neLat - seLat);
  return { lon: wLon + u * (eLon - wLon), lat: wLat + u * (eLat - wLat) };
}
export function geoToUV(c: Corners, lon: number, lat: number): { u: number; v: number } {
  const [swLon, swLat] = c.sw;
  const [seLon, seLat] = c.se;
  const [neLon, neLat] = c.ne;
  const [nwLon, nwLat] = c.nw;
  const A = swLon, B = seLon - swLon, C = nwLon - swLon, D = swLon - seLon - nwLon + neLon;
  const E = swLat, F = seLat - swLat, G = nwLat - swLat, H = swLat - seLat - nwLat + neLat;
  let u = 0.5, v = 0.5;
  for (let i = 0; i < 3; i++) {
    const dLon = A + B * u + C * v + D * u * v - lon;
    const dLat = E + F * u + G * v + H * u * v - lat;
    const det = (B + D * v) * (G + H * u) - (C + D * u) * (F + H * v);
    if (det === 0) break;
    const du = ((G + H * u) * -dLon - (C + D * u) * -dLat) / det;
    const dv = ((B + D * v) * -dLat - (F + H * v) * -dLon) / det;
    u += du; v += dv;
  }
  return { u: Math.max(0, Math.min(1, u)), v: Math.max(0, Math.min(1, v)) };
}
export function quadGeometry(pts: { lon: number; lat: number }[], st: number[]): Cesium.Geometry {
  const positions = pts.map((p) => Cesium.Cartesian3.fromDegrees(p.lon, p.lat));
  const pos = new Float64Array(12);
  for (let i = 0; i < 4; i++) {
    pos[i * 3] = positions[i].x;
    pos[i * 3 + 1] = positions[i].y;
    pos[i * 3 + 2] = positions[i].z;
  }
  return new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: pos,
      }),
      st: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: Float32Array.from(st),
      }),
    },
    indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromPoints(positions),
  });
}
export interface HeightGrid {
  gridW: number;
  gridH: number;
  heights: Float32Array;
}
const HEIGHT_GRID_W = 300;
const HEIGHT_GRID_H = 129;
const heightCache = new Map<string, Promise<HeightGrid | null>>();
export function getHeightGrid(
  terrainProvider: Cesium.TerrainProvider,
  corners: Corners,
  key: string
): Promise<HeightGrid | null> {
  let p = heightCache.get(key);
  if (!p) {
    p = sampleHeightGrid(terrainProvider, corners, HEIGHT_GRID_W, HEIGHT_GRID_H);
    heightCache.set(key, p);
  }
  return p;
}
async function sampleHeightGrid(
  terrainProvider: Cesium.TerrainProvider,
  corners: Corners,
  gridW: number,
  gridH: number
): Promise<HeightGrid | null> {
  if (!(terrainProvider instanceof Cesium.CesiumTerrainProvider)) return null;
  const cartos: Cesium.Cartographic[] = [];
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const g = uvToGeo(corners, gx / (gridW - 1), gy / (gridH - 1));
      cartos.push(Cesium.Cartographic.fromDegrees(g.lon, g.lat));
    }
  }
  try {
    await Cesium.sampleTerrainMostDetailed(terrainProvider, cartos);
  } catch (e) {
    console.warn("[geo] terrain height sampling failed, fallback flat", e);
    return null;
  }
  const heights = new Float32Array(gridW * gridH);
  for (let i = 0; i < cartos.length; i++) {
    heights[i] = Number.isFinite(cartos[i].height) ? cartos[i].height : 0;
  }
  return { gridW, gridH, heights };
}
export function heightAt(hg: HeightGrid, u: number, v: number): number {
  const gw = hg.gridW, gh = hg.gridH;
  const gx = Math.min(gw - 1, Math.max(0, u * (gw - 1)));
  const gy = Math.min(gh - 1, Math.max(0, v * (gh - 1)));
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const x1 = Math.min(x0 + 1, gw - 1), y1 = Math.min(y0 + 1, gh - 1);
  const h00 = hg.heights[y0 * gw + x0];
  const h10 = hg.heights[y0 * gw + x1];
  const h01 = hg.heights[y1 * gw + x0];
  const h11 = hg.heights[y1 * gw + x1];
  return h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy;
}
// 4 邻域跳过无效像元的双线性采样(参照 time-series-layer 的 ts_sample), 全无效返回 null; frame 为 flipV 后数据(行号∝v)
export function sampleZValid(
  f: Float32Array, w: number, h: number, u: number, v: number,
  lo: number, zr?: { min: number; max: number }
): number | null {
  const gx = Math.min(w - 1, Math.max(0, u * (w - 1)));
  const gy = Math.min(h - 1, Math.max(0, v * (h - 1)));
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
  const pts: [number, number, number][] = [
    [x0, y0, (1 - fx) * (1 - fy)],
    [x1, y0, fx * (1 - fy)],
    [x0, y1, (1 - fx) * fy],
    [x1, y1, fx * fy],
  ];
  let ws = 0, vs = 0;
  for (const [x, y, wt] of pts) {
    if (wt === 0) continue;
    const val = f[y * w + x];
    if (Number.isFinite(val) && val > lo && (!zr || (val >= zr.min - 1e-3 && val <= zr.max + 1e-3))) {
      ws += wt;
      vs += val * wt;
    }
  }
  return ws > 0 ? vs / ws : null;
}
export function terrainGridGeometry(
  c: Corners,
  hg: HeightGrid,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  stOf: (u: number, v: number) => [number, number]
): Cesium.Geometry {
  const gw = hg.gridW, gh = hg.gridH;
  const mW = Math.max(2, Math.min(gw, Math.round((u1 - u0) * (gw - 1)) + 1));
  const mH = Math.max(2, Math.min(gh, Math.round((v1 - v0) * (gh - 1)) + 1));
  const pos = new Float64Array(mW * mH * 3);
  const st = new Float32Array(mW * mH * 2);
  const verts: Cesium.Cartesian3[] = [];
  for (let j = 0; j < mH; j++) {
    for (let i = 0; i < mW; i++) {
      const u = u0 + (i / (mW - 1)) * (u1 - u0);
      const v = v0 + (j / (mH - 1)) * (v1 - v0);
      const g = uvToGeo(c, u, v);
      const p = Cesium.Cartesian3.fromDegrees(g.lon, g.lat, heightAt(hg, u, v));
      const k = j * mW + i;
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      const [su, sv] = stOf(u, v);
      st[k * 2] = su; st[k * 2 + 1] = sv;
      verts.push(p);
    }
  }
  const nTris = (mW - 1) * (mH - 1) * 2;
  const indices = new Uint32Array(nTris * 3);
  let t = 0;
  for (let j = 0; j < mH - 1; j++) {
    for (let i = 0; i < mW - 1; i++) {
      const a = j * mW + i, b = a + 1, c = a + mW, d = c + 1;
      indices[t++] = a; indices[t++] = b; indices[t++] = c;
      indices[t++] = b; indices[t++] = d; indices[t++] = c;
    }
  }
  return new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: pos,
      }),
      st: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: st,
      }),
    },
    indices,
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromPoints(verts),
  });
}
