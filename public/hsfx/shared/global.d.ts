type MaybeArray<T> = T | T[];
type MaybePromise<T> = T | Promise<T>;
type PromiseResult<T extends (...args: any[]) => any, R = ReturnType<T>> = R extends Promise<infer U> ? U : R;
type Constructor<T> = new (...args: any[]) => T;
type MapValueType<T> = T extends Map<any, infer V> ? V : never;
type MapKeyType<T> = T extends Map<infer K, any> ? K : never;
type ArrayItemType<T> = T extends (infer P)[] ? P : never;

type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float16Array
    | Float32Array
    | Float64Array;
type TypedArrayConstructor =
    | Int8ArrayConstructor
    | Uint8ArrayConstructor
    | Uint8ClampedArrayConstructor
    | Int16ArrayConstructor
    | Uint16ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor
    | Float16ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor;
type TypedArrayName =
    | 'Int8Array'
    | 'Uint8Array'
    | 'Int16Array'
    | 'Uint16Array'
    | 'Int32Array'
    | 'Uint32Array'
    | 'Uint8ClampedArray'
    | 'Float16Array'
    | 'Float32Array'
    | 'Float64Array';