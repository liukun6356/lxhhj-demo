import * as Cesium from "cesium";
import { DrawPolyline } from "./Draw.Polyline";
import { getMaxHeight } from "../../util/point";

import * as attr from "../attr/Attr.PolylineVolume";
import { EditPolylineVolume } from "../edit/Edit.PolylineVolume";

export class DrawPolylineVolume extends DrawPolyline {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "polylineVolume";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditPolylineVolume; //获取编辑对象

    this._minPointNum = 2; //至少需要点的个数
    this._maxPointNum = 9999; //最多允许点的个数
  }

  //根据attribute参数创建Entity
  createFeature(attribute, dataSource) {
    dataSource = dataSource || this.dataSource;
    this._positions_draw = [];

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum;
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum;

    if (attribute.config) {
      //允许外部传入
      this._minPointNum = attribute.config.minPointNum || this._minPointNum_def;
      this._maxPointNum = attribute.config.maxPointNum || this._maxPointNum_def;
    } else {
      this._minPointNum = this._minPointNum_def;
      this._maxPointNum = this._maxPointNum_def;
    }

    var that = this;
    var addattr = {
      polylineVolume: attr.style2Entity(attribute.style),
      attribute: attribute
    };
    addattr.polylineVolume.positions = new Cesium.CallbackProperty(time => {
      return that.getDrawPosition();
    }, false);

    this.entity = dataSource.entities.add(addattr); //创建要素对象
    this.entity._positions_draw = this._positions_draw;

    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.polylineVolume);
  }
  updateAttrForDrawing() {}
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    entity._positions_draw = this.getDrawPosition();
    entity.polylineVolume.positions = new Cesium.CallbackProperty(time => {
      return entity._positions_draw;
    }, false);
  }
}
