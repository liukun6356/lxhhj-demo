import * as Cesium from "cesium";
import * as draggerCtl from "./Dragger";
import { message } from "../core/Tooltip";
import { EditBase } from "./Edit.Base";
import * as util from "../../util/util";

export class EditPoint extends EditBase {
  //外部更新位置
  setPositions(position) {
    if (util.isArray(position) && position.length == 1) {
      position = position[0];
    }
    this.entity.position.setValue(position);
    if (this.entity.featureEx) {
      this.entity.featureEx.position = position;
    }
  }
  bindDraggers() {
    var that = this;

    this.entity.draw_tooltip = message.dragger.def;
    var dragger = draggerCtl.createDragger(this.entityCollection, {
      dragger: this.entity,
      onDrag: function(dragger, newPosition) {
        that.entity.position.setValue(newPosition);

        if (that.entity.featureEx) {
          that.entity.featureEx.position = newPosition;
        }
      }
    });
  }
  //图形编辑结束后调用
  finish() {
    delete this.entity.draw_tooltip;
    delete this.entity._isDragger;
    delete this.entity._noMousePosition;
    delete this.entity._pointType;
    delete this.entity.onDrag;
  }
}
