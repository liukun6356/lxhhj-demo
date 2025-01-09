import Color from "@arcgis/core/Color";

//间断色带(例如降雨)
export type ClassBreakColorMapping = {
    type: "class-break";
    truncHead?: boolean; //截断头部, 若截断, 小于第一个min的值 会变为透明色, 默认false
    truncTail?: boolean; //截断尾部, 若截断, 大于最后一个max的值 会变为透明色, 默认false
    breaks: /*
        所有颜色均匀分配[min,max]区间
        { min:0, max:1, colors:[red,green,blue] }
        等价于 =>
        { min:0, max: 1/3, color: red},
        { min:1/3, max: 2/3, color: green},
        { min:2/3, max: 1, color: blue},
    */
    | {
              min: number;
              max: number;
              colors: string[];
          }
        | { min: number; max: number; color: string }[];
};

const LEFT_SHIFT_8 = 2 ** 8;
const LEFT_SHIFT_16 = 2 ** 16;
export function formatClassBreaks(opts: ClassBreakColorMapping["breaks"]) {
    if (!Array.isArray(opts)) {
        const { min, max, colors } = opts;
        const count = colors.length;
        const interval = (max - min) / count;
        return new Array(count).fill(0).map((_, index) => {
            const _min = min + index * interval;
            return {
                min: _min,
                max: _min + interval,
                color: colors[index],
            };
        });
    } else {
        return opts;
    }
}
/**
 * 将间断色带信息编码到 浮点纹理中(RGBA格式)
 * tex.r = min
 * tex.g = max
 * tex.b = pack(color.rgb)
 * tex.a = color.a
 */
export function createClassBreakColorMappingBuffer(opts: ClassBreakColorMapping["breaks"]) {
    if (!opts) return null;
    const breaks = formatClassBreaks(opts);
    const length = breaks.length;
    if (!length) throw new Error("breaks不能为空");
    const data = new Float32Array(length * 4);
    let lastMax: number;
    for (let i = 0; i < length; i++) {
        const item = breaks[i];
        if (lastMax !== undefined) {
            if (item.min < lastMax) {
                throw new Error("classbreak参数错误, 必须是严格地增");
            }
        }
        const color = item.color;
        if (!color) throw new Error("classbreak参数错误, color不存在");
        const { r, g, b, a } = new Color(color); //rgb[0-255], a[0-1]
        const cursor = i * 4;
        data[cursor] = item.min;
        data[cursor + 1] = item.max;
        data[cursor + 2] = r * LEFT_SHIFT_16 + g * LEFT_SHIFT_8 + b;
        data[cursor + 3] = a;

        lastMax = item.max;
    }
    return {
        data,
        height: 1,
        width: breaks.length,
        min: breaks[0].min,
        max: breaks.slice(-1)[0].max,
    };
}

//唯一值色带(例如土地分类)
export type UniqueValueColorMapping = {
    type: "unique-value";
    mapping: { value: number; color: string; enable?: boolean }[];
};
/**
 * 将唯一值信息编码到颜色纹理中(RGBA格式)
 * tex.r = r
 * tex.g = g
 * tex.b = b
 * tex.a = 是否可见
 */
export function createUniqueValueColorMappingBuffer(opts: { color: string; enable: boolean }[]) {
    if (!opts) return null;
    const length = opts.length;
    if (!length) return null;
    const data = new Uint8ClampedArray(length * 4);
    for (let i = 0; i < length; i++) {
        const { color, enable } = opts[i];
        const { r, g, b } = new Color(color);
        const cursor = i * 4;
        data[cursor] = r;
        data[cursor + 1] = g;
        data[cursor + 2] = b;
        data[cursor + 3] = enable ? 255 : 0;
    }
    return {
        data,
        height: 1,
        width: length,
    };
}

//渐变色带, 范围是 左0 -> 右1
export type GradientColorMapping = {
    type: "gradient";
    valueRange: number[];
    truncHead?: boolean; //截断头部, 若截断, 小于min的值 会变为透明色, 默认false
    truncTail?: boolean; //截断尾部, 若截断, 大于max的值 会变为透明色, 默认false
    stops: /* 自定义图片url */
    | string
        /*
        颜色数组, 平分0-1区间
        [red,green,blue]
        等价于=>
        {value:1/4, color:red},
        {value:2/4, color:green},
        {value:3/4, color:blue},
    */
        | string[]
        /*  CanvasGradient.addColorStop 参数 */
        | { value: number; color: string }[];
};

const __tool = /*#__PURE__*/ (() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    return { canvas, ctx };
})();
type Stop = { value: number; color: string };

//创建连续色带输出
export function createGradientColorMappingFromStops(
    stopDef: string[] | Stop[],
    width: number,
    height: number,
    outputType: "base64"
): string;
export function createGradientColorMappingFromStops(
    stopDef: string[] | Stop[],
    width: number,
    height: number,
    outputType: "imagedata"
): ImageData;
export function createGradientColorMappingFromStops(
    stopDef: string[] | Stop[],
    width: number,
    height: number,
    outputType: "canvas"
): HTMLCanvasElement;
export function createGradientColorMappingFromStops(
    stopDef: string[] | Stop[],
    width: number,
    height: number,
    outputType: "base64" | "imagedata" | "canvas"
) {
    const { canvas, ctx } = __tool;
    canvas.height = Math.floor(height ?? 1);
    canvas.width = Math.floor(width ?? 128);

    let stops: Stop[];
    if (typeof stopDef[0] === "string") {
        const length = stopDef.length + 1;
        stops = new Array(stopDef.length).fill(0).map((_, index) => {
            return {
                value: (index + 1) / length,
                color: stopDef[index] as string,
            };
        });
    } else {
        stops = ([...stopDef] as Stop[]).sort((a, b) => a.value - b.value);
    }

    if (!stops.length) throw new Error("GradientColorRamp参数错误");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    for (let { value, color } of stops) {
        gradient.addColorStop(value, color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const type = outputType ?? "base64";
    if (type === "base64") {
        return canvas.toDataURL("png");
    } else if (type === "imagedata") {
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        const canvasCopy = document.createElement("canvas");
        canvasCopy.width = canvas.width;
        canvasCopy.height = canvas.height;
        canvasCopy.getContext("2d").drawImage(canvas, 0, 0);
        return canvasCopy;
    }
}
