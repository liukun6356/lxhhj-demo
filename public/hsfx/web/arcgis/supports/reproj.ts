import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import type { BBox } from "geojson";
import { max, minmax, modulo } from "shared/utils/math";
import { bboxCenter, bboxCorners, bboxSize, geodesicDistance, getTileInfoWorldBBox } from "web/arcgis/supports/bbox";
import { project } from "web/arcgis/supports/project";



//arcgis proj return null,
//proj4 return NaN or Infinity
function isNone(p: Coord) {
    if (!p) return true;
    return !isFinite(p[0]) || !isFinite(p[1]);
}
const NoneFlag = {
    a: 0b1000,
    b: 0b0100,
    c: 0b0010,
    d: 0b0001,
} as const;
function middle(a: Coord, b: Coord) {
    return [
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2
    ]
}


export const MAX_SUBDIVISION = 10;

/**
 * 计算目标【范围】重投影的源坐标系下的理想分辨率
 * @param sourceCrs 源坐标系
 * @param targetCrs 目标坐标系
 * @param targetBBox 对应的目标范围
 * @param targetResolution 当前目标分辨率
 */
export function calcExtentReprojSourceResolution(
    sourceCrs: __esri.SpatialReference,
    targetCrs: __esri.SpatialReference,
    targetBBox: BBox,
    targetResolution: number,
) {
    //使用中心点计算
    const targetCenter = bboxCenter(targetBBox);
    let sourceResolution = calcPointReprojSourceResolution(
        sourceCrs,
        targetCrs,
        targetCenter,
        targetResolution,
    );
    if (!isFinite(sourceResolution)) {
        //使用4个角计算
        for (let point of bboxCorners(targetBBox)) {
            sourceResolution = calcPointReprojSourceResolution(
                sourceCrs,
                targetCrs,
                point,
                targetResolution,
            );
            if (isFinite(sourceResolution)) break;
        }
    }
    return sourceResolution;
}

/**
 * 计算目标【点】重投影的源坐标系下的理想分辨率
 * @param sourceCrs 源坐标系
 * @param targetCrs 目标坐标系
 * @param targetBBox 对应的目标范围
 * @param targetResolution 当前目标分辨率
 */
export function calcPointReprojSourceResolution(
    sourceCrs: __esri.SpatialReference,
    targetCrs: __esri.SpatialReference,
    targetCenter: number[],
    targetResolution: number,
) {
    const sourceResolutionMeters = resolvePointResolutionMeters(targetCenter, targetCrs, targetResolution);
    let sourceResolution = sourceResolutionMeters / (sourceCrs.metersPerUnit ?? 1);
    const sourceCenter = project(targetCenter, targetCrs, sourceCrs);
    if (!sourceCenter) return NaN;
    const inverse = resolvePointResolutionMeters(sourceCenter, sourceCrs, sourceResolution);
    if (isFinite(inverse)) {
        sourceResolution *= sourceResolution / inverse;
    }
    return sourceResolution;
}

/**
 * 计算给定点的分辨率（单位：米）
 * @param point 点
 * @param pointCrs 点坐标系 
 * @param resolution 点坐标系下的点位置的分辨率
 * @returns 
 */
export function resolvePointResolutionMeters(
    [x, y]: Coord,
    pointCrs: __esri.SpatialReference,
    resolution: number,
) {
    if (pointCrs.unit === 'degrees') return resolution * (pointCrs.metersPerUnit ?? 1);
    const halfSize = resolution / 2;
    const [left, right, bottom, top] = [
        [x - halfSize, y],
        [x + halfSize, y],
        [x, y - halfSize],
        [x, y + halfSize],
    ].map(p => project(p, pointCrs, SpatialReference.WGS84));
    if (isNone(left) || isNone(right) || isNone(bottom) || isNone(top)) return NaN;
    const width = geodesicDistance(left, right);
    const height = geodesicDistance(bottom, top);
    return (width + height) / 2;
}


//see openlayer Tile ol/reproj/Triangulation.js
export function calcExtentReprojMesh(
    targetBBox: BBox,
    targetTileInfo: __esri.TileInfo,
    sourceTileInfo: __esri.TileInfo,
    errorThreshold: number,
    maxSubdivision: number,
) {

    const inverseProj = (p: Coord) => {
        return project(p, targetTileInfo.spatialReference, sourceTileInfo.spatialReference);
    };
    const triangles = [] as { source: Coord[], target: Coord[] }[];
    const sourceWorldSize = getTileInfoWorldBBox(sourceTileInfo);
    const worldWidthSrc = sourceWorldSize[0];
    const [
        targetTopLeft,
        targetTopRight,
        targetBottomRight,
        targetBottomLeft
    ] = bboxCorners(targetBBox);

    const stack = [
        {
            target: [targetTopLeft, targetTopRight, targetBottomRight, targetBottomLeft],
            source: [
                inverseProj(targetTopLeft),
                inverseProj(targetTopRight),
                inverseProj(targetBottomRight),
                inverseProj(targetBottomLeft),
            ],
            subdivision: maxSubdivision
        }
    ]
    while (stack.length) {
        const { target, source, subdivision } = stack.pop();
        const [a, b, c, d] = target;
        const [asrc, bsrc, csrc, dsrc] = source;

        let needsSubdivision = false;
        let noneFlag = 0;
        if (isNone(asrc) || isNone(bsrc) || isNone(csrc) || isNone(dsrc)) {
            if (subdivision > 0) {
                needsSubdivision = true;
            } else {
                noneFlag |= isNone(asrc) ? NoneFlag.a : 0;
                noneFlag |= isNone(bsrc) ? NoneFlag.b : 0;
                noneFlag |= isNone(csrc) ? NoneFlag.c : 0;
                noneFlag |= isNone(dsrc) ? NoneFlag.d : 0;
                //如果只有一个点为空，则用剩下3个点做一个三角形
                //否则，不在继续细分
                if (noneFlag !== NoneFlag.a
                    && noneFlag !== NoneFlag.b
                    && noneFlag !== NoneFlag.c
                    && noneFlag !== NoneFlag.d
                ) continue;
            }
        }

        if (subdivision > 0) {
            if (!needsSubdivision) {
                const centerSrc = inverseProj(middle(a, c));
                if (isNone(centerSrc)) {
                    // example 
                    // target: epsg4547, source: epsg3857 
                    // target_a = [1720045.711591162, 8209309.078048728]
                    // target_c = [1876413.503553995, 8131125.182067311]
                    // target_middle = [1798229.6075725784,8170217.13005802]
                    needsSubdivision = true;
                } else {
                    let dx: number
                    if (sourceTileInfo.isWrappable) {
                        dx = (modulo(asrc[0], worldWidthSrc) + modulo(csrc[0], worldWidthSrc)) / 2
                            - modulo(centerSrc[0], worldWidthSrc);
                    } else {
                        dx = (asrc[0] + csrc[0]) / 2 - centerSrc[0];
                    }
                    const dy = (asrc[1] + csrc[1]) / 2 - centerSrc[1];
                    needsSubdivision = Math.hypot(dx, dy) > errorThreshold;
                }
            }
            if (needsSubdivision) {
                if (Math.abs(a[0] - c[0]) <= Math.abs(a[1] - c[1])) {
                    // split horizontally
                    const bc = middle(b, c);
                    const da = middle(d, a);
                    const bcsrc = inverseProj(bc);
                    const dasrc = inverseProj(da);
                    stack.push({
                        target: [a, b, bc, da],
                        source: [asrc, bsrc, bcsrc, dasrc],
                        subdivision: subdivision - 1,
                    });
                    stack.push({
                        target: [da, bc, c, d],
                        source: [dasrc, bcsrc, csrc, dsrc],
                        subdivision: subdivision - 1,
                    });
                } else {
                    const ab = middle(a, b);
                    const cd = middle(c, d);
                    const absrc = inverseProj(ab);
                    const cdsrc = inverseProj(cd);
                    stack.push({
                        target: [a, ab, cd, d],
                        source: [asrc, absrc, cdsrc, dsrc],
                        subdivision: subdivision - 1,
                    });
                    stack.push({
                        target: [ab, b, c, cd],
                        source: [absrc, bsrc, csrc, cdsrc],
                        subdivision: subdivision - 1,
                    })
                }
                continue;
            }
        }
        switch (noneFlag) {
            case 0:
                addTriangle(a, d, c, asrc, dsrc, csrc);
                addTriangle(a, c, b, asrc, csrc, bsrc);
                break;
            case NoneFlag.a:
                addTriangle(b, d, c, bsrc, dsrc, csrc);
                break;
            case NoneFlag.b:
                addTriangle(a, d, c, asrc, dsrc, csrc);
                break;
            case NoneFlag.c:
                addTriangle(a, d, b, asrc, dsrc, bsrc);
                break;
            case NoneFlag.d:
                addTriangle(a, c, b, asrc, csrc, bsrc);
                break;
        }
    }

    function addTriangle(a: Coord, b: Coord, c: Coord, asrc: Coord, bsrc: Coord, csrc: Coord) {
        triangles.push({
            target: [a, b, c],
            source: [asrc, bsrc, csrc],
        });
    }
    const leftBound = triangles.reduce((bound, { source }) => {
        bound = Math.min(bound, ...source.map(i => i[0]))
        return bound;
    }, Infinity);

    const halfWorldSize = worldWidthSrc / 2;
    triangles.forEach((triangle) => {
        if (max(triangle.source.map(i => i[0])) - leftBound > halfWorldSize) {
            const newTriangle = triangle.source.map(([x, y]) => {
                const p = [x, y];
                if (p[0] - leftBound > halfWorldSize) p[0] -= worldWidthSrc;
                return p;
            });
            const [minX, maxX] = minmax(newTriangle.map(i => i[0]))
            if (maxX - minX < halfWorldSize) {
                triangle.source = newTriangle;
            }
        }
    });

    return triangles;
}

export function buildWebGLReprojBufferData(
    triangles: ReturnType<typeof calcExtentReprojMesh>,
    targetBBox: BBox,
    sourceBBox: BBox
) {
    const targetSize = bboxSize(targetBBox);
    const sourceSize = bboxSize(sourceBBox);
    const arr = new Float32Array(triangles.length * 3 * 4);
    for (let i = triangles.length; i--;) {
        const { source, target } = triangles[i];
        let index = i * 12;
        for (let j = 0; j < 3; j++) {
            //llcorner
            arr[index++] = (target[j][0] - targetBBox[0]) / targetSize[0]; //x
            arr[index++] = (target[j][1] - targetBBox[1]) / targetSize[1]; //y
            arr[index++] = (source[j][0] - sourceBBox[0]) / sourceSize[0]; //u
            arr[index++] = (source[j][1] - sourceBBox[1]) / sourceSize[1]; //v
        }
    }
    return arr;
}