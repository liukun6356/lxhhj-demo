import Color from "@arcgis/core/Color";
import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { assert } from "es-toolkit";
import { lerp } from "shared/utils/math";
import { DefaultConfig } from "web/arcgis/config";
import { EventEmitter } from "web/utils/EventEmitter";
import { loadImage } from "web/utils/misc";
import { createTexture } from "web/utils/webgl/texture";
import { booleanCast, valueRangeCast } from "../cast";
import { COLOR_MAPPING_TEXTURE_WIDTH } from "../constant";

//连续色带，渐变色
export type ColorStop = { value: number; color: string };

export type Stops = string //img url
    | string[] // color数组 均分0-1范围
    | ColorStop[]; //同canvas gradient

export interface ColorMappingRampProperties {
    type: 'ramp',
    stops: Stops,
    valueRange: number[],
    clampHead: boolean;
    clampTail: boolean;
    headColor: Color | string;
    tailColor: Color | string;
}


function formatStops(colorStops: string[] | ColorStop[]) {
    let stops: ColorStop[];
    if (typeof colorStops[0] === "string") {
        const interval = colorStops.length - 1;
        stops = new Array(colorStops.length).fill(0).map((_, index) => {
            return {
                value: index / interval,
                color: colorStops[index] as string,
            };
        });
    } else {
        stops = (colorStops as ColorStop[]).toSorted((a, b) => a.value - b.value);
    }
    assert(stops.length >= 2 && stops.length <= COLOR_MAPPING_TEXTURE_WIDTH, 'ColorRamp 最少2个颜色, 最多256个颜色');
    const invalid = stops.find(i => i.value < 0 && i.value > 1);
    assert(!invalid, `ColorRamp stop.value: ${invalid?.value}, 不满足 [0, 1]`);
    return stops;
}

let canvas: OffscreenCanvas;
export function buildRampImage(stops: string[] | ColorStop[]) {
    stops = formatStops(stops);
    const fisrt = stops[0];
    const last = stops[stops.length - 1];
    if (fisrt.value > 0) stops.unshift({ value: 0, color: fisrt.color });
    if (last.value < 1) stops.push({ value: 1, color: last.color });

    const width = COLOR_MAPPING_TEXTURE_WIDTH;
    //
    canvas ??= new OffscreenCanvas(COLOR_MAPPING_TEXTURE_WIDTH, 1);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
    for (let stop of stops) {
        g.addColorStop(stop.value, stop.color);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

const config = DefaultConfig.colorMapping.ramp;
@subclass()
export class ColorMappingRamp extends Accessor {
    type = 'ramp' as const;

    @property()
    stops: Stops;

    @property({ cast: valueRangeCast })
    valueRange: number[];

    @property({ cast: booleanCast })
    clampHead: boolean = config.clampHead;

    @property({ cast: booleanCast })
    clampTail: boolean = config.clampTail;

    @property({ type: Color })
    headColor: Color = Color.fromString(config.headColor);

    @property({ type: Color })
    tailColor: Color = Color.fromString(config.tailColor);

    constructor(opts: Partial<Omit<ColorMappingRampProperties, 'type'>>) {
        super();
        Object.assign(this, opts);
        this.type = 'ramp';
    }
}


export function isSameStops(stop1: Stops, stop2: Stops) {
    if (stop1 === stop2) return true;
    if (typeof stop1 === 'string') {
        return stop1 === stop2;
    } else {
        const subType1 = typeof stop1[0];
        const subType2 = typeof stop2[0];
        if (subType1 !== subType2) return false;
        if (subType1 === 'string') {
            return stop1.every((v, index) => v === stop2[index]);
        } else {
            return (stop1 as ColorStop[]).every((v, index) => {
                const v2 = stop2[index] as ColorStop;
                return v.value === v2.value && v.color === v2.color
            });
        }
    }
}


export type ColorMappingLoaderRamp = ReturnType<typeof createColorMappingLoaderRamp>;
export function createColorMappingLoaderRamp(
    gl: WebGL2RenderingContext,
    mapping: ColorMappingRamp
) {
    const emiter = new EventEmitter<{
        'change': void,
    }>();
    let _stops: Stops;
    let _texture: WebGLTexture;
    function disposeTexture() {
        _texture && gl.deleteTexture(_texture);
        _texture = null;
    }
    const handle1 = reactiveUtils.watch(
        () => mapping.stops,
        (stops) => {
            if (!stops) {
                disposeTexture();
                _stops = null;
                return emiter.emit('change');
            }
            if (_stops && isSameStops(stops, _stops)) return;
            (Array.isArray(stops)
                ? Promise.resolve(buildRampImage(stops))
                : loadImage(stops)
            ).then(image => {
                if (stops !== mapping.stops) return;
                disposeTexture();
                _texture = createTexture(gl, {
                    src: image,
                    minFilter: gl.NEAREST,
                    magFilter: gl.NEAREST,
                    unpackAlign: 8,
                    wrapS: gl.CLAMP_TO_EDGE,
                    wrapT: gl.CLAMP_TO_EDGE,
                    genMipMap: false,
                });
                //@ts-ignore
                _texture.stops = stops;
                _texture._msg = 'colormapping-ramp'
                _stops = stops;
                emiter.emit('change');
            })
        },
        { initial: true }
    );
    const handle2 = reactiveUtils.watch(
        () => [
            mapping.valueRange,
            mapping.clampHead,
            mapping.clampTail,
            mapping.headColor,
            mapping.tailColor
        ],
        () => emiter.emit('change'),
        { initial: true }
    )
    return {
        on: emiter.on.bind(emiter),
        get texture() { return _texture },
        getData() {
            return {
                type: mapping.type,
                texture: _texture,
                valueRange: mapping.valueRange,
                clampHead: mapping.clampHead ?? config.clampHead,
                clampTail: mapping.clampTail ?? config.clampTail,
                headColor: mapping.headColor || Color.fromString(config.headColor),
                tailColor: mapping.tailColor || Color.fromString(config.tailColor)
            }
        },
        destroy() {
            emiter.destroy();
            disposeTexture();
            handle1.remove();
            handle2.remove();
        }
    }
}
