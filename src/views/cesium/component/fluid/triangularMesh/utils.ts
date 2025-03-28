export function ceilPowerOfTwo(val: number) {
    val = +val;
    if (isNaN(val)) throw new Error('不是数字');
    if (val & (val - 1)) {
        val |= val >> 1;
        val |= val >> 2;
        val |= val >> 4;
        val |= val >> 8;
        val |= val >> 16;
        return val + 1;
    } else {
        return val === 0 ? 1 : val;
    }
}
export function calcDataTexSize(pixelCount: number) {
    if (!pixelCount) throw new Error('长度不存在!');
    const length = ceilPowerOfTwo(pixelCount);
    const l = Math.log2(length);
    const cols = Math.ceil(l / 2);
    const rows = l - cols;
    return [2 ** cols, 2 ** rows];
}
export function createReusePool<T = any>(opts: {
    create: () => T;
    disposeItem: (item: T) => void;
    size?: number;
}) {
    const cache = [] as T[];
    const size = opts.size ?? 32;
    return {
        push(item: T) {
            if (cache.length === size) {
                opts.disposeItem(item);
                return;
            }
            cache.push(item);
        },
        get() {
            return cache.length ? cache.pop() : opts.create();
        },
        clear() {
            cache.forEach((i) => {
                opts.disposeItem(i);
            });
            cache.length = 0;
        },
    };
}
export class LRUCache<V = any, K = any> {
    private cache: Map<K, V>;
    private capacity: number;
    private _setWithEffect: (key: K, val: V) => void;
    private _deleteWithEffect: (key: K, val: V, reason?: any) => void;
    constructor(
        capacity: number,
        opts?: {
            onAdd?: (obj: V, key: K) => void;
            onRemove?: (obj: V, key: K, reason?: any) => void;
        }
    ) {
        this.cache = new Map<K, V>();
        this.capacity = capacity;
        this._deleteWithEffect = (key: K, val: V, reason?: any) => {
            this.cache.delete(key);
            opts?.onRemove && opts.onRemove(val, key, reason);
        };
        this._setWithEffect = (key: K, val: V) => {
            this.cache.set(key, val);
            opts?.onAdd && opts.onAdd(val, key);
        };
    }

    has(key: K) {
        return this.cache.has(key);
    }

    resize(capacity: number) {
        if (capacity <= 0) throw new Error('无效的容量');
        capacity = Math.max(10, capacity >> 0);
        if (capacity >= this.capacity) {
            //扩容
            this.capacity = capacity;
        } else {
            //缩减
            if (this.cache.size > capacity) {
                //移除多余的
                const iter = this.cache.keys();
                while (true) {
                    const key = iter.next().value;
                    const val = this.cache.get(key);
                    this._deleteWithEffect(key, val);
                    if (this.cache.size <= capacity) break;
                }
            }
            this.capacity = capacity;
        }
    }

    get(key: K, reinsert = true) {
        if (this.cache.has(key)) {
            const temp = this.cache.get(key);
            if (reinsert) {
                this.cache.delete(key);
                this.cache.set(key, temp);
            }
            return temp;
        }
        return null;
    }

    add(key: K, value: V) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            const removeKey = this.cache.keys().next().value;
            const removeObj = this.cache.get(removeKey);
            this._deleteWithEffect(removeKey, removeObj, 'LRU缓存已满');
        }
        this._setWithEffect(key, value);
    }

    remove(key: K, reason?: any) {
        if (!this.cache.has(key)) return null;
        const removeItem = this.cache.get(key);
        this._deleteWithEffect(key, removeItem, reason);
        return removeItem;
    }

    clear(reason?: any) {
        Array.from(this.cache.entries()).forEach((i) =>
            this._deleteWithEffect(i[0], i[1], reason)
        );
        this.cache.clear();
    }
}
type Key = string | number; //键
type CancelFn = (e: any) => void;
export function asyncTaskScheduler<
    Desc extends { key: Key },
    Result = any
>(opts: {
    invoke: (desc: Desc) =>
        | Promise<Result>
        | {
              promise: Promise<Result>;
              cancel: CancelFn;
          };
    onSuccess: (result: Result, desc: Desc) => void;
    onError: (e: any, desc: Desc) => void;
    maxConcurrency?: number;
}) {
    let autoExcuteNext = true;
    let toDoQueue: Desc[] = []; //后->先
    const runningMap = new Map<number | string, ReturnType<typeof wrapTask>>();
    const maxConcurrency = opts?.maxConcurrency ?? 5;
    const { invoke, onSuccess, onError } = opts;
    function wrapTask(taskDesc: Desc) {
        let cancel: CancelFn;
        let invokePromise: Promise<Result>;
        const key = taskDesc.key;
        const invokeReturn = invoke(taskDesc);
        if (invokeReturn instanceof Promise) {
            invokePromise = invokeReturn;
        } else {
            invokePromise = invokeReturn.promise;
            cancel = invokeReturn.cancel;
        }
        invokePromise
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
            const wrappedTask = wrapTask(desc);
            runningMap.set(desc.key, wrappedTask);
        }
    }

    function addTask(desc: Desc) {
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
            if (!item.cancel) {
                console.warn(`请求取消任务:[${key}]但未提供cancel函数`);
            } else {
                item.cancel(reason);
            }
            runningMap.delete(key);
            autoExcuteNext && execute();
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
            Array.from(runningMap.values()).map((i) => ({
                desc: i.desc,
                cancel: i.cancel,
            })),
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
        Array.from(runningMap.values()).forEach((f) => f.cancel?.(reason));
        runningMap.clear();
        toDoQueue.length = 0;
    }

    const obj = {
        _todo: [] as Desc[],
        _running: runningMap,
        addTask,
        cancelTask,
        setAutoTask: (v: boolean) => {
            autoExcuteNext = v;
            v && execute();
        },
        clear,
        updateQueue,
        destroy: clear,
    };
    Reflect.defineProperty(obj, '_todo', {
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
    preload?: Partial<{
        frame: number;
        timeStep: number;
        preloadTime: number;
    }>;
}) {
    const { times, curTime } = opts;
    let frame: number, step: number, preloadTime: number;
    if (opts.preload) {
        if (opts.preload.frame) {
            frame = Math.max(opts.preload.frame, 2);
        } else {
            step = opts.preload.timeStep;
            if (!step) {
                frame = 5;
            } else {
                preloadTime = opts.preload.preloadTime ?? 3000;
            }
        }
    } else {
        frame = 5;
    }
    const [beforeIndex, afterIndex] = findIntervalIndexThatValueIn(
        times,
        curTime
    );
    const indexMax = times.length - 1;
    const maxTime = times[indexMax];
    const timeIndexSet = new Set<number>();
    if (!step) {
        for (
            let i = beforeIndex, count = frame + 1; //默认向后取帧
            count > 0 && i <= indexMax;
            count--, i++
        ) {
            timeIndexSet.add(i);
        }
    } else {
        let now = curTime;
        let cursor = beforeIndex;
        let renderTime = 0;
        while (renderTime <= preloadTime) {
            for (let i = cursor + 1; i <= indexMax; i++) {
                if (times[i] > now) {
                    timeIndexSet.add(i);
                    timeIndexSet.add(i - 1);
                    cursor = i - 1;
                    break;
                }
            }
            now += step;
            renderTime += 1000 / 60;
            if (now >= maxTime) {
                timeIndexSet.add(indexMax);
                timeIndexSet.add(indexMax - 1);
                break;
            }
        }
    }
    return { timeIndexSet, beforeIndex, afterIndex };
}
export function findFirstGreaterThan(ascArr: number[], target: number) {
    let left = 0;
    let right = ascArr.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (ascArr[mid] > target) {
            if (mid === 0 || ascArr[mid - 1] <= target) {
                return mid;
            } else {
                right = mid - 1;
            }
        } else {
            left = mid + 1;
        }
    }

    return -1;
}

export function findIntervalIndexThatValueIn(ascArr: number[], value: number) {
    let afterIndex = findFirstGreaterThan(ascArr, value);
    if (afterIndex === -1) afterIndex = ascArr.length - 1;
    const beforeIndex = Math.max(0, afterIndex - 1);
    return [beforeIndex, afterIndex];
}

export function loadImg(src: string) {
    return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.src = src;
    });
}
