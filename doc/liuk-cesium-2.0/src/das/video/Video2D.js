import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import * as daslog from "../util/log";
import { isString } from "../util/util";

let ratateDirection = {
  LEFT: "Z",
  RIGHT: "-Z",
  TOP: "Y",
  BOTTOM: "-Y",
  ALONG: "X",
  INVERSE: "-X"
};

//视频融合（投射2D平面）
//原理：根据相机位置，方向等参数，在相机前面生成一个平面，然后贴视频纹理
export class Video2D extends DasClass {
  //========== 构造方法 ==========
  constructor(viewer, options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (oldparam) {
      oldparam.dom = options;
      options = oldparam;
    }
    if (Cesium.defined(options.frustumShow)) options.showFrustum = options.frustumShow;
    this.frustumShow = this.showFrustum;
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = viewer;
    this.options = options;

    this._play = true;
    if (options.aspectRatio) {
      this._aspectRatio = options.aspectRatio;
    } else {
      this._aspectRatio =
        this.viewer.scene.context.drawingBufferWidth /
        this.viewer.scene.context.drawingBufferHeight;
    }

    this._fov = Cesium.defaultValue(options.fov, this.viewer.scene.camera.frustum.fov);
    this._dis = Cesium.defaultValue(options.dis, 10);
    this._stRotation = Cesium.defaultValue(options.stRotation, 0);
    this._rotateCam = Cesium.defaultValue(options.rotateCam, 0.05);
    this._frustumShow = Cesium.defaultValue(options.showFrustum, true);

    this._camera = options.camera;

    //传入了DOM
    if (options.dom) {
      if (options.dom instanceof Object && options.dom.length) {
        this.dom = options.dom[0];
      } else {
        this.dom = options.dom;
      }
    }

    //兼容直接传入单击回调方法，适合简单场景下使用。
    if (options.click) {
      this.on(eventType.click, options.click);
    }

    this.init();
  }

  //视频播放暂停
  get play() {
    return this._play;
  }
  set play(val) {
    this._play = val;
    if (!this.dom) return;

    if (this._play) {
      this.dom.play();
    } else {
      this.dom.pause();
    }
  }
  //宽高比
  get aspectRatio() {
    return this._aspectRatio;
  }
  set aspectRatio(val) {
    val = Number(val);
    if (!val || val < 0) return;
    if (val < 1.0) val = 1.0;
    this._aspectRatio = val;
    this.reset();
  }
  //张角
  get fov() {
    return this._fov;
  }
  set fov(val) {
    val = Number(val);
    if (!val || val < 0) return;
    this._fov = val;
    this.reset();
  }
  //投射距离
  get dis() {
    return this._dis;
  }
  set dis(val) {
    val = Number(val);
    if (!val || val < 0) return;
    this._dis = val;
    this.reset();
  }

  //UV旋转
  get stRotation() {
    return this._stRotation;
  }
  set stRotation(val) {
    val = Number(val);
    if (!val || val < 0) return;
    this._stRotation = val;
    this.entity.polygon.stRotation = val;
  }

  //视椎体显示
  get showFrustum() {
    return this._frustumShow;
  }
  set showFrustum(val) {
    this._frustumShow = val;
    this.frustumPri.show = val;
  }

  /** 所有相机的参数  */
  get params() {
    var viewJson = {
      fov: this.fov,
      dis: this.dis,
      stRotation: this.stRotation,
      showFrustum: this.showFrustum,
      aspectRatio: this.aspectRatio,
      camera: {
        position: this.recordObj.position,
        direction: this.recordObj.direction,
        up: this.recordObj.up,
        right: this.recordObj.right
      }
    };
    return viewJson;
  }

  init() {
    this.recordObj = this.record();
    this.rectPos = this.computedPos(this.dis, this.fov, this.aspectRatio, this.recordObj);
    var sys = this.getOrientation(this.recordObj);
    var frustum = this.createFrustum(this.fov, this.aspectRatio, this.dis);
    var frustumGeo = this.createFrustumGeo(frustum, sys, this.recordObj.position);
    this.frustumPri = this.createFrustumPri(frustumGeo);
    this.addToScene();
  }
  reset() {
    this.viewer.scene.primitives.remove(this.frustumPri);
    this.viewer.entities.remove(this.entity);

    this.rectPos = this.computedPos(this.dis, this.fov, this.aspectRatio, this.recordObj);
    var sys = this.getOrientation(this.recordObj);
    var frustum = this.createFrustum(this.fov, this.aspectRatio, this.dis);
    var frustumGeo = this.createFrustumGeo(frustum, sys, this.recordObj.position);
    this.frustumPri = this.createFrustumPri(frustumGeo);
    this.addToScene();
  }
  record() {
    var obj = {};
    var camera = this._camera || this.viewer.scene.camera;
    obj.direction = Cesium.clone(camera.direction);
    obj.up = Cesium.clone(camera.up);
    obj.right = Cesium.clone(camera.right);
    obj.position = Cesium.clone(camera.position);
    return obj;
  }
  addToScene() {
    this.viewer.scene.primitives.add(this.frustumPri);
    this.entity = this.viewer.entities.add(
      new Cesium.Entity({
        polygon: {
          hierarchy: this.rectPos,
          perPositionHeight: true,
          material: this.dom || this.options.material,
          stRotation: this.stRotation
        }
      })
    );

    //das3d扩展的属性
    this.entity.data = this.options;
    this.entity.eventTarget = this;
    this.entity.popup = this.options.popup;
    this.entity.tooltip = this.options.tooltip;
  }
  computedPos(dis, fov, kgb, camera) {
    var vpos = camera.position;
    var vdir = camera.direction;
    var vright = camera.right;
    var vup = camera.up;

    var vray = new Cesium.Ray(vpos, vdir);
    var vmbpos = Cesium.Ray.getPoint(vray, dis, new Cesium.Cartesian3());
    var halfFov = fov / 2.0;
    var tanres = Math.tan(halfFov);
    var horiDis = dis * tanres;
    var vertDis = horiDis / kgb;
    var xbDis = Math.sqrt(horiDis * horiDis + vertDis * vertDis);

    var ysj = new Cesium.Cartesian3();
    var rightRay = new Cesium.Ray(vmbpos, vright);
    var rightPos = Cesium.Ray.getPoint(rightRay, horiDis, new Cesium.Cartesian3());
    var upRay = new Cesium.Ray(rightPos, vup);
    Cesium.Ray.getPoint(upRay, vertDis, ysj);

    var yxj = new Cesium.Cartesian3();
    var fvup = Cesium.Cartesian3.negate(vup, new Cesium.Cartesian3());
    var fupRay = new Cesium.Ray(rightPos, fvup);
    Cesium.Ray.getPoint(fupRay, vertDis, yxj);

    var zxj = new Cesium.Cartesian3();
    var djdir1 = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(vmbpos, ysj, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );
    var djRay1 = new Cesium.Ray(vmbpos, djdir1);
    Cesium.Ray.getPoint(djRay1, xbDis, zxj);

    var zsj = new Cesium.Cartesian3();
    var djdir2 = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(vmbpos, yxj, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );
    var djRay2 = new Cesium.Ray(vmbpos, djdir2);
    Cesium.Ray.getPoint(djRay2, xbDis, zsj);

    if (this.options.reverse) {
      return [zxj, zsj, ysj, yxj].reverse();
    }
    return [zxj, zsj, ysj, yxj];
  }

  createFrustum(fov, kgb, dis) {
    return new Cesium.PerspectiveFrustum({
      fov: fov,
      aspectRatio: kgb,
      near: 0.1,
      far: dis
    });
  }
  getOrientation(camera) {
    if (!camera) return;
    var direction = camera.direction;
    var up = camera.up;
    var right = camera.right;
    var scratchRight = new Cesium.Cartesian3();
    var scratchRotation = new Cesium.Matrix3();
    var scratchOrientation = new Cesium.Quaternion();

    // var right = Cesium.Cartesian3.cross(direction,up,new Cesium.Cartesian3());
    right = Cesium.Cartesian3.negate(right, scratchRight);
    var rotation = scratchRotation;
    Cesium.Matrix3.setColumn(rotation, 0, right, rotation);
    Cesium.Matrix3.setColumn(rotation, 1, up, rotation);
    Cesium.Matrix3.setColumn(rotation, 2, direction, rotation);
    //计算视锥姿态
    var orientation = Cesium.Quaternion.fromRotationMatrix(rotation, scratchOrientation);
    return orientation;
  }
  createFrustumGeo(frustum, sys, origin) {
    return new Cesium.FrustumOutlineGeometry({
      frustum: frustum,
      orientation: sys,
      origin: origin
    });
  }
  createFrustumPri(geo) {
    return new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: geo,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AZURE)
        }
      }),
      appearance: new Cesium.PerInstanceColorAppearance({
        flat: true
      }),
      show: this.showFrustum
    });
  }
  /**
   * 呈现投影相机的第一视角
   */
  locate() {
    this.viewer.camera.direction = Cesium.clone(this.recordObj.direction);
    this.viewer.camera.right = Cesium.clone(this.recordObj.right);
    this.viewer.camera.up = Cesium.clone(this.recordObj.up);
    this.viewer.camera.position = Cesium.clone(this.recordObj.position);
  }

  //旋转相机
  rotateCamera(axis, deg) {
    var rotateDegree = Cesium.defaultValue(deg, this._rotateCam);
    switch (axis) {
      case ratateDirection.LEFT:
        break;
      case ratateDirection.RIGHT:
        rotateDegree *= -1;
        break;
      case ratateDirection.TOP:
        break;
      case ratateDirection.BOTTOM:
        rotateDegree *= -1;
        break;
      case ratateDirection.ALONG:
        break;
      case ratateDirection.INVERSE:
        rotateDegree *= -1;
        break;
    }
    var newObj = this._computedNewViewDir(axis, rotateDegree);
    this.recordObj.direction = newObj.direction;
    this.recordObj.up = newObj.up;
    this.recordObj.right = newObj.right;
    this.reset();
  }

  //计算新视点
  _computedNewViewDir(axis, deg) {
    deg = Cesium.Math.toRadians(deg);
    var camera = this.recordObj;
    var oldDir = Cesium.clone(camera.direction);
    var oldRight = Cesium.clone(camera.right);
    var oldTop = Cesium.clone(camera.up);
    var mat3 = new Cesium.Matrix3();

    switch (axis) {
      case ratateDirection.LEFT:
        Cesium.Matrix3.fromRotationZ(deg, mat3);
        break;
      case ratateDirection.RIGHT:
        Cesium.Matrix3.fromRotationZ(deg, mat3);
        break;
      case ratateDirection.TOP:
        Cesium.Matrix3.fromRotationY(deg, mat3);
        break;
      case ratateDirection.BOTTOM:
        Cesium.Matrix3.fromRotationY(deg, mat3);
        break;
      case ratateDirection.ALONG:
        Cesium.Matrix3.fromRotationX(deg, mat3);
        break;
      case ratateDirection.INVERSE:
        Cesium.Matrix3.fromRotationX(deg, mat3);
        break;
    }
    var localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(camera.position);
    // var hpr = new Cesium.HeadingPitchRoll(viewer.camera.heading,viewer.camera.pitch,viewer.camera.roll);
    // localToWorld_Matrix = Cesium.Transforms.headingPitchRollToFixedFrame(viewer.camera.position,hpr,Cesium.Ellipsoid.WGS84,Cesium.Transforms.eastNorthUpToFixedFrame);
    var worldToLocal_Matrix = Cesium.Matrix4.inverse(localToWorld_Matrix, new Cesium.Matrix4());

    var localDir = Cesium.Matrix4.multiplyByPointAsVector(
      worldToLocal_Matrix,
      oldDir,
      new Cesium.Cartesian3()
    );
    var localNewDir = Cesium.Matrix3.multiplyByVector(mat3, localDir, new Cesium.Cartesian3());
    var newDir = Cesium.Matrix4.multiplyByPointAsVector(
      localToWorld_Matrix,
      localNewDir,
      new Cesium.Cartesian3()
    );

    var localRight = Cesium.Matrix4.multiplyByPointAsVector(
      worldToLocal_Matrix,
      oldRight,
      new Cesium.Cartesian3()
    );
    var localNewRight = Cesium.Matrix3.multiplyByVector(mat3, localRight, new Cesium.Cartesian3());
    var newRight = Cesium.Matrix4.multiplyByPointAsVector(
      localToWorld_Matrix,
      localNewRight,
      new Cesium.Cartesian3()
    );

    var localTop = Cesium.Matrix4.multiplyByPointAsVector(
      worldToLocal_Matrix,
      oldTop,
      new Cesium.Cartesian3()
    );
    var localNewTop = Cesium.Matrix3.multiplyByVector(mat3, localTop, new Cesium.Cartesian3());
    var newTop = Cesium.Matrix4.multiplyByPointAsVector(
      localToWorld_Matrix,
      localNewTop,
      new Cesium.Cartesian3()
    );
    return {
      direction: newDir,
      right: newRight,
      up: newTop
    };
  }

  destroy() {
    this.viewer.scene.primitives.remove(this.frustumPri);
    this.viewer.entities.remove(this.entity);

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}

//[静态属性]本类中支持的事件类型常量
Video2D.event = {
  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};
