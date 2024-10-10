import * as Cesium from "cesium";
import * as attr from "../attr/Attr.Polygon";
import { EditPolyline } from "./Edit.Polyline";
import { getMaxHeight } from "../../util/point";
import { isNumber } from "../../util/util";

export class EditPolygon extends EditPolyline {
  //========== 构造方法 ==========
  constructor(entity, viewer) {
    super(entity, viewer);

    //是否首尾相连闭合（线不闭合，面闭合），用于处理中间点
    this.hasClosure = true;
  }

  //取enity对象的对应矢量数据
  getGraphic() {
    return this.entity.polygon;
  }
  //修改坐标会回调，提高显示的效率
  changePositionsToCallback() {
    this._positions_draw = this.entity._positions_draw || attr.getPositions(this.entity);
  }
  isClampToGround() {
    return this.entity.attribute.style.hasOwnProperty("clampToGround")
      ? this.entity.attribute.style.clampToGround
      : !this.entity.attribute.style.perPositionHeight;
  }
  updateAttrForEditing() {
    var style = this.entity.attribute.style;
    if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
      //存在extrudedHeight高度设置时
      var maxHight = getMaxHeight(this.getPosition());
      this.getGraphic().extrudedHeight = maxHight + Number(style.extrudedHeight);
    }
  }
  //图形编辑结束后调用
  finish() {
    this.entity._positions_draw = this.getPosition();
  }
}
