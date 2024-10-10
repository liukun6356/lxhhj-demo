import * as Cesium from "cesium";
import { currentTime, isNumber } from "../../util/util";
import * as pointconvert from "../../util/pointconvert";
import { getRectangleOuterPositions } from "../../util/polygon";
import * as globe from "./globe";

//属性赋值到entity
export function style2Entity(style, entityattr) {
  style = style || {};

  if (entityattr == null) {
    //默认值
    entityattr = {};
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
        entityattr.outlineColor = Cesium.Color.fromCssColorString(value || "#FFFF00").withAlpha(
          style.outlineOpacity || style.opacity || 1.0
        );
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
      case "color": //填充颜色
        entityattr.material = Cesium.Color.fromCssColorString(value || "#FFFF00").withAlpha(
          Number(style.opacity || 1.0)
        );
        break;
      case "image": //填充图片
        entityattr.material = new Cesium.ImageMaterialProperty({
          image: style.image,
          color: Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(Number(style.opacity || 1.0))
        });
        break;
      case "rotation": //旋转角度
        entityattr.rotation = Cesium.Math.toRadians(value);
        if (!style.stRotation) entityattr.stRotation = Cesium.Math.toRadians(value);
        break;
      case "stRotation":
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
  if (!entity.rectangle) return null;

  // if (entity._positions_draw && entity._positions_draw.length > 0)
  //     return entity._positions_draw;

  var time = currentTime();
  var re = entity.rectangle.coordinates.getValue(time); //Rectangle
  var height = entity.rectangle.height ? entity.rectangle.height.getValue(time) : 0;

  var ptMin = Cesium.Cartesian3.fromRadians(re.west, re.south, height); //西、南
  var ptMax = Cesium.Cartesian3.fromRadians(re.east, re.north, height); //东、北
  return [ptMin, ptMax];
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
      type: "MultiPoint",
      coordinates: coordinates
    }
  };
}

//获取entity对应的 边界 的坐标
export function getOutlinePositions(entity, noAdd) {
  if (!entity.rectangle) return null;

  var time = currentTime();
  var re = entity.rectangle.coordinates.getValue(time); //Rectangle
  if (!re) return null;

  var rotation = entity.rectangle.rotation.getValue(time) || 0; //Rectangle
  var height = entity.rectangle.height ? entity.rectangle.height.getValue(time) : 0;

  var arr = getRectangleOuterPositions({
    rectangle: re,
    rotation: rotation,
    height: height
  });

  if (!noAdd) arr.push(arr[0]);
  return arr;
}

//获取entity对应的 边界 的坐标（geojson规范的格式）
export function getOutlineCoordinates(entity, noAdd) {
  var positions = getOutlinePositions(entity, noAdd);
  var coordinates = pointconvert.cartesians2lonlats(positions);
  return coordinates;
}
