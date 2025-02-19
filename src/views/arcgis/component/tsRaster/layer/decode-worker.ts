import { TypedArray, fromArrayBuffer } from "geotiff";
async function tiffToArrayBuffer(rawFileArrayBuffer: ArrayBuffer) {
    const tiff = await fromArrayBuffer(rawFileArrayBuffer);
    const image = await tiff.getImage();
    const [red] = await image.readRasters();
    return red as Uint16Array;
}
async function tiffToArrayBufferUV(rawFileArrayBuffer: ArrayBuffer) {
    const tiff = await fromArrayBuffer(rawFileArrayBuffer);
    const image = await tiff.getImage();
    const bound = await image.readRasters({ interleave: true });
    return bound as TypedArray;
}
self.onmessage = (e) => {
    const msg = e.data as { taskId: number; type: "tiffToArrayBuffer"; data: ArrayBuffer };
    if (msg.type === "tiffToArrayBuffer") {
        let now = performance.now();
        tiffToArrayBuffer(msg.data)
            .then((res) => {
                console.log(`decode: `, performance.now() - now, 'ms');
                self.postMessage({
                    type: "result:" + msg.type,
                    taskId: msg.taskId,
                    data: res,
                    status: "success",
                });
            })
            .catch((e) => {
                self.postMessage({
                    type: "result:" + msg.type,
                    taskId: msg.taskId,
                    data: null,
                    error: e,
                    status: "error",
                });
            });
    } else if (msg.type === "tiffToArrayBufferUV") {
        let now = performance.now();
        tiffToArrayBufferUV(msg.data)
            .then((res) => {
                console.log(`decode:`, performance.now() - now, 'ms');
                self.postMessage({
                    type: "result:" + msg.type,
                    taskId: msg.taskId,
                    data: res,
                    status: "success",
                });
            })
            .catch((e) => {
                self.postMessage({
                    type: "result:" + msg.type,
                    taskId: msg.taskId,
                    data: null,
                    error: e,
                    status: "error",
                });
            });
    }
};
