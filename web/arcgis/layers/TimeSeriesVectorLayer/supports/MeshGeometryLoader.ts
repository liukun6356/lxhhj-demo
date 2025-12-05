import Accessor from "@arcgis/core/core/Accessor";
import { subclass } from "@arcgis/core/core/accessorSupport/decorators";
import { assert } from "es-toolkit";
import { EventedMixin } from "web/arcgis/supports/EventedMixin";
import { openArcgisWorker, wrapMessagePort } from "web/arcgis/supports/worker-helper";
import { type MeshWorker, openMeshManager_entire } from "web/arcgis/worker";
import { randomUUID } from "web/utils/misc";
import { type Attribute, createAttribute, createVAO, createVBO } from "web/utils/webgl/buffer";
import { type ArrayInstancedDrawInfo } from "web/utils/webgl/draw";
import { createTexture } from "web/utils/webgl/texture";
import { TimeSeriesVectorLayerView } from "../layer";

import type { BBox } from "geojson";
import { BufferDataType, DrawMode } from "web/utils/webgl/constant";
import type { RenderModeKey } from "../interface";
import { TsAttrBindingMesh } from "../renderer/mesh/mesh";
import { MeshGeometry } from "./MeshGeometry";


type LoadComponents = 'EncodeXY' | 'Z' | 'VertexIndex';

@subclass()
export class MeshGeometryLoader extends EventedMixin(Accessor)<{
    'drawZ-loaded': void,
    'drawMesh-loaded': void,
    'drawWireframe-loaded': void,
}> {
    type = 'mesh' as const;
    uuid = randomUUID();
    layerView: TimeSeriesVectorLayerView;
    gl: WebGL2RenderingContext;
    meta: PromiseResult<MeshWorker.WorkerAPI['init']>;
    bbox: BBox;
    zRange: number[];
    private _init: Promise<any>;
    private _worker: PromiseResult<typeof createMeshWorker>;
    constructor(geometry: MeshGeometry, layerView: TimeSeriesVectorLayerView) {
        super();
        this.layerView = layerView;
        this.gl = layerView.context;
        this._init = createMeshWorker()
            .then(w => {
                assert(!this.destroyed, 'allready destroyed');
                this._worker = w;
                return w.init({
                    sourceCrs: geometry.spatialReference.toJSON(),
                    vertices: geometry.vertices,
                    indices: geometry.indices,
                    type: geometry.primitiveType,
                    targetCrs: layerView.view.spatialReference.toJSON(),
                });
            }).then(stat => {
                geometry._loaderPromise.resolve(this);
                assert(!this.destroyed, 'allready destroyed');
                assert(stat.vertexCount > 0, '顶点不能为空');
                assert(stat.meshCount > 0, '网格不能为空');
                this.meta = stat;
            }).catch(e => {
                geometry._loaderPromise.reject('创建loader失败');
                throw e;
            });
    }

    private _meshDraw: {
        vao: WebGLVertexArrayObject,
        drawInfo: ArrayInstancedDrawInfo
    };
    private _wireframeDraw: {
        vao: WebGLVertexArrayObject,
        drawInfo: ArrayInstancedDrawInfo
    };
    private _textureEncodeXY: WebGLTexture;
    private _textureZ: WebGLTexture;
    private _vbos = {} as Record<
        'index_mesh' | 'index_wireframe' | 'instance_vertexIndex' | 'instance_meshIndex',
        { vbo: WebGLBuffer, attribute: Attribute }
    >;

    private _loadPromise = {} as Record<
        LoadComponents | 'drawMesh' | 'drawZ' | 'drawWireframe',
        {
            promise: Promise<any>
        }
    >;
    destroy(): void {
        super.destroy();
        [this._meshDraw, this._wireframeDraw].filter(Boolean).forEach(i => this.gl.deleteVertexArray(i.vao));
        [this._textureEncodeXY, this._textureZ].filter(Boolean).forEach(i => this.gl.deleteTexture(i));
        Object.values(this._vbos).forEach(i => this.gl.deleteBuffer(i.vbo));

        this._meshDraw = this._wireframeDraw = null;
        this._textureEncodeXY = this._textureZ = null;
        this._vbos = null;
        this._loadPromise = null;
        this._worker.destroy();
    }
    private _loadMeshDrawBuffer() {
        return this._vbos['index_mesh'] ??= {
            vbo: createVBO(this.gl, {
                srcData: this.meta.primitiveType === 'quad'
                    ? new Int8Array([0, 1, 2, 3])
                    : new Int8Array([0, 1, 2])
            }),
            attribute: createAttribute({
                name: 'index_mesh',
                format: 'int',
                type: BufferDataType.i8
            })
        }
    }

    private _loadEncodeXY() {
        const record = (this._loadPromise['EncodeXY'] ??= {
            promise: this._init
                .then(() => this._worker['getEncodeXY']())
                .then(({ data, bbox }) => {
                    assert(!this.destroyed, 'allready destroyed');
                    const { gl, meta } = this;
                    this.bbox = bbox;
                    this._textureEncodeXY = createTexture(gl, {
                        src: data,
                        type: gl.FLOAT,
                        internalformat: gl.RGBA32F,
                        format: gl.RGBA,
                        width: meta.vertexTexSize[0],
                        height: meta.vertexTexSize[1],
                        flipY: false,
                        minFilter: gl.NEAREST,
                        magFilter: gl.NEAREST,
                        unpackAlign: 4,
                        premultiplyAlpha: false,
                        wrapS: gl.CLAMP_TO_EDGE,
                        wrapT: gl.CLAMP_TO_EDGE,
                    });
                    this._textureEncodeXY._msg = 'mesh-encodeXY'
                })
                .finally(() => {
                    //free memory
                    this._loadPromise['EncodeXY'].promise = null;
                })
        });
        return record.promise;
    }
    private _loadZ() {
        const record = (this._loadPromise['Z'] ??= {
            promise: this._init
                .then(() => this._worker['getZ']())
                .then(({ data, range }) => {
                    assert(!this.destroyed, 'allready destroyed');
                    const { gl, meta } = this;
                    this.zRange = range;
                    this._textureZ = createTexture(gl, {
                        src: data,
                        type: gl.FLOAT,
                        internalformat: gl.R32F,
                        format: gl.RED,
                        width: meta.vertexTexSize[0],
                        height: meta.vertexTexSize[1],
                        flipY: false,
                        minFilter: gl.NEAREST,
                        magFilter: gl.NEAREST,
                        unpackAlign: 4,
                        premultiplyAlpha: false,
                        wrapS: gl.CLAMP_TO_EDGE,
                        wrapT: gl.CLAMP_TO_EDGE,
                    });
                    this._textureZ._msg = 'mesh-z';
                })
                .finally(() => {
                    this._loadPromise['Z'].promise = null;
                })
        });
        return record.promise;
    }
    private _loadVertexIndex() {
        const record = (this._loadPromise['VertexIndex'] ??= {
            promise: this._init
                .then(() => this._worker['getVertexIndex']())
                .then(({ buffer, layout }) => {
                    assert(!this.destroyed, 'allready destroyed');
                    this._vbos['instance_vertexIndex'] = {
                        vbo: createVBO(this.gl, buffer),
                        attribute: createAttribute(layout)
                    };
                })
                .finally(() => {
                    this._loadPromise['VertexIndex'].promise = null;
                })
        });
        return record.promise;
    }
    private _buildMeshDraw() {
        this._meshDraw ??= {
            vao: createVAO(
                this.gl,
                {
                    [TsAttrBindingMesh['index_mesh']]: this._loadMeshDrawBuffer(),
                    [TsAttrBindingMesh['instance_vertexIndex']]: this._vbos['instance_vertexIndex']
                }
            ),
            drawInfo: {
                mode: DrawMode.TriangleFan,
                first: 0,
                count: this.meta.primitiveType === 'triangle' ? 3 : 4,
                instanceCount: this.meta.meshCount
            }
        };
    }
    loadDrawMesh() {
        const record = this._loadPromise['drawMesh'] ??= {
            promise: Promise.all([
                this._loadEncodeXY(),
                this._loadVertexIndex(),
            ]).then(() => {
                assert(!this.destroyed, 'allready destroyed');
                this._buildMeshDraw();
                this.emit('drawMesh-loaded');
            })
        };
        return record.promise;
    }
    loadDrawZ() {
        const record = this._loadPromise['drawZ'] ??= {
            promise: Promise.all([
                this._loadEncodeXY(),
                this._loadZ(),
                this._loadVertexIndex(),
            ]).then(() => {
                assert(!this.destroyed, 'allready destroyed');
                this._buildMeshDraw();
                this.emit('drawZ-loaded');
            })
        };
        return record.promise;
    }
    loadDrawWireframe() {
        const record = this._loadPromise['drawWireframe'] ??= {
            promise: Promise.all([
                this._loadEncodeXY(),
                this._loadVertexIndex(),
            ]).then(() => {
                assert(!this.destroyed, 'allready destroyed');
                this._wireframeDraw ??= {
                    vao: createVAO(
                        this.gl,
                        {
                            [TsAttrBindingMesh['index_mesh']]: this._loadMeshDrawBuffer(),
                            [TsAttrBindingMesh['instance_vertexIndex']]: this._vbos['instance_vertexIndex'],
                        }
                    ),
                    drawInfo: {
                        mode: DrawMode.LineLoop,
                        first: 0,
                        count: this.meta.primitiveType === 'triangle' ? 3 : 4,
                        instanceCount: this.meta.meshCount
                    }
                };
                this.emit('drawWireframe-loaded');
            })
        };
        return record.promise;
    }
    ready(z: boolean) {
        return (z ? !!this._textureZ : true) && !!this._meshDraw;
    }
    getRenderData(drawType: RenderModeKey) {
        if (drawType === 'mesh' || drawType === 'z') {
            return {
                ...this._meshDraw,
                texture_encodeXY: this._textureEncodeXY,
                texture_z: this._textureZ,
                zRange: this.zRange,
            }
        } else {
            return {
                ...this._wireframeDraw,
                texture_encodeXY: this._textureEncodeXY,
                texture_z: null,
                zRange: null,
            }
        }
    }
    getZRange() {
        return this._loadZ().then(() => this.zRange);
    }
}

function createMeshWorker() {
    const { port1, port2 } = new MessageChannel();
    const worker = openArcgisWorker({
        strategy: 'dedicated'
    });
    return worker.invoke<typeof openMeshManager_entire>(
        "openMeshManager_entire",
        port1,
        { transferList: [port1] }
    ).then(() => {
        const handle = wrapMessagePort<MeshWorker.WorkerAPI & {
            destroy: () => void,
        }>(port2, {}, [
            'init',
            'getEncodeXY',
            'getZ',
            'getVertexIndex'
        ]);
        //@ts-ignore
        handle.destroy = () => {
            port1.close();
            port2.close();
        };
        return handle;
    }).finally(() => {
        worker.destroy();
    });
}
