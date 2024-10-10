import * as Cesium from "cesium";
import { DrawPolyline } from "./Draw.Polyline";
import { line2curve } from "../attr/Attr.Polyline";
import { EditCurve } from "../edit/Edit.Curve";

export class DrawCurve extends DrawPolyline {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "curve";
    this.editClass = EditCurve; //获取编辑对象
  }

  getDrawPosition() {
    return this._positions_show;
  }
  updateAttrForDrawing() {
    if (this._positions_draw == null || this._positions_draw.length < 3) {
      this._positions_show = this._positions_draw;
      return;
    }

    this._positions_show = line2curve(this._positions_draw, this.entity.attribute.style.closure);
  }
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    this.entity._positions_draw = this._positions_draw;
    this.entity._positions_show = this._positions_show;

    entity.polyline.positions = new Cesium.CallbackProperty(time => {
      return entity._positions_show;
    }, false);

    this._positions_show = null;
  }
}
