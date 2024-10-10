import * as Cesium from "cesium";
import { getTextImage } from "../../util/util";

//文字贴图 entity材质
export class TextMaterialProperty extends Cesium.ImageMaterialProperty {
  //========== 构造方法 ==========
  constructor(options) {
    super(options);

    this.transparent = Cesium.defaultValue(options.transparent, true);

    this._text = options.text;
    this._textStyles = Cesium.defaultValue(options.textStyles, {
      font: "50px 楷体",
      fill: true,
      fillColor: new Cesium.Color(1.0, 1.0, 0.0, 1.0),
      stroke: true,
      strokeWidth: 2,
      strokeColor: new Cesium.Color(1.0, 1.0, 1.0, 0.8),
      backgroundColor: new Cesium.Color(1.0, 1.0, 1.0, 0.1),
      textBaseline: "top",
      padding: 40
    });

    this.image = getTextImage(this._text, this._textStyles);
  }
  //========== 对外属性 ==========
  get text() {
    return this._text;
  }
  set text(val) {
    this._text = val;
    this.image = getTextImage(this._text, this._textStyles);
  }
  get textStyles() {
    return this._textStyles;
  }
  set textStyles(val) {
    this._textStyles = val;
    this.image = getTextImage(this._text, this._textStyles);
  }
}
