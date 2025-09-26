import {asyncTaskScheduler, calcDataTexSize, findIntervalIndexThatValueIn, getFramePrediction, LRUCache} from "./utils";
import moment from "moment";

const createDataSource = (context, opts) => {
    const {times, dataGetter} = opts;
    times.sort((a, b) => a - b);
    const minTime = times[0], maxTime = times[times.length - 1];
    type TaskRecord = {
        key: number; //time
        status: EnumTaskStatus;
        isEmpty: boolean;
    };
    const taskMap = new Map<number /*time*/, TaskRecord>();
    const cache = new LRUCache<Cesium.Texture, number /*time*/>(256, {
        onRemove(obj, key) {
            taskMap.delete(key);
            obj.destroy();
        },
    });
    let dataLength: number;
    let texSize: number[];
    let totalTexBufferLength: number;
    const scheduler = asyncTaskScheduler<TaskRecord, Float32Array>({
        invoke(task) {
            task.status = EnumTaskStatus.pending;
            return dataGetter(task.key);
        },
        onSuccess(dataArr, task) {
            if (!dataLength) {
                dataLength = dataArr.length;
                texSize = calcDataTexSize(dataLength / 4);
                totalTexBufferLength = texSize[0] * texSize[1] * 4;
            }
            if (dataLength !== dataArr.length) throw new Error('时序数据长度不一致');
            let min = 0, max = 0;
            for (let i = dataArr.length; i--;) {
                min = Math.min(min, dataArr[i]);
                max = Math.max(max, dataArr[i]);
            }
            task.status = EnumTaskStatus.finish;
            if (max > 0) {
                const buffer = new Float32Array(totalTexBufferLength);
                buffer.set(dataArr);
                const tex = new Cesium.Texture({
                    context: context,
                    flipY: false,
                    sampler: new Cesium.Sampler({
                        minificationFilter:
                        Cesium.TextureMinificationFilter.LINEAR,
                        magnificationFilter:
                        Cesium.TextureMagnificationFilter.NEAREST,
                    }),
                    source: {
                        width: texSize[0], //rgba
                        height: texSize[1],
                        arrayBufferView: buffer,
                    },
                    pixelDatatype: Cesium.PixelDatatype.FLOAT,
                    pixelFormat: Cesium.PixelFormat.RGBA,
                });
                cache.add(task.key, tex);
                task.isEmpty = false;
            } else {
                task.isEmpty = true;
            }
            console.log(moment(task.key).format('YYYY-MM-DD HH:mm'), `[${min.toFixed(2)}, ${max.toFixed(2)}]`);
        },
        onError(error, task) {
            task.status = EnumTaskStatus.error;
            console.error(`load tile [${moment(task.key).format('YYYY-MM-DD HH:mm')}] fail\n`, error);
            throw error;
        },
        maxConcurrency: 2,
    });
    let curTime = NaN;
    let beforeIndex = NaN;
    let afterIndex = NaN;

    const handleTimeChange = (t: number) => {
        if (curTime === t) return;
        curTime = t;
        const res = getFramePrediction({times, curTime: t, preload: {frame: 10}});
        if (beforeIndex === res.beforeIndex && afterIndex === res.afterIndex) return;
        beforeIndex = res.beforeIndex;
        afterIndex = res.afterIndex;
        const {timeIndexSet} = res;
        scheduler.updateQueue((running, waiting) => {
            const loadTimes = new Set(
                Array.from(timeIndexSet).map((i) => times[i])
            );
            running.forEach(({desc, cancel}) => {
                if (!loadTimes.has(desc.key)) cancel?.('时间超出范围');
            });
            return Array.from(timeIndexSet)
                .sort((A, B) => B - A)
                .map((index) => {
                    const time = times[index];
                    let task = taskMap.get(time);
                    if (!task) {
                        task = {
                            key: time,
                            status: EnumTaskStatus.none,
                            isEmpty: null,
                        };
                        taskMap.set(time, task);
                    }
                    return task.status === 'none' ? task : null;
                })
                .filter(Boolean);
        });
    }

    return {
        get minTime() {
            return minTime;
        },
        get maxTime() {
            return maxTime;
        },
        get texSize() {
            return texSize;
        },
        get dataLength() {
            return dataLength;
        },
        get sourceOpts() {
            return opts;
        },
        setCurTime: handleTimeChange,
        getDataAtTime: (t: number) => {
            const [beforeIndex, afterIndex] = findIntervalIndexThatValueIn(times, t);
            const beforeTime = times[beforeIndex], afterTime = times[afterIndex];
            const r1 = taskMap.get(beforeTime), r2 = taskMap.get(afterTime);
            return r1?.status === 'finish' && r2?.status === 'finish' ? {
                beforeTime,
                afterTime,
                data1: cache.get(beforeTime),
                data2: cache.get(afterTime),
            } : null;
        },
        destroy() {
            scheduler.clear('');
            cache.clear('');
            taskMap.clear();
        },
    };
}
