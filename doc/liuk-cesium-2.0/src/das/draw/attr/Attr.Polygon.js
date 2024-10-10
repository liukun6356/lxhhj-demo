import * as Cesium from "cesium";
import { getMaxHeight } from "../../util/point";
import { currentTime, isNumber } from "../../util/util";
import * as pointconvert from "../../util/pointconvert";
import * as globe from "./globe";

//属性赋值到entity
export function style2Entity(style, entityattr) {
  style = style || {};

  if (entityattr == null) {
    //默认值
    entityattr = {};
    if (style.clampToGround) {
      entityattr.arcType = Cesium.ArcType.GEODESIC;
    }
  }

  //Style赋值值Entity
  for (var key in style) {
    var value = style[key];
    switch (key) {
      default:
        //直接赋值
        entityattr[key] = value;
        break;
      case "color": //跳过扩展其他属性的参数
      case "opacity":
      case "outlineOpacity":
      case "grid_lineCount":
      case "grid_lineThickness":
      case "grid_cellAlpha":
      case "checkerboard_repeat":
      case "checkerboard_oddcolor":
      case "stripe_oddcolor":
      case "stripe_repeat":
      case "animationDuration":
      case "animationImage":
      case "animationRepeatX":
      case "animationRepeatY":
      case "animationAxisY":
      case "animationGradient":
      case "animationCount":
      case "randomColor":
      case "distanceDisplayCondition_far":
      case "distanceDisplayCondition_near":
        break;
      case "outline": //边线
        if (entityattr[key] instanceof Cesium.CallbackProperty) {
          //回调时不覆盖
        } else {
          entityattr[key] = value;
        }
        break;
      case "outlineColor": //边框颜色
        entityattr.outlineColor = Cesium.Color.fromCssColorString(
          value || style.color || "#FFFF00"
        ).withAlpha(
          Cesium.defaultValue(style.outlineOpacity, Cesium.defaultValue(style.opacity, 1.0))
        );
        break;
      case "extrudedHeight": //高度
        if (isNumber(value)) {
          var maxHight = 0;
          if (entityattr.hierarchy) {
            var positions = getPositions({ polygon: entityattr });
            maxHight = getMaxHeight(positions);
          }
          entityattr.extrudedHeight = Number(value) + maxHight;
        } else {
          entityattr.extrudedHeight = value;
        }
        break;
      case "clampToGround": //贴地
        entityattr.perPositionHeight = !value;
        break;

      case "hasShadows": //阴影
        if (value) entityattr.shadows = Cesium.ShadowMode.ENABLED;
        //对象投射并接收阴影。
        else entityattr.shadows = Cesium.ShadowMode.DISABLED; //该对象不会投射或接收阴影
        break;
      case "stRotation": //材质旋转角度
        entityattr.stRotation = Cesium.Math.toRadians(value);
        break;
      case "distanceDisplayCondition": //是否按视距显示
        if (value) {
          if (value instanceof Cesium.DistanceDisplayCondition) {
            entityattr.distanceDisplayCondition = value;
          } else {
            entityattr.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(
              Number(Cesium.defaultValue(style.distanceDisplayCondition_near, 0)),
              Number(Cesium.defaultValue(style.distanceDisplayCondition_far, 100000)) + 6378137
            );
          }
        } else {
          entityattr.distanceDisplayCondition = undefined;
        }
        break;
    }
  }

  //设置填充材质
  globe.setFillMaterial(entityattr, style);

  return entityattr;
}

//获取entity的坐标【只取最外层圈坐标】
export function getPositions(entity, isShowPositions) {
  if (!isShowPositions && entity._positions_draw && entity._positions_draw.length > 0)
    return entity._positions_draw; //箭头标绘等情形时，取绑定的数据

  var arr = entity.polygon.hierarchy.getValue(currentTime());
  if (arr && arr instanceof Cesium.PolygonHierarchy) {
    arr = arr.positions;
  }
  return arr;
}

//获取entity的多个坐标【只取多圈的坐标，如挖洞多边形】
export function getAllPositions(entity) {
  var arr = entity.polygon.hierarchy.getValue(currentTime());
  var result = getHierarchyVal(arr);
  return result;
}
function getHierarchyVal(arr) {
  if (arr && arr instanceof Cesium.PolygonHierarchy) {
    var result = [];
    for (var i = 0, len = arr.holes.length; i < len; i++) {
      var item = arr.holes[i]; //PolygonHierarchy
      result = result.concat(getHierarchyVal(item));
    }
    result.push(arr.positions);
    return result;
  } else {
    return [arr];
  }
}

//获取entity的坐标（geojson规范的格式）
export function getCoordinates(entity) {
  var positions = getPositions(entity);
  var coordinates = pointconvert.cartesians2lonlats(positions);
  return coordinates;
}

//entity转geojson
export function toGeoJSON(entity, noAdd) {
  var coordinates = getCoordinates(entity);

  if (!noAdd && coordinates.length > 0) coordinates.push(coordinates[0]);

  return {
    type: "Feature",
    properties: entity.attribute || {},
    geometry: {
      type: "Polygon",
      coordinates: [coordinates]
    }
  };
}
