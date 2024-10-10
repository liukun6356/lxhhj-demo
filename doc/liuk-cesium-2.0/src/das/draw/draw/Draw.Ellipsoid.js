import * as Cesium from "cesium";
import { DrawPolyline } from "./Draw.Polyline";
import * as attr from "../attr/Attr.Ellipsoid";
import { EditEllipsoid } from "../edit/Edit.Ellipsoid";
import { getEllipseOuterPositions } from "../../util/polygon";

export class DrawEllipsoid extends DrawPolyline {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "ellipsoid";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditEllipsoid; //获取编辑对象

    this._minPointNum = 2; //至少需要点的个数
    this._maxPointNum = 3; //最多允许点的个数
  }

  getShowPosition(time) {
    if (this._positions_draw && this._positions_draw.length > 0) return this._positions_draw[0];
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
      ellipsoid: attr.style2Entity(attribute.style),
      attribute: attribute
    };

    this.entity = dataSource.entities.add(addattr); //创建要素对象
    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.ellipsoid);
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
    style.radii_x = radius; //短半轴
    style.radii_z = radius;

    //长半轴
    var semiMajorAxis;
    if (this._positions_draw.length == 3) {
      semiMajorAxis = this.formatNum(
        Cesium.Cartesian3.distance(this._positions_draw[0], this._positions_draw[2]),
        2
      );
    } else {
      semiMajorAxis = radius;
    }
    style.radii_y = semiMajorAxis;

    this.updateRadii(style);
  }
  updateRadii(style) {
    var radii = new Cesium.Cartesian3(style.radii_x, style.radii_y, style.radii_z);
    if (this.entity.ellipsoid.radii) this.entity.ellipsoid.radii.setValue(radii);
    else this.entity.ellipsoid.radii = radii;
  }
  addPositionsForRadius(position) {
    var style = this.entity.attribute.style;

    //获取圆（或椭圆）边线上的坐标点数组
    var outerPositions = getEllipseOuterPositions({
      position: position,
      semiMajorAxis: Number(style.radii_x), //长半轴
      semiMinorAxis: Number(style.radii_y), //短半轴
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    });

    //长半轴上的坐标点
    this._positions_draw.push(outerPositions[0]);

    //短半轴上的坐标点
    this._positions_draw.push(outerPositions[1]);
  }
  //图形绘制结束后调用
  finish() {
    // this.entity.editing = this.getEditClass(this.entity); //绑定编辑对象
    // this.entity._positions_draw = this._positions_draw;
    // this.entity.position = this.getShowPosition();

    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    entity._positions_draw = this._positions_draw;
    entity.position = new Cesium.CallbackProperty(time => {
      if (entity._positions_draw && entity._positions_draw.length > 0)
        return entity._positions_draw[0];
      return null;
    }, false);
  }
}
