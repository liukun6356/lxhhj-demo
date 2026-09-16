import moment from "moment";
import geojson from "./kriging-clip-polygon.json"

//位置  湖北省荆州市公安县
const rings = geojson.geometry.coordinates[0][0].flat().map(Number)
const points = [
    [112.109243, 29.995875],
    [112.0131747, 29.98688967],
    [112.072318, 29.74519],
    [112.207178, 29.906553],
    [112.20645, 30.080795],
    [112.304876, 29.971109],
    [112.227241, 30.299913],
    [112.318965, 29.756524],
    [112.086934, 29.857528],
    [112.205316, 29.852762],
    [112.0115768, 30.05598729],
    [112.162168, 29.732314],
    [112.285322, 30.061423],
    [112.189747, 29.666173],
    [112.0713715, 30.04157068]

];

const startTime = moment("2020-01-01 08:00:00").valueOf();
const endTime = moment("2020-01-04 08:00:00").valueOf();
const interval = 3600 * 1000;
const frames = (endTime - startTime) / interval;

const data = new Array(frames).fill('').map((i, timeIndex) => {
    return {
        time: timeIndex * interval + startTime,
        value: new Array(points.length).fill(0).map(() =>  Math.random()),
    };
});

const colorMap = {
    type: "class-break",
    breaks: [
        {min: 0, max: 0.1, color: "#33FF99"},
        {min: 0.1, max: 0.2, color: "#AB1919"},
        {min: 0.2, max: 0.5, color: "#F6F006"},
        {min: 0.5, max: 0.8, color: "#F10B7B"},
        {min: 0.8, max: 100, color: "#E11C1C"},
        // ---
        // {min: 6, max: 7, color: "#fee08b"},
        // {min: 7, max: 8, color: "#fdaf61"},
        // {min: 8, max: 9, color: "#f46d43"},
        // {min: 9, max: 10, color: "#d73027"},
        // {min: 10, max: 15, color: "#a50026"}
        // {min: -1e4, max: -0.8, color: "#E11C1C"},
        // {min: -0.8, max: -0.5, color: "#F10B7B"},
        // {min: -0.5, max: -0.2, color: "#F6F006"},
        // {min: -0.2, max: -0.1, color: "#AB1919"},
        // {min: -0.1, max: 20, color: "#33FF99"},
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
