// 湖北省荆州市公安县
import { ClassBreakColorMapping, GradientColorMapping } from "./layer/color-mapping";
import moment from "moment";
import PolygonGeometry from "@arcgis/core/geometry/Polygon";
import pointJson from "./gonganpoint20240326.json"
import gonganCountyJson from "./gonganCounty20250312.json"
import gridJson from "./grid20240326.json"


const center = {
    center: [112.193601, 30.033268],
    zoom: 11
}

//位置
const points = gridJson.features.map(item=>({x:item.properties.longitude,y:item.properties.latitude}))

const grids =gridJson.features.map(item=>item.geometry.coordinates[0][0])

const pointsExtent = {
    spatialReference: {
        wkid: 4326,
    },
    xmin: Math.min.apply(null,pointJson.features.map(item=>item.geometry.coordinates[0])),
    ymin: Math.min.apply(null,pointJson.features.map(item=>item.geometry.coordinates[1])),
    xmax: Math.max.apply(null,pointJson.features.map(item=>item.geometry.coordinates[0])),
    ymax: Math.max.apply(null,pointJson.features.map(item=>item.geometry.coordinates[1])),
};
const startTime = moment("2020-01-01 08:00:00").valueOf();
const endTime = moment("2020-01-04 08:00:00").valueOf();
const interval = 3600 * 1000;
const frames = (endTime - startTime) / interval;

const data = new Array(frames).fill(0).map((i, timeIndex) => {
    return {
        time: timeIndex * interval + startTime,
        value: new Array(points.length).fill(0).map(() => Math.random() * 11),
    };
});

const colorMap = {
    type: "class-break",
    breaks: [
        { min: 1, max: 2, color: "#1a9850" },
        { min: 2, max: 3, color: "#66bd63" },
        { min: 3, max: 4, color: "#a6d96a" },
        { min: 4, max: 5, color: "#d9ef8b" },
        { min: 5, max: 6, color: "#ffffbf" },
        { min: 6, max: 7, color: "#fee08b" },
        { min: 7, max: 8, color: "#fdae61" },
        { min: 8, max: 9, color: "#f46d43" },
        { min: 9, max: 10, color: "#d73027" },
        { min: 10, max: 15, color: "#a50026" },
    ],
} as ClassBreakColorMapping;
const colorMap2 = {
    type: "gradient",
    stops: [
        { value: 0, color: "transparent" },
        { value: 0.1, color: "#1a9850" },
        { value: 0.2, color: "#66bd63" },
        { value: 0.3, color: "#a6d96a" },
        { value: 0.4, color: "#d9ef8b" },
        { value: 0.5, color: "#ffffbf" },
        { value: 0.6, color: "#fee08b" },
        { value: 0.7, color: "#fdae61" },
        { value: 0.8, color: "#f46d43" },
        { value: 0.9, color: "#d73027" },
    ],
    valueRange: [0, 11],
} as GradientColorMapping;

const polygons = gonganCountyJson.features.map((i) => {
    return new PolygonGeometry({
        spatialReference: {wkid: 4326},
        rings: i.geometry.coordinates[0],
    });
});

export const KrigingDataMeta = {
    startTime,
    endTime,
    points,
    data: data,
    colorMap: [colorMap, colorMap2],
    pointsExtent,
    interval,
    polygons,
    center,
    grids
};
