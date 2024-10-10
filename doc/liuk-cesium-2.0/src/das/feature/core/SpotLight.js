import * as Cesium from "cesium";
import { DasClass } from "../../core/DasClass";
export class TextureChanged extends DasClass {
  constructor(viewer, options) {
    super(options);
    this.viewer = viewer;
    this._id = this.guid();
    this._position = Cesium.Cartesian3.clone(options.position);
    this._positionCV = new Cesium.Cartesian3();
    this._targetPosition = Cesium.Cartesian3.clone(options.targetPosition);
    this._targetPositionCV = new Cesium.Cartesian3();
    this._color = Cesium.defaultValue(options.color, new Cesium.Color(1, 1, 1, 1));
    this._intensity = Cesium.defaultValue(options.intensity, 2);
    this._distance = Cesium.defaultValue(options.distance, 100);
    this._angle = Cesium.defaultValue(options.angle, Math.PI / 6);
    this._exponent = Cesium.defaultValue(options.exponent, 10);
    this._decay = Cesium.defaultValue(options.decay, 1);
    this._direction = new Cesium.Cartesian3();
    this._directionEC = new Cesium.Cartesian3();
    Cesium.Cartesian3.subtract(this._position, this._targetPosition, this._direction);
    Cesium.Cartesian3.normalize(this._direction, this._direction);
    this._lightColor = Cesium.Color.multiplyByScalar(
      this._color,
      this._intensity,
      new Cesium.Color()
    );
    this._angleCos = Math.cos(this._angle);
    this._positionEC = new Cesium.Cartesian3();
    this._visibleInCullingVolume = 1;
    this._sceneMode = Cesium.SceneMode.SCENE3D;
  }
  guid() {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
  }

  convertToColumbusCartesian(position) {
    var ellipsoid = this.viewer.scene.globe.ellipsoid;
    //var cartographic = Cesium.Cartographic.fromDegrees(lng, lat, alt);
    var cartesian3 = ellipsoid.cartographicToCartesian(position);
    return cartesian3;
  }

  computeVisiblityInCullingVolume(a) {
  }
  //========== 对外属性 ==========
  get id() {
    return this._id;
  }

  get position() {
    return this._sceneMode === Cesium.SceneMode.SCENE3D ? this._position : this._positionCV;
  }
  set position(val) {
    if (!Cesium.Property.equals(val, this._targetPosition)) {
      this._position = val;
      if (this._sceneMode === Cesium.SceneMode.COLUMBUS_VIEW) {
        this._positionCV = this.convertToColumbusCartesian(this._position);
        Cesium.Cartesian3.subtract(this._positionCV, this._targetPositionCV, this._direction);
      } else {
        Cesium.Cartesian3.subtract(this._position, this._targetPosition, this._direction);
        Cesium.Cartesian3.normalize(this._direction, this._direction);
      }
    }
    //  Cesium.Property.equals(val, this._targetPosition) || (this._position = val, this._sceneMode === U.COLUMBUS_VIEW ? (this._positionCV = Ja.convertToColumbusCartesian(this._position), m.subtract(this._positionCV, this._targetPositionCV, this._direction)) : m.subtract(this._position, this._targetPosition, this._direction), m.normalize(this._direction, this._direction))
  }

  get targetPosition() {
    return this._sceneMode === Cesium.SceneMode.SCENE3D ? this._targetPosition : this._targetPositionCV;
  }
  set targetPosition(val) {
    if (!Cesium.Property.equals(val, this._position)) {
      this._targetPosition = val;
      if (this._sceneMode === Cesium.SceneMode.COLUMBUS_VIEW) {
        this._targetPositionCV = this.convertToColumbusCartesian(this._targetPosition);
        Cesium.Cartesian3.subtract(this._positionCV, this._targetPositionCV, this._direction);
      } else {
        Cesium.Cartesian3.subtract(this._position, this._targetPosition, this._direction);
        Cesium.Cartesian3.normalize(this._direction, this._direction);
      }
    }
  //  m.equals(a, this._position) || (this._targetPosition = a, this._sceneMode === U.COLUMBUS_VIEW ? (this._targetPositionCV = Ja.convertToColumbusCartesian(this._targetPosition), m.subtract(this._positionCV, this._targetPositionCV, this._direction)) : m.subtract(this._position, this._targetPosition, this._direction), m.normalize(this._direction, this._direction))
  }

  get color() {
    return this._color;
  }
  set color(a) {
    this._color = a;
    Cesium.Color.multiplyByScalar(this._color, this._intensity, this._lightColor);
  }

  get intensity() {
    return this._intensity;
  }
  set intensity(a) {
    this._intensity = a;
    Cesium.Color.multiplyByScalar(this._color, this._intensity, this._lightColor);
  }

  get distance() {
    return this._distance;
  }
  set distance(a) {
    this._distance = a;
  }

  get angle() {
    return this._angle;
  }
  set angle(a) {
    this._angle = a;
    this._angleCos = Math.cos(this._angle);
  }

  get exponent() {
    return this._exponent;
  }
  set exponent(a) {
    this._color = a;
  }

  get decay() {
    return this._decay
  }
  set decay(a) {
    this._decay = a;
  }

  get direction() {
    return this._direction;
  }
  set direction(a) {
    this._direction = a;
  }

  get lightColor() {
    return this._lightColor;
  }
  set lightColor(a) {
    this._lightColor = a;
  }

  get angleCos() {
    return this._angleCos;
  }
  set angleCos(a) {
    this._angleCos = a;
  }

  get positionEC() {
    return this._positionEC
  }
  set positionEC(a) {
    this._positionEC = a;
  }

  get directionEC() {
    return this._directionEC
  }
  set directionEC(a) {
    this._directionEC = a;
  }

  get lightType() {
    return "啦啦啦";
  }


  get visibleInCullingVolume() {
    return this._visibleInCullingVolume;
  }

  get sceneMode() {
    return this._sceneMode
  }
  set sceneMode(val) {
    if (this._sceneMode !== val) {
      this._sceneMode = val;
      if (this._sceneMode === Cesium.SceneMode.COLUMBUS_VIEW) {
        this._positionCV = this.convertToColumbusCartesian(this._position);
        this._targetPositionCV = this.convertToColumbusCartesian(this._targetPosition);
        if (Cesium.Cartesian3.equals(this._positionCV, this._targetPositionCV)) return;
        Cesium.Cartesian3.subtract(this._positionCV, this._targetPositionCV, this._direction)
      } else Cesium.Cartesian3.subtract(this._position, this._targetPosition, this._direction);
      Cesium.Cartesian3.normalize(this._direction, this._direction);
    }
  }
}
