import { EsriFeature, VFeature } from "./interface";
import { simplify } from "./simplify";

//将esrifeature转换为裁剪图元
//支持point, multipoint, polyline(单线, 多线需要先转为单线,) polygon(单面,允许带孔)
export function convert(features: EsriFeature[], tolerance: number) {
    const result: VFeature[] = [],
        sqTolerance = tolerance ** 2;
    for (let i = 0; i < features.length; i++) {
        result.push(convertFeature(features[i], sqTolerance));
    }
    return result;
}

function convertFeature(feature: EsriFeature, sqTolerance: number): VFeature {
    const type = feature.type;
    const common = {
        id: feature.id,
        attributes: feature.attributes,
    };
    const size =
        type === "point"
            ? 0
            : (feature.extent.xmax - feature.extent.xmin) * (feature.extent.ymax - feature.extent.ymin);
    if (type === "polygon") {
        const convertRings = feature.rings.map((ring) => {
            const points = calcLineSimplifyInfo(ring, sqTolerance);
            return { points, size };
        });
        return {
            ...common,
            type: "vpolygon",
            geometry: convertRings,
            extent: feature.extent,
        };
    } else if (type === "polyline") {
        const points = calcLineSimplifyInfo(feature.path, sqTolerance);
        const len = points.length;
        const x1 = points[0],
            y1 = points[1],
            xn_1 = points[len - 6],
            yn_1 = points[len - 5],
            xn = points[len - 3],
            yn = points[len - 2];
        const isClosed = x1 === xn && y1 === yn; //是否是闭合线
        return {
            ...common,
            type: "vpolyline",
            extent: feature.extent,
            originTotalLength: feature.length,
            geometry: {
                points,
                size: feature.length,
                distance: feature.distance,
                beforePoint: isClosed ? [xn_1, yn_1] : null,
                afterPoint: isClosed ? [points[3], points[4]] : null,
            },
        };
    } else if (type === "point") {
        return {
            ...common,
            type: "point",
            x: feature.x,
            y: feature.y,
        };
    } else {
        throw new Error(`无效的几何类型:${type}`);
    }
}

function calcLineSimplifyInfo(points: number[][], sqTolerance: number) {
    const out = new Array<number>(points.length * 3).fill(0); //[x,y,tolerance,...]
    for (let i = 0; i < points.length; i++) {
        const i3 = i * 3;
        out[i3] = points[i][0];
        out[i3 + 1] = points[i][1];
    }
    const last = out.length - 3;
    out[2] = Infinity;
    simplify(out, 0, last, sqTolerance);
    out[last + 2] = Infinity;
    return out;
}
