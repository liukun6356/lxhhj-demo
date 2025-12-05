import Color from "@arcgis/core/Color";
import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { ColorMappingCast,type ColorMappingProperties } from "web/arcgis/supports/colorMapping";
import { ColorMappingClassbreak,type ColorMappingLoaderClassbreak, createColorMappingLoaderClassbreak } from "web/arcgis/supports/colorMapping/classbreak";
import { type ColorMappingLoaderRamp, ColorMappingRamp, createColorMappingLoaderRamp } from "web/arcgis/supports/colorMapping/ramp";
import { TimeSeriesVectorLayerView } from "../layer";
import { randomUUID } from "web/utils/misc";
export interface MeshRenderProperties {
    zColorMapping: ColorMappingProperties,
    renderZ: boolean,
    showMeshLine: boolean,
    meshLineColor: __esri.Color | string;
}

@subclass()
export class MeshRenderOpts extends Accessor {
    @property({
        cast: ColorMappingCast
    })
    zColorMapping: ColorMappingRamp | ColorMappingClassbreak;

    @property()
    renderZ: boolean = true;

    @property()
    showMeshLine: boolean = false;

    @property({
        type: Color
    })
    meshLineColor: __esri.Color = Color.fromString('black');

    constructor(opts: Partial<MeshRenderProperties>) {
        super();
        Object.assign(this, opts);
    }
}

export class MeshRenderOptsLoader {
    uuid = randomUUID();
    renderOpts: MeshRenderOpts;
    private _mapping: ColorMappingLoaderRamp | ColorMappingLoaderClassbreak;
    private _handles: IHandle[];
    constructor(opts: MeshRenderOpts, layerView: TimeSeriesVectorLayerView) {
        const { context: gl } = layerView;
        this.renderOpts = opts;
        const h1 = reactiveUtils.watch(
            () => opts.zColorMapping,
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
        let last: { show: boolean, color: __esri.Color };
        const h2 = reactiveUtils.watch(
            () => [opts.showMeshLine, opts.meshLineColor] as const,
            ([show, color]) => {
                const change = !last || show !== last.show || color !== last.color;
                if (!change) return;
                layerView.requestRender();
            },
            { initial: true }
        );
        const h3 = reactiveUtils.watch(
            () => opts.renderZ,
            () => layerView.requestRender(),
            { initial: true }
        );
        this._handles = [h1, h2, h3];
    }

    getData() {
        return {
            enable: this.renderOpts.renderZ,
            mapping: this._mapping?.getData(),
            showMeshLine: this.renderOpts.showMeshLine ?? false,
            meshLineColor: this.renderOpts.meshLineColor,
        }
    }

    destroy(): void {
        this.renderOpts.destroy();
        this._handles.forEach(f => f.remove());
        this._mapping?.destroy();
        this._mapping = null;
    }
}