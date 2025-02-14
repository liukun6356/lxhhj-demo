define(['exports', '/arcgis-js-api/geometry/geometryEngine.js'], (function (exports, geometryEngine_js) { 'use strict';

    function loadImage(src) {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = src;
            image.onload = () => resolve(image);
        });
    }
    //webgl 纹理解包值
    function getTextureUnpackAlign(textureWidth) {
        return !(textureWidth & 0b111) ? 8 : !(textureWidth & 0b11) ? 4 : !(textureWidth & 0b1) ? 2 : 1;
    }
    //大于等于某个数的最小的2的幂
    function ceilPowerOfTwo(val) {
        val = +val;
        if (isNaN(val))
            throw new Error("不是数字");
        if (val & (val - 1)) {
            val |= val >> 1;
            val |= val >> 2;
            val |= val >> 4;
            val |= val >> 8;
            val |= val >> 16;
            return val + 1;
        }
        else {
            return val === 0 ? 1 : val;
        }
    }
    //
    //
    /**
     * 满足给定长度的最小的纹理尺寸, 宽高均为2的幂, 宽高之间差值最小(接近正方形)。
     * 例如 3个像素 = 2X2 纹理,
     * @param pixelCount 像素数
     * @returns
     */
    function calcDataTexSize(pixelCount) {
        if (!pixelCount)
            throw new Error("长度不存在!");
        const length = ceilPowerOfTwo(pixelCount);
        const l = Math.log2(length);
        const cols = Math.ceil(l / 2);
        const rows = l - cols;
        return [2 ** cols, 2 ** rows];
    }
    //float64 转 2个 float32
    function doubleToTwoFloats(value) {
        let high, low, tempHigh;
        if (value >= 0) {
            if (value < 65536)
                return [0, value];
            tempHigh = Math.floor(value / 65536) * 65536;
            high = tempHigh;
            low = value - tempHigh;
        }
        else {
            if (value > -65536)
                return [0, value];
            tempHigh = Math.floor(-value / 65536) * 65536;
            high = -tempHigh;
            low = value + tempHigh;
        }
        return [high, low];
    }
    function sleep(t) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), t);
        });
    }
    //二分法
    function binarySearch(ascArr, target) {
        let left = 0;
        let right = ascArr.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (ascArr[mid] === target) {
                return mid;
            }
            else if (ascArr[mid] < target) {
                left = mid + 1;
            }
            else {
                right = mid - 1;
            }
        }
        return -1;
    }
    //查找第一个大于target的数的索引
    function findFirstGreaterThan(ascArr, target) {
        let left = 0;
        let right = ascArr.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (ascArr[mid] > target) {
                if (mid === 0 || ascArr[mid - 1] <= target) {
                    return mid;
                }
                else {
                    right = mid - 1;
                }
            }
            else {
                left = mid + 1;
            }
        }
        return -1; // 如果没有找到符合条件的数，则返回 -1
    }
    /**
     * 查找值所在区间索引
     * [1.1, 2.2, 3.5, 4.0]  2.5所在区间索引为[1,2], 4所在区间索引为[2,3]
     *   0    1    2    3
     * @param ascArr 升序数组
     * @param value 要查找的数
     */
    function findIntervalIndexThatValueIn(ascArr, value) {
        let afterIndex = findFirstGreaterThan(ascArr, value);
        if (afterIndex === -1)
            afterIndex = ascArr.length - 1;
        const beforeIndex = Math.max(0, afterIndex - 1);
        return [beforeIndex, afterIndex];
    }
    async function retryCall(fn, //待执行函数
    maxAttempts = 3, //最大重试次数
    delay = 500, //重试间隔
    timeout = 30000 //超时时间
    ) {
        let attemp = 0;
        while (attemp < maxAttempts) {
            try {
                const result = await Promise.race([timeoutPromise(timeout), fn()]);
                return result;
            }
            catch (e) {
                attemp++;
                if (attemp === maxAttempts)
                    throw e;
                await sleep(delay);
            }
        }
        function timeoutPromise(t) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject("超时");
                }, t);
            });
        }
    }
    function rafThrottle(callback) {
        let requestId = null;
        let lastArgs;
        const later = (context) => () => {
            requestId = null;
            callback.apply(context, lastArgs);
        };
        const throttled = function (...args) {
            lastArgs = args;
            if (requestId === null) {
                requestId = requestAnimationFrame(later(this));
            }
        };
        throttled.cancel = () => {
            cancelAnimationFrame(requestId);
            requestId = null;
        };
        return throttled;
    }
    const nextTick = /*#__PURE__*/ (() => {
        const callbacks = [];
        let pending = false;
        function flushCallbacks() {
            pending = false;
            const copies = callbacks.slice(0);
            callbacks.length = 0;
            for (var i = 0; i < copies.length; i++) {
                copies[i]();
            }
        }
        return function (cb, ctx) {
            let _resolve;
            callbacks.push(() => {
                if (cb) {
                    cb.call(ctx);
                }
                else {
                    _resolve(ctx);
                }
            });
            if (!pending) {
                pending = true;
                Promise.resolve().then(flushCallbacks);
            }
            if (!cb) {
                return new Promise((resolve) => {
                    _resolve = resolve;
                });
            }
        };
    })();
    /**
     * 延迟批处理队列
     * @param flush 清理时回调
     * @param addFn 是否应该添加到队列
     * @param delayType 延时函数, 默认promise
     * @param timeout 延迟时间, delayType = "settimeout" 有效
     * @returns
     */
    function flushQueue(flush, addFn, delayType = "promise", timeout) {
        let flushing = false;
        const list = [];
        const delayFn = delayType === "promise"
            ? (cb) => {
                Promise.resolve().then(() => {
                    const copy = [...list];
                    list.length = 0;
                    try {
                        cb(copy);
                    }
                    finally {
                        flushing = false;
                    }
                });
            }
            : (cb) => {
                setTimeout(() => {
                    const copy = [...list];
                    list.length = 0;
                    try {
                        cb(copy);
                    }
                    finally {
                        flushing = false;
                    }
                }, timeout ?? 4);
            };
        return (addObj) => {
            const showAdd = addFn ? addFn(addObj, list) : true;
            if (showAdd) {
                list.push(addObj);
                if (!flushing) {
                    flushing = true;
                    delayFn(flush);
                }
            }
        };
    }
    //递增数组的diff
    function diffAscArrays(arr1, arr2) {
        let i = 0;
        let j = 0;
        const only1 = [];
        const both = [];
        const only2 = [];
        while (i < arr1.length && j < arr2.length) {
            if (arr1[i] < arr2[j]) {
                only1.push(arr1[i]);
                i++;
            }
            else if (arr1[i] > arr2[j]) {
                only2.push(arr2[j]);
                j++;
            }
            else {
                // 当前元素相等，添加到共有集合，并跳过
                both.push(arr1[i]);
                i++;
                j++;
            }
        }
        // 处理剩余的元素
        while (i < arr1.length) {
            only1.push(arr1[i]);
            i++;
        }
        while (j < arr2.length) {
            only2.push(arr2[j]);
            j++;
        }
        return {
            only1,
            both,
            only2,
        };
    }

    /**
     * 点是否在三角形内
     * @param p
     * @param A
     * @param B
     * @param C
     */
    function pointInTriangle$1(p, A, B, C) {
        const pa = [p.x - A.x, p.y - A.y];
        const pb = [p.x - B.x, p.y - B.y];
        const pc = [p.x - C.x, p.y - C.y];
        const v1 = pa[0] * pb[1] - pa[1] * pb[0]; //pa x pb
        const v2 = pb[0] * pc[1] - pb[1] * pc[0]; //pb x pc
        const v3 = pc[0] * pa[1] - pc[1] * pa[0]; //pc x pa
        return v1 * v2 >= 0 && v2 * v3 >= 0;
    }
    //点是否在extent内
    function pointInExtent(p, extent) {
        return p.x >= extent.xmin && p.x <= extent.xmax && p.y >= extent.ymin && p.y <= extent.ymax;
    }
    //判断两个extent是否相交
    function isExtentIntersect(extent1, extent2) {
        return !(extent1.xmax < extent2.xmin ||
            extent1.xmin > extent2.xmax ||
            extent1.ymax < extent2.ymin ||
            extent1.ymin > extent2.ymax);
    }
    //返回两个extent相交范围
    function extentIntersection(extent1, extent2) {
        const xmin = Math.max(extent1.xmin, extent2.xmin);
        const ymin = Math.max(extent1.ymin, extent2.ymin);
        const xmax = Math.min(extent1.xmax, extent2.xmax);
        const ymax = Math.min(extent1.ymax, extent2.ymax);
        return xmax > xmin && ymax > ymin
            ? {
                xmin,
                ymin,
                xmax,
                ymax,
            }
            : null;
    }
    //简单多边形的面积
    function simplePolygonArea(ring) {
        if (ring.length <= 2)
            return 0;
        let x0, y0, area = 0;
        for (let i = 0; i < ring.length; i++) {
            const x = ring[i][0];
            const y = ring[i][1];
            if (i > 0) {
                area += (x0 * y - x * y0) / 2; // area
            }
            x0 = x;
            y0 = y;
        }
        return Math.abs(area);
    }
    //extent向外扩张给定的距离
    function calcExpandExtent({ xmin, ymin, xmax, ymax }, expandSize) {
        const [sizeX, sizeY] = typeof expandSize === 'number' ? [expandSize, expandSize] : expandSize;
        return {
            xmin: xmin - sizeX,
            xmax: xmax + sizeX,
            ymin: ymin - sizeY,
            ymax: ymax + sizeY,
        };
    }
    //计算多个点[x,y][]的extent
    function calcCoordsExtent(points) {
        let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
        for (let i = points.length; i--;) {
            const [x, y] = points[i];
            xmin = Math.min(xmin, x);
            xmax = Math.max(xmax, x);
            ymin = Math.min(ymin, y);
            ymax = Math.max(ymax, y);
        }
        return {
            xmin,
            ymin,
            xmax,
            ymax,
        };
    }
    //计算多个点{x,y}[]的extent
    function calcPointLikesExtent(points) {
        let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
        for (let i = points.length - 1; i--;) {
            const { x, y } = points[i];
            xmin = Math.min(xmin, x);
            xmax = Math.max(xmax, x);
            ymin = Math.min(ymin, y);
            ymax = Math.max(ymax, y);
        }
        return {
            xmin,
            ymin,
            xmax,
            ymax,
        };
    }
    //计算三角形的extent
    function calcTriangleExtent(p1, p2, p3) {
        return {
            xmin: Math.min.call(null, p1[0], p2[0], p3[0]),
            xmax: Math.max.call(null, p1[0], p2[0], p3[0]),
            ymin: Math.min.call(null, p1[1], p2[1], p3[1]),
            ymax: Math.max.call(null, p1[1], p2[1], p3[1]),
        };
    }
    //闭合一个polygon的首尾
    function closePolygonRings(ring) {
        const last = ring[ring.length - 1];
        if (ring[0][0] !== last[0] || ring[0][1] !== last[1]) {
            ring.push(ring[0]);
        }
        return ring;
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function getDefaultExportFromNamespaceIfPresent (n) {
    	return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
    }

    function getDefaultExportFromNamespaceIfNotNamed (n) {
    	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
    }

    function getAugmentedNamespace(n) {
      if (n.__esModule) return n;
      var f = n.default;
    	if (typeof f == "function") {
    		var a = function a () {
    			if (this instanceof a) {
    				var args = [null];
    				args.push.apply(args, arguments);
    				var Ctor = Function.bind.apply(f, args);
    				return new Ctor();
    			}
    			return f.apply(this, arguments);
    		};
    		a.prototype = f.prototype;
      } else a = {};
      Object.defineProperty(a, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    var earcut$2 = {exports: {}};

    var earcut_1 = earcut$2.exports;

    'use strict';

    earcut$2.exports = earcut;
    var _default = earcut$2.exports.default = earcut;

    function earcut(data, holeIndices, dim) {

        dim = dim || 2;

        var hasHoles = holeIndices && holeIndices.length,
            outerLen = hasHoles ? holeIndices[0] * dim : data.length,
            outerNode = linkedList(data, 0, outerLen, dim, true),
            triangles = [];

        if (!outerNode || outerNode.next === outerNode.prev) return triangles;

        var minX, minY, maxX, maxY, x, y, invSize;

        if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

        // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
        if (data.length > 80 * dim) {
            minX = maxX = data[0];
            minY = maxY = data[1];

            for (var i = dim; i < outerLen; i += dim) {
                x = data[i];
                y = data[i + 1];
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }

            // minX, minY and invSize are later used to transform coords into integers for z-order calculation
            invSize = Math.max(maxX - minX, maxY - minY);
            invSize = invSize !== 0 ? 32767 / invSize : 0;
        }

        earcutLinked(outerNode, triangles, dim, minX, minY, invSize, 0);

        return triangles;
    }

    // create a circular doubly linked list from polygon points in the specified winding order
    function linkedList(data, start, end, dim, clockwise) {
        var i, last;

        if (clockwise === (signedArea(data, start, end, dim) > 0)) {
            for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
        } else {
            for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
        }

        if (last && equals(last, last.next)) {
            removeNode(last);
            last = last.next;
        }

        return last;
    }

    // eliminate colinear or duplicate points
    function filterPoints(start, end) {
        if (!start) return start;
        if (!end) end = start;

        var p = start,
            again;
        do {
            again = false;

            if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
                removeNode(p);
                p = end = p.prev;
                if (p === p.next) break;
                again = true;

            } else {
                p = p.next;
            }
        } while (again || p !== end);

        return end;
    }

    // main ear slicing loop which triangulates a polygon (given as a linked list)
    function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
        if (!ear) return;

        // interlink polygon nodes in z-order
        if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

        var stop = ear,
            prev, next;

        // iterate through ears, slicing them one by one
        while (ear.prev !== ear.next) {
            prev = ear.prev;
            next = ear.next;

            if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
                // cut off the triangle
                triangles.push(prev.i / dim | 0);
                triangles.push(ear.i / dim | 0);
                triangles.push(next.i / dim | 0);

                removeNode(ear);

                // skipping the next vertex leads to less sliver triangles
                ear = next.next;
                stop = next.next;

                continue;
            }

            ear = next;

            // if we looped through the whole remaining polygon and can't find any more ears
            if (ear === stop) {
                // try filtering points and slicing again
                if (!pass) {
                    earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

                // if this didn't work, try curing all small self-intersections locally
                } else if (pass === 1) {
                    ear = cureLocalIntersections(filterPoints(ear), triangles, dim);
                    earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

                // as a last resort, try splitting the remaining polygon into two
                } else if (pass === 2) {
                    splitEarcut(ear, triangles, dim, minX, minY, invSize);
                }

                break;
            }
        }
    }

    // check whether a polygon node forms a valid ear with adjacent nodes
    function isEar(ear) {
        var a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        // now make sure we don't have other points inside the potential ear
        var ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

        // triangle bbox; min & max are calculated like this for speed
        var x0 = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx),
            y0 = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy),
            x1 = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx),
            y1 = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);

        var p = c.next;
        while (p !== a) {
            if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 &&
                pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) &&
                area(p.prev, p, p.next) >= 0) return false;
            p = p.next;
        }

        return true;
    }

    function isEarHashed(ear, minX, minY, invSize) {
        var a = ear.prev,
            b = ear,
            c = ear.next;

        if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

        var ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

        // triangle bbox; min & max are calculated like this for speed
        var x0 = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx),
            y0 = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy),
            x1 = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx),
            y1 = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);

        // z-order range for the current triangle bbox;
        var minZ = zOrder(x0, y0, minX, minY, invSize),
            maxZ = zOrder(x1, y1, minX, minY, invSize);

        var p = ear.prevZ,
            n = ear.nextZ;

        // look for points inside the triangle in both directions
        while (p && p.z >= minZ && n && n.z <= maxZ) {
            if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
                pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
            p = p.prevZ;

            if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
                pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
            n = n.nextZ;
        }

        // look for remaining points in decreasing z-order
        while (p && p.z >= minZ) {
            if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
                pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
            p = p.prevZ;
        }

        // look for remaining points in increasing z-order
        while (n && n.z <= maxZ) {
            if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
                pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
            n = n.nextZ;
        }

        return true;
    }

    // go through all polygon nodes and cure small local self-intersections
    function cureLocalIntersections(start, triangles, dim) {
        var p = start;
        do {
            var a = p.prev,
                b = p.next.next;

            if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

                triangles.push(a.i / dim | 0);
                triangles.push(p.i / dim | 0);
                triangles.push(b.i / dim | 0);

                // remove two nodes involved
                removeNode(p);
                removeNode(p.next);

                p = start = b;
            }
            p = p.next;
        } while (p !== start);

        return filterPoints(p);
    }

    // try splitting polygon into two and triangulate them independently
    function splitEarcut(start, triangles, dim, minX, minY, invSize) {
        // look for a valid diagonal that divides the polygon into two
        var a = start;
        do {
            var b = a.next.next;
            while (b !== a.prev) {
                if (a.i !== b.i && isValidDiagonal(a, b)) {
                    // split the polygon in two by the diagonal
                    var c = splitPolygon(a, b);

                    // filter colinear points around the cuts
                    a = filterPoints(a, a.next);
                    c = filterPoints(c, c.next);

                    // run earcut on each half
                    earcutLinked(a, triangles, dim, minX, minY, invSize, 0);
                    earcutLinked(c, triangles, dim, minX, minY, invSize, 0);
                    return;
                }
                b = b.next;
            }
            a = a.next;
        } while (a !== start);
    }

    // link every hole into the outer loop, producing a single-ring polygon without holes
    function eliminateHoles(data, holeIndices, outerNode, dim) {
        var queue = [],
            i, len, start, end, list;

        for (i = 0, len = holeIndices.length; i < len; i++) {
            start = holeIndices[i] * dim;
            end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            list = linkedList(data, start, end, dim, false);
            if (list === list.next) list.steiner = true;
            queue.push(getLeftmost(list));
        }

        queue.sort(compareX);

        // process holes from left to right
        for (i = 0; i < queue.length; i++) {
            outerNode = eliminateHole(queue[i], outerNode);
        }

        return outerNode;
    }

    function compareX(a, b) {
        return a.x - b.x;
    }

    // find a bridge between vertices that connects hole with an outer ring and and link it
    function eliminateHole(hole, outerNode) {
        var bridge = findHoleBridge(hole, outerNode);
        if (!bridge) {
            return outerNode;
        }

        var bridgeReverse = splitPolygon(bridge, hole);

        // filter collinear points around the cuts
        filterPoints(bridgeReverse, bridgeReverse.next);
        return filterPoints(bridge, bridge.next);
    }

    // David Eberly's algorithm for finding a bridge between hole and outer polygon
    function findHoleBridge(hole, outerNode) {
        var p = outerNode,
            hx = hole.x,
            hy = hole.y,
            qx = -Infinity,
            m;

        // find a segment intersected by a ray from the hole's leftmost point to the left;
        // segment's endpoint with lesser x will be potential connection point
        do {
            if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
                var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
                if (x <= hx && x > qx) {
                    qx = x;
                    m = p.x < p.next.x ? p : p.next;
                    if (x === hx) return m; // hole touches outer segment; pick leftmost endpoint
                }
            }
            p = p.next;
        } while (p !== outerNode);

        if (!m) return null;

        // look for points inside the triangle of hole point, segment intersection and endpoint;
        // if there are no points found, we have a valid connection;
        // otherwise choose the point of the minimum angle with the ray as connection point

        var stop = m,
            mx = m.x,
            my = m.y,
            tanMin = Infinity,
            tan;

        p = m;

        do {
            if (hx >= p.x && p.x >= mx && hx !== p.x &&
                    pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

                tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

                if (locallyInside(p, hole) &&
                    (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) {
                    m = p;
                    tanMin = tan;
                }
            }

            p = p.next;
        } while (p !== stop);

        return m;
    }

    // whether sector in vertex m contains sector in vertex p in the same coordinates
    function sectorContainsSector(m, p) {
        return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
    }

    // interlink polygon nodes in z-order
    function indexCurve(start, minX, minY, invSize) {
        var p = start;
        do {
            if (p.z === 0) p.z = zOrder(p.x, p.y, minX, minY, invSize);
            p.prevZ = p.prev;
            p.nextZ = p.next;
            p = p.next;
        } while (p !== start);

        p.prevZ.nextZ = null;
        p.prevZ = null;

        sortLinked(p);
    }

    // Simon Tatham's linked list merge sort algorithm
    // http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
    function sortLinked(list) {
        var i, p, q, e, tail, numMerges, pSize, qSize,
            inSize = 1;

        do {
            p = list;
            list = null;
            tail = null;
            numMerges = 0;

            while (p) {
                numMerges++;
                q = p;
                pSize = 0;
                for (i = 0; i < inSize; i++) {
                    pSize++;
                    q = q.nextZ;
                    if (!q) break;
                }
                qSize = inSize;

                while (pSize > 0 || (qSize > 0 && q)) {

                    if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                        e = p;
                        p = p.nextZ;
                        pSize--;
                    } else {
                        e = q;
                        q = q.nextZ;
                        qSize--;
                    }

                    if (tail) tail.nextZ = e;
                    else list = e;

                    e.prevZ = tail;
                    tail = e;
                }

                p = q;
            }

            tail.nextZ = null;
            inSize *= 2;

        } while (numMerges > 1);

        return list;
    }

    // z-order of a point given coords and inverse of the longer side of data bbox
    function zOrder(x, y, minX, minY, invSize) {
        // coords are transformed into non-negative 15-bit integer range
        x = (x - minX) * invSize | 0;
        y = (y - minY) * invSize | 0;

        x = (x | (x << 8)) & 0x00FF00FF;
        x = (x | (x << 4)) & 0x0F0F0F0F;
        x = (x | (x << 2)) & 0x33333333;
        x = (x | (x << 1)) & 0x55555555;

        y = (y | (y << 8)) & 0x00FF00FF;
        y = (y | (y << 4)) & 0x0F0F0F0F;
        y = (y | (y << 2)) & 0x33333333;
        y = (y | (y << 1)) & 0x55555555;

        return x | (y << 1);
    }

    // find the leftmost node of a polygon ring
    function getLeftmost(start) {
        var p = start,
            leftmost = start;
        do {
            if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p;
            p = p.next;
        } while (p !== start);

        return leftmost;
    }

    // check if a point lies within a convex triangle
    function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
        return (cx - px) * (ay - py) >= (ax - px) * (cy - py) &&
               (ax - px) * (by - py) >= (bx - px) * (ay - py) &&
               (bx - px) * (cy - py) >= (cx - px) * (by - py);
    }

    // check if a diagonal between two polygon nodes is valid (lies in polygon interior)
    function isValidDiagonal(a, b) {
        return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && // dones't intersect other edges
               (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && // locally visible
                (area(a.prev, a, b.prev) || area(a, b.prev, b)) || // does not create opposite-facing sectors
                equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); // special zero-length case
    }

    // signed area of a triangle
    function area(p, q, r) {
        return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    }

    // check if two points are equal
    function equals(p1, p2) {
        return p1.x === p2.x && p1.y === p2.y;
    }

    // check if two segments intersect
    function intersects(p1, q1, p2, q2) {
        var o1 = sign(area(p1, q1, p2));
        var o2 = sign(area(p1, q1, q2));
        var o3 = sign(area(p2, q2, p1));
        var o4 = sign(area(p2, q2, q1));

        if (o1 !== o2 && o3 !== o4) return true; // general case

        if (o1 === 0 && onSegment(p1, p2, q1)) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
        if (o2 === 0 && onSegment(p1, q2, q1)) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
        if (o3 === 0 && onSegment(p2, p1, q2)) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
        if (o4 === 0 && onSegment(p2, q1, q2)) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

        return false;
    }

    // for collinear points p, q, r, check if point q lies on segment pr
    function onSegment(p, q, r) {
        return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    }

    function sign(num) {
        return num > 0 ? 1 : num < 0 ? -1 : 0;
    }

    // check if a polygon diagonal intersects any polygon segments
    function intersectsPolygon(a, b) {
        var p = a;
        do {
            if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                    intersects(p, p.next, a, b)) return true;
            p = p.next;
        } while (p !== a);

        return false;
    }

    // check if a polygon diagonal is locally inside the polygon
    function locallyInside(a, b) {
        return area(a.prev, a, a.next) < 0 ?
            area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
            area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
    }

    // check if the middle point of a polygon diagonal is inside the polygon
    function middleInside(a, b) {
        var p = a,
            inside = false,
            px = (a.x + b.x) / 2,
            py = (a.y + b.y) / 2;
        do {
            if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                    (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
                inside = !inside;
            p = p.next;
        } while (p !== a);

        return inside;
    }

    // link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
    // if one belongs to the outer ring and another to a hole, it merges it into a single ring
    function splitPolygon(a, b) {
        var a2 = new Node(a.i, a.x, a.y),
            b2 = new Node(b.i, b.x, b.y),
            an = a.next,
            bp = b.prev;

        a.next = b;
        b.prev = a;

        a2.next = an;
        an.prev = a2;

        b2.next = a2;
        a2.prev = b2;

        bp.next = b2;
        b2.prev = bp;

        return b2;
    }

    // create a node and optionally link it with previous one (in a circular doubly linked list)
    function insertNode(i, x, y, last) {
        var p = new Node(i, x, y);

        if (!last) {
            p.prev = p;
            p.next = p;

        } else {
            p.next = last.next;
            p.prev = last;
            last.next.prev = p;
            last.next = p;
        }
        return p;
    }

    function removeNode(p) {
        p.next.prev = p.prev;
        p.prev.next = p.next;

        if (p.prevZ) p.prevZ.nextZ = p.nextZ;
        if (p.nextZ) p.nextZ.prevZ = p.prevZ;
    }

    function Node(i, x, y) {
        // vertex index in coordinates array
        this.i = i;

        // vertex coordinates
        this.x = x;
        this.y = y;

        // previous and next vertex nodes in a polygon ring
        this.prev = null;
        this.next = null;

        // z-order curve value
        this.z = 0;

        // previous and next nodes in z-order
        this.prevZ = null;
        this.nextZ = null;

        // indicates whether this is a steiner point
        this.steiner = false;
    }

    // return a percentage difference between the polygon area and its triangulation area;
    // used to verify correctness of triangulation
    earcut.deviation = function (data, holeIndices, dim, triangles) {
        var hasHoles = holeIndices && holeIndices.length;
        var outerLen = hasHoles ? holeIndices[0] * dim : data.length;

        var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
        if (hasHoles) {
            for (var i = 0, len = holeIndices.length; i < len; i++) {
                var start = holeIndices[i] * dim;
                var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
                polygonArea -= Math.abs(signedArea(data, start, end, dim));
            }
        }

        var trianglesArea = 0;
        for (i = 0; i < triangles.length; i += 3) {
            var a = triangles[i] * dim;
            var b = triangles[i + 1] * dim;
            var c = triangles[i + 2] * dim;
            trianglesArea += Math.abs(
                (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
                (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
        }

        return polygonArea === 0 && trianglesArea === 0 ? 0 :
            Math.abs((trianglesArea - polygonArea) / polygonArea);
    };

    function signedArea(data, start, end, dim) {
        var sum = 0;
        for (var i = start, j = end - dim; i < end; i += dim) {
            sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
            j = i;
        }
        return sum;
    }

    // turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
    earcut.flatten = function (data) {
        var dim = data[0][0].length,
            result = {vertices: [], holes: [], dimensions: dim},
            holeIndex = 0;

        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].length; j++) {
                for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
            }
            if (i > 0) {
                holeIndex += data[i - 1].length;
                result.holes.push(holeIndex);
            }
        }
        return result;
    };

    var earcutExports = earcut$2.exports;
    var earcut$1 = /*@__PURE__*/getDefaultExportFromCjs(earcutExports);

    //执行earcut
    //paths:
    // [
    //    outline: [x1, y1, x2, y2,...],
    //     holes:  [x1, y1, x2, y2,...],
    //             [x1, y1, x2, y2,...],
    // ]
    function invokeEarcut(paths) {
        const rings = paths.map(openPath).filter(Boolean);
        if (!rings?.length)
            return null;
        const vertices = [...rings.flat()];
        let holesIndex;
        if (rings.length >= 2) {
            holesIndex = [];
            for (let i = 0, v = 0; i < rings.length; i++) {
                i > 0 && holesIndex.push(v);
                v += rings[i].length / 2;
            }
        }
        const indices = earcut$1(vertices, holesIndex, 2);
        const count = vertices.length / 2;
        return {
            vertexCount: count,
            vertices,
            indices,
        };
        //最后一个点和第一个相同, earcut不需要,
        function openPath(path) {
            const len = path.length;
            const p0x = path[0], p0y = path[1];
            const pnx = path[len - 2], pny = path[len - 1];
            if (p0x === pnx && p0y === pny) {
                return len <= 6 ? null : path.slice(0, len - 2);
            }
            else {
                return path;
            }
        }
    }
    //合并面mesh
    function mergePolygonMesh(meshes) {
        if (meshes.length <= 1)
            return meshes[0];
        let vertexCount = 0, indexCount = 0;
        for (let item of meshes) {
            vertexCount += item.vertices.length / 2;
            indexCount += item.indices.length;
        }
        const vertexArr = new Array(vertexCount * 2); //[x1,y1, x2,y2]
        const indexArr = new Array(indexCount);
        for (let index = 0, len = meshes.length, vertexCursor = 0, //顶点游标
        indexCursor = 0; //索引游标
         index < len; index++) {
            const { vertices, indices } = meshes[index];
            for (let i = 0, len = indices.length; i < len; i++) {
                indexArr[indexCursor] = vertexCursor + indices[i];
                indexCursor++;
            }
            for (let i = 0, len = vertices.length / 2; i < len; i++) {
                const i2 = i * 2;
                const c2 = vertexCursor * 2;
                vertexArr[c2] = vertices[i2];
                vertexArr[c2 + 1] = vertices[i2 + 1];
                vertexCursor++;
            }
        }
        return {
            vertexCount,
            vertices: vertexArr,
            indices: indexArr,
        };
    }
    //细分一个面
    function tessellatePolygon(polygon) {
        polygon.rings.map(closePolygonRings);
        let tessPolygon;
        if (polygon.isSelfIntersecting) {
            //自相交
            const simplified = geometryEngine_js.simplify(polygon); //简化
            tessPolygon = simplified.rings.map((ring) => [ring]);
        }
        else {
            tessPolygon = [polygon.rings];
        }
        const meshes = tessPolygon
            .map((polygonRings) => {
            const mesh = invokeEarcut(polygonRings.map((ring) => ring.flat()));
            if (!mesh?.vertices?.length || !mesh?.indices?.length)
                return null;
            return mesh;
        })
            .filter(Boolean);
        return mergePolygonMesh(meshes);
    }

    exports.calcCoordsExtent = calcCoordsExtent;
    exports.calcDataTexSize = calcDataTexSize;
    exports.calcExpandExtent = calcExpandExtent;
    exports.calcPointLikesExtent = calcPointLikesExtent;
    exports.calcTriangleExtent = calcTriangleExtent;
    exports.closePolygonRings = closePolygonRings;
    exports.doubleToTwoFloats = doubleToTwoFloats;
    exports.extentIntersection = extentIntersection;
    exports.findIntervalIndexThatValueIn = findIntervalIndexThatValueIn;
    exports.getTextureUnpackAlign = getTextureUnpackAlign;
    exports.invokeEarcut = invokeEarcut;
    exports.isExtentIntersect = isExtentIntersect;
    exports.mergePolygonMesh = mergePolygonMesh;
    exports.pointInExtent = pointInExtent;
    exports.pointInTriangle = pointInTriangle$1;
    exports.tessellatePolygon = tessellatePolygon;

}));
//# sourceMappingURL=polygon.js.map
