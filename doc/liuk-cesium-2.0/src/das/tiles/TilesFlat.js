import * as Cesium from "cesium";
import { TilesBase } from "./TilesBase";

//默认压平至所选取的最低点高度，由flatHeight变量控制压平高度的变化
// 模型压平 类
export class TilesFlat extends TilesBase {
  //========== 构造方法 ==========
  constructor(options) {
    super(options);

    this._flatHeight = options.flatHeight || 0;

    if (this.drawCommand) {
      this.activeEdit();
    }
  }

  //========== 对外属性 ==========

  //偏移量
  get flatHeight() {
    return this._flatHeight;
  }
  set flatHeight(val) {
    this._flatHeight = Number(val);
    this.tileset.dasEditor.heightVar[1] = this._flatHeight;
  }

  activeEdit() {
    this.tileset.dasEditor.fbo = this.fbo;
    this.tileset.dasEditor.polygonBounds = this.polygonBounds;
    this.tileset.dasEditor.IsYaPing[0] = true;
    this.tileset.dasEditor.IsYaPing[1] = true;
    this.tileset.dasEditor.heightVar[0] = this.minLocalPos.z;
    this.tileset.dasEditor.heightVar[1] = this.flatHeight;
    this.addToScene();
  }
}
