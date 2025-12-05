import { assert, clamp, isNil } from "es-toolkit";

export function inRangeWrap<F extends (...args: any[]) => number>(fn: F, min = -Infinity, max = Infinity) {
    return (...args: Parameters<F>) => {
        return clamp(fn(...args), min, max);
    }
}

export function booleanCast(v: any) {
    if (isNil(v)) return v;
    return !!v;
}

export function numberCast(v: any) {
    if (isNil(v)) return v;
    assert(typeof v === 'number', `不是数字:${v}`);
    return v;
}

export function positiveNumberCast(v: any) {
    v = numberCast(v);
    assert(v > 0, `必须是正数:${v}`);
    return v;
}

export function valueRangeCast(v: any) {
    if (isNil(v)) return v;
    assert(Array.isArray(v), 'range必须是数组');
    assert(v.every(i => typeof i === 'number' && !isNaN(i) && isFinite(i)), 'valueRange每个成员必须是有效数字(不含NaN,Infinity)');
    assert(v[1] >= v[0], `range不满足max >= min, max:${v[1]}, min:${v[0]}`);
    return v;
}