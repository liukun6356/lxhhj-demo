import {WorkerPathConfig, workerFeatureDetect} from "./config";
import {WorkerMethodParam, WorkerMethodResult} from "./global"
import { open } from "@arcgis/core/core/workers";
import config from "@arcgis/core/config";

export const getWorkerFeatures = /*@__PURE__*/ (() => {
    let feature: Promise<ReturnType<typeof workerFeatureDetect> & { workerCount: number }>;
    return () => {
        if (!feature) {
            feature = new Promise(async (resolve) => {
                const worker = openCustomArcgisWorker(WorkerPathConfig.misc, {strategy: "distributed"});
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
