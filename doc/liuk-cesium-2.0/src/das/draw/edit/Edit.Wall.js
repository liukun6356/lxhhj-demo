import * as Cesium from "cesium";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { EditPolyline } from "./Edit.Polyline";
import { addPositionsHeight, centerOfMass } from "../../util/point";

export class EditWall extends EditPolyline {
  //取enity对象的对应矢量数据
  getGraphic() {
    return this.entity.wall;
  }
  //修改坐标会回调，提高显示的效率
  changePositionsToCallback() {
    var that = this;

    var time = this.viewer.clock.currentTime;

    this._positions_draw =
      this.entity._positions_draw || this.getGraphic().positions.getValue(time);
    this._minimumHeights =
      this.entity._minimumHeights || this.getGraphic().minimumHeights.getValue(time);
    this._maximumHeights =
      this.entity._maximumHeights || this.getGraphic().maximumHeights.getValue(time);
  }
  //坐标位置相关
  updateAttrForEditing() {
    var style = this.entity.attribute.style;
    var position = this.getPosition();
    var len = position.length;

    this._maximumHeights = new Array(len);
    this._minimumHeights = new Array(len);

    for (var i = 0; i < len; i++) {
      var height = Cesium.Cartographic.fromCartesian(position[i]).height;
      this._minimumHeights[i] = height;
      this._maximumHeights[i] = height + Number(style.extrudedHeight);
    }

    //同步更新
    this.entity._maximumHeights = this._maximumHeights;
    this.entity._minimumHeights = this._minimumHeights;
  }
  //图形编辑结束后调用
  finish() {
    this.entity._positions_draw = this._positions_draw;
    this.entity._maximumHeights = this._maximumHeights;
    this.entity._minimumHeights = this._minimumHeights;
  }
  bindDraggers() {
    var that = this;

    var clampToGround = this.isClampToGround();

    var positions = this.getPosition();
    var style = this.entity.attribute.style;
    var hasMidPoint = positions.length < this._maxPointNum; //是否有新增点

    for (var i = 0, len = positions.length; i < len; i++) {
      var loc = positions[i];

      //各顶点
      var dragger = draggerCtl.createDragger(this.entityCollection, {
        position: loc,
        clampToGround: clampToGround,
        onDrag: function(dragger, position) {
          positions[dragger.index] = position;

          //============高度调整拖拽点处理=============
          if (that.heightDraggers && that.heightDraggers.length > 0) {
            that.heightDraggers[dragger.index].position = addPositionsHeight(
              position,
              style.extrudedHeight
            );
          }

          //============新增点拖拽点处理=============
          if (hasMidPoint) {
            if (dragger.index > 0) {
              //与前一个点之间的中点
              that.draggers[dragger.index * 2 - 1].position = Cesium.Cartesian3.midpoint(
                position,
                positions[dragger.index - 1],
                new Cesium.Cartesian3()
              );
            }
            if (dragger.index < positions.length - 1) {
              //与后一个点之间的中点
              that.draggers[dragger.index * 2 + 1].position = Cesium.Cartesian3.midpoint(
                position,
                positions[dragger.index + 1],
                new Cesium.Cartesian3()
              );
            }
          }

          //============整体平移移动点处理=============
          positionMove = centerOfMass(positions);
          draggerMove.position = positionMove;
        }
      });
      dragger.index = i;
      this.draggers.push(dragger);

      //中间点，拖动后新增点
      if (hasMidPoint) {
        var nextIndex = i + 1;
        if (nextIndex < len) {
          var midpoint = Cesium.Cartesian3.midpoint(
            loc,
            positions[nextIndex],
            new Cesium.Cartesian3()
          );
          var draggerMid = draggerCtl.createDragger(this.entityCollection, {
            position: midpoint,
            type: draggerCtl.PointType.AddMidPoint,
            tooltip: message.dragger.addMidPoint,
            clampToGround: clampToGround,
            onDragStart: function(dragger, position) {
              positions.splice(dragger.index, 0, position); //插入点
              that.updateAttrForEditing();
            },
            onDrag: function(dragger, position) {
              positions[dragger.index] = position;
            },
            onDragEnd: function(dragger, position) {
              that.updateDraggers();
            }
          });
          draggerMid.index = nextIndex;
          this.draggers.push(draggerMid);
        }
      }
    }

    //整体平移移动点
    var positionMove = centerOfMass(positions);
    var draggerMove = draggerCtl.createDragger(this.entityCollection, {
      position: positionMove,
      type: draggerCtl.PointType.MoveAll,
      tooltip: message.dragger.moveAll,
      clampToGround: clampToGround,
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
    this.bindHeightDraggers();
  }
  //高度调整拖拽点
  bindHeightDraggers() {
    var that = this;

    this.heightDraggers = [];

    var positions = this.getPosition();
    var style = this.entity.attribute.style;
    var extrudedHeight = Number(style.extrudedHeight);

    for (var i = 0, len = positions.length; i < len; i++) {
      var loc = addPositionsHeight(positions[i], extrudedHeight);

      var dragger = draggerCtl.createDragger(this.entityCollection, {
        position: loc,
        type: draggerCtl.PointType.MoveHeight,
        tooltip: message.dragger.moveHeight,
        onDrag: function(dragger, position) {
          var thisHeight = Cesium.Cartographic.fromCartesian(position).height;
          style.extrudedHeight = that.formatNum(
            thisHeight - that._minimumHeights[dragger.index],
            2
          );

          for (var i = 0; i < positions.length; i++) {
            if (i == dragger.index) continue;
            that.heightDraggers[i].position = addPositionsHeight(
              positions[i],
              style.extrudedHeight
            );
          }
          that.updateAttrForEditing();
        }
      });
      dragger.index = i;

      this.draggers.push(dragger);
      this.heightDraggers.push(dragger);
    }
  }
}
