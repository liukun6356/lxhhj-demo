import * as Cesium from "cesium";
import { EditPolygon } from "./Edit.Polygon";

//用于外部扩展使用，绘制的点与显示的点不一致的标号

export class EditPolygonEx extends EditPolygon {
  //========== 构造方法 ==========
  constructor(entity, viewer) {
    super(entity, viewer);

    this._hasMidPoint = false;
  }

  //修改坐标会回调，提高显示的效率
  changePositionsToCallback() {
    this._positions_draw = this.entity._positions_draw;
    this._positions_show = this.entity._positions_show;
  }
  //坐标位置相关
  updateAttrForEditing() {
    if (this._positions_draw == null || this._positions_draw.length < this._minPointNum) {
      this._positions_show = this._positions_draw;
      return;
    }
    this._positions_show = this.getShowPositions(this._positions_draw, this.entity.attribute);

    this.entity._positions_show = this._positions_show;
    super.updateAttrForEditing();
  }
  //子类中重写 ，根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return positions;
  }
  //图形编辑结束后调用
  finish() {
    this.entity._positions_show = this._positions_show;
    this.entity._positions_draw = this._positions_draw;
  }
}
