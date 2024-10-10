import * as Cesium from "cesium";
import { DrawPoint } from "./Draw.Point";
import * as attr from "../attr/Attr.Billboard";
import { style2Entity as labelStyle2Entity } from "../attr/Attr.Label";

export class DrawBillboard extends DrawPoint {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "billboard";
    //对应的属性控制静态类
    this.attrClass = attr;
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
      billboard: attr.style2Entity(attribute.style),
      attribute: attribute
    };

    if (attribute.style && attribute.style.label) {
      //同时加文字
      addattr.label = labelStyle2Entity(attribute.style.label);
    }

    this.entity = dataSource.entities.add(addattr); //创建要素对象
    this.updateAttrForDrawing();
    return this.entity;
  }
  style2Entity(style, entity) {
    if (this.updateFeatureEx) {
      //setTimeout是为了优化效率
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
      }
      this.updateTimer = setTimeout(() => {
        delete this.updateTimer;
        this.updateFeatureEx(style, entity);
      }, 300);
    }

    if (style && style.label) {
      //同时加文字
      labelStyle2Entity(style.label, entity.label);
    }
    return attr.style2Entity(style, entity.billboard);
  }
  updateAttrForDrawing() {
    var entity = this.entity;

    if (this.updateFeatureEx) {
      //setTimeout是为了优化效率
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
      }
      this.updateTimer = setTimeout(() => {
        delete this.updateTimer;
        if (!entity) return;
        this.updateFeatureEx(entity.attribute.style, entity);
      }, 300);
    }
  }
  //图形绘制结束,更新属性
  finish() {
    if (this.updateFeatureEx && this.updateTimer) {
      clearTimeout(this.updateTimer);
      delete this.updateTimer;
      this.updateFeatureEx(this.entity.attribute.style, this.entity);
    }
    this.entity.show = true;

    this.entity.editing = this.getEditClass(this.entity); //绑定编辑对象
    this.entity.position = this.getDrawPosition();
  }
}
