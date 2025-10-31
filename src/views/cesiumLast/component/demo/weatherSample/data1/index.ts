import moment from "moment";
import geojson from "./kriging-clip-polygon.json"

//位置
const rings = geojson.geometry.coordinates[0][0].flat().map(Number)
const points = [
    [112.399200289, 36.9491050183],
    [112.549136249, 37.1006417175],
    [112.549669829, 37.199354004],
    [112.350644516, 36.9987279515],
    [112.550203409, 37.0499516245],
    [112.449890382, 37.1001081376],
    [112.601427082, 37.2004211638],
    [112.499513316, 37.1497310708],
    [112.501647635, 36.9997951113],
    [112.449890382, 36.9507057581],
    [112.500046896, 37.0995745577],
    [112.399733869, 37.0494180445],
    [112.599292762, 37.0995745577],
    [112.651583595, 37.2009547438],
    [112.548602669, 37.1497310708],
    [112.600893502, 37.1491974909],
    [112.450957542, 36.9997951113],
    [112.649982855, 37.1491974909],
    [112.450423962, 37.0494180445],
    [112.448823223, 37.1502646507],
    [112.500046896, 37.1998875839],
    [112.500580476, 37.0499516245],
    [112.450423962, 37.1998875839],
];

const startTime = moment("2020-01-01 08:00:00").valueOf();
const endTime = moment("2020-01-04 08:00:00").valueOf();
const interval = 3600 * 1000;
const frames = (endTime - startTime) / interval;

const data = new Array(frames).fill('').map((i, timeIndex) => {
    return {
        time: timeIndex * interval + startTime,
        value: new Array(points.length).fill(0).map(() => Math.random() * 11),
    };
});

const colorMap = {
    type: "class-break",
    breaks: [
        {min: 1, max: 2, color: "#1a9850"},
        {min: 2, max: 3, color: "#66bd63"},
        {min: 3, max: 4, color: "#a6d96a"},
        {min: 4, max: 5, color: "#d9ef8b"},
        {min: 5, max: 6, color: "#ffffbf"},
        {min: 6, max: 7, color: "#fee08b"},
        {min: 7, max: 8, color: "#fdae61"},
        {min: 8, max: 9, color: "#f46d43"},
        {min: 9, max: 10, color: "#d73027"},
        {min: 10, max: 15, color: "#a50026"},
    ],
};

export const krigingDataMeta = {
    startTime,
    endTime,
    points,
    data,
    colorMap,
    interval,
    rings
};
