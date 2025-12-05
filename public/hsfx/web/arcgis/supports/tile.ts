import { assert } from "es-toolkit";
import type { BBox } from "geojson";

export function scaleToResolution(scale: number, dpi = 96) {
    return scale / (dpi / 0.0254);
}

export function resolutionToScale(resolution: number, dpi = 96) {
    return resolution * dpi / 0.0254;
}

export function wrapTileIndex(z: number, v: number) {
    // v % (2^z)
    const z2 = 2 ** z;
    return (v + z2) & (z2 - 1);
}

export function tileKeyToXYZ(key: string) {
    const [z, y, x] = key.split('/');
    return {
        level: +z,
        row: +y,
        col: +x
    }
}
export function getTileKey(t: { level: number, col: number, row: number }) {
    return [t.level, t.row, t.col].join('/');
}

export function resolveCoverageTiles(tileInfo: __esri.TileInfo, z: number, [xmin, ymin, xmax, ymax]: BBox) {
    const { origin, size, isWrappable } = tileInfo;
    const lod = tileInfo.lods.find(i => i.level === z);
    assert(!!lod, `can not find lod at level:${z}`);
    const resolution = lod.resolution;
    const tileSize = size[0] * resolution;
    const colmin = Math.floor((xmin - origin.x) / tileSize);
    const colmax = Math.ceil((xmax - origin.x) / tileSize);
    const rowmin = Math.floor((origin.y - ymax) / tileSize);
    const rowmax = Math.ceil((origin.y - ymin) / tileSize);
    const results = [] as __esri.BaseLayerViewGL2DTile[];
    const tileCount = 2 ** z;

    for (let col = colmin; col < colmax; col++) {
        for (let row = rowmin; row < rowmax; row++) {
            const world = isWrappable ? Math.floor(col / tileCount) : 0;
            const _col = isWrappable ? (col - tileCount * world) : col;
            const _xmin = origin.x + _col * resolution * size[0];
            const _ymax = origin.y - row * resolution * size[1];
            results.push({
                id: [z, row, _col, world].join('/'),
                world,
                level: z,
                col: _col,
                row,
                resolution,
                scale: resolutionToScale(resolution),
                coords: [_xmin, _ymax],
                bounds: [_xmin, _ymax - tileSize, _xmin + tileSize, _ymax]
            })
        }
    }
    return results;
}
