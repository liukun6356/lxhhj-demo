import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import has from "@arcgis/core/core/has";
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import Layer from "@arcgis/core/layers/Layer";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import BaseLayerViewGL2D from "@arcgis/core/views/2d/layers/BaseLayerViewGL2D";
import { debounce } from "es-toolkit";
import type { BBox } from "geojson";
import { LRUCache } from "lru-cache";
import { toRadians } from "shared/utils/math";
import { bboxCenter, bboxSize, getTileInfoWorldBBox, isBBoxOverlap, length, bboxTranslate } from "web/arcgis/supports/bbox";
import { getTileKey, tileKeyToXYZ, wrapTileIndex } from "web/arcgis/supports/tile";
import { createReprojDebug } from "./debug";
import { createTileRenderProgram } from "./render-program";
import { ReprojTile } from "./ReprojTile";
import { createSrcTileLoader } from "./sourceLoader";
import { getReprojWorker } from "./utils";
@subclass()
export class ReprojTileLayer extends Layer {
    @property({
        type: TileInfo
    })
    tileInfo: __esri.TileInfo;

    @property()
    source: {
        cacheKey?: string,
        forceReload?: boolean,
        url: string,
        tileInfo: __esri.TileInfo,
    }

    constructor(options?: {
        source?: ReprojTileLayer['source'],
        tileInfo?: __esri.TileInfo,
    } & Partial<__esri.LayerProperties>) {
        super();
        Object.assign(this, options);
    }

    createLayerView(view: __esri.View) {
        if (view.type === '3d') return null;
        const lyView = new ReprojTileLayerView({
            view: view as __esri.MapView,
            //@ts-ignore
            layer: this,
        });
        return Promise.resolve(lyView);
    }
}

@subclass()
export class ReprojTileLayerView extends BaseLayerViewGL2D {
    layer: ReprojTileLayer;

    private _debugTile: ReturnType<typeof createReprojDebug>;
    private _srcTileLoader: ReturnType<typeof createSrcTileLoader>;
    private _cache = new LRUCache<string, ReprojTile>({
        max: 512,
        dispose: d => d.destory()
    });
    private _program: ReturnType<typeof createTileRenderProgram>;
    private _empty = new Set<string>();
    private _ready = false;

    @property()
    effectiveTiles = [] as __esri.BaseLayerViewGL2DTile[];

    private _navigate: 'zoom-in' | 'zoom-out';
    async attach() {
        const { layer, context: gl, view } = this;
        this._program = createTileRenderProgram(gl);
        this._debugTile = has('debug-reproj-tile') ? createReprojDebug(this) : null;
        this.addHandles(reactiveUtils.watch(
            () => [layer.tileInfo, layer.source] as const,
            async ([targetTileInfo, source]) => {
                if (!targetTileInfo || !source) {
                    //todo: destroy old
                    this._ready = false;
                    this._doClear();
                    return;
                }
                this._ready = true;
                this._srcTileLoader = createSrcTileLoader({
                    requestRender: () => this.requestRender(),
                    getReprojTile: key => this._cache.get(key),
                    fecthMethod: (key: string, signal: AbortSignal) => {
                        const { promise, resolve, reject } = Promise.withResolvers<ImageBitmap>();
                        let { level, col, row } = tileKeyToXYZ(key);
                        if (this.layer.tileInfo.isWrappable) col = wrapTileIndex(level, col);
                        const fetchUrl = source.url.replace(/\{(?:z|level)\}/g, level + '')
                            .replace(/\{(?:x|col)\}/g, col + '')
                            .replace(/\{(?:y|row)\}/g, row + '');
                        fetch(fetchUrl, { signal })
                            .then(res => res.blob())
                            .then(blob => createImageBitmap(blob))
                            .then(imagebitmap => {
                                if (signal.aborted) {
                                    imagebitmap.close();
                                    reject(signal.reason);
                                } else {
                                    resolve(imagebitmap)
                                }
                            })
                            .catch(reject);
                        return promise;
                    }
                });
                if (this.tiles.length) {
                    this._handleTileChange();
                    this._handleTileChange.flush();
                }
            },
            { initial: true }
        ));
        this.addHandles(reactiveUtils.watch(
            () => view.scale,
            (s, old) => {
                this._navigate = (s <= old ? 'zoom-in' : 'zoom-out');
            },
            { initial: true }
        ));
    }

    private _resolveParent(key: string) {
        let { level, col, row } = tileKeyToXYZ(key);
        const minLevel = this.layer.tileInfo.lods[0].level;
        while (level > minLevel) {
            level -= 1;
            col = Math.floor(col / 2);
            row = Math.floor(row / 2);
            const parentKey = getTileKey({ level, row, col });
            const parent = this._cache.get(parentKey);
            if (!parent) return null;
            if (parent.canRender()) return parent;
        }
        return null;
    }
    render({ state }: __esri.BaseLayerViewGL2DRenderRenderParameters) {
        const { context: gl, layer } = this;
        const renders = [] as { bbox: BBox, reprojTile: ReprojTile, level: number }[];
        const worldBBox = getTileInfoWorldBBox(layer.tileInfo);

        this.effectiveTiles.forEach(t => {
            const key = getTileKey(t);
            if (this._empty.has(key)) return;
            const reprojTile = this._cache.get(key);
            const canRender = reprojTile && reprojTile.canRender();
            if (canRender) {
                renders.push({
                    bbox: bboxTranslate(t.bounds as BBox, [t.world * worldBBox[0], 0]),
                    level: t.level,
                    reprojTile,
                });
            }
            if (reprojTile && (!canRender || !reprojTile.allSettled)) {
                const parentTile = this._resolveParent(reprojTile.key);
                parentTile && renders.push({
                    bbox: bboxTranslate(parentTile.tile.bounds as BBox, [t.world * worldBBox[0], 0]),
                    level: parentTile.tile.level,
                    reprojTile: parentTile
                })
            }
        });
        if (!renders.length) return;
        renders.forEach(i => i.reprojTile.update());
        renders.sort((a, b) => a.level - b.level);

        const { uniforms, vao, program } = this._program;
        //@ts-ignore
        const dpr = state.pixelRatio as number;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const rad = toRadians(state.rotation);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform2f(uniforms.u_screenSize, state.size[0] * dpr, state.size[1] * dpr);
        gl.uniform1i(uniforms.u_map, 0);
        gl.uniformMatrix3fv(uniforms.u_rotate, false, [
            cos, sin, 0,
            -sin, cos, 0,
            0, 0, 1,
        ]);
        gl.bindVertexArray(vao);

        for (let { bbox, reprojTile } of renders) {
            const tileSize = bboxSize(bbox);
            const center = bboxCenter(bbox);
            const centerScreen = state.toScreen([], center[0], center[1]);
            gl.uniform2fv(uniforms.u_tileCenterScreenPos, centerScreen);
            gl.uniform2f(uniforms.u_tileScreenSize, tileSize[0] / state.resolution * dpr, tileSize[1] / state.resolution * dpr);
            gl.bindTexture(gl.TEXTURE_2D, reprojTile.texture);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        gl.bindVertexArray(null);
    }

    private applyFilter(tiles: __esri.BaseLayerViewGL2DTile[]) {
        if (!this.layer.tileInfo.isWrappable) {
            return tiles.filter(i => isBBoxOverlap(i.bounds as BBox, getTileInfoWorldBBox(this.layer.tileInfo)));
        } else {
            return tiles;
        }
    }

    tilesChanged(): void {
        if (!this._ready) return;
        this._handleTileChange();
    }

    private _oldTileQueue = [] as ReprojTile[];

    private _handleTileChange = debounce(function (this: ReprojTileLayerView) {
        this.effectiveTiles = this.applyFilter(this.tiles);
        if (!this.effectiveTiles.length) return;
        const keys = new Set<string>();
        let queue = [] as ReprojTile[];
        for (let tile of this.effectiveTiles) {
            const key = getTileKey(tile);
            if (this._empty.has(key)) continue;
            if (!this._cache.has(key)) {
                const reprojTile = new ReprojTile({
                    key,
                    targetTile: tile,
                    targetTileInfo: this.layer.tileInfo,
                    sourceTileInfo: this.layer.source.tileInfo,
                    gl: this.context,
                    storeKey: this.layer.source.cacheKey
                });
                this._cache.set(key, reprojTile);
                reprojTile.once('init', () => {
                    if (reprojTile.isEmpty) {
                        this._cache.delete(key);
                        this._empty.add(key);
                    } else {
                        const tileZ = reprojTile.tile.level;
                        const curZ = this.tiles[0].level;
                        if (tileZ === curZ
                            || this._navigate === 'zoom-in' && tileZ === curZ + 1 //next level
                            || this._navigate === 'zoom-out' && tileZ === curZ - 1 //parent level
                        ) {
                            this._handleTileChange();
                        }
                    }
                });
                reprojTile.on('detach', ({ srcKey }) => {
                    this._srcTileLoader.detachImagebitmap(reprojTile, srcKey);
                });
            }
            const reprojTile = this._cache.get(key);
            if (reprojTile.allSettled) continue;
            if (reprojTile.initialized) {
                keys.add(key);
                queue.push(reprojTile);
            }
        }
        if (!queue.length) return;
        queue.push(...this._oldTileQueue.filter(i => {
            if (keys.has(i.key)) return false;
            return keys.add(i.key), true;
        }));
        const curScale = this.effectiveTiles[0].scale;
        const aborts = [] as ReprojTile[];
        queue = queue.filter(i => {
            const tileScale = i.tile.scale;
            if (tileScale === curScale) return true;
            //相差一级的暂时保留
            if (tileScale > curScale && Math.round(tileScale / curScale) <= 2) return true;
            if (tileScale < curScale && Math.round(curScale / tileScale) <= 2) return true;
            aborts.push(i);
            return false;
        });
        const viewCenter = [this.view.center.x, this.view.center.y];
        const groupPriority = (scale: number) => {
            if (scale === curScale) return 0;
            if (
                scale < curScale && this._navigate === 'zoom-in'
                || scale > curScale && this._navigate === 'zoom-out'
            ) return 1;
            return 2;
        };
        queue.sort((a, b) => {
            const v1 = groupPriority(a.tile.scale);
            const v2 = groupPriority(b.tile.scale);
            if (v1 === v2) {
                const ca = bboxCenter(a.tile.bounds as BBox);
                const cb = bboxCenter(b.tile.bounds as BBox);
                return length(ca, viewCenter) - length(cb, viewCenter);
            } else {
                return v1 - v2;
            }
        });
        this._oldTileQueue = queue;
        //console.log(this._navigate, queue.map(i => i.key), aborts.map(i => i.key));

        this._srcTileLoader.updateLoad(queue.map((i, index) => {
            return { reprojTile: i, priority: index }
        }), aborts);
    }, 60, { edges: ['trailing'] });

    private _doClear() {
        this._cache.clear();
        this._empty.clear();
        this._oldTileQueue.length = 0;
        this._srcTileLoader?.destroy();
        this._srcTileLoader = null;
    }

    destroy(): void {
        super.destroy();
        this._doClear();
        this._debugTile?.destroy();
        this._program?.destory();
    }
}

