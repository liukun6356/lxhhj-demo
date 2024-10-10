import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";

//绑定事件监听方法到Cesium原生对象上
export function bindEvent(className) {
  Object.defineProperties(Cesium[className].prototype, {
    eventTarget: {
      set: function(value) {
        this._eventTarget = value;
      },
      get: function() {
        if (!this._eventTarget) {
          this._eventTarget = new DasClass();
        }
        return this._eventTarget;
      }
    }
  });
  Cesium[className].prototype.on = function(types, fn, context) {
    return this.eventTarget.on(types, fn, context);
  };
  Cesium[className].prototype.off = function(types, fn, context) {
    return this.eventTarget.off(types, fn, context);
  };
  Cesium[className].prototype.fire = function(type, data, propagate) {
    return this.eventTarget.fire(type, data, propagate);
  };
  Cesium[className].prototype.once = function(types, fn, context) {
    return this.eventTarget.once(types, fn, context);
  };
  Cesium[className].prototype.listens = function(type, propagate) {
    return this.eventTarget.listens(type, propagate);
  };

  Cesium[className].event = {
    click: eventType.click,
    mouseOver: eventType.mouseOver,
    mouseOut: eventType.mouseOut
  };
}

bindEvent("Entity");
bindEvent("Cesium3DTileset");
bindEvent("Primitive");
bindEvent("GroundPrimitive");
bindEvent("GroundPolylinePrimitive");
