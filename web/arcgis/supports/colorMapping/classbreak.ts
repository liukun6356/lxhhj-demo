import Color from "@arcgis/core/Color";
import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { DefaultConfig } from "web/arcgis/config";
import { EventEmitter } from "web/utils/EventEmitter";
import { createTexture } from "web/utils/webgl/texture";
import { COLOR_MAPPING_TEXTURE_WIDTH } from "../constant";
import { booleanCast } from "../cast";

export type Break = { min: number, max: number, color: string };
//分级色带(例如降雨, 温度)
//breaks 必须是严格递增的
export type ColorMappingClassbreakProperties = {
    type: "classbreak";
    clampHead?: boolean;
    clampTail?: boolean;
    headColor?: string | __esri.Color;
    tailColor?: string | __esri.Color;
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
    | Break[];
};

const LEFT_SHIFT_8 = 2 ** 8;
export function formatBreaks(opts: ColorMappingClassbreakProperties["breaks"]) {
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
 * 将间断色带信息编码到 浮点纹理中(RGBA/float32)
 * tex.r = min
 * tex.g = max
 * tex.b = pack(color.rg)
 * tex.a = pack(color.ba)
 */
function encodeBreaksBuffer(opts: ColorMappingClassbreakProperties["breaks"]) {
    if (!opts) return null;
    const breaks = formatBreaks(opts);
    const length = breaks.length;
    if (!length) throw new Error("breaks不能为空");
    const data = new Float32Array(COLOR_MAPPING_TEXTURE_WIDTH * 4);
    let lastMax: number;
    for (let i = 0; i < length; i++) {
        const item = breaks[i];
        if (lastMax !== undefined) {
            if (item.min < lastMax) {
                throw new Error("class-break参数错误, 必须是严格地增");
            }
        }
        const color = item.color;
        if (!color) throw new Error("class-break参数错误, color不存在");
        const { r, g, b, a } = new Color(color); //rgb[0-255], a[0-1]
        const cursor = i * 4;
        data[cursor] = item.min;
        data[cursor + 1] = item.max;
        data[cursor + 2] = r * LEFT_SHIFT_8 + g;
        data[cursor + 3] = b * LEFT_SHIFT_8 + Math.round(a * 255);
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

const config = DefaultConfig.colorMapping.classbreak;
@subclass()
export class ColorMappingClassbreak extends Accessor {
    type = 'classbreak' as const;

    @property()
    breaks: ColorMappingClassbreakProperties['breaks'];

    @property({ cast: booleanCast })
    clampHead: boolean = config.clampHead

    @property({ cast: booleanCast })
    clampTail: boolean = config.clampTail

    @property({ type: Color })
    headColor: Color = Color.fromString(config.headColor)

    @property({ type: Color })
    tailColor: Color = Color.fromString(config.tailColor)

    constructor(opts: Partial<Omit<ColorMappingClassbreakProperties, 'type'>>) {
        super();
        Object.assign(this, opts);
        this.type = 'classbreak';
    }
}

export type ColorMappingLoaderClassbreak = ReturnType<typeof createColorMappingLoaderClassbreak>;
export function createColorMappingLoaderClassbreak(
    gl: WebGL2RenderingContext,
    mapping: ColorMappingClassbreak
) {
    const emiter = new EventEmitter<{
        'change': void,
    }>();
    let _texture: WebGLTexture;
    let _breaks: number;
    function disposeTexture() {
        _texture && gl.deleteTexture(_texture);
        _texture = null;
        _breaks = null;
    }
    const handle1 = reactiveUtils.watch(
        () => mapping.breaks,
        (breaks) => {
            disposeTexture();
            if (!breaks) return emiter.emit('change');
            const { width, height, data, min, max } = encodeBreaksBuffer(breaks);
            _breaks = width;
            _texture = createTexture(gl, {
                src: data,
                width: COLOR_MAPPING_TEXTURE_WIDTH,
                height,
                internalformat: gl.RGBA32F,
                type: gl.FLOAT,
                format: gl.RGBA,
                minFilter: gl.NEAREST,
                magFilter: gl.NEAREST,
                unpackAlign: 4,
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                genMipMap: false,
            });
            _texture._msg = 'colormapping-classbreak'
            emiter.emit('change');
        },
        { initial: true }
    );
    const handle2 = reactiveUtils.watch(
        () => [mapping.clampHead, mapping.clampTail, mapping.headColor, mapping.tailColor],
        () => emiter.emit('change'),
        { initial: true }
    );
    return {
        on: emiter.on.bind(emiter),
        get texture() { return _texture },
        getData() {
            return {
                type: mapping.type,
                texture: _texture,
                breaks: _breaks,
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
