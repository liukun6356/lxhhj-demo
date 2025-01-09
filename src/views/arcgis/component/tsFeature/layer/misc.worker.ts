export function workerFeatureDetect() {
    return {
        offscreenCanvas: typeof OffscreenCanvas !== "undefined",
    };
}
