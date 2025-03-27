import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import { PartialOptional } from "./global";
import { ClassBreakColorMapping, GradientColorMapping } from "./color-mapping";

export type VectorFieldRenderOptsProperties = Partial<{
    valueRange: number[];
    colorMapping: VectorFieldRenderOpts["colorMapping"];
    background: boolean;
    arrowImg: string;
    showArrow: boolean;
    gap: number;
    enableArrowColorMapping: boolean;
    arrowDefaultColor: string;
    arrowSize: VectorFieldRenderOpts["arrowSize"];
}> & { type: "vector-field" };

@subclass()
export class VectorFieldRenderOpts extends Accessor {
    type = "vector-field" as const;

    constructor(props?: Omit<VectorFieldRenderOptsProperties, "type">) {
        super();
        Object.assign(this, props, { type: "vector-field" });
    }

    @property()
    valueRange: number[]; //用于映射的矢量模的值域, 各类mapping.valueRange未指定时的回退值

    @property()
    colorMapping: PartialOptional<GradientColorMapping, "valueRange"> | ClassBreakColorMapping; //颜色映射

    @property()
    background: boolean = false; //是否显示背景, colorMapping存在时候才生效

    @property()
    backgroundAlpha: number = 1; //背景的透明度

    @property()
    arrowImg: string; //箭头图片, alpha通道用于颜色映射

    @property()
    showArrow: boolean = true; //是否显示箭头

    @property()
    gap: number = 40; //箭头间隔

    @property()
    enableArrowColorMapping: boolean = true; //是否启用颜色映射

    @property()
    arrowDefaultColor: string; //箭头默认颜色, enableArrowColorMapping = false 时生效, 如果未指定, 使用 arrowImg 图片自身颜色

    @property()
    arrowSize: //箭头大小, 最低10
        | number
        | number[]
        | {
        valueRange?: number[];
        sizeRange: number[];
    } = [20, 40];
}
