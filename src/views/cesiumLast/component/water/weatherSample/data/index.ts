import moment from "moment";
import geojson from "./kriging-clip-polygon.json"

//位置  靖州
const rings = geojson.geometry.coordinates[0][0].flat().map(Number)
const points = [
    [109.433333, 26.416667],
    [109.75, 26.583333],
    [109.733333, 26.583333],
    [109.45, 26.7],
    [109.370833, 26.351389],
    [109.543611, 26.4275],
    [109.825833, 26.5275],
    [109.435, 26.608056],
    [109.818333, 26.608889],
    [109.482222, 26.280556],
    [109.493333, 26.370833],
    [109.414722, 26.517222],
    [109.3675, 26.452778],
    [109.486111, 26.463889],
    [109.764722, 26.478611],
    [109.314444, 26.670556],
    [109.404722, 26.715556],
    [109.541944, 26.681944],
    [109.322778, 26.378056],
    [109.355278, 26.316944],
    [109.71, 26.57],
    [109.46972, 26.69],
    [109.44, 26.41],
    [109.77, 26.71],
    [109.61, 26.48],
    [109.87, 26.53],
    [109.6, 26.66],
    [109.51, 26.56]
];

const startTime = moment("2020-01-01 08:00:00").valueOf();
const endTime = moment("2020-01-04 08:00:00").valueOf();
const interval = 3600 * 1000;
const frames = (endTime - startTime) / interval;

const data = new Array(frames).fill('').map((i, timeIndex) => {
    return {
        time: timeIndex * interval + startTime,
        value: new Array(points.length).fill(0).map(() => Math.random() * 10),
    };
});

const colorMap = {
    type: "class-break",
    breaks: [
        {min: 0.1, max: 1, color: "#DFDFDF"},
        {min: 1, max: 1.5, color: "#A3F392"},
        {min: 1.6, max: 6.9, color: "#39A501"},
        {min: 7, max: 14.9, color: "#63B7FF"},
        {min: 15, max: 39.9, color: "#F4AB18"},
        {min: 40, max: 49.9, color: "#EA1BE7"},
        {min: 50, max: 100, color: "#9D004F"},
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
