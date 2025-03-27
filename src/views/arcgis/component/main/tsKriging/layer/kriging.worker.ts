import {Kriging, KrigingModel, Variogram} from "./kriging";
import { krigingGernerater_WEBGL } from "./kriging-webgl";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import { load, project } from "@arcgis/core/geometry/projection";
import Polygon from "@arcgis/core/geometry/Polygon";
import { mergePolygonMesh, tessellatePolygon } from "./polygon";
import { doubleToTwoFloats } from "./misc";

export type KrigingExtentOpts = {
    trainOpts?: {
        value: number[];
        x: number[];
        y: number[];
        model: KrigingModel;
        sigma2: number;
        alpha: number;
    };
    variogram?: Variogram;
    cellSize: number; //网格大小
    llCorner: number[]; //左下角坐标
    gridSize: number[]; //网格宽高
    method?: "webgl" | "normal";
};

const isBrowser = !!(typeof window !== "undefined" && typeof navigator !== "undefined" && window.document);
const isWebWorker = !isBrowser && typeof importScripts !== "undefined";

export function runKrigingInExtent(opts: KrigingExtentOpts) {
    const fn = opts.method || (typeof OffscreenCanvas !== "undefined" ? "webgl" : "normal");
    if (fn === "webgl") {
        return generate_webgl(opts.variogram ? opts : normalized(opts));
    } else {
        return generate_normal(opts);
    }

    //webgl数据类型为float, 对坐标归一化, 提高精度
    function normalized(_opts: KrigingExtentOpts) {
        const opts = isWebWorker ? _opts : (JSON.parse(JSON.stringify(_opts)) as KrigingExtentOpts);
        const {trainOpts, cellSize, llCorner} = opts;
        const {x, y} = trainOpts;
        let xmin = Infinity,
            xmax = -Infinity,
            ymin = Infinity,
            ymax = -Infinity;
        for (let i = 0, len = x.length; i < len; i++) {
            xmin = Math.min(xmin, x[i]);
            xmax = Math.max(xmax, x[i]);
            ymin = Math.min(ymin, y[i]);
            ymax = Math.max(ymax, y[i]);
        }
        const cx = (xmin + xmax) / 2,
            cy = (ymin + ymax) / 2;
        const normalize_radius = Math.min((xmax - xmin) / 2, (ymax - ymin) / 2);
        const n_x = x.map((i) => (i - cx) / normalize_radius);
        const n_y = y.map((i) => (i - cy) / normalize_radius);

        const n_llCorner = [(llCorner[0] - cx) / normalize_radius, (llCorner[1] - cy) / normalize_radius];
        trainOpts.x = n_x;
        trainOpts.y = n_y;
        opts.llCorner = n_llCorner;
        opts.cellSize = cellSize / normalize_radius;
        return opts;
    }
}

export function generate_webgl(opts: KrigingExtentOpts) {
    const {cellSize, llCorner, gridSize} = opts;
    let start = performance.now();
    const trainOpts = opts.trainOpts;
    const variogram =
        opts.variogram ||
        Kriging.train(trainOpts.value, trainOpts.x, trainOpts.y, trainOpts.model, trainOpts.sigma2, trainOpts.alpha);
    const trainTime = performance.now() - start;
    start = performance.now();
    const imagebitmap = krigingGernerater_WEBGL({
        variogram,
        llCorner,
        gridSize,
        cellSize,
    });
    const gridTime = performance.now() - start;
    return {
        result: {
            data: imagebitmap,
            trainTime,
            gridTime,
            cols: gridSize[0],
            rows: gridSize[1],
            type: "imagebitmap" as const,
            valueRange: variogram.valueRange,
            variogramCache: opts.variogram
                ? null
                : {
                    variogram,
                    cellSize,
                    llCorner,
                    gridSize,
                },
        },
        transferList: [imagebitmap],
    };
}

export function generate_normal(opts: KrigingExtentOpts) {
    let start = performance.now();
    const trainOpts = opts.trainOpts;
    const variogram =
        opts.variogram ||
        Kriging.train(trainOpts.value, trainOpts.x, trainOpts.y, trainOpts.model, trainOpts.sigma2, trainOpts.alpha);
    const trainTime = performance.now() - start;
    start = performance.now();

    const {cellSize, gridSize, llCorner} = opts;
    const [cols, rows] = gridSize;
    const [xmin, ymin] = llCorner;
    const ymax = ymin + cellSize * rows;
    const halfSize = cellSize / 2;

    const result = new Float32Array(cols * rows);
    const [ox, oy] = [xmin + halfSize, ymax - halfSize];
    for (let y = 0; y < rows; y++) {
        for (let x = 0, cursor = y * cols, _y = oy - (halfSize + y * cellSize); x < cols; x++) {
            result[cursor + x] = Kriging.predict(ox + x * cellSize, _y, variogram);
        }
    }
    const gridTime = performance.now() - start;

    // {
    //     const canvas = document.createElement("canvas");
    //     document.body.append(canvas);
    //     canvas.width = cols;
    //     canvas.height = rows;
    //     canvas.style.cssText = "position:fixed;z-index:10000;right:0;bottom:0;";
    //     const ctx = canvas.getContext("2d");

    //     const vmin = Math.min.apply(null, opts.value),
    //         vmax = Math.max.apply(null, opts.value),
    //         vrange = vmax - vmin;

    //     const colors = ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"];

    //     for (let y = 0; y < rows; y++) {
    //         for (let x = 0; x < cols; x++) {
    //             const val = result[y * cols + x];
    //             const z = (val - vmin) / vrange;
    //             const color = colors[Math.floor((colors.length - 1) * z)];
    //             ctx.fillStyle = color;
    //             ctx.fillRect(x, y, 1, 1);
    //         }
    //     }
    // }

    return {
        result: {
            trainTime,
            gridTime,
            data: result,
            cols,
            rows,
            type: "arraybuffer" as const,
            variogramCache: opts.variogram ? null : {variogram, cellSize, gridSize, llCorner},
        },
        transferList: [result.buffer],
    };
}

export async function tessellatePolygons(opts: {
    polygons: __esri.PolygonProperties[];
    sr: __esri.SpatialReferenceProperties;
    convertDouble?: boolean;
}) {
    const sr = new SpatialReference(opts.sr);
    const convert = opts?.convertDouble ?? false;
    await load();
    const polygons = opts.polygons.map((p) => {
        if (sr.equals(p.spatialReference as __esri.SpatialReference)) {
            return new Polygon(p);
        } else {
            return project(p as __esri.Polygon, sr) as __esri.Polygon;
        }
    });
    const { vertices, indices, vertexCount } = mergePolygonMesh(polygons.map((p) => tessellatePolygon(p)));
    const indicesBuffer =
        vertexCount < 256
            ? new Uint8Array(indices)
            : vertexCount < 65536
                ? new Uint16Array(indices)
                : new Uint32Array(indices);
    let xmin = Infinity,
        ymin = Infinity,
        xmax = -Infinity,
        ymax = -Infinity;
    for (let i = 0; i < vertices.length; i += 2) {
        const x = vertices[i],
            y = vertices[i + 1];
        xmin = Math.min(xmin, x);
        xmax = Math.max(xmax, x);
        ymin = Math.min(ymin, y);
        ymax = Math.max(ymax, y);
    }

    if (convert) {
        const length = vertices.length;
        const verticesHigh = new Float32Array(length);
        const verticesLow = new Float32Array(length);
        for (let i = 0; i < length; i++) {
            const [high, low] = doubleToTwoFloats(vertices[i]);
            verticesHigh[i] = high;
            verticesLow[i] = low;
        }
        return {
            result: {
                verticesHigh,
                verticesLow,
                indices: indicesBuffer,
                extent: { xmin, ymin, xmax, ymax },
            },
            transferList: [verticesHigh.buffer, verticesLow.buffer, indicesBuffer.buffer] as Transferable[],
        };
    } else {
        const vBuffer = new Float32Array(vertices);
        return {
            result: {
                vertices: vBuffer,
                indices: indicesBuffer,
                extent: { xmin, ymin, xmax, ymax },
            },
            transferList: [vBuffer.buffer, indicesBuffer.buffer] as Transferable[],
        };
    }
}
