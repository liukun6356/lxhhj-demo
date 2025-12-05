import has from "@arcgis/core/core/has";
import { openArcgisWorker } from "web/arcgis/supports/worker-helper";
import { getReprojFromStoreOrCalc, saveReprojTileResult } from "web/arcgis/worker/tile-reproj";


let _woker: ReturnType<typeof initReprojWorker>;
function initReprojWorker(useWorker: boolean) {
    const worker = openArcgisWorker({
        strategy: useWorker ? "distributed" : 'local',
    });
    type C = typeof getReprojFromStoreOrCalc;
    type CParam = WorkerMethodParam<C>;
    type S = typeof saveReprojTileResult;
    type SParam = WorkerMethodParam<S>
    return {
        getReprojFromStoreOrCalc: (param: CParam, opts?: __esri.ConnectionInvokeOptions) => worker.invoke<C>("getReprojFromStoreOrCalc", param, opts),
        saveReprojTileResult: (param: SParam, opts?: __esri.ConnectionInvokeOptions) => worker.invoke<S>("saveReprojTileResult", param, opts),
        destroy() { worker.destroy() },
    }
}
export function getReprojWorker() {
    return _woker ??= initReprojWorker(!has('reproj-worker-local'))
}


type T = {
    options?: ImageEncodeOptions,
    resolve: (b: Blob) => void,
    reject: (e?: any) => void,
};
let _ctx: { canvas: OffscreenCanvas, ctx: OffscreenCanvasRenderingContext2D };
let _queue: Map<ImageBitmap, T>;
let _running: T;
function getCtx() {
    if (!_ctx) {
        const canvas = new OffscreenCanvas(1, 1);
        _ctx = {
            canvas,
            ctx: canvas.getContext('2d')
        }
    }
    return _ctx;
}
function excute() {
    if (_running) return;
    if (!_queue.size) return;
    const { value } = _queue.entries().next();
    const [imagebitmap, task] = value;
    const { canvas, ctx } = getCtx();
    canvas.width = imagebitmap.width;
    canvas.height = imagebitmap.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagebitmap, 0, 0);
    canvas.convertToBlob(task.options).then(task.resolve).catch(task.reject)
        .finally(() => {
            imagebitmap.close();
            _queue.delete(imagebitmap);
            excute();
        });
}
export function imagebitmapToBlob(imagebitmap: ImageBitmap, options?: ImageEncodeOptions) {
    const { promise, resolve, reject } = Promise.withResolvers<Blob>();
    (_queue ??= new Map()).set(imagebitmap, { resolve, reject, options });
    excute();
    return promise;
}