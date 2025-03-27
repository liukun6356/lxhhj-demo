import { EsriFeature, VFeature, VLineClipContext, VTile, VTileInfo } from "./interface";
import ExtentProperties = __esri.ExtentProperties;

export function createVTile(
    sourceFeatures: VFeature[],
    tileInfo: VTileInfo,
    tolerance: number,
    sourceExtent: ExtentProperties
): VTile {
    let tileNumPoints = 0,
        tileNumSimplify = 0;
    const tileFeatures = [] as EsriFeature[]; //after simplify
    const tileFeatureExtent = {
        xmin: Infinity,
        ymin: Infinity,
        xmax: -Infinity,
        ymax: -Infinity,
    };
    //添加简化后的要素并更新范围
    for (let f of sourceFeatures) {
        addSimplifiedFeature(f, tolerance);
    }
    return {
        id: tileInfo.id,
        tile: tileInfo,
        numPoints: tileNumPoints,
        numSimplify: tileNumSimplify,
        source: sourceFeatures,
        sourceExtent,
        features: tileFeatures,
        featuresExtent: tileFeatures.length ? tileFeatureExtent : null,
        _inheritFeatureFrom: null,
    };

    function addSimplifiedFeature(srcVFeature: VFeature, tolerance: number) {
        const { type } = srcVFeature;
        const common = {
            id: srcVFeature.id,
            attributes: srcVFeature.attributes,
        };
        let featureNum = 0,
            featureSimplify = 0;
        if (type === "point") {
            tileNumPoints += 1;
            tileNumSimplify += 1;
            tileFeatures.push(srcVFeature);
            const e = tileFeatureExtent;
            e.xmin = Math.min(srcVFeature.x, e.xmin);
            e.xmax = Math.max(srcVFeature.x, e.xmax);
            e.ymin = Math.min(srcVFeature.y, e.ymin);
            e.ymax = Math.max(srcVFeature.y, e.ymax);
        } else {
            const extentAfterSimplify = {
                xmin: Infinity,
                ymin: Infinity,
                xmax: -Infinity,
                ymax: -Infinity,
            };
            if (type === "vpolygon") {
                const simplified: number[][][] = [];
                for (let geometry of srcVFeature.geometry) {
                    const result = simplifyPolygonRing(geometry, tolerance);
                    featureNum += result.numPoints;
                    featureSimplify += result.numSimplified;
                    if (featureSimplify) {
                        simplified.push(result.points);
                    } else {
                        break;
                    }
                }
                tileNumPoints += featureNum;
                tileNumSimplify += featureSimplify;
                if (!simplified.length) return;
                simplified.forEach((path) => resolveExtent(extentAfterSimplify, path));
                tileFeatures.push({
                    ...common,
                    type: "polygon",
                    rings: simplified,
                    extent: extentAfterSimplify,
                });
            } else if (type === "vpolyline") {
                const result = simplifyPath(srcVFeature.geometry, tolerance);
                tileNumPoints += result.numPoints;
                tileNumSimplify += result.numSimplified;
                if (!result.numSimplified) return;
                resolveExtent(extentAfterSimplify, result.points);
                tileFeatures.push({
                    ...common,
                    type: "polyline",
                    path: result.points,
                    distance: result.distance,
                    length: null,
                    extent: extentAfterSimplify,
                    beforePoint: result.beforePoint,
                    afterPoint: result.afterPoint,
                });
            }
            const e = tileFeatureExtent;
            e.xmin = Math.min(extentAfterSimplify.xmin, e.xmin);
            e.xmax = Math.max(extentAfterSimplify.xmax, e.xmax);
            e.ymin = Math.min(extentAfterSimplify.ymin, e.ymin);
            e.ymax = Math.max(extentAfterSimplify.ymax, e.ymax);
        }
    }

    function simplifyPath(path: VLineClipContext, tolerance: number) {
        let numPoints = 0,
            numSimplified = 0,
            containDis = !!path.distance,
            disResult: number[] = containDis ? [] : null,
            result: number[][] = [];
        if (tolerance > 0 && path.size < tolerance) {
            numPoints += path.points.length / 3;
        } else {
            const points = path.points;
            const sqlTolerance = tolerance ** 2;
            for (let i = 0, j = 0, len = points.length; i < len; i += 3, j += 1) {
                if (tolerance === 0 || points[i + 2] > sqlTolerance) {
                    numSimplified++;
                    result.push([points[i], points[i + 1]]);
                    containDis && disResult.push(path.distance[j]);
                }
                numPoints++;
            }
        }
        const p0 = result[0],
            pn = result[result.length - 1];
        if (result.length < 2 || (p0[0] === pn[0] && p0[1] === pn[1])) {
            result = [];
            numSimplified = 0;
        }
        return {
            beforePoint: path.beforePoint,
            afterPoint: path.afterPoint,
            points: result,
            distance: disResult,
            numPoints,
            numSimplified,
        };
    }

    function simplifyPolygonRing(ring: VLineClipContext, tolerance: number) {
        let numPoints = 0,
            numSimplified = 0,
            result: number[][] = [];
        const sqTolerance = tolerance ** 2;
        if (tolerance > 0 && ring.size < sqTolerance) {
            //直接过滤
            numPoints += ring.points.length / 3;
        } else {
            const points = ring.points;
            for (let i = 0, len = points.length; i < len; i += 3) {
                if (tolerance === 0 || points[i + 2] > sqTolerance) {
                    numSimplified++;
                    result.push([points[i], points[i + 1]]);
                }
                numPoints++;
            }
        }
        //面最少要3个顶点，arcgis ring 是闭合线,
        if (result.length < 4) {
            result = [];
            numSimplified = 0;
        }
        return {
            points: result,
            numPoints,
            numSimplified,
        };
    }

    function resolveExtent(extent: ExtentProperties, points: number[][]) {
        for (let i = 0, len = points.length; i < len; i += 1) {
            const x = points[i][0],
                y = points[i][1];
            extent.xmin = Math.min(extent.xmin, x);
            extent.xmax = Math.max(extent.xmax, x);
            extent.ymin = Math.min(extent.ymin, y);
            extent.ymax = Math.max(extent.ymax, y);
        }
    }
}

export function getVTileInfo(z: number, x: number, y: number, tileScheme: __esri.TileInfoProperties): VTileInfo;
export function getVTileInfo(
    z: number,
    x: number,
    y: number,
    resolution: number,
    scale: number,
    origin: { x: number; y: number },
    tileSize: number[]
): VTileInfo;
export function getVTileInfo(...args: any[]) {
    let z: number,
        x: number,
        y: number,
        origin: { x: number; y: number },
        resolution: number,
        scale: number,
        tileSize: number[];
    if (typeof args[3] === "number") {
        [z, x, y, resolution, scale, origin, tileSize] = args;
    } else {
        [z, x, y] = args;
        const tileScheme = args[3] as __esri.TileInfoProperties;
        const lod = tileScheme.lods.find((i) => i.level === z);
        if (!lod) throw new Error("找不到对应等级");
        resolution = lod.resolution;
        scale = lod.scale;
        origin = { x: tileScheme.origin.x, y: tileScheme.origin.y };
        tileSize = tileScheme.size;
    }

    const tileWorldWidth = tileSize[0] * resolution;
    const tileWorldHeight = tileSize[1] * resolution;
    const info: VTileInfo = {
        id: getTileId(z, x, y),
        z,
        x,
        y,
        resolution,
        scale,
        xmin: origin.x + x * tileWorldWidth,
        xmax: origin.x + (x + 1) * tileWorldWidth,
        ymax: origin.y - y * tileWorldHeight,
        ymin: origin.y - (y + 1) * tileWorldHeight,
        width: tileWorldWidth,
        height: tileWorldHeight,
        cx: null,
        cy: null,
    };
    info.cx = (info.xmin + info.xmax) / 2;
    info.cy = (info.ymin + info.ymax) / 2;
    return info;
}

export function getTileId(z: number, x: number, y: number) {
    return [z, x, y].join("/");
}

export function tileIdToZXY(id: string) {
    const [z, x, y] = id.split("/");
    return { z: +z, x: +x, y: +y };
}

/**
 * ---------------------
 * |    tl   |   tr    |
 * |---------|---------|
 * |    bl   |   br    |
 * ---------------------
 * @param z
 * @param x
 * @param y
 * @return [tl, tr, bl, br]
 */
export function getChildrenTiles(z: number, x: number, y: number) {
    z = z + 1;
    x = x * 2;
    y = y * 2;
    return [
        { z, x, y }, //左上
        { z, x: x + 1, y }, //右上
        { z, x, y: y + 1 }, //左下
        { z, x: x + 1, y: y + 1 }, //右下
    ];
}

//在指定level获取与给定extent相交(擦边不算)的tile的行列范围,
export function findCoverTileBoundsAtGivenLevel(
    extent: ExtentProperties,
    tileScheme: __esri.TileInfoProperties,
    level: number
) {
    const size = tileScheme.size[0];
    const origin = tileScheme.origin;
    const resolution = tileScheme.lods.find((i) => i.level === level).resolution;
    const tileSizeInv = 1 / (resolution * size);
    const colMin = Math.floor((extent.xmin - origin.x) * tileSizeInv);
    let colMax = (extent.xmax - origin.x) * tileSizeInv;
    colMax = colMax === Math.floor(colMax) ? colMax - 1 : Math.floor(colMax);
    const rowMin = Math.floor((origin.y - extent.ymax) * tileSizeInv);
    let rowMax = (origin.y - extent.ymin) * tileSizeInv;
    rowMax = rowMax === Math.floor(rowMax) ? rowMax - 1 : Math.floor(rowMax);
    return [colMin, colMax, rowMin, rowMax];
}

export function getBoundsExtent(level:number, bounds:number[], tileScheme: __esri.TileInfoProperties){
    const size = tileScheme.size[0];
    const origin = tileScheme.origin;
    const resolution = tileScheme.lods.find((i) => i.level === level).resolution;
    const tileSize = resolution * size;
    const [colmin, colmax, rowmin, rowmax] = bounds;
    return {
        xmin: origin.x + colmin * tileSize,
        xmax: origin.x + (colmax + 1) * tileSize,
        ymin: origin.y - (rowmax + 1) * tileSize,
        ymax: origin.y - rowmin * tileSize,
    };
}

export function tileSpiralGenerator<T>(bounds: number[], gen: (x: number, y: number) => T, reverse = true) {
    let [left, right, top, bottom] = bounds;
    const temp = [] as [number, number][];

    while (top < bottom && left < right) {
        for (let i = left; i < right; i++) temp.push([i, top]);
        for (let i = top; i < bottom; i++) temp.push([right, i]);
        for (let i = right; i > left; i--) temp.push([i, bottom]);
        for (let i = bottom; i > top; i--) temp.push([left, i]);
        left++;
        right--;
        top++;
        bottom--;
    }

    if (left == right) {
        for (let i = top; i <= bottom; i++) temp.push([left, i]);
    } else if (top == bottom) {
        for (let i = left; i <= right; i++) temp.push([i, top]);
    }
    const result = temp.map(([x, y]) => gen(x, y));
    return reverse ? result.reverse() : result;
}

//在指定level获取覆盖给定extent的vtile对象,
export function findCoverVTilesAtGivenLevel(
    extent: ExtentProperties,
    tileScheme: __esri.TileInfoProperties,
    level: number
) {
    const result = [] as VTileInfo[];
    const [xmin, xmax, ymin, ymax] = findCoverTileBoundsAtGivenLevel(extent, tileScheme, level);
    for (let x = xmin; x <= xmax; x++) {
        for (let y = ymin; y <= ymax; y++) {
            result.push(getVTileInfo(level, x, y, tileScheme));
        }
    }
    return result;
}

//查找某个resolution所在的lod
export function findLodAtGivenResolution(resolution: number, tileScheme: __esri.TileInfoProperties) {
    const index = tileScheme.lods.findIndex((i) => {
        return i.resolution < resolution;
    });
    if (index === -1) return tileScheme.lods.slice(-1)[0];
    return tileScheme.lods[Math.max(0, index - 1)];
}

export type VTileNode = VTileInfo & {
    children: VTileNode[];
    parent: VTileNode;
};
//创建带缓存的vtile getter
export function createVTileTreeWithScheme(opts: { tileScheme: __esri.TileInfo; minLevel?: number; maxLevel?: number }) {
    const tileScheme = opts.tileScheme;
    const minLevel = opts.minLevel ?? tileScheme.lods[0].level;
    const maxLevel = opts.maxLevel ?? tileScheme.lods.slice(-1)[0].level;
    const cache = new Map<string, VTileNode>();
    const origin = tileScheme.origin;
    const tileSize = tileScheme.size;
    const lodMap = tileScheme.lods.reduce((result, curLod) => {
        result[curLod.level] = {
            level: curLod.level,
            resolution: curLod.resolution,
            scale: curLod.scale,
        };
        return result;
    }, {} as Record<number, { level: number; resolution: number; scale: number }>);
    function parentGetter(this: VTileNode & { _parent?: VTileNode }) {
        const { z, x, y } = this;
        if (z <= minLevel) return null;
        if (!this._parent) {
            const { resolution, scale } = lodMap[z - 1];
            const parent = wrap(
                getVTileInfo(z - 1, Math.floor(x / 2), Math.floor(y / 2), resolution, scale, origin, tileSize)
            );
            this._parent = parent;
            cache.set(parent.id, parent);
        }
        return this._parent;
    }
    function childrenGetter(this: VTileNode & { _children?: VTileNode[] }) {
        const { z, x, y } = this;
        if (z >= maxLevel) return null;
        if (!this._children) {
            const _z = z + 1;
            const _x = x * 2;
            const _y = y * 2;
            const { resolution, scale } = lodMap[_z];
            const childrens = [
                [0, 1],
                [1, 1],
                [0, 0],
                [1, 0],
            ].map(([xoffset, yoffset]) => {
                return wrap(getVTileInfo(_z, _x + xoffset, _y + yoffset, resolution, scale, origin, tileSize));
            });
            this._children = childrens;
            childrens.forEach((c) => cache.set(c.id, c));
        }
        return this._children;
    }
    function wrap(obj: VTileInfo) {
        Reflect.defineProperty(obj, "children", {
            get: childrenGetter,
        });
        Reflect.defineProperty(obj, "parent", {
            get: parentGetter,
        });
        return obj as VTileNode;
    }

    function _get(tileId: string): VTileNode;
    function _get(z: number, x: number, y: number): VTileNode;
    function _get(...args: any[]) {
        let tileId: string;
        if (typeof args[0] === "number") {
            const [z, x, y] = args;
            const { resolution, scale } = lodMap[z];
            tileId = getTileId(z, x, y);
            if (!cache.has(tileId)) {
                cache.set(tileId, wrap(getVTileInfo(z, x, y, resolution, scale, origin, tileSize)));
            }
        } else {
            tileId = args[0];
            if (!cache.has(tileId)) {
                const { z, x, y } = tileIdToZXY(tileId);
                const { resolution, scale } = lodMap[z];
                cache.set(tileId, wrap(getVTileInfo(z, x, y, resolution, scale, origin, tileSize)));
            }
        }
        return cache.get(tileId);
    }
    return _get;
}
