import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import { DivPoint, style2Entity } from "../../feature/DivPoint";
import { DrawPoint } from "../../draw/draw/Draw.Point";
import { register } from "../../draw/Draw";
import { message } from "../../draw/core/Tooltip";

//div点
var drawtype = "div-point";

//与entity的联动矢量对象
class FeatureEx {
  constructor(options) {
    var viewer = options.viewer;
    var draw = options.draw;
    var entity = options.entity;
    var style = options.style;

    var divpoint;
    if (style.divpoint) {
      //外部构造好的divpoint
      divpoint = style.divpoint;
      divpoint.position = entity.position;
    } else {
      divpoint = new DivPoint(viewer, {
        position: entity.position,
        ...style2Entity(style)
      });
    }

    divpoint.enable = false;
    divpoint.on(eventType.click, e => {
      if (Cesium.defined(entity.hasDrawEdit) && !entity.hasDrawEdit()) return;

      divpoint.enable = false;

      draw.activate(entity);
      entity.draw_tooltip = message.edit.end;
    });
    divpoint.on(eventType.mouseOver, e => {
      if (Cesium.defined(entity.hasDrawEdit) && !entity.hasDrawEdit()) return;
      draw.tooltip.showAt({ x: e.clientX, y: e.clientY }, "单击后 激活编辑");
    });
    divpoint.on(eventType.mouseOut, e => {
      if (Cesium.defined(entity.hasDrawEdit) && !entity.hasDrawEdit()) return;
      draw.tooltip.setVisible(false);
    });
    this.divpoint = divpoint;
  }

  get position() {
    return this.divpoint.position;
  }
  set position(val) {
    this.divpoint.position = val;
  }

  activate() {
    this.divpoint.enable = false;
  }
  updateStyle(style) {
    var newStyle = style2Entity(style);
    for (var key in newStyle) {
      if (key == "html") continue;
      this.divpoint[key] = newStyle[key];
    }
  }
  finish() {
    this.divpoint.enable = true;
  }
  destroy() {
    this.divpoint.destroy();
  }
}

export class DrawEx extends DrawPoint {
  createFeatureEx(style, entity) {
    if (entity.featureEx) {
      entity.featureEx.activate();
    } else {
      entity.point.show = false;
      entity.featureEx = new FeatureEx({
        viewer: this.viewer,
        draw: this,
        entity: entity,
        style: style
      });
    }
  }
}

//注册到Draw中
register(drawtype, DrawEx);
