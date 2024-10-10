import * as Cesium from "cesium";
import { getPositionValue } from "../../util/point";
import * as pointconvert from "../../util/pointconvert";

//属性赋值到entity
export function style2Entity(style, entityattr) {
  style = style || {};

  if (entityattr == null) {
    //默认值
    entityattr = {
      scale: 1,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    };
  }

  //Style赋值值Entity
  for (var key in style) {
    var value = style[key];
    switch (key) {
      default:
        //直接赋值
        entityattr[key] = value;
        break;
      case "scaleByDistance_near": //跳过扩展其他属性的参数
      case "scaleByDistance_nearValue":
      case "scaleByDistance_far":
      case "scaleByDistance_farValue":
      case "distanceDisplayCondition_far":
      case "distanceDisplayCondition_near":
        break;
      case "opacity": //透明度
        entityattr.color = Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(
          Cesium.defaultValue(value, 1.0)
        );
        break;
      case "rotation": //旋转角度
        entityattr.rotation = Cesium.Math.toRadians(value);
        break;
      case "pixelOffset": //偏移量
        if (Cesium.defined(value[0]) && Cesium.defined(value[1]))
          entityattr.pixelOffset = new Cesium.Cartesian2(value[0], value[1]);
        else entityattr.pixelOffset = value;
        break;
      case "scaleByDistance": //是否按视距缩放
        if (value) {
          entityattr.scaleByDistance = new Cesium.NearFarScalar(
            Number(Cesium.defaultValue(style.scaleByDistance_near, 1000)),
            Number(Cesium.defaultValue(style.scaleByDistance_nearValue, 1.0)),
            Number(Cesium.defaultValue(style.scaleByDistance_far, 1000000)),
            Number(Cesium.defaultValue(style.scaleByDistance_farValue, 0.1))
          );
        } else {
          entityattr.scaleByDistance = undefined;
        }
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
      case "clampToGround": //贴地
        if (value) entityattr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
        else entityattr.heightReference = Cesium.HeightReference.NONE;
        break;
      case "heightReference":
        switch (value) {
          case "NONE":
            entityattr.heightReference = Cesium.HeightReference.NONE;
            break;
          case "CLAMP_TO_GROUND":
            entityattr.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
            break;
          case "RELATIVE_TO_GROUND":
            entityattr.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
            break;
          default:
            entityattr.heightReference = value;
            break;
        }
        break;
      case "horizontalOrigin":
        switch (value) {
          case "CENTER":
            entityattr.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
            break;
          case "LEFT":
            entityattr.horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
            break;
          case "RIGHT":
            entityattr.horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;
            break;
          default:
            entityattr.horizontalOrigin = value;
            break;
        }
        break;
      case "verticalOrigin":
        switch (value) {
          case "CENTER":
            entityattr.verticalOrigin = Cesium.VerticalOrigin.CENTER;
            break;
          case "TOP":
            entityattr.verticalOrigin = Cesium.VerticalOrigin.TOP;
            break;
          case "BOTTOM":
            entityattr.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
            break;
          default:
            entityattr.verticalOrigin = value;
            break;
        }
        break;
      case "visibleDepth":
        if (value) entityattr.disableDepthTestDistance = 0;
        else entityattr.disableDepthTestDistance = Number.POSITIVE_INFINITY; //一直显示，不被地形等遮挡

        break;
    }
  }

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
