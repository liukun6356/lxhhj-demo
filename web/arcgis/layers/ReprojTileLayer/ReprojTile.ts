import has from "@arcgis/core/core/has";
import { assert } from "es-toolkit";
import { EventEmitter } from "web/utils/EventEmitter";
import { throwIfNotAbortError } from "web/utils/misc";
import { createTexture } from "web/utils/webgl/texture";
import { reproj_webgl } from "./reproj";
import { getReprojWorker } from "./utils";

export class ReprojTile extends EventEmitter<{
    'init': void;
    'attach': { srcKey: string, imagebitmap: ImageBitmap },
    'detach': { srcKey: string, imagebitmap: ImageBitmap },
}> {
    isEmpty: boolean;

    key: string;
    tile: __esri.BaseLayerViewGL2DTile;
    tileSize: number[];

    gl: WebGL2RenderingContext;
    texture: WebGLTexture;
    private _imagebitmap: ImageBitmap;
    private _fromCache = false;
    private _initialized = false;
    private _settledCount = 0;
    private _storeKey: string;
    get initialized() { return this._initialized };
    get allSettled() { return this._fromCache || this._settledCount === this.srcTileCount }

    srcAtlasPixelSize: number[];
    srcAtlas: Record<string, {
        key: string,
        dxdy: number[],
        imagebitmap?: ImageBitmap,
        status?: 'success' | 'error'
    }>;
    meshBuffer: Float32Array;

    private srcTileCount: number;

    private _debug = has('debug-reproj-tile');
    private _disposed = false;
    private _dirty = false;
    private _destroyed = false;

    private _abortInit: AbortFn;
    constructor(opts: {
        key: string,
        targetTile: __esri.BaseLayerViewGL2DTile,
        targetTileInfo: __esri.TileInfo,
        sourceTileInfo: __esri.TileInfo,
        gl: WebGL2RenderingContext,
        storeKey?: string,
    }) {
        super();
        this.key = opts.key;
        this.gl = opts.gl;
        this.isEmpty = false;
        this.tileSize = opts.targetTileInfo.size;
        this.tile = opts.targetTile;
        this._storeKey = opts.storeKey;
        const ac = new AbortController();
        getReprojWorker().getReprojFromStoreOrCalc({
            storeKey: opts.storeKey,
            targetTile: opts.targetTile,
            targetTileInfo: opts.targetTileInfo.toJSON(),
            sourceTileInfo: opts.sourceTileInfo.toJSON(),
        }, { signal: ac.signal })
            .then(res => {
                if (!res) {
                    this.isEmpty = true;
                } else {
                    this.isEmpty = false;
                    if (res instanceof ImageBitmap) {
                        console.log(`from store:${this.key}`)
                        this._imagebitmap = res;
                        this._fromCache = true;
                        this._dirty = true;
                    } else {
                        this.srcTileCount = res.srcTileCount;
                        this.srcAtlasPixelSize = res.srcAtlasPixelSize;
                        this.srcAtlas = res.srcAltas;
                        this.meshBuffer = res.meshBuffer;
                    }
                }
                this._initialized = true;
                this.emit('init');
            })
            .catch(throwIfNotAbortError)
            .finally(() => {
                this._abortInit = null;
            });
        this._abortInit = () => ac.abort()
    }

    setSrcTile(srcKey: string, data: ImageBitmap, error?: boolean) {
        const item = this.srcAtlas[srcKey];
        assert(!!item, '不存在');
        if (error) {
            item.status = 'error';
        } else {
            item.status = 'success';
            assert(!item.imagebitmap, '重复设置');
            item.imagebitmap = data;
            this._dirty = true;
        }
        this._settledCount++;
    }


    update() {
        if (!this._dirty) return;
        const { gl } = this;
        const self = this;
        this.texture ??= createTexture(gl, {
            src: null,
            width: this.tileSize[0],
            height: this.tileSize[1],
            internalformat: gl.RGBA,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            minFilter: gl.NEAREST,
            magFilter: gl.NEAREST,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE
        });
        const curImagebitmap = this._fromCache
            ? this._imagebitmap
            : reproj_webgl({
                srcAtlas: Object.keys(this.srcAtlas).map(id => {
                    const item = this.srcAtlas[id];
                    if (item.status !== 'success') return null
                    return {
                        dxdy: item.dxdy,
                        imagebitmap: item.imagebitmap
                    }
                }).filter(Boolean),
                srcAtlasSize: this.srcAtlasPixelSize,
                tileSize: this.tileSize,
                meshBuffer: this.meshBuffer
            });
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // 无需设置, 对imagebitmap 无效
        //  UNPACK_ALIGNMENT 
        //  UNPACK_PREMULTIPLY_ALPHA_WEBGL 
        //  UNPACK_FLIP_Y_WEBGL
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, curImagebitmap);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this._dirty = false;
        if (this._fromCache) {
            //缓存模式
            if (!this._debug) {
                this._imagebitmap.close();
                this._imagebitmap = null;
            }
            return;
        } else {
            //构建模式
            this._imagebitmap?.close(); //destroy old
            this._imagebitmap = null;
            //持久化
            if (this._storeKey && this.allSettled) {
                Promise.all([
                    this._debug ? createImageBitmap(curImagebitmap) //克隆一份用于debug
                        : Promise.resolve(curImagebitmap),
                    getReprojWorker()
                ]).then(([data, worker]) => {
                    worker.saveReprojTileResult({
                        targetTileKey: this.key,
                        imagebitmap: data,
                        storeKey: this._storeKey
                    }, { transferList: [data] }) //转移所有权,
                }).then(() => {
                    if (!this._debug) this.disposeResource(); //释放缓存
                    console.log(`save ${this.key}`)
                });
            } else {
                //非持久化或者未完成
                if (this._debug) {
                    this._imagebitmap = curImagebitmap;
                } else {
                    curImagebitmap.close();
                    this.allSettled && this.disposeResource();
                }
            }
        }
    }

    canRender() {
        if (this.allSettled) return true;
        for (let key in this.srcAtlas) {
            if (this.srcAtlas[key].status === 'success') return true;
        }
        return false;
    }

    private disposeResource() {
        if (this._disposed) return;
        this._disposed = true;
        for (let srcKey in this.srcAtlas) {
            this.emit('detach', {
                srcKey,
                imagebitmap: this.srcAtlas[srcKey].imagebitmap
            });
        }
        this.meshBuffer = null;
        this.srcAtlas = null;
    }

    destory() {
        if (this._destroyed) return;
        this._destroyed = true;
        this._abortInit?.();
        this._imagebitmap?.close();
        this._imagebitmap = null;
        super.destroy();
        this.disposeResource();
    }
}

