import * as Cesium from "cesium";
import { DrawPolyline } from "./Draw.Polyline";
import * as attr from "../attr/Attr.Circle";
import { style2Entity as polylineStyle2Entity } from "../attr/Attr.Polyline";
import { EditCircle } from "../edit/Edit.Circle";
import { getEllipseOuterPositions } from "../../util/polygon";
import { isNumber } from "../../util/util";

export class DrawCircle extends DrawPolyline {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "ellipse";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditCircle; //获取编辑对象

    this._minPointNum = 2; //至少需要点的个数
    this._maxPointNum = 2; //最多允许点的个数
  }

  getShowPosition(time) {
    if (this._positions_draw && this._positions_draw.length > 0) return this._positions_draw[0];
    return null;
  }
  //根据attribute参数创建Entity
  createFeature(attribute, dataSource) {
    dataSource = dataSource || this.dataSource;
    this._positions_draw = [];

    if (attribute.type == "ellipse")
      //椭圆
      this._maxPointNum = 3;
    //圆
    else this._maxPointNum = 2;

    var that = this;
    var addattr = {
      position: new Cesium.CallbackProperty(time => {
        return that.getShowPosition(time);
      }, false),
      ellipse: attr.style2Entity(attribute.style),
      attribute: attribute
    };

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
    this.bindOutline(this.entity, lineStyle); //边线
    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.ellipse);
  }
  bindOutline(entity, lineStyle) {
    var attribute = entity.attribute;

    //本身的outline需要隐藏
    entity.ellipse.outline = new Cesium.CallbackProperty(time => {
      return attribute.style.outline && attribute.style.outlineWidth == 1;
    }, false);

    //是否显示：边线宽度大于1时
    entity.polyline.show = new Cesium.CallbackProperty(time => {
      return attribute.style.outline && attribute.style.outlineWidth > 1;
    }, false);
    entity.polyline.positions = new Cesium.CallbackProperty(time => {
      if (!entity.polyline.show.getValue(time)) return null;

      return attr.getOutlinePositions(entity);
    }, false);
    entity.polyline.width = new Cesium.CallbackProperty(time => {
      return entity.ellipse.outlineWidth;
    }, false);

    //虚线等情况下不支持动态修改颜色,只有实线可以动态改颜色。
    if (!lineStyle.lineType || lineStyle.lineType == "solid") {
      entity.polyline.material = new Cesium.ColorMaterialProperty(
        new Cesium.CallbackProperty(time => {
          return entity.ellipse.outlineColor.getValue(time);
        }, false)
      );
    }
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

    //高度处理
    if (!style.clampToGround) {
      var height = this.formatNum(
        Cesium.Cartographic.fromCartesian(this._positions_draw[0]).height,
        2
      );
      this.entity.ellipse.height = height;
      style.height = height;

      if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
        var extrudedHeight = height + Number(style.extrudedHeight);
        this.entity.ellipse.extrudedHeight = extrudedHeight;
      }
    }

    //半径处理
    var radius = this.formatNum(
      Cesium.Cartesian3.distance(this._positions_draw[0], this._positions_draw[1]),
      2
    );
    this.entity.ellipse.semiMinorAxis = radius; //短半轴

    if (this._maxPointNum == 3) {
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
      this.entity.ellipse.semiMajorAxis = semiMajorAxis;

      style.semiMinorAxis = radius;
      style.semiMajorAxis = semiMajorAxis;
    } else {
      this.entity.ellipse.semiMajorAxis = radius;

      style.radius = radius;
    }
  }
  addPositionsForRadius(position) {
    var style = this.entity.attribute.style;

    //获取圆（或椭圆）边线上的坐标点数组
    var outerPositions = getEllipseOuterPositions({
      position: position,
      semiMajorAxis: this.entity.ellipse.semiMajorAxis.getValue(this.viewer.clock.currentTime), //长半轴
      semiMinorAxis: this.entity.ellipse.semiMinorAxis.getValue(this.viewer.clock.currentTime), //短半轴
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    });

    //长半轴上的坐标点
    var majorPos = outerPositions[1];
    this._positions_draw.push(majorPos);

    if (this._maxPointNum == 3) {
      //椭圆
      //短半轴上的坐标点
      var minorPos = outerPositions[0];
      this._positions_draw.push(minorPos);
    }
  }
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    entity._positions_draw = this._positions_draw;
    //this.entity.position = this.getShowPosition();
    entity.position = new Cesium.CallbackProperty(time => {
      if (entity._positions_draw && entity._positions_draw.length > 0)
        return entity._positions_draw[0];
      return null;
    }, false);
  }
}
