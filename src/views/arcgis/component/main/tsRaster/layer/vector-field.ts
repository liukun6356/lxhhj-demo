import { RasterVectorFieldMergeShader } from "./glsl";
import { TimeSeriesRasterLayer } from "./index";
import { loadImage } from "./misc";
import { glsl_color_mapping_classbreak, glsl_color_mapping_gradient } from "./color-mapping";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { RasterRenderResources } from "./types";
import {
    ClassBreakColorMappingData,
    ColorMappingTypeCode,
    GradientColorMappingData,
    RenderSamplingCode,
} from "./common";
import { _defaultCamera, _defaultSphere, buildColorMappingData } from "./three-misc";
import { createScreenSamplingBasedArrowRenderCtx } from "./arrow-render";
import { VectorFieldRenderOpts } from "./vector-field-render-opts";
import {
    BufferGeometry,
    ClampToEdgeWrapping,
    Color,
    CustomBlending,
    DynamicDrawUsage,
    Float32BufferAttribute,
    FloatType,
    IUniform,
    InstancedBufferGeometry,
    InstancedInterleavedBuffer,
    InterleavedBufferAttribute,
    Matrix3,
    Mesh,
    NearestFilter,
    NoBlending,
    OneMinusSrcAlphaFactor,
    RGBAFormat,
    RawShaderMaterial,
    Sphere,
    SrcAlphaFactor,
    Texture,
    Vector2,
    WebGLRenderTarget,
    WebGLRenderer,
} from "three";


export type VFRenderOptsData = ReturnType<ReturnType<typeof watchVectorFieldRenderOpts>["getData"]>;
export function watchVectorFieldRenderOpts(opts: {
    layer: TimeSeriesRasterLayer;
    requestNewFrame: (force?: boolean) => void;
}) {
    const { layer, requestNewFrame } = opts;
    let destroyed = false;
    let disabledFlag = false;

    //common
    let fallbackValueRange: number[];
    let colorMappingData: (GradientColorMappingData | ClassBreakColorMappingData) & {
        enable?: boolean;
        src?: any;
    };
    //bg
    let showBackGround: boolean;
    let backgroundAlpha: number;
    //arrow
    let arrowTexData: { src: string; texture: Texture; aspect: number; enable: boolean };
    let enableArrowColorMapping: boolean;
    let showArrow: boolean;
    let arrowDefaultColor: string;
    let gap = NaN;
    let arrowSize: {
        valueRange?: number[];
        sizeRange: number[];
    };

    let stopHandle: () => void;
    const startWatch = () => {
        if (stopHandle) return;
        const subWatches = [] as IHandle[];
        const watchRenderOpts = reactiveUtils.watch(
            () => layer.renderOpts,
            (renderOpts) => {
                subWatches.forEach((i) => i.remove());
                subWatches.length = 0;
                requestNewFrame();
                if (!renderOpts) {
                    disabledFlag = true;
                    return;
                }
                if (renderOpts.type !== "vector-field") {
                    disabledFlag = true;
                    console.warn("renderOpts.type 与 source 不匹配");
                    return;
                }
                disabledFlag = false;
                subWatches.push(
                    reactiveUtils.watch(
                        () =>
                            [
                                renderOpts.arrowDefaultColor,
                                renderOpts.enableArrowColorMapping,
                                renderOpts.showArrow,
                                renderOpts.gap,
                                renderOpts.arrowImg,
                                renderOpts.arrowSize,
                            ] as const,
                        ([a, b, c, d, src, sizeMapping]) => {
                            requestNewFrame();
                            arrowDefaultColor = a;
                            enableArrowColorMapping = b;
                            showArrow = c;
                            gap = d;
                            handleArrowImageChange(src);
                            handleSizeMapping(sizeMapping);
                        },
                        { initial: true }
                    )
                );
                subWatches.push(
                    reactiveUtils.watch(
                        () => renderOpts.colorMapping,
                        (colorMapping) => {
                            requestNewFrame();
                            handleColorMappingChange(colorMapping);
                        },
                        { initial: true }
                    )
                );
                subWatches.push(
                    reactiveUtils.watch(
                        () => [renderOpts.valueRange, renderOpts.background, renderOpts.backgroundAlpha] as const,
                        (v) => {
                            requestNewFrame();
                            fallbackValueRange = v[0];
                            showBackGround = v[1];
                            backgroundAlpha = v[2];
                        },
                        { initial: true }
                    )
                );
            },
            { initial: true }
        );
        stopHandle = () => {
            watchRenderOpts.remove();
            subWatches.forEach((f) => f.remove());
        };
    };
    const stopWatch = () => {
        if (stopHandle) {
            stopHandle();
            stopHandle = null;
        }
    };
    return {
        startWatch,
        stopWatch,
        destroy() {
            destroyed = true;
            stopWatch();
            if (arrowTexData) {
                arrowTexData.texture.dispose();
                arrowTexData = null;
            }
            if (colorMappingData) {
                colorMappingData.texture.dispose();
                colorMappingData = null;
            }
        },
        getData() {
            if (disabledFlag || destroyed) return;
            let colorMappingReady = true;
            if (!colorMappingData?.enable) {
                colorMappingReady = false;
            } else {
                if (colorMappingData.type === "gradient") {
                    if (!(colorMappingData.valueRange || fallbackValueRange)) {
                        colorMappingReady = false;
                    }
                }
            }
            const computedShowBackground = showBackGround && colorMappingReady;
            const computedShowArrow =
                showArrow &&
                arrowTexData?.enable === true &&
                gap &&
                arrowSize &&
                (arrowSize.valueRange || fallbackValueRange);
            if (!computedShowArrow && !computedShowBackground) return;
            const _mapping = colorMappingReady ? { ...colorMappingData } : null;
            if (_mapping.type === "gradient") {
                _mapping.valueRange = _mapping.valueRange || fallbackValueRange;
            }
            return {
                colorMappingData: _mapping,
                arrow: computedShowArrow
                    ? {
                        imgTex: arrowTexData.texture,
                        aspect: arrowTexData.aspect,
                        sizeMapping: {
                            sizeRange: arrowSize.sizeRange,
                            valueRange: arrowSize.valueRange || fallbackValueRange,
                        },
                        applyColorMapping: enableArrowColorMapping && colorMappingReady,
                        gap,
                        defaultColor: arrowDefaultColor,
                    }
                    : null,
                showBackGround: computedShowBackground,
                backgroundAlpha,
            };
        },
    };
    function handleSizeMapping(v: VectorFieldRenderOpts["arrowSize"]) {
        if (typeof v === "number") {
            arrowSize = {
                valueRange: null,
                sizeRange: [v, v],
            };
        } else if (Array.isArray(v)) {
            arrowSize = {
                valueRange: null,
                sizeRange: v,
            };
        } else {
            arrowSize = v;
        }
    }
    async function handleArrowImageChange(src: string) {
        if (!src) {
            arrowTexData && (arrowTexData.enable = false);
            return;
        }
        if (arrowTexData?.src === src) {
            arrowTexData && (arrowTexData.enable = true);
            return;
        }
        const image = await loadImage(src);
        if (destroyed) return;
        if ((layer.renderOpts as VectorFieldRenderOpts).arrowImg !== src) return;
        if (arrowTexData) {
            arrowTexData.texture.dispose();
        }
        const tex = new Texture(image);
        tex.needsUpdate = true;
        arrowTexData = {
            src,
            aspect: image.width / image.height,
            texture: tex,
            enable: true,
        };
        requestNewFrame();
    }
    async function handleColorMappingChange(mapping: VectorFieldRenderOpts["colorMapping"]) {
        if (!mapping) {
            colorMappingData && (colorMappingData.enable = false);
            return;
        }

        if (colorMappingData?.src === mapping) {
            colorMappingData && (colorMappingData.enable = true);
            return;
        }

        if (mapping.type !== "class-break" && mapping.type !== "gradient") {
            console.warn("vector-field 仅支持 gradient / class-break 类型的 colorMapping");
            colorMappingData && (colorMappingData.enable = false);
            return;
        }
        const newData = (await buildColorMappingData(mapping as any)) as
            | GradientColorMappingData
            | ClassBreakColorMappingData;

        if (destroyed) return;
        if (mapping !== layer.renderOpts?.colorMapping) return;

        if (colorMappingData) colorMappingData.texture.dispose();
        colorMappingData = newData;
        colorMappingData.enable = true;
        colorMappingData.src = mapping;
        requestNewFrame();
    }
}
export function createRasterVectorFieldRenderer(threeRenderer: WebGLRenderer) {
    //debug
    const showOutRange = !true;
    const outRangeColor = new Color("gray");

    //
    const gl = threeRenderer.getContext();
    const camera = _defaultCamera;
    //同时渲染的最大数目, 去除一个colorMapping纹理,
    const instanceRenderCount = Math.floor((threeRenderer.capabilities.maxTextures - 1) / 2);
    const bgDataCtx = initBgDataCtx();
    const drawArrowCtx = createScreenSamplingBasedArrowRenderCtx();
    drawArrowCtx.uniforms.u_showOutRange.value = showOutRange;
    drawArrowCtx.uniforms.u_outRangeColor.value = outRangeColor;

    const drawBgCtx = initBackgroundCtx();
    function initBgDataCtx() {
        //merge
        const uniforms = {
            u_display: { value: new Matrix3() } as IUniform<Matrix3>, //屏幕转ndc矩阵
            u_rotation: { value: new Matrix3() } as IUniform<Matrix3>, //旋转矩阵
            u_sampling: { value: RenderSamplingCode.linear },
            u_texArr: { value: null as Texture[] },
            u_texSize: { value: new Vector2() },
        };
        const material = new RawShaderMaterial({
            blending: NoBlending, // !important
            depthTest: false,
            depthWrite: false,
            uniforms,
            defines: {
                ["INSTANCE_RENDER_COUNT"]: instanceRenderCount + "",
                ["TEXTURE_COUNT"]: 2 * instanceRenderCount + "",
            },
            vertexShader: RasterVectorFieldMergeShader.vertex,
            fragmentShader: RasterVectorFieldMergeShader.fragment,
        });
        const instanceBuffer = new InstancedInterleavedBuffer(new Float32Array(15 * instanceRenderCount), 15);
        instanceBuffer.setUsage(DynamicDrawUsage);
        const mesh = new Mesh(
            new InstancedBufferGeometry()
                .setAttribute(
                    "position",
                    new Float32BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), 2, false)
                )
                //vec3, x = tileRenderSize瓦片当前渲染大小, yz = centerScreenPos瓦片中心屏幕坐标
                .setAttribute("instance_tileRenderInfo", new InterleavedBufferAttribute(instanceBuffer, 3, 0, false))
                //vec4, xy = before纹理, after纹理的索引, zw = before纹理、after纹理是否可用(1=可用)
                .setAttribute("instance_tileTexInfo", new InterleavedBufferAttribute(instanceBuffer, 4, 3, false))
                //vec4  纹理解码范围 [umin, umax, vmin, vmax]
                .setAttribute("instance_tileDecodeRange_1", new InterleavedBufferAttribute(instanceBuffer, 4, 7, false))
                .setAttribute(
                    "instance_tileDecodeRange_2",
                    new InterleavedBufferAttribute(instanceBuffer, 4, 11, false)
                ),
            material
        );
        mesh.geometry.boundingSphere = _defaultSphere;
        mesh.frustumCulled = false;
        const rt = new WebGLRenderTarget(1, 1, {
            depthBuffer: false,
            stencilBuffer: false,
            minFilter: NearestFilter,
            magFilter: NearestFilter,
            wrapS: ClampToEdgeWrapping,
            wrapT: ClampToEdgeWrapping,
            format: RGBAFormat,
            type: FloatType,
        });
        return {
            uniforms,
            material,
            mesh,
            instanceBuffer,
            rt,
        };
    }

    function initBackgroundCtx() {
        const uniforms = {
            u_map: { value: null as Texture },
            u_lerpValue: { value: NaN },
            u_alpha: { value: NaN },
            u_colorMapping: {
                value: {
                    type: null as ColorMappingTypeCode, //映射类型、
                    texture: null as Texture, //色带映射纹理
                    valueRange: new Vector2(), //色带的映射值域[min,max], (仅gradient 可用)
                    trunc: new Vector2(),
                },
            },
        };
        const material = new RawShaderMaterial({
            blending: CustomBlending,
            blendSrc: SrcAlphaFactor,
            blendDst: OneMinusSrcAlphaFactor,
            depthTest: false,
            uniforms,
            defines: {
                ["CLASS_BREAK_COUNT"]: "0.0",
            },
            vertexShader: `
                attribute vec2 position;
                varying vec2 v_uv;
                void main(){
                    v_uv = position;
                    gl_Position = vec4(position * 2.0 - 1.0, 0, 1);
                }
            `,
            fragmentShader: `
                precision highp float;
                #define MAPPING_GRADIENT ${ColorMappingTypeCode.gradient.toFixed(1)}
                #define MAPPING_CLASS_BREAK ${ColorMappingTypeCode["class-break"].toFixed(1)}
                struct ColorMapping {
                    float type;
                    sampler2D texture;
                    vec2 valueRange;
                    bvec2 trunc;
                };

                uniform sampler2D u_map;
                uniform ColorMapping u_colorMapping;
                uniform float u_lerpValue;
                uniform float u_alpha;

                varying vec2 v_uv;

                ${glsl_color_mapping_gradient}
                ${glsl_color_mapping_classbreak}

                void main(){
                    vec4 raw = texture2D(u_map, v_uv);
                    vec2 data = mix(raw.xy, raw.zw, u_lerpValue);
                    float value = length(data);
                    vec4 mappingColor = u_colorMapping.type == MAPPING_GRADIENT
                            ? mappingcolor_gradient(
                                u_colorMapping.texture, 
                                value, 
                                u_colorMapping.valueRange,
                                u_colorMapping.trunc.x, 
                                u_colorMapping.trunc.y
                            )
                            : mappingcolor_classbreak(
                                u_colorMapping.texture, 
                                value, 
                                u_colorMapping.trunc.x, 
                                u_colorMapping.trunc.y
                            );
                    
                    gl_FragColor = value == 0.0 ? vec4(0): vec4(mappingColor.rgb, u_alpha * mappingColor.a);
                }
            `,
        });
        const positionAttr = new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2);
        const mesh = new Mesh(new BufferGeometry().setAttribute("position", positionAttr), material);
        mesh.geometry.boundingSphere = new Sphere();
        mesh.frustumCulled = false;
        return {
            uniforms,
            mesh,
            setClassbreakCount(breaks: number) {
                if (breaks !== +material.defines["CLASS_BREAK_COUNT"]) {
                    material.defines["CLASS_BREAK_COUNT"] = breaks.toFixed(1);
                    material.needsUpdate = true;
                }
            },
        };
    }

    const _mat3 = new Matrix3();
    let lastSamplerInfo: {
        gap: number; //采样间隔
        screenWidth: number;
        screenHeight: number;
        rotateDeg: number; //屏幕旋转角度
        topLeft: number[]; //屏幕左上角采样点位置
        cols: number; //采样点列数
        rows: number; //采样点行数
    };

    let lastRenderTileKeys: Set<string>;
    let lastRenderSize: number[];
    let lastRenderExtent: __esri.ExtentProperties;
    return {
        destory: () => {
            const { rt, mesh } = bgDataCtx;
            rt.dispose();
            rt.texture.dispose();
            mesh.geometry.dispose();
            mesh.material.dispose();
            const { geometry, material } = drawArrowCtx.mesh;
            geometry.dispose();
            material.dispose();
        },
        render: (
            opts: RasterRenderResources & {
                state: __esri.ViewState;
                fullExtent: __esri.Extent;
                tileSize: number;
                renderOptsData: VFRenderOptsData;
                viewport: number[];
                framebuffer: WebGLFramebuffer;
            }
        ) => {
            const {
                viewport,
                framebuffer,
                state,
                renderTiles: tiles,
                tileSize,
                percent,
                fullExtent,
                renderExtent,
                renderOptsData,
            } = opts;
            //所有转换在逻辑像素中进行
            const { arrow, showBackGround, colorMappingData, backgroundAlpha } = renderOptsData;
            const bufferWidth = viewport[2];
            const bufferHeight = viewport[3];
            //@ts-ignore
            const dpr = state.pixelRatio as number;
            const pixelWidth = bufferWidth / dpr;
            const pixelHeight = bufferHeight / dpr;

            threeRenderer.resetState();
            //merge
            renderToDataRT();

            threeRenderer.setViewport(viewport[0], viewport[1], viewport[2], viewport[3]);
            threeRenderer.state.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            if (showBackGround) drawBackGround();
            if (arrow) drawArrow();

            //将所有输入合并渲染到数据纹理
            function renderToDataRT() {
                //check if change
                const change = isRenderSizeChange() || isRenderExtentChange() || isRenderTilesChange();
                if (!change) return;
                lastRenderSize = [bufferWidth, bufferHeight];
                lastRenderExtent = renderExtent.toJSON();
                lastRenderTileKeys = tiles.reduce((set, item) => {
                    set.add(item.key1);
                    set.add(item.key2);
                    return set;
                }, new Set<string>());
                //render
                const { rt, uniforms, instanceBuffer, mesh } = bgDataCtx;
                threeRenderer.setClearColor("black", 0);
                rt.setSize(pixelWidth, pixelHeight);
                threeRenderer.setRenderTarget(rt);
                threeRenderer.clear();

                //update uniforms
                uniforms.u_texSize.value.set(tileSize, tileSize);
                uniforms.u_display.value
                    .identity()
                    .premultiply(_mat3.identity().scale(2 / pixelWidth, -2 / pixelHeight))
                    .premultiply(_mat3.identity().translate(-1, 1));
                uniforms.u_rotation.value.identity().rotate((Math.PI * state.rotation) / 180);
                const cachedRenderSize = {} as Record<number, number>;

                const uTexArr = uniforms.u_texArr;
                for (let start = 0; ; ) {
                    const end = Math.min(start + instanceRenderCount, tiles.length) - 1;
                    const count = end - start + 1;
                    const bufferData = new Float32Array(instanceRenderCount * 15).fill(NaN);
                    const texArr = [];
                    for (let i = 0; i < count; i++) {
                        let cursor = i * 15;
                        const { vTileNode, data1, data2 } = tiles[i + start];
                        //instance_tileRenderInfo
                        const tileCenterScreenPos = state.toScreen([], vTileNode.cx, vTileNode.cy);
                        const tileRenderSize =
                            cachedRenderSize[vTileNode.z] ||
                            (cachedRenderSize[vTileNode.z] = vTileNode.width / state.resolution);
                        bufferData[cursor++] = tileRenderSize;
                        bufferData[cursor++] = tileCenterScreenPos[0] / dpr;
                        bufferData[cursor++] = tileCenterScreenPos[1] / dpr;
                        //instance_tileTexInfo
                        bufferData[cursor++] = data1?.tex ? texArr.push(data1.tex) - 1 : NaN;
                        bufferData[cursor++] = data2?.tex ? texArr.push(data2.tex) - 1 : NaN;
                        bufferData[cursor++] = data1?.tex ? 1 : 0;
                        bufferData[cursor++] = data2?.tex ? 1 : 0;
                        //instance_tileDecodeRange_1
                        bufferData[cursor++] = data1?.range?.[0];
                        bufferData[cursor++] = data1?.range?.[1];
                        bufferData[cursor++] = data1?.range?.[2];
                        bufferData[cursor++] = data1?.range?.[3];
                        //instance_tileDecodeRange_2
                        bufferData[cursor++] = data2?.range?.[0];
                        bufferData[cursor++] = data2?.range?.[1];
                        bufferData[cursor++] = data2?.range?.[2];
                        bufferData[cursor++] = data2?.range?.[3];
                    }
                    instanceBuffer.set(bufferData, 0).needsUpdate = true;
                    mesh.geometry.instanceCount = count;
                    uTexArr.value = texArr;
                    threeRenderer.render(mesh, camera);
                    start = end + 1;
                    if (start === tiles.length) break;
                }

                // const buffer = new Float32Array(pixelWidth * pixelHeight * 4);
                // threeRenderer.readRenderTargetPixels(rt, 0, 0, pixelWidth, pixelHeight, buffer);
                // debugger;

                function isRenderSizeChange() {
                    return !lastRenderSize || lastRenderSize[0] !== bufferWidth || lastRenderSize[1] !== bufferHeight;
                }
                function isRenderExtentChange() {
                    const EPSILON = 1e-6;
                    if (!lastRenderExtent) return true;
                    return (["xmin", "xmax", "ymin", "ymax"] as const).find((key) => {
                        return Math.abs(lastRenderExtent[key] - renderExtent[key]) > EPSILON;
                    });
                }
                function isRenderTilesChange() {
                    if (!lastRenderTileKeys) return true;
                    if (lastRenderTileKeys.size !== tiles.length * 2) return true;
                    for (let { key1, key2 } of tiles) {
                        if (!lastRenderTileKeys.has(key1) || !lastRenderTileKeys.has(key2)) {
                            return true;
                        }
                    }
                    return false;
                }
            }
            function drawBackGround() {
                const { mesh, uniforms, setClassbreakCount } = drawBgCtx;
                const { type, texture, trunc } = colorMappingData;
                uniforms.u_map.value = bgDataCtx.rt.texture;
                uniforms.u_lerpValue.value = percent;
                uniforms.u_alpha.value = backgroundAlpha;
                const uColor = uniforms.u_colorMapping.value;
                uColor.type = ColorMappingTypeCode[type];
                uColor.texture = texture;
                uColor.trunc.set(trunc[0] ? 1 : 0, trunc[1] ? 1 : 0);
                if (type === "gradient") {
                    const range = colorMappingData.valueRange;
                    uColor.valueRange.set(range[0], range[1]);
                } else {
                    setClassbreakCount(colorMappingData.breaks);
                }
                threeRenderer.render(mesh, camera);
            }
            function drawArrow() {
                const { mesh, updateSamplerIndicesData, uniforms, setClassbreakCount } = drawArrowCtx;
                const { gap, imgTex, aspect, sizeMapping, applyColorMapping, defaultColor } = arrow;
                updateSamplerPoints();
                updateDrawUniforms();
                threeRenderer.render(mesh, camera);

                function updateSamplerPoints() {
                    const change =
                        !lastSamplerInfo ||
                        lastSamplerInfo.gap !== gap ||
                        lastSamplerInfo.screenHeight !== pixelHeight ||
                        lastSamplerInfo.screenWidth !== pixelWidth ||
                        lastSamplerInfo.rotateDeg !== state.rotation;
                    if (!change) return;

                    const cx = pixelWidth / 2,
                        cy = pixelHeight / 2;
                    const [xmin, ymin, xmax, ymax] =
                        state.rotation % 360 === 0
                            ? [0, 0, pixelWidth, pixelHeight]
                            : getPixelRotateBounds(state.rotation);
                    const width = xmax - xmin,
                        height = ymax - ymin;
                    const halfGapCount = [Math.ceil(width / 2 / gap), Math.ceil(height / 2 / gap)];
                    const topLeft = [cx - halfGapCount[0] * gap, cy - halfGapCount[1] * gap];
                    const colPoints = halfGapCount[0] * 2 + 1;
                    const rowPoints = halfGapCount[1] * 2 + 1;
                    if (!lastSamplerInfo || colPoints !== lastSamplerInfo.cols || rowPoints !== lastSamplerInfo.rows) {
                        const instanceArr = new Float32Array(colPoints * rowPoints);
                        for (let i = instanceArr.length; i--; ) instanceArr[i] = i;
                        updateSamplerIndicesData(instanceArr);
                    }
                    lastSamplerInfo = {
                        gap,
                        screenWidth: pixelWidth,
                        screenHeight: pixelHeight,
                        rows: rowPoints,
                        cols: colPoints,
                        topLeft,
                        rotateDeg: state.rotation,
                    };
                    function getPixelRotateBounds(deg: number) {
                        const rad = (deg / 180) * Math.PI;
                        const cos = Math.cos(rad),
                            sin = Math.sin(rad);
                        const rotateCorners = [
                            [0, 0],
                            [pixelWidth, 0],
                            [pixelWidth, pixelHeight],
                            [0, pixelHeight],
                        ].map(([x, y]) => {
                            const x1 = x - cx;
                            const y1 = y - cy;
                            return [x1 * cos - y1 * sin + cx, x1 * sin + y1 * cos + cy];
                        });
                        const xs = rotateCorners.map((p) => p[0]);
                        const ys = rotateCorners.map((p) => p[1]);
                        return [
                            Math.min.apply(null, xs),
                            Math.min.apply(null, ys),
                            Math.max.apply(null, xs),
                            Math.max.apply(null, ys),
                        ];
                    }
                }
                function updateDrawUniforms() {
                    //colormapping
                    const uColorMapping = uniforms.u_colorMapping.value;
                    if (applyColorMapping) {
                        const { type, texture, trunc } = colorMappingData;
                        uColorMapping.enable = true;
                        uColorMapping.useDefaultColor = false;
                        uColorMapping.texture = texture;
                        uColorMapping.type = ColorMappingTypeCode[type];
                        uColorMapping.trunc.set(trunc[0] ? 1 : 0, trunc[1] ? 1 : 0);
                        if (type === "gradient") {
                            const range = colorMappingData.valueRange;
                            uColorMapping.valueRange.set(range[0], range[1]);
                        } else {
                            setClassbreakCount(colorMappingData.breaks);
                        }
                    } else {
                        uColorMapping.enable = false;
                        uColorMapping.useDefaultColor = !!defaultColor;
                        uColorMapping.defaultColor = new Color(defaultColor || "black");
                    }

                    //sizemapping
                    const { valueRange, sizeRange } = sizeMapping;
                    const sizeUniform = uniforms.u_sizeMapping.value;
                    sizeUniform.arrow = imgTex;
                    sizeUniform.sizeRange.set(sizeRange[0], sizeRange[1]);
                    sizeUniform.valueRange.set(valueRange[0], valueRange[1]);
                    sizeUniform.aspect = aspect;

                    //sampling
                    const uSampler = uniforms.u_samplerInfo.value;
                    const fullExtentCenter = state.toScreenNoRotation([], fullExtent.center.x, fullExtent.center.y);
                    const globalOffset = [
                        fullExtentCenter[0] - pixelWidth / 2,
                        fullExtentCenter[1] - pixelHeight / 2,
                    ].map((i) => i % lastSamplerInfo.gap);
                    uSampler.noRatateSamplerOffset.set(globalOffset[0], globalOffset[1]);
                    const intersectExtent = renderExtent.clone().intersection(fullExtent);
                    const boundTopLeft = state.toScreenNoRotation([], intersectExtent.xmin, intersectExtent.ymax);
                    const boundBottomRight = state.toScreenNoRotation([], intersectExtent.xmax, intersectExtent.ymin);
                    uSampler.noRotateActiveScreenArea.set(
                        boundTopLeft[0],
                        boundBottomRight[0],
                        boundTopLeft[1],
                        boundBottomRight[1]
                    );

                    uSampler.lerpValue = percent;
                    uSampler.dataTex = bgDataCtx.rt.texture;
                    uSampler.gap = lastSamplerInfo.gap;
                    uSampler.layout.set(lastSamplerInfo.cols, lastSamplerInfo.rows);
                    uSampler.topLeftScreenPos.set(lastSamplerInfo.topLeft[0], lastSamplerInfo.topLeft[1]);
                    uSampler.screenSize.set(lastSamplerInfo.screenWidth, lastSamplerInfo.screenHeight);
                    //
                    uniforms.u_rotateRad.value = (state.rotation / 180) * Math.PI;
                }
            }
        },
    };
}
