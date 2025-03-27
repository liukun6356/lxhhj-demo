import Accessor from "@arcgis/core/core/Accessor";
import {property, subclass} from "@arcgis/core/core/accessorSupport/decorators";
import type {Constructor, TypedArray} from "./global";
import {ClassBreakColorMapping, GradientColorMapping, UniqueValueColorMapping} from "./color-mapping";
import {checkTimes, createNamespaceError} from "./common";
import { RasterTimeData, TimeSeriesRasterSource } from "./types";
import { getChildrenTiles, getTileId } from "./tile";

//递增数组的diff
export function diffAscArrays(arr1: number[], arr2: number[]) {
    let i = 0;
    let j = 0;

    const only1 = [] as number[];
    const both = [] as number[];
    const only2 = [] as number[];

    while (i < arr1.length && j < arr2.length) {
        if (arr1[i] < arr2[j]) {
            only1.push(arr1[i]);
            i++;
        } else if (arr1[i] > arr2[j]) {
            only2.push(arr2[j]);
            j++;
        } else {
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
 * 查找值所在区间索引
 * [1.1, 2.2, 3.5, 4.0]  2.5所在区间索引为[1,2], 4所在区间索引为[2,3]
 *   0    1    2    3
 * @param ascArr 升序数组
 * @param value 要查找的数
 */
export function findIntervalIndexThatValueIn(ascArr: number[], value: number) {
    let afterIndex = findFirstGreaterThan(ascArr, value);
    if (afterIndex === -1) afterIndex = ascArr.length - 1;
    const beforeIndex = Math.max(0, afterIndex - 1);
    return [beforeIndex, afterIndex];
}

//查找第一个大于target的数的索引
function findFirstGreaterThan(ascArr: number[], target: number) {
    let left = 0;
    let right = ascArr.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (ascArr[mid] > target) {
            if (mid === 0 || ascArr[mid - 1] <= target) {
                return mid;
            } else {
                right = mid - 1;
            }
        } else {
            left = mid + 1;
        }
    }

    return -1; // 如果没有找到符合条件的数，则返回 -1
}

export function rafThrottle<F extends (...args: any[]) => any>(callback: F) {
    let requestId = null as number;
    let lastArgs: Parameters<F>;
    const later = (context: any) => () => {
        requestId = null;
        callback.apply(context, lastArgs);
    };

    const throttled = function (this: any, ...args: Parameters<F>) {
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

//webgl 纹理解包值
export function getTextureUnpackAlign(textureWidth: number) {
    return !(textureWidth & 0b111) ? 8 : !(textureWidth & 0b11) ? 4 : !(textureWidth & 0b1) ? 2 : 1;
}

export type TaskId = number | string;

/**
 * 提取单通道栅格数据子区域
 * @param data 原始数据
 * @param dataSize 原始尺寸[宽,高]
 * @param subExtent 要提取的子区域范围
 * @param subExtent.sx 子区域范围左上角x
 * @param subExtent.sy 子区域范围左上角y
 * @param subExtent.width 子区域范围宽度
 * @param subExtent.height 子区域范围高度
 * @param noDataValue 无效值
 */
export function extractSubRegion<T extends TypedArray | Array<number>>(
    data: T,
    dataSize: number[],
    subExtent: { sx: number; sy: number; width: number; height: number },
    noDataValue: number,
    outputArrayType?: Constructor<TypedArray>
) {
    const {sx, sy, width, height} = subExtent;
    const result = {
        hasData: false,
        pixel: new (outputArrayType || (data.constructor as Constructor<T>) || Array)(width * height),
        min: Infinity,
        max: -Infinity,
    };
    for (
        let colmin = sx,
            colmax = sx + width - 1,
            col = dataSize[0],
            cursor = width * height,
            sourceBuffer = data,
            i = colmax,
            j = sy + height - 1,
            output = result;
        cursor--;
    ) {
        const dataIndex = i + j * col;
        const v = (output.pixel[cursor] = sourceBuffer[dataIndex]);
        if (v !== noDataValue) {
            output.hasData = true;
            output.min = Math.min(output.min, v);
            output.max = Math.max(output.max, v);
        }
        i--;
        if (i < colmin) {
            i = colmax;
            j--;
        }
    }
    return result.hasData ? result : null;
}

/**
 * 提取矢量场栅格数据子区域, (noDataValue需要预先处理并转为0)
 * @param data 原始数据
 * @param dataSize 原始尺寸[宽,高]
 * @param subExtent 要提取的子区域范围
 * @param subExtent.sx 子区域范围左上角x
 * @param subExtent.sy 子区域范围左上角y
 * @param subExtent.width 子区域范围宽度
 * @param subExtent.height 子区域范围高度
 */
export function extractVectorFieldSubRegion<T extends TypedArray | Array<number>>(
    data: T,
    dataSize: number[],
    subExtent: { sx: number; sy: number; width: number; height: number },
    outputArrayType?: Constructor<TypedArray>
) {
    const {sx, sy, width, height} = subExtent;
    const result = {
        hasData: false,
        pixel: new (outputArrayType || (data.constructor as Constructor<T>) || Array)(width * height * 2),
        umin: Infinity,
        umax: -Infinity,
        vmin: Infinity,
        vmax: -Infinity,
    };
    for (
        let colmin = sx,
            colmax = sx + width - 1,
            col = dataSize[0],
            pixelCursor = width * height,
            sourceBuffer = data,
            i = colmax,
            j = sy + height - 1,
            output = result;
        pixelCursor--;
    ) {
        const dataIndex = (i + j * col) * 2;
        const outputIndex = pixelCursor * 2;
        const u = (output.pixel[outputIndex] = sourceBuffer[dataIndex]);
        const v = (output.pixel[outputIndex + 1] = sourceBuffer[dataIndex + 1]);
        output.hasData = output.hasData || !!u || !!v;
        output.umin = Math.min(output.umin, u);
        output.umax = Math.max(output.umax, u);
        output.vmin = Math.min(output.vmin, v);
        output.vmax = Math.max(output.vmax, v);
        i--;
        if (i < colmin) {
            i = colmax;
            j--;
        }
    }
    if (result.hasData && result.umin === result.umax) {
        debugger
    }
    return result.hasData ? result : null;
}

@subclass()
export class RasterSimpleRenderOpts extends Accessor {
    type = "simple" as const;

    @property()
    renderSampling: "nearest" | "linear" = "linear"; //渲染采样方式

    @property()
    colorMapping: GradientColorMapping | UniqueValueColorMapping | ClassBreakColorMapping;
}

export const TsRasterError = /*#__PURE__*/ createNamespaceError("TimeSeriesRasterLayer");

//检查数据源
export function checkRasterSource(source: TimeSeriesRasterSource) {
    const {times, timeIndex, minTime, maxTime, isSingle} = checkTimes(source.times);
    const {dataGetter, row, col, crs, extent, type} = source;
    const components = type === "vector-field" ? 2 : 1;
    if (!row || !col || !Number.isInteger(row) || !Number.isInteger(col))
        throw TsRasterError("source.col 和 source.row 必须是正整数");
    if (!crs) throw TsRasterError("source.crs不能为空");
    if (!extent) throw TsRasterError("source.extent不能为空");
    if (!(dataGetter instanceof Function)) throw TsRasterError("source.dataGetter必须是函数");
    const dataLength = row * col * components;
    const wrapGetter = (time: number) => {
        return new Promise<RasterTimeData>((resolve, reject) => {
            let taskPromise: Promise<RasterTimeData>;
            try {
                const getterResult = dataGetter(time, timeIndex.get(time));
                if (!(getterResult instanceof Promise)) {
                    taskPromise = Promise.resolve(getterResult);
                } else {
                    taskPromise = getterResult;
                }
                taskPromise.then((bufferData) => {
                    if (bufferData.length !== dataLength) throw TsRasterError(`返回数据长度与source定义不匹配!`);
                    resolve(bufferData);
                });
            } catch (e) {
                reject(e);
            }
        });
    };
    return {
        ...source,
        dataGetter: wrapGetter,
        times,
        minTime,
        maxTime,
        isSingle,
    };
}

type BoundsMap = ReturnType<typeof createTileBoundMap>;

//瓦片范围索引
export function createTileBoundMap(baseLevel: number, baseLevelBounds: number[], maxLevel: number) {
    const map = {} as Record<number,
        {
            bounds: number[]; //[colmin, colmax, rowmin, rowmax]
            count: number;
        }>;
    map[baseLevel] = {
        bounds: baseLevelBounds,
        count: 0,
    };
    for (let z = baseLevel - 1; z > 0; z--) {
        map[z] = {
            bounds: map[z + 1].bounds.map((i) => Math.floor(i / 2)),
            count: NaN,
        };
    }
    for (let z = baseLevel + 1; z <= maxLevel; z++) {
        const [colmin, colmax, rowmin, rowmax] = map[z - 1].bounds;
        map[z] = {
            bounds: [colmin * 2, colmax * 2 + 1, rowmin * 2, rowmax * 2 + 1],
            count: NaN,
        };
    }
    for (let z = 1; z <= maxLevel; z++) {
        const [a, b, c, d] = map[z].bounds;
        map[z].count = (b - a + 1) * (d - c + 1);
    }
    return map;
}

//创建等级权重表
export function createTileWeightMap(baseLevel: number, minLevel: number) {
    const weightMap = {
        [baseLevel]: 1,
    } as Record<number, number>;
    for (let level = baseLevel - 1; level >= minLevel; level--) {
        weightMap[level] = weightMap[level + 1] * 4;
    }
    return weightMap;
}

export function findMinLevel(boundMap: BoundsMap, baseLevel: number) {
    for (let z = baseLevel - 1; z > 0; z--) {
        if (boundMap[z].count <= 4 || z === 1) {
            return z;
        }
    }
}


//解析范围内的空tile
export function resolveEmptyTileIdInBounds(opts: {
    baseLevel: number;
    baseTileIdSet: Set<string>;
    minLevel: number;
    boundsMap: BoundsMap;
}) {
    const emptySet = new Set<string>();
    const { baseLevel, baseTileIdSet, minLevel, boundsMap: boundMap } = opts;
    if (baseLevel === minLevel) {
        const [xmin, xmax, ymin, ymax] = boundMap[baseLevel].bounds;
        for (let i = xmin; i <= xmax; i++) {
            for (let j = ymin; j <= ymax; j++) {
                const id = getTileId(baseLevel, i, j);
                if (!baseTileIdSet.has(id)) {
                    emptySet.add(id);
                }
            }
        }
        return emptySet;
    }
    //从金字塔顶端向下(minLevel -> baseLevel) 顶端tile包含的范围最大
    const tilesMap = {} as Record<number, { z: number; x: number; y: number; id: string }[]>;
    for (let level = minLevel; level <= baseLevel; level++) {
        const tiles = [] as { z: number; x: number; y: number; id: string }[];
        tilesMap[level] = tiles;
        if (level === minLevel) {
            const [xmin, xmax, ymin, ymax] = boundMap[level].bounds;
            for (let i = xmin; i <= xmax; i++) {
                for (let j = ymin; j <= ymax; j++) {
                    tiles.push({ z: level, x: i, y: j, id: getTileId(level, i, j) });
                }
            }
        } else {
            const parents = tilesMap[level - 1];
            for (let { z, x, y } of parents)
                tiles.push(
                    ...(getChildrenTiles(z, x, y) as any[]).map((i) => {
                        i.id = getTileId(i.z, i.x, i.y);
                        return i;
                    })
                );
        }
    }
    //从下往上确定空tile,
    for (let { id } of tilesMap[baseLevel]) {
        if (!baseTileIdSet.has(id)) {
            emptySet.add(id);
        }
    }
    //一个空tile的4个子tile也都是空
    for (let level = baseLevel - 1; level >= minLevel; level--) {
        for (let { z, x, y, id } of tilesMap[level]) {
            const childrens = getChildrenTiles(z, x, y);
            const isEmpty = childrens.every((child) => emptySet.has(getTileId(child.z, child.x, child.y)));
            if (isEmpty) {
                emptySet.add(id);
            }
        }
    }
    return emptySet;
}

/**
 * 延迟批处理队列
 * @param flush 清理时回调
 * @param addFn 是否应该添加到队列
 * @param delayType 延时函数, 默认promise
 * @param timeout 延迟时间, delayType = "settimeout" 有效
 * @returns
 */
export function flushQueue<T = any>(
    flush: (items: T[]) => void,
    addFn?: (item: T, curs: readonly T[]) => boolean,
    delayType = "promise" as "promise" | "settimeout",
    timeout?: number
) {
    let flushing = false;
    const list = [] as T[];
    const delayFn =
        delayType === "promise"
            ? (cb: typeof flush) => {
                Promise.resolve().then(() => {
                    const copy = [...list];
                    list.length = 0;
                    try {
                        cb(copy);
                    } finally {
                        flushing = false;
                    }
                });
            }
            : (cb: typeof flush) => {
                setTimeout(() => {
                    const copy = [...list];
                    list.length = 0;
                    try {
                        cb(copy);
                    } finally {
                        flushing = false;
                    }
                }, timeout ?? 4);
            };
    return (addObj: T) => {
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

export function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve) => {
        const image = new Image();
        image.src = src;
        image.onload = () => resolve(image);
    });
}
