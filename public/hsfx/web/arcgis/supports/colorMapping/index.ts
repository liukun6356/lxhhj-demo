import { ColorMapping } from "../constant";
import {
    ColorMappingClassbreak,
    type ColorMappingClassbreakProperties,
    type ColorMappingLoaderClassbreak
} from "./classbreak";
import {
    type ColorMappingLoaderRamp,
    ColorMappingRamp,
    type ColorMappingRampProperties
} from "./ramp";

export type ColorMappingProperties =
    | Partial<ColorMappingRampProperties>
    | ColorMappingRamp
    | Partial<ColorMappingClassbreakProperties>
    | ColorMappingClassbreak;

export function ColorMappingCast(v: ColorMappingRampProperties | ColorMappingClassbreakProperties) {
    if (!v) return v;
    return v.type === 'ramp'
        ? new ColorMappingRamp(v)
        : new ColorMappingClassbreak(v)
}


//see /web/arcgis/supports/webgl/glsl/color-mapping.ts
export const ColorMappingStructSize = 4 * 4 * Float32Array.BYTES_PER_ELEMENT;
export function calcGLSLStructData_colorMapping(
    mapping: ReturnType<
        | ColorMappingLoaderClassbreak['getData']
        | ColorMappingLoaderRamp['getData']>
) {
    const PADDING = NaN; const UNKNOWN = NaN;
    const mappingType = ColorMapping[mapping.type];
    const mappingValueRange = mapping.type === 'ramp'
        ? mapping.valueRange
        : [UNKNOWN, UNKNOWN];
    const breaks = mapping.type === 'classbreak'
        ? mapping.breaks
        : UNKNOWN;
    const clampHead = mapping.clampHead ? 1 : 0;
    const clampTail = mapping.clampTail ? 1 : 0;
    const headColor = [
        mapping.headColor.r / 255,
        mapping.headColor.g / 255,
        mapping.headColor.b / 255,
        mapping.headColor.a,
    ];
    const tailColor = [
        mapping.tailColor.r / 255,
        mapping.tailColor.g / 255,
        mapping.tailColor.b / 255,
        mapping.tailColor.a,
    ];
    return new Float32Array([
        mappingType, breaks, clampHead, clampTail,
        ...headColor,
        ...tailColor,
        ...mappingValueRange, PADDING, PADDING
    ]);
}