import { assert } from "es-toolkit";
import { componentMinMax, minmax } from "shared/utils/math";
import { BaseTimeSeriesSourceLoader,type TimeSeriesSource } from "web/arcgis/supports/TimeSeriesSource";
import { randomUUID } from "web/utils/misc";
import { calcDataTexSize, createTexture, getTextureUnpackAlign } from "web/utils/webgl/texture";
import {type MeshMappingModeKey,type TimeDataType } from "../interface";

type T = WebGLTexture & {
    range: number[], // 每个分量的min,max依次排列  umin,umax, vmin,vmax ....
    time: number,
    timeIndex: number,
    rawDataSize: number
};

export interface TsVectorTimeSource extends TimeSeriesSource {
    meshMappingMode?: MeshMappingModeKey
};
export class TimeSourceLoader extends BaseTimeSeriesSourceLoader<T> {
    id = randomUUID();
    timeDataLength: number;
    meshMappingMode: MeshMappingModeKey
    dataType: TimeDataType;
    private gl: WebGL2RenderingContext;
    private textureSize: number[];
    private textureDataLength: number;
    private textureOpts: any;

    constructor(gl: WebGL2RenderingContext, opts: TsVectorTimeSource, type: TimeDataType) {
        super(opts);
        this.dataType = type;
        this.textureOpts = type === 'simple'
            ? {
                type: gl.FLOAT,
                internalformat: gl.RGBA32F,
                format: gl.RGBA,
                minFilter: gl.NEAREST,
                magFilter: gl.NEAREST,
                flipY: false,
                unpackAlign: null,
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                premultiplyAlpha: false,
            } : {
                type: gl.FLOAT,
                internalformat: gl.RG32F,
                format: gl.RG,
                minFilter: gl.NEAREST,
                magFilter: gl.NEAREST,
                flipY: false,
                unpackAlign: null,
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                premultiplyAlpha: false,
            }
        this.meshMappingMode = opts.meshMappingMode;
        this.gl = gl;
    }
    disposeTimeData(data: WebGLTexture, time: number, timeIndex: number): void {
        this.gl.deleteTexture(data);
    }
    processTimeData(loadedData: number[] | TypedArray, time: number, timeIndex: number): MaybePromise<T> {
        this.timeDataLength ??= loadedData.length;
        if (!loadedData.length || this.timeDataLength !== loadedData.length) {
            console.warn(`时间序列返回长度不一致, 在时间${time}长度为${loadedData.length}, 之前长度:${this.timeDataLength}`);
        }
        if (this.dataType === 'vector') assert(loadedData.length % 2 === 0, `矢量场时序数据长度为:${loadedData.length}, 不能被2整除, 必须是uv2分量`);

        if (this.dataType === 'simple') {
            //4个pack一个像素
            this.textureSize ??= calcDataTexSize(Math.ceil(
                this.timeDataLength / 4
            ));
            this.textureOpts.unpackAlign ??= getTextureUnpackAlign(4 * this.textureSize[0]);
            this.textureDataLength ??= this.textureSize[0] * this.textureSize[1] * 4;
        } else {
            //一个uv 一个像素
            this.textureSize ??= calcDataTexSize(Math.ceil(
                this.timeDataLength / 2
            ));
            this.textureOpts.unpackAlign ??= getTextureUnpackAlign(2 * this.textureSize[0]);
            this.textureDataLength ??= this.textureSize[0] * this.textureSize[1] * 2;
        }

        const data = new Float32Array(this.textureDataLength);
        if (this.timeDataLength < this.textureDataLength) {
            data.set(loadedData);
        } else {
            for (let i = this.timeDataLength; i--;) data[i] = loadedData[i];
        }
        const texture = createTexture(this.gl, {
            ...this.textureOpts,
            src: data,
            width: this.textureSize[0],
            height: this.textureSize[1],
        }) as T;
        if (this.dataType === 'simple') {
            texture.range = minmax(loadedData);
        } else {
            texture.range = [
                ...componentMinMax(loadedData, 2, 0, 0),
                ...componentMinMax(loadedData, 2, 0, 1),
            ];
        }

        texture._msg = `${this.dataType}-timeData`;
        texture.time = time;
        texture.timeIndex = timeIndex;
        texture.rawDataSize = this.dataType === 'simple'
            ? this.timeDataLength
            : this.timeDataLength / 2;
        console.log(texture.range);
        return texture;
    }
    getCurRenderData() {
        if (!this.state) return null;
        const { beforeIndex, afterIndex, curTime, beforeTime, afterTime } = this.state;
        const beforeTex = this.getTimeDataAt(beforeIndex);
        const afterTex = this.getTimeDataAt(afterIndex);
        if (!beforeTex || !afterTex) return null;
        return {
            beforeTex,
            afterTex,
            percent: (curTime - beforeTime) / (afterTime - beforeTime)
        }
    }
}