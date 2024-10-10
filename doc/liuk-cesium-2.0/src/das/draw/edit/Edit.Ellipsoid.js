import * as Cesium from "cesium";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { EditBase } from "./Edit.Base";
import { setPositionsHeight, addPositionsHeight, getPositionValue } from "../../util/point";
import { getEllipseOuterPositions } from "../../util/polygon";

export class EditEllipsoid extends EditBase {
  //外部更新位置
  setPositions(position) {
    this.entity._positions_draw[0] = position[0];
  }
  //图形编辑结束后调用
  finish() {}
  updateRadii(style) {
    var radii = new Cesium.Cartesian3(
      Number(style.radii_x),
      Number(style.radii_y),
      Number(style.radii_z)
    );
    this.entity.ellipsoid.radii.setValue(radii);
  }
  bindDraggers() {
    var that = this;

    var style = this.entity.attribute.style;
    var dragger;

    //位置中心点
    dragger = draggerCtl.createDragger(this.entityCollection, {
      position: this.entity._positions_draw[0],
      onDrag: function(dragger, position) {
        that.entity._positions_draw[0] = position;

        that.updateDraggers();
      }
    });
    this.draggers.push(dragger);

    //顶部的 高半径 编辑点
    var position = getPositionValue(this.entity.position, this.viewer.clock.currentTime);
    dragger = draggerCtl.createDragger(this.entityCollection, {
      position: addPositionsHeight(position, style.radii_z),
      type: draggerCtl.PointType.MoveHeight,
      tooltip: message.dragger.editRadius,
      onDrag: function(dragger, position) {
        var positionZXD = that.entity._positions_draw[0];
        var length = that.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2);
        style.radii_z = length; //高半径

        that.updateRadii(style);
        that.updateDraggers();
      }
    });
    this.draggers.push(dragger);

    //获取圆（或椭圆）边线上的坐标点数组
    var outerPositions = getEllipseOuterPositions({
      position: position,
      semiMajorAxis: Number(style.radii_x),
      semiMinorAxis: Number(style.radii_y),
      rotation: Cesium.Math.toRadians(Number(style.rotation || 0))
    });

    //长半轴上的坐标点
    var majorPos = outerPositions[0];
    var majorDragger = draggerCtl.createDragger(this.entityCollection, {
      position: majorPos,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius,
      onDrag: function(dragger, position) {
        var positionZXD = that.entity._positions_draw[0];
        var newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height;
        position = setPositionsHeight(position, newHeight);
        dragger.position = position;

        var radius = that.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2);
        style.radii_y = radius; //长半轴

        that.updateRadii(style);
        that.updateDraggers();
      }
    });
    dragger.majorDragger = majorDragger;
    this.draggers.push(majorDragger);

    //短半轴上的坐标点
    var minorPos = outerPositions[1];
    var minorDragger = draggerCtl.createDragger(this.entityCollection, {
      position: minorPos,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius,
      onDrag: function(dragger, position) {
        var positionZXD = that.entity._positions_draw[0];
        var newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height;
        position = setPositionsHeight(position, newHeight);
        dragger.position = position;

        var radius = that.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2);
        style.radii_x = radius; //短半轴

        that.updateRadii(style);
        that.updateDraggers();
      }
    });
    dragger.minorDragger = minorDragger;
    this.draggers.push(minorDragger);
  }
}
