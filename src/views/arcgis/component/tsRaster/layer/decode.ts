import { TypedArray } from "geotiff";
import DecodeWorker from "./decode-worker?worker";
let ctx: ReturnType<typeof initWorker>;
function initWorker() {
    const newTaskId = (() => {
        let id = 0;
        return () => ++id;
    })();
    const worker = new DecodeWorker();
    const taskMap = new Map<
        number,
        {
            resolve: (p?: any) => void;
            reject: (e?: any) => void;
        }
        >();
    worker.onmessage = (e) => {
        const msg = e.data as { taskId: number; type: string; data: any; status: "success" | "error"; error?: any };
        const { resolve, reject } = taskMap.get(msg.taskId);
        taskMap.delete(msg.taskId);
        if (msg.status === "success") {
            resolve(msg.data);
        } else {
            reject(msg.error);
        }
    };
    return {
        tiffToArrayBuffer: (rawFileArrayBuffer: ArrayBuffer) => {
            const taskId = newTaskId();
            const promise = new Promise<TypedArray>((resolve, reject) => {
                taskMap.set(taskId, {
                    resolve,
                    reject,
                });
            });
            worker.postMessage(
                {
                    taskId,
                    type: "tiffToArrayBuffer",
                    data: rawFileArrayBuffer,
                },
                [rawFileArrayBuffer]
            );
            return promise;
        },
        tiffToArrayBufferUV: (rawFileArrayBuffer: ArrayBuffer) => {
            const taskId = newTaskId();
            const promise = new Promise<TypedArray>((resolve, reject) => {
                taskMap.set(taskId, {
                    resolve,
                    reject,
                });
            });
            worker.postMessage(
                {
                    taskId,
                    type: "tiffToArrayBufferUV",
                    data: rawFileArrayBuffer,
                },
                [rawFileArrayBuffer]
            );
            return promise;
        },
    };
}
function getCtx() {
    if (!ctx) ctx = initWorker();
    return ctx;
}
export function tiffToArrayBuffer(rawFileArrayBuffer: ArrayBuffer) {
    return getCtx().tiffToArrayBuffer(rawFileArrayBuffer);
}
export function tiffToArrayBufferUV(rawFileArrayBuffer: ArrayBuffer) {
    return getCtx().tiffToArrayBufferUV(rawFileArrayBuffer);
}
