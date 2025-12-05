import Color from "@arcgis/core/Color";
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import { clamp } from "es-toolkit";
import GUI from "lil-gui";
import { createTileSchemeFromBBoxAndResolution } from "shared/utils/tile";
import { render, type VNode } from "vue";
import { TimeSeriesVectorLayer } from "web/arcgis/layers/TimeSeriesVectorLayer/layer";
import { ColorMappingRamp } from "web/arcgis/supports/colorMapping/ramp";
import arrow1 from 'web/assets/arrow/arrow1.png';
import arrow2 from 'web/assets/arrow/arrow2.svg';
import arrow3 from 'web/assets/arrow/arrow3.png';
import ArrowSelect from "web/components/arrow-select.vue";
import ColorMapping from "web/components/legend/colorMapping.vue";
import Ramp from "web/components/legend/Ramp.vue";
import { toFixed1 } from "web/utils/formatter";
import { createWaterLevelColorMapping, DepthColorMapping } from "./config";
import { getGlobalCtx } from "./global";
import { createAndMount } from "./utils";
export async function loadTuflow(caseName: string) {
    const root = `http://192.168.60.36:10009/${caseName}`;
    const loadSeriesMeta = (seriesName: string) => {
        return fetch(root + '/' + seriesName + '/meta.json').then(res => res.json()) as Promise<{
            times: number[],
            timeRange: number[],
            valueRange: number[]
        }>
    };
    const loadSeriesDataAtTimeIndex = (seriesName: string, timeIndex: number) => {
        return fetch(root + '/' + seriesName + '/' + timeIndex).then(res => res.arrayBuffer()).then(buf => new Float32Array(buf));
    };
    const { proj, minSize, extent, hash, primitiveType, series, flow } = await fetch(root + '/meta.json').then(res => res.json()) as {
        hash: string,
        primitiveType: "quad" | 'triangle',
        verticesFormat: "xyz",
        proj: string,
        extent: {
            "xmin": number,
            "xmax": number,
            "ymin": number,
            "ymax": number,
            "zmin": number,
            "zmax": number,
        },
        minSize: number,
        pointCount: number,
        meshCount: number,
        series: string[],// ["Depth","Water Level","Vector Velocity"]
        flow: string
    };
    const [vertices, indices] = await Promise.all([
        fetch(root + '/vertices').then(res => res.arrayBuffer()).then(buf => new Float32Array(buf)),
        fetch(root + '/indices').then(res => res.arrayBuffer()).then(buf => new Uint32Array(buf))
    ]);
    const { view, basemap, timeProps } = getGlobalCtx();
    const crs = new SpatialReference({ wkt: proj.replaceAll(/\s+/g, '') });
    const tileScheme = createTileSchemeFromBBoxAndResolution([
        extent.xmin, extent.ymin,
        extent.xmax, extent.ymax
    ], minSize / (2 ** 0.5) / 16, 256);
    const tileInfo = new TileInfo({
        spatialReference: crs,
        origin: {
            type: "point",
            x: tileScheme.origin[0],
            y: tileScheme.origin[1],
            spatialReference: crs
        } as __esri.PointProperties,
        lods: tileScheme.lods.map(i => ({
            level: i.z,
            resolution: i.resolution,
            scale: i.scale,
            origin: tileScheme.origin
        })),
        size: tileScheme.tileSize,
        dpi: 96
    });
    basemap.tileInfo = tileInfo;
    basemap.source = {
        ...basemap.source,
        cacheKey: caseName + ':' + hash,
    };

    view.spatialReference = crs;
    view.constraints.geometry = {
        type: "extent",
        xmin: tileScheme.worldBBox[0],
        ymin: tileScheme.worldBBox[1],
        xmax: tileScheme.worldBBox[2],
        ymax: tileScheme.worldBBox[3],
        spatialReference: crs
    }
    view.constraints.lods = tileInfo.lods;
    view.extent = {
        type: "extent",
        spatialReference: crs,
        ...extent,
    } as __esri.Extent;

    view.graphics.add({
        geometry: {
            type: "extent",
            spatialReference: crs,
            ...extent,
        },
        symbol: {
            type: 'simple-line',
            color: 'black'
        } as __esri.SimpleLineSymbolProperties
    } as __esri.Graphic);

    const layer = new TimeSeriesVectorLayer({
        curTime: timeProps.curTime,
        timeDataRenderOpts: {},
        meshRenderOpts: {
            renderZ: false,
            showMeshLine: false,
            meshLineColor: 'rgba(255,255,255,0.1)',
            zColorMapping: {
                type: 'ramp',
                stops: ['black', 'white'],
                valueRange: [extent.zmin, extent.zmax]
            }
        },

    });
    view.map.add(layer);
    watch(() => timeProps.curTime, t => layer.curTime = t);

    layer.geometry = {
        type: "mesh",
        vertices: {
            data: vertices,
            stride: 3,
            x: 0,
            y: 1,
            z: 2,
        },
        indices: {
            data: indices,
            stride: 4,
            components: [0, 1, 2, 3],
        },
        primitiveType,
        spatialReference: crs
    };
    const params = reactive({
        //
        showMeshLine: layer.meshRenderOpts.showMeshLine,
        meshLineColor: layer.meshRenderOpts.meshLineColor.toCss(false),
        meshLineAlpha: layer.meshRenderOpts.meshLineColor.a,

        //
        showZ: layer.meshRenderOpts.renderZ,
        //timeData
        timeDataSource: '',
    });
    const gui = new GUI().title('控制面板');
    const grid = gui.addFolder('网格线');
    {
        grid.add(params, 'showMeshLine').name('show').onChange((v: boolean) => {
            layer.meshRenderOpts.showMeshLine = v;
        });
        grid.addColor(params, 'meshLineColor').name('color').onChange(handleMeshLineColorChange)
        grid.add(params, 'meshLineAlpha', 0, 1, 0.01).name('alpha').onChange(handleMeshLineColorChange)
        function handleMeshLineColorChange() {
            const color = Color.fromString(params.meshLineColor);
            color.a = params.meshLineAlpha;
            layer.meshRenderOpts.meshLineColor = color;
        }
    }

    //
    const z = gui.addFolder('高程');
    {
        const legend = reactive({
            range: [extent.zmin, extent.zmax],
            stops: (layer.meshRenderOpts.zColorMapping as ColorMappingRamp).stops,
            format: toFixed1,
        });
        const ctrl = z.add(params, 'showZ').name('show').onChange((show: boolean) => {
            layer.meshRenderOpts.renderZ = show;
        });
        const instance = createApp(() => h(Ramp, legend));
        instance.mount(document.createElement('div'));
        const target = instance._container.firstElementChild as HTMLDivElement;
        ctrl.domElement.parentElement.appendChild(target);
    }

    //
    setupSeriesSetting();
    return
    setupVectorFieldSetting();

    function setupSeriesSetting() {
        const ts = gui.addFolder('时序数据');
        const renderOpts = layer.timeDataRenderOpts;
        const params = reactive({
            show: renderOpts.enable,
            series: series[0],
            opacity: renderOpts.opacity,
        });

        ts.add(params, 'show').onChange((v: boolean) => {
            renderOpts.enable = v;
        });
        ts.add(params, 'opacity', 0, 1, 0.01).onChange((v: number) => {
            renderOpts.opacity = v;
        });

        const ctrl = ts.add(params, 'series', series).name('数据源').onChange(handleSeriesChange)
        const host = document.createElement('div');
        let hasAttach = false;
        reactiveUtils.watch(
            () => renderOpts.colorMapping,
            c => {
                if (!c) return;
                let vnode: VNode;
                if (c.type === 'classbreak') {
                    vnode = h(ColorMapping, {
                        type: 'classbreak',
                        data: {
                            direction: "vertical",
                            format: toFixed1,
                            breaks: c.breaks
                        }
                    });
                } else {
                    vnode = h(ColorMapping, {
                        type: 'classbreak',
                        data: {
                            direction: "vertical",
                            format: toFixed1,
                            stops: c.stops
                        }
                    });
                }
                render(vnode, host);
                if (!hasAttach) {
                    hasAttach = true;
                    ctrl.domElement.parentElement.appendChild(host.firstElementChild);
                }
            },
            { initial: true }
        )

        handleSeriesChange();
        async function handleSeriesChange() {
            const s = params.series;
            const { timeRange, times, valueRange } = await loadSeriesMeta(s);
            const [min, max] = timeRange;
            timeProps.curTime = layer.curTime = clamp(layer.curTime, min, max);
            timeProps.step = (max - min) / (times.length - 1);
            timeProps.playSpeed = timeProps.step / 30;
            layer.timeSource = {
                meshMappingMode: 'per-vertex',
                times: times,
                dataGetter: (_, timeIndex) => loadSeriesDataAtTimeIndex(s, timeIndex)
            };
            renderOpts.colorMapping = s === 'Depth'
                ? DepthColorMapping
                : createWaterLevelColorMapping(valueRange);
        }
    }
    async function setupVectorFieldSetting() {
        const s = flow;
        const { timeRange, times, valueRange } = await loadSeriesMeta(s);
        layer.vectorFieldTimeSource = {
            meshMappingMode: 'per-vertex',
            times: times,
            dataGetter: async (_, timeIndex) => loadSeriesDataAtTimeIndex(s, timeIndex)
        };
        layer.vectorFieldRenderOpts = {
            enableColorMapping: true,
            colorMapping: {
                type: 'ramp',
                stops: ['yellow', 'red', 'purple'],
                clampHead: false,
                clampTail: false,
            },
            minShowFlow: 0.01,
            flowRange: valueRange,
            enableSizeMapping: false,
            sizeMapping: [10, 20],
            //@ts-ignore
            defaultColor: 'red',
            defaultSize: 20,
            gap: 15,
            arrowImg: arrow2
        };
        const renderOpts = layer.vectorFieldRenderOpts;
        const vfParams = reactive({
            show: renderOpts.show,
            opacity: renderOpts.opacity,
            arrow: renderOpts.arrowImg,
            gap: renderOpts.gap,
            enableSizeMapping: renderOpts.enableSizeMapping,
            defaultSize: renderOpts.defaultSize,
            minSize: (renderOpts.sizeMapping as number[])[0],
            maxSize: (renderOpts.sizeMapping as number[])[1],
            enableColorMapping: renderOpts.enableColorMapping,
            defaultArrowColor: renderOpts.defaultColor.toCss(),
        });
        const folder = gui.addFolder('流场');

        folder.add(vfParams, 'show').onChange((v: boolean) => renderOpts.show = v);
        folder.add(vfParams, 'opacity', 0, 1, 0.01).onChange((v: number) => {
            renderOpts.opacity = v;
        });
        const arrowEl = createAndMount(() => h(ArrowSelect, {
            arrows: [arrow1, arrow2, arrow3],
            modelValue: vfParams.arrow as string,
            "onUpdate:modelValue": img => {
                vfParams.arrow = renderOpts.arrowImg = img;
            }
        }));
        const arrowCtrl = folder.add(vfParams, 'arrow');
        arrowCtrl.domElement.appendChild(arrowEl);
        arrowCtrl.$widget.remove();
        folder.add(vfParams, 'gap', 10, 80, 1).onChange((v: number) => renderOpts.gap = v);

        //sizemapping
        const handleSizeMappingChange = () => {
            renderOpts.enableSizeMapping = vfParams.enableSizeMapping;
            if (vfParams.enableSizeMapping) {
                sizeRangeCtrls.forEach(i => i.show());
                defaultSizeCtrl.hide();
            } else {
                sizeRangeCtrls.forEach(i => i.hide());
                defaultSizeCtrl.show();
            }
        };
        folder.add(vfParams, 'enableSizeMapping')
            .name('sizeMapping')
            .onChange(handleSizeMappingChange);
        const sizeRangeCtrls = [
            folder.add(vfParams, 'minSize', 10, 80, 1).onChange((v: number) => {
                if (v > vfParams.maxSize) {
                    vfParams.minSize = vfParams.maxSize;
                } else {
                    renderOpts.sizeMapping = [vfParams.minSize, vfParams.maxSize];
                }
            }),
            folder.add(vfParams, 'maxSize', 10, 80, 1).onChange((v: number) => {
                if (v < vfParams.minSize) {
                    vfParams.maxSize = vfParams.minSize;
                } else {
                    renderOpts.sizeMapping = [vfParams.minSize, vfParams.maxSize];
                }
            })
        ];
        const defaultSizeCtrl = folder.add(vfParams, 'defaultSize', 10, 80, 1).name('size')
            .onChange((v: number) => renderOpts.defaultSize = v);
        handleSizeMappingChange();

        //colormapping
        const cmOpts = reactive({
            range: valueRange,
            stops: (renderOpts.colorMapping as ColorMappingRamp).stops,
            format: toFixed1,
            direction: "vertical",
            height: 72,
            style: {
                display: 'none',
            }
        });
        const cmCtrlEl = createAndMount(ColorMapping, { type: 'ramp', data: cmOpts });
        const handleColorMappingChange = () => {
            renderOpts.enableColorMapping = vfParams.enableColorMapping;
            if (vfParams.enableColorMapping) {
                cmOpts.style.display = null;
                defaultColorCtrl.hide();
            } else {
                cmOpts.style.display = 'none';
                defaultColorCtrl.show();
            }
        }
        const cmCtrl = folder.add(vfParams, 'enableColorMapping')
            .name('colorMapping')
            .onChange(handleColorMappingChange);
        cmCtrl.domElement.parentElement.appendChild(cmCtrlEl);
        const defaultColorCtrl = folder.addColor(vfParams, 'defaultArrowColor')
            .name('arrowColor')
            .onChange((c: string) => {
                renderOpts.defaultColor = Color.fromString(c);
            });
        handleColorMappingChange();
    }
}
