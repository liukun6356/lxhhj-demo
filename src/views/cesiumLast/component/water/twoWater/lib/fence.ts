export interface FenceMeta {
  file: string;
  format?: string;
  count?: number;
  grid?: { width: number; height: number; cellsize?: number };
  bbox?: { u0: number; v0: number; u1: number; v1: number };
}
// 模型数据地址唯一来源为 prolusionStore.modelBase（当前工况文件夹，无尾斜杠，这里补上）
export async function loadFence(fence?: FenceMeta, base: string =  `${import.meta.env.VITE_APP_GISDATA}/jz/model/0.5P/`): Promise<Float32Array | null> {
  try {
    if (!fence?.file || !fence.count) return null;
    const resp = await fetch(`${base}${fence.file}`, { cache: "no-cache" });
    if (!resp.ok) return null;
    const buf = await resp.arrayBuffer();
    if (buf.byteLength < 24 || buf.byteLength !== fence.count * 6 * 4) return null;
    return new Float32Array(buf);
  } catch {
    return null;
  }
}
