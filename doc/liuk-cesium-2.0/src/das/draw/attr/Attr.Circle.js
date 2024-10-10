import * as Cesium from "cesium";
import { currentTime, isNumber } from "../../util/util";
import * as pointconvert from "../../util/pointconvert";
import { getPositionValue } from "../../util/point";
import * as globe from "./globe";
import { getEllipseOuterPositions } from "../../util/polygon";

//属性赋值到entity
export function style2Entity(style, entityattr) {
  style = style || {};

  if (entityattr == null) {
    //默认值
    entityattr = {
      fill: true
    };
  }
  //贴地时，剔除高度相关属性
  if (style.clampToGround) {
    if (style.hasOwnProperty("height")) delete style.height;
    if (style.hasOwnProperty("extrudedHeight")) delete style.extrudedHeight;
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
      case "color":
      case "animation":
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
        entityattr.outlineColor = Cesium.Color.fromCssColorString(value || "#FFFF00").withAlpha(
          Cesium.defaultValue(style.outlineOpacity, Cesium.defaultValue(style.opacity, 1.0))
        );
        break;
      case "rotation": //旋转角度
        entityattr.rotation = Cesium.Math.toRadians(value);
        if (!style.stRotation) entityattr.stRotation = Cesium.Math.toRadians(value);
        break;
      case "stRotation":
        entityattr.stRotation = Cesium.Math.toRadians(value);
        break;
      case "height":
        entityattr.height = value;
        if (style.extrudedHeight && isNumber(style.extrudedHeight))
          entityattr.extrudedHeight = Number(style.extrudedHeight) + Number(value);
        break;
      case "extrudedHeight":
        if (isNumber(value)) {
          entityattr.extrudedHeight =
            Number(entityattr.height || style.height || 0) + Number(value);
        } else {
          entityattr.extrudedHeight = value;
        }
        break;
      case "radius": //半径（圆）
        entityattr.semiMinorAxis = Number(value);
        entityattr.semiMajorAxis = Number(value);
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

//获取entity对应的 边界 的坐标
export function getOutlinePositions(entity, noAdd, count) {
  var time = currentTime();

  //获取圆（或椭圆）边线上的坐标点数组
  var outerPositions = getEllipseOuterPositions({
    position: getPositionValue(entity.position),
    semiMajorAxis: entity.ellipse.semiMajorAxis && entity.ellipse.semiMajorAxis.getValue(time), //长半轴
    semiMinorAxis: entity.ellipse.semiMinorAxis && entity.ellipse.semiMinorAxis.getValue(time), //短半轴
    rotation: entity.ellipse.rotation && entity.ellipse.rotation.getValue(time),
    count: Cesium.defaultValue(count, 90) //共返回360个点
  });

  if (!noAdd && outerPositions) outerPositions.push(outerPositions[0]);

  return outerPositions;
}

//获取entity对应的 边界 的坐标（geojson规范的格式）
export function getOutlineCoordinates(entity, noAdd, count) {
  var positions = getOutlinePositions(entity, noAdd, count);
  var coordinates = pointconvert.cartesians2lonlats(positions);
  return coordinates;
}
