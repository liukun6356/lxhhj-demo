import {ArrayItemType, PromiseResult, TransferResult} from "./global";
import {TaskId} from "./misc";
import {RasterProjectSplitParams, getRasterProjectionExtentTileSplit} from "./reproject-split";
import { extractSubRegion, extractVectorFieldSubRegion } from "./misc";
import {LRUCache} from "./LRU";
import {RasterTimeData, TimeSeriesRasterSourceType} from "./types";
import {findCoverTileBoundsAtGivenLevel} from "./tile";
import {isNil} from "lodash-es";
import {isAbortError} from "./common";
import { getRasterProjectContext } from "./project";

export type RasterTileSplitResult = PromiseResult<typeof rasterReprojectExtentSplit>;

export enum RequestRasterWorkerType {
    takeSnapshot = "takeSnapshot",
    init = "init",
    getTileDataAtTime = "getTileDataAtTime",
    getTileDataAtTimeBatch = "getTileDataAtTimeBatch",
    cancelGetTileDataAtTimeBatch = "cancelGetTileDataAtTimeBatch",
    cancelFrameAndTaskAtTimes = "cancelFrameAndTaskAtTimes", //取消在time时刻的帧和对应任务
    getFrameDataAtTime = "getFrameDataAtTime",
    close = "close",
    toggleUniqueCodeMapping = "toggleUniqueCodeMapping",
}

const __STORE__ = new Map<number, MessagePort>();
//请求获取帧数据
export type Req_Init = {
    type: RequestRasterWorkerType.init;
    data: RasterCtxInitParams;
    taskId: TaskId;
};
export type Req_TakeSnapshot = {
    type: RequestRasterWorkerType.takeSnapshot;
    data: void;
    taskId: TaskId;
};
//请求获取帧数据
export type Req_GetFrameTimeData = {
    type: RequestRasterWorkerType.getFrameDataAtTime;
    data: number;
    taskId: TaskId;
};
//请求获取tile在某个时间
export type Req_GetTileDataAtTimeBatch = {
    type: RequestRasterWorkerType.getTileDataAtTimeBatch;
    data: { tileId: string; time: number; taskId: TaskId }[];
};
//取消任务
export type Req_CancelTaskBatch = {
    type: RequestRasterWorkerType.cancelGetTileDataAtTimeBatch;
    data: TaskId[];
};
export type Req_CancelFrameAndTaskAtTimes = {
    type: RequestRasterWorkerType.cancelFrameAndTaskAtTimes;
    data: number[]; //times
};

//销毁
export type Req_Dispose = { type: RequestRasterWorkerType.close };
//切换编码
export type Req_ToggleColorMapping = {
    type: RequestRasterWorkerType.toggleUniqueCodeMapping;
    data: {
        enable: boolean;
        codeMap: Map<number, number>;
    };
    taskId: TaskId;
};

export type RasterRequestMessage =
    | Req_Init
    | Req_TakeSnapshot
    | Req_CancelFrameAndTaskAtTimes
    | Req_CancelTaskBatch
    | Req_GetFrameTimeData
    | Req_GetTileDataAtTimeBatch
    | Req_Dispose
    | Req_ToggleColorMapping;

/** response **/
export interface ResponseMessageBase<T> {
    taskId: TaskId;
    data: T;
    status: "success" | "error";
    errMsg?: any;
}
export const ResponseTypePrefix = "return:";

export enum ResponseRasterWorkerType {
    takeSnapshot = ResponseTypePrefix + RequestRasterWorkerType.takeSnapshot,
    init = ResponseTypePrefix + RequestRasterWorkerType.init,
    getTileDataAtTime = ResponseTypePrefix + RequestRasterWorkerType.getTileDataAtTime,
    getFrameDataAtTime = ResponseTypePrefix + RequestRasterWorkerType.getFrameDataAtTime,
    toggleUniqueCodeMapping = ResponseTypePrefix + RequestRasterWorkerType.toggleUniqueCodeMapping,
}

export type Res_Init = ResponseMessageBase<void> & {
    type: ResponseRasterWorkerType.init;
};
export type Res_TakeSnapshot = ResponseMessageBase<any> & {
    type: ResponseRasterWorkerType.takeSnapshot;
};
export type Res_FrameTimeData = ResponseMessageBase<{
    time: number;
    data: RasterTimeData;
}> & { type: ResponseRasterWorkerType.getFrameDataAtTime };

export type Res_TileDataAtTime = ResponseMessageBase<{
    type: TimeSeriesRasterSourceType;
    tileId: string;
    time: number;
    imagebitmap: ImageBitmap;
    range: number[];
    costTime: number;
}> & { type: ResponseRasterWorkerType.getTileDataAtTime };

export type RasterResponseMessage =
    | Res_Init
    | Res_TakeSnapshot
    | Res_FrameTimeData
    | Res_ToggleColorMapping
    | Res_TileDataAtTime;

export type RasterPortMessage = RasterRequestMessage | RasterResponseMessage;

//创建一个store, 返回其id;
export async function createRasterReprojectContext() {
    const storeId = newReprojectCtxId();
    const result = await _create(storeId);
    return {
        result,
        transferList: [result.port],
    } as TransferResult<typeof result>;
}

export async function rasterReprojectExtentSplit(opts: RasterProjectSplitParams) {
    const {tileSplit, fullExtent, projectData} = await getRasterProjectionExtentTileSplit(opts);
    const level = tileSplit[0].tileInfo.z;
    const bounds = findCoverTileBoundsAtGivenLevel(fullExtent, opts.dstTileScheme, level);
    return {
        fullExtent,
        tileSplit: tileSplit.map((i) => {
            return {
                id: i.tileInfo.id,
                debugData: i.debugData,
                imageExtent: i.imageExtent,
                positionRTC: i.positionRTC,
                uv: i.uv,
            };
        }),
        projectData,
        level,
        bounds,
    };
}

const newReprojectCtxId = (() => {
    let id = 0;
    return () => ++id;
})();

async function _create(storeId: number) {
    const newRequestTaskId = (() => {
        let id = 0;
        return () => ++id;
    })();
    let $enableUniqueMapping = false;
    let $uniqueCodeMap: Map<number /*原始值*/, number /*映射值*/>;
    let $meta: {
        noDataValue: number;
        col: number;
        row: number;
        outputSize: number[];
        type: TimeSeriesRasterSourceType;
    };
    const {markEmpty, isEmpty} = (() => {
        const set = new Set<string /* tileId + time */>(); //为空的切片集合(值全为noDataValue)
        return {
            markEmpty(tileId: string, time: number) {
                set.add([tileId, time].join(":"));
            },
            isEmpty(tileId: string, time: number) {
                return set.has([tileId, time].join(":"));
            },
        };
    })();
    const $splitTileMap = new Map<string /*tileId */,
        {
            subImageRange: { sx: number; sy: number; width: number; height: number };
            triangleCount: number; //三角形数量
            glResource: {
                positionRTC: WebGLBuffer;
                uv: WebGLBuffer;
            };
            //顶点坐标和uv
            resource: {
                positionRTC: number[][];
                uv: number[][];
            };
        }>();

    const $frameManager = (() => {
        const taskMap = new Map<TaskId,
            {
                taskId: TaskId;
                time: number;
                status: "success" | "pending" | "error";
                error: any;
            }>();
        const getTaskAtTime = (time: number) => {
            return Array.from(taskMap.entries()).find((i) => i[1].time === time)?.[1];
        };
        const cache = new LRUCache<RasterTimeData, number /*time*/>(5, {
            onRemove(obj, time) {
                const record = getTaskAtTime(time);
                record && taskMap.delete(record.taskId);
            },
        });
        const runningTaskIds = new Set<TaskId>();
        return {
            getTaskAtTime,
            taskMap,
            runningTaskIds,
            cache,
            cancelFrameAtTimes: (times: Set<number>) => {
                const deletes = [] as number[];
                Array.from(taskMap.entries()).forEach(([taskId, record]) => {
                    if (record.status === "pending" && times.has(record.time)) {
                        taskMap.delete(taskId);
                        runningTaskIds.delete(taskId);
                        cache.remove(record.time);
                        deletes.push(record.time);
                    }
                });
                setTimeout(walkTaskQueue);
            },
            fetchFrame: (time: number) => {
                if (runningTaskIds.size >= 2) return; //最多同时2个任务
                let taskRecord = getTaskAtTime(time);
                if (!taskRecord) {
                    const taskId = [time, newRequestTaskId()].join("/");
                    taskRecord = {
                        taskId,
                        time,
                        status: "pending",
                        error: null,
                    };
                    taskMap.set(taskId, taskRecord);
                    runningTaskIds.add(taskId);
                    sendMessage({
                        type: RequestRasterWorkerType.getFrameDataAtTime,
                        data: time,
                        taskId,
                    });
                }
            },
            resolveFetch: (data: Res_FrameTimeData) => {
                const {taskId, status, data: frameResult, errMsg} = data;
                const item = taskMap.get(taskId);
                if (!item) return;
                if (status === "success") {
                    const {noDataValue} = $meta;
                    //对vectorField做转换
                    if ($meta.type === "vector-field" && !isNil(noDataValue)) {
                        const arr = frameResult.data;
                        for (let i = arr.length; i--;) {
                            if (arr[i] === noDataValue) arr[i] = 0;
                        }
                    }
                    cache.add(item.time, frameResult.data);
                    item.status = "success";
                } else {
                    if (isAbortError(errMsg)) {
                        taskMap.delete(taskId);
                    } else {
                        item.status = "error";
                        item.error = errMsg;
                    }
                }
                runningTaskIds.delete(taskId);
                setTimeout(walkTaskQueue);
            },
            isFetchError: (time: number) => {
                return getTaskAtTime(time)?.error;
            },
            getFrameData: (time: number) => cache.get(time),
            destroy: () => {
                cache.clear();
                taskMap.clear();
            },
        };
    })();

    //任务队列
    const $tileTimeDataTaskQueue = new Map<TaskId /*taskId*/, { tileId: string; time: number }>();
    const channel = new MessageChannel();
    const myPort = channel.port1;

    const sendMessage = (msg: RasterPortMessage, transfer?: Transferable[]) => {
        myPort.postMessage(msg, transfer);
    };
    myPort.onmessage = async (e: MessageEvent<RasterPortMessage>) => {
        const msgData = e.data;
        const type = msgData.type;
        if (type === RequestRasterWorkerType.init) {
            init(msgData.data);
            sendMessage({
                type: ResponseRasterWorkerType.init,
                data: null,
                status: "success",
                taskId: msgData.taskId,
            });
        } else if (type === RequestRasterWorkerType.cancelGetTileDataAtTimeBatch) {
            $tileTimeDataTaskQueue.size &&
            msgData.data.forEach((taskId) => {
                const item = $tileTimeDataTaskQueue.get(taskId);
                if (!item) return;
                $tileTimeDataTaskQueue.delete(taskId);
            });
        } else if (type === RequestRasterWorkerType.cancelFrameAndTaskAtTimes) {
            const timeSet = new Set(msgData.data);
            $frameManager.cancelFrameAtTimes(timeSet);
            Array.from($tileTimeDataTaskQueue.keys()).forEach((taskId) => {
                const item = $tileTimeDataTaskQueue.get(taskId);
                if (timeSet.has(item.time)) {
                    $tileTimeDataTaskQueue.delete(taskId);
                }
            });
        } else if (type === RequestRasterWorkerType.takeSnapshot) {
            const result = {
                frame: {
                    taskMap: Array.from($frameManager.taskMap.values()),
                    runningTaskIds: Array.from($frameManager.runningTaskIds),
                    //@ts-ignore
                    loaded: Array.from($frameManager.cache.cache.keys()),
                },
                tiles: Array.from($tileTimeDataTaskQueue.entries()).reduce((res, [taskId, data]) => {
                    res[taskId] = data;
                    return res;
                }, {} as Record<TaskId, any>),
            };
            sendMessage({
                type: ResponseRasterWorkerType.takeSnapshot,
                data: result,
                taskId: msgData.taskId,
                status: "success",
            });
        }
        //获取某个时间某个tile
        else if (type === RequestRasterWorkerType.getTileDataAtTimeBatch) {
            msgData.data.forEach(({taskId, tileId, time}) => {
                if (!$splitTileMap.has(tileId) || isEmpty(tileId, time)) {
                    sendMessage({
                        type: ResponseRasterWorkerType.getTileDataAtTime,
                        data: {
                            type: $meta.type,
                            imagebitmap: null,
                            range: null,
                            costTime: null,
                            time,
                            tileId,
                        },
                        taskId,
                        status: "success",
                    });
                    return;
                }
                if ($tileTimeDataTaskQueue.has(taskId)) {
                    return;
                }
                $tileTimeDataTaskQueue.set(taskId, {tileId, time});
                $frameManager.fetchFrame(time);
            });
            walkTaskQueue();
        }
        //销毁
        else if (type === RequestRasterWorkerType.close) {
            $tileTimeDataTaskQueue.clear();
            const glObjects = Array.from($splitTileMap.values())
                .map((i) => [i.glResource?.positionRTC, i.glResource?.uv])
                .flat()
                .filter(Boolean);
            if (glObjects.length) {
                getRasterProjectContext().disposeItems(glObjects);
            }
            $splitTileMap.clear();
            $frameManager.destroy();
            myPort.close();
            __STORE__.delete(storeId);
        }
        //切换编码转换
        else if (type === RequestRasterWorkerType.toggleUniqueCodeMapping) {
            const {enable, codeMap} = msgData.data;
            if ($enableUniqueMapping !== enable) {
                $tileTimeDataTaskQueue.clear(); //清空待做任务
                $enableUniqueMapping = enable;
                $uniqueCodeMap = codeMap;
                if (enable) {
                    codeMap.set($meta.noDataValue, $meta.noDataValue);
                }
            }
            sendMessage({
                type: ResponseRasterWorkerType.toggleUniqueCodeMapping,
                data: undefined,
                taskId: msgData.taskId,
                status: "success",
            });
        }
        //获取某个时间的帧数据
        else if (type === ResponseRasterWorkerType.getFrameDataAtTime) {
            //获取帧数据的返回结果
            $frameManager.resolveFetch(msgData);
        }
    };

    function walkTaskQueue() {
        if (!$tileTimeDataTaskQueue.size) return;
        let hasFrameDataSettled = false;
        for (let taskId of $tileTimeDataTaskQueue.keys()) {
            const {tileId, time} = $tileTimeDataTaskQueue.get(taskId);
            const error = $frameManager.isFetchError(time);
            if (error) {
                sendMessage({
                    type: ResponseRasterWorkerType.getTileDataAtTime,
                    taskId,
                    status: "error",
                    data: undefined,
                    errMsg: error,
                });
                $tileTimeDataTaskQueue.delete(taskId);
                hasFrameDataSettled = true;
                continue;
            }
            const frameData = $frameManager.getFrameData(time);
            if (!frameData) {
                $frameManager.fetchFrame(time);
                continue;
            }
            hasFrameDataSettled = true;
            try {
                const result = run(frameData, tileId, time);
                if (!result) markEmpty(tileId, time);
                sendMessage(
                    {
                        type: ResponseRasterWorkerType.getTileDataAtTime,
                        data: {
                            ...result,
                            tileId,
                            time,
                        },
                        taskId,
                        status: "success",
                    },
                    result ? [result.imagebitmap] : undefined
                );
                break;
            } catch (e) {
                sendMessage({
                    type: ResponseRasterWorkerType.getTileDataAtTime,
                    taskId,
                    status: "error",
                    data: undefined,
                    errMsg: e,
                });
            } finally {
                $tileTimeDataTaskQueue.delete(taskId);
            }
        }

        hasFrameDataSettled && setTimeout(walkTaskQueue);

        function run(frameData: RasterTimeData, tileId: string, time: number) {
            const now = performance.now();
            const {projectSingleChannel, disposeItems, createBuffer, projectVectorField} = getRasterProjectContext();
            const tileCtx = $splitTileMap.get(tileId);
            if (!tileCtx.glResource) {
                tileCtx.glResource = {
                    positionRTC: createBuffer(new Float32Array(tileCtx.resource.positionRTC.flat())),
                    uv: createBuffer(new Float32Array(tileCtx.resource.uv.flat())),
                };
                tileCtx.resource = null; //上传gpu后释放内存
            }
            if ($meta.type === "vector-field") {
                const subImage = extractVectorFieldSubRegion(
                    frameData,
                    [$meta.col, $meta.row],
                    tileCtx.subImageRange,
                    Float32Array
                );
                if (!subImage) {
                    markEmpty(tileId, time);
                    return null;
                }
                const range = [subImage.umin, subImage.umax, subImage.vmin, subImage.vmax];
                const result = projectVectorField({
                    outputTexSize: $meta.outputSize,
                    inputDataTex: subImage.pixel,
                    inputDataTexSize: [tileCtx.subImageRange.width, tileCtx.subImageRange.height],
                    positionRTC: tileCtx.glResource.positionRTC,
                    uv: tileCtx.glResource.uv,
                    valueRange: range,
                    triangles: tileCtx.triangleCount,
                    sampling: "nearest",
                });
                disposeItems([result.tex]);
                return {
                    type: $meta.type,
                    imagebitmap: result.imagebitmap,
                    range,
                    costTime: performance.now() - now,
                };
            } else {
                const subImage = extractSubRegion(
                    frameData,
                    [$meta.col, $meta.row],
                    tileCtx.subImageRange,
                    $meta.noDataValue,
                    Float32Array
                );
                if (!subImage) {
                    markEmpty(tileId, time);
                    return null;
                }
                if ($enableUniqueMapping) {
                    for (let arr = subImage.pixel, i = arr.length; i--;) {
                        arr[i] = $uniqueCodeMap.get(arr[i]);
                    }
                    subImage.min = 1;
                    subImage.max = $uniqueCodeMap.size - 1;
                }
                const result = projectSingleChannel({
                    outputTexSize: $meta.outputSize,
                    noDataValue: $meta.noDataValue,
                    inputDataTex: subImage.pixel,
                    inputDataTexSize: [tileCtx.subImageRange.width, tileCtx.subImageRange.height],
                    positionRTC: tileCtx.glResource.positionRTC,
                    uv: tileCtx.glResource.uv,
                    valueRange: [subImage.min, subImage.max],
                    triangles: tileCtx.triangleCount,
                    sampling: $enableUniqueMapping ? "nearest" : "linear",
                });
                disposeItems([result.tex]);
                return {
                    type: $meta.type,
                    imagebitmap: result.imagebitmap,
                    range: [subImage.min, subImage.max],
                    costTime: performance.now() - now,
                };
            }
        }
    }

    __STORE__.set(storeId, myPort);
    return {
        port: channel.port2,
    };

    function init(opts: RasterCtxInitParams) {
        $meta = {
            noDataValue: opts.noDataValue,
            col: opts.col,
            row: opts.row,
            outputSize: [opts.outputSize, opts.outputSize],
            type: opts.type,
        };
        opts.tiles.forEach((item) => {
            const {id, positionRTC, uv, imageExtent} = item;
            $splitTileMap.set(id, {
                subImageRange: imageExtent,
                triangleCount: positionRTC.length / 3,
                glResource: null,
                resource: {positionRTC, uv},
            });
        });
    }
}

export type Res_FrameTimeData = ResponseMessageBase<{
    time: number;
    data: RasterTimeData;
}> & { type: ResponseRasterWorkerType.getFrameDataAtTime };



export type RasterCtxInitParams = {
    tiles: TileSplitItem[];
    noDataValue: number;
    col: number;
    row: number;
    outputSize: number;
    type: TimeSeriesRasterSourceType;
};

export type Res_ToggleColorMapping = ResponseMessageBase<void> & {
    type: ResponseRasterWorkerType.toggleUniqueCodeMapping;
};
type TileSplitItem = ArrayItemType<PromiseResult<typeof rasterReprojectExtentSplit>["tileSplit"]>;
