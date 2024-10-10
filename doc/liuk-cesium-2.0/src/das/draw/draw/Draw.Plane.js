import * as Cesium from "cesium";
import { DrawPoint } from "./Draw.Point";
import * as attr from "../attr/Attr.Plane";
import { EditPlane } from "../edit/Edit.Plane";

export class DrawPlane extends DrawPoint {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "plane";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditPlane; //获取编辑对象
  }
  //根据attribute参数创建Entity
  createFeature(attribute, dataSource) {
    dataSource = dataSource || this.dataSource;
    this._positions_draw = null;

    var that = this;
    var addattr = {
      position: new Cesium.CallbackProperty(time => {
        return that.getDrawPosition();
      }, false),
      plane: attr.style2Entity(attribute.style),
      attribute: attribute
    };
    this.entity = dataSource.entities.add(addattr); //创建要素对象
    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.plane);
  }
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    entity._positions_draw = this.getDrawPosition();
    entity.position = new Cesium.CallbackProperty(time => {
      return entity._positions_draw;
    }, false);
  }
}
