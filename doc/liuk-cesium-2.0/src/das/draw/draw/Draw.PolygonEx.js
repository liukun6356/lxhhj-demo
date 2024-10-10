import * as Cesium from "cesium";
import { DrawPolygon } from "./Draw.Polygon";

//用于外部扩展使用，绘制的点与显示的点不一致的标号

export class DrawPolygonEx extends DrawPolygon {
  getDrawPosition() {
    return this._positions_show;
  }
  updateAttrForDrawing() {
    if (this._positions_draw == null || this._positions_draw.length < this._minPointNum) {
      this._positions_show = this._positions_draw;
      return;
    }

    this._positions_show = this.getShowPositions(this._positions_draw, this.entity.attribute);
    super.updateAttrForDrawing();
  }
  //子类中重写 ，根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return positions;
  }
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    //抛弃多余的无效绘制点
    if (this._positions_draw.length > this._maxPointNum)
      this._positions_draw.splice(
        this._maxPointNum,
        this._positions_draw.length - this._maxPointNum
      );

    this.entity._positions_draw = this._positions_draw;
    this.entity._positions_show = this._positions_show;

    entity.polygon.hierarchy = new Cesium.CallbackProperty(time => {
      var positions = entity._positions_show;
      return new Cesium.PolygonHierarchy(positions);
    }, false);

    this._positions_draw = null;
    this._positions_show = null;
  }
  toGeoJSON(entity) {
    return this.attrClass.toGeoJSON(entity, true); //不用闭合最后一个点
  }
}
