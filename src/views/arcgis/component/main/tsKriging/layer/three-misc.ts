import {
    ClassBreakColorMapping,
    createClassBreakColorMappingBuffer,
    createGradientColorMappingFromStops,
    createUniqueValueColorMappingBuffer,
    GradientColorMapping,
    UniqueValueColorMapping,
} from "./color-mapping";

import {
    BufferAttribute,
    DataTexture,
    FloatType,
    NearestFilter,
    OrthographicCamera,
    RGBAFormat,
    Sphere,
    Texture,
    UnsignedByteType,
    WebGLRenderer,
} from "three";

const cache = new WeakMap<
    WebGLRenderingContext | WebGL2RenderingContext,
    {
        r: WebGLRenderer;
        layers: any[];
        disposeTimer: NodeJS.Timer;
    }
    >();

export const _defaultCamera = /*#__PURE__*/ new OrthographicCamera();

export function attachRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext, layer: __esri.Layer) {
    if (!cache.has(gl)) {
        const r = new WebGLRenderer({
            canvas: gl.canvas,
            context: gl,
        });
        r.autoClear = false;
        cache.set(gl, { r, layers: [], disposeTimer: null });
    }
    const item = cache.get(gl);
    if (item.disposeTimer) {
        clearTimeout(item.disposeTimer);
        item.disposeTimer = null;
    }
    if (item.layers.findIndex((i) => i === layer) === -1) {
        item.layers.push(layer);
    }
    return item.r;
}

export function detachRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext, layer: __esri.Layer) {
    const item = cache.get(gl);
    if (!item) return;
    const layers = item.layers;
    const index = layers.findIndex((i) => i === layer);
    if (index !== -1) {
        layers.splice(index, 1);
    }
    if (layers.length === 0) {
        item.disposeTimer = setTimeout(() => {
            item.r.dispose();
            cache.delete(gl);
        }, 300000);
    }
}

//避免threejs计算sphere
export const _defaultSphere = /*#__PURE__*/ new Sphere();

export async function buildColorMappingData(
    colorMapping: GradientColorMapping | ClassBreakColorMapping | UniqueValueColorMapping
): Promise<ColorMappingData> {
    const type = colorMapping.type;
    if (type === "gradient") {
        const mapping = colorMapping.stops;
        const imageSrc =
            typeof mapping === "string" ? mapping : createGradientColorMappingFromStops(mapping, 256, 1, "base64");
        const texture = await new Promise<Texture>((resolve) => {
            const image = new Image();
            image.src = imageSrc;
            image.onload = () => {
                const t = new Texture(image);
                t.needsUpdate = true;
                resolve(t);
            };
        });
        return {
            type,
            texture,
            valueRange: colorMapping.valueRange,
            trunc: [colorMapping.truncHead ?? false, colorMapping.truncTail ?? false],
        };
    } else if (type === "class-break") {
        const buffer = createClassBreakColorMappingBuffer(colorMapping.breaks);
        const tex = new DataTexture();
        tex.magFilter = tex.minFilter = NearestFilter;
        //@ts-ignore
        tex.image = buffer;
        tex.format = RGBAFormat;
        tex.type = FloatType;
        tex.needsUpdate = true;
        return {
            type,
            texture: tex,
            breaks: buffer.width,
            trunc: [colorMapping.truncHead ?? false, colorMapping.truncTail ?? false],
            min: buffer.min,
            max: buffer.max,
        };
    } else if (type === "unique-value") {
        const mappings = colorMapping.mapping;
        const count = mappings.length;
        if (count > 255) throw new Error("唯一值编码最多支持255个唯一值");
        //重新编码, 编码从1开始, 0暂时保留
        const codeMap = new Map<number /*原始值*/, number /*新的编码值*/>();
        const mappingArr = [] as { color: string; enable: boolean }[];
        let hasShow = false;
        for (let index = 0; index < count; index++) {
            const item = mappings[index];
            const oldCode = item.value;
            if (Math.floor(oldCode) !== oldCode) throw new Error("编码值必须是整数");
            const newCode = index + 1; //1-255,
            codeMap.set(oldCode, newCode);
            const show = item.enable ?? true;
            hasShow = hasShow || show;
            mappingArr.push({
                color: item.color,
                enable: show,
            });
        }
        const buffer = createUniqueValueColorMappingBuffer(mappingArr);
        const tex = new DataTexture();
        tex.magFilter = tex.minFilter = NearestFilter;
        //@ts-ignore
        tex.image = buffer;
        tex.format = RGBAFormat;
        tex.type = UnsignedByteType;
        tex.needsUpdate = true;
        return {
            type,
            texture: tex,
            codeMap,
            hasShowCode: hasShow,
        };
    }
}

//when upload to gpu, free memory;
export function freeMemory<T extends BufferAttribute>(obj: BufferAttribute): T;
export function freeMemory<T extends Texture>(obj: T): T;
export function freeMemory(obj: any) {
    if (obj instanceof Texture) {
        obj.onUpdate = () => (obj.image = null);
        return obj;
    } else {
        return obj.onUpload(_free);
    }
}

function _free(this: BufferAttribute) {
    this.array = null;
}
