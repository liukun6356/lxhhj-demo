import * as Cesium from "cesium";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { EditBase } from "./Edit.Base";
import { setPositionsHeight } from "../../util/point";
import { getPositionTranslation } from "../../util/matrix";
import * as util from "../../util/util";

export class EditPlane extends EditBase {
  //外部更新位置
  setPositions(position) {
    if (util.isArray(position) && position.length == 1) {
      position = position[0];
    }
    this.entity._positions_draw = position;
  }
  //图形编辑结束后调用
  finish() {}
  updatePlane(style) {
    var dimensionsX = Cesium.defaultValue(style.dimensionsX, 100.0);
    var dimensionsY = Cesium.defaultValue(style.dimensionsY, 100.0);
    var dimensions = new Cesium.Cartesian2(dimensionsX, dimensionsY);
    this.entity.plane.dimensions.setValue(dimensions);
  }
  bindDraggers() {
    var style = this.entity.attribute.style;
    var dragger;

    //位置中心点
    var positionZXD = this.entity._positions_draw;
    dragger = draggerCtl.createDragger(this.entityCollection, {
      position: positionZXD,
      onDrag: (dragger, position) => {
        this.entity._positions_draw = position;
        this.updateDraggers();
      }
    });
    this.draggers.push(dragger);

    //平面的x长度调整
    var offest = { x: 0, y: 0, z: 0 };
    switch (style.plane_normal) {
      case "x":
        offest.y = style.dimensionsX / 2;
        break;
      default:
        offest.x = style.dimensionsX / 2;
        break;
    }
    dragger = draggerCtl.createDragger(this.entityCollection, {
      position: getPositionTranslation(positionZXD, offest),
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius.replace("半径", "长度(X方向)"),
      onDrag: (dragger, position) => {
        var newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height;
        position = setPositionsHeight(position, newHeight);
        dragger.position = position;

        var radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2);
        style.dimensionsX = radius * 2;

        this.updatePlane(style);
        this.updateDraggers();
      }
    });
    this.draggers.push(dragger);

    //平面的y宽度调整
    if (style.plane_normal == "z") {
      dragger = draggerCtl.createDragger(this.entityCollection, {
        position: getPositionTranslation(positionZXD, { x: 0, y: style.dimensionsY / 2, z: 0 }),
        type: draggerCtl.PointType.EditAttr,
        tooltip: message.dragger.editRadius.replace("半径", "宽度(Y方向)"),
        onDrag: (dragger, position) => {
          var newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height;
          position = setPositionsHeight(position, newHeight);
          dragger.position = position;

          var radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2);
          style.dimensionsY = radius * 2;

          this.updatePlane(style);
          this.updateDraggers();
        }
      });
      this.draggers.push(dragger);
    } else {
      var offestTop = { x: 0, y: 0, z: 0 };
      switch (style.plane_normal) {
        case "x":
        case "y":
          offestTop.z = style.dimensionsY / 2;
          break;
        default:
          offestTop.y = style.dimensionsY / 2;
          break;
      }
      //顶部的 高半径 编辑点
      dragger = draggerCtl.createDragger(this.entityCollection, {
        position: getPositionTranslation(positionZXD, offestTop),
        type: draggerCtl.PointType.MoveHeight,
        tooltip: message.dragger.editRadius.replace("半径", "宽度(Y方向)"),
        onDrag: (dragger, position) => {
          var radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2);
          style.dimensionsY = radius * 2;

          this.updatePlane(style);
          this.updateDraggers();
        }
      });
      this.draggers.push(dragger);
    }
  }
}
