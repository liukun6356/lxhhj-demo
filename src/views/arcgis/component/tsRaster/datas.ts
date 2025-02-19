import {tiffToArrayBuffer, tiffToArrayBufferUV} from "./layer/decode";
import {TimeSeriesRasterLayer} from "./layer/index";
import {ClassBreakColorMapping, GradientColorMapping, UniqueValueColorMapping} from "./layer/color-mapping";
import gradientImg from "@/assets/images/tsRaster/color-step.png";

export type TsRasterDataMeta = {
    source: TimeSeriesRasterLayer["source"];
    mappings: (GradientColorMapping | UniqueValueColorMapping | ClassBreakColorMapping)[];
    timeRange: { min: number; max: number };
    timeStep: number;
    playSpeed: number;
    extent?: __esri.ExtentProperties;
    center?: __esri.PointProperties;
    scale?: number;
};

export function getDataClud(): TsRasterDataMeta {
    const wkt = `PROJCS["Krasovsky_1940_Albers",GEOGCS["GCS_Unknown_datum_based_upon_the_Krassowsky_1940_ellipsoid",DATUM["D_Krasovsky_1940",SPHEROID["Krasovsky_1940",6378245.0,298.3]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Albers"],PARAMETER["false_easting",0.0],PARAMETER["false_northing",0.0],PARAMETER["central_meridian",105.0],PARAMETER["standard_parallel_1",25.0],PARAMETER["standard_parallel_2",47.0],PARAMETER["latitude_of_origin",0.0],UNIT["Meter",1.0]]`;
    const crs = {wkt};
    const ncols = 3502,
        nrows = 1832,
        xllcorner = -1634866.75,
        yllcorner = 2189282.625,
        cellsize = 1000,
        NODATA_value = 128;
    return {
        timeRange: {min: 1990, max: 2020},
        timeStep: 0.1,
        playSpeed: 0.1,
        extent: {
            xmin: 86.3815596067,
            xmax: 126.189389268,
            ymin: 19.6121534695,
            ymax: 37.5341106793,
            spatialReference: {wkid: 4326},
        },
        source: {
            type: "simple",
            times: [1990, 1995, 2000, 2005, 2010, 2015, 2020],
            extent: {
                xmin: xllcorner,
                xmax: xllcorner + cellsize * ncols,
                ymin: yllcorner,
                ymax: yllcorner + cellsize * nrows,
            },
            col: ncols,
            row: nrows,
            noDataValue: NODATA_value,
            crs,
            dataGetter: async (time: number) => {
                const fileBuffer = await fetch(import.meta.env.VITE_APP_MODELDATA + `/timing-raster/clud/YR_lucc_${time}.tif`).then((res) =>
                    res.arrayBuffer()
                );
                return tiffToArrayBuffer(fileBuffer) as Promise<Uint16Array>;
            },
        },
        mappings: [
            {
                type: "unique-value",
                mapping: [
                    {value: 11, color: "rgb(192, 162, 200)", label: "水田"},
                    {value: 12, color: "rgb(144, 121, 173)", label: "旱地"},
                    {value: 21, color: "rgb(49, 103, 69)", label: "有林地"},
                    {value: 22, color: "rgb(0, 123, 68)", label: "灌木林"},
                    {value: 23, color: "rgb(62, 179, 111)", label: "疏林地"},
                    {value: 24, color: "rgb(104, 190, 141)", label: "其他林地"},
                    {value: 31, color: "rgb(105, 130, 28)", label: "高覆盖度"},
                    {value: 32, color: "rgb(131, 174, 69)", label: "中覆盖度"},
                    {value: 33, color: "rgb(184, 210, 0)", label: "低覆盖度"},
                    {value: 41, color: "rgb(26, 68, 142)", label: "河渠"},
                    {value: 42, color: "rgb(62, 98, 174)", label: "湖泊"},
                    {value: 43, color: "rgb(90, 121, 186)", label: "水库坑塘"},
                    {value: 44, color: "rgb(0, 124, 188)", label: "永久性冰川雪地"},
                    {value: 45, color: "rgb(89, 185, 199)", label: "滩涂"},
                    {value: 46, color: "rgb(42, 131, 165)", label: "滩地"},
                    {value: 51, color: "rgb(79, 69, 93)", label: "城镇用地"},
                    {value: 52, color: "rgb(95, 65, 75)", label: "农村居民点"},
                    {value: 53, color: "rgb(114, 86, 100)", label: "其他建设用地"},
                    {value: 54, color: "rgb(113, 104, 109)", label: "光伏发电用地"},
                    {value: 61, color: "rgb(183, 155, 90)", label: "沙地"},
                    {value: 62, color: "rgb(200, 163, 56)", label: "戈壁"},
                    {value: 63, color: "rgb(122, 108, 63)", label: "盐碱地"},
                    {value: 64, color: "rgb(149, 110, 41)", label: "沼泽地"},
                    {value: 65, color: "rgb(173, 125, 76)", label: "裸土地"},
                    {value: 66, color: "rgb(136, 120, 87)", label: "裸岩石砾地"},
                    {value: 67, color: "rgb(141, 99, 74)", label: "其他"},
                    {value: 99, color: "blue", label: "海洋"},
                ] as { value: number; color: string; label?: string }[],
            } as UniqueValueColorMapping,
            {type: "gradient", stops: gradientImg, valueRange: [11, 99]} as GradientColorMapping,
        ],
    };
}

export function getDataDam(): TsRasterDataMeta {
    const start = 699600;
    const end = 912000;
    let now = start,
        step = 600;
    const times = [] as number[];
    while (now <= end) {
        times.push(now);
        now += step;
    }
    const ncols = 1298,
        nrows = 927,
        Xllcorner = 502809.125,
        Yllcorner = 3109014.5,
        cellsize = 30.0,
        Nodata_value = -9999;
    return {
        timeStep: (1 / 60) * step,
        playSpeed: (1 / 60) * step,
        timeRange: {min: times[0], max: times[times.length - 1]},
        center: {type: "point", x: 120.22123523091079, y: 28.215367275108136} as __esri.Point,
        scale: 36111 * 4,
        source: {
            type: "simple",
            times,
            extent: {
                xmin: Xllcorner,
                xmax: Xllcorner + cellsize * ncols,
                ymin: Yllcorner,
                ymax: Yllcorner + cellsize * nrows,
            },
            col: ncols,
            row: nrows,
            noDataValue: Nodata_value,
            crs: {wkid: 4549},
            dataGetter: async (time: number) => {
                const res = await fetch(import.meta.env.VITE_APP_MODELDATA + `/timing-raster/溃坝/hs_${time}.00sec.bin`);
                const result = await res.arrayBuffer();
                return new Float32Array(result);
            },
        },
        mappings: [
            {
                type: "class-break",
                truncHead: true,
                breaks: [
                    {min: 0.1, max: 2, color: "#1a9850"},
                    {min: 2, max: 10, color: "#66bd63"},
                    {min: 10, max: 20, color: "#a6d96a"},
                    {min: 20, max: 30, color: "#d9ef8b"},
                    {min: 30, max: 40, color: "#ffffbf"},
                    {min: 40, max: 50, color: "#fee08b"},
                    {min: 50, max: 60, color: "#fdae61"},
                    {min: 60, max: 70, color: "#f46d43"},
                    {min: 70, max: 80, color: "#d73027"},
                    {min: 80, max: Infinity, color: "#a50026"},
                ],
            },
        ],
    };
}

export function getDataDamVectorField(): TsRasterDataMeta {
    const start = 705000;
    const end = 747000;
    let now = start,
        step = 600;
    const times = [] as number[];
    while (now <= end) {
        times.push(now);
        now += step;
    }
    const ncols = 1298,
        nrows = 927,
        Xllcorner = 502809.125,
        Yllcorner = 3109014.5,
        cellsize = 30.0;
    return {
        timeStep: (1 / 60) * step,
        playSpeed: (1 / 60) * step,
        center: {type: "point", x: 120.22123523091079, y: 28.215367275108136} as __esri.Point,
        scale: 36111 * 4,
        source: {
            type: "vector-field",
            extent: {
                xmin: Xllcorner,
                xmax: Xllcorner + cellsize * ncols,
                ymin: Yllcorner,
                ymax: Yllcorner + cellsize * nrows,
            },
            noDataValue: -9999,
            col: 1298,
            row: 927,
            times,
            crs: {wkid: 4549},
            dataGetter: async (time: number) => {
                const fileBuffer = await fetch(import.meta.env.VITE_APP_MODELDATA + `/timing-raster/vector-field/v_${time}.00sec.tif`).then((res) => res.arrayBuffer());
                return tiffToArrayBufferUV(fileBuffer) as Promise<Float32Array>;
            },
        },
        timeRange: {min: start, max: end},
        mappings: [
            {
                type: "gradient",
                stops: gradientImg,
                truncHead: true,
            } as GradientColorMapping,
            {
                type: "class-break",
                truncHead: true,
                breaks: [
                    {min: 0, max: 2, color: "#1a9850"},
                    {min: 2, max: 10, color: "#66bd63"},
                    {min: 10, max: 20, color: "#a6d96a"},
                    {min: 20, max: 30, color: "#d9ef8b"},
                    {min: 30, max: 40, color: "#ffffbf"},
                    {min: 40, max: 50, color: "#fee08b"},
                    {min: 50, max: 60, color: "#fdae61"},
                    {min: 60, max: 70, color: "#f46d43"},
                    {min: 70, max: 80, color: "#d73027"},
                    {min: 80, max: 9999, color: "#a50026"},
                ].map((i) => {
                    i.min = (i.min / 10) * 1.5;
                    i.max = (i.max / 10) * 1.5;
                    return i;
                }),
            },
        ],
    };
}

export function getDataLake(): TsRasterDataMeta {
    return {
        timeStep: 0.1,
        playSpeed: 0.1,
        timeRange: {min: 1, max: 288},
        center: {type: "point", x: 115.940478, y: 29.676773} as __esri.Point,
        scale: 36111 * 2,
        source: {
            type: "simple",
            times: [
                1, 13, 25, 37, 49, 61, 73, 85, 97, 109, 121, 133, 145, 157, 181, 193, 205, 217, 229, 241, 253, 265, 277,
                288,
            ],
            extent: {
                xmin: 394725.4064316,
                xmax: 394725.4064316 + 10 * 675,
                ymin: 3280334.241977,
                ymax: 3280334.241977 + 10 * 731,
            },
            col: 675,
            row: 731,
            noDataValue: -9999,
            crs: {wkid: 2436},
            dataGetter: async (time: number) => {
                const res = await fetch(import.meta.env.VITE_APP_MODELDATA + `/timing-raster/COD/COD_${("000" + time).slice(-3)}.bin`);
                const result = await res.arrayBuffer();
                return new Float32Array(result);
            },
        },
        mappings: [
            {
                type: "gradient",
                valueRange: [20, 40],
                stops: [
                    {value: 0, color: "yellow"},
                    {value: 1, color: "red"},
                ],
            } as GradientColorMapping,
            {
                type: "class-break",
                breaks: {min: 0, max: 40, colors: ["yellow", "green", "red"]},
            } as ClassBreakColorMapping,
        ],
    };
}

export function getDataUIS(): TsRasterDataMeta {
    return {
        timeStep: 0.05,
        playSpeed: 0.05,
        timeRange: {min: 2000, max: 2020},
        center: {type: "point", x: 114.302663, y: 30.578447} as __esri.Point,
        scale: 577790.55,
        source: {
            type: "simple",
            times: [2000, 2005, 2010, 2015, 2020],
            extent: {
                xmin: 7838312.0445,
                xmax: 11791812.0445,
                ymin: 2591231.094,
                ymax: 4369731.094,
            },
            col: 15814,
            row: 7114,
            noDataValue: 127,
            crs: {wkid: 54009},
            dataGetter: async (time: number) => {
                const fileBuffer = await fetch(import.meta.env.VITE_APP_MODELDATA + `/timing-raster/uis/YR_UIS_${time}.tif`).then((res) =>
                    res.arrayBuffer()
                );
                return tiffToArrayBuffer(fileBuffer) as Promise<Uint8Array>;
            },
        },
        mappings: [
            {
                type: "gradient",
                valueRange: [1, 120],
                stops: [
                    {value: 0, color: "yellow"},
                    {value: 1, color: "green"},
                ],
            } as GradientColorMapping,
        ],
    };
}
