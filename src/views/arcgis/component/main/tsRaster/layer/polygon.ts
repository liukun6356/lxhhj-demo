import earcut from "earcut";

export interface TessellatePolygonMesh {
    vertices: number[];
    indices: number[];
    vertexCount: number;
}

//执行earcut
//paths:
// [
//    outline: [x1, y1, x2, y2,...],
//     holes:  [x1, y1, x2, y2,...],
//             [x1, y1, x2, y2,...],
// ]
export function invokeEarcut(paths: number[][]): TessellatePolygonMesh {
    const rings = paths.map(openPath).filter(Boolean);
    if (!rings?.length) return null;
    const vertices = [...rings.flat()];
    let holesIndex: number[];
    if (rings.length >= 2) {
        holesIndex = [];
        for (let i = 0, v = 0; i < rings.length; i++) {
            i > 0 && holesIndex.push(v);
            v += rings[i].length / 2;
        }
    }
    const indices = earcut(vertices, holesIndex, 2);
    const count = vertices.length / 2;
    return {
        vertexCount: count,
        vertices,
        indices,
    };

    //最后一个点和第一个相同, earcut不需要,
    function openPath(path: number[]) {
        const len = path.length;
        const p0x = path[0],
            p0y = path[1];
        const pnx = path[len - 2],
            pny = path[len - 1];
        if (p0x === pnx && p0y === pny) {
            return len <= 6 ? null : path.slice(0, len - 2);
        } else {
            return path;
        }
    }
}
