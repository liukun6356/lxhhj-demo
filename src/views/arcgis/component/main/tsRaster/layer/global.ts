export type PartialOptional<T extends any, OptionalKey extends keyof T> = Pick<T, Exclude<keyof T, OptionalKey>> &
    Partial<Pick<T, OptionalKey>>;

export type WorkerMethodParam<T> = T extends (arg: infer P, ...others: any[]) => any ? P : never;

export type PromiseResult<T extends (...args: any[]) => any, R = ReturnType<T>> = R extends Promise<infer U> ? U : R;

export type WorkerMethodResult<T extends (...args: any[]) => any, R = ReturnType<T>> = R extends Promise<infer U>
    ? U extends { result: any }
        ? U["result"]
        : U
    : R extends { result: any }
        ? R["result"]
        : R;

export type TransferResult<T> = { result: T; transferList?: Transferable[] };

export type ArrayItemType<T> = T extends (infer P)[] ? P : never;

export type TypedArray =
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array;

export type Constructor<T> = new (...args: any[]) => T;
