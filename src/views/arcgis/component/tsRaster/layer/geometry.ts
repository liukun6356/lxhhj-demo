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

//计算三角形的extent
export function calcTriangleExtent(p1: number[], p2: number[], p3: number[]) {
    return {
        xmin: Math.min.call(null, p1[0], p2[0], p3[0]),
        xmax: Math.max.call(null, p1[0], p2[0], p3[0]),
        ymin: Math.min.call(null, p1[1], p2[1], p3[1]),
        ymax: Math.max.call(null, p1[1], p2[1], p3[1]),
    };
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
