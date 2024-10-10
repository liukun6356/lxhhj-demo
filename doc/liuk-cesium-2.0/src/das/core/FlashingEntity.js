import * as Cesium from "cesium";
import { isArray } from "../util/util";

//定时闪烁高亮Entity（点、线、面）
export class FlashingEntity {
  //========== 构造方法 ==========
  constructor(options) {
    this.color = Cesium.Color.YELLOW.withAlpha(0);
  }

  //========== 方法 ==========
  highlight(entitys, opts) {
    var that = this;
    this.unHighlight();

    opts = opts || {};

    this.entitys = entitys;
    this.maxAlpha = Cesium.defaultValue(opts.maxAlpha, 0.3);
    this.time = Cesium.defaultValue(opts.time, 10); //播放时长
    this.color = Cesium.defaultValue(opts.color, Cesium.Color.YELLOW);
    this.color = this.color.withAlpha(this.maxAlpha);
    this.onEnd = opts.onEnd;

    this._startTime();

    loopArrayForFun(entitys, function(entity) {
      if (entity.polygon) {
        entity.polygon.material_bak = entity.polygon.material;
        entity.polygon.material = new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(time => {
            return that.color;
          }, false)
        );
      }
      if (entity.polyline) {
        entity.polyline.material_bak = entity.polyline.material;
        entity.polyline.material = new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(time => {
            return that.color;
          }, false)
        );
      }
      if (entity.ellipse) {
        entity.ellipse.material_bak = entity.ellipse.material;
        entity.ellipse.material = new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(time => {
            return that.color;
          }, false)
        );
      }
      if (entity.rectangle) {
        entity.rectangle.material_bak = entity.rectangle.material;
        entity.rectangle.material = new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(time => {
            return that.color;
          }, false)
        );
      }
      if (entity.wall) {
        entity.wall.material_bak = entity.wall.material;
        entity.wall.material = new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(time => {
            return that.color;
          }, false)
        );
      }

      if (entity.point) {
        entity.point.color_bak = entity.point.color;
        entity.point.color = that.color;
      }
      if (entity.billboard) {
        entity.billboard.color_bak = entity.billboard.color;
        entity.billboard.color = that.color;
      }
      if (entity.model) {
        entity.model.color_bak = entity.model.color;
        entity.model.color = that.color;
      }
      if (entity.label) {
        entity.label.fillColor_bak = entity.label.fillColor;
        entity.label.fillColor = that.color;
      }
    });
    return this;
  }

  unHighlight() {
    this._stopTime();

    if (this.entitys) {
      loopArrayForFun(this.entitys, function(entity) {
        if (entity.polygon) {
          if (entity.polygon.material_bak) entity.polygon.material = entity.polygon.material_bak;
        }
        if (entity.polyline) {
          if (entity.polyline.material_bak) entity.polyline.material = entity.polyline.material_bak;
        }
        if (entity.ellipse) {
          if (entity.ellipse.material_bak) entity.ellipse.material = entity.ellipse.material_bak;
        }
        if (entity.rectangle) {
          if (entity.rectangle.material_bak)
            entity.rectangle.material = entity.rectangle.material_bak;
        }
        if (entity.wall) {
          if (entity.wall.material_bak) entity.wall.material = entity.wall.material_bak;
        }

        if (entity.point) {
          if (entity.point.color_bak) entity.point.color = entity.point.color_bak;
        }
        if (entity.billboard) {
          if (entity.billboard.color_bak) entity.billboard.color = entity.billboard.color_bak;
        }
        if (entity.model) {
          if (entity.model.color_bak) entity.model.color = entity.model.color_bak;
        }
        if (entity.label) {
          if (entity.label.fillColor_bak) entity.label.fillColor = entity.label.fillColor_bak;
        }
      });
      if (this.onEnd) this.onEnd(this.entitys);
      delete this.entitys;
    }
    return this;
  }

  _updateClr() {
    var that = this;
    if (this.entitys) {
      loopArrayForFun(this.entitys, function(entity) {
        if (entity.point) {
          entity.point.color = that.color;
        }
        if (entity.billboard) {
          entity.billboard.color = that.color;
        }
        if (entity.model) {
          entity.model.color = that.color;
        }
        if (entity.label) {
          entity.label.fillColor = that.color;
        }
      });
    }
  }

  _startTime() {
    var time = 30;
    var setp = this.maxAlpha / time;

    var alpha = 0;
    this.interVal = setInterval(() => {
      alpha += setp;
      if (alpha > this.maxAlpha) alpha = 0;
      this.color = this.color.withAlpha(alpha);
      this._updateClr();
    }, time);

    this.timeEndVal = setTimeout(() => {
      this.unHighlight();
    }, this.time * 1000);
  }
  _stopTime() {
    clearInterval(this.interVal);
    clearTimeout(this.timeEndVal);
  }
}

//循环执行数组或对象
// 调用示例 loopArrayForFun(ArrOrObj, function (entity) {
//    drawControl.deleteEntity(entity);
// });
export function loopArrayForFun(ArrOrObj, callback) {
  if (ArrOrObj == null) return;
  if (isArray(ArrOrObj)) {
    var arr = [];
    for (var i = 0, len = ArrOrObj.length; i < len; i++) {
      arr.push(callback(ArrOrObj[i]));
    }
    return arr;
  } else {
    return callback(ArrOrObj);
  }
}
