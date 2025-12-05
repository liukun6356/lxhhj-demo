
export type RenderModeKey = 'z' | 'mesh' | "wireframe";
export type TimeDataType = 'simple' | "vector";
export const MeshMappingMode = {
    'per-vertex': 1.0,
    'per-mesh': 2.0
} as const;
export type MeshMappingModeKey = keyof typeof MeshMappingMode;