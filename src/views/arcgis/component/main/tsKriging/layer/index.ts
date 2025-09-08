import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import Extent from "@arcgis/core/geometry/Extent";
import Polygon from "@arcgis/core/geometry/Polygon";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import * as projection from "@arcgis/core/geometry/projection";
import Layer from "@arcgis/core/layers/Layer";
import BaseLayerViewGL2D from "@arcgis/core/views/2d/layers/BaseLayerViewGL2D";
import { WorkerPathConfig } from "./config";
import { WorkerMethodParam, WorkerMethodResult } from "./global";
import { LRUCache } from "./LRU";
import { calcPointLikesExtent } from "./geometry";
import { Variogram } from "./kriging";
import { doubleToTwoFloats, findIntervalIndexThatValueIn, getTextureUnpackAlign, rafThrottle } from "./misc";
import { getWorkerFeatures, openCustomArcgisWorker } from "./worker";
import { runKrigingInExtent, tessellatePolygons } from "./kriging.worker";
import { clamp, debounce, isNil } from "lodash-es";
import {
    AlphaFormat,
    BufferGeometry,
    CanvasTexture,
    DataTexture,
    EqualStencilFunc,
    Float32BufferAttribute,
    FloatType,
    Matrix3,
    Mesh,
    NearestFilter,
    RedFormat,
    Texture,
    Uint16BufferAttribute,
    Uint32BufferAttribute,
    Uint8BufferAttribute,
} from "three";
import {
    AbortError,
    ColorMappingData,
    ColorMappingTypeCode,
    EnumTaskStatus,
    ILayerIdKey,
    PreloadOpts,
    RenderSamplingCode,
    asyncTaskScheduler,
    getFramePrediction,
    getLayerUID,
    isAbortError,
    resolveViewRenderExtent,
} from "./common";
import { _defaultSphere, buildColorMappingData, freeMemory } from "./three-misc";
import {
    EnumKrigingTextureDataType,
    KrigingOpts,
    KrigingRenderOpts,
    TimeSeriesKrigingSource,
    TsKrigingError,
    checkKrigingSource,
    createKrigingRenderCtx,
} from "./misc";

const ErrorMap = {
    dataSourceChange: AbortError("数据源变更"),
    timeOutOfRange: AbortError("时间超出范围"),
    krigingOptsChange: AbortError("克里金参数变更"),
} as const;
@subclass()
export class TimeSeriesKrigingLayer extends Layer {
    private [ILayerIdKey]: number = getLayerUID();
    private _layerView: CustomLayerView;
    debug: boolean = false;
    preload: PreloadOpts = { frame: 5 };

    constructor(props?: {
        source?: TimeSeriesKrigingSource;
        curTime?: number;
        cacheSize?: number;
        preload?: PreloadOpts;
        effect?: __esri.Effect;
        renderOpts?: Partial<KrigingRenderOpts>;
    }) {
        super();
        Object.assign(this, props);
    }

    @property()
    effect: __esri.Effect;

    @property()
    source: TimeSeriesKrigingSource;

    @property({
        cast: (size: number) => {
            return Math.max(size ?? 64, 5);
        },
    })
    cacheSize: number = 64;

    @property()
    curTime: number; //当前时间

    @property({
        type: KrigingRenderOpts,
    })
    renderOpts: KrigingRenderOpts = new KrigingRenderOpts();

    readyAtTime(t: number) {
        return this._layerView ? this._layerView.readyAtTime(t) : false;
    }

    createLayerView(view: any) {
        if (view.type !== "2d") throw new Error("不支持3d");
        debugger
        const lyView = (this._layerView = new CustomLayerView({
            view: view,
            //@ts-ignore
            layer: this,
        }));
        return Promise.resolve(lyView);
    }
}
const _mat3 = new Matrix3();

@subclass()
class CustomLayerView extends BaseLayerViewGL2D {
    private _handlers = [] as IHandle[];
    private _render: (param: __esri.BaseLayerViewGL2DRenderRenderParameters) => void;
    readyAtTime: (time: number) => boolean;
    async attach() {
        const self = this;
        const layer = self.layer as TimeSeriesKrigingLayer;
        const { _handlers: handlers, context: gl, view } = self;
        const renderCtx = createKrigingRenderCtx(layer, self);
        const debugLog = (...args: any[]) => layer.debug && console.log(...args);
        const krigingWorker = openCustomArcgisWorker(WorkerPathConfig.kriging, { strategy: "distributed" });

        const useLocal = true;
        type KrigingFn = typeof runKrigingInExtent;
        type KrigingParam = WorkerMethodParam<KrigingFn>;
        type TessFn = typeof tessellatePolygons;
        type TessParam = WorkerMethodParam<TessFn>;
        const worker = useLocal
            ? {
                runKrigingInExtent: async (opts: KrigingParam) => runKrigingInExtent(opts).result,
                tessellatePolygons: async (opts: TessParam) => (await tessellatePolygons(opts)).result,
            }
            : {
                runKrigingInExtent(opts: KrigingParam) {
                    return krigingWorker.invoke<KrigingFn>("runKrigingInExtent", opts);
                },
                tessellatePolygons: async (opts: TessParam) => {
                    return krigingWorker.invoke<TessFn>("tessellatePolygons", opts);
                },
            };
        const requestRender = () => {
            if (!layer.visible) return;
            self.requestRender();
        };
        //色带
        const colorMappingCtx = (() => {
            let colorMappingData: ColorMappingData;
            const off = reactiveUtils.watch(
                () => layer.renderOpts?.colorMapping,
                (c) => {
                    if (colorMappingData) {
                        colorMappingData.texture.dispose();
                        colorMappingData = null;
                    }
                    if (!c) return;
                    if (c.type === "gradient" && !c.valueRange) {
                        throw TsKrigingError("色带为gradient时,必须指定映射范围valueRange");
                    }
                    buildColorMappingData(c).then((res) => {
                        if (c !== layer.renderOpts?.colorMapping) return;
                        colorMappingData = res;
                        requestRender();
                    });
                },
                { initial: true }
            );
            return {
                ready: () => {
                    return !!colorMappingData;
                },
                destroy: () => {
                    off.remove();
                    if (colorMappingData) {
                        colorMappingData.texture.dispose();
                        colorMappingData = null;
                    }
                },
                getColorTexture() {
                    return colorMappingData;
                },
            };
        })();

        function warnClip() {
            const clipExtent = clipCtx.getClipData().extent;
            const renderExtent = dataCtx.getRenderExtent();
            if (clipExtent && !clipExtent.intersects(renderExtent)) {
                console.warn("指定了裁剪范围, 但与渲染范围不相交, 裁剪被忽略");
            }
        }
        //裁剪
        const clipCtx = (() => {
            //裁剪
            let mesh: Mesh;
            let extent: __esri.Extent;
            let polygons: TimeSeriesKrigingLayer["renderOpts"]["clipPolygon"];
            let useClip: boolean;
            function disposeClipMesh() {
                mesh?.geometry?.dispose();
                mesh = null;
                extent = null;
            }
            const off = reactiveUtils.watch(
                () => [layer.renderOpts?.clipPolygon, layer.renderOpts?.useClip] as const,
                (newOpts) => {
                    requestRender();
                    useClip = newOpts[1] ?? true;
                    if (!useClip) return;
                    const newClipPolygons = newOpts[0];
                    if (polygons === newClipPolygons) return;
                    disposeClipMesh();
                    const clips = ([] as Polygon[]).concat(newClipPolygons).filter(Boolean);
                    if (!clips.length) return;
                    polygons = newClipPolygons;
                    worker
                        .tessellatePolygons({
                            polygons: clips.map((item) => {
                                return {
                                    type: "polygon",
                                    rings: item.rings,
                                    spatialReference:
                                        item.spatialReference instanceof SpatialReference
                                            ? item.spatialReference.toJSON()
                                            : item.spatialReference,
                                };
                            }),
                            sr: view.spatialReference.toJSON(),
                            convertDouble: true,
                        })
                        .then((result) => {
                            if (polygons !== newClipPolygons) return;
                            warnClip();
                            mesh = new Mesh(
                                new BufferGeometry()
                                    .setAttribute(
                                        "positionHigh",
                                        freeMemory(new Float32BufferAttribute(result.verticesHigh, 2))
                                    )
                                    .setAttribute(
                                        "positionLow",
                                        freeMemory(new Float32BufferAttribute(result.verticesLow, 2))
                                    )
                                    .setIndex(
                                        freeMemory(
                                            result.indices instanceof Uint8Array
                                                ? new Uint8BufferAttribute(result.indices, 1)
                                                : result.indices instanceof Uint16Array
                                                    ? new Uint16BufferAttribute(result.indices, 1)
                                                    : new Uint32BufferAttribute(result.indices, 1)
                                        )
                                    ),
                                renderCtx.clipMaterial
                            );
                            mesh.geometry.boundingSphere = _defaultSphere;
                            mesh.frustumCulled = false;
                            extent = new Extent({ ...result.extent, spatialReference: view.spatialReference.toJSON() });
                            requestRender();
                        });
                },
                { initial: true }
            );
            return {
                destroy: () => {
                    off.remove();
                    polygons = null;
                    disposeClipMesh();
                },
                getClipData: () => {
                    return { useClip, mesh, extent };
                },
            };
        })();

        //data
        const dataCtx = (() => {
            type TimeRecord = {
                key: number; // 等于时间
                time: number;
                status: EnumTaskStatus; //状态
                isAllZero?: boolean;
            };
            let off: () => void;
            let ready = false;
            let maxConcurrency: number;
            let dataSource: ReturnType<typeof createDataSource>;

            function createDataSource(sourceOpts: TimeSeriesKrigingLayer["source"]) {
                const { dataGetter, times, minTime, maxTime, isSingle } = checkKrigingSource(sourceOpts);
                if (isNil(layer.curTime) || isNaN(layer.curTime)) {
                    layer.curTime = minTime;
                }
                const { xs, ys, extent } = resolvePoints(sourceOpts.points, sourceOpts.spatialReference);
                let kriging = resolveKrigingOpts(layer.renderOpts?.krigingOpts);
                //模型训练参数
                const variogramMap = new Map() as Map<
                    number /* time */,
                    {
                        variogram: Variogram;
                        cellSize: number;
                        llCorner: number[];
                        gridSize: number[];
                    }
                    >;

                const allZeroTimes = new Set<number>();
                const recordMap = new Map<number /*time*/, TimeRecord>();
                const cache = new LRUCache<
                    {
                        tex: Texture;
                        imagebitmap?: ImageBitmap;
                        valueRange?: number[];
                    },
                    number
                    >(layer.cacheSize ?? 64, {
                    onRemove: (item, time, reason) => {
                        debugLog(reason, `delete at time:[${time}]`);
                        recordMap.delete(time);
                        item.tex.dispose();
                        item.imagebitmap?.close?.();
                    },
                });
                function getRecord(time: number) {
                    let item = recordMap.get(time);
                    if (!item) {
                        item = {
                            time,
                            key: time,
                            status: EnumTaskStatus.none,
                            isAllZero: null,
                        };
                        recordMap.set(time, item);
                    }
                    return item;
                }
                type R = WorkerMethodResult<KrigingFn>;
                const scheduler = asyncTaskScheduler<TimeRecord, R>({
                    invoke(record) {
                        record.status = EnumTaskStatus.pending;
                        if (allZeroTimes.has(record.time)) {
                            return Promise.resolve(null);
                        }
                        let cancel: (e: any) => void;
                        const promise = new Promise<R>(async (resolve, reject) => {
                            cancel = (e) => reject(e);
                            const pointValues = await dataGetter(record.time);
                            let allZero = true;
                            for (let i = pointValues.length; i--; ) {
                                if (pointValues[i] !== 0) {
                                    allZero = false;
                                    break;
                                }
                            }
                            if (allZero) {
                                resolve(null);
                            } else {
                                const variogramCache = variogramMap.get(record.time);
                                const result = await worker.runKrigingInExtent(
                                    variogramCache || {
                                        trainOpts: {
                                            x: xs,
                                            y: ys,
                                            value: pointValues,
                                            model: kriging.model,
                                            sigma2: kriging.sigma2,
                                            alpha: kriging.alpha,
                                        },
                                        cellSize: kriging.cellSize,
                                        llCorner: kriging.llCorner,
                                        gridSize: kriging.gridSize,
                                    }
                                );
                                resolve(result);
                            }
                        });
                        return { promise, cancel };
                    },
                    onSuccess(result, record) {
                        requestRender();
                        if (!result) {
                            debugLog(`data at time:[${record.time}] is all zero`);
                            record.isAllZero = true;
                            record.status = EnumTaskStatus.finish;
                            return;
                        }
                        if (!variogramMap.has(record.time)) {
                            variogramMap.set(record.time, result.variogramCache);
                        }
                        debugLog(
                            `loaded:`,
                            `time:[${record.time}]`,
                            `size:[${result.cols}x${result.rows}]`,
                            `train:[${result.trainTime.toFixed(1)}]ms`,
                            `gen:[${result.gridTime.toFixed(1)}]ms`
                        );
                        let tex: Texture;
                        if (result.type === "imagebitmap") {
                            tex = new CanvasTexture(result.data);
                            tex.minFilter = tex.magFilter = NearestFilter;
                            cache.add(record.time, {
                                tex,
                                valueRange: result.valueRange,
                                imagebitmap: result.data,
                            });
                        } else {
                            tex = new DataTexture();
                            tex.format = renderCtx.isWebgl2 ? RedFormat : AlphaFormat;
                            tex.type = FloatType;
                            tex.minFilter = tex.magFilter = NearestFilter;
                            tex.unpackAlignment = kriging.unpackAlignment;
                            tex.image = {
                                //@ts-ignore
                                data: result.data,
                                width: result.cols,
                                height: result.rows,
                            };
                            cache.add(record.time, {
                                tex,
                            });
                        }
                        //webgl1 imagebitmap, flipY设置无效
                        //为保持一致, 均不翻转, 在shader中手动翻转
                        tex.flipY = false;
                        tex.needsUpdate = true;

                        record.isAllZero = false;
                        record.status = EnumTaskStatus.finish;
                    },
                    onError(error, record) {
                        if (isAbortError(error)) {
                            recordMap.delete(record.key);
                            return;
                        }
                        record.status = EnumTaskStatus.error;
                        debugLog(`load at time:[${record.time}] fail\n`, error);
                    },
                    maxConcurrency,
                });
                const { getTimeState, handleTimeChange, schuduleFetch } = (() => {
                    let curTime = NaN,
                        beforeIndex = NaN,
                        afterIndex = NaN,
                        taskTimeArr: number[];
                    const handleTimeChange = () => {
                        if (isNaN(layer.curTime) || isNil(layer.curTime)) {
                            curTime = beforeIndex = afterIndex = NaN;
                            taskTimeArr = null;
                            return;
                        }
                        curTime = clamp(layer.curTime, minTime, maxTime);
                        let timeIndexSet: Set<number>;
                        if (isSingle) {
                            beforeIndex = afterIndex = 0;
                            timeIndexSet = new Set([0]);
                        } else {
                            const result = getFramePrediction({
                                times,
                                curTime: curTime,
                                preload: layer.preload,
                            });
                            beforeIndex = result.beforeIndex;
                            afterIndex = result.afterIndex;
                            timeIndexSet = result.timeIndexSet;
                        }
                        taskTimeArr = Array.from(timeIndexSet)
                            .map((index) => times[index])
                            .sort((a, b) => b - a);
                        schuduleFetch();
                    };
                    const schuduleFetch = rafThrottle(() => {
                        if (!taskTimeArr?.length) return;
                        scheduler.updateQueue((running) => {
                            running.forEach(({ desc, cancel }) => {
                                if (taskTimeArr.indexOf(desc.time) === -1) {
                                    cancel && cancel(ErrorMap.timeOutOfRange);
                                }
                            });
                            const allTask = taskTimeArr.map((time) => getRecord(time));
                            return allTask.filter((record) => record.status === EnumTaskStatus.none);
                        });
                    });
                    return {
                        handleTimeChange,
                        schuduleFetch,
                        getTimeState() {
                            const beforeTime = times[beforeIndex];
                            const afterTime = times[afterIndex];
                            return {
                                curTime,
                                beforeIndex,
                                afterIndex,
                                beforeTime,
                                afterTime,
                                percent: isSingle ? 0 : (curTime - beforeTime) / (afterTime - beforeTime),
                            };
                        },
                    };
                })();
                const clearData = (reason: any) => {
                    renderData = null;
                    variogramMap.clear();
                    //移除所有进行中和待做的任务
                    scheduler.clear(reason);
                    //清除缓存
                    cache.clear(reason);
                    //清理记录
                    times.forEach((time) => {
                        const record = recordMap.get(time);
                        if (!record) return;
                        if (record.isAllZero === true) return; //保留空记录
                        recordMap.delete(time);
                    });
                };
                let renderData: {
                    time: number;
                    data1: {
                        tex: Texture;
                        valueRange?: number[];
                    };
                    data2: {
                        tex: Texture;
                        valueRange?: number[];
                    };
                    percent: number;
                    kriging: ReturnType<typeof resolveKrigingOpts>;
                    dataExtent: __esri.Extent;
                };
                function computedRenderData() {
                    const timeState = getTimeState();
                    if (!timeState) {
                        renderData = null;
                        return;
                    }
                    if (renderData && renderData.time === timeState.curTime) return; //no need update
                    const { beforeTime, afterTime, percent, curTime } = timeState;
                    const r1 = getRecord(beforeTime),
                        r2 = getRecord(afterTime);
                    const ready1 = r1.status === EnumTaskStatus.finish;
                    const ready2 = r2.status === EnumTaskStatus.finish;
                    if (!ready1 || !ready2) {
                        renderData = null;
                        return;
                    }
                    const EPSILON = 0.01;
                    const data1 = r1.isAllZero ? null : cache.get(r1.time);
                    const data2 = r2.isAllZero ? null : cache.get(r2.time);
                    if (data1 && data2) {
                        renderData = {
                            time: curTime,
                            data1,
                            data2,
                            percent,
                            kriging,
                            dataExtent: kriging.extent,
                        };
                    } else {
                        if (data2 && 1 - percent <= EPSILON) {
                            renderData = {
                                time: curTime,
                                data1: null,
                                data2,
                                percent: 1,
                                kriging,
                                dataExtent: kriging.extent,
                            };
                        } else if (data1 && percent <= EPSILON) {
                            renderData = {
                                time: curTime,
                                data1,
                                data2: null,
                                percent: 0,
                                kriging,
                                dataExtent: kriging.extent,
                            };
                        } else {
                            renderData = null;
                        }
                    }
                }
                //
                let stopHandle: () => void;
                const stop = () => {
                    stopHandle?.();
                    stopHandle = null;
                };
                let isFirstFrame = true;
                const ensureRender = () => (isFirstFrame = false);
                return {
                    start: () => {
                        const watchSize = reactiveUtils.watch(
                            () => layer.cacheSize,
                            (size) => cache.resize(size)
                        );
                        const watchKriging = reactiveUtils.watch(
                            () => layer.renderOpts?.krigingOpts,
                            debounce(
                                (v: KrigingOpts) => {
                                    clearData(ErrorMap.krigingOptsChange);
                                    kriging = resolveKrigingOpts(v);
                                    isFirstFrame = true;
                                    schuduleFetch();
                                },
                                500,
                                { leading: false, trailing: true }
                            )
                        );
                        const watchRenderSampling = reactiveUtils.watch(
                            () => layer.renderOpts?.renderSampling,
                            requestRender
                        );
                        const watchTime = isSingle
                            ? null
                            : reactiveUtils.watch(
                                () => layer.curTime,
                                () => {
                                    handleTimeChange();
                                    requestRender();
                                }
                            );
                        stopHandle = () => {
                            watchRenderSampling.remove();
                            watchSize.remove();
                            watchKriging.remove();
                            watchTime && watchTime.remove();
                        };
                        handleTimeChange();
                    },
                    stop,
                    destroy: () => {
                        stop();
                        clearData(ErrorMap.dataSourceChange);
                    },
                    getRenderExtent: () => {
                        return kriging?.extent;
                    },
                    getRenderData: () => {
                        computedRenderData();
                        return { ...renderData, isFirstFrame, ensureRender };
                    },
                    readyAtTime: (t: number) => {
                        t = clamp(t, minTime, maxTime);
                        const [beforeIndex, afterIndex] = findIntervalIndexThatValueIn(times, t);
                        const beforeTime = times[beforeIndex],
                            afterTime = times[afterIndex];
                        const tex1Ready = getRecord(beforeTime)?.status === EnumTaskStatus.finish;
                        const tex2Ready = getRecord(afterTime)?.status === EnumTaskStatus.finish;
                        return tex1Ready && tex2Ready;
                    },
                };
                function resolvePoints(points: TimeSeriesKrigingSource["points"], crs: __esri.SpatialReference) {
                    let _points = points;
                    if (!view.spatialReference.equals(crs)) {
                        _points = points.map(
                            (p) =>
                                projection.project(
                                    {
                                        type: "point",
                                        x: p.x,
                                        y: p.y,
                                        spatialReference: crs,
                                    } as __esri.Point,
                                    view.spatialReference
                                ) as __esri.Point
                        );
                    }
                    return {
                        xs: _points.map((p) => p.x),
                        ys: _points.map((p) => p.y),
                        extent: new Extent({
                            ...calcPointLikesExtent(_points),
                            spatialReference: view.spatialReference.toJSON(),
                        }),
                    };
                }
                function resolveKrigingOpts(opts: KrigingOpts) {
                    const model = opts?.model ?? "exponential";
                    const sigma2 = opts?.sigma2 ?? 0;
                    const alpha = opts?.alpha ?? 100;

                    let gridExtent: __esri.Extent;
                    if (opts?.gridExtent) {
                        if (!view.spatialReference.equals(opts.gridExtent.spatialReference)) {
                            gridExtent = projection.project(opts.gridExtent, view.spatialReference) as Extent;
                        } else {
                            gridExtent =
                                opts.gridExtent instanceof Extent ? opts.gridExtent : new Extent(opts.gridExtent);
                        }
                    } else {
                        gridExtent = extent.clone().expand(1.5);
                    }
                    const splitCount = opts?.splitCount || 100;
                    const cellSize = Math.min(gridExtent.width, gridExtent.height) / splitCount;
                    const cols = Math.ceil(gridExtent.width / cellSize);
                    const rows = Math.ceil(gridExtent.height / cellSize);
                    const { xmin, ymin } = gridExtent;
                    const xmax = xmin + cols * cellSize;
                    const ymax = ymin + rows * cellSize;
                    return {
                        model,
                        sigma2,
                        alpha,
                        cellSize: cellSize,
                        llCorner: [xmin, ymin],
                        gridSize: [cols, rows],
                        extent: new Extent({
                            xmin,
                            ymin,
                            xmax,
                            ymax,
                            spatialReference: view.spatialReference,
                        }),
                        unpackAlignment: getTextureUnpackAlign(cols),
                    };
                }
            }
            async function init() {
                await projection.load();
                const { workerCount } = await getWorkerFeatures();
                maxConcurrency = workerCount;
                ready = true;
                const { remove } = reactiveUtils.watch(
                    () => layer.source,
                    (newSource) => {
                        if (dataSource) {
                            dataSource.destroy();
                            dataSource = null;
                        }
                        if (newSource) {
                            dataSource = createDataSource(newSource);
                            dataSource.start();
                            warnClip();
                        }
                    },
                    { initial: true }
                );
                off = () => {
                    remove();
                };
            }
            init();
            return {
                ready: () => ready,
                getRenderExtent() {
                    return dataSource?.getRenderExtent?.();
                },
                getRenderData() {
                    if (!dataSource) return null;
                    return dataSource.getRenderData();
                },
                readyAtTime(time: number) {
                    return dataSource ? dataSource.readyAtTime(time) : false;
                },
                destroy: () => {
                    dataSource?.destroy?.();
                    off();
                    off = null;
                },
            };
        })();

        let needUpdatePosition = true;
        handlers.push(
            reactiveUtils.watch(
                () => view.extent,
                () => (needUpdatePosition = true)
            )
        );

        self.readyAtTime = (t: number) => dataCtx.readyAtTime(t);

        self._render = ({ state }: __esri.BaseLayerViewGL2DRenderRenderParameters) => {
            if (!dataCtx.ready() || !colorMappingCtx.ready()) return;
            const renderData = dataCtx.getRenderData();
            if (!renderData) return;
            const { useClip, mesh: clipMesh, extent: clipExtent } = clipCtx.getClipData();
            const { kriging, data1, data2, percent, isFirstFrame, ensureRender, dataExtent } = renderData;
            const viewRenderExtent = resolveViewRenderExtent(view);
            if (!viewRenderExtent.intersects(dataExtent)) return;
            if (useClip && isFirstFrame && !clipMesh) return;
            const { renderer, uniform, mesh, material, camera, clipUniform, rt, copyUniforms, copyMesh } = renderCtx;
            if (!setupColorMapping()) return;
            const { framebuffer, viewport } = self.getRenderTarget();

            renderer.resetState();
            if (useClip && clipMesh && dataExtent.intersects(clipExtent)) {
                rt.setSize(viewport[2] - viewport[0], viewport[3] - viewport[1]);
                renderer.setRenderTarget(rt);
                renderer.setClearColor("black", 0);
                renderer.clear(true, true, true);

                //draw clip stencil
                updateClipParams();
                renderer.render(clipMesh, camera);

                //draw
                updateRenderParams();
                updatePosition();
                material.stencilWrite = true;
                material.stencilRef = 1;
                material.stencilFunc = EqualStencilFunc;
                renderer.render(mesh, camera);

                renderer.state.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                renderer.setViewport(viewport[0], viewport[1], viewport[2], viewport[3]);
                copyUniforms.map.value = rt.texture;
                renderer.render(copyMesh, camera);
            } else {
                renderer.state.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                renderer.setViewport(viewport[0], viewport[1], viewport[2], viewport[3]);

                updateRenderParams();
                updatePosition();
                material.stencilWrite = false;
                renderer.render(mesh, camera);
            }
            ensureRender();

            function updateRenderParams() {
                const { uniform } = renderCtx;
                const resolution = state.resolution;
                uniform.u_renderSize.value.set(dataExtent.width / resolution, dataExtent.height / resolution);
                uniform.u_texSize.value.set(kriging.gridSize[0], kriging.gridSize[1]);
                uniform.u_percent.value = percent;
                setTexture(data1, true);
                setTexture(data2, false);

                function setTexture(
                    data: {
                        tex: Texture;
                        valueRange?: number[];
                    },
                    isBefore: boolean
                ) {
                    const u_tex = (isBefore ? uniform.u_before : uniform.u_after).value;
                    if (!data) {
                        u_tex.map = null;
                        u_tex.zeroFlag = true;
                    } else {
                        u_tex.map = data.tex;
                        u_tex.zeroFlag = false;
                        if (data.tex instanceof CanvasTexture) {
                            u_tex.type = EnumKrigingTextureDataType.TEX_IMAGEBITMAP;
                            u_tex.decodeValueRange.set(data.valueRange[0], data.valueRange[1]);
                        } else {
                            u_tex.type = EnumKrigingTextureDataType.TEX_ARRAYBUFFER;
                            u_tex.decodeValueRange.set(NaN, NaN);
                        }
                    }
                }
            }
            function updatePosition() {
                if (!needUpdatePosition) return;
                const mesh = renderCtx.mesh;
                const { xmin, ymin, xmax, ymax } = dataExtent;
                const position = [
                    [xmin, ymin],
                    [xmax, ymin],
                    [xmax, ymax],
                    [xmin, ymax],
                ]
                    .map((p) => {
                        let [x, y] = state.toScreen([], p[0], p[1]);
                        const ndcX = (x / viewport[2]) * 2 - 1;
                        const ndcY = (y / viewport[3]) * -2 + 1;
                        return [ndcX, ndcY, 0];
                    })
                    .flat();
                const attr = mesh.geometry.getAttribute("position") as Float32BufferAttribute;
                attr.set(position);
                attr.needsUpdate = true;
                needUpdatePosition = false;
            }
            function updateClipParams() {
                const rotate = -(Math.PI * state.rotation) / 180;
                const [cx, cy] = state.center;
                const [hx, lx] = doubleToTwoFloats(cx);
                const [hy, ly] = doubleToTwoFloats(cy);
                clipUniform.u_center.value.set(hx, hy, lx, ly);
                clipUniform.u_display.value
                    .identity()
                    .premultiply(_mat3.identity().scale(1 / state.resolution, -1 / state.resolution))
                    .premultiply(_mat3.identity().rotate(rotate))
                    .premultiply(_mat3.identity().translate(state.size[0] / 2, state.size[1] / 2))
                    .premultiply(_mat3.identity().scale(2 / state.size[0], -2 / state.size[1]))
                    .premultiply(_mat3.identity().translate(-1, 1));
            }
            //设置色带
            function setupColorMapping() {
                const colorMappingData = colorMappingCtx.getColorTexture();
                const uColorMapping = uniform.u_colorMapping.value;
                uColorMapping.texture = colorMappingData.texture;
                uColorMapping.type = ColorMappingTypeCode[colorMappingData.type];
                uColorMapping.renderSampling =
                    RenderSamplingCode[layer.renderOpts?.renderSampling] || RenderSamplingCode.linear;
                if (colorMappingData.type === "gradient") {
                    const range = colorMappingData.valueRange;
                    if (!range) return false;
                    uColorMapping.valueRange.set(range[0], range[1]);
                } else if (colorMappingData.type === "class-break") {
                    if (colorMappingData.breaks !== +material.defines["CLASS_BREAK_COUNT"]) {
                        material.defines["CLASS_BREAK_COUNT"] = colorMappingData.breaks.toFixed(1);
                        material.needsUpdate = true;
                    }
                    uColorMapping.trunc.set(colorMappingData.trunc[0] ? 1 : 0, colorMappingData.trunc[1] ? 1 : 0);
                }
                return true;
            }
        };

        handlers.push({
            remove: () => {
                krigingWorker.destroy();
                clipCtx.destroy();
                dataCtx.destroy();
                colorMappingCtx.destroy();
                renderCtx.destroy();
            },
        });
    }

    render(renderParameters: __esri.BaseLayerViewGL2DRenderRenderParameters): void {
        this._render?.(renderParameters);
    }

    detach(): void {
        this._handlers.forEach((f) => f.remove());
        this._handlers.length = 0;
    }
}
