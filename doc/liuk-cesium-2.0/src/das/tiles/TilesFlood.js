import * as Cesium from "cesium";
import { TilesBase } from "./TilesBase";

// 模型淹没 类
export class TilesFlood extends TilesBase {
  //========== 构造方法 ==========
  constructor(options) {
    super(options);

    this.floodColor = options.floodColor || [0.15, 0.7, 0.95, 0.5];
    this.floodSpeed = options.floodSpeed || 5.5; //淹没速度，米/秒（默认刷新频率为55Hz）
    this._floodAll = options.floodAll;
    this.maxFloodDepth = options.maxFloodDepth || 200;
    this.ableFlood = true;
    if (this.drawCommand || this._floodAll) {
      this.activeEdit();
    }
  }

  //========== 对外属性 ==========

  get floodAll() {
    return this._floodAll;
  }
  set floodAll(val) {
    this._floodAll = Boolean(val);
    this.tileset.dasEditor.editVar[1] = this.floodAll;
  }

  bindSpeed() {
    var that = this;
    this.speedFun = function() {
      if (that.ableFlood) {
        that.tileset.dasEditor.floodVar[1] += that.floodSpeed / 55;
        if (that.tileset.dasEditor.floodVar[1] >= that.tileset.dasEditor.floodVar[2]) {
          that.tileset.dasEditor.floodVar[1] = that.tileset.dasEditor.floodVar[2];
        }
      }
    };
    this.viewer.clock.onTick.addEventListener(this.speedFun);
  }

  resetFlood() {
    this.tileset.dasEditor.floodVar[1] = this.tileset.dasEditor.floodVar[0];
  }

  activeEdit() {
    this.bindSpeed();
    this.tileset.dasEditor.fbo = this.fbo;
    this.tileset.dasEditor.polygonBounds = this.polygonBounds;
    this.tileset.dasEditor.IsYaPing[0] = true;
    this.tileset.dasEditor.IsYaPing[3] = true;
    this.tileset.dasEditor.floodVar = [
      this.minLocalPos.z,
      this.minLocalPos.z,
      this.minLocalPos.z + this.maxFloodDepth,
      200
    ];
    this.tileset.dasEditor.floodColor = this.floodColor;
    this.tileset.dasEditor.editVar[1] = this.floodAll || false;
    !this.floodAll && this.addToScene();
  }

  //销毁
  destroy() {
    this.viewer.clock.onTick.removeEventListener(this.speedFun);
    super.destroy();
  }
}
