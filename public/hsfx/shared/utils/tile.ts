import { assert } from "es-toolkit";
import type { BBox } from "geojson";
import { ceilPowerOfTwo } from "./math";

export function bboxDetail([xmin, ymin, xmax, ymax]: BBox) {
    return {
        xmin, ymin, xmax, ymax,
        width: xmax - xmin,
        height: ymax - ymin,
        cx: (xmax + xmin) / 2,
        cy: (ymax + ymin) / 2,
    }
}
export function createTileSchemeFromBBoxAndResolution(
    bbox: BBox,
    baseResolution: number, //数据比例
    tileSize = 256,
) {
    const { width, height, cx, cy } = bboxDetail(bbox);
    const baseTileSizeWorld = tileSize * baseResolution;
    const baseTileCount = Math.max(width, height) / baseTileSizeWorld;
    const maxZoom = Math.log2(ceilPowerOfTwo(Math.ceil(baseTileCount)));
    const worldSize = 2 ** maxZoom * baseTileSizeWorld;
    return createTileScheme({
        origin: [
            cx - worldSize / 2,
            cy + worldSize / 2
        ],
        worldSize,
        maxZoom,
        tileSize,
        wrapX: false,
        wrapY: false,
        dpi: 96,
    })
}
export function createTileScheme(opts: {
    origin: number[],
    worldSize: number,
    maxZoom: number,
    tileSize: number,
    wrapX: boolean,
    wrapY: boolean,
    dpi: number,
}) {
    const { origin, worldSize, maxZoom, tileSize, wrapX, wrapY, dpi } = opts;
    const [xmin, ymax] = origin;
    const r0 = worldSize / tileSize;
    const s0 = dpi / 0.0254 * r0;
    return {
        minZoom: 0,
        maxZoom,
        origin,
        tileSize: [tileSize, tileSize],
        lods: new Array(maxZoom + 1).fill(0).map((_, z) => {
            const f = 1 / (2 ** z);
            return {
                z,
                resolution: r0 * f,
                scale: s0 * f,
            }
        }),
        worldBBox: [
            xmin,
            ymax - opts.worldSize,
            xmin + opts.worldSize,
            ymax
        ] as BBox,
        wrapX,
        wrapY,
        dpi
    }
}
export interface TileXYZ {
    z: number,
    x: number,
    y: number,
};
export interface TileXYZW extends TileXYZ {
    wx: number;
    wy: number;
}
export interface TileScheme {
    minZoom: number, //最低等级
    maxZoom: number, //最高等级
    origin: number[], //切片方案原点坐标 [xmin, ymax]
    tileSize: number[], //瓦片大小（像素）
    //切片分级
    lods: {
        z: number,  //等级
        resolution: number, //分辨率 1像素 = resolution 个地图单位 
        scale: number //比例尺
    }[],
    worldBBox: BBox, //切片世界范围
    wrapX: boolean,  //x方向是否可环绕
    wrapY: boolean,  //y方向是否可环绕
    dpi: number,
}
//xy is wrapped if tileScheme support wrap
export interface Tile extends TileXYZW {
    id: string, //z/y/x/wy/wx
    key: string, // z/y/x
    bbox: BBox, //wrapped bbox
    resolution: number,
    scale: number,
};
export function resolveTileFromXYZ(
    tileScheme: TileScheme,
    { x, y, z }: TileXYZ
): Tile {
    assert(z >= 0 && z === Math.floor(z), `can not get tile at z:${z}`);
    const { wrapX, wrapY } = tileScheme;
    const worldTileCount = 2 ** z;

    const wx = wrapX ? Math.floor(x / worldTileCount) : 0;
    const wy = wrapY ? Math.floor(y / worldTileCount) : 0;

    x = wrapX ? (x - wx * worldTileCount) : x;
    y = wrapY ? (y - wy * worldTileCount) : y;

    return createTile(tileScheme, { x, y, z, wx, wy });
}
export function wrapTileIndex(z: number, v: number) {
    // v % (2^z)
    const z2 = 2 ** z;
    return (v + z2) & (z2 - 1);
}
export function getTileKey({ x, y, z }: TileXYZ) {
    return [z, y, x].join('/');
}
export function createTile(
    { lods, origin, tileSize, wrapX, wrapY }: TileScheme,
    { x, y, z, wx, wy }: TileXYZW,
): Tile {
    assert(z >= 0 && z === Math.floor(z), `can not get tile at z:${z}`);
    if (wrapX) {
        wx !== 0 && assert(x === wrapTileIndex(z, x), `invalid x:${x}`);
    } else {
        assert(wx === 0, `invalid wx:${wx}`)
    }
    if (wrapY) {
        wy !== 0 && assert(y === wrapTileIndex(z, y), `invalid y:${y}`);
    } else {
        assert(wy === 0, `invalid wy:${wy}`)
    }

    const { z: z0, resolution: r0, scale: s0 } = lods[0];
    const f = 2 ** (z0 - z);
    const resolution = r0 * f;
    const scale = s0 * f;


    const tileSizeX = resolution * tileSize[0];
    const tileSizeY = resolution * tileSize[1];

    const xmin = origin[0] + x * tileSizeX;
    const ymax = origin[1] - y * tileSizeY;
    const xmax = xmin + tileSizeX;
    const ymin = ymax - tileSizeY;
    return {
        id: [z, y, x, wy, wx].join("/"),
        key: getTileKey({ x, y, z }),
        x,
        y,
        z,
        wx,
        wy,
        resolution,
        scale,
        bbox: [xmin, ymin, xmax, ymax]
    }
}