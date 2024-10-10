import * as Cesium from "cesium";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { EditBase } from "./Edit.Base";
import { setPositionsHeight } from "../../util/point";
import { getPositionTranslation } from "../../util/matrix";
import * as util from "../../util/util";

export class EditBox extends EditBase {
  //外部更新位置
  setPositions(position) {
    if (util.isArray(position) && position.length == 1) {
      position = position[0];
    }
    this.entity._positions_draw = position;
  }
  //图形编辑结束后调用
  finish() {}
  updateBox(style) {
    var dimensionsX = Cesium.defaultValue(style.dimensionsX, 100.0);
    var dimensionsY = Cesium.defaultValue(style.dimensionsY, 100.0);
    var dimensionsZ = Cesium.defaultValue(style.dimensionsZ, 100.0);
    var dimensions = new Cesium.Cartesian3(dimensionsX, dimensionsY, dimensionsZ);

    this.entity.box.dimensions.setValue(dimensions);
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

    //x长度调整
    var positionX = getPositionTranslation(positionZXD, { x: style.dimensionsX / 2, y: 0, z: 0 });
    dragger = draggerCtl.createDragger(this.entityCollection, {
      position: positionX,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius.replace("半径", "长度(X方向)"),
      onDrag: (dragger, position) => {
        var newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height;
        position = setPositionsHeight(position, newHeight);
        dragger.position = position;

        var radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2);
        style.dimensionsX = radius * 2;

        this.updateBox(style);
        this.updateDraggers();
      }
    });
    this.draggers.push(dragger);

    //y宽度调整
    var positionY = getPositionTranslation(positionZXD, { x: 0, y: style.dimensionsY / 2, z: 0 });
    dragger = draggerCtl.createDragger(this.entityCollection, {
      position: positionY,
      type: draggerCtl.PointType.EditAttr,
      tooltip: message.dragger.editRadius.replace("半径", "宽度(Y方向)"),
      onDrag: (dragger, position) => {
        var newHeight = Cesium.Cartographic.fromCartesian(positionZXD).height;
        position = setPositionsHeight(position, newHeight);
        dragger.position = position;

        var radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2);
        style.dimensionsY = radius * 2;

        this.updateBox(style);
        this.updateDraggers();
      }
    });
    this.draggers.push(dragger);

    //z高度调整
    var positionZ = getPositionTranslation(positionZXD, { x: 0, y: 0, z: style.dimensionsZ / 2 });
    dragger = draggerCtl.createDragger(this.entityCollection, {
      position: positionZ,
      type: draggerCtl.PointType.MoveHeight,
      tooltip: message.dragger.editRadius.replace("半径", "高度(Z方向)"),
      onDrag: (dragger, position) => {
        var radius = this.formatNum(Cesium.Cartesian3.distance(positionZXD, position), 2);
        style.dimensionsZ = radius * 2;

        this.updateBox(style);
        this.updateDraggers();
      }
    });
    this.draggers.push(dragger);
  }
}
