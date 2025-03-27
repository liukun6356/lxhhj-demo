export function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve) => {
        const image = new Image();
        image.src = src;
        image.onload = () => resolve(image);
    });
}

//webgl 纹理解包值
export function getTextureUnpackAlign(textureWidth: number) {
    return !(textureWidth & 0b111) ? 8 : !(textureWidth & 0b11) ? 4 : !(textureWidth & 0b1) ? 2 : 1;
}

//大于等于某个数的最小的2的幂
export function ceilPowerOfTwo(val: number) {
    val = +val;
    if (isNaN(val)) throw new Error("不是数字");
    if (val & (val - 1)) {
        val |= val >> 1;
        val |= val >> 2;
        val |= val >> 4;
        val |= val >> 8;
        val |= val >> 16;
        return val + 1;
    } else {
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
export function calcDataTexSize(pixelCount: number) {
    if (!pixelCount) throw new Error("长度不存在!");
    const length = ceilPowerOfTwo(pixelCount);
    const l = Math.log2(length);
    const cols = Math.ceil(l / 2);
    const rows = l - cols;
    return [2 ** cols, 2 ** rows];
}

//float64 转 2个 float32
export function doubleToTwoFloats(value: number) {
    let high, low, tempHigh;
    if (value >= 0) {
        if (value < 65536) return [0, value];
        tempHigh = Math.floor(value / 65536) * 65536;
        high = tempHigh;
        low = value - tempHigh;
    } else {
        if (value > -65536) return [0, value];
        tempHigh = Math.floor(-value / 65536) * 65536;
        high = -tempHigh;
        low = value + tempHigh;
    }
    return [high, low];
}

export function sleep(t: number) {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), t);
    });
}

//二分法
export function binarySearch(ascArr: number[], target: number) {
    let left = 0;
    let right = ascArr.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (ascArr[mid] === target) {
            return mid;
        } else if (ascArr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
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

export async function retryCall<T>(
    fn: (...args: any[]) => Promise<T>, //待执行函数
    maxAttempts = 3, //最大重试次数
    delay = 500, //重试间隔
    timeout = 30000 //超时时间
) {
    let attemp = 0;
    while (attemp < maxAttempts) {
        try {
            const result = await Promise.race([timeoutPromise(timeout), fn()]);
            return result;
        } catch (e) {
            attemp++;
            if (attemp === maxAttempts) throw e;
            await sleep(delay);
        }
    }

    function timeoutPromise(t: number) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject("超时");
            }, t);
        });
    }
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

export const nextTick = /*#__PURE__*/ (() => {
    const callbacks = [] as (() => void)[];
    let pending = false;
    function flushCallbacks() {
        pending = false;
        const copies = callbacks.slice(0);
        callbacks.length = 0;
        for (var i = 0; i < copies.length; i++) {
            copies[i]();
        }
    }
    return function <T = any>(cb?: (this: T) => void, ctx?: T) {
        let _resolve: (ctx: T) => void;
        callbacks.push(() => {
            if (cb) {
                cb.call(ctx);
            } else {
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

