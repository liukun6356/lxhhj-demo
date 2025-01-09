import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import { WorkerMethodResult } from "./global";
import { ClassBreakColorMapping, GradientColorMapping } from "./utils/color-mapping";
import { calcDataTexSize, getTextureUnpackAlign } from "./misc";
import { getTileRenderData } from "./vt.worker";
import { clamp, isNil } from "lodash-es";
import {
    BufferGeometry,
    CustomBlending,
    DataTexture,
    Float32BufferAttribute,
    FrontSide,
    InstancedBufferAttribute,
    InstancedBufferGeometry,
    Material,
    Matrix3,
    Mesh,
    NearestFilter,
    NoBlending,
    OneMinusSrcAlphaFactor,
    OrthographicCamera,
    RGBAFormat,
    RawShaderMaterial,
    SrcAlphaFactor,
    Texture,
    Uint16BufferAttribute,
    Uint32BufferAttribute,
    UnsignedByteType,
    Vector2,
    Vector4,
    WebGLRenderTarget,
    WebGLRenderer,
} from "three";
import { ColorMappingTypeCode, checkTimes, createNamespaceError } from "./common";
import { _defaultSphere, freeMemory } from "./three-misc";
import { TimeSeriesFeatureLayer } from "./layer";
import { PointShader, PolygonShader, PolylineShader } from "./glsl";

//数据打包与解包, 0用来代表使用默认值
export const UseDefaultValue = 0;

export const TsFeatureError = /*#__PURE__*/ createNamespaceError("TimeSeriesFeatureLayer");

//默认样式
export const DefaultStyle = {
    lineWidth: 6,
    pointSize: 10,
    pointUpright: false,
    pointStyle: "circle",
} as const;

//编码表
export const GeoTypeCode = {
    point: 1,
    polyline: 2,
    polygon: 3,
} as const;
export const PointStyleCode = {
    circle: 1,
    square: 2,
    triangle: 3,
} as const;
export type PointStyle = keyof typeof PointStyleCode;

export type GraphicProps = {
    geometry: __esri.Point | __esri.Polyline | __esri.Polygon | __esri.Extent | __esri.Multipoint;
    style?: {
        size?: number; //点大小
        type?: PointStyle; //点类型
        isUpright?: boolean; //点是否始终朝上
        lineWidth?: number; //线宽
    };
    [prop: string]: any;
};

function check255(v: any, type: string) {
    if (typeof v !== "number") {
        if (isNil(v)) return v;
        v = +v;
        if (isNaN(v)) throw TsFeatureError(type + "必须是数字");
        return v;
    } else {
        if (v < 1 || v > 255) console.warn(type + "必须在1-255之间");
        return clamp(v, 1, 255);
    }
}

@subclass()
export class FeatureRenderOpts extends Accessor {
    @property({
        cast: (v: any) => check255(v, "线宽"),
    })
    defaultLineWidth: number = DefaultStyle.lineWidth; //1-255

    @property({
        cast: (v: any) => check255(v, "点大小"),
    })
    defaultPointSize: number = DefaultStyle.pointSize; //1-255

    @property()
    defaultPointUpright: boolean = DefaultStyle.pointUpright; //false

    @property({
        cast: (v: any) => {
            if (typeof v === "string" && v in PointStyleCode) {
                return v;
            } else {
                throw TsFeatureError(`点样式必须是: circle/square/triangle 中的一种`);
            }
        },
    })
    defaultPointStyle: PointStyle = DefaultStyle.pointStyle;

    @property()
    colorMapping: GradientColorMapping | ClassBreakColorMapping;
}

export type FeatureTimeDataGetter = (time: number, index: number) => Promise<ArrayLike<number>>;
export function checkTimeFeatureSource(source: TimeSeriesFeatureLayer["source"]) {
    const { times, timeIndex, isSingle, minTime, maxTime } = checkTimes(
        [...(source?.times || [])].sort((a, b) => a - b)
    );
    const dataGetter = source.dataGetter;
    if (!(dataGetter instanceof Function)) throw TsFeatureError("source.dataGetter不存在");
    let dataLength: number;
    const wrapGetter = (time: number) => {
        return new Promise<ArrayLike<number>>((resolve, reject) => {
            let taskPromise: Promise<ArrayLike<number>>;
            try {
                const getterResult = dataGetter(time, timeIndex.get(time));
                if (!(getterResult instanceof Promise)) {
                    taskPromise = Promise.resolve(getterResult);
                } else {
                    taskPromise = getterResult;
                }
                taskPromise
                    .then((bufferData) => {
                        if (!bufferData?.length) throw TsFeatureError(`时序数据不能为空!`);
                        if (isNil(dataLength)) dataLength = bufferData.length;
                        if (bufferData.length !== dataLength) throw TsFeatureError(`时序数据的长度不一致!`);
                        resolve(bufferData);
                    })
                    .catch(reject);
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

//构建graphic, id和dataIndex索引
export function buildIndexAndStat(inputGraphics: GraphicProps[]) {
    let uuid = 0;
    const uidMap = new Map<GraphicProps | number, number | GraphicProps>(); //graphic 和 uid 双向映射
    const dataIndexMap = new Map<GraphicProps, number /*feature-data-index*/>();
    const stat = { point: 0, polyline: 0, polygon: 0, maxPointSize: 0, maxLineWidth: 0 }; //统计信息
    for (let dataIndex = 0, len = inputGraphics.length; dataIndex < len; dataIndex++) {
        const uid = uuid++;
        const g = inputGraphics[dataIndex];
        uidMap.set(g, uid);
        uidMap.set(uid, g);
        dataIndexMap.set(g, dataIndex);
        const type = g.geometry.type;
        if (type === "point" || type === "multipoint") {
            stat.point += 1;
        } else if (type === "extent" || type === "polygon") {
            stat.polygon += 1;
        } else if (type === "polyline") {
            stat.polyline += 1;
        }
    }
    return { uidMap, dataIndexMap, stat };
}

//构建样式索引表
//点和线样式 分开打包成各自的纹理
//样式索引 = 当前graphic样式存储的位置
export function buildStyleIndex(graphics: GraphicProps[]) {
    const pointMap = new Map<GraphicProps, number /* styleindex */>();
    const polylineMap = new Map<GraphicProps, number /* styleindex */>();
    for (let i = 0, pointCursor = 0, lineCursor = 0, total = graphics.length; i < total; i++) {
        const g = graphics[i];
        const type = g.geometry.type;
        if (type === "point" || type === "multipoint") {
            pointMap.set(g, pointCursor);
            pointCursor++;
        } else if (type === "polyline") {
            polylineMap.set(g, lineCursor);
            lineCursor++;
        }
    }
    return {
        point: pointMap,
        polyline: polylineMap,
    };
}

export type StyleEncodeData = {
    data: Uint8ClampedArray; //编码后的样式数据
    size: number[]; //样式纹理 [width, height]
    texture: DataTexture;
    mappingTable: Map<number /*graphic index*/, number /*style pixel index*/>; //根据graphic的index查找其样式位置
};
//将所有图元样式打包到纹理中
export function encodeStyleData(opts: {
    graphics: GraphicProps[];
    styleIndexMap: ReturnType<typeof buildStyleIndex>;
    pointCount: number;
    polylineCount: number;
}) {
    const { graphics, styleIndexMap, pointCount, polylineCount } = opts;
    const total = graphics.length;
    let maxPointSize = 0, //最大点大小
        maxLineWidth = 0; //最大线宽

    const pointDataSize = pointCount ? calcDataTexSize(pointCount) : null;
    const pointDataArr = pointCount ? new Uint8ClampedArray(pointDataSize[0] * pointDataSize[1] * 4) : null;
    const lineDataSize = polylineCount ? calcDataTexSize(polylineCount) : null;
    const lineDataArr = polylineCount ? new Uint8ClampedArray(lineDataSize[0] * lineDataSize[1] * 4) : null;

    for (let i = 0; i < total; i++) {
        const g = graphics[i];
        const type = g.geometry.type;
        if (type === "point" || type === "multipoint") {
            const index = styleIndexMap.point.get(g);
            writePointStyle(pointDataArr, g.style, index);
        } else if (type === "polyline") {
            const index = styleIndexMap.polyline.get(g);
            writePolylineStyle(lineDataArr, g.style, index);
        }
    }
    //对于点, 每个像素编码为
    // r = pointSize, 0=默认值, 1-255=实际值
    // g = isUpright, 0=默认值, 1=false, 255=true
    // b = pointType, 0=默认值, 其他=PointStyleCode
    function writePointStyle(arr: Uint8ClampedArray, style: GraphicProps["style"], pixelIndex: number) {
        const c4 = pixelIndex * 4;
        arr[c4] = style?.size ?? UseDefaultValue;
        maxPointSize = Math.max(arr[c4], maxPointSize); //默认值刚好为0, 不影响
        //g
        arr[c4 + 1] = isNil(style?.isUpright) ? UseDefaultValue : style.isUpright ? 255 : 1;
        //b
        arr[c4 + 2] = PointStyleCode[style?.type] ?? UseDefaultValue;
    }
    //对于线, 每个像素编码为
    // r = linewidth, 0=默认值, 1-255=实际值
    function writePolylineStyle(arr: Uint8ClampedArray, style: GraphicProps["style"], pixelIndex: number) {
        const c4 = pixelIndex * 4;
        arr[c4] = style?.lineWidth ?? UseDefaultValue;
        maxLineWidth = Math.max(arr[c4], maxLineWidth); //默认值刚好为0, 不影响
    }
    function createTexture(data: Uint8ClampedArray, width: number, height: number) {
        const tex = new DataTexture();
        tex.format = RGBAFormat;
        tex.type = UnsignedByteType;
        tex.flipY = false;
        tex.minFilter = tex.magFilter = NearestFilter;
        tex.unpackAlignment = getTextureUnpackAlign(width);
        tex.image = {
            data,
            width,
            height,
        };
        tex.needsUpdate = true;
        return freeMemory(tex);
    }
    return {
        pointStyle: pointCount
            ? {
                texture: createTexture(pointDataArr, pointDataSize[0], pointDataSize[1]),
                data: pointDataArr,
                size: pointDataSize,
            }
            : null,
        polylineStyle: polylineCount
            ? {
                texture: createTexture(lineDataArr, lineDataSize[0], lineDataSize[1]),
                data: lineDataArr,
                size: lineDataSize,
            }
            : null,
        maxPointSize,
        maxLineWidth,
    };
}

//构建渲染mesh对象
export function buildTileMesh(
    data: WorkerMethodResult<typeof getTileRenderData>,
    materials: {
        polygonMaterial: Material;
        pointMaterial: Material;
        polylineMaterial: Material;
    }
) {
    const { polygon, polyline, point } = data;
    let polygonMesh: Mesh, polylineMesh: Mesh, pointMesh: Mesh;
    if (polygon) {
        const { vertex, dataIndex, index } = polygon;
        const polygonGeo = new BufferGeometry()
            .setAttribute("position", freeMemory(new Float32BufferAttribute(vertex, 2)))
            .setAttribute("dataIndex", freeMemory(new Float32BufferAttribute(dataIndex, 1)))
            .setIndex(
                freeMemory(
                    index instanceof Uint16Array
                        ? new Uint16BufferAttribute(index, 1)
                        : new Uint32BufferAttribute(index, 1)
                )
            );
        polygonGeo.boundingSphere = _defaultSphere;
        polygonMesh = new Mesh(polygonGeo, materials.polygonMaterial);
        polygonMesh.frustumCulled = false;
    }
    if (polyline) {
        const { vertex, index, dataIndexAndSide, offset, styleIndex } = polyline;
        const polylineGeo = new BufferGeometry()
            .setAttribute("position", freeMemory(new Float32BufferAttribute(vertex, 2)))
            .setAttribute("dataIndexAndSide", freeMemory(new Float32BufferAttribute(dataIndexAndSide, 1)))
            .setAttribute("offset", freeMemory(new Float32BufferAttribute(offset, 2)))
            .setAttribute("styleIndex", freeMemory(new Float32BufferAttribute(styleIndex, 1)))
            .setIndex(
                freeMemory(
                    index instanceof Uint16Array
                        ? new Uint16BufferAttribute(index, 1)
                        : new Uint32BufferAttribute(index, 1)
                )
            );
        polylineGeo.boundingSphere = _defaultSphere;
        polylineMesh = new Mesh(polylineGeo, materials.polylineMaterial);
        polylineMesh.frustumCulled = false;
    }
    if (point) {
        const { vertex, dataIndex, styleIndex } = point;
        const pointGeo = new InstancedBufferGeometry()
            .setAttribute(
                "offset",
                freeMemory(new Float32BufferAttribute(new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), 2))
            )
            .setIndex(freeMemory(new Uint16BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1)))
            .setAttribute("instance_position", freeMemory(new InstancedBufferAttribute(vertex, 2)))
            .setAttribute("instance_styleIndex", freeMemory(new InstancedBufferAttribute(styleIndex, 1)))
            .setAttribute("instance_dataIndex", freeMemory(new InstancedBufferAttribute(dataIndex, 1)));
        pointGeo.boundingSphere = _defaultSphere;
        pointMesh = new Mesh(pointGeo, materials.pointMaterial);
        pointMesh.frustumCulled = false;
    }
    return {
        pointMesh,
        polylineMesh,
        polygonMesh,
    };
}

export function createTsFeatureRenderer(threeRenderer: WebGLRenderer) {
    const camera = new OrthographicCamera();
    //均以屏幕pixel为准
    const globalUniforms = {
        u_rotation: { value: new Matrix3() },
        u_display: { value: new Matrix3() },
        u_tile: { value: new Vector4() }, // xy:tile中心点屏幕位置(pixel), zw:tile当前宽高(pixel)
        u_resolution: { value: NaN }, // 画布分辨率(1像素 = x地图单位)

        u_dataValue: {
            /* struct DataValue {
                sampler2D tex1;
                sampler2D tex2;
                vec2 texSize;
                float lerpValue;
                bvec2 enable;
            }; */
            value: {
                tex1: null as DataTexture,
                tex2: null as DataTexture,
                texSize: new Vector2(),
                lerpValue: NaN,
                enable: new Vector2(),
            },
        },

        u_colorMapping: {
            /* struct ColorMapping {
                float type;
                sampler2D texture;
                vec2 valueRange;
                bvec2 trunc;
            }; */
            value: {
                type: NaN as ColorMappingTypeCode,
                texture: null as Texture,
                valueRange: new Vector2(),
                trunc: new Vector2(),
            },
        },
    };

    const materialDefines = {
        ["CLASS_BREAK_COUNT"]: "1.0",
    };
    //
    const polygonMaterial = new RawShaderMaterial({
        blending: CustomBlending,
        blendSrc: SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
        uniforms: globalUniforms,
        side: FrontSide,
        depthTest: false,
        defines: materialDefines,
        vertexShader: PolygonShader.vertex,
        fragmentShader: PolygonShader.fragment,
    });
    //
    const pointStyleUniform = {
        /* struct PointStyle {
                sampler2D texture;
                vec2 texSize;
                float defaultSize;
                float defaultUpright;
                float defaultType;
            }; */
        value: {
            texture: null as Texture,
            texSize: new Vector2(),
            defaultSize: NaN,
            defaultUpright: false,
            defaultType: NaN,
        },
    };
    const pointMaterial = new RawShaderMaterial({
        blending: CustomBlending,
        blendSrc: SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
        uniforms: {
            ...globalUniforms,
            u_pointStyle: pointStyleUniform,
        },
        side: FrontSide,
        depthTest: false,
        defines: materialDefines,
        vertexShader: PointShader.vertex,
        fragmentShader: PointShader.fragment,
    });
    //
    const polylineStyleUniform = {
        /* struct PolylineStyle {
            sampler2D texture;
            vec2 texSize;
            float defaultLineWidth;
        }; */
        value: {
            texture: null as Texture,
            texSize: new Vector2(),
            defaultLineWidth: NaN,
        },
    };
    const polylineMaterial = new RawShaderMaterial({
        blending: CustomBlending,
        blendSrc: SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
        uniforms: {
            ...globalUniforms,
            u_polylineStyle: polylineStyleUniform,
        },
        side: FrontSide,
        depthTest: false,
        defines: materialDefines,
        vertexShader: PolylineShader.vertex,
        fragmentShader: PolylineShader.fragment,
    });

    //旋转后gl.scissor的替代方法
    const scissorUniforms = {
        u_v0: { value: new Vector2() },
        u_v1: { value: new Vector2() },
        u_v2: { value: new Vector2() },
        u_v3: { value: new Vector2() },
        u_display: { value: new Matrix3() },
    };
    const scissorGeo = new BufferGeometry()
        .setAttribute("position", new Float32BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3]), 3))
        .setIndex([0, 1, 2, 0, 2, 3]);
    scissorGeo.boundingSphere = _defaultSphere;
    const scissorAlternativeMesh = new Mesh(
        scissorGeo,
        new RawShaderMaterial({
            blending: NoBlending,
            uniforms: scissorUniforms,
            side: FrontSide,
            depthTest: false,
            vertexShader: `
                uniform vec2 u_v0;
                uniform vec2 u_v1;
                uniform vec2 u_v2;
                uniform vec2 u_v3;
                uniform mat3 u_display;
                attribute vec3 position;
                void main(){
                    vec2 screenPos = position.r == 0.0 ? u_v0 : position.r == 1.0 ? u_v1 : position.r == 2.0 ? u_v2 : u_v3;
                    gl_Position.xy = (u_display * vec3(screenPos, 1.0)).xy; 
                    gl_Position.zw = vec2(0.0, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                void main(){ 
                    gl_FragColor = vec4(0);
            }`,
        })
    );
    scissorAlternativeMesh.frustumCulled = false;
    //
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
    copyGeometry
        .setAttribute("position", new Float32BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3))
        .setIndex([0, 1, 2, 0, 2, 3]);
    const copyMesh = new Mesh(copyGeometry, copyRenderMaterial);
    copyMesh.frustumCulled = false;

    const rt = new WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        stencilBuffer: false,
    });
    return {
        renderer: threeRenderer,
        camera,
        polylineMaterial,
        polygonMaterial,
        pointMaterial,
        globalUniforms,
        pointUniforms: pointStyleUniform,
        polylineUniforms: polylineStyleUniform,
        copyUniforms,
        rt,
        scissorUniforms,
        scissorAlternativeMesh,
        copyMesh,
        setClassbreakCount(breaks: number) {
            if (breaks !== +materialDefines["CLASS_BREAK_COUNT"]) {
                materialDefines["CLASS_BREAK_COUNT"] = breaks.toFixed(1);
                pointMaterial.needsUpdate = polygonMaterial.needsUpdate = polylineMaterial.needsUpdate = true;
            }
        },
        destroy: () => {
            copyGeometry.dispose();
            scissorGeo.dispose();
            scissorAlternativeMesh.material.dispose();
            rt.texture?.dispose();
            rt.dispose();
            polylineMaterial.dispose();
            pointMaterial.dispose();
            polygonMaterial.dispose();
        },
    };
}
