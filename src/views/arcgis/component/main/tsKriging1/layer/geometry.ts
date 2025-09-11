export type PointLike = { x: number; y: number };
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
