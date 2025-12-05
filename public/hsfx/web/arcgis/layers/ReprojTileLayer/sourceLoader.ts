import { isAbortError } from "web/utils/misc";
import { ReprojTile } from "./ReprojTile";

export function createSrcTileLoader({
    requestRender,
    getReprojTile,
    maxConcurrent = 10,
    fecthMethod
}: {
    requestRender: () => void,
    getReprojTile: (key: string) => ReprojTile,
    maxConcurrent?: number,
    fecthMethod: (srcKey: string, signal: AbortSignal) => Promise<ImageBitmap>
}) {

    type Task = {
        key: string, //srckey
        targetRefs: Set<string/*targetKey*/>,
        priority: number,
        abort: () => void,
        promise: Promise<any>,
    }
    const bitmapCache = new Map<string /*srckey*/, {
        data: ImageBitmap,
        targetRefs: Set<string/*targetKey*/> //引用源瓦片的目标瓦片
    }>();

    //所有任务
    const taskMap = new Map<string/*srckey*/, Task>();

    let taskQueue = [] as Task[]; //优先级任务队列，优先级高->低, 包含（运行中的)

    function excute(cancelLowPriority = false) {
        if (!taskQueue.length) return;
        if (cancelLowPriority) {
            //最多10个网络请求, 优先级低的先取消
            for (let i = maxConcurrent; i < taskQueue.length; i++) {
                const task = taskQueue[i];
                if (!task) break;
                //正在运行就取消
                task.promise && task.abort();
            }
        }
        for (let i = 0; i < maxConcurrent; i++) {
            const task = taskQueue[i];
            if (!task) break;
            if (task.promise) continue; //正在运行
            const ac = new AbortController();
            let dequeue = false;
            task.promise = fecthMethod(task.key, ac.signal)
                .then((imagebitmap) => {
                    if (!task.targetRefs.size) {
                        imagebitmap.close();
                    } else {
                        bitmapCache.set(task.key, {
                            data: imagebitmap,
                            targetRefs: task.targetRefs,
                        });
                        task.targetRefs.forEach(targetKey => {
                            const reprojTile = getReprojTile(targetKey);
                            reprojTile.setSrcTile(task.key, imagebitmap);
                        });
                    }
                    dequeue = true;
                    requestRender();
                })
                .catch(e => {
                    //中断仍然保留在任务队列
                    if (isAbortError(e)) return;
                    task.targetRefs.forEach(targetKey => {
                        const reprojTile = getReprojTile(targetKey);
                        reprojTile.setSrcTile(task.key, null, true);
                        console.error(e);
                    });
                    //移除任务
                    dequeue = true;
                })
                .finally(() => {
                    if (dequeue) {
                        taskMap.delete(task.key);
                        const index = taskQueue.indexOf(task);
                        index !== -1 && taskQueue.splice(index, 1);
                    }
                    excute();
                });
            task.abort = () => {
                task.promise = task.abort = null;
                ac.abort();
            }
        }
    }

    let _destroyed = false;
    return {
        updateLoad(loads: {
            reprojTile: ReprojTile,
            priority: number
        }[], aborts: ReprojTile[]) {
            if (_destroyed) return;
            //从依赖中移除中止的瓦片
            for (let reprojTile of aborts) {
                for (let srcKey in reprojTile.srcAtlas) {
                    const refs = taskMap.get(srcKey)?.targetRefs;
                    if (!refs) continue;
                    refs.delete(reprojTile.key)
                }
            }

            //添加依赖并更新优先级
            for (let { reprojTile, priority } of loads) {
                for (let srcKey in reprojTile.srcAtlas) {
                    const status = reprojTile.srcAtlas[srcKey].status;
                    if (!!status) continue;
                    if (bitmapCache.has(srcKey)) {
                        const { data, targetRefs } = bitmapCache.get(srcKey);
                        reprojTile.setSrcTile(srcKey, data);
                        targetRefs.add(reprojTile.key);
                        continue;
                    }
                    !taskMap.has(srcKey) && taskMap.set(srcKey, {
                        key: srcKey,
                        targetRefs: new Set(),
                        priority: Infinity,
                        abort: null,
                        promise: null,
                    });
                    const task = taskMap.get(srcKey);
                    task.targetRefs.add(reprojTile.key);
                    //优先级越小越高
                    task.priority = Math.min(task.priority, priority);
                }
            }

            //无依赖的任务 中止
            for (let [srcKey, task] of taskMap.entries()) {
                if (task.targetRefs.size === 0) {
                    task.abort?.();
                    taskMap.delete(srcKey);
                }
            }

            taskQueue = Array.from(taskMap.values())
                .sort((a, b) => a.priority - b.priority)

            excute(true);
        },

        detachImagebitmap(reprojTile: ReprojTile, srcKey: string) {
            if (_destroyed) return;
            const { targetRefs, data } = bitmapCache.get(srcKey);
            targetRefs.delete(reprojTile.key);
            if (targetRefs.size === 0) {
                data.close();
                bitmapCache.delete(srcKey);
            }
        },
        destroy() {
            if (_destroyed) return;
            _destroyed = true;
            bitmapCache.values().forEach(i => i.data.close());
            taskMap.values().forEach(i => {
                i.promise && i.abort();
            });
            bitmapCache.clear();
            taskMap.clear();
            taskQueue.length = 0;
        }
    }
}