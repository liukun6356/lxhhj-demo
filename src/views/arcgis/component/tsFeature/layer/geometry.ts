export type PointLike = { x: number; y: number };

/**
 * 点是否在三角形内
 * @param p
 * @param A
 * @param B
 * @param C
 */
export function pointInTriangle(p: PointLike, A: PointLike, B: PointLike, C: PointLike) {
    const pa = [p.x - A.x, p.y - A.y];
    const pb = [p.x - B.x, p.y - B.y];
    const pc = [p.x - C.x, p.y - C.y];

    const v1 = pa[0] * pb[1] - pa[1] * pb[0]; //pa x pb
    const v2 = pb[0] * pc[1] - pb[1] * pc[0]; //pb x pc
    const v3 = pc[0] * pa[1] - pc[1] * pa[0]; //pc x pa
    return v1 * v2 >= 0 && v2 * v3 >= 0;
}

//点是否在extent内
export function pointInExtent(p: PointLike, extent: __esri.ExtentProperties) {
    return p.x >= extent.xmin && p.x <= extent.xmax && p.y >= extent.ymin && p.y <= extent.ymax;
}

//判断两个extent是否相交
export function isExtentIntersect(extent1: __esri.ExtentProperties, extent2: __esri.ExtentProperties) {
    return !(
        extent1.xmax < extent2.xmin ||
        extent1.xmin > extent2.xmax ||
        extent1.ymax < extent2.ymin ||
        extent1.ymin > extent2.ymax
    );
}

//返回两个extent相交范围
export function extentIntersection(extent1: __esri.ExtentProperties, extent2: __esri.ExtentProperties) {
    const xmin = Math.max(extent1.xmin, extent2.xmin);
    const ymin = Math.max(extent1.ymin, extent2.ymin);
    const xmax = Math.min(extent1.xmax, extent2.xmax);
    const ymax = Math.min(extent1.ymax, extent2.ymax);
    return xmax > xmin && ymax > ymin
        ? {
            xmin,
            ymin,
            xmax,
            ymax,
        }
        : null;
}

//简单多边形的面积
export function simplePolygonArea(ring: number[][]) {
    if (ring.length <= 2) return 0;
    let x0,
        y0,
        area = 0;

    for (let i = 0; i < ring.length; i++) {
        const x = ring[i][0];
        const y = ring[i][1];

        if (i > 0) {
            area += (x0 * y - x * y0) / 2; // area
        }
        x0 = x;
        y0 = y;
    }
    return Math.abs(area);
}

//extent向外扩张给定的距离
export function calcExpandExtent({ xmin, ymin, xmax, ymax }: __esri.ExtentProperties, expandSize: number | number[]) {
    const [sizeX, sizeY] = typeof expandSize === 'number' ? [expandSize, expandSize] : expandSize;
    return {
        xmin: xmin - sizeX,
        xmax: xmax + sizeX,
        ymin: ymin - sizeY,
        ymax: ymax + sizeY,
    };
}

//计算多个点[x,y][]的extent
export function calcCoordsExtent(points: number[][]) {
    let xmin = Infinity,
        ymin = Infinity,
        xmax = -Infinity,
        ymax = -Infinity;
    for (let i = points.length; i--; ) {
        const [x, y] = points[i];
        xmin = Math.min(xmin, x);
        xmax = Math.max(xmax, x);
        ymin = Math.min(ymin, y);
        ymax = Math.max(ymax, y);
    }
    return {
        xmin,
        ymin,
        xmax,
        ymax,
    };
}
//计算多个点{x,y}[]的extent
export function calcPointLikesExtent(points: PointLike[]) {
    let xmin = Infinity,
        ymin = Infinity,
        xmax = -Infinity,
        ymax = -Infinity;
    for (let i = points.length - 1; i--; ) {
        const { x, y } = points[i];
        xmin = Math.min(xmin, x);
        xmax = Math.max(xmax, x);
        ymin = Math.min(ymin, y);
        ymax = Math.max(ymax, y);
    }
    return {
        xmin,
        ymin,
        xmax,
        ymax,
    };
}
//计算三角形的extent
export function calcTriangleExtent(p1: number[], p2: number[], p3: number[]) {
    return {
        xmin: Math.min.call(null, p1[0], p2[0], p3[0]),
        xmax: Math.max.call(null, p1[0], p2[0], p3[0]),
        ymin: Math.min.call(null, p1[1], p2[1], p3[1]),
        ymax: Math.max.call(null, p1[1], p2[1], p3[1]),
    };
}

//闭合一个polygon的首尾
export function closePolygonRings(ring: number[][]) {
    const last = ring[ring.length - 1];
    if (ring[0][0] !== last[0] || ring[0][1] !== last[1]) {
        ring.push(ring[0]);
    }
    return ring;
}
