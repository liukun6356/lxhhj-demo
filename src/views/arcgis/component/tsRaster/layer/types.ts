import { CanvasTexture } from "three";
import { TaskId } from "./misc";
import { EnumTaskStatus } from "./common";
import { VTileInfo } from "./interface";

export type RasterTimeData = ArrayLike<number>;

export type TimeSeriesRasterSourceType =
    | "simple" //简单值(默认) 单通道, 例如灰度图
    | "vector-field"; //矢量场, 2个分量, 例如流场图;

export type TimeSeriesRasterSource = {
    type: TimeSeriesRasterSourceType;
    times: number[]; //时间序列
    dataGetter: RasterTimeDataGetter; //获取时间数据
    col: number; //多少列
    row: number; //多少行
    extent: __esri.ExtentProperties; //栅格范围
    crs: __esri.SpatialReferenceProperties; //坐标系
    noDataValue: number; //无效值
};

export type RasterTimeDataGetter = (time: number, index: number) => Promise<RasterTimeData>;

//瓦片投影后的数据
export type RasterTileProjectedData = {
    type: TimeSeriesRasterSourceType;
    imagebitmap: ImageBitmap;
    range: number[]; //值域范围
    time: number; //时间
    tileId: string; //瓦片id
    costTime: number; //花费时间
    worker?: {
        //debug信息,
        id: number; //线程id
        taskId: TaskId; //任务编号
    };
};

export type RasterRenderResources = {
    renderExtent: __esri.Extent;
    renderTiles: {
        vTileNode: VTileInfo;
        data1: RasterTileRenderResource;
        data2: RasterTileRenderResource;
        key1: string;
        key2: string;
        id: string;
    }[];
    percent: number;
};

//瓦片渲染数据
export type RasterTileRenderResource = {
    range: number[];
    imagebitmap: ImageBitmap;
    tex: CanvasTexture;
};

//瓦片任务记录
export type RasterTileRecord = {
    key: string;
    time: number;
    tileId: string;
    isEmpty: boolean;
    status: EnumTaskStatus;
};
