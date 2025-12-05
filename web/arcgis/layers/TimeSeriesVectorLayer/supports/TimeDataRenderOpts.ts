import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { ColorMappingCast, type ColorMappingProperties } from "web/arcgis/supports/colorMapping";
import { ColorMappingClassbreak, type ColorMappingLoaderClassbreak, createColorMappingLoaderClassbreak } from "web/arcgis/supports/colorMapping/classbreak";
import { type ColorMappingLoaderRamp, ColorMappingRamp, createColorMappingLoaderRamp } from "web/arcgis/supports/colorMapping/ramp";
import { TimeSeriesVectorLayerView } from "../layer";
import { randomUUID } from "web/utils/misc";
import { numberCast } from "web/arcgis/supports/cast";

export interface TimeDataRenderProperties {
    colorMapping: ColorMappingProperties,
    opacity: number,
    enable: boolean
}

@subclass()
export class TimeDataRenderOpts extends Accessor {
    @property({
        cast: ColorMappingCast
    })
    colorMapping: ColorMappingRamp | ColorMappingClassbreak;

    @property({ cast: numberCast })
    opacity: number = 1;

    @property()
    enable: boolean = true;

    constructor(opts: Partial<TimeDataRenderProperties>) {
        super();
        Object.assign(this, opts);
    }
}


export class TimeDataRenderOptsLoader {
    uuid = randomUUID();
    renderOpts: TimeDataRenderOpts;
    private _mapping: ColorMappingLoaderRamp | ColorMappingLoaderClassbreak;
    private _handles: IHandle[];
    constructor(opts: TimeDataRenderOpts, layerView: TimeSeriesVectorLayerView) {
        const { context: gl } = layerView;
        this.renderOpts = opts;
        const h1 = reactiveUtils.watch(
            () => opts.colorMapping,
            mapping => {
                this._mapping?.destroy();
                this._mapping = null;
                if (!mapping) return layerView.requestRender();
                this._mapping = mapping.type === 'ramp'
                    ? createColorMappingLoaderRamp(gl, mapping)
                    : createColorMappingLoaderClassbreak(gl, mapping);
                this._mapping.on('change', () => {
                    layerView.requestRender();
                });
            },
            { initial: true }
        );
        const h2 = reactiveUtils.watch(
            () => [opts.enable, opts.opacity],
            () => layerView.requestRender(),
            { initial: true }
        );
        this._handles = [h1, h2];
    }

    getData() {
        return {
            opacity: this.renderOpts.opacity ?? 1,
            enable: this.renderOpts.enable,
            mapping: this._mapping?.getData(),
        }
    }

    destroy(): void {
        this._handles.forEach(f => f.remove());
        this._mapping?.destroy();
        this._mapping = null;
    }
}
