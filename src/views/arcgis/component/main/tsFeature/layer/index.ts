import Graphic from "@arcgis/core/Graphic";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import Extent from "@arcgis/core/geometry/Extent";
import Layer from "@arcgis/core/layers/Layer";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import BaseLayerViewGL2D from "@arcgis/core/views/2d/layers/BaseLayerViewGL2D";
import { WorkerPathConfig } from "./config";
import { ArrayItemType, PromiseResult, WorkerMethodParam } from "./global";
import { LRUCache } from "./LRU";
import { isExtentIntersect, pointInExtent } from "./geometry";
import {
    calcDataTexSize,
    diffAscArrays,
    findIntervalIndexThatValueIn,
    getTextureUnpackAlign,
    rafThrottle,
} from "./misc";
import { createVTileTreeWithScheme, getTileId } from "./tile";
import { openCustomArcgisWorker } from "./worker";
import { createStore, disposeStore, getTileRenderData, hitTest } from "./vt.worker";
import { clamp, isNaN, isNil, throttle } from "lodash-es";
import {
    DataTexture,
    FloatType,
    Matrix3,
    Mesh,
    RGBAFormat,
    Sphere,
} from "three";
import {
    AbortError,
    ClassBreakColorMappingData,
    ColorMappingTypeCode,
    EnumTaskStatus,
    GradientColorMappingData,
    ILayerIdKey,
    PreloadOpts,
    asyncTaskScheduler,
    getFramePrediction,
    getLayerUID,
    isAbortError,
} from "./common";
import { attachRenderer, buildColorMappingData, detachRenderer, freeMemory } from "./three-misc";
import {
    GraphicProps,
    DefaultStyle,
    FeatureRenderOpts,
    FeatureTimeDataGetter,
    PointStyle,
    PointStyleCode,
    TsFeatureError,
    buildIndexAndStat,
    buildStyleIndex,
    buildTileMesh,
    checkTimeFeatureSource,
    createTsFeatureRenderer,
    encodeStyleData,
} from "./typeMisc";
const _sphere = new Sphere();
const _mat3 = new Matrix3();

const ReasonMap = {
    dataSourceChange: AbortError("数据源变更"),
    timeOutOfRange: AbortError("时间超出范围"),
} as const;
@subclass()
class CustomLayerView extends BaseLayerViewGL2D {
    private _handlers: IHandle[] = [];
    private _render: (param: __esri.BaseLayerViewGL2DRenderRenderParameters) => void;
    private _hitTest: (mapPoint: __esri.Point, screenPoint: __esri.BaseLayerViewGL2DScreenPoint) => Promise<any>;
    readyAtTime: (time: number) => boolean;
    private _tilesVersion = 0;
    tilesChanged(): void {
        this._tilesVersion++;
    }
    attach() {
        const self = this;
        const layer = this.layer as TimeSeriesFeatureLayer;
        const { _handlers: handlers, context: gl, view } = this;

        const layerLog = (...args: any[]) => layer.debug && console.log.call(null, ...args);
        const worker = openCustomArcgisWorker(WorkerPathConfig.vectorTile, { strategy: "dedicated" });
        const useLocal = true; //同步脚步调试
        type C = WorkerMethodParam<typeof createStore>;
        type G = WorkerMethodParam<typeof getTileRenderData>;
        type H = WorkerMethodParam<typeof hitTest>;
        type O = __esri.ConnectionInvokeOptions;
        const workMethods = useLocal
            ? {
                createStore: async (params: C, options?: O) => createStore(params),
                getTileRenderData: async (params: G, options?: O) => getTileRenderData(params)?.result,
                disposeStore: (storeId: string, options?: O) => disposeStore(storeId),
                hitTest: async (params: H, options?: O) => hitTest(params),
            }
            : {
                createStore: (params: C, options?: O) =>
                    worker.invoke<typeof createStore>("createStore", params, options),
                getTileRenderData: async (params: G, options?: O) =>
                    worker.invoke<typeof getTileRenderData>("getTileRenderData", params, options),
                disposeStore: (storeId: string, options?: O) =>
                    worker.invoke<typeof disposeStore>("disposeStore", storeId, options),
                hitTest: (params: H, options?: O) => worker.invoke<typeof hitTest>("hitTest", params, options),
            };

        const renderCtx = createTsFeatureRenderer(attachRenderer(self.context, layer));
        const {
            renderer,
            setClassbreakCount,
            polygonMaterial,
            polylineMaterial,
            pointMaterial,
            pointUniforms,
            polylineUniforms,
            globalUniforms,
            camera,
            rt,
            scissorUniforms,
            scissorAlternativeMesh,
            copyUniforms,
            copyMesh,
            destroy: destroyRenderCtx,
        } = renderCtx;

        //geomtry
        let curVersion = 0;
        let renderInstances: PromiseResult<typeof createRenderInstances>;
        async function createRenderInstances(
            inputGraphics: GraphicProps[],
            tileScheme: TileInfo,
            tolerance: number,
            version: number
        ) {
            let destroyed = false;
            let fullExtent: Extent;
            const tileSize = tileScheme.size[0];
            const storeId = `TimeSeriesFeatureLayer[id:${layer[ILayerIdKey]}, version:${version}]`;
            //统计以及确定索引, 索引只与graphics顺序位置有关, 是不变的;
            const { stat, dataIndexMap, uidMap } = buildIndexAndStat(inputGraphics);
            const styleIndexMap = buildStyleIndex(inputGraphics);
            let styleData = encodeStyleData({
                graphics: inputGraphics,
                styleIndexMap,
                pointCount: stat.point,
                polylineCount: stat.polyline,
            });
            stat.maxLineWidth = styleData.maxLineWidth;
            stat.maxPointSize = styleData.maxPointSize;
            await init();
            if (version !== curVersion) {
                workMethods.disposeStore(storeId);
                return;
            }
            const getTileNode = createVTileTreeWithScheme({
                tileScheme,
                minLevel: tileScheme.lods[0].level,
                maxLevel: tileScheme.lods.slice(-1)[0].level,
            });
            let timeState: {
                curTime: number;
                beforeIndex: number;
                afterIndex: number;
                eagerTimes: number[];
                restTimes: number[];
            };
            let tileState = {
                version: -1,
                tileIds: [] as string[],
                lastScale: view.scale,
                lastScaleAction: "zoom-in" as "zoom-in" | "zoom-out",
            };
            type TileMeshData = {
                pointMesh: Mesh;
                polylineMesh: Mesh;
                polygonMesh: Mesh;
            };
            const tileResourceManager = (() => {
                type GeoTaskRecord = {
                    key: string; //tile id
                    tileId: string;
                    status: EnumTaskStatus;
                    isEmpty: boolean;
                };
                const recordMap = new Map<string /*tileId*/, GeoTaskRecord>();
                const cache = new LRUCache<TileMeshData, string>(
                    10 * Math.ceil(window.screen.height / tileSize) * Math.ceil(window.screen.width / tileSize),
                    {
                        onRemove(obj, key, reason) {
                            recordMap.delete(key);
                            const { pointMesh, polygonMesh, polylineMesh } = obj;
                            layerLog(`销毁 tile [${key}]`);
                            polygonMesh && polygonMesh.geometry.dispose();
                            pointMesh && pointMesh.geometry.dispose();
                            polylineMesh && polylineMesh.geometry.dispose();
                        },
                    }
                );
                const scheduler = asyncTaskScheduler<
                    GeoTaskRecord,
                    PromiseResult<typeof workMethods.getTileRenderData>
                    >({
                    invoke(record) {
                        record.status = EnumTaskStatus.pending;
                        return workMethods.getTileRenderData({ storeId, tileId: record.tileId });
                    },
                    onSuccess(resourceRaw, record) {
                        const hasData = resourceRaw?.polygon || resourceRaw?.point || resourceRaw?.polyline;
                        record.status = EnumTaskStatus.finish;
                        if (!hasData) {
                            record.isEmpty = true;
                            layerLog(`isEmpty:[${record.tileId}]`);
                            return;
                        }
                        record.isEmpty = false;
                        const msg = [
                            "loaded",
                            `[${record.tileId}]`,
                            "time",
                            `[${resourceRaw.cost.toFixed(1)}ms]`,
                            resourceRaw.size,
                        ].join(" ");
                        layerLog(msg);
                        const meshData = buildTileMesh(resourceRaw, renderCtx);
                        cache.add(record.tileId, meshData);
                        self.requestRender();
                    },
                    onError(error, record) {
                        if (isAbortError(error)) {
                            recordMap.delete(record.tileId);
                            return;
                        }
                        record.status = EnumTaskStatus.error;
                        layerLog(`加载 tile [${record.tileId}]失败`, error);
                        throw error;
                    },
                    maxConcurrency: 1,
                });

                const scheduleTileFetch = throttle(
                    () => {
                        if (!tileState.tileIds.length) return;
                        //获取当前需要渲染的块,
                        const { x, y } = view.center;
                        scheduler.updateQueue(() => {
                            return (
                                tileState.tileIds
                                    .map((tileId) => {
                                        let record = recordMap.get(tileId);
                                        if (!record) {
                                            record = {
                                                key: tileId,
                                                tileId,
                                                status: EnumTaskStatus.none,
                                                isEmpty: null,
                                            };
                                            recordMap.set(tileId, record);
                                        }
                                        if (record.status === EnumTaskStatus.none) {
                                            const node = getTileNode(record.tileId);
                                            //@ts-ignore
                                            record._disToCenter = Math.hypot(node.cx - x, node.cy - y);
                                            return record;
                                        }
                                        return null;
                                    })
                                    .filter(Boolean)
                                    //@ts-ignore
                                    .sort((a, b) => b._disToCenter - a._disToCenter)
                            );
                        });
                    },
                    300,
                    { leading: true, trailing: true }
                );

                let stopHandle: () => void;
                const startLoad = () => {
                    if (stopHandle) return;
                    const handle = reactiveUtils.watch(
                        () => view.extent,
                        () => {
                            if (tileState.version === self._tilesVersion) return;
                            const curTileIds = self.tiles
                                .map((i) => {
                                    const vt = getTileNode(i.level, i.col, i.row);
                                    return isExtentIntersect(fullExtent, vt) ? vt.id : null;
                                })
                                .filter(Boolean);
                            const scale = view.scale;
                            let action = "zoom-in" as typeof tileState.lastScaleAction;
                            //当前的缩放行为
                            if (tileState.lastScale >= scale) {
                                action = "zoom-in"; //放大
                            } else if (tileState.lastScale < scale) {
                                action = "zoom-out"; //缩小
                            }
                            tileState = {
                                version: self._tilesVersion,
                                tileIds: curTileIds,
                                lastScale: scale,
                                lastScaleAction: action,
                            };
                            scheduleTileFetch();
                        },
                        { initial: true }
                    );
                    stopHandle = () => handle.remove();
                };
                const stopLoad = () => {
                    if (stopHandle) {
                        stopHandle();
                        stopHandle = null;
                    }
                };
                return {
                    get: (tileId: string, reinsert = true) => {
                        return cache.get(tileId, reinsert);
                    },
                    isErrorOrEmpty(tileId: string) {
                        const record = recordMap.get(tileId);
                        return record?.isEmpty === true || record?.status === EnumTaskStatus.error;
                    },
                    isSettled(tileId: string) {
                        const record = recordMap.get(tileId);
                        return record?.status === EnumTaskStatus.finish || record?.status === EnumTaskStatus.error;
                    },
                    startLoad,
                    stopLoad,
                    destroy(reason: any) {
                        stopLoad();
                        scheduler.clear(reason);
                        cache.clear(reason);
                        recordMap.clear();
                    },
                };
            })();

            const renderOptsWatcher = (() => {
                let colorMappingData: (GradientColorMappingData | ClassBreakColorMappingData) & {
                    _src?: any;
                    _enable?: boolean;
                };
                let curPointStyle: {
                    size: number;
                    upright: boolean;
                    style: PointStyle;
                };
                let curPolylineStyle: {
                    width: number;
                };
                let stopHandle: () => void;
                return {
                    startWatch() {
                        if (stopHandle) return;
                        const subs = [] as IHandle[];
                        const h = reactiveUtils.watch(
                            () => layer.renderOpts,
                            (renderOpts) => {
                                subs.forEach((f) => f.remove());
                                subs.length = 0;
                                if (!renderOpts) return;
                                const h1 = reactiveUtils.watch(
                                    () => renderOpts.colorMapping,
                                    async (def) => {
                                        if (!def) {
                                            colorMappingData && (colorMappingData._enable = false);
                                            return;
                                        }
                                        const textureChange =
                                            def.type !== colorMappingData?.type &&
                                            ((def.type === "gradient" && colorMappingData?._src !== def.stops) ||
                                                (def.type === "class-break" && colorMappingData?._src !== def.breaks));
                                        if (textureChange) {
                                            const newData = (await buildColorMappingData(def)) as
                                                | GradientColorMappingData
                                                | ClassBreakColorMappingData;
                                            if (def !== layer.renderOpts.colorMapping) return;
                                            if (colorMappingData) colorMappingData.texture.dispose();
                                            colorMappingData = newData;
                                            //@ts-ignore
                                            colorMappingData._src = def.stops || def.breaks;
                                        } else {
                                            colorMappingData.trunc = [def.truncHead ?? false, def.truncTail ?? false];
                                        }
                                        colorMappingData._enable = true;
                                        self.requestRender();
                                    },
                                    { initial: true }
                                );
                                const h2 = reactiveUtils.watch(
                                    () =>
                                        [
                                            renderOpts.defaultPointSize,
                                            renderOpts.defaultPointUpright,
                                            renderOpts.defaultPointStyle,
                                        ] as const,
                                    ([size, upright, style]) => {
                                        size = size ?? DefaultStyle.pointSize;
                                        upright = isNil(upright) ? DefaultStyle.pointUpright : !!upright;
                                        style = style ?? DefaultStyle.pointStyle;
                                        curPointStyle = {
                                            size,
                                            upright,
                                            style,
                                        };
                                        stat.point && self.requestRender();
                                    },
                                    { initial: true }
                                );
                                const h3 = reactiveUtils.watch(
                                    () => renderOpts.defaultLineWidth,
                                    (lineWidth) => {
                                        lineWidth = !lineWidth ? DefaultStyle.lineWidth : lineWidth;
                                        curPolylineStyle = {
                                            width: lineWidth,
                                        };
                                        stat.polyline && self.requestRender();
                                    },
                                    { initial: true }
                                );
                                subs.push(h1, h2, h3);
                            },
                            { initial: true }
                        );
                        stopHandle = () => {
                            h.remove();
                            subs.forEach((f) => f.remove());
                        };
                    },
                    stopWatch() {
                        if (stopHandle) {
                            stopHandle();
                            stopHandle = null;
                        }
                    },
                    getData() {
                        if (!colorMappingData?._enable) return null;
                        return {
                            colorMappingData,
                            curPointStyle,
                            curPolylineStyle,
                        };
                    },
                    destroy() {
                        if (stopHandle) {
                            stopHandle();
                            stopHandle = null;
                        }
                        if (colorMappingData) {
                            colorMappingData.texture.dispose();
                        }
                    },
                };
            })();

            const timeDataManager = (() => {
                let manager: ReturnType<typeof createTimeDataManager>;
                let start = false;
                const sourceHandle = reactiveUtils.watch(
                    () => layer.source,
                    (source) => {
                        manager?.destroy?.(ReasonMap.dataSourceChange);
                        manager = null;
                        timeState = null;
                        if (!source) return;
                        manager = createTimeDataManager(source);
                        self.requestRender();
                    },
                    { initial: true }
                );
                function createTimeDataManager(source: TimeSeriesFeatureLayer["source"]) {
                    const { minTime, maxTime, times, isSingle, dataGetter } = checkTimeFeatureSource(source);
                    if (isNil(layer.curTime) || isNaN(layer.curTime)) {
                        layer.curTime = minTime;
                    }
                    let texSize: number[], //生成纹理的像素尺寸
                        texArrayLength: number, //生成纹理数组长度 = size[0] * size[1] * 4 (RGBA)
                        rawDataLength: number, //纹理数据原始长度,  一般 <= length;
                        unpackAlignment = 1;
                    type TimeDataTaskRecord = {
                        key: number; //time,
                        status: EnumTaskStatus;
                        time: number;
                    };
                    const recordMap = new Map<number, TimeDataTaskRecord>();
                    const cache = new LRUCache<DataTexture, number>(256, {
                        onRemove(tex, key, reason) {
                            recordMap.delete(key);
                            tex.dispose();
                        },
                    });
                    const scheduler = asyncTaskScheduler<TimeDataTaskRecord, ArrayLike<number>>({
                        invoke(record) {
                            record.status = EnumTaskStatus.pending;
                            return dataGetter(record.time);
                        },
                        onSuccess(result, record) {
                            if (isNil(rawDataLength)) rawDataLength = result.length;
                            if (!texSize) {
                                texSize = calcDataTexSize(rawDataLength / 4);
                                unpackAlignment = getTextureUnpackAlign(texSize[0]);
                                texArrayLength = texSize[0] * texSize[1] * 4; //rgba
                            }
                            const tex = buildTimeTexture(result);
                            cache.add(record.time, tex);
                            self.requestRender();
                            function buildTimeTexture(rawArray: ArrayLike<number>) {
                                const texture = new DataTexture();
                                texture.format = RGBAFormat;
                                texture.type = FloatType;
                                texture.flipY = false;
                                texture.unpackAlignment = unpackAlignment;
                                texture.image = {
                                    //@ts-ignore
                                    data: convertData(rawArray, texArrayLength),
                                    width: texSize[0],
                                    height: texSize[1],
                                };
                                texture.needsUpdate = true;
                                return freeMemory(texture);
                            }
                            function convertData(arr: ArrayLike<number>, totalLength: number) {
                                if (arr instanceof Float32Array && arr.length === totalLength) {
                                    return arr;
                                }
                                const result = new Float32Array(totalLength);
                                result.set(arr);
                                return result;
                            }
                        },
                        onError(error, record) {
                            if (isAbortError(error)) {
                                recordMap.delete(record.key);
                                return;
                            }
                            record.status = EnumTaskStatus.error;
                            layerLog(`加载时序数据[${record.time}]失败\n`, error);
                            //throw error;
                        },
                        maxConcurrency: 3,
                    });
                    const scheduleFetch = rafThrottle(() => {
                        if (isNaN(layer.curTime) || isNil(layer.curTime)) return;
                        if (!timeState) return;
                        const { eagerTimes, restTimes } = timeState;
                        if (!eagerTimes.length && !restTimes.length) return;
                        scheduler.updateQueue((runningTask) => {
                            runningTask.forEach(({ desc, cancel }) => {
                                if (eagerTimes.findIndex((i) => i === desc.time) === -1) {
                                    cancel(ReasonMap.timeOutOfRange);
                                }
                            });
                            return [...eagerTimes, ...restTimes]
                                .sort((a, b) => b - a)
                                .map((t) => {
                                    let record = recordMap.get(t);
                                    if (!record) {
                                        record = {
                                            key: t,
                                            time: t,
                                            status: EnumTaskStatus.none,
                                        };
                                        recordMap.set(t, record);
                                    }
                                    return record.status === EnumTaskStatus.none ? record : null;
                                })
                                .filter(Boolean);
                        });
                    });
                    let delayTimer: NodeJS.Timeout;
                    let timeHandle: IHandle;
                    function handleTimeChange() {
                        let curTime = layer.curTime;
                        if (!isSingle && (isNaN(curTime) || isNil(curTime))) {
                            timeState = null;
                            return;
                        }
                        const oldEagerTimes = timeState?.eagerTimes || [];
                        const oldRestTimes = timeState?.restTimes || [];
                        curTime = clamp(layer.curTime, minTime, maxTime);
                        let timeIndexSet: Set<number>;
                        let beforeIndex: number, afterIndex: number;
                        if (isSingle) {
                            beforeIndex = afterIndex = 0;
                            timeIndexSet = new Set([0]);
                        } else {
                            const result = getFramePrediction({
                                times,
                                curTime,
                                preload: layer.preload,
                            });
                            beforeIndex = result.beforeIndex;
                            afterIndex = result.afterIndex;
                            timeIndexSet = result.timeIndexSet;
                        }
                        timeIndexSet.delete(beforeIndex);
                        timeIndexSet.delete(afterIndex);
                        const eagerTimes = [times[beforeIndex], times[afterIndex]];
                        const restTimes = Array.from(timeIndexSet)
                            .sort((a, b) => a - b)
                            .map((i) => times[i]);
                        const { only1, both, only2 } = diffAscArrays(
                            [...oldEagerTimes, ...oldRestTimes],
                            [...eagerTimes, ...restTimes]
                        );
                        const shouldDelay = !both.length;
                        const timeIndexChange = !timeState || only1.length || only2.length;
                        timeState = {
                            curTime,
                            beforeIndex,
                            afterIndex,
                            eagerTimes,
                            restTimes,
                        };
                        if (!timeIndexChange) return;
                        if (shouldDelay) {
                            delayTimer && clearTimeout(delayTimer);
                            delayTimer = setTimeout(() => {
                                delayTimer = null;
                                scheduleFetch();
                            }, 300);
                        } else {
                            !delayTimer && scheduleFetch();
                        }
                    }
                    const startLoad = () => {
                        if (timeHandle) return;
                        timeHandle = isSingle
                            ? (handleTimeChange(), null)
                            : reactiveUtils.watch(
                                () => layer.curTime,
                                () => {
                                    if (!start) return;
                                    self.requestRender();
                                    handleTimeChange();
                                },
                                { initial: true }
                            );
                    };
                    const stopLoad = () => {
                        if (delayTimer) {
                            clearTimeout(delayTimer);
                            delayTimer = null;
                        }
                        if (timeHandle) {
                            timeHandle.remove();
                            timeHandle = null;
                        }
                    };
                    if (start) startLoad();
                    return {
                        scheduleFetch,
                        startLoad,
                        stopLoad,
                        getCurTimeData() {
                            if (!timeState) return null;
                            const { beforeIndex, afterIndex, curTime } = timeState;
                            const t1 = times[beforeIndex],
                                t2 = times[afterIndex];
                            const EPSILON = 0.01;
                            const percent = isSingle ? 0 : (curTime - t1) / (t2 - t1);
                            const tex2 = cache.get(t2);
                            const tex1 = cache.get(t1);
                            if (tex1 && tex2) return { percent, tex1, tex2, texSize };
                            if (tex1 && percent < EPSILON) {
                                return { percent: 0, tex1, tex2: null, texSize };
                            }
                            if (tex2 && 1 - percent < EPSILON) {
                                return { percent: 1, tex1: null, tex2, texSize };
                            }
                            return null;
                        },
                        readyAtTime(t: number) {
                            if (isSingle) {
                                const tex = cache.get(minTime);
                                return !!tex;
                            }
                            t = clamp(t, minTime, maxTime);
                            const [beforeIndex, afterIndex] = findIntervalIndexThatValueIn(times, t);
                            const beforeTime = times[beforeIndex],
                                afterTime = times[afterIndex];
                            const r2 = recordMap.get(afterTime);
                            const r1 = recordMap.get(beforeTime);
                            return r1?.status === EnumTaskStatus.finish && r2?.status === EnumTaskStatus.finish;
                        },
                        destroy(reason: any) {
                            stopLoad();
                            scheduler.clear(reason);
                            cache.clear(reason);
                            recordMap.clear();
                        },
                    };
                }
                return {
                    getCurTimeData() {
                        if (!manager) return null;
                        return manager.getCurTimeData();
                    },
                    readyAtTime(t: number) {
                        return manager ? manager.readyAtTime(t) : false;
                    },
                    startLoad() {
                        if (start) return;
                        start = true;
                        manager && manager.startLoad();
                    },
                    stopLoad() {
                        start = false;
                        manager && manager.stopLoad();
                    },
                    destroy(reason: any) {
                        start = false;
                        sourceHandle.remove();
                        manager && manager.destroy(reason);
                    },
                };
            })();

            async function init() {
                const { pointStyle, polylineStyle } = styleData;
                //clone一份, 一份上传gpu渲染, 一份transfer到worker做pick;
                const pointStyleBuffer = pointStyle ? new Uint8ClampedArray(pointStyle.data) : null;
                const polylineStyleBuffer = polylineStyle ? new Uint8ClampedArray(polylineStyle.data) : null;
                const vtStore = await workMethods.createStore(
                    {
                        storeId,
                        viewSR: view.spatialReference.toJSON(),
                        tileScheme: tileScheme.toJSON(),
                        graphics: inputGraphics
                            .map((g) => {
                                const geometry = g.geometry;
                                const geoType = geometry.type;
                                //@ts-ignore
                                if (geoType === "mesh") return null;
                                const uid = uidMap.get(g) as number;
                                const dataIndex = dataIndexMap.get(g);
                                return {
                                    id: uid,
                                    index:
                                        geoType === "point" || geoType === "multipoint"
                                            ? {
                                                data: dataIndex,
                                                pointStyle: styleIndexMap.point.get(g),
                                            }
                                            : geoType === "polyline"
                                                ? {
                                                    data: dataIndex,
                                                    polylineStyle: styleIndexMap.polyline.get(g),
                                                }
                                                : {
                                                    data: dataIndex,
                                                },
                                    geometry:
                                        "toJSON" in geometry
                                            ? {
                                                ...g.geometry.toJSON(),
                                                type: geometry.type,
                                            }
                                            : geometry,
                                };
                            })
                            .filter(Boolean),
                        style: {
                            point: pointStyleBuffer,
                            polyline: polylineStyleBuffer,
                        },
                        maxZoom: tileScheme.lods.slice(-1)[0].level,
                        tolerance: tolerance ?? 1,
                    },
                    { transferList: [pointStyleBuffer?.buffer, polylineStyleBuffer?.buffer].filter(Boolean) }
                );
                if (!vtStore?.fullExtent) throw TsFeatureError("解析几何数据失败");
                fullExtent = new Extent(vtStore.fullExtent);
            }
            const stop = () => {
                tileResourceManager.stopLoad();
                timeDataManager.stopLoad();
                renderOptsWatcher.stopWatch();
            };
            function hasMesh(tileId: string) {
                return !!tileResourceManager.get(tileId, false);
            }
            function getCurRenderTiles() {
                if (!tileState.tileIds.length) return null;
                let finalRenders = [] as { clip: boolean; tileId: string }[];
                if (tileState.lastScaleAction === "zoom-in") {
                    // 放大, zoom 增加，细节增加
                    // 若当前tile未完成，对应区域由父tile渲染（若父tile可渲染）
                    const groups = new Map<string, string[]>();

                    function pushRecord(parentId: string, childId: string) {
                        if (!groups.has(parentId)) {
                            groups.set(parentId, []);
                        }
                        groups.get(parentId).push(childId);
                    }

                    tileState.tileIds.forEach((tileId) => {
                        const node = getTileNode(tileId);
                        let step = 2,
                            _z = node.z,
                            _x = node.x,
                            _y = node.y;
                        while (step && _z) {
                            _z--;
                            _x = _x >> 1;
                            _y = _y >> 1;
                            const parentId = getTileId(_z, _x, _y);
                            if (groups.has(parentId) || hasMesh(parentId)) {
                                pushRecord(parentId, tileId);
                                break;
                            }
                            step--;
                            if (step === 0) {
                                hasMesh(tileId) && finalRenders.push({ clip: false, tileId });
                            }
                        }
                    });
                    for (let [parentId, childs] of groups.entries()) {
                        const isChildrenAllSettled = childs.every((childId) => tileResourceManager.isSettled(childId));
                        if (isChildrenAllSettled) {
                            //no need parent
                            childs.forEach((childId) => {
                                hasMesh(childId) &&
                                finalRenders.push({
                                    clip: false,
                                    tileId: childId,
                                });
                            });
                        } else {
                            finalRenders.push({ clip: false, tileId: parentId });
                            childs.forEach((childId) => {
                                hasMesh(childId) && finalRenders.push({ clip: true, tileId: childId });
                            });
                        }
                    }
                } else if (tileState.lastScaleAction === "zoom-out") {
                    //缩小， zoom减少
                    //若当前tile未加载, 则渲染其子tile(若子tile可渲染)
                    const _maxZoom = tileScheme.lods.slice(-1)[0].level;
                    tileState.tileIds.forEach((tileId) => {
                        if (tileResourceManager.isErrorOrEmpty(tileId)) return;
                        if (hasMesh(tileId)) {
                            finalRenders.push({ clip: false, tileId });
                            return;
                        }
                        const root = getTileNode(tileId);
                        const childs = root.children;
                        if (!childs?.length) return;
                        childs.forEach((c) => _recurse(c.z, c.x, c.y));

                        function _recurse(z: number, x: number, y: number) {
                            if (z > _maxZoom || z - root.z > 2) return;
                            const _tileId = getTileId(z, x, y);
                            if (hasMesh(_tileId)) {
                                finalRenders.push({ clip: false, tileId: _tileId });
                            } else {
                                const _childs = getTileNode(_tileId).children;
                                _childs?.length && _childs.forEach((item) => _recurse(item.z, item.x, item.y));
                            }
                        }
                    });
                }
                return finalRenders.map((i) => {
                    return {
                        clip: i.clip,
                        vt: getTileNode(i.tileId),
                        mesh: tileResourceManager.get(i.tileId),
                    };
                });
            }

            return {
                version,
                fullExtent,
                start: () => {
                    tileResourceManager.startLoad();
                    timeDataManager.startLoad();
                    renderOptsWatcher.startWatch();
                },
                stop,
                readyAtTime(time: number) {
                    return timeDataManager.readyAtTime(time);
                },
                render({ state }: __esri.BaseLayerViewGL2DRenderRenderParameters): void {
                    if (!renderInstances) return;
                    const renderOpts = renderOptsWatcher.getData();
                    if (!renderOpts) return;
                    const timeData = timeDataManager.getCurTimeData();
                    if (!timeData) return;
                    type T = ArrayItemType<ReturnType<typeof getCurRenderTiles>>;
                    type TileRenderState = {
                        //均以屏幕像素为准
                        centerScreenPos: number[];
                        pixelSize: number[];
                        scissor: number[];
                        boundsScreenPos: number[][];
                    };
                    const curRenderTiles = getCurRenderTiles() as (T & {
                        renderState?: TileRenderState;
                    })[];
                    if (!curRenderTiles.length) return;

                    const { framebuffer, viewport } = self.getRenderTarget();
                    renderer.resetState();
                    const [screenWidth, screenHeight] = state.size;
                    const bufferWidth = viewport[2] - viewport[0];
                    const bufferHeight = viewport[3] - viewport[1];

                    rt.setSize(bufferWidth, bufferHeight);
                    renderer.setRenderTarget(rt);
                    renderer.setClearColor("black", 0);
                    renderer.clear(true, true);

                    //@ts-ignore
                    const dpr = state.pixelRatio as number;
                    const resolution = state.resolution;

                    const { colorMappingData, curPointStyle, curPolylineStyle } = renderOpts;
                    //setup colormapping
                    setupColorMapping();
                    setupDataTex();

                    updatePosTransform();
                    function updatePosTransform() {
                        //state.rotation 是与正北方向的顺时针夹角(x向右, y向上)
                        globalUniforms.u_rotation.value.identity().rotate((Math.PI * state.rotation) / 180);
                        //屏幕坐标转换为ndc坐标
                        globalUniforms.u_display.value
                            .identity()
                            .premultiply(
                                _mat3.identity().scale(
                                    2 / screenWidth,
                                    -2 / screenHeight //屏幕坐标y轴向下
                                )
                            )
                            .premultiply(_mat3.identity().translate(-1, 1));
                        scissorUniforms.u_display.value.copy(globalUniforms.u_display.value);
                        globalUniforms.u_resolution.value = resolution;
                    }

                    const { pointStyle, polylineStyle } = styleData;
                    if (pointStyle) {
                        const u = pointUniforms.value;
                        u.defaultSize = curPointStyle.size;
                        u.defaultType = PointStyleCode[curPointStyle.style];
                        u.defaultUpright = curPointStyle.upright;
                        u.texture = pointStyle.texture;
                        u.texSize.set(pointStyle.size[0], pointStyle.size[1]);
                    }
                    if (polylineStyle) {
                        const u = polylineUniforms.value;
                        u.texture = polylineStyle.texture;
                        u.texSize.set(polylineStyle.size[0], polylineStyle.size[1]);
                        u.defaultLineWidth = curPolylineStyle.width;
                    }

                    const isRotate = state.rotation > 0;
                    //calc render Param
                    for (let item of curRenderTiles) {
                        const { xmin, ymin, cx, cy, width, height, xmax, ymax } = item.vt;

                        const size = [width / state.resolution, height / state.resolution];
                        const tileRenderState = {
                            centerScreenPos: state.toScreen([], cx, cy).map((i) => i / dpr),
                            pixelSize: size,
                            scissor: null,
                            boundsScreenPos: null,
                        } as TileRenderState;

                        if (isRotate) {
                            tileRenderState.boundsScreenPos = [
                                state.toScreen([], xmin, ymin),
                                state.toScreen([], xmax, ymin),
                                state.toScreen([], xmax, ymax),
                                state.toScreen([], xmin, ymax),
                            ].map((p) => p.map((i) => i / dpr));
                        } else {
                            const scissorX = (xmin - state.extent.xmin) / resolution;
                            const scissorY = (ymin - state.extent.ymin) / resolution;
                            tileRenderState.scissor = [scissorX, scissorY, size[0], size[1]];
                        }
                        item.renderState = tileRenderState;
                    }

                    const renderMeshes = curRenderTiles
                        .map(({ clip, mesh, vt, renderState }) => {
                            const { polygonMesh, polylineMesh, pointMesh } = mesh;
                            const base = vt.z;
                            return [
                                polygonMesh ? { tileZ: base, meshZ: 0, clip, mesh: polygonMesh, renderState } : null,
                                polylineMesh ? { tileZ: base, meshZ: 1, clip, mesh: polylineMesh, renderState } : null,
                                pointMesh ? { tileZ: base, meshZ: 2, clip, mesh: pointMesh, renderState } : null,
                            ].filter(Boolean);
                        })
                        .flat()
                        .sort((a, b) => {
                            if (a.meshZ === b.meshZ) return a.tileZ - b.tileZ;
                            return a.meshZ - b.meshZ;
                        });
                    //TODO: 分批次， rotate clip 合并
                    for (let { clip, mesh, renderState } of renderMeshes) {
                        const { centerScreenPos, pixelSize, scissor } = renderState;
                        globalUniforms.u_tile.value.set(
                            centerScreenPos[0],
                            centerScreenPos[1],
                            pixelSize[0],
                            pixelSize[1]
                        );
                        if (clip) {
                            if (isRotate) {
                                const [p0, p1, p2, p3] = renderState.boundsScreenPos as [number, number][];
                                scissorUniforms.u_v0.value.set(...p0);
                                scissorUniforms.u_v1.value.set(...p1);
                                scissorUniforms.u_v2.value.set(...p2);
                                scissorUniforms.u_v3.value.set(...p3);
                                renderer.render(scissorAlternativeMesh, camera);
                            } else {
                                renderer.setScissorTest(true);
                                renderer.setScissor(
                                    scissor[0] * dpr,
                                    scissor[1] * dpr,
                                    scissor[2] * dpr,
                                    scissor[3] * dpr
                                );
                                renderer.clearColor(); //清除
                                renderer.setScissorTest(false);
                            }
                        }
                        renderer.render(mesh, camera);
                    }

                    renderer.setViewport(viewport[0], viewport[1], viewport[2], viewport[3]);
                    renderer.state.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                    copyUniforms.map.value = rt.texture;
                    renderer.render(copyMesh, camera);

                    function setupColorMapping() {
                        const uColorMapping = globalUniforms.u_colorMapping.value;
                        uColorMapping.texture = colorMappingData.texture;
                        uColorMapping.type = ColorMappingTypeCode[colorMappingData.type];
                        uColorMapping.trunc.set(colorMappingData.trunc[0] ? 1 : 0, colorMappingData.trunc[1] ? 1 : 0);
                        if (colorMappingData.type === "gradient") {
                            uColorMapping.valueRange.set(...(colorMappingData.valueRange as [number, number]));
                        } else {
                            setClassbreakCount(colorMappingData.breaks);
                        }
                    }
                    function setupDataTex() {
                        const { tex1, tex2, texSize, percent } = timeData;
                        const uDataValue = globalUniforms.u_dataValue.value;
                        uDataValue.enable.set(tex1 ? 1 : 0, tex2 ? 1 : 0);
                        uDataValue.lerpValue = percent;
                        uDataValue.tex1 = tex1;
                        uDataValue.tex2 = tex2;
                        uDataValue.texSize.set(texSize[0], texSize[1]);
                    }
                },
                hitTest(mapPoint: __esri.Point, screenPoint: __esri.BaseLayerViewGL2DScreenPoint) {
                    if (tileState.version === -1) return Promise.resolve(null);
                    const curStyle = renderOptsWatcher.getData();
                    if (!curStyle) return null;
                    if (stat.point + stat.polyline) {
                        const padding = (Math.max(stat.maxLineWidth, stat.maxPointSize) / 2) * view.resolution;
                        const { xmin, xmax, ymin, ymax } = renderInstances.fullExtent;
                        if (
                            mapPoint.x < xmin - padding ||
                            mapPoint.x > xmax + padding ||
                            mapPoint.y < ymin - padding ||
                            mapPoint.y > ymax + padding
                        ) {
                            return Promise.resolve(null);
                        }
                    } else {
                        if (!renderInstances.fullExtent.contains(mapPoint)) return Promise.resolve(null);
                    }

                    const targetTileId = tileState.tileIds.find((id) => {
                        const vt = getTileNode(id);
                        return pointInExtent(mapPoint, vt);
                    });

                    const { z, x, y } = getTileNode(targetTileId);

                    const { curPolylineStyle, curPointStyle } = curStyle;

                    return workMethods
                        .hitTest({
                            storeId,
                            z,
                            x,
                            y,
                            resolution: view.resolution,
                            rotate: (view.rotation / 180) * Math.PI,
                            defaultPointSize: curPointStyle.size,
                            defaultLineWidth: curPolylineStyle.width,
                            defaultPointStyle: curPointStyle.style,
                            defaultPointUpright: curPointStyle.upright,
                            point: {
                                x: mapPoint.x,
                                y: mapPoint.y,
                            },
                        })
                        .then((graphicIds) => {
                            return graphicIds?.length
                                ? graphicIds.map((id) => {
                                    const g = uidMap.get(id) as GraphicProps;
                                    return {
                                        type: "graphic",
                                        layer,
                                        mapPoint,
                                        graphic: new Graphic({
                                            geometry: g.geometry,
                                            layer,
                                            //@ts-ignore
                                            rawData: g,
                                        }),
                                    } as __esri.GraphicHit;
                                })
                                : null;
                        });
                },
                destroy: () => {
                    if (destroyed) return;
                    destroyed = true;
                    stop();
                    uidMap.clear();
                    tileResourceManager.destroy(ReasonMap.dataSourceChange);
                    timeDataManager.destroy(ReasonMap.dataSourceChange);
                    renderOptsWatcher.destroy();
                    const { polylineStyle, pointStyle } = styleData;
                    polylineStyle && polylineStyle.texture.dispose();
                    pointStyle && pointStyle.texture.dispose();
                    workMethods.disposeStore(storeId);
                },
            };
        }

        handlers.push(
            reactiveUtils.watch(
                () => [layer.tolerance, layer.tileInfo, layer.graphics] as const,
                ([tolerance, tileScheme, graphics]) => {
                    if (self.destroyed) return;
                    const version = ++curVersion;
                    if (!graphics?.length || !tileScheme) {
                        renderInstances && renderInstances.destroy();
                        renderInstances = null;
                        return;
                    }
                    renderInstances?.stop?.();
                    createRenderInstances(graphics, tileScheme, tolerance, version).then((newInstances) => {
                        if (version !== curVersion) return;
                        renderInstances && renderInstances.destroy();
                        renderInstances = newInstances;
                        newInstances.start();
                    });
                },
                { initial: true }
            )
        );
        handlers.push({
            remove: () => {
                destroyRenderCtx();
                detachRenderer(self.context, layer);
                renderInstances && renderInstances.destroy();
            },
        });

        self.readyAtTime = (time: number) => {
            if (!renderInstances) return false;
            return renderInstances.readyAtTime(time);
        };
        self._render = (param: __esri.BaseLayerViewGL2DRenderRenderParameters) => {
            if (!renderInstances) return;
            renderInstances.render(param);
        };
        self._hitTest = (mapPoint: __esri.Point, screenPoint: __esri.BaseLayerViewGL2DScreenPoint) => {
            if (!view.stationary || !renderInstances || renderInstances.version !== curVersion) {
                return Promise.resolve(null);
            }
            return renderInstances.hitTest(mapPoint, screenPoint);
        };
    }

    render(renderParameters: __esri.BaseLayerViewGL2DRenderRenderParameters): void {
        this._render?.(renderParameters);
    }
    hitTest(mapPoint: __esri.Point, screenPoint: __esri.BaseLayerViewGL2DScreenPoint): Promise<Graphic[]> {
        return this._hitTest?.(mapPoint, screenPoint);
    }
    detach(): void {
        this._handlers.forEach((f) => f.remove());
        this._handlers.length = 0;
    }
}

@subclass()
export class TimeSeriesFeatureLayer extends Layer {
    private [ILayerIdKey]: number = getLayerUID();
    private _layerView: CustomLayerView;
    debug: boolean;
    preload: PreloadOpts = { frame: 5 };
    constructor(
        props?: {
            tileInfo?: __esri.TileInfoProperties;
            graphics?: TimeSeriesFeatureLayer["graphics"];
            source?: TimeSeriesFeatureLayer["source"];
            curTime?: number;
            renderOpts?: Partial<FeatureRenderOpts>;
            tolerance?: number;
            preload?: PreloadOpts;
            effect?: __esri.Effect;
        } & __esri.GraphicsLayerProperties
    ) {
        super();
        Object.assign(this, props);
    }

    @property()
    effect: __esri.Effect;

    @property()
    graphics: GraphicProps[];

    @property()
    tolerance: number = 1; //矢量切片误差(像素), 地图上2个点的距离小于tolerance像素则会被合并成一个点, 用于数据简化

    @property({
        type: TileInfo,
    })
    tileInfo: __esri.TileInfo; //mapView非4326/3857坐标系时,必须指定tileInfo

    @property()
    source: {
        times: number[];
        dataGetter: FeatureTimeDataGetter;
    };

    @property()
    curTime: number; //当前时间

    @property({
        type: FeatureRenderOpts,
    })
    renderOpts: FeatureRenderOpts;

    readyAtTime(t: number) {
        if (!this._layerView) return false;
        return this._layerView.readyAtTime?.(t);
    }

    createLayerView(view: any) {
        if (view.type !== "2d") throw new Error("不支持3d");

        if (!this.tileInfo) {
            const viewCrs = (view as __esri.MapView).spatialReference;
            if (
                !viewCrs.equals({ wkid: 4326 } as __esri.SpatialReference) &&
                !viewCrs.equals({ wkid: 3857 } as __esri.SpatialReference)
            ) {
                console.warn("mapView.spatialReference非4326/3857坐标系时,必须指定 TimeSeriesFeatureLayer.tileInfo");
            } else {
                this.tileInfo = TileInfo.create({
                    size: 256,
                    spatialReference: view.spatialReference.toJSON(),
                });
            }
        }
        const lyView = new CustomLayerView({
            view: view,
            //@ts-ignore
            layer: this,
        });
        return Promise.resolve(lyView);
    }
}
