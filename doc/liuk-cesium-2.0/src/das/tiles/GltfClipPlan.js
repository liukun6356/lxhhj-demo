import * as Cesium from "cesium";
import { currentTime } from "../util/util";
import { TilesClipPlan } from "./TilesClipPlan";

//模型剖切(平面)类
export class GltfClipPlan extends TilesClipPlan {
  //========== 对外属性 ==========
  get entity() {
    return this._tileset;
  }
  set entity(val) {
    this._tileset = val;
    this._inverseTransform = null;
  }

  //========== 方法 ==========

  getInverseTransform() {
    if (!this._inverseTransform) {
      let transform = Cesium.Transforms.eastNorthUpToFixedFrame(
        this._tileset.position.getValue(currentTime())
      );
      this._inverseTransform = Cesium.Matrix4.inverseTransformation(
        transform,
        new Cesium.Matrix4()
      );
    }
    return this._inverseTransform;
  }

  setPlanes(planes, opts) {
    opts = opts || {};

    this.clear();
    if (!planes) return;

    var clippingPlanes = new Cesium.ClippingPlaneCollection({
      planes: planes,
      edgeWidth: Cesium.defaultValue(opts.edgeWidth, 0.0),
      edgeColor: Cesium.defaultValue(opts.edgeColor, Cesium.Color.WHITE),
      unionClippingRegions: Cesium.defaultValue(opts.unionClippingRegions, false)
    });
    this.clippingPlanes = clippingPlanes;
    this._tileset.model.clippingPlanes = clippingPlanes;
  }

  //清除裁剪面
  clear() {
    if (this._tileset.model.clippingPlanes) {
      this._tileset.model.clippingPlanes.enabled = false;
      this._tileset.model.clippingPlanes = undefined;
    }

    if (this.clippingPlanes) {
      delete this.clippingPlanes;
    }
  }
}

/**
 * 裁剪模型 类型 枚举
 *@enum {Number}
 */
TilesClipPlan.Type = {
  /** z水平面,水平切底部 */
  Z: 1,
  /** z水平面，水平切顶部 */
  ZR: 2,
  /** x垂直面,水平切底部 */
  X: 3,
  /** x垂直面,东西方向切 */
  XR: 4,
  /** y垂直面, 南北方向切 */
  Y: 5,
  /** y垂直面，南北方向切*/
  YR: 6
};
