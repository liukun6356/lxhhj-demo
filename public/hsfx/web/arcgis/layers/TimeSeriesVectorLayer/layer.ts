import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import Layer from "@arcgis/core/layers/Layer";
import BaseLayerViewGL2D from "@arcgis/core/views/2d/layers/BaseLayerViewGL2D";
import { numberCast } from "web/arcgis/supports/cast";
import { createGLRenderState } from "web/arcgis/supports/webgl/state";
import { VectorFieldRenderOpts, VectorFieldRenderOptsLoader, type VectorFieldRenderProperties } from "../../supports/vector-field/VectorFieldRenderOpts";
import { createMeshRenderer, type MeshRenderer } from "./renderer/mesh/renderer";
import { MeshGeometry, type MeshGeometryProperties } from "./supports/MeshGeometry";
import { MeshGeometryLoader } from "./supports/MeshGeometryLoader";
import { MeshRenderOpts, MeshRenderOptsLoader, type MeshRenderProperties } from "./supports/MeshRenderOpts";
import { TimeDataRenderOpts, TimeDataRenderOptsLoader, type TimeDataRenderProperties } from "./supports/TimeDataRenderOpts";
import { TimeSourceLoader, type TsVectorTimeSource } from "./supports/TimeSourceLoader";

@subclass()
export class TimeSeriesVectorLayer extends Layer {
    @property({
        cast(v: MeshGeometryProperties) {
            if (!v) return v;
            if (v.type === 'mesh') return new MeshGeometry(v);
            return v;
        }
    })
    geometry: MeshGeometry;

    @property({
        cast: numberCast
    })
    curTime: number;

    @property()
    timeSource: TsVectorTimeSource

    @property()
    vectorFieldTimeSource: TsVectorTimeSource

    @property({
        type: MeshRenderOpts
    })
    meshRenderOpts: MeshRenderOpts;

    @property({
        type: VectorFieldRenderOpts
    })
    vectorFieldRenderOpts: VectorFieldRenderOpts


    @property({
        type: TimeDataRenderOpts
    })
    timeDataRenderOpts: TimeDataRenderOpts;

    constructor(options?: Partial<{
        geometry: MeshGeometry | MeshGeometryProperties,
        curTime: number,
        timeSource: TimeSeriesVectorLayer['timeSource'],
        vectorFieldTimeSource: TimeSeriesVectorLayer['timeSource'],
        meshRenderOpts: MeshRenderOpts | Partial<MeshRenderProperties>,
        timeDataRenderOpts: TimeDataRenderOpts | Partial<TimeDataRenderProperties>,
        vectorFieldRenderOpts: VectorFieldRenderOpts | Partial<VectorFieldRenderProperties>
    }>) {
        super();
        Object.assign(this, options);
    }

    createLayerView(view: __esri.View) {
        if (view.type === '3d') return null;
        const lyView = new TimeSeriesVectorLayerView({
            view: view as __esri.MapView,
            //@ts-ignore
            layer: this,
        });
        return Promise.resolve(lyView);
    }
}

@subclass()
export class TimeSeriesVectorLayerView extends BaseLayerViewGL2D {
    layer: TimeSeriesVectorLayer;
    _geometryLoader: MeshGeometryLoader;
    //
    _timeSourceLoader: TimeSourceLoader;
    _vectorFieldTimeSourceLoader: TimeSourceLoader;
    //
    _meshRenderOptsLoader: MeshRenderOptsLoader;
    _timeDataRenderOptsLoader: TimeDataRenderOptsLoader;
    _vectorFieldRenderOptsLoader: VectorFieldRenderOptsLoader;

    _meshRenderer: MeshRenderer;


    attach(): void {
        const { context: gl, view, layer } = this;
        let _last: {
            geo: MeshGeometry,
            viewCrs: __esri.SpatialReference,
        };
        const h1 = reactiveUtils.watch(
            () => [layer.geometry, view.spatialReference] as const,
            ([geo, viewCrs]) => {
                if (geo !== _last?.geo || viewCrs !== _last?.viewCrs) {
                    this._geometryLoader?.destroy();
                    this._geometryLoader = null;
                    _last = null;
                }
                if (!geo || !viewCrs) return this.requestRender();

                const m = this._meshRenderer ??= createMeshRenderer(this);

                const loader = this._geometryLoader = new MeshGeometryLoader(geo, this);
                loader.once('drawMesh-loaded', () => this.requestRender());
                loader.once('drawZ-loaded', () => this.requestRender());
                loader.once('drawWireframe-loaded', () => this.requestRender());
                if (layer.timeSource || layer.vectorFieldTimeSource) {
                    loader.loadDrawMesh();
                    m.preload('mesh');
                }
                if (layer.vectorFieldTimeSource) {
                    loader.loadDrawMesh();
                    m.preload('vector-field');
                }
                _last = { geo, viewCrs }
            },
            { initial: true }
        );
        const h2 = reactiveUtils.watch(
            () => layer.timeSource,
            source => {
                this._timeSourceLoader?.destroy();
                this._timeSourceLoader = null;
                if (!source) return this.requestRender();
                const s = this._timeSourceLoader = new TimeSourceLoader(gl, source, 'simple');
                s.addHandles(reactiveUtils.watch(
                    () => layer.curTime,
                    t => {
                        s.curTime = t;
                        this.requestRender();
                    },
                    { initial: true }
                ));
                s.curTime = layer.curTime;
                s.on('load-time-data', time => {
                    console.log('timeSource load at time:', time);
                    this.requestRender();
                });
                this._geometryLoader?.loadDrawMesh();
                this._meshRenderer?.preload('mesh');
            },
            { initial: true }
        );
        const h3 = reactiveUtils.watch(
            () => layer.vectorFieldTimeSource,
            source => {
                this._vectorFieldTimeSourceLoader?.destroy();
                this._vectorFieldTimeSourceLoader = null;
                if (!source) return this.requestRender();
                const s = this._vectorFieldTimeSourceLoader = new TimeSourceLoader(gl, source, 'vector');
                s.addHandles(reactiveUtils.watch(
                    () => layer.curTime,
                    t => {
                        s.curTime = t;
                        this.requestRender();
                    },
                    { initial: true }
                ));
                s.curTime = layer.curTime;
                s.on('load-time-data', time => {
                    console.log('timeSource load at time:', time);
                    this.requestRender();
                });
                this._geometryLoader?.loadDrawMesh();
                this._meshRenderer?.preload('mesh');
            },
            { initial: true }
        );
        const h4 = reactiveUtils.watch(
            () => layer.meshRenderOpts,
            opts => {
                this._meshRenderOptsLoader?.destroy();
                this._meshRenderOptsLoader = null;
                if (!opts) return this.requestRender();
                this._meshRenderOptsLoader = new MeshRenderOptsLoader(opts, this);
                opts.addHandles(reactiveUtils.watch(
                    () => opts.renderZ,
                    (show) => show && this._geometryLoader?.loadDrawZ() && this._meshRenderer?.preload('mesh'),
                    { initial: true }
                ));
                opts.addHandles(reactiveUtils.watch(
                    () => opts.showMeshLine,
                    show => show && this._geometryLoader?.loadDrawWireframe() && this._meshRenderer?.preload('wireframe'),
                    { initial: true }
                ));
            },
            { initial: true }
        );
        const h5 = reactiveUtils.watch(
            () => layer.timeDataRenderOpts,
            opts => {
                this._timeDataRenderOptsLoader?.destroy();
                this._timeDataRenderOptsLoader = null;
                if (!opts) return this.requestRender();
                this._timeDataRenderOptsLoader = new TimeDataRenderOptsLoader(opts, this);
            },
            { initial: true }
        );
        const h6 = reactiveUtils.watch(
            () => layer.vectorFieldRenderOpts,
            opts => {
                this._vectorFieldRenderOptsLoader?.destroy();
                this._vectorFieldRenderOptsLoader = null;
                if (!opts) return this.requestRender();
                const r = this._vectorFieldRenderOptsLoader = new VectorFieldRenderOptsLoader(opts, this.context);
                r.on('change', () => this.requestRender());
                this._geometryLoader?.loadDrawMesh();
                this._meshRenderer?.preload('vector-field');
            },
            { initial: true }
        )
        this.addHandles([h2, h1, h3, h4, h5, h6]);
    }

    render({ state }: __esri.BaseLayerViewGL2DRenderRenderParameters): void {
        if (this._geometryLoader?.type === 'mesh') {
            const rt = this.getRenderTarget();
            this._meshRenderer.render({
                state,
                renderState: createGLRenderState(this.context, rt),
                defaultRT: rt,
            });
        }
    }

    destroy() {
        super.destroy();
    }
}