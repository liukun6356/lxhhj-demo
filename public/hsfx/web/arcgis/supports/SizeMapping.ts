import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import { valueRangeCast } from "./cast";

export interface SizeMappingProperties {
    valueRange: number[],
    sizeRange: number[]
}

@subclass()
export class SizeMapping extends Accessor {
    @property({
        cast: valueRangeCast
    })
    valueRange: number[]

    @property({
        cast: valueRangeCast
    })
    sizeRange: number[]

    constructor(opts?: Partial<SizeMappingProperties>) {
        super();
        Object.assign(this, opts);
    }

    getData() {
        return {
            valueRange: this.valueRange,
            sizeRange: this.sizeRange,
        }
    }
}