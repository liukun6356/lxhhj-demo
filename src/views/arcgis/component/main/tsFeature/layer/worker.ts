import config from "@arcgis/core/config";
import { open } from "@arcgis/core/core/workers";
import { WorkerPathConfig } from "./config";
import { WorkerMethodParam, WorkerMethodResult } from "./global";
import { workerFeatureDetect } from "./misc.worker";

export const getWorkerFeatures = /*@__PURE__*/ (() => {
    let feature: Promise<ReturnType<typeof workerFeatureDetect> & { workerCount: number }>;
    return () => {
        if (!feature) {
            feature = new Promise(async (resolve) => {
                const worker = openCustomArcgisWorker(WorkerPathConfig.misc, { strategy: "distributed" });
                const result = await worker.broadcast<typeof workerFeatureDetect>("workerFeatureDetect", undefined);
                resolve({
                    ...result[0],
                    workerCount: result.length,
                });
            });
        }
        return feature;
    };
})();

//打开一个arcgis worker
export function openCustomArcgisWorker(path: string, opts?: __esri.workersOpenOptions) {
    const workerPath = new URL(config.workers.workerPath, location.origin).href;
    let promise: Promise<__esri.Connection> = null;
    let connection: __esri.Connection = null;
    let destroyed = false;
    const getConnection = () => {
        if (connection) return Promise.resolve(connection);
        if (!promise) {
            promise = open(new URL(path + ".js", workerPath).href, opts);
            promise.then((connect) => {
                connection = connect;
            });
        }
        return promise;
    };
    const destroy = () => {
        if (destroyed) return;
        destroyed = true;
        if (connection) {
            connection.close();
        }
    };
    return {
        invoke: async <T extends (...args: any[]) => any, P = WorkerMethodParam<T>, R = WorkerMethodResult<T>>(
            methodName: string,
            params: P,
            options?: __esri.ConnectionInvokeOptions
        ): Promise<R> => {
            if (destroyed) return null;
            return getConnection().then((connect) => connect.invoke(methodName, params, options));
        },
        broadcast: async <T extends (...args: any[]) => any, P = WorkerMethodParam<T>, R = WorkerMethodResult<T>>(
            methodName: string,
            params: P,
            options?: __esri.ConnectionBroadcastOptions
        ) => {
            if (destroyed) return null;
            const result = await getConnection().then((connect) => connect.broadcast(methodName, params, options));
            return Promise.all(result as Promise<R>[]);
        },
        destroy,
    };
}

//任务调度器
export function createTaskScheduler<D extends { key: string | number }, R = any>(
    invoke: (desc: D, abort: (e?: any) => void) => Promise<R>,
    onSuccess: (result: R, desc: D) => void,
    onError: (e: any, desc: D) => void,
    opts = {
        maxConcurrency: 5,
    }
) {
    let autoExcuteNext = true;
    const toDoTaskDescQueue: D[] = [];
    const runningTaskMap = new Map<
        number | string,
        {
            task: ReturnType<typeof createTask>;
            desc: D;
        }
    >();
    const maxConcurrency = opts?.maxConcurrency ?? 5;

    function createTask(desc: D) {
        let abort: (e?: any) => void;
        const key = desc.key;
        const promise = new Promise<R>((resolve, r) => {
            const reject = (...args: any[]) => {
                debugger;
                r(...args);
            };
            abort = (e?: any) => reject(e);
            invoke(desc, abort)
                .then((result) => resolve(result))
                .catch((e) => reject(e));
        });

        promise
            .then((res) => onSuccess(res, desc))
            .catch((e) => onError(e, desc))
            .finally(() => {
                runningTaskMap.delete(key);
                autoExcuteNext && execute();
            });
        return {
            promise,
            abort,
            desc,
        };
    }

    function execute() {
        if (runningTaskMap.size === maxConcurrency) return;
        while (runningTaskMap.size < maxConcurrency && toDoTaskDescQueue.length) {
            const desc = toDoTaskDescQueue.pop();
            const task = createTask(desc);
            runningTaskMap.set(desc.key, { task, desc });
        }
    }

    function addTask(...args: D[]) {
        for (let i = 0; i < args.length; i++) {
            const desc = args[i];
            if (runningTaskMap.has(desc.key)) {
                console.warn(`当前任务正在执行,请勿重复添加`, desc);
                continue;
            }
            const index = toDoTaskDescQueue.findIndex((i) => i === desc);
            if (index !== -1) {
                toDoTaskDescQueue.splice(index, 1);
            }
            toDoTaskDescQueue.unshift(desc);
            execute();
        }
    }

    function updateQueue(filterFn: (runningTask: { desc: D; abort: (e?: any) => void }[], waitingTask: D[]) => D[]) {
        const newTasks = filterFn.call(
            null,
            Array.from(runningTaskMap.values()).map((i) => ({ desc: i.desc, abort: i.task.abort })),
            [...toDoTaskDescQueue]
        );
        for (let item of newTasks) {
            if (runningTaskMap.has(item.key)) {
                console.warn(`当前任务正在执行,请勿重复添加`, item);
            }
        }
        toDoTaskDescQueue.length = 0;
        addTask(...newTasks);
    }

    return {
        addTask,
        removeTask: (desc: D, reason?:any) => {
            const item = runningTaskMap.get(desc.key);
            if (item) {
                item.task.abort(reason);
                runningTaskMap.delete(desc.key);
                autoExcuteNext && execute();
            } else {
                const index = toDoTaskDescQueue.findIndex((i) => i === desc);
                if (index === -1) return;
                toDoTaskDescQueue.splice(index, 1);
            }
        },
        updateQueue,
        setAutoTask: (v: boolean) => {
            autoExcuteNext = v;
            v && execute();
        },
        clearAll: (reason?: any) => {
            Array.from(runningTaskMap.values()).forEach((f) => f.task.abort(reason));
            runningTaskMap.clear();
            toDoTaskDescQueue.length = 0;
        },
    };
}
