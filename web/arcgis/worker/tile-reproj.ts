import { load } from "@arcgis/core/geometry/operators/projectOperator";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import type { BBox } from "geojson";
import { emptyBBox, extendBBox, bboxArea, bboxSize, getTileInfoWorldBBox } from "../supports/bbox";
import { buildWebGLReprojBufferData, calcExtentReprojMesh, calcExtentReprojSourceResolution, MAX_SUBDIVISION } from "../supports/reproj";
import { getTileKey, resolutionToScale, resolveCoverageTiles } from "../supports/tile";


export async function getReprojFromStoreOrCalc(opts: {
    storeKey?: string,
    targetTile: __esri.BaseLayerViewGL2DTile,
    targetTileInfo: __esri.TileInfoProperties,
    sourceTileInfo: __esri.TileInfoProperties,
}) {
    if (opts.storeKey) {
        const key = getTileKey(opts.targetTile);
        const store = localforage.createInstance({
            name: opts.storeKey
        });
        const blob = await store.getItem(key) as Blob;
        if (blob) {
            const imagebitmap = await createImageBitmap(blob);
            return {
                result: imagebitmap,
                transferList: [imagebitmap]
            }
        }
    }
    return calcTileReprojMesh(opts);
}

async function calcTileReprojMesh(opts: {
    targetTile: __esri.BaseLayerViewGL2DTile,
    targetTileInfo: __esri.TileInfoProperties,
    sourceTileInfo: __esri.TileInfoProperties,
}) {
    await load();
    const targetBBox = opts.targetTile.bounds as BBox;
    const targetResolution = opts.targetTile.resolution;
    const targetTileInfo = TileInfo.fromJSON(opts.targetTileInfo) as __esri.TileInfo;
    const sourceTileInfo = TileInfo.fromJSON(opts.sourceTileInfo) as __esri.TileInfo;
    const sourceResolution = calcExtentReprojSourceResolution(
        sourceTileInfo.spatialReference,
        targetTileInfo.spatialReference,
        targetBBox,
        targetResolution,
    );
    if (!isFinite(sourceResolution)) return null;
    const scale = Math.ceil(Math.log2(bboxArea(targetBBox) / (targetResolution * targetTileInfo.size[0]) ** 2));
    const maxSubdivision = MAX_SUBDIVISION + Math.max(scale, 0);

    const mesh = calcExtentReprojMesh(
        targetBBox,
        targetTileInfo,
        sourceTileInfo,
        sourceResolution * 0.5,
        maxSubdivision
    );
    const sourceBBox = mesh.reduce((bbox, { source }) => {
        extendBBox(bbox, source[0]);
        extendBBox(bbox, source[1]);
        extendBBox(bbox, source[2]);
        return bbox;
    }, emptyBBox());
    const sourceZ = Math.round(sourceTileInfo.scaleToZoom(resolutionToScale(sourceResolution, sourceTileInfo.dpi)));
    const sourceCoverTiles = resolveCoverageTiles(sourceTileInfo, sourceZ, sourceBBox);
    if (!sourceCoverTiles.length) return null;

    const sourceTileResolution = sourceCoverTiles[0].resolution;
    const srcAtlasPixelSize = [
        Math.ceil((sourceBBox[2] - sourceBBox[0]) / sourceTileResolution),
        Math.ceil((sourceBBox[3] - sourceBBox[1]) / sourceTileResolution),
    ];
    sourceBBox[2] = sourceBBox[0] + srcAtlasPixelSize[0] * sourceTileResolution;
    sourceBBox[3] = sourceBBox[1] + srcAtlasPixelSize[1] * sourceTileResolution;
    const sourceSize = bboxSize(sourceBBox);

    const bufferArray = buildWebGLReprojBufferData(mesh, targetBBox, sourceBBox);
    const sourceWorldSize = bboxSize(getTileInfoWorldBBox(sourceTileInfo));
    const srcAltas = sourceCoverTiles.reduce((map, srcTile) => {
        const offset = srcTile.world * sourceWorldSize[0];
        const key = getTileKey(srcTile);
        map[key] = {
            key,
            dxdy: [
                Math.floor((srcTile.coords[0] + offset - sourceBBox[0]) / sourceSize[0] * srcAtlasPixelSize[0]),
                Math.ceil((sourceBBox[3] - srcTile.coords[1]) / sourceSize[1] * srcAtlasPixelSize[1])
            ],
        };
        return map;
    }, {} as Record<string, {
        key: string,
        dxdy: number[],
    }>);
    return {
        result: {
            srcAtlasPixelSize,
            srcAltas,
            srcTileCount: sourceCoverTiles.length,
            meshBuffer: bufferArray
        },
        transferList: [bufferArray.buffer]
    }
}

import localforage from 'localforage';
import { imagebitmapToBlob } from "../layers/ReprojTileLayer/utils";
export async function saveReprojTileResult(opts: {
    targetTileKey: string,
    imagebitmap: ImageBitmap,
    storeKey: string
}) {
    const blob = await imagebitmapToBlob(opts.imagebitmap);
    const store = localforage.createInstance({
        name: opts.storeKey
    });
    await store.setItem(opts.targetTileKey, blob);
}