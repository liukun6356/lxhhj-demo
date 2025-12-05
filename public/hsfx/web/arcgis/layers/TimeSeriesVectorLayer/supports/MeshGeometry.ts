import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import { assert } from "es-toolkit";
import { type MeshWorker } from "web/arcgis/worker/mesh";
import { MeshGeometryLoader } from "./MeshGeometryLoader";


export type MeshType = 'triangle' | 'quad'; //三角形网格 or 四边形网格

export interface BufferSource {
    data: number[] | TypedArray,
    stride: number, //每组的步长
}

/**
 * data: [id0,x0,y0,z0,w0, id1,x1,y1,z1,w1, .....],
 * stride = 5,  point(id, x, y, z, w) 
 * xIndex = 1,
 * yIndex = 2,
 * zIndex = 3,
 */
export interface VertexBufferSource extends BufferSource {
    x: number;  // x在stride中的偏移
    y: number;  // y在stride中的偏移
    z?: number; // z在stride中的偏移
}

export interface IndicesBufferSource extends BufferSource {
    components?: number[]; // 构成网格的各顶点在stride中的偏移， 三角形为[ia,ib,ic]默认[0,1,2] , 四边形为[a,b,c,d]默认[0,1,2,3]
}


export interface MeshGeometryProperties {
    type: "mesh",
    vertices: VertexBufferSource;
    indices: IndicesBufferSource;
    primitiveType: MeshType
    spatialReference: __esri.SpatialReference | __esri.SpatialReferenceProperties;
}

@subclass()
export class MeshGeometry extends Accessor {
    _loaderPromise: ReturnType<typeof Promise.withResolvers<MeshGeometryLoader>>;
    vertices: VertexBufferSource;
    indices: IndicesBufferSource;

    @property({
        cast(v: string) {
            assert(v === 'triangle' || v === 'quad', `MeshGeometry: 无效的primitiveType:${v}`);
            return v;
        }
    })
    primitiveType: MeshType;

    @property({ type: SpatialReference })
    spatialReference: __esri.SpatialReference;

    constructor(opts: Omit<MeshGeometryProperties, 'type'>) {
        super();
        assert(!!opts, 'MeshGeometry: 参数不能为空');
        assert(!!opts.vertices, 'MeshGeometry: vertices不能为空');
        assert(!!opts.indices, 'MeshGeometry: indices不能为空');
        assert(!!opts.vertices, 'MeshGeometry: primitiveType不能为空');
        assert(!!opts.spatialReference, 'MeshGeometry: spatialReference不能为空');
        this.vertices = opts.vertices;
        this.indices = opts.indices;
        this.primitiveType = opts.primitiveType;
        this.set('spatialReference', opts.spatialReference);
        this._loaderPromise = Promise.withResolvers();
    }

    resolveZRange(){
        return this._loaderPromise.promise
            .then(loader => loader.getZRange())
    }
}

