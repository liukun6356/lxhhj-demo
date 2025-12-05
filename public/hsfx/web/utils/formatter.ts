import { isNil } from "es-toolkit";

export function toFixed(input: number | string, digits: number, emtpyStr = '') {
    if (isNil(input)) return emtpyStr;
    let num = Number(input);
    if (Number.isNaN(num)) throw new Error(`无效的数字输入:${input}`);

    // 验证小数位数  
    if (typeof digits !== 'number' || isNaN(digits) || digits < 0 || digits > 20) {
        throw new Error('Invalid digits: Must be a number between 0 and 20');
    }

    const sign = num < 0 ? '-' : '';
    num = Math.abs(num);
    const a = Math.round((num + Number.EPSILON) * Math.pow(10, digits));
    const b = Math.pow(10, digits)
    return sign + (a / b).toFixed(digits);
}
export function toFixed1(v: any) {
    return toFixed(v, 1);
}
export function toFixed2(v: any) {
    return toFixed(v, 2);
}
export function toFixed3(v: any) {
    return toFixed(v, 3);
}
