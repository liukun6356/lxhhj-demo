import * as Cesium from "cesium";

//线状 流动效果 材质
export class LineFlowMaterialProperty {
  //========== 构造方法 ==========
  constructor(options) {
    options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);

    this._color = undefined;
    this._colorSubscription = undefined;
    this._time = undefined;
    this._definitionChanged = new Cesium.Event();

    //支持的属性
    this._image = options.image || options.url; //背景图片
    this._color = Cesium.defaultValue(options.color, new Cesium.Color(0, 0, 0, 0)); //背景图片颜色
    this._axisY = Cesium.defaultValue(options.axisY, false);
    this._speed = Cesium.defaultValue(options.speed, 10); //速度，建议取值范围1-100
    this._repeat = Cesium.defaultValue(options.repeat, new Cesium.Cartesian2(1.0, 1.0));

    this._image2 = options.image2 || options.bgUrl; //第2张背景图片
    this._color2 = options.color2 || options.bgColor || new Cesium.Color(1, 1, 1); //第2张背景图片颜色
    this._hasImage2 = Cesium.defined(this._image2);

    if (options.duration) {
      //兼容v2.2之前老版本
      this._speed = 30000 / options.duration;
    }
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
    return Cesium.Material.LineFlowType;
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
    result.image = this._image;
    result.color = this._color; //Cesium.Property.getValueOrClonedDefault(this.color, time, Cesium.Color.WHITE, result.color);
    result.repeat = this._repeat;
    result.axisY = this._axisY;
    result.speed = this._speed;

    result.hasImage2 = this._hasImage2;
    result.image2 = this._image2;
    result.color2 = this._color2; // Cesium.Property.getValueOrClonedDefault(this.color2, time, Cesium.Color.WHITE, result.color2)

    return result;
  }

  /**
   * Compares this property to the provided property and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Cesium.Property} [other] The other property.
   * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  equals(other) {
    return (
      this === other ||
      (other instanceof LineFlowMaterialProperty &&
        // && Cesium.Property.equals(this._color, other._color)
        // && Cesium.Property.equals(this._repeat, other._repeat)
        this._color === other._color &&
        this._repeat === other._repeat &&
        this._image === other._image &&
        this._axisY === other._axisY &&
        this._speed === other._speed)
    );
  }
}

Object.defineProperties(LineFlowMaterialProperty.prototype, {
  // image: Cesium.createPropertyDescriptor('image'),
  // color: Cesium.createPropertyDescriptor('color'),
  // repeat: Cesium.createPropertyDescriptor('repeat'),
  // axisY: Cesium.createPropertyDescriptor('axisY'),
  // speed: Cesium.createPropertyDescriptor('speed'),
  // image2: Cesium.createPropertyDescriptor('image2'),
  // color2: Cesium.createPropertyDescriptor('color2')
});
