//创建一个矢量切片, 需要结合tileScheme切片方案
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import { clipVT } from "./clip";
import { convert as convertToVFeature } from "./convert";
import { EsriFeature, VFeature, VTOption, VTile } from "./interface";
import { createVTile, getChildrenTiles, getTileId, getVTileInfo } from "./tile";
import ExtentProperties = __esri.ExtentProperties;

const DefaultVTOption = {
    maxZoom: 14,
    indexMaxZoom: 5,
    indexMaxPoints: 100000,
    tolerance: 3, //容差像素
    polygonBuffer: 0.01,
    polylineBuffer: 0.01,
    pointBuffer: 0.01,
    debug: false,
} as VTOption;

export function createVectorTile(
    features: EsriFeature[],
    option: Partial<VTOption>,
    tileScheme: TileInfo,
    fullExtent: __esri.ExtentProperties
) {
    const $options = { ...DefaultVTOption, ...option };
    //最小容差, 在最大zoom出现
    const minTolerance = $options.tolerance * tileScheme.lods.find((i) => i.level === $options.maxZoom).resolution;
    const converts = convertToVFeature(features, $options.tolerance === 0 ? 0 : minTolerance);
    const $fullExtent =
        fullExtent ||
        converts.reduce(
            (res, cur) => {
                const e =
                    cur.type === "point"
                        ? {
                              xmin: cur.x,
                              xmax: cur.x,
                              ymin: cur.y,
                              ymax: cur.y,
                          }
                        : cur.extent;
                res.xmin = Math.min(res.xmin, e.xmin);
                res.xmax = Math.max(res.xmax, e.xmax);
                res.ymin = Math.min(res.ymin, e.ymin);
                res.ymax = Math.max(res.ymax, e.ymax);
                return res;
            },
            {
                xmin: Infinity,
                ymin: Infinity,
                xmax: -Infinity,
                ymax: -Infinity,
            }
        );
    const $tiles = {} as { [p: string]: VTile };

    let $stats = {} as { [p: string]: any },
        $total: number = 0;
    if ($options.debug) {
        console.log(`当前配置: indexMaxZoom: ${$options.indexMaxZoom}, indexMaxPoints: ${$options.indexMaxPoints}`);
        console.time("生成初始切片");
    }
    if (converts.length) {
        splitTile(converts, 0, 0, 0, null, null, null, $fullExtent);
    } else {
        console.warn("未提供输入数据");
    }
    $options.debug && console.timeEnd("生成初始切片");

    /**
     * 如果目标tile未指定, 则会一直split直到初始最大zoom或者points低于最大点数
     *  z,x,y 源tile
     *  tz,tx,ty 目标tile
     */
    function splitTile(
        sourceVFs: VFeature[],
        z: number,
        x: number,
        y: number,
        tz: number,
        tx: number,
        ty: number,
        srcVFsExtent: ExtentProperties
    ) {
        const stack = [
            {
                sourceVFsExtent: srcVFsExtent,
                sourceVFs: sourceVFs, //来源于初始或父元素裁剪之后
                z,
                x,
                y,
                parentVFsExtent: $tiles[getTileId(z - 1, x >> 1, y >> 1)]?.sourceExtent,
            },
        ];
        while (stack.length) {
            let { sourceVFsExtent, sourceVFs, z, x, y, parentVFsExtent } = stack.pop();
            const id = getTileId(z, x, y);
            let tileData = $tiles[id];
            if (!tileData) {
                $options.debug && console.time(`创建切片:${id}`);
                const tileInfo = getVTileInfo(z, x, y, tileScheme);
                const tolerance = $options.tolerance * tileInfo.resolution;
                if (tolerance === 0 && z > 0 && parentVFsExtent) {
                    //不做简化(feature 与 VFeature 完全一致) 且 数据完全包裹, 则直接使用父tile的内容
                    if (
                        parentVFsExtent.xmin >= tileInfo.xmin &&
                        parentVFsExtent.xmax <= tileInfo.xmax &&
                        parentVFsExtent.ymin >= tileInfo.ymin &&
                        parentVFsExtent.ymax <= tileInfo.ymax
                    ) {
                        const parentId = getTileId(z - 1, x >> 1, y >> 1);
                        const parent = $tiles[parentId];
                        tileData = {
                            id: tileInfo.id,
                            tile: tileInfo,
                            numPoints: parent.numPoints,
                            numSimplify: parent.numSimplify,
                            source: sourceVFs,
                            sourceExtent: sourceVFsExtent,
                            features: null, //查找parent获取
                            featuresExtent: parent.featuresExtent,
                            _inheritFeatureFrom: parent._inheritFeatureFrom || parent.id,
                        };
                    }
                }
                if (!tileData) {
                    tileData = createVTile(sourceVFs, tileInfo, tolerance, sourceVFsExtent);
                }
                $tiles[id] = tileData;
                if ($options.debug) {
                    console.log(
                        "tile z%d/%d/%d (features: %d, points: %d, simplified: %d)",
                        z,
                        y,
                        x,
                        tileData.numPoints,
                        tileData.numSimplify
                    );
                    console.timeEnd("creation");
                    let key = "z" + z;
                    $stats[key] = ($stats[key] || 0) + 1;
                    $total++;
                }
            }

            const tileInfo = tileData.tile;

            // 第一次split
            if (tz === undefined || tz === null) {
                // 到达maxZoom 或者 点数小于最大点数限制, 停止切分
                if (z === $options.indexMaxZoom || tileData.numPoints <= $options.indexMaxPoints) {
                    continue;
                }
            } else if (z === $options.maxZoom || z === tz) {
                //到达最大层级后不会在继续细分, source不需要了
                z === $options.maxZoom && (tileData.source = null);
                continue;
            } else {
                // 没有父tile
                const zoomSteps = tz - z;
                if (x !== tx >> zoomSteps || y !== ty >> zoomSteps) {
                    continue;
                }
            }

            // 继续切分, 则不在需要保存源几何数据
            tileData.source = null;

            if (sourceVFs.length === 0) continue;

            $options.debug && console.time(`clipping,${getTileId(z, x, y)}`);

            const { xmin, ymin, xmax, ymax } = tileInfo; //tile范围
            const tileSize = xmax - xmin;
            const halfSize = tileSize / 2;

            const buffer = {
                polyline: 0.5 * $options.polylineBuffer * tileSize,
                polygon: 0.5 * $options.polygonBuffer * tileSize,
                point: 0.5 * $options.pointBuffer * tileSize,
            };
            type R = ReturnType<typeof clipVT>;
            let topLeft: R = null;
            let bottomLeft: R = null;
            let topRight: R = null;
            let bottomRight: R = null;

            let left = clipVT(sourceVFs, xmin, xmin + halfSize, buffer, "x", sourceVFsExtent);
            let right = clipVT(sourceVFs, xmin + halfSize, xmax, buffer, "x", sourceVFsExtent);

            if (left) {
                topLeft = clipVT(left.vfs, ymin + halfSize, ymax, buffer, "y", left.extent);
                bottomLeft = clipVT(left.vfs, ymin, ymin + halfSize, buffer, "y", left.extent);
                left = null;
            }
            if (right) {
                topRight = clipVT(right.vfs, ymin + halfSize, ymax, buffer, "y", right.extent);
                bottomRight = clipVT(right.vfs, ymin, ymin + halfSize, buffer, "y", right.extent);
                right = null;
            }

            $options.debug && console.timeEnd(`clipping,${getTileId(z, x, y)}`);

            const childTiles = getChildrenTiles(z, x, y);
            [topLeft, topRight, bottomLeft, bottomRight].forEach((item, idx) => {
                item &&
                    stack.push({
                        sourceVFsExtent: item.extent,
                        sourceVFs: item.vfs,
                        ...childTiles[idx],
                        parentVFsExtent: tileData.featuresExtent,
                    });
            });
        }
    }

    function getTile(z: number, x: number, y: number) {
        if (z < 0 || z > 24) return null;

        //const z2 = 1 << z;
        //x = (x + z2) & (z2 - 1); // wrap tile x coordinate

        const id = getTileId(z, x, y);
        if ($tiles[id]) return $tiles[id];

        let z0 = z;
        let x0 = x;
        let y0 = y;
        let parent;

        while (!parent && z0 > 0) {
            z0--;
            x0 = x0 >> 1;
            y0 = y0 >> 1;
            parent = $tiles[getTileId(z0, x0, y0)];
        }

        if (!parent || !parent.source?.length) return null;

        splitTile(parent.source, z0, x0, y0, z, x, y, parent.sourceExtent);

        return $tiles[id];
    }

    return {
        tiles: $tiles,
        splitTile,
        getTile,
        options: $options,
    };
}
