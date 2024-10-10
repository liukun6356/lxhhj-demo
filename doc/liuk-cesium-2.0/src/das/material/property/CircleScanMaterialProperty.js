import * as Cesium from "cesium";

//圆形扫描效果 材质属性
export class CircleScanMaterialProperty {
  //========== 构造方法 ==========
  constructor(options) {
    options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);

    this._definitionChanged = new Cesium.Event();
    this._colorSubscription = undefined;

    //支持的属性
    this._color = Cesium.defaultValue(options.color, new Cesium.Color(1, 0, 0, 1.0)); //颜色
    this._scanImg = Cesium.defaultValue(options.url);
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
    return Cesium.Material.CircleScanType;
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
    result.scanImg = this._scanImg;
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
      (other instanceof CircleScanMaterialProperty &&
        Cesium.Property.equals(this._color, other._color) &&
        this._scanImg === other._scanImg)
    );
  }
}

//属性
Object.defineProperties(CircleScanMaterialProperty.prototype, {
  /**
   * Gets or sets the  Cesium.Property specifying the {@link Cesium.Color} of the line.
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type { Cesium.Property}
   */
  color: Cesium.createPropertyDescriptor("color"),
  scanImg: Cesium.createPropertyDescriptor("scanImg")
});
