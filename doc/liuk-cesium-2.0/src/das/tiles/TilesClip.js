import * as Cesium from "cesium";
import { TilesBase } from "./TilesBase";

// 模型裁剪 类
export class TilesClip extends TilesBase {
  //========== 构造方法 ==========
  constructor(options) {
    super(options);

    this._clipOutSide = Cesium.defaultValue(options.clipOutSide, false);

    if (this.drawCommand) {
      this.activeEdit();
    }
  }

  //========== 对外属性 ==========

  get clipOutSide() {
    return this._clipOutSide;
  }
  set clipOutSide(val) {
    this._clipOutSide = Boolean(val);
    this.tileset.dasEditor.editVar[0] = this.clipOutSide;
  }

  activeEdit() {
    this.tileset.dasEditor.fbo = this.fbo;
    this.tileset.dasEditor.polygonBounds = this.polygonBounds;
    this.tileset.dasEditor.IsYaPing[0] = true;
    this.tileset.dasEditor.IsYaPing[2] = true;
    this.tileset.dasEditor.editVar[0] = this.clipOutSide;
    this.addToScene();
  }
}
