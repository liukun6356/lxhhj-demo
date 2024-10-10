//椭球体
import * as Cesium from "cesium";
import * as pointconvert from "../../util/pointconvert";
import { getPositionValue } from "../../util/point";
import * as globe from "./globe";

//属性赋值到entity
export function style2Entity(style, entityattr) {
  style = style || {};

  if (entityattr == null) {
    //默认值
    entityattr = {
      fill: true
    };
  }

  //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
  if (Cesium.defined(style.extentRadii)) style.radii_x = style.extentRadii;
  if (Cesium.defined(style.widthRadii)) style.radii_y = style.widthRadii;
  if (Cesium.defined(style.heightRadii)) style.radii_z = style.heightRadii;
  //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

  //Style赋值值Entity
  for (var key in style) {
    var value = style[key];
    switch (key) {
      default:
        //直接赋值
        entityattr[key] = value;
        break;
      case "opacity": //跳过扩展其他属性的参数
      case "outlineOpacity":
      case "radii_y":
      case "radii_z":
      case "innerRadii_y":
      case "innerRadii_z":
      case "distanceDisplayCondition_far":
      case "distanceDisplayCondition_near":
        break;
      case "outlineColor": //边框颜色
        entityattr.outlineColor = Cesium.Color.fromCssColorString(value || "#FFFF00").withAlpha(
          style.outlineOpacity || style.opacity || 1.0
        );
        break;
      case "color": //填充颜色
        entityattr.material = Cesium.Color.fromCssColorString(value || "#FFFF00").withAlpha(
          Number(style.opacity || 1.0)
        );
        break;
      case "radii_x": //球体 长宽高半径
        entityattr.radii = new Cesium.Cartesian3(
          Cesium.defaultValue(style.radii_x, 100),
          Cesium.defaultValue(style.radii_y, 100),
          Cesium.defaultValue(style.radii_z, 100)
        );
        break;
      case "innerRadii_x": //球体内圈 长宽高半径
        if (style.innerRadii_x > 0 && style.innerRadii_y > 0 && style.innerRadii_z > 0)
          entityattr.innerRadii = new Cesium.Cartesian3(
            Cesium.defaultValue(style.innerRadii_x, 0),
            Cesium.defaultValue(style.innerRadii_y, 0),
            Cesium.defaultValue(style.innerRadii_z, 0)
          );
        else entityattr.innerRadii = new Cesium.Cartesian3(0.001, 0.001, 0.001);
        break;
      case "minimumClock":
      case "maximumClock":
      case "minimumCone":
      case "maximumCone":
        entityattr[key] = Cesium.Math.toRadians(value || 0);
        break;
      case "distanceDisplayCondition": //是否按视距显示
        if (value) {
          if (value instanceof Cesium.DistanceDisplayCondition) {
            entityattr.distanceDisplayCondition = value;
          } else {
            entityattr.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
              Number(Cesium.defaultValue(style.distanceDisplayCondition_near, 0)),
              Number(Cesium.defaultValue(style.distanceDisplayCondition_far, 100000))
            );
          }
        } else {
          entityattr.distanceDisplayCondition = undefined;
        }
        break;

      case "hasShadows": //阴影
        if (value) entityattr.shadows = Cesium.ShadowMode.ENABLED;
        //对象投射并接收阴影。
        else entityattr.shadows = Cesium.ShadowMode.DISABLED; //该对象不会投射或接收阴影
        break;
    }
  }

  //设置填充材质
  globe.setFillMaterial(entityattr, style);

  return entityattr;
}

//获取entity的坐标
export function getPositions(entity) {
  return [getPositionValue(entity.position)];
}

//获取entity的坐标（geojson规范的格式）
export function getCoordinates(entity) {
  var positions = getPositions(entity);
  var coordinates = pointconvert.cartesians2lonlats(positions);
  return coordinates;
}

//entity转geojson
export function toGeoJSON(entity) {
  var coordinates = getCoordinates(entity);
  return {
    type: "Feature",
    properties: entity.attribute || {},
    geometry: { type: "Point", coordinates: coordinates[0] }
  };
}
