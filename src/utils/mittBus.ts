// 事件总线Bus
import mitt, {Emitter} from "mitt";

// 定义类型别名，因全局使用并且需要自定义事件名称，所以使用索引签名定义内容
type Events = {
    /* 全局 */
    toggleLayer: { bool: boolean, key: string },// 切换地图图层
    toggmap2dOr3d: { type: "2d" | "3d" },// 切换地图 二维/三维
    toggleMapBoundary: { type: "old" | "hydrology" },// 切换地图反遮罩轮廓
    resetControlPanel: { label?: string } | null,// 清空地图工具栏操作
    mapResetCamera: {type?: "2d" | "3d",destination2d?:any,destination3d?:any}|null,//地图恢复默认视角
    [propName: string]: any;
};
// 提供泛型参数让 emitter 能自动推断参数类型
const mittBus: Emitter<Events> = mitt<Events>();
export default mittBus;
