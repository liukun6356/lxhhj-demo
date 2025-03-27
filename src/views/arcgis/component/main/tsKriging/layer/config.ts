export const WorkerPathConfig = {
    misc: "Misc",
    vectorTile: "VT",
    kriging: "Kriging",
    raster: "Raster",
};

export function workerFeatureDetect() {
    return {
        offscreenCanvas: typeof OffscreenCanvas !== "undefined",
    };
}
