import * as Cesium from "cesium";
import { getTextImage } from "../util/util";

//文字贴图 primitive材质
export class TextMaterial extends Cesium.Material {
  constructor(options) {
    super(conventOptions(options));
  }
}

function conventOptions(options) {
  var _text = options.text;
  var _textStyles = Cesium.defaultValue(options.textStyles, {
    font: "50px 楷体",
    fill: true,
    fillColor: new Cesium.Color(1.0, 1.0, 0.0, 1.0),
    stroke: true,
    strokeWidth: 2,
    strokeColor: new Cesium.Color(1.0, 1.0, 1.0, 0.8),
    backgroundColor: new Cesium.Color(1.0, 1.0, 1.0, 0.1),
    textBaseline: "top",
    padding: 10
  });

  var image = getTextImage(_text, _textStyles);

  return {
    fabric: {
      uniforms: {
        image: image,
        repeat: options.repeat || new Cesium.Cartesian2(1.0, 1.0),
        color: options.color || new Cesium.Color(1.0, 1.0, 1.0, 1.0)
      },
      components: {
        diffuse: "texture2D(image, fract(repeat * materialInput.st)).rgb * color.rgb",
        alpha: "texture2D(image, fract(repeat * materialInput.st)).a * color.a"
      }
    },
    translucent: function(material) {
      return material.uniforms.color.alpha < 1.0;
    }
  };
}
