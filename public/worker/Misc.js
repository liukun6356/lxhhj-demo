define(['exports'], (function (exports) { 'use strict';

    function workerFeatureDetect() {
        return {
            offscreenCanvas: typeof OffscreenCanvas !== "undefined",
        };
    }

    exports.workerFeatureDetect = workerFeatureDetect;

}));
//# sourceMappingURL=Misc.js.map
