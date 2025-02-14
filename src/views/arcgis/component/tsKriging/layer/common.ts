import { isNil } from "lodash-es";
import { findIntervalIndexThatValueIn } from "./misc";
import Extent from "@arcgis/core/geometry/Extent";
import type { DataTexture, Texture } from "three";

export enum ColorMappingTypeCode {
    gradient = 1,
    "class-break" = 2,
    "unique-value" = 3,
}

export enum RenderSamplingCode {
    nearest = 1,
    linear = 2,
}

export function checkTimes(ascTimes: number[]) {
    const length = ascTimes?.length;
    if (!length) throw new Error("时间序列长度不能为空");
    const indexMap = new Map<number /*time*/, number /*index*/>();
    for (let i = 0; i < length; i++) {
        const curTime = ascTimes[i];
        if (isNil(curTime)) throw new Error(`时间不能为空`);
        if (typeof curTime !== "number" || isNaN(curTime) || curTime !== Math.floor(curTime))
            throw new Error(`时间必须是整数`);
        if (i && curTime < ascTimes[i - 1]) throw new Error(`时间序列必须是严格递增的`);
        if (indexMap.has(curTime)) throw new Error(`存在重复的时间${curTime}`);
        indexMap.set(curTime, i);
    }
    return {
        times: ascTimes,
        timeIndex: indexMap,
        minTime: ascTimes[0],
        maxTime: ascTimes[length - 1],
        isSingle: length === 1,
    };
}

export function createNamespaceError(namespace: string) {
    return (e: string) => new Error(`${namespace} ${e}`);
}

export function AbortError(reason: string) {
    return new DOMException(reason, "AbortError");
}

//构建colorMapping纹理
export type GradientColorMappingData = {
    type: "gradient";
    texture: Texture;
    valueRange: number[];
    trunc: boolean[];
};

export type ClassBreakColorMappingData = {
    type: "class-break";
    texture: DataTexture;
    trunc: boolean[];
    min: number;
    max: number;
    breaks: number;
};
export type UniqueValueColorMappingData = {
    type: "unique-value";
    codeMap: Map<number /*原值*/, number /*新值1-255*/>;
    texture: DataTexture; //新值对应纹理坐标, rgb=颜色 a=是否可用
    hasShowCode: boolean; //是否有显示的
};
export type ColorMappingData = GradientColorMappingData | ClassBreakColorMappingData | UniqueValueColorMappingData;

export enum EnumTaskStatus {
    none = "none",
    pending = "pending",
    finish = "finish",
    error = "error",
}

export const ILayerIdKey = Symbol("internal_layer_uid");

//默认是往后加载5帧
export type PreloadOpts = Partial<{
    frame: number; //默认往后加载多少帧, 设置frame会忽略 timestep和preloadTime
}>;

type Key = string | number; //键
type CancelFn = (e: any) => void;
export function asyncTaskScheduler<Desc extends { key: Key }, Result = any>(opts: {
    invoke: (desc: Desc) =>
        | Promise<Result>
        | {
        promise: Promise<Result>;
        cancel: CancelFn; //用于取消时的操作
    };
    onSuccess: (result: Result, desc: Desc) => void;
    onError: (e: any, desc: Desc) => void;
    maxConcurrency?: number;
}) {
    let autoExcuteNext = true;
    let toDoQueue: Desc[] = []; //优先级， 后->先
    const runningMap = new Map<Key, ReturnType<typeof createTask>>();
    const maxConcurrency = opts?.maxConcurrency ?? 1;
    const { invoke, onSuccess, onError } = opts;

    function createTask(taskDesc: Desc) {
        let cancel: CancelFn;
        let settled = false;
        const key = taskDesc.key;
        const promise = new Promise<Result>((resolve, reject) => {
            cancel = (e: any) => {
                if (settled) return;
                settled = true;
                reject(e);
                originCancel && originCancel(e);
            };
            let originCancel: CancelFn;
            let invokePromise: Promise<Result>;
            const invokeReturn = invoke(taskDesc);
            if (invokeReturn instanceof Promise) {
                invokePromise = invokeReturn;
            } else {
                invokePromise = invokeReturn.promise;
                originCancel = invokeReturn.cancel;
            }
            invokePromise
                .then((res) => {
                    if (settled) return;
                    settled = true;
                    resolve(res);
                })
                .catch((e) => {
                    if (settled) return;
                    settled = true;
                    reject(e);
                });
        });
        promise
            .then((res) => onSuccess(res, taskDesc))
            .catch((e) => onError(e, taskDesc))
            .finally(() => {
                runningMap.delete(key);
                autoExcuteNext && execute();
            });
        return {
            cancel,
            desc: taskDesc,
        };
    }

    function execute() {
        if (runningMap.size === maxConcurrency) return;
        while (runningMap.size < maxConcurrency && toDoQueue.length) {
            const desc = toDoQueue.pop();
            const task = createTask(desc);
            runningMap.set(desc.key, task);
        }
    }

    function add(desc: Desc) {
        if (runningMap.has(desc.key)) {
            console.warn(`当前任务正在执行,请勿重复添加`, desc);
            return;
        }
        const index = toDoQueue.findIndex((i) => i === desc);
        if (index === -1) {
            toDoQueue.unshift(desc);
        }
        execute();
    }

    function cancelTask(key: number | string, reason: any) {
        const item = runningMap.get(key);
        if (item) {
            item.cancel(reason);
        } else {
            const index = toDoQueue.findIndex((i) => i.key === key);
            index !== -1 && toDoQueue.splice(index, 1);
        }
    }
    //返回数组优先级[低 -> 高]
    function updateQueue(
        filterFn: (
            runningTask: {
                desc: Desc;
                cancel: (e?: any) => void;
            }[],
            waitingTask: Desc[]
        ) => Desc[]
    ) {
        const newTasks = filterFn.call(
            null,
            Array.from(runningMap.values()).map((i) => ({ desc: i.desc, cancel: i.cancel })),
            [...toDoQueue]
        );
        toDoQueue = newTasks.filter((item) => {
            if (runningMap.has(item.key)) {
                console.warn(`当前任务正在执行,请勿重复添加`, item);
                return false;
            }
            return true;
        });
        autoExcuteNext && execute();
    }
    function clear(reason: any) {
        Array.from(runningMap.values()).forEach((f) => f.cancel(reason));
        runningMap.clear();
        toDoQueue.length = 0;
    }

    const obj = {
        _todo: [] as Desc[],
        _running: runningMap,
        addTask: add,
        cancelTask,
        setAutoTask: (v: boolean) => {
            autoExcuteNext = v;
            v && execute();
        },
        clear,
        updateQueue,
        destroy: clear,
    };
    Reflect.defineProperty(obj, "_todo", {
        get() {
            return toDoQueue;
        },
    });
    return obj;
}

//查找后续的动画帧对应时间的索引
export function getFramePrediction(opts: {
    times: number[]; //所有时间
    curTime: number; //当前时间
    preload?: PreloadOpts;
}) {
    const { times, curTime } = opts;
    let frame: number;
    frame = Math.max(opts.preload?.frame ?? 5, 2);
    const [beforeIndex, afterIndex] = findIntervalIndexThatValueIn(times, curTime);
    const indexMax = times.length - 1;
    const timeIndexSet = new Set<number>();
    for (
        let i = beforeIndex, count = frame + 1; //默认向后取帧
        count > 0 && i <= indexMax;
        count--, i++
    ) {
        timeIndexSet.add(i);
    }
    return { timeIndexSet, beforeIndex, afterIndex };
}

export const getLayerUID = /*#__PURE__*/ (() => {
    let id = 1;
    return () => id++;
})();

export function isAbortError(e: any) {
    return e && e instanceof DOMException && (e.code === 20 || e.name === "AbortError");
}


export function resolveViewRenderExtent(view: __esri.MapView) {
    if (!view.rotation) return view.extent.clone();
    //找出给定范围, 旋转后能刚好覆盖当前屏幕范围
    const e = { xmin: Infinity, xmax: -Infinity, ymin: Infinity, ymax: -Infinity };
    const rawExtent = view.extent;
    const center = view.extent.center;
    const rad = (-view.rotation / 180) * Math.PI;
    const cos = Math.cos(rad),
        sin = Math.sin(rad);
    [
        [rawExtent.xmin, rawExtent.ymin],
        [rawExtent.xmax, rawExtent.ymin],
        [rawExtent.xmax, rawExtent.ymax],
        [rawExtent.xmin, rawExtent.ymax],
    ].forEach((p) => {
        const x = p[0] - center.x;
        const y = p[1] - center.y;
        const px = x * cos - y * sin + center.x;
        const py = x * sin + y * cos + center.y;
        e.xmin = Math.min(px, e.xmin);
        e.xmax = Math.max(px, e.xmax);
        e.ymin = Math.min(py, e.ymin);
        e.ymax = Math.max(py, e.ymax);
    });
    return new Extent({
        ...e,
        spatialReference: view.spatialReference.toJSON(),
    });
}
