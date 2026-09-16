import Lerc from "lerc";
export interface DecodeResult {
  taskId: number;
  ok: boolean;
  width?: number;
  height?: number;
  pixels?: Float32Array[];
  mask?: Uint8Array | null;
  bandMasks?: (Uint8Array | null)[];
  error?: string;
}
self.onmessage = (e: MessageEvent<{ taskId: number; bytes: ArrayBuffer }>) => {
  const { taskId, bytes } = e.data;
  try {
    const d = Lerc.decode(bytes);
    const transfer: ArrayBuffer[] = [];
    (d.pixels || []).forEach((p: Float32Array) => transfer.push(p.buffer));
    if (d.mask) transfer.push(d.mask.buffer);
    (d.bandMasks || []).forEach((m: Uint8Array | null) => m && transfer.push(m.buffer));
    const res: DecodeResult = {
      taskId,
      ok: true,
      width: d.width,
      height: d.height,
      pixels: d.pixels as Float32Array[],
      mask: d.mask || null,
      bandMasks: (d.bandMasks || []) as (Uint8Array | null)[],
    };
    (self as unknown as Worker).postMessage(res, transfer);
  } catch (err: unknown) {
    const res: DecodeResult = {
      taskId,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(res);
  }
};
