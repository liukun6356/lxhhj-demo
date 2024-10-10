import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { cartesians2lonlats } from "./pointconvert";
import { interPolygon } from "./polygon";
import { Slope } from "../analysi/Slope";
import { area as turf_area, rhumbBearing } from "@turf/turf";
import { computeStepSurfaceLine } from "./polyline";

//计算空间距离，单位：米
export function getLength(positions) {
  if (!Cesium.defined(positions) || positions.length < 2) return 0;

  var distance = 0;
  for (var i = 1, len = positions.length; i < len; i++) {
    distance += Cesium.Cartesian3.distance(positions[i - 1], positions[i]);
  }
  return distance;
}

//计算计算地表贴地距离，单位：米
export function getClampLength(positions, options) {
  var all_distance = 0;
  var arrDistance = [];

  computeStepSurfaceLine({
    scene: options.scene,
    positions: positions,
    splitNum: options.splitNum,
    has3dtiles: options.has3dtiles,
    //计算每个分段后的回调方法
    endItem: function(raisedPositions, noHeight, index) {
      var distance = getLength(raisedPositions);
      if (noHeight && options.disTerrainScale) {
        distance = distance * options.disTerrainScale; //求高度失败，概略估算值
      }
      all_distance += distance;

      arrDistance.push(distance);

      if (options.endItem)
        options.endItem({
          index: index,
          positions: raisedPositions,
          distance: distance,
          arrDistance: arrDistance,
          all_distance: all_distance
        });
    },
    //计算全部完成的回调方法
    end: function() {
      var callback = options.callback || options.calback; //兼容不同参数名
      if (callback) callback(all_distance, arrDistance);
    }
  });
}

//计算地表投影平面面积，单位：平方米
export function getArea(positions, noAdd) {
  var coordinates = cartesians2lonlats(positions);

  if (!noAdd && coordinates.length > 0) coordinates.push(coordinates[0]);

  //API: http://turfjs.org/docs/#area
  var area = turf_area({
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates]
    }
  });
  return area;
}

//计算三角形空间面积
export function getAreaOfTriangle(pos1, pos2, pos3) {
  var a = Cesium.Cartesian3.distance(pos1, pos2);
  var b = Cesium.Cartesian3.distance(pos2, pos3);
  var c = Cesium.Cartesian3.distance(pos3, pos1);
  var S = (a + b + c) / 2;
  return Math.sqrt(S * (S - a) * (S - b) * (S - c));
}

//计算贴地面积
export function getClampArea(positions, options) {
  function _restultArea(resultInter) {
    var area = 0; //总面积(贴地三角面)
    for (var i = 0, len = resultInter.list.length; i < len; i++) {
      var item = resultInter.list[i];
      var pt1 = item.point1;
      var pt2 = item.point2;
      var pt3 = item.point3;

      //求面积
      area += getAreaOfTriangle(pt1.pointDM, pt2.pointDM, pt3.pointDM);
    }
    return area;
  }
  var callback = options.callback || options.calback; //兼容不同参数名
  var resultInter = interPolygon({
    positions: positions,
    scene: options.scene,
    splitNum: options.splitNum,
    has3dtiles: options.has3dtiles,
    asyn: options.asyn,
    callback: function(resultInter) {
      var area = _restultArea(resultInter);
      if (callback) callback(area, resultInter);
    }
  });

  if (options.asyn) return null;
  else {
    var area = _restultArea(resultInter);
    if (callback) callback(area, resultInter);
    return area;
  }
}

//求地表方位角，返回：0-360度
export function getAngle(firstPoint, endPoints) {
  var carto1 = Cesium.Cartographic.fromCartesian(firstPoint);
  var carto2 = Cesium.Cartographic.fromCartesian(endPoints);
  if (!carto1 || !carto2) return 0;

  var pt1 = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [
        Cesium.Math.toDegrees(carto1.longitude),
        Cesium.Math.toDegrees(carto1.latitude),
        carto1.height
      ]
    }
  };
  var pt2 = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [
        Cesium.Math.toDegrees(carto2.longitude),
        Cesium.Math.toDegrees(carto2.latitude),
        carto2.height
      ]
    }
  };
  //API: http://turfjs.org/docs/#rhumbBearing
  var bearing = Math.round(rhumbBearing(pt1, pt2));
  return bearing;
}

//获取点相对于中心点的地面角度
// export function getAngle(positionCenter, positionNew) {
//     //获取该位置的默认矩阵
//     var mat = Cesium.Transforms.eastNorthUpToFixedFrame(positionCenter);
//     mat = Cesium.Matrix4.getMatrix3(mat, new Cesium.Matrix3());

//     var xaxis = Cesium.Matrix3.getColumn(mat, 0, new Cesium.Cartesian3());
//     var yaxis = Cesium.Matrix3.getColumn(mat, 1, new Cesium.Cartesian3());
//     var zaxis = Cesium.Matrix3.getColumn(mat, 2, new Cesium.Cartesian3());

//     //计算该位置 和  positionCenter 的 角度值
//     var dir = Cesium.Cartesian3.subtract(positionNew, positionCenter, new Cesium.Cartesian3());
//     //z crosss (dirx cross z) 得到在 xy平面的向量
//     dir = Cesium.Cartesian3.cross(dir, zaxis, dir);
//     dir = Cesium.Cartesian3.cross(zaxis, dir, dir);
//     dir = Cesium.Cartesian3.normalize(dir, dir);

//     var heading = Cesium.Cartesian3.angleBetween(xaxis, dir);

//     var ay = Cesium.Cartesian3.angleBetween(yaxis, dir);
//     if (ay > Math.PI * 0.5) {
//         heading = 2 * Math.PI - heading;
//     }
//     return -Cesium.Math.toDegrees(heading);
// }

//求多个点的  坡度坡向
export function getSlope(options) {
  var slope = new Slope({
    viewer: options.viewer,
    positions: options.positions,
    splitNum: 1,
    radius: options.radius, //缓冲半径（影响坡度坡向的精度）
    count: options.count, //缓冲的数量（影响坡度坡向的精度）会求周边(count*4)个点
    has3dtiles: options.has3dtiles,
    point: Cesium.defaultValue(options.point, { show: false }),
    arrow: Cesium.defaultValue(options.arrow, { show: false })
  });
  if (options.endItem) {
    slope.on(eventType.endItem, options.endItem);
  }
  slope.on(eventType.end, e => {
    if (options.callback) options.callback(e);
    slope.destroy();
  });
  return slope;
}
