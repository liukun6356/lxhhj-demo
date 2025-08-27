import {ClassBreakColorMapping, GradientColorMapping} from "./layer/color-mapping";
import moment from "moment";
import PolygonGeometry from "@arcgis/core/geometry/Polygon";
import jsonData from "./bounds.json"
import {data as pointData} from "./point.js"

const mapData = new Map()
pointData.forEach(item => {
    const [k, v] = Object.entries(item)[0]
    mapData.set(moment(k).valueOf(), v.map(x => x.value))
})

const center = {
    center: [119.739886, 49.393803],
    zoom: 14
}

//位置
const points = [
        {"x": 119.73435, "y": 49.382545},
        {"x": 119.719345, "y": 49.404427},
        {"x": 119.712746, "y": 49.40632},
        {"x": 119.708015, "y": 49.408096},
        {"x": 119.702194, "y": 49.40747},
        {"x": 119.70105, "y": 49.401478},
        {"x": 119.74961, "y": 49.383904},
        {"x": 119.75509, "y": 49.40722},
        {"x": 119.77728, "y": 49.400333},
        {"x": 119.7597, "y": 49.38081},
        {"x": 119.767494, "y": 49.39377},
        {"x": 119.73419, "y": 49.39864},
        {"x": 119.719925, "y": 49.38566},
        {"x": 119.71202, "y": 49.40406},
        {"x": 119.70329, "y": 49.391174},
        {"x": 119.720276, "y": 49.384182},
        {"x": 119.726036, "y": 49.386818},
        {"x": 119.741486, "y": 49.393444},
        {"x": 119.74415, "y": 49.3966},
        {"x": 119.75245, "y": 49.39243},
        {"x": 119.745514, "y": 49.39741},
        {"x": 119.75752, "y": 49.387745},
        {"x": 119.755714, "y": 49.38684},
        {"x": 119.75137, "y": 49.384327},
        {"x": 119.740616, "y": 49.397743},
        {"x": 119.77472, "y": 49.381397},
        {"x": 119.72195, "y": 49.381775},
        {"x": 119.72685, "y": 49.382786},
        {"x": 119.72513, "y": 49.388084},
        {"x": 119.71994, "y": 49.38577},
        {"x": 119.76776, "y": 49.377712},
        {"x": 119.69966, "y": 49.39555},
        {"x": 119.71428, "y": 49.407814},
        {"x": 119.69365, "y": 49.40304},
        {"x": 119.72025, "y": 49.40594},
        {"x": 119.70316, "y": 49.408367},
        {"x": 119.69449, "y": 49.397568},
        {"x": 119.69788, "y": 49.402046},
        {"x": 119.694466, "y": 49.40025},
        {"x": 119.70926, "y": 49.409363},
        {"x": 119.70315, "y": 49.40423},
        {"x": 119.71998, "y": 49.40299},
        {"x": 119.731346, "y": 49.398663},
        {"x": 119.70096, "y": 49.400715},
        {"x": 119.708466, "y": 49.404663},
        {"x": 119.70113, "y": 49.403336},
        {"x": 119.73716, "y": 49.4029},
        {"x": 119.76514, "y": 49.380814},
        {"x": 119.73296, "y": 49.400578},
        {"x": 119.69788, "y": 49.400284}
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

const startTime = moment("2025-08-25 15:00:00").valueOf();
const endTime = moment("2025-08-26 15:00:00").valueOf();
const interval = 3600 * 1000;
const frames = (endTime - startTime) / interval;

const data = new Array(frames).fill(0).map((i, timeIndex) => {
    return {
        time: timeIndex * interval + startTime,
        value:  mapData.get(timeIndex * interval + startTime)
            // new Array(points.length).fill(0).map(() => Math.random() * 11),
    };
});

const colorMap = {
    type: "class-break",
    breaks: [
        {min: 1, max: 2, color: "rgba(26,152,80,0.8)"},
        {min: 2, max: 3, color: "rgba(102,189,99,0.8)"},
        {min: 3, max: 4, color: "rgba(166,217,106,0.8)"},
        {min: 4, max: 5, color: "rgba(217,239,139,0.8)"},
        {min: 5, max: 6, color: "rgba(255,255,191,0.8)"},
        {min: 6, max: 7, color: "rgba(254,224,139,0.8)"},
        {min: 7, max: 8, color: "rgba(253,174,97,0.8)"},
        {min: 8, max: 9, color: "rgba(244,109,67,0.8)"},
        {min: 9, max: 10, color: "rgba(215,48,39,0.8)"},
        {min: 10, max: 15, color: "rgba(165,0,38,0.8)"},
    ],
} as ClassBreakColorMapping;
const colorMap2 = {
    type: "gradient",
    stops: [
        {value: 0, color: "transparent"},
        {value: 0.1, color: "#1a9850"},
        {value: 0.2, color: "#66bd63"},
        {value: 0.3, color: "#a6d96a"},
        {value: 0.4, color: "#d9ef8b"},
        {value: 0.5, color: "#ffffbf"},
        {value: 0.6, color: "#fee08b"},
        {value: 0.7, color: "#fdae61"},
        {value: 0.8, color: "#f46d43"},
        {value: 0.9, color: "#d73027"},
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
