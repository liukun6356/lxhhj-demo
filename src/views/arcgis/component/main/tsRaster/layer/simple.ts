import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import {ClassBreakColorMapping, GradientColorMapping, UniqueValueColorMapping} from "./color-mapping";
import {TimeSeriesRasterLayer} from "./index";
import {RasterSimpleRenderOpts} from "./misc";
import {ColorMappingData, ColorMappingTypeCode, RenderSamplingCode} from "./common";
import {_defaultCamera, _defaultSphere, buildColorMappingData} from "./three-misc";
import { RasterSimpleShader } from "./glsl";
import { RasterRenderResources } from "./types";
import {
    CustomBlending,
    DynamicDrawUsage,
    Float32BufferAttribute,
    IUniform,
    InstancedBufferGeometry,
    InstancedInterleavedBuffer,
    InterleavedBufferAttribute,
    Matrix3,
    Mesh,
    OneMinusSrcAlphaFactor,
    RawShaderMaterial,
    SrcAlphaFactor,
    Texture,
    Vector2,
    WebGLRenderer,
} from "three";

export type SimpleRenderOptsData = ReturnType<ReturnType<typeof watchSimpleRenderOpts>["getData"]>;

export function watchSimpleRenderOpts(opts: {
    layer: TimeSeriesRasterLayer;
    toggleUniqueCodeMapping: (enable: boolean, codeMap: Map<number, number>) => Promise<void>;
    requestNewFrame: (force?: boolean) => void;
}) {
    const {layer, requestNewFrame, toggleUniqueCodeMapping} = opts;
    let destoryed = false;
    let disabled = true;
    let noUniqueActive: boolean; //uniqueMapping时，是否没有激活的
    let colorMappingData: ColorMappingData & { enable?: boolean; src?: any };
    let renderSampling: RenderSamplingCode;
    let showDebugBorder: boolean;
    let stopHandle: () => void;
    const startWatch = () => {
        if (stopHandle) return;
        const subWatches = [] as IHandle[];
        const watchRenderOpts = reactiveUtils.watch(
            () => layer.renderOpts as RasterSimpleRenderOpts,
            (renderOpts) => {
                subWatches.forEach((i) => i.remove());
                subWatches.length = 0;
                requestNewFrame();
                if (!renderOpts) {
                    disabled = true;
                    return;
                }
                disabled = false;
                subWatches.push(
                    reactiveUtils.watch(
                        () => renderOpts.renderSampling,
                        (v) => {
                            renderSampling = RenderSamplingCode[v];
                            requestNewFrame();
                        },
                        {initial: true}
                    )
                );
                subWatches.push(
                    reactiveUtils.watch(
                        () => renderOpts.colorMapping,
                        (v) => handleColorMappingChange(v),
                        {initial: true}
                    )
                );
                subWatches.push(
                    reactiveUtils.watch(
                        () => layer.showDebugBorder,
                        (v) => {
                            showDebugBorder = v ?? false;
                            requestNewFrame();
                        },
                        {initial: true}
                    )
                );
            },
            {initial: true}
        );
        stopHandle = () => {
            watchRenderOpts.remove();
            subWatches.forEach((f) => f.remove());
        };
    };

    async function handleColorMappingChange(
        mapping: GradientColorMapping | ClassBreakColorMapping | UniqueValueColorMapping
    ) {
        if (mapping === colorMappingData?.src) {
            colorMappingData && (colorMappingData.enable = true);
            return;
        }
        if (!mapping) {
            console.warn("colorMapping不能为空");
            colorMappingData && (colorMappingData.enable = false);
        }
        const oldData = colorMappingData;
        const newData = await buildColorMappingData(mapping);
        if (destoryed) return;
        if (newData.type === "unique-value" && !newData.hasShowCode) {
            noUniqueActive = true;
            requestNewFrame();
            return;
        } else {
            noUniqueActive = false;
        }
        const newType = newData.type;
        const oldType = oldData?.type;
        const isUniqueNow = newType === "unique-value";
        let needToggle = false;
        if (isUniqueNow && oldType === "unique-value") {
            needToggle = codeChange(oldData.codeMap, newData.codeMap);
        } else {
            needToggle = isUniqueNow || oldType === "unique-value";
        }
        if (needToggle) {
            await toggleUniqueCodeMapping(isUniqueNow, newData.type === "unique-value" ? newData.codeMap : null);
            if (destoryed) return;
        }
        if (mapping !== layer.renderOpts.colorMapping) return;
        if (colorMappingData) colorMappingData.texture.dispose();
        colorMappingData = newData;
        colorMappingData.enable = true;
        colorMappingData.src = mapping;
        requestNewFrame();

        function codeChange(map1: Map<number, number>, map2: Map<number, number>) {
            const size1 = map1.size,
                size2 = map2.size;
            if (size1 !== size2) return true;
            for (let k of map1.keys()) {
                const v1 = map1.get(k);
                const v2 = map2.get(k);
                if (v1 !== v2) return true;
            }
            return false;
        }
    }

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
            destoryed = true;
            stopWatch();
            //todo
        },
        getData() {
            if (disabled) return;
            if (noUniqueActive) return;
            if (!renderSampling) return;
            if (colorMappingData?.enable !== true) return;
            return {
                colorMappingData,
                renderSampling,
                showDebugBorder,
            };
        },
    };
}

export function createRasterSimpleRenderer(threeRenderer: WebGLRenderer) {
    const gl = threeRenderer.getContext();
    const camera = _defaultCamera;
    //同时渲染的最大数目, 去除一个colorMapping纹理,
    const instanceRenderCount = Math.floor((threeRenderer.capabilities.maxTextures - 1) / 2);
    //tile render mesh
    const uniforms = {
        u_display: {value: new Matrix3()} as IUniform<Matrix3>, //屏幕转ndc矩阵
        u_rotation: {value: new Matrix3()} as IUniform<Matrix3>, //旋转矩阵
        u_lerpValue: {value: NaN}, //线性插值百分比
        u_colorMapping: {
            value: {
                type: null as ColorMappingTypeCode, //映射类型、
                renderSampling: null as RenderSamplingCode, //渲染采样方式(0=near, 1=linear); unique强制=near
                texture: null as Texture, //色带映射纹理
                valueRange: new Vector2(), //色带的映射值域[min,max], (仅gradient 可用)
                uniqueCount: 0, //唯一值个数 (仅 unique 可用)
                trunc: new Vector2(),
            },
        },
        u_showDebugBorder: {value: NaN},
        u_texArr: {value: null as Texture[]},
        u_texSize: {value: new Vector2()},
    };
    const material = new RawShaderMaterial({
        blending: CustomBlending,
        blendSrc: SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
        depthTest: false,
        depthWrite: false,
        uniforms,
        defines: {
            ["CLASS_BREAK_COUNT"]: "0.0",
            ["INSTANCE_RENDER_COUNT"]: instanceRenderCount + "",
            ["TEXTURE_COUNT"]: 2 * instanceRenderCount + "",
        },
        vertexShader: RasterSimpleShader.vertex,
        fragmentShader: RasterSimpleShader.fragment,
    });
    const setClassbreakCount = (breaks: number) => {
        if (breaks !== +material.defines["CLASS_BREAK_COUNT"]) {
            material.defines["CLASS_BREAK_COUNT"] = breaks.toFixed(1);
            material.needsUpdate = true;
        }
    };
    const instanceBuffer = new InstancedInterleavedBuffer(new Float32Array(11 * instanceRenderCount), 11).setUsage(
        DynamicDrawUsage
    );
    const tileMesh = new Mesh(
        new InstancedBufferGeometry()
            .setAttribute(
                "position",
                new Float32BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), 2, false)
            )
            //vec3, x = tileRenderSize瓦片当前渲染大小, yz = centerScreenPos瓦片中心屏幕坐标
            .setAttribute("instance_tileRenderInfo", new InterleavedBufferAttribute(instanceBuffer, 3, 0, false))
            //vec4, xy = before纹理, after纹理的索引, yz = before纹理、after纹理是否可用(1=可用)
            .setAttribute("instance_tileTexInfo", new InterleavedBufferAttribute(instanceBuffer, 4, 3, false))
            //vec4 解码范围 [before.min, before.max, after.min, after.max]
            .setAttribute("instance_tileDecodeRange", new InterleavedBufferAttribute(instanceBuffer, 4, 7, false)),
        material
    );
    tileMesh.geometry.boundingSphere = _defaultSphere;
    tileMesh.frustumCulled = false;

    const _mat3 = new Matrix3();
    return {
        destory: () => {
            material.dispose();
            tileMesh.geometry.dispose();
        },
        render: (
            opts: RasterRenderResources & {
                state: __esri.ViewState;
                tileSize: number;
                renderOptsData: SimpleRenderOptsData;
                viewport: number[];
                framebuffer: WebGLFramebuffer;
            }
        ) => {
            const {state, viewport, framebuffer, renderOptsData, renderTiles, tileSize, percent} = opts;
            const {colorMappingData, renderSampling, showDebugBorder} = renderOptsData;

            threeRenderer.resetState();
            threeRenderer.setViewport(viewport[0], viewport[1], viewport[2], viewport[3]);
            threeRenderer.state.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            const bufferWidth = viewport[2],
                bufferHeight = viewport[3];
            updateGlobalUniforms();
            setupColorMapping();

            const cachedRenderSize = {} as Record<number, number>;
            //@ts-ignore
            const dpr = state.pixelRatio as number;
            const uTexArr = uniforms.u_texArr;
            for (let start = 0; ;) {
                const end = Math.min(start + instanceRenderCount, renderTiles.length) - 1;
                const count = end - start + 1;
                const bufferData = new Float32Array(instanceRenderCount * 11).fill(NaN);
                const texArr = [];
                for (let i = 0; i < count; i++) {
                    let cursor = i * 11;
                    const rt = renderTiles[i + start];
                    const {vTileNode, data1, data2} = rt;
                    //
                    const tileCenterScreenPos = state.toScreen([], vTileNode.cx, vTileNode.cy);
                    const tileRenderSize =
                        cachedRenderSize[vTileNode.z] ||
                        (cachedRenderSize[vTileNode.z] = (vTileNode.width / state.resolution) * dpr);
                    bufferData[cursor++] = tileRenderSize;
                    bufferData[cursor++] = tileCenterScreenPos[0];
                    bufferData[cursor++] = tileCenterScreenPos[1];
                    //
                    bufferData[cursor++] = data1?.tex ? texArr.push(data1.tex) - 1 : NaN;
                    bufferData[cursor++] = data2?.tex ? texArr.push(data2.tex) - 1 : NaN;
                    bufferData[cursor++] = data1?.tex ? 1 : 0;
                    bufferData[cursor++] = data2?.tex ? 1 : 0;
                    //
                    bufferData[cursor++] = data1?.range?.[0];
                    bufferData[cursor++] = data1?.range?.[1];
                    bufferData[cursor++] = data2?.range?.[0];
                    bufferData[cursor++] = data2?.range?.[1];
                }
                instanceBuffer.set(bufferData, 0).needsUpdate = true;
                tileMesh.geometry.instanceCount = count;
                uTexArr.value = texArr;
                threeRenderer.render(tileMesh, camera);
                start = end + 1;
                if (start === renderTiles.length) break;
            }

            function updateGlobalUniforms() {
                uniforms.u_showDebugBorder.value = showDebugBorder ? 1 : 0;
                uniforms.u_texSize.value.set(tileSize, tileSize);
                uniforms.u_lerpValue.value = percent;
                uniforms.u_display.value
                    .identity()
                    .premultiply(_mat3.identity().scale(2 / bufferWidth, -2 / bufferHeight))
                    .premultiply(_mat3.identity().translate(-1, 1));
                uniforms.u_rotation.value.identity().rotate((Math.PI * state.rotation) / 180);
            }

            function setupColorMapping() {
                const {type} = colorMappingData;
                const uColorMapping = uniforms.u_colorMapping.value;

                uColorMapping.texture = colorMappingData.texture;
                uColorMapping.type = ColorMappingTypeCode[type];
                uColorMapping.renderSampling = renderSampling;

                if (type === "gradient") {
                    const range = colorMappingData.valueRange;
                    uColorMapping.valueRange.set(range[0], range[1]);
                    uColorMapping.trunc.set(colorMappingData.trunc[0] ? 1 : 0, colorMappingData.trunc[1] ? 1 : 0);
                } else if (type === "class-break") {
                    setClassbreakCount(colorMappingData.breaks);
                    uColorMapping.trunc.set(colorMappingData.trunc[0] ? 1 : 0, colorMappingData.trunc[1] ? 1 : 0);
                } else {
                    uColorMapping.uniqueCount = colorMappingData.codeMap.size;
                }
            }
        },
    };
}
