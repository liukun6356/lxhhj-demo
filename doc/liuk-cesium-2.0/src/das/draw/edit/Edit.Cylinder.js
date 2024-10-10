import * as Cesium from "cesium";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { EditPolygon } from "./Edit.Polygon";
import { addPositionsHeight } from "../../util/point";
import { getEllipseOuterPositions } from "../../util/polygon";

export class EditCylinder extends EditPolygon {
  //取enity对象的对应矢量数据
  getGraphic() {
    return this.entity.cylinder;
  }
  //修改坐标会回调，提高显示的效率
  changePositionsToCallback() {
    this._positions_draw = this.entity._positions_draw;

    var time = this.viewer.clock.currentTime;
    var style = this.entity.attribute.style;

    style.topRadius = this.getGraphic().topRadius.getValue(time);
    this.getGraphic().topRadius = new Cesium.CallbackProperty(time => {
      return style.topRadius;
    }, false);

    style.bottomRadius = this.getGraphic().bottomRadius.getValue(time);
    this.getGraphic().bottomRadius = new Cesium.CallbackProperty(time => {
      return style.bottomRadius;
    }, false);

    style.length = this.getGraphic().length.getValue(time);
    this.getGraphic().length = new Cesium.CallbackProperty(time => {
      return style.length;
    }, false);
  }
  //图形编辑结束后调用
  finish() {
    this.entity._positions_draw = this._positions_draw;

    var style = this.entity.attribute.style;
    this.getGraphic().topRadius = style.topRadius;
    this.getGraphic().bottomRadius = style.bottomRadius;
    this.getGraphic().length = style.length;
  }
  bindDraggers() {
    var that = this;

    var style = this.entity.attribute.style;
    var positions = this.getPosition();

    //中心点
    var index = 0;
    var dragger = draggerCtl.createDragger(this.entityCollection, {
      position: positions[index],
      type: draggerCtl.PointType.MoveAll,
      onDrag: function(dragger, position) {
        positions[dragger.index] = position;

        //=====全部更新==========
        that.updateDraggers();
      }
    });
    dragger.index = index;
    this.draggers.push(dragger);

    //获取圆（或椭圆）边线上的坐标点数组
    var outerPositions = getEllipseOuterPositions({
      position: positions[index],
      semiMajorAxis: style.bottomRadius, //长半轴
      semiMinorAxis: style.bottomRadius, //短半轴
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    });

    //长半轴上的坐标点
    index = 1;
    var majorPos = outerPositions[0];
    positions[index] = majorPos;
    var bottomRadiusDragger = draggerCtl.createDragger(this.entityCollection, {
      position: majorPos,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius,
      onDrag: function(dragger, position) {
        positions[dragger.index] = position;

        var radius = that.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2);
        style.bottomRadius = radius;

        that.updateDraggers();
      }
    });
    bottomRadiusDragger.index = index;
    this.draggers.push(bottomRadiusDragger);

    //创建高度拖拽点
    index = 2;
    var position = addPositionsHeight(positions[0], style.length);
    positions[index] = position;
    var draggerTop = draggerCtl.createDragger(this.entityCollection, {
      position: position,
      type: draggerCtl.PointType.MoveHeight,
      tooltip: message.dragger.moveHeight,
      onDrag: function(dragger, position) {
        positions[dragger.index] = position;
        var length = that.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2);
        style.length = length;

        that.updateDraggers();
      }
    });
    draggerTop.index = index;
    this.draggers.push(draggerTop);

    // if (style.topRadius > 0) {
    //     //获取圆（或椭圆）边线上的坐标点数组
    //     var outerPositionsTop = getEllipseOuterPositions({
    //         position: position,
    //         semiMajorAxis: style.topRadius, //长半轴
    //         semiMinorAxis: style.topRadius, //短半轴
    //         rotation: Cesium.Math.toRadians(Number(style.rotation || 0)),
    //     });
    //     //长半轴上的坐标点
    //     index = 3
    //     var majorPos = outerPositionsTop[0];
    //     positions[index] = majorPos;
    //     var topRadiusDragger = draggerCtl.createDragger(this.entityCollection, {
    //         position: majorPos,
    //         type: draggerCtl.PointType.EditAttr,
    //         tooltip: message.dragger.editRadius,
    //         onDrag: function (dragger, position) {
    //             var center = positions[2]

    //             //高度改为圆锥高度
    //             var height = Cesium.Cartographic.fromCartesian(center).height;
    //             var car = Cesium.Cartographic.fromCartesian(position)
    //             position = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, height);
    //             dragger.position.setValue(position)

    //             position = position
    //             positions[dragger.index] = position;

    //             var radius = that.formatNum(Cesium.Cartesian3.distance(center, position), 2);
    //             style.topRadius = radius;

    //             that.updateDraggers();
    //         }
    //     });
    //     topRadiusDragger.index = index;
    //     this.draggers.push(topRadiusDragger);
    // }
  }
}
