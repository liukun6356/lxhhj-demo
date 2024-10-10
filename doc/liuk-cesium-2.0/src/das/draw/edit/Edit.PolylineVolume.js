import * as Cesium from "cesium";
import { EditPolyline } from "./Edit.Polyline";

export class EditPolylineVolume extends EditPolyline {
  //取enity对象的对应矢量数据
  getGraphic() {
    return this.entity.polylineVolume;
  }
  //修改坐标会回调，提高显示的效率
  changePositionsToCallback() {
    this._positions_draw = this.entity._positions_draw;
  }
}
