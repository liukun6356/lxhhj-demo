export type WorkerMethodParam<T> = T extends (arg: infer P, ...others: any[]) => any ? P : never;
export type WorkerMethodResult<T extends (...args: any[]) => any, R = ReturnType<T>> = R extends Promise<infer U>
    ? U extends { result: any }
        ? U["result"]
        : U
    : R extends { result: any }
        ? R["result"]
        : R;
