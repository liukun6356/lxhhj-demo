import * as Cesium from "cesium";

//线状 OD线效果 材质
export class ODLineMaterialProperty {
  constructor(options) {
    options = options || {};

    this._speed = undefined;
    this._speedSubscription = undefined;
    this._color = undefined;
    this._colorSubscription = undefined;
    this._startTime = undefined;
    this._definitionChanged = new Cesium.Event();

    //支持的属性
    this.color = Cesium.defaultValue(
      options.color,
      new Cesium.Color(Math.random() * 0.5 + 0.5, Math.random() * 0.8 + 0.2, 0.0, 1.0)
    );
    this.speed = Cesium.defaultValue(options.speed, 20 + 10 * Math.random());
    this.startTime = Cesium.defaultValue(options.startTime, Math.random());
  }

  get isConstant() {
    return false;
  }

  get definitionChanged() {
    return this._definitionChanged;
  }

  getType(time) {
    return Cesium.Material.ODLineType;
  }

  getValue(time, result) {
    if (!result) {
      result = {};
    }
    result.color = Cesium.Property.getValueOrClonedDefault(
      this._color,
      time,
      Cesium.Color.WHITE,
      result.color
    );
    result.speed = Cesium.Property.getValueOrClonedDefault(this._speed, time, 20, result.speed);
    result.startTime = Cesium.Property.getValueOrClonedDefault(
      this._startTime,
      time,
      0,
      result.startTime
    );

    return result;
  }

  equals(other) {
    return (
      this === other ||
      (other instanceof ODLineMaterialProperty && Cesium.Property.equals(this._color, other._color))
    );
  }
}

Object.defineProperties(ODLineMaterialProperty.prototype, {
  color: Cesium.createPropertyDescriptor("color"),
  speed: Cesium.createPropertyDescriptor("speed")
});
