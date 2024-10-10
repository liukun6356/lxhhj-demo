import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import { setPositionsHeight } from "../util/point";
import { getHeightRange } from "../util/polygon";
import * as polygonAttr from "../draw/attr/Attr.Polygon";
import { pick3DTileset } from "../util/tileset";

//淹没分析(平面)类
export class FloodByEntity extends DasClass {
  //========== 构造方法 ==========
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = options.viewer;
  }

  //========== 对外属性 ==========
  //高度
  get height() {
    return this.extrudedHeight;
  }
  set height(val) {
    this.extrudedHeight = val;
  }

  //========== 方法 ==========

  //开发分析
  start(entity, options) {
    this.stop();

    this.entity = entity;
    this.options = options;

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (this.options.onChange) {
      var onChangefun = options.onChange;
      delete options.onChange;
      this.off(eventType.change);
      this.on(eventType.change, e => {
        onChangefun(e.height);
      });
    }
    if (this.options.onStop) {
      var onStopfun = options.onStop;
      delete options.onStop;
      this.off(eventType.end);
      this.on(eventType.end, onStopfun);
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.extrudedHeight = options.height;
    this.entity.polygon.extrudedHeight = new Cesium.CallbackProperty(time => {
      return this.extrudedHeight;
    }, false);

    this.fire(eventType.start);

    //修改高度值
    var positions = polygonAttr.getPositions(this.entity);
    var _has3dtiles = Cesium.defaultValue(
      options.has3dtiles,
      Cesium.defined(pick3DTileset(this.viewer.scene, positions))
    ); //是否在3ditiles上面
    if (!_has3dtiles) {
      this._last_depthTestAgainstTerrain = this.viewer.scene.globe.depthTestAgainstTerrain;
      this.viewer.scene.globe.depthTestAgainstTerrain = true;
    }

    positions = setPositionsHeight(positions, options.height);
    this.entity.polygon.hierarchy = new Cesium.PolygonHierarchy(positions);

    this.timeIdx = setInterval(() => {
      if (this.extrudedHeight >= this.options.maxHeight) {
        this.stop();
        this.fire(eventType.end);
        return;
      }
      var newHeight = this.extrudedHeight + this.options.speed/10;
      if (newHeight > this.options.maxHeight) {
        this.extrudedHeight = this.options.maxHeight;
      } else {
        this.extrudedHeight = newHeight;
      }

      this.fire(eventType.change, {
        height: this.extrudedHeight
      });
    }, 100);
  }
  //停止分析
  stop() {
    clearInterval(this.timeIdx);
  }

  //清除分析
  clear() {
    this.stop();
    if (this._last_depthTestAgainstTerrain !== null)
      this.viewer.scene.globe.depthTestAgainstTerrain = this._last_depthTestAgainstTerrain;
    this.entity = null;
  }

  //更新高度
  updateHeight(height) {
    this.extrudedHeight = height;

    this.fire(eventType.change, {
      height: this.extrudedHeight
    });
  }

  getHeightRange(positions) {
    return getHeightRange(positions, this.viewer.scene, {
      inSurface: true
    })
  }

  destroy() {
    this.clear();
    super.destroy();
  }
}

//[静态属性]本类中支持的事件类型常量
FloodByEntity.event = {
  start: eventType.start,
  change: eventType.change,
  end: eventType.end
};
