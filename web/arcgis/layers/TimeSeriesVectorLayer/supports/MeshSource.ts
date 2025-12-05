import Accessor from "@arcgis/core/core/Accessor";
import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import { type TimeSeriesSource } from "web/arcgis/supports/TimeSeriesSource";
import { MeshGeometry,type MeshGeometryProperties } from "./MeshGeometry";
import { randomUUID } from "web/utils/misc";

export interface MeshSourceProperties {
    type: 'mesh',
    geometry?: MeshGeometryProperties | MeshGeometry,
    timeSource?: TimeSeriesSource,
    dataMappingStrategy: 'per-vertex' | 'per-mesh'
}

@subclass()
export class MeshSource extends Accessor {

    @property()
    geometry: MeshGeometry;

    //数据的映射方式
    @property()
    dataMappingStrategy:
        | 'per-vertex' //逐顶点
        | 'per-mesh'; //逐网格

    @property()
    timeSource: TimeSeriesSource;

    constructor(opts: MeshSourceProperties) {
        super();
        Object.assign(this, opts);
    }
}

