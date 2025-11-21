import moment from "moment";
import geojson from "./kriging-clip-polygon.json"

//位置  闽江
const rings = geojson.geometry.coordinates[0][0].flat().map(Number)

const points = [
    [117.22936, 28.103932],
    [117.783636, 28.103932],
    [118.337912, 28.103932],
    [118.892188, 28.103932],
    [117.22936, 27.65427],
    [117.783636, 27.65427],
    [118.337912, 27.65427],
    [118.892188, 27.65427],
    [119.446464, 27.65427],
    [116.675084, 27.204607],
    [117.22936, 27.204607],
    [117.783636, 27.204607],
    [118.337912, 27.204607],
    [118.892188, 27.204607],
    [116.675084, 26.754944],
    [117.22936, 26.754944],
    [117.783636, 26.754944],
    [118.337912, 26.754944],
    [118.892188, 26.754944],
    [116.120808, 26.305281],
    [116.675084, 26.305281],
    [117.22936, 26.305281],
    [117.783636, 26.305281],
    [118.337912, 26.305281],
    [118.892188, 26.305281],
    [116.675084, 25.855618],
    [117.22936, 25.855618],
    [117.783636, 25.855618],
    [118.337912, 25.855618],
    [116.675084, 25.405955],
    [117.22936, 25.405955],
    [117.783636, 25.405955],
    [118.337912, 25.405955]
];

const startTime = moment("2020-01-01 08:00:00").valueOf();
const endTime = moment("2020-01-04 08:00:00").valueOf();
const interval = 3600 * 1000;
const frames = (endTime - startTime) / interval;

const data = new Array(frames).fill('').map((i, timeIndex) => {
    return {
        time: timeIndex * interval + startTime,
        value: new Array(points.length).fill(0).map(() => Math.random() * 15),
    };
});

const colorMap = {
    type: "class-break",
    breaks: [
        {min: 1, max: 2, color: "#71d79d"},
        {min: 2, max: 3, color: "#66bd63"},
        {min: 3, max: 4, color: "#a6d96a"},
        {min: 4, max: 5, color: "#d9ef8b"},
        {min: 5, max: 6, color: "#ffffbf"},
        {min: 6, max: 7, color: "#fee08b"},
        {min: 7, max: 8, color: "#fdaf61"},
        {min: 8, max: 9, color: "#f46d43"},
        {min: 9, max: 10, color: "#d73027"},
        {min: 10, max: 15, color: "#a50026"}
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
