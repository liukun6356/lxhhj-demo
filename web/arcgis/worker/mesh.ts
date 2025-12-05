import EsriPoint from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import * as projection from "@arcgis/core/geometry/operators/projectOperator";
import { assert, isNil } from "es-toolkit";
import { doubleToTwoFloat, isPosInteger, minmax } from "shared/utils/math";
import type { AttributeOpts } from "web/utils/webgl/buffer";
import { calcDataTexSize } from "web/utils/webgl/texture";
import { getGLDataType, getIndexDataStoreArrayType } from "web/utils/webgl/utils";
import type { IndicesBufferSource, MeshType, VertexBufferSource } from "../layers/TimeSeriesVectorLayer/supports/MeshGeometry";
import { wrapMessagePort } from "../supports/worker-helper";
import type { BBox } from "geojson";

export async function openMeshManager_entire(port: MessagePort) {
    let data: StoreData;
    const api = wrapMessagePort(port, {
        init: async (arg: Parameters<typeof init>[0]) => {
            await projection.load();
            data = init(arg);
            return {
                vertexCount: data.vertexCount,
                meshCount: data.meshCount,
                hasZ: data.hasZ,
                vertexTexSize: data.vertexTexSize,
                primitiveType: data.primitiveType
            }
        },
        getEncodeXY() {
            assert(!!data, '未初始化');
            return getEncodeXY(data);
        },
        getZ() {
            assert(!!data, '未初始化');
            return getZ(data);
        },
        getVertexIndex() {
            assert(!!data, '未初始化');
            return getVertexIndex(data);
        },
    }, []);
    return api;
}
type StoreData = ReturnType<typeof init>;

function init(opts: {
    targetCrs: __esri.SpatialReferenceProperties,
    sourceCrs: __esri.SpatialReferenceProperties,
    type: MeshType,
    vertices: VertexBufferSource,
    indices: IndicesBufferSource
}) {
    const vertices = opts.vertices;
    const indices = {
        ...opts.indices,
        components: opts.indices.components ?? (opts.type === 'triangle' ? [0, 1, 2] : [0, 1, 2, 3]),
    };
    const hasZ = !isNil(vertices.z);
    const vertexCount = vertices.data.length / vertices.stride;
    assert(isPosInteger(vertexCount), '顶点数非正整数');
    const meshCount = indices.data.length / indices.stride;
    assert(isPosInteger(meshCount), '顶点数非正整数');
    return {
        targetCrs: new SpatialReference(opts.targetCrs),
        sourceCrs: new SpatialReference(opts.sourceCrs),
        hasZ,
        vertexCount,
        meshCount,
        vertexTexSize: calcDataTexSize(vertexCount),
        vertices,
        indices,
        primitiveType: opts.type,
    };
}
function getEncodeXY(data: StoreData) {
    const { targetCrs, sourceCrs, vertexCount, vertices, vertexTexSize } = data;
    const vertexData = new Float32Array(vertexTexSize[0] * vertexTexSize[1] * 4);
    const needProj = !targetCrs.equals(sourceCrs);
    const p = needProj ? new EsriPoint({ spatialReference: sourceCrs }) : null;

    let xmin = Infinity, xmax = -Infinity,
        ymin = Infinity, ymax = -Infinity;
    for (
        let i = 0, x = 0, y = 0,
        len = vertexCount,
        cursor = i * 4,
        { stride, x: xIndex, y: yIndex, data } = vertices;
        i < len;
        i++
    ) {
        const startOffset = stride * i;
        x = data[startOffset + xIndex];
        y = data[startOffset + yIndex];
        if (needProj) {
            p.x = x;
            p.y = y;
            const proj = projection.execute(p, targetCrs) as __esri.Point;
            x = proj?.x;
            y = proj?.y;
        }
        xmin = Math.min(xmin, x);
        xmax = Math.max(xmax, x);
        ymin = Math.min(ymin, y);
        ymax = Math.max(ymax, y);
        const [highx, lowx] = doubleToTwoFloat(x);
        const [highy, lowy] = doubleToTwoFloat(y);
        vertexData[cursor++] = highx;
        vertexData[cursor++] = highy;
        vertexData[cursor++] = lowx;
        vertexData[cursor++] = lowy;
    }
    return {
        result: {
            data: vertexData,
            bbox: [xmin, ymin, xmax, ymax] as BBox
        },
        transferList: [vertexData.buffer]
    }
}
function getZ({
    hasZ,
    vertexCount,
    vertices,
    vertexTexSize,
}: StoreData) {
    assert(hasZ, '数据不含z');
    const zData = new Float32Array(vertexTexSize[0] * vertexTexSize[1]);
    const { data, stride, z: zIndex } = vertices;
    for (let i = 0, cursor = zIndex;
        i < vertexCount;
        i++, cursor += stride
    ) {
        zData[i] = data[cursor];
    }
    return {
        result: {
            data: zData,
            range: minmax(zData)
        },
        transferList: [zData.buffer]
    }
}
function getVertexIndex({ meshCount, indices, primitiveType, vertexCount }: StoreData) {
    const VertexIndexArrayType = getIndexDataStoreArrayType(vertexCount - 1, false);
    const instance_vertexIndex = new VertexIndexArrayType(meshCount * (primitiveType === 'triangle' ? 3 : 4));
    if (primitiveType === 'triangle') {
        const { data, stride, components } = indices;
        for (
            let i = 0,
            [a, b, c] = components,
            cursor = 0;
            i < meshCount;
            i++, cursor += stride
        ) {
            const i3 = i * 3;
            instance_vertexIndex[i3] = data[cursor + a];
            instance_vertexIndex[i3 + 1] = data[cursor + b];
            instance_vertexIndex[i3 + 2] = data[cursor + c];
        }
    } else {
        const { data, stride, components } = indices;
        for (
            let i = 0,
            [a, b, c, d] = components,
            cursor = 0;
            i < meshCount;
            i++, cursor += stride
        ) {
            const i4 = i * 4;
            instance_vertexIndex[i4] = data[cursor + a];
            instance_vertexIndex[i4 + 1] = data[cursor + b];
            instance_vertexIndex[i4 + 2] = data[cursor + c];
            instance_vertexIndex[i4 + 3] = data[cursor + d];
        }
    }
    return {
        result: {
            buffer: { srcData: instance_vertexIndex },
            layout: {
                name: 'instance_vertexIndex',
                format: primitiveType === 'triangle' ? 'uvec3' : 'uvec4',
                type: getGLDataType(VertexIndexArrayType),
                divisor: 1,
            } as AttributeOpts,
        },
        transferList: [instance_vertexIndex.buffer]
    }
}
export namespace MeshWorker {
    export type WorkerAPI = {
        init: (...args: Parameters<typeof init>) => Omit<ReturnType<typeof init>, 'targetCrs' | 'sourceCrs' | 'vertices' | 'indices'>,
        getEncodeXY: () => PickResult<ReturnType<typeof getEncodeXY>>,
        getVertexIndex: () => PickResult<ReturnType<typeof getVertexIndex>>,
        getZ: () => PickResult<ReturnType<typeof getZ>>,
    }
}
