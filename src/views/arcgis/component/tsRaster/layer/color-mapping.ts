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

//唯一值色带(例如土地分类)
export type UniqueValueColorMapping = {
    type: "unique-value";
    mapping: { value: number; color: string; enable?: boolean }[];
};
