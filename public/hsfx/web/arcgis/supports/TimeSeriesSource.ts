import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import { watch } from "@arcgis/core/core/reactiveUtils";
import { assert, clamp, debounce, isNil } from "es-toolkit";
import { LRUCache } from "lru-cache";
import { firstGreaterEqualThanValueIndex } from "shared/utils/math";
import { ensurePromise, isAbortError } from "web/utils/misc";
import { EventedMixin } from "./EventedMixin";

export interface TimeSeriesSource {
    times: ArrayLike<number> //列出所有时间的序列
    | { start: number, end: number, interval: number }; //等间隔时间序列
    dataGetter: (time: number, timeIndex: number, signal: AbortSignal) => Promise<number[] | TypedArray>;
}

export type TimeInfo = ReturnType<typeof validateTimes>;
function validateTimes(sequence: TimeSeriesSource['times']) {
    if ('length' in sequence) {
        const length = sequence?.length;
        assert(!!length, "序列长度不能为空");
        const indexMap = new Map<number /*time*/, number /*index*/>();
        for (let i = 0; i < length; i++) {
            const curValue = sequence[i] as number;
            i && assert(curValue > sequence[i - 1], '数值序列必须是严格递增的');
            indexMap.set(curValue, i);
        }
        const maxIndex = length - 1;
        const minValue = sequence[0];
        const maxValue = sequence[maxIndex];
        const isSingle = length === 1;
        return {
            getRangeValueIn: (anyValue: number) => {
                if (anyValue <= minValue) return isSingle ? [0, 0] : [0, 1];
                if (anyValue >= maxValue) return [maxIndex, maxIndex];
                const after = firstGreaterEqualThanValueIndex(sequence, anyValue);
                return [after - 1, after];
            },
            getValue: (index: number) => sequence[index],
            getIndex: (value: number) => indexMap.get(value),
            maxIndex,
            minValue,
            maxValue,
            isSingle,
            size: sequence.length
        };
    } else {
        const minValue = sequence.start;
        const maxValue = sequence.end;
        assert(maxValue >= minValue, '结束值不能小于开始值');

        const interval = sequence.interval;
        const count = maxValue === minValue ? 1 : ((maxValue - minValue) / interval + 1);

        if (minValue !== maxValue) {
            assert(Number.isInteger(interval), 'interval不是整数');
            assert(Number.isInteger(count), '(start - end) / interval 不是整数');
        }
        const maxIndex = count - 1;
        const isSingle = count === 1;
        return {
            getRangeValueIn: (anyValue: number) => {
                if (anyValue <= minValue) return isSingle ? [0, 0] : [0, 1];
                if (anyValue >= maxValue) return [maxIndex, maxIndex];
                const after = Math.ceil((anyValue - minValue) / interval);
                return [after - 1, after];
            },
            getValue: (index: number) => minValue + interval * index,
            getIndex: (value: number) => (value - minValue) / interval,
            maxIndex,
            minValue,
            maxValue,
            isSingle,
            size: count
        }
    }
}

type TimeState = {
    curTime: number,
    beforeIndex: number,
    afterIndex: number,
    beforeTime: number,
    afterTime: number,
    preloadIndexs: number[],
}

@subclass()
export abstract class BaseTimeSeriesSourceLoader<T> extends EventedMixin(Accessor)<{
    'load-time-data': { time: number, timeIndex: number }
}> {
    _rawGetter: TimeSeriesSource['dataGetter'];

    timeInfo: ReturnType<typeof validateTimes>;
    preloads = 20; // todo 5

    @property()
    curTime: number;

    @property()
    state: TimeState

    private _concurrent = 2;
    private _waitIndexQueue = [] as number[]; // 待加载的时间的索引队列
    private _runningMap = new Map<number, () => void /* cancel function */>();

    private _loadedCache: LRUCache<number, T>;
    constructor(opts: TimeSeriesSource, cacheSize = 128) { // todo 32
        super();
        this._loadedCache = new LRUCache({
            max: cacheSize,
            dispose: (item: T, time: number) => {
                this.disposeTimeData(item, time, this.timeInfo.getIndex(time));
            }
        });
        this.timeInfo = validateTimes(opts.times);
        this._rawGetter = opts.dataGetter;
        assert(typeof opts.dataGetter === 'function', 'dataGetter 必须是函数');
        const debounceSchedule = debounce(this._scheduleLoad.bind(this), 300, { edges: ['trailing'] });
        this.addHandles(watch(
            () => this.curTime,
            t => {
                if (isNil(t) || isNaN(t)) {
                    this.state = null;
                    return;
                }
                if (this.state && t >= this.state.beforeTime && t <= this.state.afterTime) {
                    this.state.curTime = t;
                    return;
                }
                const state = this._resolveState(t);
                const hasIntersect = this.state
                    ? Math.abs(this.state.beforeIndex - state.beforeIndex) <= 2
                    : false;
                this.state = state;
                this._waitIndexQueue = [
                    ...state.preloadIndexs.reverse(),
                    state.afterIndex,
                    state.beforeIndex
                ].filter(index => !this._loadedCache.has(index) && !this._runningMap.has(index));
                if (!hasIntersect) {
                    for (let [timeIndex, cancel] of this._runningMap.entries()) {
                        if (timeIndex < state.beforeIndex || timeIndex - state.beforeIndex > this.preloads) {
                            cancel();
                            this._runningMap.delete(timeIndex);
                        }
                    }
                }
                debounceSchedule();
                if (!this._runningMap.size || hasIntersect) {
                    debounceSchedule.flush();
                }
            }, { initial: true }
        ));
    }

    private _resolveState(t: number): TimeState {
        const { maxIndex, getRangeValueIn, getValue, maxValue, minValue } = this.timeInfo;
        t = clamp(t, minValue, maxValue);
        const [beforeIndex, afterIndex] = getRangeValueIn(t);
        const beforeTime = getValue(beforeIndex);
        const afterTime = getValue(afterIndex);
        const preloadIndexs = [] as number[];
        for (let i = 1; i <= this.preloads; i++) {
            const nextIndex = afterIndex + i;
            if (nextIndex > maxIndex) break;
            preloadIndexs.push(nextIndex);
        }
        return {
            beforeIndex,
            afterIndex,
            beforeTime,
            afterTime,
            curTime: t,
            preloadIndexs: preloadIndexs,
        }
    }

    private _scheduleLoad() {
        if (this._runningMap.size === this._concurrent) return;
        if (!this._waitIndexQueue.length) return;
        const timeIndex = this._waitIndexQueue.pop();
        const time = this.timeInfo.getValue(timeIndex);

        const ac = new AbortController();
        const signal = ac.signal;
        this._runningMap.set(timeIndex, () => ac.abort());

        ensurePromise(this._rawGetter(time, timeIndex, ac.signal))
            .then(res => {
                signal.throwIfAborted();
                return this.processTimeData(res, time, timeIndex);
            })
            .then(buildData => {
                signal.throwIfAborted();
                this._loadedCache.set(timeIndex, buildData);
                this.emit('load-time-data', { time, timeIndex });
            }).catch(e => {
                if (isAbortError(e)) return;
                console.error(`fetch time data at time:${time} failed: `, e);
            }).finally(() => {
                this._runningMap.delete(timeIndex);
                Promise.resolve().then(() => this._scheduleLoad());
            });
    }

    abstract disposeTimeData(data: T, time: number, timeIndex: number): void;
    abstract processTimeData(loadedData: number[] | TypedArray, time: number, timeIndex: number): MaybePromise<T>;

    readyAtCurrent() {
        if (!this.state) return false;
        const { beforeIndex, afterIndex } = this.state;
        return this._loadedCache.has(beforeIndex) && this._loadedCache.has(afterIndex);
    }

    getTimeDataAt(timeIndex: number) {
        return this._loadedCache.get(timeIndex);
    }
}


