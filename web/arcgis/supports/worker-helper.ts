import config from "@arcgis/core/config";
import { open } from "@arcgis/core/core/workers";
import { createIdGenerator } from "web/utils/misc";
export function openArcgisWorker(opts?: __esri.workersOpenOptions) {
    const workerRoot = new URL(config.workers.workerPath, location.href).href;
    const workerPath = new URL("CustomWorker.js", workerRoot).href;
    let connection: __esri.Connection;
    let _promise: Promise<any>;
    let _destroyed = false;
    const getConnection = () => {
        return (_promise ??= open(workerPath, opts)
            .then(c => _destroyed ? c.close() : (connection = c)));
    }

    const destroy = () => {
        if (_destroyed) return;
        _destroyed = true;
        connection && connection.close();
    };

    return {
        invoke: <T extends (...args: any[]) => any, P = WorkerMethodParam<T>, R = WorkerMethodResult<T>>(
            methodName: string,
            params?: P,
            options?: __esri.ConnectionInvokeOptions
        ): Promise<R> => {
            if (_destroyed) return;
            return getConnection().then(() => connection.invoke(methodName, params, options));
        },
        broadcast: <T extends (...args: any[]) => any, P = WorkerMethodParam<T>, R = WorkerMethodResult<T>>(
            methodName: string,
            params?: P,
            options?: __esri.ConnectionBroadcastOptions
        ) => {
            if (_destroyed) return;
            return getConnection().then(() => connection.broadcast(methodName, params, options) as Promise<R>[]);
        },
        destroy,
    };
}

type WrapPortAPI<T extends Record<string, (...args: any[]) => any>> = {
    [K in keyof T]: T[K] extends (arg?: infer A) => infer R
    ? (arg?: A, opts?: __esri.ConnectionInvokeOptions) => R extends Promise<any> ? PickResult<R> : Promise<PickResult<R>>
    : never;
};


//只能调用对面的api方法
export function wrapMessagePort<
    RemoteAPI extends Record<string, (arg: any) => any>, //远端api
    SelfAPI extends Record<string, (arg: any) => any> = {}, //己端api
>(
    port: MessagePort,
    selfAPI: SelfAPI,
    remoteAPIKeys: (keyof RemoteAPI)[],
) {
    const uuid = createIdGenerator(1);
    const taskMap = new Map<number, {
        resolve: (result?: any) => void,
        reject: (reason?: any) => void,
    }>();
    type InvokeMsg = { taskId: number, type: 'invoke', method: string, params: any };
    type ResultMsg = { taskId: number, type: "result", data: any };
    port.onmessage = (e) => {
        const msg = e.data as InvokeMsg | ResultMsg;
        if (msg.type === 'result') {
            const taskId = msg.taskId;
            if (!taskId) return;
            const task = taskMap.get(taskId);
            if (!task) return;
            const result = msg.data;
            const { resolve, reject } = task;
            result instanceof Error ? reject(result) : resolve(result);
        } else {
            const { params, method, taskId } = msg;
            if (!selfAPI?.[method] || typeof selfAPI[method] !== 'function') {
                return port.postMessage({
                    taskId,
                    type: 'result',
                    data: new Error(`方法: ${method} 不存在`)
                });
            }
            invokeMethod(selfAPI[method], params)
                .catch(e => e)
                .then(obj => {
                    if (obj && typeof obj === 'object' && 'transferList' in obj) {
                        port.postMessage({
                            taskId,
                            type: 'result',
                            data: (obj as any)?.result
                        }, obj.transferList);
                    } else {
                        port.postMessage({
                            taskId,
                            type: 'result',
                            data: obj
                        });
                    }
                });
        }
    };

    const ApiHandle = {} as any;
    for (let key of remoteAPIKeys) {
        ApiHandle[key] = (arg: any, opts?: any) => {
            const { promise, resolve, reject } = Promise.withResolvers();
            const taskId = uuid();
            taskMap.set(taskId, { resolve, reject });
            promise.finally(() => taskMap.delete(taskId));
            if (opts?.signal) {
                opts.signal.addEventListener('abort', () => reject(opts.signal.reason));
            }
            port.postMessage({
                taskId,
                type: "invoke",
                method: key,
                params: arg
            });
            return promise;
        }
    }

    return ApiHandle as WrapPortAPI<RemoteAPI>;
}

function invokeMethod(fn: Function, params: any) {
    const { promise, resolve, reject } = Promise.withResolvers();
    try {
        const returnVal = fn.call(null, params);
        if (returnVal instanceof Promise) {
            returnVal.then(resolve).catch(reject);
        } else {
            if (returnVal instanceof Error) {
                const error = new Error(returnVal.message);
                error.name = returnVal.name;
                reject(error);
            } else {
                resolve(returnVal)
            }
        }
    } catch (e: any) {
        if (e instanceof Error) {
            const error = new Error(e.message);
            error.name = e.name;
            reject(error);
        } else {
            reject(new Error(
                typeof e === 'string' || typeof e === 'number'
                    ? e + ''
                    : Object.prototype.toString.call(e)
            ))
        }
    }
    return promise;
}
