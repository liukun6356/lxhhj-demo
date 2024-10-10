import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import { getPositionValue } from "../../util/point";
import { DrawPoint } from "./Draw.Point";
import * as attr from "../attr/Attr.Model";
import { style2Entity as labelStyle2Entity } from "../attr/Attr.Label";
import { EditModel } from "../edit/Edit.Model";

export class DrawModel extends DrawPoint {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "model";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditModel; //获取编辑对象
  }

  //根据attribute参数创建Entity
  createFeature(attribute, dataSource) {
    dataSource = dataSource || this.dataSource;
    this._positions_draw = null;

    //绘制时，是否自动隐藏模型，可避免拾取坐标存在问题。
    var _drawShow = Cesium.defaultValue(attribute.drawShow, false);
    attribute.style.radius = Cesium.defaultValue(attribute.style.radius, 100); //默认值
    attribute.editType = Cesium.defaultValue(attribute.editType, "point"); //默认值

    var that = this;
    var addattr = {
      show: true, //_drawShow
      _drawShow: _drawShow, //edit编辑时使用
      position: new Cesium.CallbackProperty(time => {
        return that.getDrawPosition();
      }, false),
      model: attr.style2Entity(attribute.style),
      attribute: attribute
    };

    if (attribute.style && attribute.style.label) {
      //同时加文字
      addattr.label = labelStyle2Entity(attribute.style.label);
    }

    this.entity = dataSource.entities.add(addattr); //创建要素对象
    this.entity.loadOk = false;
    this.entity.draw_tooltip = "加载模型中…";
    this.entity.readyPromise = (entity, model) => {
      delete this.entity.draw_tooltip;

      entity.loadOk = true;
      entity.attribute.style.radius = model.boundingSphere.radius;

      this.fire(eventType.load, { drawtype: this.type, entity: entity, model: model });
    };

    //10s超时容错处理
    // setTimeout(() => {
    //     if (!this.entity || this.entity.loadOk) return
    //     this.entity.loadOk = true
    // }, 10000);

    return this.entity;
  }
  //判断gltf是否加载完成
  isLoadOk() {
    return this.entity.loadOk;
  }
  style2Entity(style, entity) {
    this.updateOrientation(style, entity);
    if (style && style.label) {
      //同时加文字
      labelStyle2Entity(style.label, entity.label);
    }
    return attr.style2Entity(style, entity.model);
  }
  updateAttrForDrawing() {
    this.updateOrientation(this.entity.attribute.style, this.entity);
  }
  //角度更新
  updateOrientation(style, entity) {
    var position = getPositionValue(entity.position);
    if (position == null) return;

    var heading = Cesium.Math.toRadians(Number(style.heading || 0.0));
    var pitch = Cesium.Math.toRadians(Number(style.pitch || 0.0));
    var roll = Cesium.Math.toRadians(Number(style.roll || 0.0));

    var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  }
}
