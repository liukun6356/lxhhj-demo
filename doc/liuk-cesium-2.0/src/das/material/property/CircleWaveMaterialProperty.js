import * as Cesium from "cesium";

//圆形扩散波纹效果 材质属性
export class CircleWaveMaterialProperty {
  //========== 构造方法 ==========
  constructor(options) {
    options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);

    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._colorSubscription = undefined;
    this._time = undefined;

    //支持的属性
    this._color = Cesium.defaultValue(options.color, Cesium.Color.YELLOW); //颜色
    this._speed = Cesium.defaultValue(options.speed, 10); //速度，建议取值范围1-100
    this._count = Cesium.defaultValue(options.count, 1); //圆圈个数
    this._gradient = Cesium.defaultValue(options.gradient, 0.1); //透明度的幂方（0-1）,0表示无虚化效果，1表示虚化成均匀渐变

    //属性容错
    if (options.duration) {
      //兼容v2.2之前老版本
      this._speed = 30000 / options.duration;
    }
    if (this._count <= 0) this._count = 1;
    if (this._gradient < 0) this._gradient = 0;
    if (this._gradient > 1) this._gradient = 1;
  }

  //========== 对外属性 ==========
  get isConstant() {
    return false;
  }
  get definitionChanged() {
    return this._definitionChanged;
  }

  //========== 方法 ==========
  /**
   * Gets the {@link Cesium.Material} type at the provided time.
   *
   * @param {JulianDate} time The time for which to retrieve the type.
   * @returns {String} The type of material.
   */
  getType(time) {
    return Cesium.Material.CircleWaveType;
  }

  /**
   * Gets the value of the property at the provided time.
   *
   * @param {JulianDate} time The time for which to retrieve the value.
   * @param {Object} [result] The object to store the value into, if omitted, a new instance is created and returned.
   * @returns {Object} The modified result parameter or a new instance if the result parameter was not supplied.
   */
  getValue(time, result) {
    if (!Cesium.defined(result)) {
      result = {};
    }
    result.color = this._color;
    result.speed = this._speed;
    result.count = this._count;
    result.gradient = this._gradient;
    return result;
  }

  /**
   * Compares this property to the provided property and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param { Cesium.Property} [other] The other property.
   * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  equals(other) {
    return (
      this === other ||
      (other instanceof CircleWaveMaterialProperty &&
        Cesium.Property.equals(this._color, other._color) &&
        this._count === other._count &&
        this._speed === other._speed &&
        this._gradient === other._gradient)
    );
  }
}

Object.defineProperties(CircleWaveMaterialProperty.prototype, {
  color: Cesium.createPropertyDescriptor("color"),
  speed: Cesium.createPropertyDescriptor("speed"),
  count: Cesium.createPropertyDescriptor("count"),
  gradient: Cesium.createPropertyDescriptor("gradient")
});
