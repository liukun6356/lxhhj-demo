import {VTileInfo} from "./interface"
import Extent from "@arcgis/core/geometry/Extent";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import {intersect} from "@arcgis/core/geometry/geometryEngine";
import * as projection from "@arcgis/core/geometry/projection";
import Polygon from "@arcgis/core/geometry/Polygon";
import {findCoverVTilesAtGivenLevel, findLodAtGivenResolution} from "./tile";
import {calcCoordsExtent, calcTriangleExtent, extentIntersection} from "./geometry";
import {clamp} from "lodash-es";
import {Quadtree} from "./quadtree";
import {invokeEarcut} from "./polygon";
import Arrugator from "arrugator";

type RasterProjectTriangleItem = {
    width: number; //dstCrs
    height: number; //dstCrs
    xmin: number; //dstCrs
    ymin: number; //dstCrs
    xmax: number; //dstCrs
    ymax: number; //dstCrs
    dstTri: number[][]; //目标crs三角形
    srcTri: number[][]; //源crs三角形
};

//栅格重投影tile的划分
export type RasterProjectSplitTileResult = {
    tileInfo: VTileInfo;
    positionRTC: number[][]; //顶点数组，相对于tile中心点
    uv: number[][]; //顶点纹理坐标, 相对于imageExtent对应的区域, 以区域左下角原点, 向右向上为正
    imageExtent: {
        // 相对于整个栅格纹理, 这些顶点纹理的范围, 以原始栅格左上角原点，向右向下为正
        sx: number; //纹理左上角x，
        sy: number; //纹理左上角y
        width: number; //纹理宽度
        height: number; //纹理高度
    };
    debugData?: {
        raw: number[][][];
        optimize: number[][][];
    };
};

export type RasterProjectSplitParams = {
    col: number; //栅格的列数
    row: number; //栅格的行数
    srcExtent: __esri.ExtentProperties; // 源坐标系范围
    srcCrs: __esri.SpatialReferenceProperties; //源坐标系
    dstCrs: __esri.SpatialReferenceProperties; //目标坐标系
    dstTileScheme: __esri.TileInfoProperties; //目标坐标系的tileInfo
    padding: number; //tile的边界扩展像素数
    resolutionDst?: number;
};


//获取栅格投影区域划分的tile
export async function getRasterProjectionExtentTileSplit(opts: RasterProjectSplitParams): Promise<{
    tileSplit: RasterProjectSplitTileResult[]; //划分后dst内tiles
    fullExtent: __esri.ExtentProperties; //划分后dst范围
    projectData;
}> {
    const {col, row, srcCrs, dstCrs} = opts;
    const srcExtent = new Extent(opts.srcExtent);
    const tileScheme = TileInfo.fromJSON(opts.dstTileScheme);
    const tileHalfSizeFactor = [2 / tileScheme.size[0], 2 / tileScheme.size[1]]; //tile的半宽高
    const isSameCrs = new SpatialReference(srcCrs).equals(dstCrs as __esri.SpatialReference);
    if (!isSameCrs) await projection.load();
    const project = isSameCrs
        ? (pointSrc: number[]) => pointSrc
        : (pointSrc: number[]): number[] => {
            const point = projection.project(
                {
                    type: "point",
                    x: pointSrc[0],
                    y: pointSrc[1],
                    spatialReference: srcCrs,
                } as __esri.Point,
                dstCrs
            ) as __esri.Point;
            return [point.x, point.y];
        };
    const projectInvert = (pointDst: number[]): number[] => {
        const point = projection.project(
            {
                type: "point",
                x: pointDst[0],
                y: pointDst[1],
                spatialReference: dstCrs,
            } as __esri.Point,
            srcCrs
        ) as __esri.Point;
        return [point.x, point.y];
    };
    let triangleSplit: ReturnType<typeof extentProjectionTriangulation>, //三角划分
        dstFullExtent: __esri.ExtentProperties, //栅格投影后的范围
        dstCoverTiles: VTileInfo[], //dst范围包含的tiles
        useDstTileSplit = isSameCrs; //是否使用tile划分而不是三角划分

    if (!isSameCrs) {
        triangleSplit = extentProjectionTriangulation({
            srcExtent: srcExtent,
            srcResolution: (srcExtent.xmax - srcExtent.xmin) / col,
            project,
            splitMaxError: opts.resolutionDst,
        });
        dstFullExtent = triangleSplit.extentDst;
        const dstProjectLod = findLodAtGivenResolution(triangleSplit.tessellateResolution, tileScheme);
        dstCoverTiles = findCoverVTilesAtGivenLevel(dstFullExtent, tileScheme, dstProjectLod.level);
        //2个坐标系投影误差较小, 仅输出2个三角形, 说明瓦片无需拆分即满足精度要求
        //直接使用目标瓦片作为划分依据, 跳过检索和求交的步骤
        useDstTileSplit = triangleSplit.mesh.trigs.length <= 2;
    } else {
        dstFullExtent = srcExtent; //无需投影
    }

    const cellSize = (srcExtent.xmax - srcExtent.xmin) / col;
    if (useDstTileSplit) {
        //使用瓦片划分
        return {
            tileSplit: dstCoverTiles
                .map((dstTile) => {
                    const r = dstTile.resolution,
                        padding = r * opts.padding;
                    const {cx, cy} = dstTile;
                    //dst待检索的范围,扩宽padding像素
                    const dstRetrieveExtent = {
                        xmin: dstTile.xmin - padding,
                        ymin: dstTile.ymin - padding,
                        xmax: dstTile.xmax + padding,
                        ymax: dstTile.ymax + padding,
                    };
                    //检索范围投影到原参考系,并取交集(搜索区域逆投影后可能会超出原范围,搜索区域扩大了padding个像素)
                    const srcRetrieveExtent = extentIntersection(
                        calcCoordsExtent([
                            projectInvert([dstRetrieveExtent.xmin, dstRetrieveExtent.ymin]),
                            projectInvert([dstRetrieveExtent.xmin, dstRetrieveExtent.ymax]),
                            projectInvert([dstRetrieveExtent.xmax, dstRetrieveExtent.ymin]),
                            projectInvert([dstRetrieveExtent.xmax, dstRetrieveExtent.ymax]),
                        ]),
                        srcExtent
                    );
                    if (!srcRetrieveExtent) return null;
                    const srcPoints = {
                        topLeft: [srcRetrieveExtent.xmin, srcRetrieveExtent.ymax],
                        bottomLeft: [srcRetrieveExtent.xmin, srcRetrieveExtent.ymin],
                        topRight: [srcRetrieveExtent.xmax, srcRetrieveExtent.ymax],
                        bottomRight: [srcRetrieveExtent.xmax, srcRetrieveExtent.ymin],
                    };
                    //取交集的四个点重新投影到dst坐标系
                    const dstPoint = {
                        topLeft: project(srcPoints.topLeft),
                        bottomLeft: project(srcPoints.bottomLeft),
                        topRight: project(srcPoints.topRight),
                        bottomRight: project(srcPoints.bottomRight),
                    };
                    const raw = [
                        [dstPoint.bottomLeft, dstPoint.bottomRight, dstPoint.topRight],
                        [dstPoint.bottomLeft, dstPoint.topRight, dstPoint.topLeft],
                    ];
                    const sx = clamp(Math.floor((srcRetrieveExtent.xmin - srcExtent.xmin) / cellSize), 0, col - 1);
                    const sy = clamp(Math.floor((srcExtent.ymax - srcRetrieveExtent.ymax) / cellSize), 0, row - 1);
                    return {
                        tileInfo: dstTile,
                        positionRTC: raw.flat().map((point) => {
                            return [
                                Math.round((point[0] - cx) / r) * tileHalfSizeFactor[0],
                                Math.round((point[1] - cy) / r) * tileHalfSizeFactor[1],
                            ];
                        }),
                        uv: [
                            [0, 0],
                            [1, 0],
                            [1, 1],
                            [0, 0],
                            [1, 1],
                            [0, 1],
                        ],
                        imageExtent: {
                            sx,
                            sy,
                            width: clamp(
                                Math.ceil((srcRetrieveExtent.xmax - srcRetrieveExtent.xmin) / cellSize),
                                0,
                                col - 1 - sx
                            ),
                            height: clamp(
                                Math.ceil((srcRetrieveExtent.ymax - srcRetrieveExtent.ymin) / cellSize),
                                0,
                                row - 1 - sy
                            ),
                        },
                        debugData: {raw: raw, optimize: raw},
                    };
                })
                .filter(Boolean),
            fullExtent: dstFullExtent,
            projectData: triangleSplit?.mesh,
        };
    } else {
        //使用三角网划分
        const {trigs, unprojected, projected} = triangleSplit.mesh;

        const dstQuadtree = new Quadtree<RasterProjectTriangleItem>({
            xmin: dstFullExtent.xmin,
            ymin: dstFullExtent.ymin,
            width: dstFullExtent.xmax - dstFullExtent.xmin,
            height: dstFullExtent.ymax - dstFullExtent.ymin,
        });
        for (let i = 0, l = trigs.length; i < l; i++) {
            const [a, b, c] = trigs[i];
            const rect = calcTriangleExtent(projected[a], projected[b], projected[c]) as RasterProjectTriangleItem;
            rect.width = rect.xmax - rect.xmin;
            rect.height = rect.ymax - rect.ymin;
            rect.srcTri = [unprojected[a], unprojected[b], unprojected[c]];
            rect.dstTri = [projected[a], projected[b], projected[c]];
            dstQuadtree.insert(rect);
        }
        return {
            tileSplit: dstCoverTiles
                .map((dstTile) => {
                    const r = dstTile.resolution,
                        padding = r * opts.padding;
                    const {cx, cy} = dstTile;
                    const retrieveExtent = new Extent({
                        xmin: dstTile.xmin - padding,
                        ymin: dstTile.ymin - padding,
                        xmax: dstTile.xmax + padding,
                        ymax: dstTile.ymax + padding,
                        spatialReference: dstCrs,
                    });
                    //检索相交的三角形(检索是用extent检索)
                    const rawTriMeshes = dstQuadtree.retrieve(retrieveExtent);
                    if (!rawTriMeshes.length) return null;
                    //求交, 最小化范围, 检索是用extent检索, 实际可能并不相交
                    const optimizeTriMeshes = rawTriMeshes
                        .map(({dstTri}) => {
                            const [A, B, C] = dstTri;
                            const output = intersect(
                                new Polygon({
                                    rings: [[A, B, C, A]],
                                    spatialReference: dstCrs,
                                }),
                                retrieveExtent
                            );
                            return ([].concat(output) as Polygon[]).filter(Boolean).map((polygon) => {
                                return invokeEarcut(polygon.rings.map((r) => r.flat()));
                            });
                        })
                        .flat()
                        .map(({vertices, indices}) => {
                            const res = [] as RasterProjectTriangleItem[];
                            for (let i = 0; i < indices.length; i += 3) {
                                let c = indices[i],
                                    c2 = c * 2;
                                const A = [vertices[c2], vertices[c2 + 1]];
                                (c = indices[i + 1]), (c2 = c * 2);
                                const B = [vertices[c2], vertices[c2 + 1]];
                                (c = indices[i + 2]), (c2 = c * 2);
                                const C = [vertices[c2], vertices[c2 + 1]];
                                const meshItem = calcCoordsExtent([A, B, C]) as RasterProjectTriangleItem;
                                meshItem.dstTri = [A, B, C];
                                meshItem.srcTri = [A, B, C].map((p) => {
                                    return projectInvert(p);
                                });
                                res.push(meshItem);
                            }
                            return res;
                        })
                        .flat();
                    if (!optimizeTriMeshes.length) return null;
                    const position = optimizeTriMeshes
                        .map((item) => item.dstTri)
                        .flat()
                        .map((point) => {
                            return [
                                Math.round((point[0] - cx) / r) * tileHalfSizeFactor[0],
                                Math.round((point[1] - cy) / r) * tileHalfSizeFactor[1],
                            ];
                        });
                    //找出这些三角形在srcCrs内的范围。
                    const srcImageExtent = calcCoordsExtent(optimizeTriMeshes.map((i) => i.srcTri).flat());
                    //提取该子部分范围作为纹理
                    const imageWidth = srcImageExtent.xmax - srcImageExtent.xmin,
                        imageHeight = srcImageExtent.ymax - srcImageExtent.ymin;
                    //计算uv坐标
                    const uv = optimizeTriMeshes
                        .map((item) => item.srcTri)
                        .flat()
                        .map((srcPoint) => {
                            return [
                                (srcPoint[0] - srcImageExtent.xmin) / imageWidth,
                                (srcPoint[1] - srcImageExtent.ymin) / imageHeight,
                            ];
                        });

                    const sx = clamp(Math.floor((srcImageExtent.xmin - srcExtent.xmin) / cellSize), 0, col - 1);
                    const sy = clamp(Math.floor((srcExtent.ymax - srcImageExtent.ymax) / cellSize), 0, row - 1);

                    return {
                        tileInfo: dstTile,
                        positionRTC: position,
                        uv, //重投影的纹理坐标
                        imageExtent: {
                            //子纹理的范围
                            sx,
                            sy,
                            width: clamp(Math.ceil(imageWidth / cellSize), 0, col - 1 - sx),
                            height: clamp(Math.ceil(imageHeight / cellSize), 0, row - 1 - sy),
                        },
                        debugData: {
                            raw: rawTriMeshes.map((i) => i.dstTri),
                            optimize: optimizeTriMeshes.map((i) => i.dstTri),
                        },
                    };
                })
                .filter(Boolean),
            fullExtent: dstFullExtent,
            projectData: triangleSplit?.mesh,
        };
    }
}


//重投影区域三角划分
//reference: https://ivan.sanchezortega.es/development/2021/03/08/introducing-arrugator.html
export function extentProjectionTriangulation(opts: {
    project: (pointSrc: number[]) => number[]; //投影 srcCRS => dstCRS
    srcExtent: __esri.ExtentProperties; //原始栅格的范围
    srcResolution: number; //原始栅格的分辨率，一个单元格=多少地图单位，
    splitMaxError?: number; //划分的最大误差
}) {
    const {srcExtent, srcResolution, project} = opts;
    const splitMaxError = opts.splitMaxError ?? rasterProjectErrorSampling(srcExtent, srcResolution, project);
    const arrugator = new Arrugator(
        project,
        [
            [srcExtent.xmin, srcExtent.ymax],
            [srcExtent.xmin, srcExtent.ymin],
            [srcExtent.xmax, srcExtent.ymax],
            [srcExtent.xmax, srcExtent.ymin],
        ],
        [
            [0, 1], // top-left
            [0, 0], // bottom-left
            [1, 1], // top-right
            [1, 0], // bottom-right
        ],
        [
            [0, 1, 3],
            [0, 3, 2],
        ]
    );
    //进行细分直到误差低于resolutionDst
    arrugator.lowerEpsilon(splitMaxError ** 2);
    const result = arrugator.output();
    return {
        mesh: result, //三角化结果, 原始坐标和目标坐标的对应关系
        extentDst: calcCoordsExtent(result.projected), //投影后的栅格的范围
        tessellateResolution: splitMaxError, //细分的分辨率
    };
}

//栅格投影误差采样, 获取目标投影下的最大误差
export function rasterProjectErrorSampling(
    rasterExtent: __esri.ExtentProperties, //栅格
    rasterResolution: number, //栅格分辨率
    project: (srcPoint: number[]) => number[]
) {
    const cx = (rasterExtent.xmin + rasterExtent.xmax) / 2,
        cy = (rasterExtent.ymin + rasterExtent.ymax) / 2;

    const errors = [
        [cx, cy, 1, 1],
        [rasterExtent.xmin, rasterExtent.ymax, 1, -1],
        [rasterExtent.xmax, rasterExtent.ymax, -1, -1],
        [rasterExtent.xmin, rasterExtent.ymin, 1, 1],
        [rasterExtent.xmax, rasterExtent.ymin, -1, 1],
    ].map(([x, y, offsetx, offsety]) => {
        const pointDst = project([x, y]);
        const pointOffsetDst = project([x + offsetx * rasterResolution, y + offsety * rasterResolution]);
        const curError = Math.hypot(pointDst[0] - pointOffsetDst[0], pointDst[1] - pointOffsetDst[1]);
        return curError;
    });
    return Math.min.apply(null, errors);
}
