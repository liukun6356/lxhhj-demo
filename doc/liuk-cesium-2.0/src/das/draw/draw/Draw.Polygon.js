import * as Cesium from "cesium";
import { DrawPolyline } from "./Draw.Polyline";
import { getMaxHeight } from "../../util/point";
import { isNumber } from "../../util/util";

import * as attr from "../attr/Attr.Polygon";
import { EditPolygon } from "../edit/Edit.Polygon";
import { style2Entity as polylineStyle2Entity } from "../attr/Attr.Polyline";

export class DrawPolygon extends DrawPolyline {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "polygon";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditPolygon; //获取编辑对象

    this._minPointNum = 3; //至少需要点的个数
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
      polygon: attr.style2Entity(attribute.style),
      attribute: attribute
    };

    addattr.polygon.hierarchy = new Cesium.CallbackProperty(time => {
      var positions = that.getDrawPosition();

      // fangmm 20210816 采用深拷贝方式传入polygon坐标，可解决贴地面双击结束时双击的两个点之间高度不一致问题
      var coors = [];
      if (positions && positions.length) {
        for(var i = 0 , n = positions.length; i < n; i++) {
          var tempPos = positions[i];
          var tempCoor = new Cesium.Cartesian3(tempPos.x, tempPos.y, tempPos.z);
          coors.push(tempCoor);
        }
      }

      return new Cesium.PolygonHierarchy(coors);
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
      // arcType: Cesium.ArcType.RHUMB,
      outline: false,
      show: false
    });

    this.entity = dataSource.entities.add(addattr); //创建要素对象

    this.bindOutline(this.entity, lineStyle); //边线

    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.polygon);
  }
  bindOutline(entity, lineStyle) {
    var attribute = entity.attribute;

    //本身的outline需要隐藏
    entity.polygon.outline = new Cesium.CallbackProperty(time => {
      return attribute.style.outline && attribute.style.outlineWidth == 1;
    }, false);

    //是否显示：绘制时前2点时 或 边线宽度大于1时
    entity.polyline.show = new Cesium.CallbackProperty(time => {
      var arr = attr.getPositions(entity, true);
      if (arr && arr.length < 3) return true;

      return attribute.style.outline && attribute.style.outlineWidth > 1;
    }, false);

    entity.polyline.positions = new Cesium.CallbackProperty(time => {
      if (!entity.polyline.show.getValue(time)) return null;

      var arr = attr.getPositions(entity, true);
      if (arr && arr.length < 3) return arr;

      return arr.concat([arr[0]]);
    }, false);
    entity.polyline.width = new Cesium.CallbackProperty(time => {
      var arr = attr.getPositions(entity, true);
      if (arr && arr.length < 3) return 2;

      return entity.polygon.outlineWidth;
    }, false);

    //虚线等情况下不支持动态修改颜色,只有实线可以动态改颜色。
    if (!lineStyle.lineType || lineStyle.lineType == "solid") {
      entity.polyline.material = new Cesium.ColorMaterialProperty(
        new Cesium.CallbackProperty(time => {
          var arr = attr.getPositions(entity, true);
          if (arr && arr.length < 3) {
            if (entity.polygon.material.color) return entity.polygon.material.color.getValue(time);
            else return Cesium.Color.YELLOW;
          }
          return entity.polygon.outlineColor.getValue(time);
        }, false)
      );
    }
  }
  updateAttrForDrawing() {
    var style = this.entity.attribute.style;
    if (style.extrudedHeight && isNumber(style.extrudedHeight)) {
      //存在extrudedHeight高度设置时
      var maxHight = getMaxHeight(this.getDrawPosition());
      this.entity.polygon.extrudedHeight = maxHight + Number(style.extrudedHeight);
    }
  }
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    entity._positions_draw = this.getDrawPosition();
    entity.polygon.hierarchy = new Cesium.CallbackProperty(time => {
      var positions = entity._positions_draw;
      return new Cesium.PolygonHierarchy(positions);
    }, false);
  }
}
