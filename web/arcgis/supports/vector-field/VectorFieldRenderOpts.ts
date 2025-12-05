import Color from "@arcgis/core/Color";
import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { DefaultConfig } from "web/arcgis/config";
import { EventEmitter } from "web/utils/EventEmitter";
import { loadImage, randomUUID } from "web/utils/misc";
import { createTexture } from "web/utils/webgl/texture";
import { booleanCast, inRangeWrap, numberCast, positiveNumberCast, valueRangeCast } from "../cast";
import { ColorMappingCast, type ColorMappingProperties, } from "../colorMapping";
import { ColorMappingClassbreak, type ColorMappingLoaderClassbreak, createColorMappingLoaderClassbreak } from "../colorMapping/classbreak";
import { type ColorMappingLoaderRamp, ColorMappingRamp, createColorMappingLoaderRamp } from "../colorMapping/ramp";
import { SizeMapping, type SizeMappingProperties } from "../SizeMapping";

export interface VectorFieldRenderProperties {
    show: boolean,
    opacity: number;
    minShowFlow: number,
    colorMapping: ColorMappingProperties,
    flowRange: number[],
    sizeMapping: number[] | SizeMapping | Partial<SizeMappingProperties>,
    arrowImg: string | HTMLImageElement | HTMLCanvasElement,
    gap: number,
    enableColorMapping: boolean,
    enableSizeMapping: boolean,
    defaultColor: string | __esri.Color,
    defaultSize: number
}

const config = DefaultConfig.vectorField;
@subclass()
export class VectorFieldRenderOpts extends Accessor {
    @property({ cast: booleanCast })
    show: boolean = config.show; //是否显示场

    @property({ cast: numberCast })
    opacity: number = 1;

    @property({ cast: numberCast })
    minShowFlow: number = config.minShowFlow; //低于这个值不显示

    @property({ cast: valueRangeCast })
    flowRange: number[]; //size 和 color 的映射范围

    @property({ cast: ColorMappingCast })
    colorMapping:
        | ColorMappingRamp //valueRange 无效，取顶层valueRange
        | ColorMappingClassbreak

    @property({ cast: valueRangeCast })
    sizeMapping: number[]

    @property()
    arrowImg: VectorFieldRenderProperties['arrowImg'] = config.arrowImg; //箭头图片, alpha通道用于颜色映射

    @property({ cast: inRangeWrap(positiveNumberCast, 10) })
    gap: number = config.gap; //箭头间隔

    @property({ cast: booleanCast })
    enableColorMapping: boolean = config.enableColorMapping; //是否启用颜色映射， 不开启则是默认颜色或者图片原色

    @property({ cast: booleanCast })
    enableSizeMapping: boolean = config.enableSizeMapping; //是否启用大小映射， 不开启则是默认大小

    // 箭头默认颜色, enableArrowColorMapping = false 时生效, 
    // 如果未指定, 使用 arrowImg 图片自身颜色
    @property({ type: Color })
    defaultColor: __esri.Color = Color.fromString(config.defaultColor);

    @property({ cast: inRangeWrap(positiveNumberCast, 5) })
    defaultSize: number = config.defaultSize

    constructor(opts?: Partial<VectorFieldRenderProperties>) {
        super();
        Object.assign(this, opts);
    }
}
export class VectorFieldRenderOptsLoader extends EventEmitter<{
    change: void
}> {
    uuid = randomUUID();
    renderOpts: VectorFieldRenderOpts;
    private _arrowTexture: WebGLTexture;
    private _arrowAspect: number;
    private _mapping: ColorMappingLoaderRamp | ColorMappingLoaderClassbreak;
    private _handles: IHandle[];
    constructor(opts: VectorFieldRenderOpts, gl: WebGL2RenderingContext) {
        super();
        this.renderOpts = opts;
        const h1 = reactiveUtils.watch(
            () => opts.colorMapping,
            mapping => {
                this._mapping?.destroy();
                this._mapping = null;
                if (!mapping) return this.emit('change');
                this._mapping = mapping.type === 'ramp'
                    ? createColorMappingLoaderRamp(gl, mapping)
                    : createColorMappingLoaderClassbreak(gl, mapping);
                this._mapping.on('change', () => this.emit('change'));
            },
            { initial: true }
        );
        const h2 = reactiveUtils.watch(
            () => opts.arrowImg,
            imgSrc => {
                if (!imgSrc) {
                    this._arrowTexture && gl.deleteTexture(this._arrowTexture);
                    this._arrowTexture = null;
                    this._arrowAspect = 1;
                    return this.emit('change');
                }
                (typeof imgSrc === 'string'
                    ? loadImage(imgSrc)
                    : Promise.resolve(imgSrc)
                ).then(image => {
                    if (imgSrc !== opts.arrowImg) return;
                    this._arrowTexture && gl.deleteTexture(this._arrowTexture);
                    this._arrowTexture = createTexture(gl, {
                        src: image,
                        minFilter: gl.LINEAR_MIPMAP_NEAREST,
                        magFilter: gl.LINEAR,
                        unpackAlign: 4,
                        wrapS: gl.CLAMP_TO_EDGE,
                        wrapT: gl.CLAMP_TO_EDGE,
                        premultiplyAlpha: false,
                        flipY: false,
                        genMipMap: true,
                    });
                    this._arrowTexture._msg = 'arrowImg';
                    this._arrowAspect = 'naturalWidth' in image
                        ? image.naturalWidth / image.naturalHeight
                        : image.width / image.height;
                    this.emit('change');
                })
            },
            { initial: true }
        );
        const h3 = reactiveUtils.watch(
            () => [
                opts.show,
                opts.opacity,
                opts.flowRange,
                opts.enableColorMapping,
                opts.enableSizeMapping,
                opts.sizeMapping,
                opts.defaultColor,
                opts.defaultSize,
                opts.gap,
            ],
            () => this.emit('change'),
        );
        this._handles = [h1, h2, h3];
    }

    getData() {
        const opts = this.renderOpts;
        const colorMapping = (opts.enableColorMapping ?? config.enableColorMapping)
            ? this._mapping?.getData()
            : null;
        return {
            show: opts.show ?? config.show,
            opacity: opts.opacity ?? 1,
            minShowFlow: opts.minShowFlow ?? config.minShowFlow,
            flowRange: opts.flowRange,
            enableColorMapping: opts.enableColorMapping ?? config.enableColorMapping,
            enableSizeMapping: opts.enableSizeMapping ?? config.enableSizeMapping,
            arrowTexture: this._arrowTexture,
            arrowAspect: this._arrowAspect,
            colorMapping,
            sizeMapping: opts.sizeMapping,
            gap: opts.gap ?? config.gap,
            defaultColor: opts.defaultColor ?? Color.fromString(config.defaultColor),
            defaultSize: opts.defaultSize ?? config.defaultSize,
        }
    }

    destroy(): void {
        this._handles.forEach(f => f.remove());
        this._mapping?.destroy();
        this._mapping = null;
    }
}
