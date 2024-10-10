import * as Cesium from "cesium";
import { TileLayer } from "./TileLayer";

export class SuperMapImgLayer extends TileLayer {
  add() {
    super.add();

    var options = this.options;
    if (Cesium.defined(options.transparentBackColorTolerance)) {
      this.layer.transparentBackColorTolerance = options.transparentBackColorTolerance; //去黑边
    }
  }
}
