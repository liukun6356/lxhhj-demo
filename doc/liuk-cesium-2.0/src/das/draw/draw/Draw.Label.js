import * as Cesium from "cesium";
import { DrawPoint } from "./Draw.Point";
import * as attr from "../attr/Attr.Label";

export class DrawLabel extends DrawPoint {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "label";
    this.attrClass = attr; //对应的属性控制静态类
  }

  //根据attribute参数创建Entity
  createFeature(attribute, dataSource) {
    dataSource = dataSource || this.dataSource;
    this._positions_draw = null;

    //绘制时，是否自动隐藏entity，可避免拾取坐标存在问题。
    var _drawShow = Cesium.defaultValue(attribute.drawShow, false);

    var that = this;
    var addattr = {
      show: _drawShow,
      _drawShow: _drawShow, //edit编辑时使用
      position: new Cesium.CallbackProperty(time => {
        return that.getDrawPosition();
      }, false),
      label: attr.style2Entity(attribute.style),
      attribute: attribute
    };
    this.entity = dataSource.entities.add(addattr); //创建要素对象
    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.label);
  }
}
