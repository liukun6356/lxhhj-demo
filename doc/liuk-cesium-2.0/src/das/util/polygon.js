import * as Cesium from "cesium";
import { getGranularity } from "./util";
import { computeSurfacePoints } from "./polyline";
import { getSurfaceHeight, setPositionsHeight } from "../util/point";

//面内进行贴地(或贴模型)插值, 返回三角网等计算结果
export function interPolygon(opts) {
  var scene = opts.scene;

  //坐标数组
  var positions = [];
  var pos = opts.positions;
  for (let i = 0; i < pos.length; i++) {
    positions.push(pos[i].clone());
  }

  //splitNum分割的个数
  var granularity = getGranularity(positions, opts.splitNum);

  //插值求面的三角网
  var arrPoly = [];

  var polygonGeometry = new Cesium.PolygonGeometry.fromPositions({
    positions: positions,
    vertexFormat: Cesium.PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
    granularity: granularity
  });
  var geom = new Cesium.PolygonGeometry.createGeometry(polygonGeometry);

  var i0, i1, i2;
  var cartesian1, cartesian2, cartesian3;
  for (let i = 0; i < geom.indices.length; i += 3) {
    i0 = geom.indices[i];
    i1 = geom.indices[i + 1];
    i2 = geom.indices[i + 2];

    //三角形 点1
    cartesian1 = new Cesium.Cartesian3(
      geom.attributes.position.values[i0 * 3],
      geom.attributes.position.values[i0 * 3 + 1],
      geom.attributes.position.values[i0 * 3 + 2]
    );
    arrPoly.push(cartesian1);

    //三角形 点2
    cartesian2 = new Cesium.Cartesian3(
      geom.attributes.position.values[i1 * 3],
      geom.attributes.position.values[i1 * 3 + 1],
      geom.attributes.position.values[i1 * 3 + 2]
    );
    arrPoly.push(cartesian2);

    //三角形 点3
    cartesian3 = new Cesium.Cartesian3(
      geom.attributes.position.values[i2 * 3],
      geom.attributes.position.values[i2 * 3 + 1],
      geom.attributes.position.values[i2 * 3 + 2]
    );
    arrPoly.push(cartesian3);
  }

  var maxHeight = 0;
  var minHeight = 9999;
  var onlyPoint = Cesium.defaultValue(opts.onlyPoint, false); //只返回点，不需要三角网时

  //格式化每个点
  function onFormatPoint(position, noHeight) {
    var height;
    var point;
    var pointDM;
    var carto;

    if (noHeight) {
      height = getSurfaceHeight(scene, position, opts);

      carto = Cesium.Cartographic.fromCartesian(position);
      point = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, 0);
      pointDM = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, height);
    } else {
      carto = Cesium.Cartographic.fromCartesian(position);
      height = carto.height;

      point = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, 0);
      pointDM = position;
    }

    if (maxHeight < height) maxHeight = height;
    if (minHeight > height) minHeight = height;

    return {
      height: height,
      point: point,
      pointDM: pointDM
    };
  }

  function interCallback(raisedPositions, noHeight) {
    var arrSJW = [];
    var obj1, obj2, obj3;
    for (var i = 0; i < raisedPositions.length; i += 3) {
      //三角形 点1
      obj1 = onFormatPoint(raisedPositions[i], noHeight);
      //三角形 点2
      obj2 = onFormatPoint(raisedPositions[i + 1], noHeight);
      //三角形 点3
      obj3 = onFormatPoint(raisedPositions[i + 2], noHeight);

      if (onlyPoint) {
        //只返回点，不需要三角网
        addPointFoyArrOnly(arrSJW, obj1);
        addPointFoyArrOnly(arrSJW, obj2);
        addPointFoyArrOnly(arrSJW, obj3);
      } else {
        //常规返回，三角网
        arrSJW.push({
          point1: obj1,
          point2: obj2,
          point3: obj3
        });
      }
    }

    if (Cesium.defined(opts.minHeight)) {
      minHeight = Math.max(opts.minHeight, minHeight);
      maxHeight = Math.max(maxHeight, minHeight);
    }

    var result = {
      granularity: granularity,
      maxHeight: maxHeight,
      minHeight: minHeight,
      list: arrSJW //三角网
    };
    var callback = opts.callback || opts.calback; //兼容不同参数名
    if (callback) callback(result);

    return result;
  }

  //是否异步求精确高度
  if (opts.asyn) {
    //求高度
    return computeSurfacePoints({
      scene: scene,
      positions: arrPoly,
      has3dtiles: opts.has3dtiles,
      callback: interCallback
    });
  } else {
    return interCallback(arrPoly, true);
  }
}

//判断坐标点是否在数组内
function addPointFoyArrOnly(arr, newItem) {
  var isIn = false;
  var point = newItem.point;
  for (var z = 0; z < arr.length; z++) {
    var item = arr[z].point;
    if (point.x == item.x && point.y == item.y && point.z == item.z) {
      isIn = true;
      break;
    }
  }
  if (!isIn) arr.push(newItem);
}

//计算面内最大、最小高度值
export function getHeightRange(positions, scene, opts) {
  var resultInter = interPolygon({
    positions: positions,
    scene: scene,
    ...opts
  });

  return {
    has3dtiles: resultInter._has3dtiles,
    maxHeight: resultInter.maxHeight,
    minHeight: resultInter.minHeight
  };
}

//计算三角形空间面积
function getAreaOfTriangle(pos1, pos2, pos3) {
  var a = Cesium.Cartesian3.distance(pos1, pos2);
  var b = Cesium.Cartesian3.distance(pos2, pos3);
  var c = Cesium.Cartesian3.distance(pos3, pos1);
  var S = (a + b + c) / 2;
  return Math.sqrt(S * (S - a) * (S - b) * (S - c));
}

//体积计算
export function computeVolume(opts) {
  var resultInter = interPolygon(opts);
  if (resultInter) resultInter = updateVolumeByMinHeight(resultInter);

  return resultInter;
}

//根据 最低底面高度 重新计算填挖方体积
export function updateVolumeByMinHeight(resultInter) {
  var minHeight = resultInter.minHeight;

  var totalArea = 0; //总面积(横截面/投影底面)
  var totalVolume = 0; //总体积

  for (var i = 0, len = resultInter.list.length; i < len; i++) {
    var item = resultInter.list[i];

    var pt1 = item.point1;
    var pt2 = item.point2;
    var pt3 = item.point3;

    //横截面面积
    var bottomArea = getAreaOfTriangle(pt1.point, pt2.point, pt3.point);
    item.area = bottomArea;
    totalArea += bottomArea;

    var height1 = pt1.height;
    var height2 = pt2.height;
    var height3 = pt3.height;
    if (height1 < minHeight) height1 = minHeight;
    if (height2 < minHeight) height2 = minHeight;
    if (height3 < minHeight) height3 = minHeight;

    //挖方体积 （横截面面积 * 3个点的平均高）
    var cutVolume =
      (bottomArea * (height1 - minHeight + height2 - minHeight + height3 - minHeight)) / 3;
    item.cutVolume = cutVolume;
    totalVolume = totalVolume + cutVolume;
  }

  resultInter.totalArea = totalArea; //总面积(横截面/投影底面)
  resultInter.totalVolume = totalVolume; //总体积

  return resultInter;
}

//根据 基准面高度 重新计算填挖方体积
export function updateVolume(resultInter, cutHeight) {
  if (!resultInter) return;

  var minHeight = resultInter.minHeight;
  var totalVolume = resultInter.totalVolume; //总体积

  if (cutHeight <= minHeight) {
    resultInter.fillVolume = 0; //填方体积
    resultInter.digVolume = totalVolume; //挖方体积

    return resultInter;
  }

  var totalV = 0; //底部到基准面的总体积
  var totalBottomV = 0; //挖方体积
  for (var i = 0, len = resultInter.list.length; i < len; i++) {
    var item = resultInter.list[i];

    //底部到基准面的总体积
    totalV += item.area * (cutHeight - minHeight);

    var pt1 = item.point1;
    var pt2 = item.point2;
    var pt3 = item.point3;

    var height1 = pt1.height;
    var height2 = pt2.height;
    var height3 = pt3.height;
    if (height1 < cutHeight) height1 = cutHeight;
    if (height2 < cutHeight) height2 = cutHeight;
    if (height3 < cutHeight) height3 = cutHeight;

    //挖方体积 （横截面面积 * 3个点的平均高）
    totalBottomV +=
      (item.area * (height1 - cutHeight + height2 - cutHeight + height3 - cutHeight)) / 3;
  }

  resultInter.digVolume = totalBottomV; //挖方体积
  resultInter.fillVolume = totalV - (totalVolume - totalBottomV); //填方体积

  return resultInter;
}

//获取圆（或椭圆）边线上的坐标点数组
export function getEllipseOuterPositions(opts) {
  var position = opts.position;
  if (!position) return null;

  var count = Cesium.defaultValue(opts.count, 1); //点的数量，总数为count*4
  var semiMajorAxis = Cesium.defaultValue(opts.semiMajorAxis, opts.radius);
  var semiMinorAxis = Cesium.defaultValue(opts.semiMinorAxis, opts.radius);
  var rotation = Cesium.defaultValue(opts.rotation, 0);

  if (!semiMajorAxis || !semiMinorAxis) return [position, position, position];

  //获取椭圆上的坐标点数组
  var cep = Cesium.EllipseGeometryLibrary.computeEllipsePositions(
    {
      center: position,
      semiMajorAxis: semiMajorAxis, //长半轴
      semiMinorAxis: semiMinorAxis, //短半轴
      rotation: rotation,
      granularity: Math.PI / (16 * count)
    },
    true,
    true
  );

  var arr = cep.outerPositions;
  var positions = [];
  for (var i = 0, len = arr.length; i < len; i += 3) {
    //长半轴上的坐标点
    var pt = new Cesium.Cartesian3(arr[i], arr[i + 1], arr[i + 2]);
    positions.push(pt);
  }
  return positions;
}

//获取矩形（含旋转角度）的边线上的4个顶点坐标点数组
export function getRectangleOuterPositions(options) {
  var rectangle = options.rectangle;
  var rotation = Cesium.defaultValue(options.rotation, 0.0);
  var height = Cesium.defaultValue(options.height, 0.0);

  if (rotation == 0) {
    return [
      Cesium.Cartesian3.fromRadians(rectangle.west, rectangle.south, height),
      Cesium.Cartesian3.fromRadians(rectangle.east, rectangle.south, height),
      Cesium.Cartesian3.fromRadians(rectangle.east, rectangle.north, height),
      Cesium.Cartesian3.fromRadians(rectangle.west, rectangle.north, height)
    ];
  }

  var granularity = Cesium.defaultValue(options.granularity, Cesium.Math.RADIANS_PER_DEGREE);

  var rectangleScratch = new Cesium.Rectangle();
  var nwScratch = new Cesium.Cartographic();
  var computedOptions = Cesium.RectangleGeometryLibrary.computeOptions(
    rectangle,
    granularity,
    rotation,
    0,
    rectangleScratch,
    nwScratch
  );

  var w_height = computedOptions.height;
  var w_width = computedOptions.width;
  var ellipsoid = Cesium.defaultValue(options.ellipsoid, Cesium.Ellipsoid.WGS84);

  var scratchRectanglePoints = [
    new Cesium.Cartesian3(),
    new Cesium.Cartesian3(),
    new Cesium.Cartesian3(),
    new Cesium.Cartesian3()
  ];

  Cesium.RectangleGeometryLibrary.computePosition(
    computedOptions,
    ellipsoid,
    false,
    0,
    0,
    scratchRectanglePoints[0]
  );
  Cesium.RectangleGeometryLibrary.computePosition(
    computedOptions,
    ellipsoid,
    false,
    0,
    w_width - 1,
    scratchRectanglePoints[1]
  );

  Cesium.RectangleGeometryLibrary.computePosition(
    computedOptions,
    ellipsoid,
    false,
    w_height - 1,
    w_width - 1,
    scratchRectanglePoints[2]
  );

  Cesium.RectangleGeometryLibrary.computePosition(
    computedOptions,
    ellipsoid,
    false,
    w_height - 1,
    0,
    scratchRectanglePoints[3]
  );

  if (height != 0) {
    scratchRectanglePoints = setPositionsHeight(scratchRectanglePoints, height);
  }

  return scratchRectanglePoints;
}

