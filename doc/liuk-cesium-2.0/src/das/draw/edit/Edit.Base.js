import * as Cesium from "cesium";
import { DasClass, eventType } from "../../core/DasClass";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { getCurrentMousePosition, getPositionValue, formatNum } from "../../util/point";

export class EditBase extends DasClass {
  //========== 构造方法 ==========
  constructor(entity, viewer) {
    super();

    this.entity = entity;
    this.viewer = viewer;

    this.draggers = [];
    this._minPointNum = 1; //至少需要点的个数 (值是draw中传入)
    this._maxPointNum = 9999; //最多允许点的个数 (值是draw中传入)
  }

  get entityCollection() {
    return this.entity.entityCollection;
  }

  fire(type, data, propagate) {
    if (this._fire) this._fire(type, data, propagate);
  }
  formatNum(num, digits) {
    return formatNum(num, digits);
  }
  setCursor(val) {
    this.viewer._container.style.cursor = val ? "crosshair" : "";
  }
  //激活绘制
  activate() {
    if (this._enabled) {
      return this;
    }
    this._enabled = true;

    this.entity.inProgress = true;
    this.changePositionsToCallback();
    this.bindDraggers();
    this.bindEvent();

    this.fire(eventType.editStart, { edittype: this.entity.attribute.type, entity: this.entity });

    return this;
  }
  //释放绘制
  disable() {
    if (!this._enabled) {
      return this;
    }
    this._enabled = false;

    this.destroyEvent();
    this.destroyDraggers();
    this.finish();

    this.entity.inProgress = false;
    this.fire(eventType.editStop, { edittype: this.entity.attribute.type, entity: this.entity });
    this.tooltip.setVisible(false);

    return this;
  }
  changePositionsToCallback() {}
  //图形编辑结束后调用
  finish() {}
  //拖拽点 事件
  bindEvent() {
    var scratchBoundingSphere = new Cesium.BoundingSphere();
    var zOffset = new Cesium.Cartesian3();

    var draggerHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    draggerHandler.dragger = null;

    //选中后拖动
    draggerHandler.setInputAction(event => {
      var pickedObject = this.viewer.scene.pick(event.position);
      if (Cesium.defined(pickedObject)) {
        var entity = pickedObject.id || pickedObject.primitive.id || pickedObject.primitive;
        if (entity && Cesium.defaultValue(entity._isDragger, false)) {
          this.viewer._hasEdit = true;
          this.viewer.scene.screenSpaceCameraController.enableRotate = false;
          this.viewer.scene.screenSpaceCameraController.enableTilt = false;
          this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
          this.viewer.scene.screenSpaceCameraController.enableInputs = false;

          if (this.viewer.das && this.viewer.das.popup) this.viewer.das.popup.close(entity);

          draggerHandler.dragger = entity;
          draggerHandler.dragger.show = Cesium.defaultValue(entity._drawShow, false);

          this.setCursor(true);

          if (draggerHandler.dragger.onDragStart) {
            var position = getPositionValue(draggerHandler.dragger.position);
            draggerHandler.dragger.onDragStart(draggerHandler.dragger, position);
          }

          this.fire(eventType.editMouseDown, {
            edittype: this.entity.attribute.type,
            entity: this.entity,
            position: event.position
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    draggerHandler.setInputAction(event => {
      var dragger = draggerHandler.dragger;
      if (dragger) {
        switch (dragger._pointType) {
          case draggerCtl.PointType.MoveHeight: //改变高度垂直拖动
            var dy = event.endPosition.y - event.startPosition.y;

            var position = getPositionValue(dragger.position, this.viewer.clock.currentTime);
            var tangentPlane = new Cesium.EllipsoidTangentPlane(position);

            scratchBoundingSphere.center = position;
            scratchBoundingSphere.radius = 1;

            var metersPerPixel =
              this.viewer.scene.frameState.camera.getPixelSize(
                scratchBoundingSphere,
                this.viewer.scene.frameState.context.drawingBufferWidth,
                this.viewer.scene.frameState.context.drawingBufferHeight
              ) * 1.5;

            Cesium.Cartesian3.multiplyByScalar(tangentPlane.zAxis, -dy * metersPerPixel, zOffset);
            var newPosition = Cesium.Cartesian3.clone(position);
            Cesium.Cartesian3.add(position, zOffset, newPosition);

            dragger.position = newPosition;
            if (dragger.onDrag) {
              dragger.onDrag(dragger, newPosition, position);
            }
            this.updateAttrForEditing();
            break;
          default:
            //默认修改位置
            this.tooltip.showAt(event.endPosition, message.edit.end);

            var point = getCurrentMousePosition(this.viewer.scene, event.endPosition, this.entity);

            if (point) {
              dragger.position = point;
              if (dragger.onDrag) {
                dragger.onDrag(dragger, point);
              }
              this.updateAttrForEditing();
            }
            break;
        }
        this.fire(eventType.editMouseMove, {
          edittype: this.entity.attribute.type,
          entity: this.entity,
          position: event.endPosition
        });
      } else {
        this.tooltip.setVisible(false);

        var pickedObject = this.viewer.scene.pick(event.endPosition);
        if (Cesium.defined(pickedObject)) {
          var entity = pickedObject.id;
          if (entity && Cesium.defaultValue(entity._isDragger, false) && entity.draw_tooltip) {
            var draw_tooltip = entity.draw_tooltip;

            //可删除时，提示右击删除
            if (
              draggerCtl.PointType.Control == entity._pointType &&
              this._positions_draw &&
              this._positions_draw.length &&
              this._positions_draw.length > this._minPointNum
            )
              draw_tooltip += message.del.def;

            if (
              this.viewer.das.contextmenu &&
              this.viewer.das.contextmenu.show &&
              this.viewer.das.contextmenu.target == entity
            ) {
              //删除右键菜单打开了不显示tooltip
            } else {
              this.tooltip.showAt(event.endPosition, draw_tooltip);
            }
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    draggerHandler.setInputAction(event => {
      var dragger = draggerHandler.dragger;
      if (dragger) {
        this.setCursor(false);
        dragger.show = true;

        var position = getPositionValue(dragger.position, this.viewer.clock.currentTime);

        if (dragger.onDragEnd) {
          dragger.onDragEnd(dragger, position);
        }
        this.fire(eventType.editMovePoint, {
          edittype: this.entity.attribute.type,
          entity: this.entity,
          position: position
        });

        draggerHandler.dragger = null;
        this.viewer._hasEdit = false;
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        this.viewer.scene.screenSpaceCameraController.enableTilt = false;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
        this.viewer.scene.screenSpaceCameraController.enableInputs = true;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    //右击删除一个点
    draggerHandler.setInputAction(event => {
      //右击删除上一个点
      var pickedObject = this.viewer.scene.pick(event.position);
      if (Cesium.defined(pickedObject)) {
        var entity = pickedObject.id;
        if (
          entity &&
          Cesium.defaultValue(entity._isDragger, false) &&
          draggerCtl.PointType.Control == entity._pointType
        ) {
          var isDelOk = this.deletePointForDragger(entity, event.position);

          if (isDelOk)
            this.fire(eventType.editRemovePoint, {
              edittype: this.entity.attribute.type,
              entity: this.entity
            });
        }
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    this.draggerHandler = draggerHandler;
  }
  destroyEvent() {
    this.viewer._hasEdit = false;
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    this.viewer.scene.screenSpaceCameraController.enableTilt = false;
    this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    this.viewer.scene.screenSpaceCameraController.enableInputs = true;

    this.setCursor(false);

    if (this.draggerHandler) {
      if (this.draggerHandler.dragger) this.draggerHandler.dragger.show = true;

      this.draggerHandler.destroy();
      this.draggerHandler = null;
    }
  }
  bindDraggers() {}
  updateDraggers() {
    if (!this._enabled) {
      return this;
    }

    this.destroyDraggers();
    this.bindDraggers();
  }
  destroyDraggers() {
    for (var i = 0, len = this.draggers.length; i < len; i++) {
      this.entityCollection.remove(this.draggers[i]);
    }
    this.draggers = [];
  }
  //删除点
  deletePointForDragger(dragger, position) {
    if (!this._positions_draw) return;
    if (this._positions_draw.length - 1 < this._minPointNum) {
      this.tooltip.showAt(position, message.del.min + this._minPointNum);
      return false;
    }

    var index = dragger.index;
    if (index >= 0 && index < this._positions_draw.length) {
      this._positions_draw.splice(index, 1);
      this.updateDraggers();
      this.updateAttrForEditing();
      return true;
    } else {
      return false;
    }
  }
  updateAttrForEditing() {}
  destroy() {
    this.disable();
    super.destroy();
  }
}
