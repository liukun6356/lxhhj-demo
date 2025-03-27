import { ClassBreakColorMapping, GradientColorMapping } from "./layer/color-mapping";
import moment from "moment";
import PolygonGeometry from "@arcgis/core/geometry/Polygon";
import jsonData from "./kriging-clip-polygon.json"

const center = {
    center: [112.536014, 37.061309],
    zoom: 11
}

//位置
const points = [
    { x: 112.399200289, y: 36.9491050183 },
    { x: 112.549136249, y: 37.1006417175 },
    { x: 112.549669829, y: 37.199354004 },
    { x: 112.350644516, y: 36.9987279515 },
    { x: 112.550203409, y: 37.0499516245 },
    { x: 112.449890382, y: 37.1001081376 },
    { x: 112.601427082, y: 37.2004211638 },
    { x: 112.499513316, y: 37.1497310708 },
    { x: 112.501647635, y: 36.9997951113 },
    { x: 112.449890382, y: 36.9507057581 },
    { x: 112.500046896, y: 37.0995745577 },
    { x: 112.399733869, y: 37.0494180445 },
    { x: 112.599292762, y: 37.0995745577 },
    { x: 112.651583595, y: 37.2009547438 },
    { x: 112.548602669, y: 37.1497310708 },
    { x: 112.600893502, y: 37.1491974909 },
    { x: 112.450957542, y: 36.9997951113 },
    { x: 112.649982855, y: 37.1491974909 },
    { x: 112.450423962, y: 37.0494180445 },
    { x: 112.448823223, y: 37.1502646507 },
    { x: 112.500046896, y: 37.1998875839 },
    { x: 112.500580476, y: 37.0499516245 },
    { x: 112.450423962, y: 37.1998875839 },
];

const pointsExtent = {
    spatialReference: {
        wkid: 4326,
    },
    xmin: 112.350645,
    ymin: 36.949105,
    xmax: 112.651584,
    ymax: 37.200955,
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

const polygons = jsonData.features.map((i) => {
    return new PolygonGeometry({
        spatialReference: {wkid: 4326},
        rings: i.geometry.coordinates,
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
    center
};
