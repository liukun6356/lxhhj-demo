import * as Cesium from "cesium";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { EditPolygon } from "./Edit.Polygon";
import { setPositionsHeight, setPositionSurfaceHeight, centerOfMass } from "../../util/point";

export class EditRectangle extends EditPolygon {
  //取enity对象的对应矢量数据
  getGraphic() {
    return this.entity.rectangle;
  }
  //修改坐标会回调，提高显示的效率
  changePositionsToCallback() {
    this._positions_draw = this.entity._positions_draw;
  }
  //图形编辑结束后调用
  finish() {
    this.entity._positions_draw = this._positions_draw;
  }
  isClampToGround() {
    return this.entity.attribute.style.clampToGround;
  }
  bindDraggers() {
    var that = this;

    var clampToGround = this.isClampToGround();
    var positions = this.getPosition();

    for (var i = 0, len = positions.length; i < len; i++) {
      var position = positions[i];

      if (this.getGraphic().height != undefined) {
        var newHeight = this.getGraphic().height.getValue(this.viewer.clock.currentTime);
        position = setPositionsHeight(position, newHeight);
      }

      if (clampToGround) {
        //贴地时求贴模型和贴地的高度
        position = setPositionSurfaceHeight(this.viewer, position);
      }

      //各顶点
      var dragger = draggerCtl.createDragger(this.entityCollection, {
        position: position,
        //clampToGround: clampToGround,
        onDrag: function(dragger, position) {
          var time = that.viewer.clock.currentTime;
          if (that.getGraphic().height != undefined) {
            let newHeight = that.getGraphic().height.getValue(time);
            position = setPositionsHeight(position, newHeight);
            dragger.position = position;
          }

          positions[dragger.index] = position;

          //============高度调整拖拽点处理=============
          if (that.heightDraggers && that.heightDraggers.length > 0) {
            var extrudedHeight = that.getGraphic().extrudedHeight.getValue(time);
            that.heightDraggers[dragger.index].position = setPositionsHeight(
              position,
              extrudedHeight
            );
          }

          //============整体平移移动点处理=============
          positionMove = centerOfMass(positions);
          if (that.getGraphic().height != undefined) {
            let newHeight = that.getGraphic().height.getValue(time);
            positionMove = setPositionsHeight(positionMove, newHeight);
          }
          if (clampToGround) {
            //贴地时求贴模型和贴地的高度
            positionMove = setPositionSurfaceHeight(that.viewer, positionMove);
          }
          draggerMove.position = positionMove;
        }
      });
      dragger.index = i;
      this.draggers.push(dragger);
    }

    //整体平移移动点
    var positionMove = centerOfMass(positions);
    if (this.getGraphic().height != undefined) {
      let newHeight = this.getGraphic().height.getValue(this.viewer.clock.currentTime);
      positionMove = setPositionsHeight(positionMove, newHeight);
    }
    if (clampToGround) {
      //贴地时求贴模型和贴地的高度
      positionMove = setPositionSurfaceHeight(this.viewer, positionMove);
    }
    var draggerMove = draggerCtl.createDragger(this.entityCollection, {
      position: positionMove,
      type: draggerCtl.PointType.MoveAll,
      tooltip: message.dragger.moveAll,
      onDrag: function(dragger, position) {
        // dragger.position = position;

        //记录差值
        var diff = Cesium.Cartesian3.subtract(position, positionMove, new Cesium.Cartesian3());
        positionMove = position;

        positions.forEach(function(pos, index, arr) {
          var newPos = Cesium.Cartesian3.add(pos, diff, new Cesium.Cartesian3());
          positions[index] = newPos;
        });

        //=====全部更新==========
        that.updateDraggers();
      }
    });
    this.draggers.push(draggerMove);

    //创建高程拖拽点
    if (this.getGraphic().extrudedHeight) this.bindHeightDraggers();
  }
}
