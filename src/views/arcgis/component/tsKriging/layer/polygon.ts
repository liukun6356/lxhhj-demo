import { simplify } from "@arcgis/core/geometry/geometryEngine";
import earcut from "earcut";

export interface TessellatePolygonMesh {
    vertices: number[];
    indices: number[];
    vertexCount: number;
}

//合并面mesh
export function mergePolygonMesh(
    meshes: {
        vertices: number[];
        indices: number[];
    }[]
): TessellatePolygonMesh {
    if (meshes.length <= 1) return meshes[0] as TessellatePolygonMesh;
    let vertexCount = 0,
        indexCount = 0;
    for (let item of meshes) {
        vertexCount += item.vertices.length / 2;
        indexCount += item.indices.length;
    }
    const vertexArr = new Array(vertexCount * 2); //[x1,y1, x2,y2]
    const indexArr = new Array(indexCount);
    for (
        let index = 0,
            len = meshes.length,
            vertexCursor = 0, //顶点游标
            indexCursor = 0; //索引游标
        index < len;
        index++
    ) {
        const { vertices, indices } = meshes[index];
        for (let i = 0, len = indices.length; i < len; i++) {
            indexArr[indexCursor] = vertexCursor + indices[i];
            indexCursor++;
        }
        for (let i = 0, len = vertices.length / 2; i < len; i++) {
            const i2 = i * 2;
            const c2 = vertexCursor * 2;
            vertexArr[c2] = vertices[i2];
            vertexArr[c2 + 1] = vertices[i2 + 1];
            vertexCursor++;
        }
    }
    return {
        vertexCount,
        vertices: vertexArr,
        indices: indexArr,
    };
}

//细分一个面
export function tessellatePolygon(polygon: __esri.Polygon): TessellatePolygonMesh {
    polygon.rings.map(closePolygonRings);
    let tessPolygon: __esri.Polygon["rings"][];
    if (polygon.isSelfIntersecting) {
        //自相交
        const simplified = simplify(polygon) as __esri.Polygon; //简化
        tessPolygon = simplified.rings.map((ring) => [ring]);
    } else {
        tessPolygon = [polygon.rings];
    }
    const meshes = tessPolygon
        .map((polygonRings) => {
            const mesh = invokeEarcut(polygonRings.map((ring) => ring.flat()));
            if (!mesh?.vertices?.length || !mesh?.indices?.length) return null;
            return mesh;
        })
        .filter(Boolean);
    return mergePolygonMesh(meshes);
}

//闭合一个polygon的首尾
export function closePolygonRings(ring: number[][]) {
    const last = ring[ring.length - 1];
    if (ring[0][0] !== last[0] || ring[0][1] !== last[1]) {
        ring.push(ring[0]);
    }
    return ring;
}

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
