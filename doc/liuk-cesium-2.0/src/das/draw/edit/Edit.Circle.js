import * as Cesium from "cesium";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { EditPolygon } from "./Edit.Polygon";
import { setPositionsHeight, setPositionSurfaceHeight, getPositionValue } from "../../util/point";
import { getEllipseOuterPositions } from "../../util/polygon";

export class EditCircle extends EditPolygon {
  //取enity对象的对应矢量数据
  getGraphic() {
    return this.entity.ellipse;
  }
  //修改坐标会回调，提高显示的效率
  changePositionsToCallback() {
    this._positions_draw = this.entity._positions_draw;
    this.finish();
  }
  //图形编辑结束后调用
  finish() {
    this.entity._positions_draw = this._positions_draw;
  }
  isClampToGround() {
    return this.entity.attribute.style.clampToGround;
  }
  getPosition() {
    //加上高度
    if (this.getGraphic().height != undefined) {
      var newHeight = this.getGraphic().height.getValue(this.viewer.clock.currentTime);
      for (var i = 0, len = this._positions_draw.length; i < len; i++) {
        this._positions_draw[i] = setPositionsHeight(this._positions_draw[i], newHeight);
      }
    }
    return this._positions_draw;
  }
  bindDraggers() {
    var that = this;

    var clampToGround = this.isClampToGround();
    var positions = this.getPosition();

    var style = this.entity.attribute.style;

    //中心点
    var position = positions[0];
    if (clampToGround) {
      //贴地时求贴模型和贴地的高度
      position = setPositionSurfaceHeight(this.viewer, position);
      positions[0] = position;
    }

    var dragger = draggerCtl.createDragger(this.entityCollection, {
      position: position,
      onDrag: function(dragger, position) {
        //记录差值
        var diff = Cesium.Cartesian3.subtract(
          position,
          positions[dragger.index],
          new Cesium.Cartesian3()
        );

        positions[dragger.index] = position;

        //============高度处理=============
        if (!style.clampToGround) {
          var height = that.formatNum(Cesium.Cartographic.fromCartesian(position).height, 2);
          that.getGraphic().height = height;
          style.height = height;
        }

        var time = that.viewer.clock.currentTime;

        //============半径同步处理=============
        dragger.majorDragger.position = Cesium.Cartesian3.add(
          getPositionValue(dragger.majorDragger.position, time),
          diff,
          new Cesium.Cartesian3()
        );
        if (dragger.minorDragger) {
          dragger.minorDragger.position = Cesium.Cartesian3.add(
            getPositionValue(dragger.minorDragger.position, time),
            diff,
            new Cesium.Cartesian3()
          );
        }

        //============高度调整拖拽点处理=============
        if (that.entity.attribute.style.extrudedHeight != undefined) that.updateDraggers();
      }
    });
    dragger.index = 0;
    this.draggers.push(dragger);

    var time = this.viewer.clock.currentTime;

    //获取圆（或椭圆）边线上的坐标点数组
    var outerPositions = getEllipseOuterPositions({
      position: position,
      semiMajorAxis: this.getGraphic().semiMajorAxis.getValue(time), //长半轴
      semiMinorAxis: this.getGraphic().semiMinorAxis.getValue(time), //短半轴
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    });

    //长半轴上的坐标点
    var majorPos = outerPositions[1];
    if (clampToGround) {
      //贴地时求贴模型和贴地的高度
      majorPos = setPositionSurfaceHeight(this.viewer, majorPos);
    }
    positions[1] = majorPos;
    var majorDragger = draggerCtl.createDragger(this.entityCollection, {
      position: majorPos,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius,
      //clampToGround: clampToGround,
      onDrag: function(dragger, position) {
        if (that.getGraphic().height != undefined) {
          var newHeight = that.getGraphic().height.getValue(time);
          position = setPositionsHeight(position, newHeight);
          dragger.position = position;
        }
        positions[dragger.index] = position;

        var radius = that.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2);
        that.getGraphic().semiMajorAxis = radius;

        if (that._maxPointNum == 3 || !Cesium.defined(style.radius)) {
          //椭圆
          style.semiMajorAxis = radius;
        } else {
          //圆
          that.getGraphic().semiMinorAxis = radius;
          style.radius = radius;
        }

        // if (that.entity.attribute.style.extrudedHeight != undefined)
        that.updateDraggers();
      }
    });
    majorDragger.index = 1;
    dragger.majorDragger = majorDragger;
    this.draggers.push(majorDragger);

    //短半轴上的坐标点
    if (this._maxPointNum == 3) {
      //椭圆
      //短半轴上的坐标点
      var minorPos = outerPositions[0];
      if (clampToGround) {
        //贴地时求贴模型和贴地的高度
        minorPos = setPositionSurfaceHeight(this.viewer, minorPos);
      }
      positions[2] = minorPos;
      var minorDragger = draggerCtl.createDragger(this.entityCollection, {
        position: minorPos,
        type: draggerCtl.PointType.EditAttr,
        tooltip: message.dragger.editRadius,
        //clampToGround: clampToGround,
        onDrag: function(dragger, position) {
          if (that.getGraphic().height != undefined) {
            var newHeight = that.getGraphic().height.getValue(time);
            position = setPositionsHeight(position, newHeight);
            dragger.position = position;
          }
          positions[dragger.index] = position;

          var radius = that.formatNum(Cesium.Cartesian3.distance(positions[0], position), 2);
          that.getGraphic().semiMinorAxis = radius;

          if (that._maxPointNum == 3 || !Cesium.defined(style.radius)) {
            //椭圆
            style.semiMinorAxis = radius;
          } else {
            //圆
            that.getGraphic().semiMajorAxis = radius;
            style.radius = radius;
          }

          // if (that.entity.attribute.style.extrudedHeight != undefined)
          that.updateDraggers();
        }
      });
      minorDragger.index = 2;
      dragger.minorDragger = minorDragger;
      this.draggers.push(minorDragger);
    }

    //创建高度拖拽点
    if (this.getGraphic().extrudedHeight) {
      var _pos = this._maxPointNum == 3 ? [positions[1], positions[2]] : [positions[1]];
      this.bindHeightDraggers(_pos);
    }
  }
}
