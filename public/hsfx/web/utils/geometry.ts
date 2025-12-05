export function resolvePointLikeExtent(points: { x: number, y: number }[]) {
    let xmin = Infinity, xmax = -Infinity,
        ymin = Infinity, ymax = -Infinity;
    for (let i = points.length; i--;) {
        xmin = Math.min(xmin, points[i].x);
        xmax = Math.max(xmax, points[i].x);
        ymin = Math.min(ymin, points[i].y);
        ymax = Math.max(ymax, points[i].y);
    }
    return { xmin, xmax, ymin, ymax }
}