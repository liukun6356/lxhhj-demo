import {RasterTimeData, RasterTileProjectedData, TimeSeriesRasterSourceType} from "./types";
import {flushQueue, TaskId} from "./misc";
import {
    RasterCtxInitParams,
    RasterPortMessage,
    RasterResponseMessage,
    RasterTileSplitResult,
    RequestRasterWorkerType,
    Res_TileDataAtTime,
    ResponseRasterWorkerType,
    ResponseTypePrefix,
} from "./raster.worker";

export async function initRasterWorker(opts: {
    dataTimes: number[];
    ports: MessagePort[];
    splitResult: RasterTileSplitResult;
    type: TimeSeriesRasterSourceType;
    dataGetter: (time: number) => Promise<RasterTimeData>;
    noDataValue: number;
    col: number;
    row: number;
    outputTexSize: number;
    debug: boolean;
}) {
    const globalRequestTaskId = (() => {
        let id = 0;
        return () => ++id;
    })();
    const workerHandles = opts.ports.map((p, index) =>
        initRasterPort({
            port: p,
            workerId: index,
            frameDataGetter: opts.dataGetter,
            taskIdGenerator: globalRequestTaskId,
        })
    );
    const getExcutor = (() => {
        const times = opts.dataTimes;
        const map = new Map<number, ReturnType<typeof initRasterPort>>();
        //同一帧数据只会被一个线程处理, 简单分配一下每个线程对应哪些时序
        for (let i = 0, len = times.length; i < len; i++) {
            map.set(times[i], workerHandles[i % opts.ports.length]);
        }
        return (time: number) => map.get(time);
    })();
    const workerProxy = {
        toggleUniqueCodeMapping: (enable: boolean, codeMap: Map<number, number>) => {
            return Promise.all(workerHandles.map((w) => w.toggleUniqueCodeMapping(enable, codeMap)));
        },
        getTileDataAtTime: (tileId: string, time: number) => {
            return getExcutor(time).getTileDataAtTime(tileId, time);
        },
        cancelFrameAndTaskAtTimes: (times: number[], reason: any) => {
            workerHandles.forEach((w) => {
                const ts = times.filter((i) => getExcutor(i) === w);
                ts.length && w.cancelFrameAndTaskAtTimes(ts, reason);
            });
        },
        destroy: () => workerHandles.forEach((w) => w.destroyed()),
        _takeSnapshot: () => Promise.all(workerHandles.map((w) => w._takeSnapshot())),
    };
    const initParams = {
        tiles: opts.splitResult.tileSplit.map((i) => {
            return {...i, debugData: null};
        }),
        noDataValue: opts.noDataValue,
        col: opts.col,
        row: opts.row,
        outputSize: opts.outputTexSize,
        type: opts.type,
    };
    await Promise.all(workerHandles.map((w) => w.init(initParams)));
    return workerProxy;
}

//初始化栅格投影线程, 接口promise化
export function initRasterPort(opts: {
    port: MessagePort;
    workerId: number;
    frameDataGetter: (time: number) => Promise<RasterTimeData>;
    taskIdGenerator?: () => TaskId;
}) {
    type TaskHandle = {
        resolve: (result: any) => void;
        reject: (error: any) => void;
        cancel?: (error: any) => void;
    };
    let destroyed = false;
    const newSendTaskId =
        opts.taskIdGenerator ||
        (() => {
            let id = 0;
            return () => ++id;
        })();
    const sendTaskMap = new Map<TaskId, TaskHandle>(); //任务记录表
    const frameTaskMap = new Map<number /*time*/, (e: any) => void /* cancel */>(); //frame data任务表
    const {port, frameDataGetter, workerId} = opts;
    const sendMessage = (msg: RasterPortMessage, transfer?: Transferable[]) => {
        if (destroyed) return;
        port.postMessage(msg, transfer);
    };
    port.onmessage = async (e: MessageEvent<RasterPortMessage>) => {
        if (destroyed) return;
        const message = e.data;
        const type = message.type;
        //任务结果
        if ((type as string).startsWith(ResponseTypePrefix)) {
            const msg = e.data as RasterResponseMessage;
            const task = sendTaskMap.get(msg.taskId);
            if (!task) return;
            const {status, data, errMsg} = msg;
            if (status === "success") {
                task.resolve(data as any);
            } else {
                task.reject(errMsg);
            }
            sendTaskMap.delete(msg.taskId);
        }
        //线程请求
        if (type === RequestRasterWorkerType.getFrameDataAtTime) {
            const {taskId, data: time} = message;
            new Promise<RasterTimeData>((resolve, reject) => {
                frameTaskMap.set(time, (e: any) => reject(e));
                frameDataGetter(time).then(resolve).catch(reject);
            })
                .then((bufferData) => {
                    sendMessage(
                        {
                            type: ResponseRasterWorkerType.getFrameDataAtTime,
                            status: "success",
                            taskId,
                            data: {data: bufferData, time},
                        },
                        "buffer" in bufferData ? [bufferData.buffer] : null
                    );
                })
                .catch((e) => {
                    sendMessage({
                        type: ResponseRasterWorkerType.getFrameDataAtTime,
                        status: "error",
                        taskId,
                        data: null,
                        errMsg: e,
                    });
                })
                .finally(() => {
                    frameTaskMap.delete(time);
                });
        }
    };

    //瓦片请求批处理
    const getTileDataBatch = flushQueue<{ tileId: string; time: number; taskId: TaskId }>(
        (list) => {
            //可能任务已经取消了
            const filterRequest = list.filter((i) => sendTaskMap.has(i.taskId));
            sendMessage({
                type: RequestRasterWorkerType.getTileDataAtTimeBatch,
                data: filterRequest,
            });
        },
        null,
        "promise"
    );
    //取消任务批处理
    const cancelTaskBatch = flushQueue<TaskId>(
        (taskIds) => {
            sendMessage({
                type: RequestRasterWorkerType.cancelGetTileDataAtTimeBatch,
                data: taskIds,
            });
        },
        null,
        "promise"
    );
    return {
        id: workerId,
        _takeSnapshot: () => {
            const taskId = newSendTaskId();
            return new Promise<any>((resolve, reject) => {
                sendTaskMap.set(taskId, {
                    resolve: (data: any) =>
                        resolve({
                            data,
                            workerId,
                        }),
                    reject,
                });
                sendMessage({
                    type: RequestRasterWorkerType.takeSnapshot,
                    taskId,
                    data: null,
                });
            });
        },
        init: (opts: RasterCtxInitParams) => {
            const taskId = newSendTaskId();
            return new Promise<void>((resolve, reject) => {
                sendTaskMap.set(taskId, {resolve, reject});
                sendMessage({
                    type: RequestRasterWorkerType.init,
                    taskId,
                    data: opts,
                });
            });
        },
        //切换唯一值编码表
        toggleUniqueCodeMapping: (enable: boolean, codeMap: Map<number, number>) => {
            const taskId = newSendTaskId();
            return new Promise<void>((resolve, reject) => {
                sendTaskMap.set(taskId, {resolve, reject});
                sendMessage({
                    type: RequestRasterWorkerType.toggleUniqueCodeMapping,
                    taskId,
                    data: {
                        enable,
                        codeMap,
                    },
                });
            });
        },
        //获取tile在某时间的投影数据
        getTileDataAtTime: (tileId: string, time: number) => {
            const taskId = newSendTaskId();
            let cancel: (e: any) => void;
            const promise = new Promise<RasterTileProjectedData>((resolve, reject) => {
                let canceled = false;
                cancel = (e) => {
                    canceled = true;
                    reject(e);
                    cancelTaskBatch(taskId);
                    sendTaskMap.delete(taskId);
                };
                sendTaskMap.set(taskId, {
                    resolve: (result: Res_TileDataAtTime["data"]) => {
                        if (canceled) {
                            result.imagebitmap && result.imagebitmap.close();
                            return;
                        }
                        resolve({
                            ...result,
                            worker: {
                                id: workerId,
                                taskId,
                            },
                        });
                    },
                    reject,
                    cancel,
                });
                getTileDataBatch({tileId, time, taskId});
            });
            return {promise, cancel};
        },
        //取消在给定时间的帧数据请求和瓦片请求
        cancelFrameAndTaskAtTimes: (times: number[], reason: any) => {
            Array.from(frameTaskMap.entries()).forEach(([time, cancel]) => {
                if (times.findIndex((i) => i === time) !== -1) {
                    cancel(reason);
                }
            });
            sendMessage({
                type: RequestRasterWorkerType.cancelFrameAndTaskAtTimes,
                data: times,
            });
        },
        destroyed: () => {
            destroyed = true;
            sendMessage({type: RequestRasterWorkerType.close});
            port.close();
        },
    };
}
