import * as Cesium from "cesium";
import { DrawPolyline } from "./Draw.Polyline";

import * as attr from "../attr/Attr.Wall";
import { EditWall } from "../edit/Edit.Wall";

export class DrawWall extends DrawPolyline {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "wall";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditWall; //获取编辑对象

    this._minPointNum = 2; //至少需要点的个数
    this._maxPointNum = 9999; //最多允许点的个数

    this.maximumHeights = null;
    this.minimumHeights = null;
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

    this.maximumHeights = [];
    this.minimumHeights = [];

    var that = this;
    var addattr = {
      wall: attr.style2Entity(attribute.style),
      attribute: attribute
    };
    addattr.wall.positions = new Cesium.CallbackProperty(time => {
      var arr = that.getDrawPosition();
      if (attribute.style.closure) return arr.concat(arr[0]);
      //闭合
      else return arr;
    }, false);
    addattr.wall.minimumHeights = new Cesium.CallbackProperty(time => {
      var arr = that.getMinimumHeights();
      if (attribute.style.closure) return arr.concat(arr[0]);
      //闭合
      else return arr;
    }, false);
    addattr.wall.maximumHeights = new Cesium.CallbackProperty(time => {
      var arr = that.getMaximumHeights();
      if (attribute.style.closure) return arr.concat(arr[0]);
      //闭合
      else return arr;
    }, false);

    this.entity = dataSource.entities.add(addattr); //创建要素对象
    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.wall);
  }
  getMaximumHeights(entity) {
    return this.maximumHeights;
  }
  getMinimumHeights(entity) {
    return this.minimumHeights;
  }
  updateAttrForDrawing() {
    var style = this.entity.attribute.style;
    var position = this.getDrawPosition();
    var len = position.length;

    this.maximumHeights = new Array(len);
    this.minimumHeights = new Array(len);

    for (var i = 0; i < len; i++) {
      var height = Cesium.Cartographic.fromCartesian(position[i]).height;
      this.minimumHeights[i] = height;
      this.maximumHeights[i] = height + Number(style.extrudedHeight);
    }
  }
  //获取外部entity的坐标到_positions_draw
  setDrawPositionByEntity(entity) {
    var positions = this.getPositions(entity);
    this._positions_draw = positions;

    var time = this.viewer.clock.currentTime;
    this._minimumHeights = entity.wall.minimumHeights && entity.wall.minimumHeights.getValue(time);
    this._maximumHeights = entity.wall.maximumHeights && entity.wall.maximumHeights.getValue(time);
    if (
      !this._minimumHeights ||
      this._minimumHeights.length == 0 ||
      !this._maximumHeights ||
      this._maximumHeights.length == 0
    )
      return;

    entity.attribute.style = entity.attribute.style || {};
    entity.attribute.style.extrudedHeight = this._maximumHeights[0] - this._minimumHeights[0];
  }
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象
    // this.entity.wall.positions = this.getDrawPosition();
    // this.entity.wall.minimumHeights = this.getMinimumHeights();
    // this.entity.wall.maximumHeights = this.getMaximumHeights();

    entity._positions_draw = this.getDrawPosition();
    entity.wall.positions = new Cesium.CallbackProperty(time => {
      var arr = entity._positions_draw;
      if (entity.attribute.style.closure) return arr.concat(arr[0]);
      //闭合
      else return arr;
    }, false);

    entity._minimumHeights = this.getMinimumHeights();
    entity.wall.minimumHeights = new Cesium.CallbackProperty(time => {
      var arr = entity._minimumHeights;
      if (entity.attribute.style.closure) return arr.concat(arr[0]);
      //闭合
      else return arr;
    }, false);

    entity._maximumHeights = this.getMaximumHeights();
    entity.wall.maximumHeights = new Cesium.CallbackProperty(time => {
      var arr = entity._maximumHeights;
      if (entity.attribute.style.closure) return arr.concat(arr[0]);
      //闭合
      else return arr;
    }, false);
  }
}
