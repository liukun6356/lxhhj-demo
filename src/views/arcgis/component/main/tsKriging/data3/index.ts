import {ClassBreakColorMapping, GradientColorMapping} from "./layer/color-mapping";
import moment from "moment";
import PolygonGeometry from "@arcgis/core/geometry/Polygon";
import jsonData from "./bounds.json"

const center = {
    center: [109.473, 26.786],
    zoom: 14
}

//位置
const points = [
    {
        "x": 109.473,
        "y": 26.786
    },
    {
        "x": 109.574,
        "y": 26.786
    },
    {
        "x": 109.674,
        "y": 26.786
    },
    {
        "x": 109.775,
        "y": 26.786
    },
    {
        "x": 109.876,
        "y": 26.786
    },
    {
        "x": 109.271,
        "y": 26.696
    },
    {
        "x": 109.372,
        "y": 26.696
    },
    {
        "x": 109.473,
        "y": 26.696
    },
    {
        "x": 109.573,
        "y": 26.696
    },
    {
        "x": 109.674,
        "y": 26.696
    },
    {
        "x": 109.775,
        "y": 26.696
    },
    {
        "x": 109.875,
        "y": 26.696
    },
    {
        "x": 109.976,
        "y": 26.696
    },
    {
        "x": 109.372,
        "y": 26.606
    },
    {
        "x": 109.473,
        "y": 26.606
    },
    {
        "x": 109.573,
        "y": 26.606
    },
    {
        "x": 109.674,
        "y": 26.606
    },
    {
        "x": 109.774,
        "y": 26.606
    },
    {
        "x": 109.875,
        "y": 26.606
    },
    {
        "x": 109.372,
        "y": 26.516
    },
    {
        "x": 109.472,
        "y": 26.516
    },
    {
        "x": 109.573,
        "y": 26.516
    },
    {
        "x": 109.673,
        "y": 26.516
    },
    {
        "x": 109.774,
        "y": 26.516
    },
    {
        "x": 109.874,
        "y": 26.516
    },
    {
        "x": 109.271,
        "y": 26.426
    },
    {
        "x": 109.372,
        "y": 26.426
    },
    {
        "x": 109.472,
        "y": 26.426
    },
    {
        "x": 109.573,
        "y": 26.426
    },
    {
        "x": 109.673,
        "y": 26.426
    },
    {
        "x": 109.774,
        "y": 26.426
    },
    {
        "x": 109.874,
        "y": 26.426
    },
    {
        "x": 109.271,
        "y": 26.336
    },
    {
        "x": 109.372,
        "y": 26.336
    },
    {
        "x": 109.472,
        "y": 26.336
    },
    {
        "x": 109.572,
        "y": 26.336
    },
    {
        "x": 109.673,
        "y": 26.336
    },
    {
        "x": 109.773,
        "y": 26.336
    },
    {
        "x": 109.372,
        "y": 26.246
    },
    {
        "x": 109.472,
        "y": 26.246
    },
    {
        "x": 109.572,
        "y": 26.246
    }
];

const pointsExtent = {
    spatialReference: {
        wkid: 4326,
    },
    xmin: 109.271,
    ymin: 26.246,
    xmax: 109.976,
    ymax: 26.786
};

const startTime = moment("2025-08-25 15:00:00").valueOf();
const endTime = moment("2025-08-26 15:00:00").valueOf();
const interval = 3600 * 1000;
const frames = (endTime - startTime) / interval;

const data = new Array(frames).fill(0).map((i, timeIndex) => {
    return {
        time: timeIndex * interval + startTime,
        value: [0,0,0.32,1.33,0,0,0,0.24,0.21,0.08,3.54,0.27,0,0,1.6,0.29,0,0,0,0,0.09,0.08,0,0,0,0,0,0,0,0,0,0,0.08,0,1.13,0,0,0,0,0.13,0.08]
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
