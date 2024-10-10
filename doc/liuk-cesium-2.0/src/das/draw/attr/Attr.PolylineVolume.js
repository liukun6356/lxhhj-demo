import * as Cesium from "cesium";
import { currentTime } from "../../util/util";
import * as pointconvert from "../../util/pointconvert";

//属性赋值到entity
export function style2Entity(style, entityattr) {
  style = style || {};

  if (entityattr == null) {
    //默认值
    entityattr = {};
  }

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
      case "radius":
      case "shape":
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

      case "hasShadows": //阴影
        if (value) entityattr.shadows = Cesium.ShadowMode.ENABLED;
        //对象投射并接收阴影。
        else entityattr.shadows = Cesium.ShadowMode.DISABLED; //该对象不会投射或接收阴影
        break;
    }
  }

  //材质优先
  if (style.material) entityattr.material = style.material;

  //管道样式
  style.radius = style.radius || 10;
  switch (style.shape) {
    default:
    case "pipeline":
      entityattr.shape = getCorridorShape1(style.radius); //（厚度固定为半径的1/3）
      break;
    case "circle":
      entityattr.shape = getCorridorShape2(style.radius);
      break;
    case "star":
      entityattr.shape = getCorridorShape3(style.radius);
      break;
  }

  return entityattr;
}

//管道形状1【内空管道】 radius整个管道的外半径
function getCorridorShape1(radius) {
  var hd = radius / 3;
  var startAngle = 0;
  var endAngle = 360;

  var pss = [];
  for (let i = startAngle; i <= endAngle; i++) {
    let radians = Cesium.Math.toRadians(i);
    pss.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
  }
  for (let i = endAngle; i >= startAngle; i--) {
    let radians = Cesium.Math.toRadians(i);
    pss.push(
      new Cesium.Cartesian2((radius - hd) * Math.cos(radians), (radius - hd) * Math.sin(radians))
    );
  }
  return pss;
}

//管道形状2【圆柱体】 radius整个管道的外半径
function getCorridorShape2(radius) {
  var startAngle = 0;
  var endAngle = 360;

  var pss = [];
  for (var i = startAngle; i <= endAngle; i++) {
    var radians = Cesium.Math.toRadians(i);
    pss.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
  }
  return pss;
}

//管道形状3【星状】 radius整个管道的外半径 ,arms星角的个数（默认6个角）
function getCorridorShape3(radius, arms = 6) {
  var angle = Math.PI / arms;
  var length = 2 * arms;
  var pss = new Array(length);
  for (var i = 0; i < length; i++) {
    var r = i % 2 === 0 ? radius : radius / 3;
    pss[i] = new Cesium.Cartesian2(Math.cos(i * angle) * r, Math.sin(i * angle) * r);
  }
  return pss;
}

//获取entity的坐标
export function getPositions(entity) {
  if (entity._positions_draw && entity._positions_draw.length > 0) return entity._positions_draw; //取绑定的数据

  return entity.polylineVolume.positions.getValue(currentTime());
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
    geometry: {
      type: "LineString",
      coordinates: coordinates
    }
  };
}
