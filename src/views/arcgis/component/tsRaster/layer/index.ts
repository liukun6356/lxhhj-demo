import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import Extent from "@arcgis/core/geometry/Extent";
import Layer from "@arcgis/core/layers/Layer";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import BaseLayerViewGL2D from "@arcgis/core/views/2d/layers/BaseLayerViewGL2D";
import MapView from "@arcgis/core/views/MapView";
import { ArrugatorOutput } from "arrugator";
import { WorkerPathConfig } from "lib/config";
import { PromiseResult, WorkerMethodParam } from "lib/global";
import {
    VectorFieldRenderOpts,
    VectorFieldRenderOptsProperties,
} from "lib/layers/common/vector-field/vector-field-render-opts";
import { LRUCache } from "lib/utils/LRU";
import { showImageBitmap } from "lib/utils/debug-utils";
import { diffAscArrays, findIntervalIndexThatValueIn, rafThrottle } from "lib/utils/misc";
import { downSamplingImageBitmap } from "lib/utils/raster/down-sampling";
import { RasterProjectSplitTileResult } from "lib/utils/raster/reproject-split";
import { VTileNode, createVTileTreeWithScheme, getChildrenTiles, getTileId } from "lib/utils/vector-tile/tile";
import { openCustomArcgisWorker } from "lib/utils/worker";
import {
    RasterTileSplitResult,
    createRasterReprojectContext,
    rasterReprojectExtentSplit,
} from "lib/worker/raster.worker";
import { clamp, isNil } from "lodash-es";
import { CanvasTexture, ClampToEdgeWrapping, NearestFilter } from "three";
import {
    AbortError,
    EnumTaskStatus,
    ILayerIdKey,
    PreloadOpts,
    asyncTaskScheduler,
    createReusePool,
    getFramePrediction,
    getLayerUID,
    idleSyncTaskScheduler,
    isAbortError,
    resolveViewRenderExtent,
} from "../common";
import { attachRenderer, detachRenderer } from "../three-misc";
import {
    RasterSimpleRenderOpts,
    TsRasterError,
    checkRasterSource,
    createTileBoundMap,
    createTileWeightMap,
    findMinLevel,
    resolveEmptyTileIdInBounds,
} from "./misc";
import { initRasterWorker } from "./raster-worker-initial";
import { SimpleRenderOptsData, createRasterSimpleRenderer, watchSimpleRenderOpts } from "./renderer/simple";
import { VFRenderOptsData, createRasterVectorFieldRenderer, watchVectorFieldRenderOpts } from "./renderer/vector-field";
import { RasterTileProjectedData, RasterTileRecord, RasterTileRenderResource, TimeSeriesRasterSource } from "./types";

const TILE_SIZE = 256;

//取消均会抛出一个DOMException(name='AbortError');
const ReasonMap = {
    dataSourceChange: AbortError("数据源变更"),
    lowPriorityTask: AbortError("取消低优先级任务"), //时间空间不在范围内
    timeOutOfRange: AbortError("时间超出范围"),
    childrenNotReady: AbortError("子tile未准备完毕"), //下采样
    codeMapChange: AbortError("映射表变更"),
} as const;

@subclass()
class CustomLayerView extends BaseLayerViewGL2D {
    private _handlers: IHandle[] = [];
    private _render: (params: __esri.BaseLayerViewGL2DRenderRenderParameters) => void;
    private _tilesVersion = 0;
    tilesChanged(): void {
        this._tilesVersion++;
    }
    getLoadStat: (time: number) => number;
    attach() {
        const { view, _handlers: handlers } = this;
        const self = this,
            layer = this.layer as TimeSeriesRasterLayer;
        const useLocal = true;
        const layerLog = (...args: any[]) => layer.debug && console.log(...args);

        const tileSplitWorker = openCustomArcgisWorker(WorkerPathConfig.raster, { strategy: "distributed" });
        const projectFactory = openCustomArcgisWorker(WorkerPathConfig.raster, { strategy: "distributed" });

        const getTileSplit = (
            opts: WorkerMethodParam<typeof rasterReprojectExtentSplit>
        ): Promise<RasterTileSplitResult> => {
            return useLocal
                ? rasterReprojectExtentSplit(opts)
                : tileSplitWorker.invoke<typeof rasterReprojectExtentSplit>("rasterReprojectExtentSplit", opts);
        };
        const createRasterProjectCtx = () => {
            return useLocal
                ? createRasterReprojectContext().then((res) => [res.result])
                : projectFactory.broadcast<typeof createRasterReprojectContext>("createRasterReprojectContext", null);
        };

        const { getRenderer, destroy: destroyRenderer } = (() => {
            const threeRenderer = attachRenderer(self.context, layer);
            const renderCtxMap = {
                "vector-field": null as ReturnType<typeof createRasterVectorFieldRenderer>,
                simple: null as ReturnType<typeof createRasterSimpleRenderer>,
            };
            const getRenderer = (type: "vector-field" | "simple") => {
                if (!renderCtxMap[type]) {
                    switch (type) {
                        case "vector-field":
                            renderCtxMap["vector-field"] = createRasterVectorFieldRenderer(threeRenderer);
                            break;
                        case "simple":
                            renderCtxMap["simple"] = createRasterSimpleRenderer(threeRenderer);
                            break;
                        default:
                            throw new Error("无效的type:" + type);
                    }
                }
                return renderCtxMap[type];
            };
            return {
                getRenderer,
                destroy: () => {
                    (["vector-field", "simple"] as const).forEach((key) => {
                        if (renderCtxMap[key]) {
                            renderCtxMap[key].destory();
                            renderCtxMap[key] = null;
                        }
                    });
                    detachRenderer(self.context, layer);
                },
            };
        })();

        let renderInstances: PromiseResult<typeof createRenderInstances>;
        handlers.push(
            reactiveUtils.watch(
                () => [layer.source, layer.tileInfo] as const,
                ([source, tileInfo]) => {
                    if (!source || !tileInfo) {
                        renderInstances?.destroy?.();
                        renderInstances = null;
                        return;
                    }
                    renderInstances?.stop?.();
                    createRenderInstances(source, tileInfo).then((newInstances) => {
                        if (source !== layer.source || tileInfo !== layer.tileInfo) {
                            newInstances.destroy();
                            return;
                        }
                        renderInstances?.destroy?.();
                        renderInstances = newInstances;
                        if (layer.debug) {
                            layer.debugData = newInstances.debugData;
                        }
                        newInstances.start();
                    });
                },
                { initial: true }
            )
        );
        async function createRenderInstances(sourceOpts: TimeSeriesRasterSource, tileScheme: TileInfo) {
            const viewCrs = view.spatialReference.toJSON();
            /** 1. 数据源 */
            const source = checkRasterSource(sourceOpts);
            if (isNil(layer.curTime)) layer.curTime = source.minTime;
            /** 2.初始化投影基本信息和worker */
            const tileSplitResult = await getTileSplit({
                col: source.col,
                row: source.row,
                srcExtent: source.extent,
                srcCrs: source.crs,
                dstCrs: viewCrs,
                dstTileScheme: {
                    ...tileScheme.toJSON(),
                    size: tileScheme.size,
                },
                padding: 8,
            });
            const fullExtent = new Extent({
                ...tileSplitResult.fullExtent,
                spatialReference: viewCrs,
            });
            const baseLevel = tileSplitResult.level; //重投影的level
            const baseLevelBounds = tileSplitResult.bounds; //baselevel tile边界[colmin, colmax, rowmin, rowmax],
            const baseTileIdSet = new Set(tileSplitResult.tileSplit.map((i) => i.id));
            const ports = (await createRasterProjectCtx()).map((i) => i.port);
            const workerCount = ports.length;
            const worker = await initRasterWorker({
                dataTimes: source.times,
                dataGetter: source.dataGetter,
                ports,
                splitResult: tileSplitResult,
                type: source.type,
                noDataValue: source.noDataValue,
                col: source.col,
                row: source.row,
                outputTexSize: TILE_SIZE,
                debug: layer.debug,
            });
            /** 3.构建瓦片资源加载器 */
            const buildPyramid = source.type !== "vector-field" && baseLevel > 1; //是否构建金字塔
            //每个等级的瓦片边界, 边界外的一定无数据
            const tileBoundsMap = createTileBoundMap(baseLevel, baseLevelBounds, tileScheme.lods.slice(-1)[0].level);
            const minLevel = buildPyramid ? findMinLevel(tileBoundsMap, baseLevel) : baseLevel;
            //(仅bound范围内)
            const getTileNode = createVTileTreeWithScheme({
                tileScheme,
                minLevel,
                maxLevel: baseLevel,
            });
            function getKey(tileId: string, time: number) {
                return [tileId, time].join(":");
            }
            const emptyKeySet = new Set<string>(); //某个tile在某个时间无数据
            //金字塔内空tile(仅bound范围内), 在任意时间均无数据,
            const boundsEmptyTileIdSet = resolveEmptyTileIdInBounds({
                baseLevel,
                baseTileIdSet,
                minLevel,
                boundsMap: tileBoundsMap,
            });
            //瓦片权重,用于统计加载进度
            const weightMap = createTileWeightMap(baseLevel, minLevel);

            let timeState: {
                curTime: number;
                beforeIndex: number;
                afterIndex: number;
                eagerTimes: number[]; //当前需要渲染的时间
                restTimes: number[]; //后续待渲染的时间
            };
            let tileState: {
                version: number;
                curRenderLevel: number; //当前渲染瓦片的等级
                curRenderLevelTileIds: string[]; //当前等级的bound内瓦片
                curBaseLevelTileIds: string[]; //baseLevel的bound内瓦片
                actuallyRenderExtent: __esri.Extent; //最大的渲染extent, 包含旋转的情况
            };
            let curRenderResource: {
                renderOpts: VFRenderOptsData | SimpleRenderOptsData;
                tiles: ReturnType<typeof getCurRenderTileResources>;
            };
            const tileResourceManager = initTileResourceManager();
            const { getResource, clearData, startLoad, stopLoad, toggleUniqueCodeMapping } = tileResourceManager;
            const requestNewFrame = (() => {
                let requested = false;
                return (force = true) => {
                    if (requested) return;
                    requested = true;
                    Promise.resolve()
                        .then(() => {
                            if (force) self.requestRender();
                            const tileRenderResources = getCurRenderTileResources();
                            if (!tileRenderResources) {
                                curRenderResource = null;
                                return;
                            }
                            const renderOptsData = renderOptsResource.getData();
                            if (!renderOptsData) {
                                curRenderResource = null;
                                return;
                            }
                            curRenderResource = {
                                renderOpts: renderOptsData,
                                tiles: tileRenderResources,
                            };
                            self.requestRender();
                        })
                        .finally(() => {
                            requested = false;
                        });
                };
            })();
            const getCurRenderTileResources = () => {
                if (!timeState || !tileState) return null;
                const { curTime, beforeIndex, afterIndex } = timeState;
                const { curRenderLevelTileIds, actuallyRenderExtent: renderExtent } = tileState;
                if (isNil(beforeIndex) || isNaN(beforeIndex) || isNil(afterIndex) || isNaN(afterIndex)) return null;
                if (!curRenderLevelTileIds?.length) return null;
                const curVTiles = curRenderLevelTileIds.map((i) => getTileNode(i));
                const EPSILON = 0.01;
                const { times, isSingle } = source;
                const beforeTime = times[beforeIndex],
                    afterTime = times[afterIndex];
                const percent = isSingle ? 0 : (curTime - beforeTime) / (afterTime - beforeTime);
                const renderTiles = curVTiles
                    .map((vt) => {
                        const res = recursionFind(vt);
                        return res;
                        function recursionFind(vt: VTileNode): {
                            vTileNode: VTileNode;
                            data1: RasterTileRenderResource;
                            data2: RasterTileRenderResource;
                            key1: string;
                            key2: string;
                            id: string;
                        }[] {
                            const { z, id } = vt;
                            const s1 = getResource(id, beforeTime);
                            const s2 = getResource(id, afterTime);
                            const key1 = getKey(id, beforeTime);
                            const key2 = getKey(id, afterTime);
                            if (isSingle) {
                                if (s1.ready)
                                    return s1.data
                                        ? [
                                            {
                                                id: vt.id,
                                                vTileNode: vt,
                                                data1: s1.data,
                                                data2: null,
                                                key1,
                                                key2,
                                            },
                                        ]
                                        : [];
                            } else {
                                if (s1.ready && s2.ready) {
                                    return s1.data || s2.data
                                        ? [{ id: vt.id, vTileNode: vt, data1: s1.data, data2: s2.data, key1, key2 }]
                                        : [];
                                } else {
                                    if (s1.ready && s1.data && percent < EPSILON)
                                        return [{ id: vt.id, vTileNode: vt, data1: s1.data, data2: null, key1, key2 }];
                                    if (s2.ready && s2.data && 1 - percent < EPSILON)
                                        return [{ id: vt.id, vTileNode: vt, data1: null, data2: s2.data, key1, key2 }];
                                }
                            }
                            if (z < baseLevel) {
                                const { children } = getTileNode(vt.id);
                                //继续找子节点
                                return children.map((child) => recursionFind(child)).flat();
                            } else {
                                return [];
                            }
                        }
                    })
                    .flat();
                return renderTiles.length
                    ? {
                        renderExtent,
                        renderTiles,
                        percent,
                    }
                    : null;
            };
            const renderOptsResource =
                source.type === "vector-field"
                    ? watchVectorFieldRenderOpts({
                        layer,
                        requestNewFrame,
                    })
                    : watchSimpleRenderOpts({
                        layer,
                        requestNewFrame,
                        toggleUniqueCodeMapping,
                    });
            renderOptsResource.startWatch();
            return {
                debugData: layer.debug
                    ? {
                        projectData: tileSplitResult.projectData,
                        tileSplit: tileSplitResult.tileSplit,
                    }
                    : null,
                fullExtent,
                start: () => {
                    startLoad();
                },
                stop: () => {
                    stopLoad();
                },
                destroy: () => {
                    stopLoad();
                    clearData(ReasonMap.dataSourceChange);
                    renderOptsResource.destroy();
                    worker.destroy();
                },
                render: (state: __esri.ViewState) => {
                    if (!curRenderResource) return;
                    if (!fullExtent.intersects(curRenderResource.tiles.renderExtent)) return;
                    const { viewport, framebuffer } = self.getRenderTarget();
                    const renderer = getRenderer(source.type);
                    renderer.render({
                        state,
                        ...curRenderResource.tiles,
                        fullExtent,
                        tileSize: TILE_SIZE,
                        //@ts-ignore
                        renderOptsData: curRenderResource.renderOpts,
                        viewport,
                        framebuffer,
                    });
                },
                loadStat: (t: number) => {
                    if (!timeState || !tileState) return 0;
                    const { minTime, maxTime, times } = source;
                    t = clamp(t, minTime, maxTime);
                    const [beforeIndex, afterIndex] = findIntervalIndexThatValueIn(times, t);
                    const beforeTime = times[beforeIndex],
                        afterTime = times[afterIndex];
                    const { curRenderLevel, curRenderLevelTileIds } = tileState;
                    if (!curRenderLevelTileIds.length) return 0;
                    const total = curRenderLevelTileIds.length * weightMap[curRenderLevel];
                    let ready = 0;
                    const viewportTiles = [...curRenderLevelTileIds];
                    for (let i = 0; i < viewportTiles.length; i++) {
                        const tileId = viewportTiles[i];
                        const node = getTileNode(tileId);
                        const s1 = getResource(tileId, beforeTime);
                        const s2 = getResource(tileId, afterTime);
                        if (s1.ready && s2.ready) {
                            ready += weightMap[node.z];
                        } else {
                            const children = node.children;
                            children && viewportTiles.push(...children.map((i) => i.id));
                        }
                    }
                    return ready / total;
                },
            };
            function initTileResourceManager() {
                type DownSamplingTaskDesc = { tileId: string; time: number; key: string };
                const reusePool = createReusePool<CanvasTexture>({
                    create: () => {
                        const tex = new CanvasTexture(null);
                        // reference: https://registry.khronos.org/webgl/specs/latest/1.0/#PIXEL_STORAGE_PARAMETERS,
                        // 6.10 Pixel Storage Parameters
                        // 如果image是ImageBitmap
                        // UNPACK_FLIP_Y_WEBGL, UNPACK_PREMULTIPLY_ALPHA_WEBGL, UNPACK_COLORSPACE_CONVERSION_WEBGL 会被忽略
                        // tex.flipY = true 不会生效, 我们需要去shader内手动翻转
                        tex.minFilter = tex.magFilter = NearestFilter;
                        tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
                        return tex;
                    },
                    disposeItem: (item) => item.dispose(),
                    size: 64,
                });
                const baseLevelScheduler = (() => {
                    const recordMap = new Map<string, RasterTileRecord>();
                    const baseCache = new LRUCache<RasterTileRenderResource, string>(
                        Math.max(baseTileIdSet.size * 5, 256),
                        {
                            onRemove(cacheResource, key, reason) {
                                recordMap.delete(key);
                                disposeResource(cacheResource);
                                layerLog("dispose", reason, key);
                            },
                        }
                    );
                    const scheduler = asyncTaskScheduler<RasterTileRecord, RasterTileProjectedData>({
                        invoke: (record) => {
                            record.status = EnumTaskStatus.pending;
                            const { key, tileId, time } = record;
                            if (!baseTileIdSet.has(tileId) || emptyKeySet.has(key)) {
                                return Promise.resolve({
                                    imagebitmap: null,
                                    costTime: 0,
                                } as RasterTileProjectedData);
                            } else {
                                return worker.getTileDataAtTime(tileId, time);
                            }
                        },
                        onSuccess(rawResult, record) {
                            const { tileId, time, key } = record;
                            const w = rawResult.worker;
                            record.status = EnumTaskStatus.finish;
                            if (rawResult?.imagebitmap) {
                                baseCache.add(key, {
                                    tex: buildTexture(rawResult.imagebitmap),
                                    range: rawResult.range,
                                    imagebitmap: rawResult.imagebitmap,
                                });
                                const msg = `Thread[${w.id}] done:${
                                    w.taskId
                                } tile:[${tileId}] time:[${time}] cost [${rawResult.costTime.toFixed(1)}]ms`;
                                layerLog(msg);
                                record.isEmpty = false;
                                requestNewFrame(false);
                            } else {
                                const msg = `Thread[${w?.id ?? "main"}] done:${
                                    w?.taskId || ""
                                } tile:[${tileId}] time[${time}] isEmpty`;
                                layerLog(msg);
                                record.isEmpty = true;
                                emptyKeySet.add(key);
                            }
                            if (!buildPyramid) return;
                            const { curRenderLevel } = tileState;
                            if (curRenderLevel < baseLevel) {
                                const { z, x, y } = getTileNode(tileId);
                                const parentId = getTileId(z - 1, Math.floor(x / 2), Math.floor(y / 2));
                                pyramidScheduler.addTask({ tileId: parentId, time, key: getKey(parentId, time) });
                            }
                        },
                        onError(error, record) {
                            if (isAbortError(error)) {
                                recordMap.delete(record.key);
                                return;
                            }
                            record.status = EnumTaskStatus.error;
                            layerLog(`加载 tile [${record.tileId}] at Time [${record.time}] 失败\n`, error);
                            throw error;
                        },
                        maxConcurrency: workerCount,
                    });
                    return {
                        //可能获取任意tile
                        getResource: (tileId: string, time: number, reinsert = false) => {
                            const key = getKey(tileId, time);
                            if (boundsEmptyTileIdSet.has(tileId) || emptyKeySet.has(key))
                                return { ready: true, data: null };
                            const record = recordMap.get(key);
                            const ready = record?.status === EnumTaskStatus.finish;
                            if (ready) {
                                return {
                                    ready,
                                    data: baseCache.get(key, reinsert),
                                };
                            } else {
                                return { ready: false, data: null as RasterTileRenderResource };
                            }
                        },
                        scheduleTask: (
                            tileIds: string[],
                            eagerTimes: number[],
                            restTimes: number[],
                            ignoreKeys: Set<string>
                        ) => {
                            tileIds = tileIds.filter((i) => baseTileIdSet.has(i));
                            scheduler.updateQueue((running) => {
                                const runningMap = running.reduce((res, cur) => {
                                    res[cur.desc.key] = 0;
                                    return res;
                                }, {} as Record<string, number>);
                                const todoList = [] as RasterTileRecord[];
                                for (
                                    let eagerIndex = eagerTimes.length - 1,
                                        allTimes = [...eagerTimes, ...restTimes],
                                        i = allTimes.length;
                                    i--;

                                ) {
                                    for (let j = tileIds.length; j--; ) {
                                        const key = getKey(tileIds[j], allTimes[i]);
                                        if (emptyKeySet.has(key) || ignoreKeys.has(key)) continue; //空
                                        const loaded = baseCache.get(key, i <= eagerIndex);
                                        if (loaded) continue; //加载完成
                                        let record = recordMap.get(key);
                                        if (!record) {
                                            const [tileId, time] = key.split(":");
                                            record = {
                                                key,
                                                tileId,
                                                time: +time,
                                                status: EnumTaskStatus.none,
                                                isEmpty: null,
                                            };
                                            recordMap.set(key, record);
                                            todoList.push(record);
                                        } else {
                                            if (record.status === EnumTaskStatus.error) continue;
                                            if (Reflect.has(runningMap, key)) {
                                                //正在进行
                                                runningMap[key]++;
                                            } else {
                                                todoList.push(record);
                                            }
                                        }
                                    }
                                }
                                running.forEach(({ desc, cancel }) => {
                                    if (runningMap[desc.key] === 0) {
                                        cancel && cancel(ReasonMap.lowPriorityTask);
                                    }
                                });
                                return todoList;
                            });
                        },
                        clear: (reason: any) => {
                            baseCache.clear(reason);
                            recordMap.clear();
                            scheduler.clear(reason);
                        },
                    };
                })();
                let isUniqueMapping = false;
                const pyramidScheduler = buildPyramid ? initPyramidScheduler() : null;
                const scheduleFetch = rafThrottle(() => {
                    if (!timeState || !tileState) return;
                    const { eagerTimes, restTimes } = timeState;
                    const { curRenderLevel, curRenderLevelTileIds, curBaseLevelTileIds } = tileState;
                    if (!eagerTimes.length && !restTimes.length) return;
                    if (!curRenderLevelTileIds.length && !curBaseLevelTileIds.length) return;

                    const ignoreBaseLevelTaskKeySet = new Set<string>();
                    if (buildPyramid && curRenderLevel < baseLevel) {
                        const readyParents = pyramidScheduler.scheduleTask(
                            curRenderLevel,
                            curRenderLevelTileIds,
                            eagerTimes,
                            restTimes
                        );
                        readyParents.forEach(([readyTileId, readyTimes]) => {
                            const node = getTileNode(readyTileId);
                            const arr = [...node.children];
                            while (arr.length) {
                                const item = arr.pop();
                                if (item.z === baseLevel) {
                                    readyTimes.forEach((t) => ignoreBaseLevelTaskKeySet.add(getKey(item.id, t)));
                                } else {
                                    arr.push(...item.children);
                                }
                            }
                        });
                    }
                    baseLevelScheduler.scheduleTask(
                        curBaseLevelTileIds,
                        eagerTimes,
                        restTimes,
                        ignoreBaseLevelTaskKeySet
                    );
                });
                //for debug
                const debugShowImageBitmap = (tileId: string, time: number) => {
                    const { z } = getTileNode(tileId);
                    const resource =
                        z === baseLevel
                            ? baseLevelScheduler.getResource(tileId, time)
                            : pyramidScheduler.getResource(tileId, time);
                    if (!resource.data) return;
                    showImageBitmap(resource.data.imagebitmap);
                };
                //初始化非baselevel金字塔
                function initPyramidScheduler() {
                    const pyramidCache = {} as Record<number /* level */, LRUCache<RasterTileRenderResource, string>>;
                    //构建金字塔
                    for (let z = baseLevel - 1; z >= minLevel; z--) {
                        const rangeTileCount = tileBoundsMap[z].count;
                        pyramidCache[z] = new LRUCache(rangeTileCount * 5 * Math.pow(2, baseLevel - z), {
                            onRemove(cacheResource, key, reason) {
                                disposeResource(cacheResource);
                                layerLog("dispose", reason, key);
                            },
                        });
                    }
                    const getResource = (tileId: string, time: number, reinsert = false) => {
                        const key = getKey(tileId, time);
                        if (boundsEmptyTileIdSet.has(tileId) || emptyKeySet.has(key))
                            return { ready: true, data: null };
                        const { z } = getTileNode(tileId);
                        const data = pyramidCache[z].get(key, reinsert);
                        return data ? { ready: true, data } : { ready: false, data: null };
                    };
                    const checkTileChildren = (parentId: string, time: number) => {
                        const { children } = getTileNode(parentId);
                        const resources = children.map((child) => {
                            if (child.z === baseLevel) {
                                return baseLevelScheduler.getResource(child.id, time);
                            } else {
                                return getResource(child.id, time);
                            }
                        });
                        const allReady = resources.every((i) => i.ready);
                        if (!allReady) {
                            return { ready: false, data: null };
                        } else {
                            return { ready: true, data: resources.map((i) => i.data) };
                        }
                    };
                    const isReady = (level: number, key: string) => {
                        return emptyKeySet.has(key) || pyramidCache[level].has(key);
                    };
                    const idleScheduler = idleSyncTaskScheduler<DownSamplingTaskDesc, { done: number }>({
                        beforeRun: (state) => {
                            state.done = 0;
                        },
                        invoke: ({ tileId, time, key }, state) => {
                            const { z, parent } = getTileNode(tileId);
                            // if (boundsEmptyTileIdSet.has(tileId)) {
                            //     debugger;
                            // }
                            // if (emptyKeySet.has(key)) {
                            //     debugger;
                            // }
                            // if (pyramidCache[z].has(key)) {
                            //     debugger;
                            // }
                            const childResource = checkTileChildren(tileId, time);
                            if (!childResource.ready) return;
                            if (childResource.data.every((i) => !i)) {
                                emptyKeySet.add(key);
                                layerLog(`downsampling tile [${tileId}] at time [${time}] isEmpty`);
                            } else {
                                const now = performance.now();
                                const result = downSamplingImageBitmap(childResource.data, TILE_SIZE, isUniqueMapping);
                                const costTime = (performance.now() - now).toFixed(2);
                                layerLog(`downsamplig tile [${tileId}] as time [${time}] cost [${costTime}]ms`);
                                pyramidCache[z].add(key, {
                                    ...result,
                                    tex: buildTexture(result.imagebitmap),
                                });
                                state.done++;
                            }
                            const { curRenderLevel } = tileState;
                            //例如z = 11, 当前渲染第10级, 4个11级合并成一个10级
                            if (z > curRenderLevel) {
                                idleScheduler.add([
                                    {
                                        tileId: parent.id,
                                        time,
                                        key: getKey(parent.id, time),
                                    },
                                ]);
                            }
                        },
                        afterRun: (state) => {
                            state.done && requestNewFrame(false);
                        },
                        idleRequestOptions: { timeout: 300 },
                    });
                    return {
                        cancelTaskInTimes: (times: Set<number> | Array<number>) => {
                            const cancels = Array.isArray(times) ? new Set(times) : times;
                            idleScheduler.applyFilter(({ time }) => cancels.has(time));
                        },
                        scheduleTask: (
                            level: number, //安排任务的等级
                            tileIds: string[], //tile id
                            eagerTimes: number[],
                            restTimes: number[]
                        ) => {
                            idleScheduler.applyFilter(({ tileId }) => getTileNode(tileId).z < level);

                            //已经完成的或者空瓦片, 用于剔除baseLevel子节点
                            const readyMap = new Map<string /*tileId*/, number[] /*times*/>();
                            const markReady = (tileId: string, time: number) => {
                                if (!readyMap.has(tileId)) readyMap.set(tileId, []);
                                readyMap.get(tileId).push(time);
                            };

                            const curTaskList = [] as DownSamplingTaskDesc[];
                            //eagers 立刻需要渲染的瓦片
                            for (let i = tileIds.length, before = eagerTimes[0], after = eagerTimes[1]; i--; ) {
                                const id = tileIds[i];
                                const key1 = getKey(id, before);
                                const key2 = getKey(id, after);
                                const ready1 = isReady(level, key1);
                                const ready2 = isReady(level, key2);
                                //2个时刻都完成才能渲染
                                if (ready1 && ready2) {
                                    //若2个都完成了, 使用当前级别的瓦片渲染, 该tile的子tile不需要加载
                                    markReady(id, before);
                                    markReady(id, after);
                                } else {
                                    !ready1 && curTaskList.push({ tileId: id, time: after, key: key2 });
                                    !ready2 && curTaskList.push({ tileId: id, time: before, key: key1 });
                                }
                            }
                            //rest 后续可能渲染的瓦片
                            for (let i = restTimes.length; i--; ) {
                                for (let j = tileIds.length; j--; ) {
                                    const id = tileIds[j],
                                        time = restTimes[i],
                                        key = getKey(id, time);
                                    if (isReady(level, key)) {
                                        //不是立即渲染, 对于完成的tile, 子tile无需加载
                                        markReady(id, time);
                                    } else {
                                        curTaskList.push({ tileId: id, time, key });
                                    }
                                }
                            }
                            idleScheduler.add(curTaskList);
                            return Array.from(readyMap.entries());
                        },
                        addTask: (desc: DownSamplingTaskDesc) => {
                            const { tileId, key } = desc;
                            // if (boundsEmptyTileIdSet.has(tileId)) {
                            //     debugger;
                            // }
                            if (emptyKeySet.has(key)) return;
                            const { z } = getTileNode(tileId);
                            const data = pyramidCache[z].get(key, false);
                            if (data) return;
                            idleScheduler.add([desc]);
                        },
                        clear: (reason: any) => {
                            idleScheduler.clear();
                            for (let z = minLevel; z < baseLevel; z++) {
                                pyramidCache[z].clear(reason);
                            }
                        },
                        getResource,
                    };
                }
                function buildTexture(imagebitmap: ImageBitmap) {
                    const tex = reusePool.get();
                    tex.image = imagebitmap;
                    tex.needsUpdate = true;
                    return tex;
                }
                function disposeResource(item: RasterTileRenderResource) {
                    item.imagebitmap.close();
                    item.tex.image = null;
                    reusePool.push(item.tex);
                }
                let delayTimer: NodeJS.Timeout;
                function handleTimeChange() {
                    if (!source.isSingle && (isNaN(layer.curTime) || isNil(layer.curTime))) {
                        timeState = null;
                        return;
                    }
                    const times = source.times;
                    const oldEagerTimes = timeState?.eagerTimes || [];
                    const oldRestTimes = timeState?.restTimes || [];
                    const curTime = clamp(layer.curTime, source.minTime, source.maxTime);
                    let timeIndexSet: Set<number>;
                    let beforeIndex: number, afterIndex: number;
                    if (source.isSingle) {
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
                    if (only1.length) {
                        //取消任务
                        pyramidScheduler && pyramidScheduler.cancelTaskInTimes(only1);
                        worker.cancelFrameAndTaskAtTimes(only1, ReasonMap.timeOutOfRange);
                    }
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
                function handleTilesChange() {
                    if (!self.tiles?.length) return;
                    const tilesChange = tileState?.version !== self._tilesVersion;
                    if (!tilesChange && tileState) {
                        tileState.actuallyRenderExtent = resolveViewRenderExtent(view);
                        return;
                    }

                    const newVersion = self._tilesVersion;
                    const curRenderLevel = clamp(self.tiles[0].level, minLevel, baseLevel);
                    let curRenderLevelTileIds = resolveCurRenderLevelTileIds(self.tiles, curRenderLevel);
                    let curBaseLevelTileIds: string[];
                    let actuallyRenderExtent: __esri.Extent;
                    if (!curRenderLevelTileIds.length) {
                        tileState = null;
                        return;
                    }
                    actuallyRenderExtent = resolveViewRenderExtent(view);

                    const { x, y } = actuallyRenderExtent.center;
                    const dirCache = {} as Record<string, number>;
                    curRenderLevelTileIds = curRenderLevelTileIds.sort((a, b) => {
                        const na = getTileNode(a);
                        const nb = getTileNode(b);
                        const dira = dirCache[a] ?? (dirCache[a] = Math.abs(na.cx - x) + Math.abs(na.cy - y));
                        const dirb = dirCache[b] ?? (dirCache[b] = Math.abs(nb.cx - x) + Math.abs(nb.cy - y));
                        return dira - dirb;
                    });
                    if (getTileNode(curRenderLevelTileIds[0]).z === baseLevel) {
                        curBaseLevelTileIds = curRenderLevelTileIds;
                    } else {
                        curBaseLevelTileIds = [];
                        const inputs = [...curRenderLevelTileIds];
                        while (inputs.length) {
                            const node = getTileNode(inputs.pop());
                            const childs = getChildrenTiles(node.z, node.x, node.y).map((i) =>
                                getTileId(i.z, i.x, i.y)
                            );
                            if (node.z === baseLevel - 1) {
                                curBaseLevelTileIds.push(...childs);
                            } else {
                                inputs.push(...childs);
                            }
                        }
                        curBaseLevelTileIds.reverse();
                    }
                    tileState = {
                        version: newVersion,
                        curRenderLevel,
                        curRenderLevelTileIds,
                        curBaseLevelTileIds,
                        actuallyRenderExtent,
                    };
                    scheduleFetch();

                    function resolveCurRenderLevelTileIds(
                        rawTiles: __esri.BaseLayerViewGL2DTile[],
                        targetLevel: number
                    ) {
                        //粗略的过滤掉bounds外的
                        const inputLevel = rawTiles[0].level;
                        const [xmin, xmax, ymin, ymax] = tileBoundsMap[inputLevel].bounds;
                        const rawInBounds = rawTiles
                            .map((i) => {
                                return { x: i.col, y: i.row, z: i.level };
                            })
                            .filter(({ x, y }) => {
                                return x >= xmin && x <= xmax && y >= ymin && y <= ymax;
                            });
                        if (!rawInBounds.length) return [];
                        //
                        let outIds: string[];
                        if (inputLevel === targetLevel) {
                            outIds = rawInBounds.map(({ z, x, y }) => getTileId(z, x, y));
                        } else if (inputLevel < targetLevel) {
                            outIds = [];
                            while (rawInBounds.length) {
                                const item = rawInBounds.pop();
                                const childs = getChildrenTiles(item.z, item.x, item.y);
                                if (item.z === targetLevel - 1) {
                                    outIds.push(...childs.map((i) => getTileId(i.z, i.x, i.y)));
                                } else {
                                    rawInBounds.push(...childs);
                                }
                            }
                        } else {
                            outIds = rawInBounds.map((i) => {
                                let z = i.z,
                                    x = i.x,
                                    y = i.y;
                                while (z > targetLevel) {
                                    z--;
                                    x = x >> 1;
                                    y = y >> 1;
                                }
                                return getTileId(z, x, y);
                            });
                            outIds = Array.from(new Set(outIds));
                        }
                        return boundsEmptyTileIdSet.size
                            ? outIds.filter((id) => !boundsEmptyTileIdSet.has(id))
                            : outIds;
                    }
                }
                let stopHandle: () => void;
                const startLoad = () => {
                    if (stopHandle) return;
                    const timeHandle = source.isSingle
                        ? (handleTimeChange(), null)
                        : reactiveUtils.watch(
                            () => layer.curTime,
                            () => {
                                handleTimeChange();
                                requestNewFrame();
                            },
                            { initial: true }
                        );
                    const tilesHandle = reactiveUtils.watch(
                        () => view.extent,
                        () => {
                            handleTilesChange();
                            requestNewFrame();
                        },
                        { initial: true }
                    );
                    stopHandle = () => {
                        timeHandle && timeHandle.remove();
                        tilesHandle.remove();
                    };
                };
                const stopLoad = () => {
                    stopHandle?.();
                    stopHandle = null;
                };
                return {
                    toggleUniqueCodeMapping: async (enable: boolean, codeMap: Map<number, number>) => {
                        curRenderResource = null;
                        timeState = null;
                        isUniqueMapping = enable;
                        stopLoad();
                        clearData(ReasonMap.codeMapChange);
                        await worker.toggleUniqueCodeMapping(enable, codeMap);
                        startLoad();
                    },
                    getResource: (tileId: string, time: number, reinsert?: boolean) => {
                        const level = getTileNode(tileId).z;
                        const manager = level === baseLevel ? baseLevelScheduler : pyramidScheduler;
                        return manager.getResource(tileId, time, reinsert);
                    },
                    clearData: (reason: any) => {
                        baseLevelScheduler.clear(reason);
                        pyramidScheduler && pyramidScheduler.clear(reason);
                        reusePool.clear();
                    },
                    startLoad,
                    stopLoad,
                };
            }
        }
        self.getLoadStat = (t: number) => {
            if (!renderInstances) return 0;
            return renderInstances.loadStat(t);
        };
        self._render = ({ state }) => {
            if (!renderInstances) return;
            renderInstances.render(state);
        };
        handlers.push({
            remove: () => {
                if (renderInstances) {
                    renderInstances.destroy();
                    renderInstances = null;
                }
                tileSplitWorker.destroy();
                projectFactory.destroy();
                destroyRenderer();
            },
        });
    }
    detach() {
        this._handlers.forEach((f) => f.remove());
        this._handlers = null;
    }
    render(params: __esri.BaseLayerViewGL2DRenderRenderParameters) {
        this._render?.(params);
    }
}

@subclass()
export class TimeSeriesRasterLayer extends Layer {
    private [ILayerIdKey]: number = getLayerUID();
    private _layerView: CustomLayerView;
    preload: PreloadOpts = { frame: 5 };
    debug: boolean;

    @property()
    showDebugBorder: boolean = false;

    constructor(props?: {
        source?: TimeSeriesRasterSource;
        curTime?: number;
        renderOpts?: Partial<RasterSimpleRenderOpts> | VectorFieldRenderOptsProperties;
        effect?: __esri.Effect;
        tileInfo?: __esri.TileInfoProperties;
        preload?: PreloadOpts;
    }) {
        super();
        Object.assign(this, props);
    }

    @property()
    debugData: {
        tileSplit: (Omit<RasterProjectSplitTileResult, "tileInfo"> & { id: string })[];
        projectData: ArrugatorOutput;
    };

    @property()
    effect: __esri.Effect;

    @property({
        type: TileInfo,
    })
    tileInfo: TileInfo;

    @property()
    source: TimeSeriesRasterSource;

    @property()
    curTime: number;

    @property({
        cast: (value: any) => {
            if (!value) return undefined;
            if ("__accessor__" in value) return value;
            switch (value.type) {
                case "vector-field":
                    return new VectorFieldRenderOpts(value);
                case "simple":
                    return new RasterSimpleRenderOpts(value);
                default:
                    throw TsRasterError(`无效的renderOpts.type:${value.type}`);
            }
        },
    })
    renderOpts: RasterSimpleRenderOpts | VectorFieldRenderOpts;

    getLoadStat(time: number) {
        if (!this._layerView) return 0;
        return this._layerView.getLoadStat?.(time);
    }

    createLayerView(view: MapView) {
        if (view.type !== "2d") throw new Error("不支持3d");
        if (!this.tileInfo) {
            const viewCrs = (view as __esri.MapView).spatialReference;
            if (
                !viewCrs.equals({ wkid: 4326 } as __esri.SpatialReference) &&
                !viewCrs.equals({ wkid: 3857 } as __esri.SpatialReference)
            ) {
                console.warn("mapView.spatialReference非4326/3857坐标系时,必须指定 TimeSeriesRasterLayer.tileInfo");
            } else {
                this.tileInfo = TileInfo.create({
                    size: 256,
                    spatialReference: view.spatialReference.toJSON(),
                });
            }
        }
        if (this.tileInfo.size[0] !== TILE_SIZE) {
            throw new Error(`TimeSeriesRasterLayer.tileInfo当前仅支持大小为${TILE_SIZE}的瓦片!`);
        }
        const lyView = (this._layerView = new CustomLayerView({
            view: view,
            //@ts-ignore
            layer: this,
        }));
        return Promise.resolve(lyView);
    }
}
