import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import { BaseLayer } from "../base/BaseLayer";
import { GraticuleProvider } from "../imageryProvider/GraticuleProvider";

export class GraticuleLayer extends BaseLayer {
  get layer() {
    return this._layer;
  }

  //添加
  add() {
    if (this._layer == null) {
      this.initData();
    }
    this.layer.setVisible(true);
    super.add();
  }
  //移除
  remove() {
    if (this._layer == null) return;

    this.layer.setVisible(false);
    super.remove();
  }

  initData() {
    this._layer = new GraticuleProvider({
      scene: this.viewer.scene,
      numLines: 10
    });
    this.fireMap(eventType.load, { layer: this._layer });
  }
}
