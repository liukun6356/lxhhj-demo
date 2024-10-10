import * as Cesium from "cesium";
import { DrawPolyline } from "./Draw.Polyline";
import { addPositionsHeight } from "../../util/point";
import * as attr from "../attr/Attr.Cylinder";
import { EditCylinder } from "../edit/Edit.Cylinder";
import { getEllipseOuterPositions } from "../../util/polygon";

export class DrawCylinder extends DrawPolyline {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "cylinder";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditCylinder; //获取编辑对象

    this._minPointNum = 2; //至少需要点的个数
    this._maxPointNum = 2; //最多允许点的个数
  }

  getShowPosition(time) {
    if (this._positions_draw && this._positions_draw.length > 1)
      return addPositionsHeight(
        this._positions_draw[0],
        this.entity.cylinder.length.getValue(time) / 2
      );
    return null;
  }
  //根据attribute参数创建Entity
  createFeature(attribute, dataSource) {
    dataSource = dataSource || this.dataSource;
    this._positions_draw = [];

    var that = this;
    var addattr = {
      position: new Cesium.CallbackProperty(time => {
        return that.getShowPosition(time);
      }, false),
      cylinder: attr.style2Entity(attribute.style),
      attribute: attribute
    };

    this.entity = dataSource.entities.add(addattr); //创建要素对象
    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.cylinder);
  }
  updateAttrForDrawing(isLoad) {
    if (!this._positions_draw) return;

    if (isLoad) {
      if (this._positions_draw instanceof Cesium.Cartesian3) {
        this._positions_draw = [this._positions_draw];
      }
      this.addPositionsForRadius(this._positions_draw[0]);
      return;
    }

    if (this._positions_draw.length < 2) return;

    var style = this.entity.attribute.style;

    //半径处理
    var radius = this.formatNum(
      Cesium.Cartesian3.distance(this._positions_draw[0], this._positions_draw[1]),
      2
    );
    this.entity.cylinder.bottomRadius = radius;

    style.topRadius = this.entity.cylinder.topRadius.getValue(this.viewer.clock.currentTime);
    style.bottomRadius = radius;
  }
  addPositionsForRadius(position) {
    var style = this.entity.attribute.style;

    //获取圆（或椭圆）边线上的坐标点数组
    var outerPositions = getEllipseOuterPositions({
      position: position,
      semiMajorAxis: style.bottomRadius, //长半轴
      semiMinorAxis: style.bottomRadius //短半轴
    });

    //长半轴上的坐标点
    this._positions_draw.push(outerPositions[0]);
  }
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    entity._positions_draw = this._positions_draw;
    //this.entity.position = this.getShowPosition();
    entity.position = new Cesium.CallbackProperty(time => {
      if (entity._positions_draw && entity._positions_draw.length > 0)
        return addPositionsHeight(
          entity._positions_draw[0],
          entity.cylinder.length.getValue(time) / 2
        );
      return null;
    }, false);
  }
}
