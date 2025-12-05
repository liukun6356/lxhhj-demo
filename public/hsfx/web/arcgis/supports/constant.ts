export const COLOR_MAPPING_TEXTURE_WIDTH = 256;

export type ColorMappingKey = (typeof ColorMapping)[keyof typeof ColorMapping];
export const ColorMapping = {
    'ramp': 1,
    'classbreak': 2,
    'unique': 3
} as const;