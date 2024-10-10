import * as Cesium from "cesium";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { EditBase } from "./Edit.Base";
import {
  setPositionsHeight,
  getMaxHeight,
  setPositionSurfaceHeight,
  centerOfMass,
  getPositionValue
} from "../../util/point";

export class EditPolyline extends EditBase {
  //========== 构造方法 ==========
  constructor(entity, viewer) {
    super(entity, viewer);

    this._positions_draw = [];
    this._hasMidPoint = true;
    this.hasClosure = false; //是否首尾相连闭合（线不闭合，面闭合），用于处理中间点
  }

  //取enity对象的对应矢量数据
  getGraphic() {
    return this.entity.polyline;
  }
  //坐标位置相关
  getPosition() {
    return this._positions_draw;
  }
  //外部更新位置
  setPositions(positions) {
    this._positions_draw = positions;
    this.updateAttrForEditing();
    this.finish();
  }
  //修改坐标会回调，提高显示的效率
  changePositionsToCallback() {
    this._positions_draw =
      this.entity._positions_draw ||
      this.getGraphic().positions.getValue(this.viewer.clock.currentTime);
  }
  updateAttrForEditing() {
    //显示depthFailMaterial时，不能使用CallbackProperty属性，否则depthFailMaterial不显示
    if (
      this.entity.attribute.type == "polyline" &&
      Cesium.defined(this.entity.polyline.depthFailMaterial)
    ) {
      this.entity.polyline.positions = this.getPosition();
    }
  }
  //图形编辑结束后调用
  finish() {
    this.entity._positions_draw = this.getPosition();

    var entity = this.entity;
    if (this.entity.attribute.type == "polyline") {
      //显示depthFailMaterial时，不能使用CallbackProperty属性，否则depthFailMaterial不显示
      if (Cesium.defined(entity.polyline.depthFailMaterial)) {
        var arr = entity._positions_draw;
        if (entity.attribute.style.closure) arr = arr.concat(arr[0]); //闭合
        entity.polyline.positions = arr;
      } else {
        entity.polyline.positions = new Cesium.CallbackProperty(time => {
          var arr = entity._positions_draw;
          if (entity.attribute.style.closure) return arr.concat(arr[0]);
          //闭合
          else return arr;
        }, false);
      }
    }
  }
  isClampToGround() {
    return this.entity.attribute.style.clampToGround;
  }
  //是否可在中间新增点
  hasMidPoint() {
    return this._hasMidPoint && this.getPosition().length < this._maxPointNum;
  }
  //子类用，根据属性更新坐标
  updatePositionsHeightByAttr(position) {
    return position;
  }
  bindDraggers() {
    var that = this;

    var positions = this.getPosition();

    var clampToGround = this.isClampToGround();
    var hasMidPoint = this.hasMidPoint();

    for (var i = 0, len = positions.length; i < len; i++) {
      var loc = positions[i];

      loc = this.updatePositionsHeightByAttr(loc);
      if (clampToGround) {
        //贴地时求贴模型和贴地的高度
        loc = setPositionSurfaceHeight(this.viewer, loc);
        positions[i] = loc;
      }

      //各顶点
      var dragger = draggerCtl.createDragger(this.entityCollection, {
        position: loc,
        //clampToGround: clampToGround,
        onDrag: function(dragger, position) {
          position = that.updatePositionsHeightByAttr(position);
          dragger.position = position;
          positions[dragger.index] = position;

          if (that.heightDraggers && that.heightDraggers.length > 0) {
            that.updateDraggers();
          } else {
            //============新增点拖拽点处理=============
            if (hasMidPoint) {
              var draggersIdx;
              var nextPositionIdx;
              var midpoint;
              //与前一个点之间的中点
              if (that.hasClosure || (!that.hasClosure && dragger.index != 0)) {
                if (dragger.index == 0) {
                  draggersIdx = len * 2 - 1;
                  nextPositionIdx = len - 1;
                } else {
                  draggersIdx = dragger.index * 2 - 1;
                  nextPositionIdx = dragger.index - 1;
                }
                var nextPosition = positions[nextPositionIdx];
                midpoint = Cesium.Cartesian3.midpoint(
                  position,
                  nextPosition,
                  new Cesium.Cartesian3()
                );
                midpoint = that.updatePositionsHeightByAttr(midpoint);
                if (clampToGround) {
                  //贴地时求贴模型和贴地的高度
                  midpoint = setPositionSurfaceHeight(that.viewer, midpoint);
                }
                that.draggers[draggersIdx].position = midpoint;
              }

              //与后一个点之间的中点
              if (that.hasClosure || (!that.hasClosure && dragger.index != len - 1)) {
                if (dragger.index == len - 1) {
                  draggersIdx = dragger.index * 2 + 1;
                  nextPositionIdx = 0;
                } else {
                  draggersIdx = dragger.index * 2 + 1;
                  nextPositionIdx = dragger.index + 1;
                }
                midpoint = Cesium.Cartesian3.midpoint(
                  position,
                  positions[nextPositionIdx],
                  new Cesium.Cartesian3()
                );
                midpoint = that.updatePositionsHeightByAttr(midpoint);
                if (clampToGround) {
                  //贴地时求贴模型和贴地的高度
                  midpoint = setPositionSurfaceHeight(that.viewer, midpoint);
                }
                that.draggers[draggersIdx].position = midpoint;
              }
            }

            //============整体平移移动点处理=============
            positionMove = centerOfMass(positions);
            positionMove = that.updatePositionsHeightByAttr(positionMove);
            if (clampToGround) {
              //贴地时求贴模型和贴地的高度
              positionMove = setPositionSurfaceHeight(that.viewer, positionMove);
            }
            draggerMove.position = positionMove;
          }
        }
      });
      dragger.index = i;
      this.draggers.push(dragger);

      //中间点，拖动后新增点
      if (hasMidPoint && (this.hasClosure || (!this.hasClosure && i < len - 1))) {
        var nextIndex = (i + 1) % len;
        var midpoint = Cesium.Cartesian3.midpoint(
          loc,
          positions[nextIndex],
          new Cesium.Cartesian3()
        );
        midpoint = that.updatePositionsHeightByAttr(midpoint);
        if (clampToGround) {
          //贴地时求贴模型和贴地的高度
          midpoint = setPositionSurfaceHeight(this.viewer, midpoint);
        }

        var draggerMid = draggerCtl.createDragger(this.entityCollection, {
          position: midpoint,
          type: draggerCtl.PointType.AddMidPoint,
          tooltip: message.dragger.addMidPoint,
          //clampToGround: clampToGround,
          onDragStart: function(dragger, position) {
            positions.splice(dragger.index, 0, position); //插入点
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

    //整体平移移动点
    var positionMove = centerOfMass(positions);
    positionMove = this.updatePositionsHeightByAttr(positionMove);
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
  //子类用，高度调整拖拽点
  bindHeightDraggers(positions) {
    var that = this;

    this.heightDraggers = [];

    positions = positions || this.getPosition();
    var extrudedHeight = that.getGraphic().extrudedHeight.getValue(this.viewer.clock.currentTime);

    for (var i = 0, len = positions.length; i < len; i++) {
      var loc = positions[i];
      loc = setPositionsHeight(loc, extrudedHeight);

      var dragger = draggerCtl.createDragger(this.entityCollection, {
        position: loc,
        type: draggerCtl.PointType.MoveHeight,
        tooltip: message.dragger.moveHeight,
        onDrag: function(dragger, position) {
          var thisHeight = Cesium.Cartographic.fromCartesian(position).height;
          that.getGraphic().extrudedHeight = thisHeight;

          var maxHeight = getMaxHeight(that.getPosition());
          that.entity.attribute.style.extrudedHeight = that.formatNum(thisHeight - maxHeight, 2);

          that.updateHeightDraggers(thisHeight);
        }
      });

      this.draggers.push(dragger);
      this.heightDraggers.push(dragger);
    }
  }
  updateHeightDraggers(extrudedHeight) {
    for (var i = 0; i < this.heightDraggers.length; i++) {
      var heightDragger = this.heightDraggers[i];

      var position = setPositionsHeight(
        getPositionValue(heightDragger.position, this.viewer.clock.currentTime),
        extrudedHeight
      );
      heightDragger.position.setValue(position);
    }
  }
}
