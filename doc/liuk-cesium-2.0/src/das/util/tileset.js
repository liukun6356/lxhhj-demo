//3dtiles相关计算常用方法
import * as Cesium from "cesium";

//获取坐标点处的3dtiles模型，用于计算贴地时进行判断（和视角有关系，不一定精确）
export function pick3DTileset(scene, positions) {
  if (!positions) return null;

  if (scene instanceof Cesium.Viewer)
    //兼容scene传入viewer
    scene = scene.scene;

  //判断场景下是否有3dtiles模型
  // var has3dtiles = false;
  // for (var i = 0, len = scene.primitives.length; i < len; ++i) {
  //     var p = scene.primitives.get(i);
  //     if (p instanceof Cesium.Cesium3DTileset) {
  //         has3dtiles = true;
  //         break;
  //     }
  // }
  // if (!has3dtiles) return null; //没有3dtiles模型时，直接return

  if (positions instanceof Cesium.Cartesian3) positions = [positions];

  for (var i = 0, len = positions.length; i < len; ++i) {
    var position = positions[i];
    var coorPX = Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, position);
    if (!Cesium.defined(coorPX)) continue;

    var pickedObject = scene.pick(coorPX, 10, 10);
    if (
      Cesium.defined(pickedObject) &&
      Cesium.defined(pickedObject.primitive) &&
      pickedObject.primitive instanceof Cesium.Cesium3DTileset
    ) {
      // Cesium.defined(pickedObject.primitive.isCesium3DTileset)
      return pickedObject.primitive;
    }
  }

  return null;
}

//属性赋值到3DTiles
export function style2Tileset(tileset, style) {
  style = style || {};

  for (var key in style) {
    var value = style[key];
    switch (key) {
      default:
        //直接赋值
        tileset[key] = value;
        break;
      case "scaleByDistance_near": //跳过扩展其他属性的参数
      case "scaleByDistance_nearValue":
      case "scaleByDistance_far":
      case "scaleByDistance_farValue":
      case "distanceDisplayCondition_far":
      case "distanceDisplayCondition_near":
        break;
      case "scaleByDistance": //是否按视距缩放
        if (value) {
          tileset.scaleByDistance = new Cesium.NearFarScalar(
            Number(Cesium.defaultValue(style.scaleByDistance_near, 1000)),
            Number(Cesium.defaultValue(style.scaleByDistance_nearValue, 1.0)),
            Number(Cesium.defaultValue(style.scaleByDistance_far, 1000000)),
            Number(Cesium.defaultValue(style.scaleByDistance_farValue, 0.1))
          );
        } else {
          tileset.scaleByDistance = undefined;
        }
        break;
    }
  }

  return tileset;
}

//[兼容旧版本，不建议使用]获取模型的中心点信息
export function getCenter(tileset) {
  return tileset.das.orginPosition;
}
//[兼容旧版本，不建议使用]变换模型位置等
export function updateMatrix(tileset, opts) {
  tileset.das.updateStyle({ offset: opts });
  return tileset.das.updateMatrix();
}
