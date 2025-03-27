import Extent from "@arcgis/core/geometry/Extent";
import { simplify } from "@arcgis/core/geometry/geometryEngine";
import { load as loadProjection, project as proj } from "@arcgis/core/geometry/projection";

import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import { TransferResult } from "./global";
import { TriangleRenderSizeFactor } from "./glsl";
import { PointStyle, PointStyleCode } from "./typeMisc";
import {
    calcCoordsExtent,
    calcExpandExtent,
    calcPointLikesExtent,
    closePolygonRings,
    isExtentIntersect,
    pointInExtent,
    pointInTriangle,
    PointLike,
} from "./geometry";
import { Quadtree, Rect } from "./quadtree";
import { invokeEarcut, TessellatePolygonMesh } from "./polygon";
import { tessellatePolyLine, TessellatePolylineMesh } from "./polyline";
import { createVectorTile } from "./vector-tile";
import { EsriFeature, FeaturePoint, VTileInfo } from "./interface";
import { getTileId, getVTileInfo, tileIdToZXY } from "./tile";
import Geometry = __esri.Geometry;
import Point = __esri.Point;
import Polygon = __esri.Polygon;
import Polyline = __esri.Polyline;
import Multipoint = __esri.Multipoint;
import ExtentProperties = __esri.ExtentProperties;
const EmptyExtent = Object.freeze({
    xmin: Infinity,
    xmax: -Infinity,
    ymin: Infinity,
    ymax: -Infinity,
});
function unionExtent(updateExtent: ExtentProperties, e2: ExtentProperties) {
    updateExtent.xmin = Math.min(updateExtent.xmin, e2.xmin);
    updateExtent.xmax = Math.max(updateExtent.xmax, e2.xmax);
    updateExtent.ymin = Math.min(updateExtent.ymin, e2.ymin);
    updateExtent.ymax = Math.max(updateExtent.ymax, e2.ymax);
    return updateExtent;
}
function optimizeIndices(indices: number[], vertexCount: number) {
    return vertexCount < 65536 ? new Uint16Array(indices) : new Uint32Array(indices);
}
function optimizePolygonMesh(mesh: TessellatePolygonMesh) {
    const { indices, vertexCount, vertices } = mesh;
    return {
        vertexCount,
        vertices,
        indices: optimizeIndices(indices, vertexCount),
    };
}
function optimizePolylineMesh(mesh: TessellatePolylineMesh) {
    const { indices, vertexCount, vertices, side, offset } = mesh;
    return {
        vertexCount,
        vertices,
        indices: optimizeIndices(indices, vertexCount),
        side: new Int8Array(side),
        offset: new Float32Array(offset),
    };
}

//pointStyle=triangle
//A(0, 1), B(-√3/2, -0.5) C(√3/2, -0.5);
const TriangleLocal = {
    A: { x: 0, y: 1 },
    B: { x: -(3 ** 0.5 / 2), y: -0.5 },
    C: { x: 3 ** 0.5 / 2, y: -0.5 },
} as const;

enum Boundary {
    top = 0b1000,
    right = 0b0100,
    bottom = 0b0010,
    left = 0b0001,
}

const TileGridMap = [
    { type: "topLeft", offset: [-1, -1], filterFlag: Boundary.top | Boundary.left },
    { type: "top", offset: [0, -1], filterFlag: Boundary.top },
    { type: "topRight", offset: [1, -1], filterFlag: Boundary.top | Boundary.right },
    { type: "left", offset: [-1, 0], filterFlag: Boundary.left },
    { type: "__self__", offset: [0, 0], filterFlag: 0 },
    { type: "right", offset: [1, 0], filterFlag: Boundary.right },
    { type: "bottomLeft", offset: [-1, 1], filterFlag: Boundary.bottom | Boundary.left },
    { type: "bottom", offset: [0, 1], filterFlag: Boundary.bottom },
    { type: "bottomRight", offset: [1, 1], filterFlag: Boundary.bottom | Boundary.right },
] as {
    type: string;
    offset: number[]; //相对与当前tile的偏移
    filterFlag: Boundary; //是否与当前tile存在交集
}[];
type RemoteClient = { signal: AbortSignal };
const __STORE__ = new Map<string, ReturnType<typeof createVectorTileStore>>();

function _getStore(storeId: string) {
    return __STORE__.get(storeId) ?? createVectorTileStore(storeId);
}

//要素的细分对象
interface FeatureTessPolygon {
    id: number;
    type: "polygon";
    data: ReturnType<typeof optimizePolygonMesh>;
    extent: __esri.ExtentProperties;
}

interface FeatureTessPolyline {
    id: number;
    type: "polyline";
    data: ReturnType<typeof optimizePolylineMesh>;
    extent: __esri.ExtentProperties;
}

//图元类型, 即tessllate之后的三角面
interface PrimitivePolygonNode {
    gid: number; //所属的graphicId
    type: "polygon";
    points: PointLike[]; //三角形顶点
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    width: number;
    height: number;
}
interface PrimitivePointNode {
    gid: number;
    type: "point";
    x: number;
    y: number;
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    width: number;
    height: number;
    style: number;
    upright: boolean;
}
type PointStyleConfig = {
    size: number;
    upright: boolean;
    style: PointStyle;
    renderResolution: number;
};
type PolylineStyleConfig = {
    width: number;
    renderResolution: number;
};
interface VTileMesh {
    tileInfo: VTileInfo;
    isEmpty: boolean;
    tessellated: boolean; //是否已细分处理

    extent: ExtentProperties; //全部要素的范围
    point: {
        //几何数据，在细分阶段确定
        count: number;
        extent: ExtentProperties; //全部点的范围,
        meshes: FeaturePoint[];

        //原始样式统计(attributes中配置的样式) 目前在细分阶段确定
        rawStyleStat: {
            maxSize: number; //最大点大小
            hasDefaultSize: boolean; //是否包含使用默认大小的点
            hasDefaultUpright: boolean; //是否包含使用默认upright的点
        };
        //在渲染阶段确定！随时可能变化(默认样式随时可变)
        renderTree: Quadtree<PrimitivePointNode> & { _buildConfig: PointStyleConfig };
    };
    polyline: {
        count: number;
        extent: ExtentProperties; //全部点的范围,
        meshes: FeatureTessPolyline[];
        rawStyleStat: {
            maxWidth: number;
            hasDefaultWidth: boolean;
        };
        renderTree: Quadtree<PrimitivePolygonNode> & { _buildConfig: PolylineStyleConfig };
    };
    polygon: {
        count: number;
        extent: ExtentProperties;
        meshes: FeatureTessPolygon[];
        renderTree: Quadtree<PrimitivePolygonNode>; //polygon tree 固定不变
    };
}

const sizeBase = Math.log(1024);

function createVectorTileStore(storeId: string) {
    let $tileScheme: TileInfo = null;
    let $sr: SpatialReference = null;
    let $fullExtent: Extent = null; //图层范围
    let $vt: ReturnType<typeof createVectorTile> = null;
    let $rawPointStyle: Uint8ClampedArray; //attributes原始样式表
    let $rawPolylineStyle: Uint8ClampedArray; //attributes原始样式表
    function getPointStyleRaw(uid: number) {
        const styleIndex = $indexMap.get(uid).pointStyle;
        const index = styleIndex * 4;
        return {
            size: $rawPointStyle[index],
            upright: $rawPointStyle[index + 1],
            style: $rawPointStyle[index + 2],
        };
    }
    function getPolylineWidthRaw(uid: number) {
        const styleIndex = $indexMap.get(uid).polylineStyle;
        const index = styleIndex * 4;
        return $rawPolylineStyle[index];
    }
    const $orderMap = new Map<number /*gid*/, number /* z排序 */>();
    //索引表
    const $indexMap = new Map<
        number /* gid */,
        {
            data: number;
            pointStyle?: number;
            polylineStyle?: number;
        }
    >();
    const $meshMap = new Map<string /*tileId*/, VTileMesh>();
    function getTileMesh(z: number, x: number, y: number): VTileMesh;
    function getTileMesh(tileId: string): VTileMesh;
    function getTileMesh(...args: any[]) {
        let z: number, x: number, y: number, tileId: string;
        if (args.length === 3) {
            (z = args[0]), (x = args[1]), (y = args[2]);
            tileId = getTileId(z, x, y);
        } else {
            const r = tileIdToZXY(args[0]);
            (z = r.z), (x = r.x), (y = r.y);
            tileId = args[0];
        }
        if (z > $vt.options.maxZoom) return null;
        let cache = $meshMap.get(tileId);
        if (!cache) {
            cache = {
                tileInfo: getVTileInfo(z, x, y, $tileScheme),
                tessellated: false,
                isEmpty: null,
                extent: null,
                point: null,
                polyline: null,
                polygon: null,
            };
            $meshMap.set(tileId, cache);
        }
        return cache;
    }

    async function init({ graphics, viewSR, maxZoom, tolerance, style, tileScheme }: CreateStoreParam): Promise<{
        fullExtent: ExtentProperties;
    }> {
        await loadProjection();
        $sr = new SpatialReference(viewSR);
        $tileScheme = TileInfo.fromJSON(tileScheme);
        if (!graphics?.length) return null;

        const fs: EsriFeature[] = [];
        const fsExtent = {
            xmin: Infinity,
            ymin: Infinity,
            xmax: -Infinity,
            ymax: -Infinity,
        };

        const orderPolygon: number[] = [],
            orderPolyline: number[] = [],
            orderPoint: number[] = [];

        //normalized
        for (let item of graphics) {
            const gid = item.id;
            $indexMap.set(gid, item.index);

            const geoType = item.geometry.type;
            if (geoType === "mesh") continue;
            const projGeometry = $sr.equals(item.geometry.spatialReference)
                ? item.geometry
                : (proj(item.geometry, viewSR) as Geometry);
            if (projGeometry.extent) {
                unionExtent(fsExtent, projGeometry.extent);
            } else {
                const point = projGeometry as Point;
                fsExtent.xmin = Math.min(fsExtent.xmin, point.x);
                fsExtent.ymin = Math.min(fsExtent.ymin, point.y);
                fsExtent.xmax = Math.max(fsExtent.xmax, point.x);
                fsExtent.ymax = Math.max(fsExtent.ymax, point.y);
            }
            if (geoType === "polygon") {
                orderPolygon.push(gid);
                const polygon = projGeometry as Polygon;
                const isSelfIntersecting = polygon.isSelfIntersecting;
                polygon.rings = polygon.rings.map((ring) => closePolygonRings(ring));
                //对自相交的面简化，earcut自相交三角化可能会出错
                if (isSelfIntersecting) {
                    const simplifyPolygon = simplify(polygon) as Polygon;
                    simplifyPolygon.rings.forEach((ring) => {
                        fs.push({
                            id: gid,
                            type: geoType,
                            extent: calcCoordsExtent(ring),
                            rings: [ring],
                        });
                    });
                } else {
                    fs.push({
                        id: gid,
                        type: geoType,
                        extent: polygon.extent.toJSON(),
                        rings: polygon.rings,
                    });
                }
            } else if (geoType === "extent") {
                orderPolygon.push(gid);
                const geometry = projGeometry as Extent;
                fs.push({
                    id: gid,
                    type: "polygon",
                    extent: geometry.extent.toJSON(),
                    rings: [
                        [
                            [geometry.xmin, geometry.ymin],
                            [geometry.xmax, geometry.ymin],
                            [geometry.xmax, geometry.ymax],
                            [geometry.xmin, geometry.ymax],
                            [geometry.xmin, geometry.ymin],
                        ],
                    ],
                });
            } else if (geoType === "polyline") {
                orderPolyline.push(gid);
                const parts: {
                    path: number[][];
                    length: number;
                }[] = [];
                (projGeometry as Polyline).paths.forEach((path) => {
                    if (path.length <= 1) return;
                    let length = 0;
                    for (let i = 1; i < path.length; i++) {
                        length += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
                    }
                    parts.push({ path, length });
                });
                parts.forEach(({ path, length }) => {
                    fs.push({
                        id: gid,
                        type: geoType,
                        extent: parts.length > 1 ? calcCoordsExtent(path) : projGeometry.extent.toJSON(),
                        length, //当前线的长度
                        path,
                    });
                });
            } else if (geoType === "point") {
                orderPoint.push(gid);
                const geo = projGeometry as Point;
                fs.push({
                    id: gid,
                    type: "point",
                    x: geo.x,
                    y: geo.y,
                });
            } else if (geoType === "multipoint") {
                orderPoint.push(gid);
                const geo = projGeometry as Multipoint;
                geo.points.forEach((point) => {
                    fs.push({
                        id: gid,
                        type: "point",
                        x: point[0],
                        y: point[1],
                    });
                });
            }
        }

        const orderAll = [...orderPolygon, ...orderPolyline, ...orderPoint];
        for (let i = 0, len = orderAll.length; i < len; i++) {
            $orderMap.set(orderAll[i], i);
        }
        $fullExtent = new Extent({ ...fsExtent, spatialReference: viewSR });

        $vt = createVectorTile(
            fs,
            {
                maxZoom,
                tolerance,
                polylineBuffer: 0,
                pointBuffer: 0,
                polygonBuffer: 0.01,
            },
            $tileScheme,
            fsExtent
        );
        $rawPointStyle = style?.point;
        $rawPolylineStyle = style?.polyline;
        return { fullExtent: $fullExtent.toJSON() };
    }

    /* 渲染数据 */

    //获取某个tile渲染数据
    function getTileRenderData(tileId: string): TransferResult<TileRenderBufferData> {
        const { z } = tileIdToZXY(tileId);
        const maxZoom = $vt.options.maxZoom;
        const start = performance.now();
        if (z > maxZoom) return null;
        tessellateTile(tileId);
        const renderData = buildRenderBufferData(tileId) as TileRenderBufferData;
        if (!renderData) {
            return null;
        } else {
            const { polygon, polyline, point } = renderData;
            renderData.cost = performance.now() - start;
            const transfers = [
                point?.vertex.buffer,
                point?.dataIndex.buffer,
                //
                polygon?.index.buffer,
                polygon?.vertex.buffer,
                polygon?.dataIndex.buffer,
                //
                polyline?.index.buffer,
                polyline?.offset.buffer,
                polyline?.vertex.buffer,
                polyline?.dataIndexAndSide.buffer,
                polyline?.styleIndex.buffer,
            ].filter(Boolean);
            const size = transfers.reduce((s, buffer) => {
                s += buffer.byteLength;
                return s;
            }, 0);
            const index = (Math.log(size) / sizeBase) >> 0;
            const unit = ["B", "KB", "MB", "GB"][index];
            renderData.size = (size / 1024 ** index).toFixed(1) + unit;
            return transfers.length
                ? {
                      result: renderData,
                      transferList: transfers,
                  }
                : null;
        }
    }

    //细分一个tile
    function tessellateTile(tileId: string) {
        const vTileMesh = getTileMesh(tileId);
        if (vTileMesh.tessellated) return vTileMesh;
        const { z, x, y } = vTileMesh.tileInfo;
        const vTile = $vt.getTile(z, x, y);
        if (!vTile) {
            vTileMesh.tessellated = true;
            vTileMesh.isEmpty = true;
            return vTileMesh;
        }
        if (vTile._inheritFeatureFrom) {
            const sourceTileMesh = tessellateTile(vTile._inheritFeatureFrom as string);
            vTileMesh.extent = sourceTileMesh.extent;
            if (sourceTileMesh.point) {
                vTileMesh.point = {
                    ...sourceTileMesh.point,
                    renderTree: null,
                };
            }
            if (sourceTileMesh.polyline) {
                vTileMesh.polyline = {
                    ...sourceTileMesh.polyline,
                    renderTree: null,
                };
            }
            vTileMesh.polygon = sourceTileMesh.polygon;
        } else {
            const features = vTile.features;
            if (features?.length) {
                const { meshPoints, meshPolylines, meshPolygons } = tessellateFeatures(features, vTileMesh.tileInfo);
                const pointExtent = meshPoints?.length ? calcPointLikesExtent(meshPoints) : null;
                const polylineExtent = meshPolylines?.length
                    ? meshPolylines.reduce(
                          (res, cur) => {
                              unionExtent(res, (cur as FeatureTessPolyline).extent);
                              return res;
                          },
                          { ...EmptyExtent }
                      )
                    : null;
                const polygonExtent = meshPolygons.length
                    ? meshPolygons.reduce(
                          (res, cur) => {
                              unionExtent(res, (cur as FeatureTessPolygon).extent);
                              return res;
                          },
                          { ...EmptyExtent }
                      )
                    : null;
                vTileMesh.extent = { ...EmptyExtent };
                pointExtent && unionExtent(vTileMesh.extent, pointExtent);
                polylineExtent && unionExtent(vTileMesh.extent, polylineExtent);
                polygonExtent && unionExtent(vTileMesh.extent, polygonExtent);
                if (meshPoints.length) {
                    let maxSize = 0,
                        hasDefaultSize = false,
                        hasDefaultUpright = false;
                    meshPoints.forEach((i) => {
                        const { size, upright } = getPointStyleRaw(i.id);
                        hasDefaultSize = hasDefaultSize || size === 0;
                        hasDefaultUpright = hasDefaultUpright || upright === 0;
                        maxSize = Math.max(maxSize, size);
                    });
                    vTileMesh.point = {
                        count: meshPoints.length,
                        meshes: meshPoints.sort(orderSorter),
                        extent: pointExtent,
                        renderTree: null,
                        rawStyleStat: {
                            maxSize,
                            hasDefaultSize,
                            hasDefaultUpright,
                        },
                    };
                }
                if (meshPolylines.length) {
                    let maxWidth = 0,
                        hasDefaultWidth = false;
                    meshPolylines.forEach((i) => {
                        const rawWidth = getPolylineWidthRaw(i.id);
                        hasDefaultWidth = hasDefaultWidth || rawWidth === 0;
                        maxWidth = Math.max(maxWidth, rawWidth);
                    });
                    vTileMesh.polyline = {
                        count: meshPolylines.length,
                        meshes: meshPolylines.sort(orderSorter),
                        extent: polylineExtent,
                        renderTree: null,
                        rawStyleStat: {
                            hasDefaultWidth,
                            maxWidth,
                        },
                    };
                }
                if (meshPolygons.length) {
                    vTileMesh.polygon = {
                        count: meshPolygons.length,
                        meshes: meshPolygons.sort(orderSorter),
                        extent: polygonExtent,
                        renderTree: null,
                    };
                }
                vTile.features = null; //三角化后原始数据不在需要了
            }
        }
        vTileMesh.isEmpty = !(vTileMesh.point || vTileMesh.polyline || vTileMesh.polygon);
        vTileMesh.tessellated = true;
        return vTileMesh;
        //剖分点线面
        function tessellateFeatures(features: EsriFeature[], tileInfo: VTileInfo) {
            const meshPoints = [] as FeaturePoint[],
                meshPolylines = [] as FeatureTessPolyline[],
                meshPolygons = [] as FeatureTessPolygon[];
            for (let f of features) {
                if (f.type === "polyline") {
                    const mesh = tessellatePolyLine(f.path, "miter", {
                        beforePoint: f.beforePoint,
                        afterPoint: f.afterPoint,
                    });
                    if (!mesh) continue;
                    meshPolylines.push({
                        id: f.id,
                        type: "polyline",
                        data: optimizePolylineMesh(mesh),
                        extent: f.extent,
                    });
                } else if (f.type === "polygon") {
                    const mesh = invokeEarcut(f.rings.map((ring) => ring.flat()));
                    if (!mesh || !mesh.vertices?.length || !mesh.indices?.length) continue;
                    meshPolygons.push({
                        id: f.id,
                        type: "polygon",
                        data: optimizePolygonMesh(mesh),
                        extent: f.extent,
                    });
                } else if (f.type === "point") {
                    meshPoints.push(f);
                }
            }
            return {
                meshPoints,
                meshPolylines,
                meshPolygons,
            };
        }
        function orderSorter(a: { id: number }, b: { id: number }) {
            return $orderMap.get(a.id) - $orderMap.get(b.id);
        }
    }
    type TileRenderBufferData = ReturnType<typeof buildRenderBufferData> & { cost?: number; size?: number | string };
    //构建tile的buffer数据
    function buildRenderBufferData(tileId: string) {
        const tileMesh = getTileMesh(tileId);
        if (tileMesh.isEmpty === true) return null;
        const polygonMerge = mergePolygonMesh(tileMesh.polygon?.meshes, tileMesh.tileInfo);
        const polylineMerge = mergePolylineMesh(tileMesh.polyline?.meshes, tileMesh.tileInfo);
        const pointMerge = mergePoint(tileMesh.point?.meshes, tileMesh.tileInfo);
        return {
            polygon: polygonMerge,
            polyline: polylineMerge,
            point: pointMerge,
        };

        function mergePolygonMesh(meshes: FeatureTessPolygon[], tileInfo: VTileInfo) {
            if (!meshes?.length) return null;
            const { cx, cy } = tileInfo;
            let vertexCount = 0,
                indexCount = 0;
            for (let item of meshes) {
                vertexCount += item.data.vertices.length / 2;
                indexCount += item.data.indices.length;
            }
            if (vertexCount === 0) return null;

            const vertexBuf = new Float32Array(vertexCount * 2); //[x,y]
            const dataIdxBuf = new Float32Array(vertexCount);

            const indexBuf = vertexCount > 65535 ? new Uint32Array(indexCount) : new Uint16Array(indexCount);
            for (
                let index = 0,
                    length = meshes.length,
                    vertexCursor = 0, //顶点游标
                    indexCursor = 0; //索引游标
                index < length;
                index++
            ) {
                const { data: tess, id } = meshes[index];
                for (let i = 0, arr = tess.indices, len = arr.length; i < len; i++) {
                    indexBuf[indexCursor] = vertexCursor + arr[i];
                    indexCursor++;
                }
                for (let i = 0, vArr = tess.vertices, len = tess.vertexCount; i < len; i++) {
                    const i2 = i * 2,
                        i21 = i2 + 1;
                    const c2 = vertexCursor * 2,
                        c21 = c2 + 1;
                    vertexBuf[c2] = vArr[i2] - cx;
                    vertexBuf[c21] = vArr[i21] - cy;
                    dataIdxBuf[vertexCursor] = $indexMap.get(id).data;
                    vertexCursor++;
                }
            }
            return {
                vertex: vertexBuf,
                dataIndex: dataIdxBuf,
                index: indexBuf,
            };
        }
        function mergePolylineMesh(meshes: FeatureTessPolyline[], tileInfo: VTileInfo) {
            if (!meshes?.length) return null;
            const { cx, cy } = tileInfo;
            let vertexCount = 0,
                indexCount = 0;

            for (let item of meshes) {
                vertexCount += item.data.vertices.length / 2;
                indexCount += item.data.indices.length;
            }

            if (vertexCount === 0) return null;

            const vertexBuf = new Float32Array(vertexCount * 2); //[x1, y1, x2, y2,...]
            const offsetBuf = new Float32Array(vertexCount * 2); //[offsetx1, offsety1, offsetx2, offsety2...]
            const dataIdxAndSideBuf = new Float32Array(vertexCount); //
            const styleIdxBuf = new Float32Array(vertexCount);
            const indexBuf = vertexCount > 65535 ? new Uint32Array(indexCount) : new Uint16Array(indexCount);

            for (
                let index = 0,
                    length = meshes.length,
                    vertexCursor = 0, //顶点游标
                    indexCursor = 0; //索引游标
                index < length;
                index++
            ) {
                const { data: tess, id } = meshes[index];
                const indexInfo = $indexMap.get(id);
                for (let i = 0, arr = tess.indices, len = arr.length; i < len; i++) {
                    indexBuf[indexCursor] = vertexCursor + arr[i];
                    indexCursor++;
                }
                for (
                    let i = 0,
                        vArr = tess.vertices,
                        sideArr = tess.side,
                        offsetArr = tess.offset,
                        len = tess.vertexCount;
                    i < len;
                    i++
                ) {
                    const i2 = i * 2,
                        i21 = i2 + 1;
                    const c2 = vertexCursor * 2,
                        c21 = c2 + 1;
                    vertexBuf[c2] = vArr[i2] - cx;
                    vertexBuf[c21] = vArr[i21] - cy;
                    offsetBuf[c2] = offsetArr[i2];
                    offsetBuf[c21] = offsetArr[i21];
                    //sideArr[i] is 1 or -1
                    dataIdxAndSideBuf[vertexCursor] = indexInfo.data * sideArr[i];
                    styleIdxBuf[vertexCursor] = indexInfo.polylineStyle;
                    vertexCursor++;
                }
            }

            return {
                vertex: vertexBuf,
                dataIndexAndSide: dataIdxAndSideBuf,
                index: indexBuf,
                offset: offsetBuf,
                styleIndex: styleIdxBuf,
            };
        }
        function mergePoint(points: FeaturePoint[], tileInfo: VTileInfo) {
            const vertexCount = points?.length;
            if (!vertexCount) return null;
            const { cx, cy } = tileInfo;
            const vertexBuf = new Float32Array(vertexCount * 2);
            const dataIdxBuf = new Float32Array(vertexCount);
            const styleIdxBuf = new Float32Array(vertexCount);

            for (let i = 0; i < vertexCount; i++) {
                const { x, y, id } = points[i];
                const i2 = i * 2;
                vertexBuf[i2] = x - cx;
                vertexBuf[i2 + 1] = y - cy;

                const index = $indexMap.get(id);
                dataIdxBuf[i] = index.data;
                styleIdxBuf[i] = index.pointStyle;
            }
            return {
                vertex: vertexBuf,
                dataIndex: dataIdxBuf,
                styleIndex: styleIdxBuf,
            };
        }
    }

    /* hitTest */
    function buildPolygonRenderTree(tileId: string) {
        const vTileMesh = getTileMesh(tileId);
        if (!vTileMesh.polygon || vTileMesh.polygon.renderTree) return;
        const tree = new Quadtree<PrimitivePolygonNode>(vTileMesh.tileInfo as Rect);
        const nodes = vTileMesh.polygon.meshes.map(polygonTessToPrimitiveNode).flat();
        for (let node of nodes) {
            tree.insert(node);
        }
        vTileMesh.polygon.renderTree = tree;
        function polygonTessToPrimitiveNode(polygon: FeatureTessPolygon) {
            const { id, data: tess } = polygon;
            const { vertices, indices } = tess;
            const result: PrimitivePolygonNode[] = [];
            for (let i = 0, len = indices.length; i < len; i += 3) {
                const A = {
                    x: vertices[indices[i] * 2],
                    y: vertices[indices[i] * 2 + 1],
                };
                const B = {
                    x: vertices[indices[i + 1] * 2],
                    y: vertices[indices[i + 1] * 2 + 1],
                };
                const C = {
                    x: vertices[indices[i + 2] * 2],
                    y: vertices[indices[i + 2] * 2 + 1],
                };
                const xs = [A.x, B.x, C.x];
                const ys = [A.y, B.y, C.y];
                const xmin = Math.min.apply(null, xs);
                const xmax = Math.max.apply(null, xs);
                const ymin = Math.min.apply(null, ys);
                const ymax = Math.max.apply(null, ys);
                result.push({
                    gid: id,
                    type: "polygon",
                    points: [A, B, C],
                    xmin,
                    ymin,
                    width: xmax - xmin,
                    height: ymax - ymin,
                    xmax,
                    ymax,
                });
            }
            return result;
        }
    }
    function buildPointRenderTree(tileId: string, curStyle: PointStyleConfig) {
        const vTileMesh = getTileMesh(tileId);
        if (!vTileMesh.point) return;
        let needUpdate = false;
        if (!vTileMesh.point.renderTree) {
            needUpdate = true;
        } else {
            const old = vTileMesh.point.renderTree._buildConfig;
            const structureChange =
                old.size !== curStyle.size || Math.abs(old.renderResolution - curStyle.renderResolution) > 0.001;
            const displayChange = old.style !== curStyle.style || old.upright !== curStyle.upright;
            if (structureChange) {
                needUpdate = true;
            } else if (displayChange) {
                console.log("update tree:", tileId);
                //update style only
                const tree = vTileMesh.point.renderTree;
                const nodes = tree.getAll();
                for (
                    let i = 0, length = nodes.length, Upright = curStyle.upright, Style = curStyle.style;
                    i < length;
                    i++
                ) {
                    const node = nodes[i];
                    const rawStyle = getPointStyleRaw(node.gid);
                    const computedUpright = rawStyle.upright === 0 ? Upright : rawStyle.upright > 128;
                    const computedStyle = rawStyle.style === 0 ? PointStyleCode[Style] : rawStyle.style;
                    node.style = computedStyle;
                    node.upright = computedUpright;
                }
                tree._buildConfig = curStyle;
            }
        }
        if (!needUpdate) return;
        console.log("build tree:", tileId);
        const { extent, meshes, rawStyleStat } = vTileMesh.point;
        const { maxSize, hasDefaultSize } = rawStyleStat;
        const resolution = curStyle.renderResolution;
        const maxPadding = (hasDefaultSize ? Math.max(maxSize, curStyle.size) : maxSize) * resolution;
        const treeExtent = calcExpandExtent(extent, maxPadding) as ExtentProperties & Rect;
        treeExtent.width = treeExtent.xmax - treeExtent.xmin;
        treeExtent.height = treeExtent.ymax - treeExtent.ymin;
        const tree = (vTileMesh.point.renderTree = new Quadtree<PrimitivePointNode>(
            treeExtent
        ) as Quadtree<PrimitivePointNode> & { _buildConfig: PointStyleConfig });
        tree._buildConfig = curStyle;
        for (
            let i = 0,
                length = meshes.length,
                Size = curStyle.size,
                Upright = curStyle.upright,
                Style = curStyle.style,
                Resolution = curStyle.renderResolution;
            i < length;
            i++
        ) {
            const { id, x, y } = meshes[i];
            const rawStyle = getPointStyleRaw(id);
            const computedSize = rawStyle.size === 0 ? Size : rawStyle.size;
            const computedUpright = rawStyle.upright === 0 ? Upright : rawStyle.upright > 128;
            const computedStyle = rawStyle.style === 0 ? PointStyleCode[Style] : rawStyle.style;

            const factor = computedStyle === PointStyleCode.triangle ? TriangleRenderSizeFactor : 1;
            const r = computedSize * Resolution * factor;
            tree.insert({
                gid: id,
                type: "point",
                xmin: x - r,
                xmax: x + r,
                ymin: y - r,
                ymax: y + r,
                width: 2 * r,
                height: 2 * r,
                x,
                y,
                style: computedStyle,
                upright: computedUpright,
            });
        }
    }
    function buildPolylineRenderTree(tileId: string, curStyle: PolylineStyleConfig) {
        const vTileMesh = getTileMesh(tileId);
        if (!vTileMesh.polyline) return;
        let needUpdate = false;
        if (!vTileMesh.polyline.renderTree) {
            needUpdate = true;
        } else {
            const old = vTileMesh.polyline.renderTree._buildConfig;
            if (old.width !== curStyle.width || Math.abs(old.renderResolution - curStyle.renderResolution) > 0.001) {
                needUpdate = true;
            }
        }
        if (!needUpdate) return;

        const { rawStyleStat, meshes, extent } = vTileMesh.polyline;
        const { maxWidth, hasDefaultWidth } = rawStyleStat;
        const resolution = curStyle.renderResolution;
        const padding = (hasDefaultWidth ? Math.max(maxWidth, curStyle.width) : maxWidth) * resolution;
        const treeExtent = calcExpandExtent(extent, padding) as ExtentProperties & Rect;
        treeExtent.width = treeExtent.xmax - treeExtent.xmin;
        treeExtent.height = treeExtent.ymax - treeExtent.ymin;
        const tree = (vTileMesh.polyline.renderTree = new Quadtree<PrimitivePolygonNode>(
            treeExtent
        ) as Quadtree<PrimitivePolygonNode> & { _buildConfig: PolylineStyleConfig });
        tree._buildConfig = curStyle;

        for (
            let i = 0, length = meshes.length, Width = curStyle.width, Resolution = curStyle.renderResolution;
            i < length;
            i++
        ) {
            const { id, data } = meshes[i];
            const { vertices, indices, offset } = data;
            const lineWidth = getPolylineWidthRaw(id);
            const offsetScale = (lineWidth === 0 ? Width : lineWidth) * Resolution;
            for (let i = 0, len = indices.length; i < len; i += 3) {
                const i0 = indices[i],
                    i1 = indices[i + 1],
                    i2 = indices[i + 2];
                const v0 = i0 * 2,
                    v01 = v0 + 1,
                    v1 = i1 * 2,
                    v11 = v1 + 1,
                    v2 = i2 * 2,
                    v21 = v2 + 1;
                const A = {
                    x: vertices[v0] + offset[v0] * offsetScale,
                    y: vertices[v01] + offset[v01] * offsetScale,
                };
                const B = {
                    x: vertices[v1] + offset[v1] * offsetScale,
                    y: vertices[v11] + offset[v11] * offsetScale,
                };
                const C = {
                    x: vertices[v2] + offset[v2] * offsetScale,
                    y: vertices[v21] + offset[v21] * offsetScale,
                };

                const xs = [A.x, B.x, C.x];
                const ys = [A.y, B.y, C.y];
                const xmin = Math.min.apply(null, xs);
                const xmax = Math.max.apply(null, xs);
                const ymin = Math.min.apply(null, ys);
                const ymax = Math.max.apply(null, ys);
                tree.insert({
                    gid: id,
                    type: "polygon",
                    points: [A, B, C],
                    xmin,
                    ymin,
                    width: xmax - xmin,
                    height: ymax - ymin,
                    xmax,
                    ymax,
                });
            }
        }
    }
    const store = {
        init,
        getTileRenderData,
        hitTest: ({
            z,
            x,
            y,
            point: mousePosition,
            rotate,
            resolution,
            defaultLineWidth,
            defaultPointSize,
            defaultPointStyle,
            defaultPointUpright,
        }: HitTestParam): number[] => {
            if (!$vt) return null;

            const target = getTileMesh(z, x, y);
            const curDefaultPointStyle = {
                size: defaultPointSize,
                upright: defaultPointUpright,
                style: defaultPointStyle,
                renderResolution: resolution,
            };
            const curDefaultPolylineStyle = {
                renderResolution: resolution,
                width: defaultLineWidth,
            };
            const hitIdSet = new Set<number>();
            let tileOffsets = [] as number[][]; //查找可能相交的tile的偏移值;
            if ($tileScheme.size[0] > 256) {
                const filterFlag =
                    (mousePosition.x > target.tileInfo.cx ? Boundary.right : Boundary.left) |
                    (mousePosition.y > target.tileInfo.cy ? Boundary.top : Boundary.bottom);
                tileOffsets = TileGridMap.filter((i) => (i.filterFlag & filterFlag) === i.filterFlag).map(
                    (i) => i.offset
                );
            } else {
                tileOffsets = TileGridMap.map((i) => i.offset);
            }
            //鼠标所在位置extent
            const half = resolution / 2;
            const mouseExtent = {
                x: mousePosition.x,
                y: mousePosition.y,
                xmin: mousePosition.x - half,
                ymin: mousePosition.y - half,
                width: resolution,
                height: resolution,
                xmax: mousePosition.x + half,
                ymax: mousePosition.y + half,
            };
            tileOffsets.forEach((offset) => {
                const tileMesh = getTileMesh(z, x + offset[0], y + offset[1]);
                if (!tileMesh.tessellated || tileMesh.isEmpty === true) return;
                const tileId = tileMesh.tileInfo.id;
                let needCheck = false;
                if (target === tileMesh && tileMesh.polygon) {
                    needCheck = true;
                    buildPolygonRenderTree(tileId);
                }
                if (tileMesh.point) {
                    const { rawStyleStat, extent } = tileMesh.point;
                    const { maxSize, hasDefaultSize } = rawStyleStat;
                    const maxPadding =
                        (hasDefaultSize ? Math.max(maxSize, curDefaultPointStyle.size) : maxSize) * resolution;
                    const maxRenderExtent = calcExpandExtent(extent, maxPadding);
                    if (isExtentIntersect(mouseExtent, maxRenderExtent)) {
                        buildPointRenderTree(tileId, curDefaultPointStyle);
                        needCheck = true;
                    }
                }
                if (tileMesh.polyline) {
                    const { rawStyleStat, extent } = tileMesh.polyline;
                    const { maxWidth, hasDefaultWidth } = rawStyleStat;
                    const maxPadding =
                        (hasDefaultWidth ? Math.max(maxWidth, curDefaultPointStyle.size) : maxWidth) * resolution;
                    const maxRenderExtent = calcExpandExtent(extent, maxPadding);
                    if (isExtentIntersect(mouseExtent, maxRenderExtent)) {
                        buildPolylineRenderTree(tileId, curDefaultPolylineStyle);
                        needCheck = true;
                    }
                }
                needCheck && checkTileHitTest(tileId, mouseExtent);
            });
            function checkTileHitTest(tileId: string, checkRegion: Rect & PointLike) {
                const { point, polyline, polygon } = getTileMesh(tileId);
                if (point?.renderTree) {
                    const nodes = point.renderTree.retrieve(checkRegion);
                    for (let n of nodes) {
                        if (hitIdSet.has(n.gid)) return;
                        let hit = false;
                        const r = n.width / 2;
                        if (n.style === PointStyleCode.circle) {
                            const distance = Math.hypot(checkRegion.x - n.x, checkRegion.y - n.y);
                            hit = distance <= r;
                        } else {
                            const normalizedPos = {
                                x: (checkRegion.x - n.x) / r,
                                y: (checkRegion.y - n.y) / r,
                            };
                            if (rotate !== 0 && n.upright) {
                                const cos = Math.cos(rotate);
                                const sin = Math.sin(rotate);
                                const _x = normalizedPos.x,
                                    _y = normalizedPos.y;
                                normalizedPos.x = _x * cos - _y * sin;
                                normalizedPos.y = _x * sin + _y * cos;
                            }
                            if (n.style === PointStyleCode.square) {
                                hit = pointInExtent(normalizedPos, {
                                    xmin: -1,
                                    xmax: 1,
                                    ymin: -1,
                                    ymax: 1,
                                });
                            } else {
                                hit = pointInTriangle(normalizedPos, TriangleLocal.A, TriangleLocal.B, TriangleLocal.C);
                            }
                        }
                        hit && hitIdSet.add(n.gid);
                    }
                }
                if (polyline) {
                    const nodes = polyline.renderTree.retrieve(checkRegion);
                    for (let n of nodes) {
                        if (hitIdSet.has(n.gid)) continue;
                        const [A, B, C] = n.points;
                        if (pointInTriangle(checkRegion, A, B, C)) {
                            hitIdSet.add(n.gid);
                        }
                    }
                }
                if (polygon) {
                    const nodes = polygon.renderTree.retrieve(checkRegion);
                    for (let n of nodes) {
                        if (hitIdSet.has(n.gid)) continue;
                        const [A, B, C] = n.points;
                        if (pointInTriangle(checkRegion, A, B, C)) {
                            hitIdSet.add(n.gid);
                        }
                    }
                }
            }

            return hitIdSet.size
                ? Array.from(hitIdSet).sort((a, b) => {
                      return $orderMap.get(a) - $orderMap.get(b);
                  })
                : null;
        },
    };
    __STORE__.set(storeId, store);
    return store;
}

type CreateStoreParam = {
    storeId: string;
    viewSR: __esri.SpatialReferenceProperties;
    tileScheme: __esri.TileInfoProperties;
    maxZoom: number;
    tolerance: number;
    graphics: {
        geometry: __esri.Geometry;
        id: number;
        index: {
            //索引
            data: number;
            pointStyle?: number; //对应数据从下面style.point 中查找
            polylineStyle?: number;
        };
    }[];
    style: {
        point: Uint8ClampedArray;
        polyline: Uint8ClampedArray;
    };
};

export function createStore(opts: CreateStoreParam, client?: RemoteClient) {
    return _getStore(opts.storeId).init(opts);
}

export function getTileRenderData(
    opts: {
        tileId: string;
        storeId: string;
    },
    client?: RemoteClient
) {
    return _getStore(opts.storeId).getTileRenderData(opts.tileId);
}

type HitTestParam = {
    storeId: string;
    z: number;
    x: number;
    y: number;
    rotate: number;
    resolution: number;
    point: { x: number; y: number }; //鼠标点在地图上位置
    defaultPointSize: number;
    defaultLineWidth: number;
    defaultPointUpright: boolean;
    defaultPointStyle: PointStyle;
};

export function hitTest(opts: HitTestParam, client?: RemoteClient) {
    return _getStore(opts.storeId).hitTest(opts);
}

export function disposeStore(storeId: string) {
    __STORE__.delete(storeId);
}
