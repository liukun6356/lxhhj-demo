import * as Cesium from "cesium";

//面状: 用于面状对象的 扫描线放大效果 材质属性
export class ScanLineMaterialProperty {
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
    return Cesium.Material.ScanLineType;
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
      (other instanceof ScanLineMaterialProperty &&
        Cesium.Property.equals(this._color, other._color) &&
        this._speed === other._speed)
    );
  }
}

Object.defineProperties(ScanLineMaterialProperty.prototype, {
  color: Cesium.createPropertyDescriptor("color"),
  speed: Cesium.createPropertyDescriptor("speed")
});
