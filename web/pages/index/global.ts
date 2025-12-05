import esriConfig from "@arcgis/core/config";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import TileInfo from '@arcgis/core/layers/support/TileInfo';
import Map2d from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import 'element-plus/dist/index.css';
import { ReprojTileLayer } from "web/arcgis/layers/ReprojTileLayer/ReprojTileLayer";
import './style.scss';
import { toFixed1 } from "web/utils/formatter";
import TimePlayerVue from "web/components/time-player.vue";
import { EventEmitter } from "web/utils/EventEmitter";
const root = location.href;
esriConfig.assetsPath = new URL('/arcgis-core/assets', root).href;
esriConfig.fontsUrl = new URL('/arcgis-fonts/', root).href;
esriConfig.workers.workerPath = new URL('/arcgis-worker/RemoteClient.js', root).href;

const tk = '85c9d12d5d691d168ba5cb6ecaa749eb';

let ctx: ReturnType<typeof create>
export function getGlobalCtx() {
    return ctx ??= create();
}
function create() {
    const basemap = new ReprojTileLayer({
        id: 'basemap',
        tileInfo: null,
        source: {
            //cacheKey: 'ARCGIS_World_Imagery_3857_to_4547',
            url: `http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}&tk=${tk}`,
            //url: `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
            tileInfo: TileInfo.create({ spatialReference: SpatialReference.WebMercator })
        }
    });
    const view = window.$view = new MapView({
        container: document.querySelector('#map') as HTMLDivElement,
        ui: {
            components: []
        },
        constraints: {},
        map: new Map2d({
            basemap: null,
            layers: [basemap]
        })
    });
    const timeProps = reactive({
        timeRange: { min: 0, max: 60 },
        step: 60 / 720,
        playSpeed: 60 / 720 / 30,
        timeFormat: toFixed1,
        curTime: 0,
        'onUpdate:cur-time': (v: number) => timeProps.curTime = v
    });
    const instance = createApp(() => h(TimePlayerVue, timeProps));
    instance.mount(document.createElement('div'));
    document.body.appendChild(instance._container.firstElementChild as HTMLDivElement);
    return {
        view,
        basemap,
        timeProps
    }
}



