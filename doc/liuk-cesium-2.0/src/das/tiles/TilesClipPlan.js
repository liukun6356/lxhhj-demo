import * as Cesium from "cesium";
import { getAngle } from "../util/measure";

//模型剖切(平面)类
export class TilesClipPlan {
  //========== 构造方法 ==========
  constructor(options, oldparam) {
    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (oldparam) {
      oldparam.tileset = options;
      options = oldparam;
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.options = options;

    if (options.tileset) this._tileset = options.tileset;
    else if (options.entity) this._tileset = options.entity;

    if (options.type) {
      this.type = options.type;
    }
    if (options.positions) {
      this._clipOutSide = Cesium.defaultValue(options.clipOutSide, false);
      this.positions = options.positions;
    }
    if (Cesium.defined(options.distance)) {
      this.distance = options.distance;
    }
    if (Cesium.defined(options.height)) {
      this.distance = options.height;
    }
  }

  //========== 对外属性 ==========
  get tileset() {
    return this._tileset;
  }
  set tileset(val) {
    this._tileset = val;
    this._inverseTransform = null;
  }

  //裁剪面
  get planes() {
    return this.clippingPlanes;
  }

  get inverseTransform() {
    return this.getInverseTransform();
  }

  //裁剪距离
  get distance() {
    return this._distance;
  }
  set distance(val) {
    this._distance = val;
    this.updateDistance(val);
  }

  //裁剪类型
  get type() {
    return this._type;
  }
  set type(val) {
    this._type = val;

    this.clipByType(val);
  }

  //裁剪类型
  get positions() {
    return this._positions;
  }
  set positions(val) {
    this._positions = val;

    this.clipByPoints(val, { unionClippingRegions: this._clipOutSide });
  }

  //========== 方法 ==========

  //根据类型 创建裁剪面
  clipByType(type, opts) {
    //裁剪面
    var planes;
    switch (type) {
      case TilesClipPlan.Type.Z: //水平切底部
        planes = [
          new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 0, 1), 1) //z水平面
        ];
        break;
      case TilesClipPlan.Type.ZR: //水平切顶部
        planes = [
          new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 0, -1), 1) //z水平面
        ];
        break;

      case TilesClipPlan.Type.X: //东西方向切1
        planes = [
          new Cesium.ClippingPlane(new Cesium.Cartesian3(1, 0, 0), 1) //x垂直面
        ];
        break;
      case TilesClipPlan.Type.XR: //东西方向切2
        planes = [
          new Cesium.ClippingPlane(new Cesium.Cartesian3(-1, 0, 0), 1) //x垂直面
        ];
        break;

      case TilesClipPlan.Type.Y: //南北方向切1
        planes = [
          new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 1, 0), 1) //y垂直面
        ];
        break;
      case TilesClipPlan.Type.YR: //南北方向切2
        planes = [
          new Cesium.ClippingPlane(new Cesium.Cartesian3(0, -1, 0), 1) //y垂直面
        ];
        break;
    }

    this.setPlanes(planes, opts);
  }

  //更新裁剪距离(全部)
  updateAllDistance(val) {
    if (this.clippingPlanes == null) return;

    for (var i = 0; i < this.clippingPlanes.length; i++) {
      var plane = this.clippingPlanes.get(i);
      plane.distance = val;
    }
  }

  //更新裁剪距离
  updateDistance(val) {
    if (this.clippingPlanes == null) return;

    var len = this.clippingPlanes.length;
    if (len == 0) return;

    var plane = this.clippingPlanes.get(len - 1);
    plane.distance = val;
  }

  //根据坐标 创建裁剪面
  clipByPoints(points, opts) {
    opts = opts || {};
    opts.unionClippingRegions = Cesium.defaultValue(opts.unionClippingRegions, false); //true时外切

    if (points.length < 2) return;

    var planes = [];
    if (points.length == 2) {
      //线
      planes = [this._createPlaneByLine(points[0], points[1])];
    } else {
      //面

      //是否顺时针
      var startAngle = getAngle(points[0], points[1]);
      var endAngle = getAngle(points[0], points[2]);
      var direction = startAngle < endAngle;
      if (opts.unionClippingRegions) direction = !direction;

      var plan;
      for (var i = 0, len = points.length; i < len; ++i) {
        var nextIndex = (i + 1) % len;

        if (direction) plan = this._createPlaneByLine(points[nextIndex], points[i]);
        else plan = this._createPlaneByLine(points[i], points[nextIndex]);

        planes.push(plan);
      }

      var clipHeight = Cesium.defaultValue(opts.height, this.distance);
      if (Cesium.defined(clipHeight)) {
        plan = new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 0, -1), clipHeight); //底面
        planes.push(plan);
      }
    }

    this.setPlanes(planes, opts);
  }

  _createPlaneByLine(p1, p2) {
    // 将仅包含经纬度信息的p1,p2，转换为相应坐标系的cartesian3对象
    let p1C3 = Cesium.Matrix4.multiplyByPoint(
      this.inverseTransform,
      p1,
      new Cesium.Cartesian3(0, 0, 0)
    );
    let p2C3 = Cesium.Matrix4.multiplyByPoint(
      this.inverseTransform,
      p2,
      new Cesium.Cartesian3(0, 0, 0)
    );

    // 定义一个垂直向上的向量up
    let up = new Cesium.Cartesian3(0, 0, 10);
    //  right 实际上就是由p1指向p2的向量
    let right = Cesium.Cartesian3.subtract(p2C3, p1C3, new Cesium.Cartesian3());

    // 计算normal， right叉乘up，得到平面法向量，这个法向量指向right的右侧
    let normal = Cesium.Cartesian3.cross(right, up, new Cesium.Cartesian3());
    normal = Cesium.Cartesian3.normalize(normal, normal);

    //由于已经获得了法向量和过平面的一点，因此可以直接构造Plane,并进一步构造ClippingPlane
    let planeTmp = Cesium.Plane.fromPointNormal(p1C3, normal);
    return Cesium.ClippingPlane.fromPlane(planeTmp);
  }

  getInverseTransform() {
    if (!this._inverseTransform) {
      let transform;
      let tmp = this._tileset.root.transform;
      if ((tmp && tmp.equals(Cesium.Matrix4.IDENTITY)) || !tmp) {
        // 如果root.transform不存在，则3DTiles的原点变成了boundingSphere.center
        transform = Cesium.Transforms.eastNorthUpToFixedFrame(this._tileset.boundingSphere.center);
      } else {
        transform = Cesium.Matrix4.fromArray(this._tileset.root.transform);
      }
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
      // modelMatrix : Cesium.Transforms.eastNorthUpToFixedFrame(position),
      planes: planes,
      edgeWidth: Cesium.defaultValue(opts.edgeWidth, 0.0),
      edgeColor: Cesium.defaultValue(opts.edgeColor, Cesium.Color.WHITE),
      unionClippingRegions: Cesium.defaultValue(opts.unionClippingRegions, false)
    });
    this.clippingPlanes = clippingPlanes;
    this._tileset.clippingPlanes = clippingPlanes;
  }

  //清除裁剪面
  clear() {
    if (this._tileset.clippingPlanes) {
      this._tileset.clippingPlanes.enabled = false;
      this._tileset.clippingPlanes.removeAll();
      // if (!this._tileset.clippingPlanes.isDestroyed())
      //     this._tileset.clippingPlanes.destroy();
      this._tileset.clippingPlanes = undefined;
    }

    if (this.clippingPlanes) {
      delete this.clippingPlanes;
    }
  }

  //销毁
  destroy() {
    this.clear();

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
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
