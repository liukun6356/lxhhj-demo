import * as Cesium from "cesium";
import { DrawPolyline } from "./Draw.Polyline";
import { getMaxHeight } from "../../util/point";
import { isNumber } from "../../util/util";

import * as attr from "../attr/Attr.Rectangle";
import { style2Entity as polylineStyle2Entity } from "../attr/Attr.Polyline";
import { EditRectangle } from "../edit/Edit.Rectangle";

export class DrawRectangle extends DrawPolyline {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "rectangle";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditRectangle; //获取编辑对象

    this._minPointNum = 2; //至少需要点的个数
    this._maxPointNum = 2; //最多允许点的个数
  }

  getRectangle() {
    var positions = this.getDrawPosition();
    if (positions.length < 2) return null;
    return Cesium.Rectangle.fromCartesianArray(positions);
  }
  //根据attribute参数创建Entity
  createFeature(attribute, dataSource) {
    dataSource = dataSource || this.dataSource;
    this._positions_draw = [];

    var that = this;
    var addattr = {
      rectangle: attr.style2Entity(attribute.style),
      attribute: attribute
    };
    addattr.rectangle.coordinates = new Cesium.CallbackProperty(time => {
      return that.getRectangle();
    }, false);

    //线：边线宽度大于1时用polyline
    var lineStyle = {
      color: attribute.style.outlineColor,
      width: attribute.style.outlineWidth,
      opacity: attribute.style.outlineOpacity,
      ...(attribute.style.outlineStyle || {})
    };
    addattr.polyline = polylineStyle2Entity(lineStyle, {
      clampToGround: attribute.style.clampToGround,
      arcType: Cesium.ArcType.RHUMB,
      outline: false,
      show: false
    });

    this.entity = dataSource.entities.add(addattr); //创建要素对象
    this.entity._positions_draw = this._positions_draw;
    this.bindOutline(this.entity, lineStyle); //边线

    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.rectangle);
  }
  bindOutline(entity, lineStyle) {
    var attribute = entity.attribute;

    //本身的outline需要隐藏
    entity.rectangle.outline = new Cesium.CallbackProperty(time => {
      return attribute.style.outline && attribute.style.outlineWidth == 1;
    }, false);

    //是否显示：边线宽度大于1时
    entity.polyline.show = new Cesium.CallbackProperty(time => {
      return attribute.style.outline && attribute.style.outlineWidth > 1;
    }, false);
    entity.polyline.positions = new Cesium.CallbackProperty(time => {
      if (!entity.polyline.show.getValue(time)) return null;
      if (!entity._positions_draw) return null;

      return attr.getOutlinePositions(entity);
    }, false);
    entity.polyline.width = new Cesium.CallbackProperty(time => {
      return entity.rectangle.outlineWidth;
    }, false);
    //虚线等情况下不支持动态修改颜色,只有实线可以动态改颜色。
    if (!lineStyle.lineType || lineStyle.lineType == "solid") {
      entity.polyline.material = new Cesium.ColorMaterialProperty(
        new Cesium.CallbackProperty(time => {
          return entity.rectangle.outlineColor.getValue(time);
        }, false)
      );
    }
  }
  updateAttrForDrawing() {
    var style = this.entity.attribute.style;
    if (!style.clampToGround) {
      var maxHight = getMaxHeight(this.getDrawPosition());
      if (maxHight != 0) {
        this.entity.rectangle.height = maxHight;
        style.height = maxHight;

        if (style.extrudedHeight && isNumber(style.extrudedHeight))
          this.entity.rectangle.extrudedHeight = maxHight + Number(style.extrudedHeight);
      }
    }
  }
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    entity._positions_draw = this._positions_draw;
    //entity.rectangle.coordinates = this.getRectangle();
    entity.rectangle.coordinates = new Cesium.CallbackProperty(time => {
      if (entity._positions_draw.length < 2) return null;
      return Cesium.Rectangle.fromCartesianArray(entity._positions_draw);
    }, false);
  }
}
