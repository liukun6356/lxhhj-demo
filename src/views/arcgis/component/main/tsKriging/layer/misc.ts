import type { TimeSeriesKrigingLayer } from "./index.ts";
import { KrigingModel } from "./kriging";
import Accessor from "@arcgis/core/core/Accessor";
import { ClassBreakColorMapping, GradientColorMapping } from "./color-mapping";
import { ColorMappingTypeCode, RenderSamplingCode, checkTimes, createNamespaceError } from "./common";
import { _defaultCamera, attachRenderer, detachRenderer } from "./three-misc";
import { KrigingFragShader, KrigingVertexShader } from "./glsl";
import BaseLayerViewGL2D from "@arcgis/core/views/2d/layers/BaseLayerViewGL2D";

import {
    AlwaysStencilFunc,
    BufferGeometry,
    CustomBlending,
    Float32BufferAttribute,
    FrontSide,
    Matrix3,
    Mesh,
    OneMinusSrcAlphaFactor,
    RawShaderMaterial,
    ReplaceStencilOp,
    SrcAlphaFactor,
    Texture,
    Vector2,
    Vector4,
    WebGLRenderTarget,
    WebGLRenderer,
} from "three";
import {property, subclass} from "@arcgis/core/core/accessorSupport/decorators";

//float64 转 2个 float32
export function doubleToTwoFloats(value: number) {
    let high, low, tempHigh;
    if (value >= 0) {
        if (value < 65536) return [0, value];
        tempHigh = Math.floor(value / 65536) * 65536;
        high = tempHigh;
        low = value - tempHigh;
    } else {
        if (value > -65536) return [0, value];
        tempHigh = Math.floor(-value / 65536) * 65536;
        high = -tempHigh;
        low = value + tempHigh;
    }
    return [high, low];
}

/**
 * 查找值所在区间索引
 * [1.1, 2.2, 3.5, 4.0]  2.5所在区间索引为[1,2], 4所在区间索引为[2,3]
 *   0    1    2    3
 * @param ascArr 升序数组
 * @param value 要查找的数
 */
export function findIntervalIndexThatValueIn(ascArr: number[], value: number) {
    let afterIndex = findFirstGreaterThan(ascArr, value);
    if (afterIndex === -1) afterIndex = ascArr.length - 1;
    const beforeIndex = Math.max(0, afterIndex - 1);
    return [beforeIndex, afterIndex];
}

//查找第一个大于target的数的索引
function findFirstGreaterThan(ascArr: number[], target: number) {
    let left = 0;
    let right = ascArr.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (ascArr[mid] > target) {
            if (mid === 0 || ascArr[mid - 1] <= target) {
                return mid;
            } else {
                right = mid - 1;
            }
        } else {
            left = mid + 1;
        }
    }

    return -1; // 如果没有找到符合条件的数，则返回 -1
}

//webgl 纹理解包值
export function getTextureUnpackAlign(textureWidth: number) {
    return !(textureWidth & 0b111) ? 8 : !(textureWidth & 0b11) ? 4 : !(textureWidth & 0b1) ? 2 : 1;
}

export function rafThrottle<F extends (...args: any[]) => any>(callback: F) {
    let requestId = null as number;
    let lastArgs: Parameters<F>;
    const later = (context: any) => () => {
        requestId = null;
        callback.apply(context, lastArgs);
    };

    const throttled = function (this: any, ...args: Parameters<F>) {
        lastArgs = args;
        if (requestId === null) {
            requestId = requestAnimationFrame(later(this));
        }
    };

    throttled.cancel = () => {
        cancelAnimationFrame(requestId);
        requestId = null;
    };

    return throttled;
}

/**
 * 满足给定长度的最小的纹理尺寸, 宽高均为2的幂, 宽高之间差值最小(接近正方形)。
 * 例如 3个像素 = 2X2 纹理,
 * @param pixelCount 像素数
 * @returns
 */
export function calcDataTexSize(pixelCount: number) {
    if (!pixelCount) throw new Error("长度不存在!");
    const length = ceilPowerOfTwo(pixelCount);
    const l = Math.log2(length);
    const cols = Math.ceil(l / 2);
    const rows = l - cols;
    return [2 ** cols, 2 ** rows];
}

//大于等于某个数的最小的2的幂
export function ceilPowerOfTwo(val: number) {
    val = +val;
    if (isNaN(val)) throw new Error("不是数字");
    if (val & (val - 1)) {
        val |= val >> 1;
        val |= val >> 2;
        val |= val >> 4;
        val |= val >> 8;
        val |= val >> 16;
        return val + 1;
    } else {
        return val === 0 ? 1 : val;
    }
}

export enum EnumKrigingTextureDataType {
    TEX_ARRAYBUFFER = 1,
    TEX_IMAGEBITMAP = 2,
}

export type KrigingOpts = {
    model?: KrigingModel; //默认exponential
    sigma2?: number; //默认0,
    alpha?: number; //默认100
    gridExtent?: __esri.Extent; //默认是 数据extent.expand(1.5)
    splitCount?: number; //gridExtent宽高中较小的划分为多少网格，默认是100
};

@subclass()
export class KrigingRenderOpts extends Accessor {
    @property()
    renderSampling: "nearest" | "linear" = "linear";

    @property()
    clipPolygon: __esri.Polygon | __esri.Polygon[];

    @property()
    useClip: boolean;

    @property()
    krigingOpts: KrigingOpts;

    @property()
    colorMapping: GradientColorMapping | ClassBreakColorMapping;
}

export type TimeSeriesKrigingSource = {
    points: { x: number; y: number }[]; //点位
    spatialReference: __esri.SpatialReference; //参考系
    times: number[]; //时间序列
    dataGetter: KrigingTimeDataGetter; //获取时间函数
};

export type KrigingTimeDataGetter = (
    time: number,
    index: number
) => Promise<number[]>;

export const TsKrigingError = /*#__PURE__*/ createNamespaceError("TimeSeriesKrigingLayer");

export function checkKrigingSource(source: TimeSeriesKrigingLayer["source"]) {
    if (!source) return null;
    const pointCount = source.points?.length ?? 0;
    if (pointCount <= 1) throw TsKrigingError(`至少需要2个点`);
    const dataGetter = source.dataGetter;
    if (!(dataGetter instanceof Function)) throw TsKrigingError("source.dataGetter必须是函数");
    const { times, timeIndex, minTime, maxTime, isSingle } = checkTimes(source.times);
    const wrapGetter = (time: number) => {
        return new Promise<number[]>((resolve, reject) => {
            let taskPromise: Promise<number[]>;
            try {
                const getterResult = dataGetter(time, timeIndex.get(time));
                if (!(getterResult instanceof Promise)) {
                    taskPromise = Promise.resolve(getterResult);
                } else {
                    taskPromise = getterResult;
                }
                taskPromise.then((pointData) => {
                    if (pointCount !== pointData.length) {
                        throw TsKrigingError(`返回数据长度与points长度不一致!`);
                    }
                    resolve(pointData);
                });
            } catch (e) {
                reject(e);
            }
        });
    };
    return {
        dataGetter: wrapGetter,
        times,
        minTime,
        maxTime,
        isSingle,
    };
}

export function createKrigingRenderCtx(layer: TimeSeriesKrigingLayer, layerview: BaseLayerViewGL2D) {
    const renderer = attachRenderer(layerview.context, layer);
    const camera = _defaultCamera;
    const isWebgl2 = renderer.capabilities.isWebGL2;

    const uniform = {
        u_renderSize: { value: new Vector2() }, //当前渲染的区域的尺寸
        u_percent: { value: 0 },
        u_texSize: { value: new Vector2() }, //纹理尺寸
        u_before: {
            value: {
                type: NaN as EnumKrigingTextureDataType,
                zeroFlag: null as boolean,
                map: null as Texture,
                decodeValueRange: new Vector2(),
            },
        },
        u_after: {
            value: {
                type: NaN as EnumKrigingTextureDataType,
                zeroFlag: null as boolean,
                map: null as Texture,
                decodeValueRange: new Vector2(),
            },
        },
        u_colorMapping: {
            value: {
                type: null as ColorMappingTypeCode, //映射类型、
                texture: null as Texture, //色带映射纹理
                renderSampling: null as RenderSamplingCode, //渲染采样方式(0=near, 1=linear
                valueRange: new Vector2(), //色带的映射值域[min,max], (仅gradient 可用)
                trunc: new Vector2(), //(仅classbreak 可用)
            },
        },
    };
    const defines = {
        TEX_ARRAYBUFFER: EnumKrigingTextureDataType.TEX_ARRAYBUFFER.toFixed(1),
        TEX_IMAGEBITMAP: EnumKrigingTextureDataType.TEX_IMAGEBITMAP.toFixed(1),
        CLASS_BREAK_COUNT: "0.0",
    } as Record<string, string>;
    if (isWebgl2) defines["webgl2"] = "";
    const material = new RawShaderMaterial({
        blending: CustomBlending,
        blendSrc: SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
        uniforms: uniform,
        side: FrontSide,
        depthTest: false,
        defines,
        vertexShader: KrigingVertexShader,
        fragmentShader: KrigingFragShader,
    });
    // 3 --- 2
    // |     |
    // 0 --- 1
    const mesh = new Mesh(
        new BufferGeometry()
            .setIndex([0, 1, 2, 0, 2, 3])
            .setAttribute("position", new Float32BufferAttribute(new Float32Array(12), 3))
            .setAttribute("uv", new Float32BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)),
        material
    );
    mesh.frustumCulled = false;

    //clip
    const clipUniform = {
        u_display: { value: new Matrix3() },
        u_center: { value: new Vector4() },
    };
    const clipMaterial = new RawShaderMaterial({
        uniforms: clipUniform,
        side: FrontSide,
        depthTest: false,
        colorWrite: false,
        stencilWrite: true,
        stencilFunc: AlwaysStencilFunc,
        stencilZPass: ReplaceStencilOp,
        stencilRef: 1,
        vertexShader: `
            precision highp float;
            attribute vec2 positionHigh;
            attribute vec2 positionLow;
            uniform mat3 u_display;
            uniform vec4 u_center;
            void main(){
                vec2 positionRTC = positionHigh - u_center.xy + positionLow - u_center.zw;
                gl_Position.xy = (u_display * vec3(positionRTC, 1.0)).xy;
                gl_Position.zw = vec2(0.0, 1.0);
            }
        `,
        fragmentShader: `void main() { gl_FragColor = vec4(1); }`,
    });

    //copy
    const copyUniforms = {
        map: { value: null as Texture },
    };
    const copyRenderMaterial = new RawShaderMaterial({
        blending: CustomBlending,
        blendSrc: SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
        uniforms: copyUniforms,
        side: FrontSide,
        depthTest: false,
        vertexShader: `
            precision highp float;
            attribute vec3 position;
            varying vec2 v_uv;
            void main(){
                gl_Position = vec4(position.xy * 2.0 - 1.0, 0, 1);
                v_uv = position.xy;
            }
        `,
        fragmentShader: `
             precision highp float;
             uniform sampler2D map;
             varying vec2 v_uv;
             void main(){
                gl_FragColor = texture2D(map, v_uv);
             }
        `,
    });
    const copyGeometry = new BufferGeometry();
    copyGeometry.setAttribute(
        "position",
        new Float32BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3)
    );
    const copyMesh = new Mesh(copyGeometry, copyRenderMaterial);
    copyMesh.frustumCulled = false;

    const rt = new WebGLRenderTarget(1, 1, {
        depthBuffer: true, //bug ? depthBuffer设置为false, stencil不生效
        stencilBuffer: true,
    });
    return {
        renderer,
        camera,
        uniform,
        material,
        mesh,
        isWebgl2,
        clipUniform,
        clipMaterial,
        rt,
        copyUniforms,
        copyMesh,
        destroy: () => {
            rt.dispose();
            material.dispose();
            mesh.geometry.dispose();
            clipMaterial.dispose();
            copyRenderMaterial.dispose();
            copyGeometry.dispose();
            detachRenderer(layerview.context, layer);
        },
    };
}

