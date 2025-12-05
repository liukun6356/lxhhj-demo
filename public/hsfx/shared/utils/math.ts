export function componentMinMax(arr: ArrayLike<number>, stride: number, start: number, componentIndex: number) {
    let maxVal = -Infinity;
    let minVal = Infinity;
    for (
        let len = arr.length,
        cursor = start + componentIndex;
        cursor < len;
        cursor += stride
    ) {
        maxVal = Math.max(maxVal, arr[cursor]);
        minVal = Math.min(minVal, arr[cursor]);
    }
    return [minVal, maxVal];
}

export function max(arr: ArrayLike<number>) {
    if (!arr?.length) return undefined;
    let max = -Infinity;
    for (let i = arr.length; i--;) {
        max = Math.max(max, arr[i]);
    }
    return max;
}

export function min(arr: ArrayLike<number>) {
    if (!arr?.length) return undefined;
    let min = Infinity;
    for (let i = arr.length; i--;) {
        min = Math.min(min, arr[i]);
    }
    return min;
}
export function minmax(arr: ArrayLike<number>) {
    if (!arr?.length) return undefined;
    let max = -Infinity;
    let min = Infinity;
    for (let i = arr.length, v: number; i--;) {
        v = arr[i];
        min = Math.min(min, v);
        max = Math.max(max, v);
    }
    return [min, max];
}

export function lerp(a: number, b: number, t: number) {
    return (b - a) * t + a;
}

export function isPosInteger(v: any) {
    if (typeof v !== 'number') return false;
    if (isNaN(v)) return false;
    if (v <= 0 || v !== Math.floor(v)) return false;
    return true;
}

const f = Math.PI / 180;
export function toRadians(v: number) {
    return v * f;
}
export function modulo(a: number, b: number) {
    const r = a % b;
    return r * b < 0 ? r + b : r;
}


export function doubleToTwoFloat(value: number) {
    let high, low;
    if (value >= 0.0) {
        high = Math.floor(value / 65536.0) * 65536.0;
        low = value - high;
    } else {
        high = -Math.floor(-value / 65536.0) * 65536.0;
        low = value - high;
    }
    return [high, low];
}

//大于等于某个数的最小的2的幂
export function ceilPowerOfTwo(val: number) {
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

//查找单调递增数组中第一个>=target的数所在的索引
export function firstGreaterEqualThanValueIndex(ascArr: ArrayLike<number>, target: number) {
    let left = 0;
    let right = ascArr.length - 1;

    if (target <= ascArr[left]) return 0;
    if (target > ascArr[right]) return -1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const cur = ascArr[mid];
        if (cur === target) return mid;
        if (cur > target) {
            const before = ascArr[mid - 1];
            if (before < target) {
                return mid;
            } else if (before === target) {
                return mid - 1;
            } else {
                right = mid - 1;
            }
        } else {
            left = mid + 1;
        }
    }
    return -1;
}


//是否是逆时针
export function isCCW(p1: number[], p2: number[], p3: number[]) {
    const v1x = p2[0] - p1[0];
    const v1y = p2[1] - p1[1];
    const v2x = p3[0] - p2[0];
    const v2y = p3[1] - p2[1];
    return v1x * v2y - v2x * v1y > 0;
}
