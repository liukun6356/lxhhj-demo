import ExtentProperties = __esri.ExtentProperties;

//vtile选项
export interface VTOption {
    maxZoom: number; //切片最大zoom,默认14
    indexMaxZoom: number; //初始平铺索引的最大缩放, 是一开始就直接生成的. zoom大于此值的切片是动态生成的, 默认5
    indexMaxPoints: number; //每个瓦片的最大点数, 单个切片点超过此值会继续向下分裂,默认100000
    tolerance: number; //容差(像素单位), 小于此阈值的点会被剔除简化,默认3
    polygonBuffer: number; //tile每个边向外扩张的范围(百分比值0-1), 默认0.01
    polylineBuffer: number; //tile每个边向外扩张的范围(百分比值0-1), 默认0.01
    pointBuffer: number; //tile每个边向外扩张的范围(百分比值0-1), 默认0.01
    debug: boolean;
}

//原始要素
export interface FeaturePoint {
    type: "point";
    id: number;
    attributes?: any;
    x: number;
    y: number;
}

export interface FeaturePolyline {
    type: "polyline";
    id: number;
    attributes?: any;
    extent: __esri.ExtentProperties;
    path: number[][];
    length: number;
    distance?: number[]; //每个点到起点的距离
    beforePoint?: number[]; //前一个点
    afterPoint?: number[]; //后一个点
}

export interface FeaturePolygon {
    type: "polygon";
    id: number;
    attributes?: any;
    extent: __esri.ExtentProperties;
    rings: number[][][];
}

export type EsriFeature = FeaturePoint | FeaturePolyline | FeaturePolygon;

//裁剪上下文
export interface VLineClipContext {
    size: number; //估算尺寸, 在裁剪简化过程中，若小于阈值会被丢弃。
    points: number[]; // [x1,y1,tolerance1, x2,y2,tolerance2 ....], 在裁剪简化过程中，若tolerance小于阈值会被丢弃。
    distance?: number[]; // 点对应的到起点的距离(仅线可用),与points一一对应
    beforePoint?: number[];
    afterPoint?: number[];
}

export interface VPolyline {
    type: "vpolyline";
    id: number;
    attributes?: any;
    extent: ExtentProperties;
    geometry: VLineClipContext;
    originTotalLength: number; //所属polyline的总长度
}

export interface VPolygon {
    type: "vpolygon";
    id: number;
    attributes?: any;
    extent: ExtentProperties;
    geometry: VLineClipContext[];
}

export type VFeature = FeaturePoint | VPolyline | VPolygon;

export interface VTileInfo {
    id: string;
    z: number;
    x: number;
    y: number;
    resolution: number;
    scale: number;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    width: number;
    height: number;
    cx: number;
    cy: number;
}

export interface VTile {
    id: string; //tileId,
    tile: VTileInfo;
    source: VFeature[]; //数据源, 未简化
    sourceExtent: ExtentProperties; //数据源几何范围
    features: EsriFeature[]; //简化后图元
    featuresExtent: ExtentProperties; //简化后图元的范围, 可能小于sourceExtent
    numPoints: number; //总点数,
    numSimplify: number; //简化后点数
    _inheritFeatureFrom?: string; //继承数据源id
}
