type Coord = number[];
interface ExtentLike {
    xmin: number,
    ymin: number,
    xmax: number,
    ymax: number
}
type HasKey = 'debug-reproj-tile'
    | 'reproj-worker-local'


declare var esriConfig: {
    has: Partial<Record<HasKey, any>>
};
declare module '@arcgis/core/core/has' {
    const has: (feature: HasKey) => any;
    export default has;
}


type PickResult<T> = T extends { result: infer R } ? R : T;
type WorkerMethodParam<T> = T extends (arg: infer P, ...others: any[]) => any ? P : never;
type WorkerMethodResult<T extends (...args: any[]) => any, R = ReturnType<T>> = R extends Promise<infer U>
    ? PickResult<U>
    : PickResult<R>

type AbortFn = (reason?: any) => void;
