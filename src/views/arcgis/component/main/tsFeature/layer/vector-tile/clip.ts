import ExtentProperties = __esri.ExtentProperties;
import { VFeature, VLineClipContext, VPolygon, VPolyline } from "./interface";

/* clip features between two vertical or horizontal axis-parallel lines:
 *     |        |
 *  ___|___     |     /
 * /   |   \____|____/
 *     |        |
 *
 * k1 and k2 are the line coordinates (k1<k2)
 * axis: 0 for x, 1 for y
 * minAll and maxAll: minimum and maximum coordinate value for all features
 */
export function clipVT(
    vFeatures: VFeature[], //要裁剪数据源
    k1: number, //原始裁剪范围最小值
    k2: number, //原始裁剪范围最大值
    buffer: { polyline: number; polygon: number; point: number }, //对应几何额外扩充的边界范围
    axis: "x" | "y",
    vFsExtent: ExtentProperties //数据源范围
) {
    const fsMinAll = axis === "x" ? vFsExtent.xmin : vFsExtent.ymin;
    const fsMaxAll = axis === "x" ? vFsExtent.xmax : vFsExtent.ymax;

    const minBuffer = Math.min.call(null, buffer.point, buffer.polyline, buffer.polygon);
    if (fsMinAll >= k2  || fsMaxAll <= k1) {
        //扩充buffer后可能有交集, 但和原始范围没有交集, 
        return null;
    }
    if (fsMinAll >= k1 - minBuffer && fsMaxAll <= k2 + minBuffer) {
        return {
            vfs: vFeatures,
            extent: vFsExtent,
        };
    }
    const lineK1 = k1 - buffer.polyline,
        lineK2 = k2 + buffer.polyline,
        polygonK1 = k1 - buffer.polygon,
        polygonK2 = k2 + buffer.polygon;
    const result: VFeature[] = [];

    for (const vFeature of vFeatures) {
        if (vFeature.type === "point") {
            const v = axis === "x" ? vFeature.x : vFeature.y;
            if (v >= lineK1 && v <= lineK2) result.push(vFeature);
            continue;
        }
        const { geometry, type, extent } = vFeature;

        const min = axis === "x" ? extent.xmin : extent.ymin;
        const max = axis === "x" ? extent.xmax : extent.ymax;

        if (type === "vpolygon") {
            if (min >= polygonK1 && max < polygonK2) {
                result.push(vFeature);
                continue;
            } else if (max < polygonK1 || min >= polygonK2) {
                continue;
            }
            const newGeometry: VLineClipContext[] = [];
            for (const line of geometry) {
                clipPolygonRing(line, newGeometry, polygonK1, polygonK2, axis);
            }
            if (newGeometry.length) {
                result.push(addClipFeature(vFeature, newGeometry));
            }
        } else if (type === "vpolyline") {
            if (min >= lineK1 && max < lineK2) {
                result.push(vFeature);
                continue;
            } else if (max < lineK1 || min >= lineK2) {
                // trivial reject
                continue;
            }
            const newGeometry: VLineClipContext[] = [];
            // 对线不使用扩充边界,
            clipPolylinePath(geometry, newGeometry, lineK1, lineK2, axis);
            newGeometry.forEach((clipPath) => result.push(addClipFeature(vFeature, clipPath)));
        }
    }

    if (result.length) {
        const e = resolveVTFeatureExtent(result);
        return { extent: e, vfs: result };
    } else {
        return null;
    }
}

function resolveVTFeatureExtent(fs: VFeature[]) {
    let xmin = Infinity,
        xmax = -Infinity,
        ymin = Infinity,
        ymax = -Infinity;
    for (let item of fs) {
        if (item.type === "point") {
            xmin = Math.min(xmin, item.x);
            xmax = Math.max(xmax, item.x);
            ymin = Math.min(ymin, item.y);
            ymax = Math.max(ymax, item.y);
        } else {
            const e = item.extent;
            xmin = Math.min(xmin, e.xmin);
            xmax = Math.max(xmax, e.xmax);
            ymin = Math.min(ymin, e.ymin);
            ymax = Math.max(ymax, e.ymax);
        }
    }
    return { xmin, xmax, ymin, ymax };
}

function addClipFeature(
    oldClipFeature: VPolygon | VPolyline,
    newClipGeometry: VLineClipContext | VLineClipContext[]
): VFeature {
    const type = oldClipFeature.type;
    let extent = { xmin: Infinity, ymin: Infinity, xmax: -Infinity, ymax: -Infinity };
    if (type === "vpolygon") {
        for (let item of newClipGeometry as VLineClipContext[]) {
            calcPathExtent(extent, item.points);
        }
        return {
            id: oldClipFeature.id,
            attributes: oldClipFeature.attributes,
            extent,
            type: "vpolygon",
            geometry: newClipGeometry as VLineClipContext[],
        };
    } else if (type === "vpolyline") {
        calcPathExtent(extent, oldClipFeature.geometry.points);
        const clip = newClipGeometry as VLineClipContext;
        return {
            id: oldClipFeature.id,
            attributes: oldClipFeature.attributes,
            type: "vpolyline",
            originTotalLength: oldClipFeature.originTotalLength,
            geometry: {
                points: clip.points,
                size: clip.size,
                beforePoint: clip.beforePoint,
                afterPoint: clip.afterPoint,
                distance: clip.distance,
            },
            extent,
        };
    }

    function calcPathExtent(extent: ExtentProperties, points: number[]) {
        for (let i = 0; i < points.length; i += 3) {
            const x = points[i],
                y = points[i + 1];
            extent.xmin = Math.min(extent.xmin, x);
            extent.xmax = Math.max(extent.xmax, x);
            extent.ymin = Math.min(extent.ymin, y);
            extent.ymax = Math.max(extent.ymax, y);
        }
    }
}

function newSlice(line: VLineClipContext, useDis = false) {
    return {
        size: line.size,
        points: [],
        distance: useDis ? [] : null,
    } as VLineClipContext;
}

function clipPolygonRing(ring: VLineClipContext, newGeom: VLineClipContext[], k1: number, k2: number, axis: "x" | "y") {
    const { points } = ring;
    let slice = newSlice(ring, false);
    const intersect = axis === "x" ? intersectX : intersectY;
    let t: number;
    for (let i = 0; i < points.length - 3; i += 3) {
        const ax = points[i];
        const ay = points[i + 1];
        const az = points[i + 2];
        const bx = points[i + 3];
        const by = points[i + 4];
        const a = axis === "x" ? ax : ay;
        const b = axis === "x" ? bx : by;

        if (a < k1) {
            // (a)---|-->(b) tile  | (line enters the clip region from the left)
            if (b > k1) {
                t = intersect(slice, ax, ay, bx, by, k1);
            }
        } else if (a > k2) {
            // |  tile (b)<--|---(a) (line enters the clip region from the right)
            if (b < k2) {
                t = intersect(slice, ax, ay, bx, by, k2);
            }
        } else {
            addPoint(slice, ax, ay, az);
        }
        if (b < k1 && a >= k1) {
            //(line exits the clip region on the left)
            // (b)<--|---(a)   |  or  (b)<--|------|---(a)
            //       |   tile  |            | tile |
            t = intersect(slice, ax, ay, bx, by, k1);
        }
        if (b > k2 && a <= k2) {
            //(line exits the clip region on the right)
            // |  (a)---|-->(b)  or  (a)---|------|-->(b)
            // |   tile |                  | tile |
            t = intersect(slice, ax, ay, bx, by, k2);
        }
    }

    // add the last point
    let last = points.length - 3;
    const ax = points[last];
    const ay = points[last + 1];
    const az = points[last + 2];
    const a = axis === "x" ? ax : ay;
    if (a >= k1 && a <= k2) {
        addPoint(slice, ax, ay, az);
    }
    // close the polygon if its endpoints are not the same after clipping
    last = slice.points.length - 3;
    if (last >= 3 && (slice.points[last] !== slice.points[0] || slice.points[last + 1] !== slice.points[1])) {
        addPoint(slice, slice.points[0], slice.points[1], slice.points[2]);
    }

    // add the final slice, 至少3个点
    if (slice.points.length >= 9) {
        newGeom.push(slice);
    }
}

function clipPolylinePath(
    path: VLineClipContext,
    newGeom: VLineClipContext[],
    k1: number,
    k2: number,
    axis: "x" | "y"
) {
    const distance = path.distance;
    const clipDis = !!distance;
    const { points } = path;
    const intersect = axis === "x" ? intersectX : intersectY;
    let newClipCtx = newSlice(path, clipDis);
    let addFirstPoint = 0;
    for (let i = 0; i < points.length - 3; i += 3) {
        const ax = points[i];
        const ay = points[i + 1];
        const az = points[i + 2];
        const bx = points[i + 3];
        const by = points[i + 4];
        const a = axis === "x" ? ax : ay;
        const b = axis === "x" ? bx : by;
        const disa = distance?.[i / 3];
        const disb = distance?.[i / 3 + 1];
        let exited = false,
            t: number = null;

        if (a < k1) {
            // (a)---|-->(b) tile  | (line enters the clip region from the left)
            if (b > k1) {
                t = intersect(newClipCtx, ax, ay, bx, by, k1);
                addFirstPoint += 1;
                clipDis && newClipCtx.distance.push(disa + (disb - disa) * t);
            }
        } else if (a > k2) {
            // |  tile (b)<--|---(a) (line enters the clip region from the right)
            if (b < k2) {
                t = intersect(newClipCtx, ax, ay, bx, by, k2);
                addFirstPoint += 1;
                clipDis && newClipCtx.distance.push(disa + (disb - disa) * t);
            }
        } else {
            addPoint(newClipCtx, ax, ay, az);
            t = 0;
            addFirstPoint += 1;
            clipDis && newClipCtx.distance.push(disa);
        }
        if (addFirstPoint === 1) {
            //第一个添加的点,寻找前置点
            if (t === 0) {
                //裁剪点为端点a, 需要继续向前找寻
                if (i === 0) {
                    newClipCtx.beforePoint = path.beforePoint;
                } else {
                    newClipCtx.beforePoint = [points[i - 3], points[i - 2]];
                }
            } else {
                //裁剪点在线段ab上
                newClipCtx.beforePoint = [ax, ay];
            }
        }
        if (b < k1 && a >= k1) {
            //(line exits the clip region on the left)
            // (b)<--|---(a)   |  or  (b)<--|------|---(a)
            //       |   tile  |            | tile |
            t = intersect(newClipCtx, ax, ay, bx, by, k1);
            clipDis && newClipCtx.distance.push(disa + (disb - disa) * t);
            exited = true;
        }
        if (b > k2 && a <= k2) {
            //(line exits the clip region on the right)
            // |  (a)---|-->(b)  or  (a)---|------|-->(b)
            // |   tile |                  | tile |
            t = intersect(newClipCtx, ax, ay, bx, by, k2);
            clipDis && newClipCtx.distance.push(disa + (disb - disa) * t);
            exited = true;
        }

        if (exited) {
            if (t === 1) {
                //裁剪点刚好为b
                newClipCtx.afterPoint = [points[i + 6], points[i + 7]];
                if (points[i + 6] === undefined || points[i + 7] === undefined) {
                    debugger;
                }
            } else {
                newClipCtx.afterPoint = [bx, by];
            }
            newClipCtx.points.length >= 6 && newGeom.push(newClipCtx);
            newClipCtx = newSlice(path);
            addFirstPoint = 0;
            t = null;
        }
    }

    // add the last point
    let last = points.length - 3;
    const ax = points[last];
    const ay = points[last + 1];
    const az = points[last + 2];
    const a = axis === "x" ? ax : ay;
    if (a >= k1 && a <= k2) {
        addPoint(newClipCtx, ax, ay, az);
        newClipCtx.afterPoint = path.afterPoint;
        clipDis && newClipCtx.distance.push(distance[last / 3]);
    }

    // add the final slice
    if (newClipCtx.points.length >= 6) {
        newGeom.push(newClipCtx);
    }
}

function addPoint(out: VLineClipContext, x: number, y: number, z: number) {
    const points = out.points;
    const length = points.length;
    if (length === 0 || x !== points[length - 3] || y !== points[length - 2]) {
        out.points.push(x, y, z);
    }
}

function intersectX(out: VLineClipContext, ax: number, ay: number, bx: number, by: number, x: number) {
    const t = (x - ax) / (bx - ax);
    addPoint(out, x, ay + (by - ay) * t, Infinity);
    return t;
}

function intersectY(out: VLineClipContext, ax: number, ay: number, bx: number, by: number, y: number) {
    const t = (y - ay) / (by - ay);
    addPoint(out, ax + (bx - ax) * t, y, Infinity);
    return t;
}
