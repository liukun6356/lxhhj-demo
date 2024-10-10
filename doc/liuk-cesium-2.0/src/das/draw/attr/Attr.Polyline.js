import * as Cesium from "cesium";
import { currentTime } from "../../util/util";
import * as pointconvert from "../../util/pointconvert";
import { LineFlowMaterialProperty } from "../../material/property/LineFlowMaterialProperty";

import { bezierSpline } from "@turf/turf";
import { plotUtil } from "../../draw-ex/core/PlotUtil";

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
      case "lineType": //跳过扩展其他属性的参数
      case "color":
      case "opacity":
      case "outline":
      case "outlineWidth":
      case "outlineColor":
      case "outlineOpacity":
      case "flowDuration":
      case "flowImage":
      case "dashLength":
      case "glowPower":
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
      case "depthFailColor":
      case "depthFailOpacity":
      case "distanceDisplayCondition_far":
      case "distanceDisplayCondition_near":
        break;
      case "depthFail":
        if (value) {
          if (style.depthFailType && style.depthFailType === 'dash') {
            entityattr.depthFailMaterial = new Cesium.PolylineDashMaterialProperty({
              dashLength: style.dashLength || 16.0,
              color: Cesium.Color.fromCssColorString(style.depthFailColor || "#FFFF00").withAlpha(Number(Cesium.defaultValue(style.depthFailOpacity, Cesium.defaultValue(style.opacity, 0.9))))
            });
          } else {
            entityattr.depthFailMaterial = Cesium.Color.fromCssColorString(
              style.depthFailColor || "#FFFF00"
            ).withAlpha(
              Number(
                Cesium.defaultValue(style.depthFailOpacity, Cesium.defaultValue(style.opacity, 0.9))
              )
            );
          }
          if (style.opacity == 1.0) style.opacity = 0.9; //不透明时，竟然不显示depthFailMaterial？！
        } else {
          entityattr.depthFailMaterial = undefined;
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
    }
  }

  if (style.color || style.lineType) {
    var color;
    if (style.color) {
      color = Cesium.Color.fromCssColorString(style.color).withAlpha(
        Number(Cesium.defaultValue(style.opacity, 1.0))
      );
    } else if (style.randomColor) {
      color = Cesium.Color.fromRandom({
        minimumRed: Cesium.defaultValue(style.minimumRed, 0.0),
        maximumRed: Cesium.defaultValue(style.maximumRed, 0.75),
        minimumGreen: Cesium.defaultValue(style.minimumGreen, 0.0),
        maximumGreen: Cesium.defaultValue(style.maximumGreen, 0.75),
        minimumBlue: Cesium.defaultValue(style.minimumBlue, 0.0),
        maximumBlue: Cesium.defaultValue(style.maximumBlue, 0.75),
        alpha: Cesium.defaultValue(style.opacity, 1.0)
      });
    } else {
      color = Cesium.Color.fromCssColorString("#FFFF00").withAlpha(
        Number(Cesium.defaultValue(style.opacity, 1.0))
      );
    }

    switch (style.lineType) {
      default:
      case "solid": //实线
        if (style.outline) {
          //存在衬色时
          entityattr.material = new Cesium.PolylineOutlineMaterialProperty({
            color: color,
            outlineWidth: Number(style.outlineWidth || 1.0),
            outlineColor: Cesium.Color.fromCssColorString(
              style.outlineColor || "#FFFF00"
            ).withAlpha(Number(style.outlineOpacity || style.opacity || 1.0))
          });
        } else {
          entityattr.material = color;
        }
        break;
      case "dash": //虚线
        if (style.outline) {
          //存在衬色时
          entityattr.material = new Cesium.PolylineDashMaterialProperty({
            dashLength: style.dashLength || style.outlineWidth || 16.0,
            color: color,
            gapColor: Cesium.Color.fromCssColorString(style.outlineColor || "#FFFF00").withAlpha(
              Number(style.outlineOpacity || style.opacity || 1.0)
            )
          });
        } else {
          entityattr.material = new Cesium.PolylineDashMaterialProperty({
            dashLength: style.dashLength || 16.0,
            color: color
          });
        }

        break;
      case "glow": //发光线
        entityattr.material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: style.glowPower || 0.1,
          color: color
        });
        break;
      case "arrow": //箭头线
        entityattr.material = new Cesium.PolylineArrowMaterialProperty(color);
        break;
      case "animation": //流动线
        var repeatX = Cesium.defaultValue(style.animationRepeatX, 1);
        var repeatY = Cesium.defaultValue(style.animationRepeatY, 1);
        entityattr.material = new LineFlowMaterialProperty({
          //动画线材质
          color: color,
          duration: style.animationDuration || 2000, //时长，控制速度
          url: style.animationImage, //图片
          repeat: new Cesium.Cartesian2(repeatX, repeatY)
        });
        break;
    }
  }

  //材质优先
  if (style.material) entityattr.material = style.material;

  return entityattr;
}

//获取entity的坐标
export function getPositions(entity, isShowPositions) {
  if (!isShowPositions && entity._positions_draw && entity._positions_draw.length > 0)
    return entity._positions_draw; //曲线等情形时，取绑定的数据

  return entity.polyline.positions.getValue(currentTime());
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

//折线转曲线[基于bezierSpline算法]
export function line2curve(_positions_draw, closure) {
  var coordinates = _positions_draw.map(position => pointconvert.cartesian2lonlat(position));
  if (closure)
    //闭合曲线
    coordinates.push(coordinates[0]);
  var defHeight = coordinates[coordinates.length - 1][2];

  let curved = bezierSpline({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: coordinates
    }
  });
  var _positions_show = pointconvert.lonlats2cartesians(curved.geometry.coordinates, defHeight);
  return _positions_show;
}

//折线转曲线[基于自己的算法]
export function line2curve2(_positions_draw, closure) {
  var points = pointconvert.cartesians2mercators(_positions_draw);
  if (closure)
    //闭合曲线
    points.push(points[0]);

  var pointsNew = plotUtil.getBezierPoints(points);
  var _positions_show = pointconvert.mercators2cartesians(pointsNew);
  return _positions_show;
}
