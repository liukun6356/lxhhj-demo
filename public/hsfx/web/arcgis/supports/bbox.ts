import type { BBox } from "geojson";
import { minmax, toRadians } from "shared/utils/math";

export function bboxFromExtent(extent: ExtentLike) {
    return [extent.xmin, extent.ymin, extent.xmax, extent.ymax] as BBox;
}
export function bboxFromPoints(points: Coord[]) {
    let xmin = Infinity,
        ymin = Infinity,
        xmax = -Infinity,
        ymax = -Infinity;
    for (let point of points) {
        xmin = Math.min(xmin, point[0]);
        ymin = Math.min(ymin, point[1]);
        xmax = Math.max(xmax, point[0]);
        ymax = Math.max(ymax, point[1]);
    }
    return [xmin, ymin, xmax, ymax];
}
export function emptyBBox() {
    return [Infinity, Infinity, -Infinity, -Infinity] as BBox;
}
export function extendBBox(bbox: BBox, [x, y]: Coord) {
    if (x < bbox[0]) bbox[0] = x;
    if (x > bbox[2]) bbox[2] = x;
    if (y < bbox[1]) bbox[1] = y;
    if (y > bbox[3]) bbox[3] = y;
}
export function bboxTranslate(bbox: BBox, [offsetx, offsety]: number[]) {
    return [
        bbox[0] + offsetx,
        bbox[1] + offsety,
        bbox[2] + offsetx,
        bbox[3] + offsety,
    ] as BBox;
}
export function bboxSize(bbox: BBox) {
    return [bbox[2] - bbox[0], bbox[3] - bbox[1]]
}
export function bboxCorners([xmin, ymin, xmax, ymax]: BBox) {
    return [
        [xmin, ymax],
        [xmax, ymax],
        [xmax, ymin],
        [xmin, ymin]
    ]
}
export function bboxArea(bbox: BBox) {
    return (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
}
export function bboxCenter(bbox: BBox) {
    return [
        (bbox[2] + bbox[0]) / 2,
        (bbox[3] + bbox[1]) / 2
    ]
}
export function isBBoxOverlap(box1: BBox, box2: BBox) {
    const xmin = Math.max(box1[0], box2[0]);
    const ymin = Math.max(box1[1], box2[1]);
    const xmax = Math.min(box1[2], box2[2]);
    const ymax = Math.min(box1[3], box2[3]);
    return xmax > xmin && ymax > ymin;
}
export function bboxIntersection(box1: BBox, box2: BBox) {
    const xmin = Math.max(box1[0], box2[0]);
    const ymin = Math.max(box1[1], box2[1]);
    const xmax = Math.min(box1[2], box2[2]);
    const ymax = Math.min(box1[3], box2[3]);
    return xmax >= xmin && ymax >= ymin
        ? [xmin, ymin, xmax, ymax] as BBox
        : null;
}
//计算bbox旋转之后，四个角点对应的新的bbox, bbox是AABB盒，不是OBB盒
export function bboxRotate(bboxNoRotate: BBox, rotateCenter: Coord, rotation: number) {
    const rad = toRadians(rotation);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const [cx, cy] = rotateCenter;

    const cornersAfterRotate = bboxCorners(bboxNoRotate)
        .map(([x, y]) => {
            const X = x - cx;
            const Y = y - cy;
            return [
                X * cos - Y * sin + cx,
                X * sin + Y * cos + cy
            ];
        });
    const [XMIN, XMAX] = minmax(cornersAfterRotate.map((p) => p[0]));
    const [YMIN, YMAX] = minmax(cornersAfterRotate.map((p) => p[1]));
    return [XMIN, YMIN, XMAX, YMAX] as BBox;
}
export function isBBoxIntersect(
    [xmin, ymin, xmax, ymax]: BBox,
    [XMIN, YMIN, XMAX, YMAX]: BBox
) {
    return !(
        xmax < XMIN
        || xmin > XMAX
        || ymax < YMIN
        || ymin > YMAX
    );
}

export const DEFAULT_RADIUS = 6371008.8;
/**
 * 两点之间的测地线距离
 * @param lonlat1 经纬度
 * @param lonlat2 
 * @param radius 地球半径
 * @returns 
 */
export function geodesicDistance(lonlat1: Coord, lonlat2: Coord, radius = DEFAULT_RADIUS) {
    const lat1 = toRadians(lonlat1[1]);
    const lat2 = toRadians(lonlat2[1]);
    const deltaLatBy2 = (lat2 - lat1) / 2;
    const deltaLonBy2 = toRadians(lonlat2[0] - lonlat1[0]) / 2;
    const a = Math.sin(deltaLatBy2) ** 2 +
        Math.sin(deltaLonBy2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export function length(a: number[], b: number[]) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function getTileInfoWorldBBox(tileInfo: __esri.TileInfo): BBox {
    if (!tileInfo) return null;
    if (!(tileInfo as any)._worldBBox) {
        const { origin, lods, size } = tileInfo;
        const { level, resolution } = lods[0];
        const { x: xmin, y: ymax } = origin;
        const f = 2 ** level * resolution;
        const xmax = xmin + f * size[0];
        const ymin = ymax - f * size[1];
        (tileInfo as any)._worldBBox = [
            xmin, ymin, xmax, ymax,
        ] as BBox
    }
    return (tileInfo as any)._worldBBox
}