import * as Cesium from "cesium";
import { EditPolyline } from "./Edit.Polyline";
import { line2curve } from "../attr/Attr.Polyline";

export class EditCurve extends EditPolyline {
  //修改坐标会回调，提高显示的效率
  changePositionsToCallback() {
    this._positions_draw = this.entity._positions_draw;
    this._positions_show =
      this.entity._positions_show ||
      this.getGraphic().positions.getValue(this.viewer.clock.currentTime);
  }
  //坐标位置相关
  updateAttrForEditing() {
    if (this._positions_draw == null || this._positions_draw.length < 3) {
      this._positions_show = this._positions_draw;
      return;
    }

    this._positions_show = line2curve(this._positions_draw, this.entity.attribute.style.closure);
    this.entity._positions_show = this._positions_show;
  }
  //图形编辑结束后调用
  finish() {
    this.entity._positions_show = this._positions_show;
    this.entity._positions_draw = this._positions_draw;
  }
}
