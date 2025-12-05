import type { ColorMappingClassbreakProperties } from "web/arcgis/supports/colorMapping/classbreak";

export const DepthColorMapping = {
    type: 'classbreak',
    breaks: [
        { min: 0.01, max: 0.5, color: 'rgb(179,204,255)' },
        { min: 0.5, max: 1, color: 'rgb(128,153,255)' },
        { min: 1, max: 2, color: 'rgb(89,128,255)' },
        { min: 2, max: 3, color: 'rgb(38,115,242)' },
        { min: 3, max: Infinity, color: 'rgb(0,77,204)' },
    ],
    clampHead: true,
    headColor: 'transparent',
} as ColorMappingClassbreakProperties;

export function createWaterLevelColorMapping([min, max]: number[]) {
    return {
        type: 'classbreak',
        breaks: {
            min,
            max,
            colors: [
                'rgb(102,230,255)',
                'rgb(0,179,255)',
                'rgb(0,128,255)',
                'rgb(0,77,179)',
                'rgb(0,38,115)',
            ]
        },
        clampHead: true,
        headColor: 'transparent',
    } as ColorMappingClassbreakProperties;
}
