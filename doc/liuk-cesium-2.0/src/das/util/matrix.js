//一些涉及矩阵计算的方法
import * as Cesium from "cesium";

// 根据模型的orientation求方位角
export function getHeadingPitchRollByOrientation(
  position,
  orientation,
  ellipsoid,
  fixedFrameTransform
) {
  if (!Cesium.defined(orientation) || !Cesium.defined(position))
    return new Cesium.HeadingPitchRoll();

  var matrix = Cesium.Matrix4.fromRotationTranslation(
    Cesium.Matrix3.fromQuaternion(orientation, new Cesium.Matrix3()),
    position,
    new Cesium.Matrix4()
  );
  var hpr = getHeadingPitchRollByMatrix(matrix, ellipsoid, fixedFrameTransform);
  return hpr;
}

// 根据模型的matrix矩阵求方位角
export function getHeadingPitchRollByMatrix(matrix, ellipsoid, fixedFrameTransform, result) {
  return Cesium.Transforms.fixedFrameToHeadingPitchRoll(
    matrix,
    ellipsoid,
    fixedFrameTransform,
    result
  );
}

// 根据模型的matrix矩阵求方位角
export function getHeadingPitchRollByMatrixOld(position, matrix, ellipsoid, fixedFrameTransform) {
  fixedFrameTransform = fixedFrameTransform || Cesium.Transforms.eastNorthUpToFixedFrame;

  // 计算当前模型中心处的变换矩阵
  var m1 = fixedFrameTransform(position, ellipsoid, new Cesium.Matrix4());
  // 矩阵相除
  var m3 = Cesium.Matrix4.multiply(
    Cesium.Matrix4.inverse(m1, new Cesium.Matrix4()),
    matrix,
    new Cesium.Matrix4()
  );
  // 得到旋转矩阵
  var mat3 = Cesium.Matrix4.getMatrix3(m3, new Cesium.Matrix3());
  // 计算四元数
  var q = Cesium.Quaternion.fromRotationMatrix(mat3);
  // 计算旋转角(弧度)
  var hpr = Cesium.HeadingPitchRoll.fromQuaternion(q);
  return hpr;
}

//求localStart点到localEnd点的方向
export function getHeadingPitchRollForLine(localStart, localEnd, ellipsoid, fixedFrameTransform) {
  ellipsoid = ellipsoid || Cesium.Ellipsoid.WGS84;

  var cartesian3 = new Cesium.Cartesian3();
  var matrix4Scratch2 = new Cesium.Matrix4();
  var rotationScratch = new Cesium.Matrix3();

  var velocity = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.subtract(localEnd, localStart, cartesian3),
    cartesian3
  );
  Cesium.Transforms.rotationMatrixFromPositionVelocity(
    localStart,
    velocity,
    ellipsoid,
    rotationScratch
  );
  var modelMatrix = Cesium.Matrix4.fromRotationTranslation(
    rotationScratch,
    localStart,
    matrix4Scratch2
  );

  Cesium.Matrix4.multiplyTransformation(modelMatrix, Cesium.Axis.Z_UP_TO_X_UP, modelMatrix);

  var hpr = getHeadingPitchRollByMatrix(modelMatrix, ellipsoid, fixedFrameTransform);
  return hpr;
}

//获取点point1绕点center的地面法向量旋转顺时针angle角度后新坐标
export function getRotateCenterPoint(center, point1, angle) {
  // 计算center的地面法向量
  var chicB = Cesium.Cartographic.fromCartesian(center);
  chicB.height = 0;
  var dB = Cesium.Cartographic.toCartesian(chicB);
  var normaB = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.subtract(dB, center, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );

  // 构造基于center的法向量旋转90度的矩阵
  var Q = Cesium.Quaternion.fromAxisAngle(normaB, Cesium.Math.toRadians(angle));
  var m3 = Cesium.Matrix3.fromQuaternion(Q);
  var m4 = Cesium.Matrix4.fromRotationTranslation(m3);

  // 计算point1点相对center点的坐标A1
  var A1 = Cesium.Cartesian3.subtract(point1, center, new Cesium.Cartesian3());

  //对A1应用旋转矩阵
  var p = Cesium.Matrix4.multiplyByPoint(m4, A1, new Cesium.Cartesian3());
  // 新点的坐标
  var pointNew = Cesium.Cartesian3.add(p, center, new Cesium.Cartesian3());

  return pointNew;
}

//求p1指向p2方向线上，距离p1指定len长度的新的点 ，addBS：true时为距离p2
export function getOnLinePointByLen(p1, p2, len, addBS) {
  var mtx4 = Cesium.Transforms.eastNorthUpToFixedFrame(p1);
  var mtx4_inverser = Cesium.Matrix4.inverse(mtx4, new Cesium.Matrix4());
  p1 = Cesium.Matrix4.multiplyByPoint(mtx4_inverser, p1, new Cesium.Cartesian3());
  p2 = Cesium.Matrix4.multiplyByPoint(mtx4_inverser, p2, new Cesium.Cartesian3());

  var substrct = Cesium.Cartesian3.subtract(p2, p1, new Cesium.Cartesian3());

  var dis = Cesium.Cartesian3.distance(p1, p2);
  var scale = len / dis; //求比例
  if (addBS) scale += 1;

  var newP = Cesium.Cartesian3.multiplyByScalar(substrct, scale, new Cesium.Cartesian3());
  newP = Cesium.Matrix4.multiplyByPoint(mtx4, newP, new Cesium.Cartesian3());
  return newP;
}

//获取点的offest平移矩阵后点
export function getPositionTranslation(position, offest, degree, type, fixedFrameTransform) {
  fixedFrameTransform = fixedFrameTransform || Cesium.Transforms.eastNorthUpToFixedFrame;

  var rotate = Cesium.Math.toRadians(-Cesium.defaultValue(degree, 0)); //转成弧度

  type = (type || "z").toUpperCase();
  var _normal = Cesium.Cartesian3["UNIT_" + type];

  var quaternion = Cesium.Quaternion.fromAxisAngle(_normal, rotate); //quaternion为围绕这个z轴旋转d度的四元数
  var rotateMatrix3 = Cesium.Matrix3.fromQuaternion(quaternion); //rotateMatrix3为根据四元数求得的旋转矩阵

  var pointCartesian3 = new Cesium.Cartesian3(
    Cesium.defaultValue(offest.x, 0),
    Cesium.defaultValue(offest.y, 0),
    Cesium.defaultValue(offest.z, 0)
  ); //point的局部坐标
  var rotateTranslationMatrix4 = Cesium.Matrix4.fromRotationTranslation(
    rotateMatrix3,
    Cesium.Cartesian3.ZERO
  ); //rotateTranslationMatrix4为旋转加平移的4x4变换矩阵，这里平移为(0,0,0)，故填个Cesium.Cartesian3.ZERO
  Cesium.Matrix4.multiplyByTranslation(
    rotateTranslationMatrix4,
    pointCartesian3,
    rotateTranslationMatrix4
  ); //rotateTranslationMatrix4 = rotateTranslationMatrix4  X  pointCartesian3
  var originPositionCartesian3 = Cesium.Ellipsoid.WGS84.cartographicToCartesian(
    Cesium.Cartographic.fromCartesian(position)
  ); //得到局部坐标原点的全局坐标
  var originPositionTransform = fixedFrameTransform(originPositionCartesian3); //m1为局部坐标的z轴垂直于地表，局部坐标的y轴指向正北的4x4变换矩阵
  Cesium.Matrix4.multiplyTransformation(
    originPositionTransform,
    rotateTranslationMatrix4,
    rotateTranslationMatrix4
  ); //rotateTranslationMatrix4 = rotateTranslationMatrix4 X originPositionTransform
  var pointCartesian = new Cesium.Cartesian3();
  Cesium.Matrix4.getTranslation(rotateTranslationMatrix4, pointCartesian); //根据最终变换矩阵m得到p2
  return pointCartesian;
}

//计算平行线，offset正负决定方向（单位米）
export function getOffsetLine(positions, offset) {
  var arrNew = [];
  for (var i = 1; i < positions.length; i++) {
    var point1 = positions[i - 1];
    var point2 = positions[i];

    var dir12 = Cesium.Cartesian3.subtract(point1, point2, new Cesium.Cartesian3());
    var dir21left = Cesium.Cartesian3.cross(point1, dir12, new Cesium.Cartesian3());

    var p1offset = computedOffsetData(point1, dir21left, offset * 1000);
    var p2offset = computedOffsetData(point2, dir21left, offset * 1000);

    if (i == 1) {
      arrNew.push(p1offset);
    }
    arrNew.push(p2offset);
  }
  return arrNew;
}

function computedOffsetData(ori, dir, wid) {
  var currRay = new Cesium.Ray(ori, dir);
  return Cesium.Ray.getPoint(currRay, wid, new Cesium.Cartesian3());
}

/**
 * 根据 距离方向 和 观察点 计算 目标点
 * @param {Object} viewPoint 观察点
 * @param {Object} direction 方向(正北方向为0)
 * @param {Object} radius 可视距离
 */
export function getPositionByDirectionAndLen(position, angle, radius) {
  var matrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);

  //旋转
  let mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(angle || 0));
  let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
  Cesium.Matrix4.multiply(matrix, rotationZ, matrix);

  let result = Cesium.Matrix4.multiplyByPoint(
    matrix,
    new Cesium.Cartesian3(0, radius, 0),
    new Cesium.Cartesian3()
  );
  return result;
}

/**
 * 求某位置指定方向和距离的点
 * @param {Object} viewPoint 观察点
 * @param {Object} direction 方向
 * @param {Object} radius 可视距离
 */
export function getPositionByHprAndLen(position, hpr, radiusZ) {
  var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  var matrix = Cesium.Matrix4.fromRotationTranslation(
    Cesium.Matrix3.fromQuaternion(orientation, new Cesium.Matrix3()),
    position,
    new Cesium.Matrix4()
  );
  var result = Cesium.Matrix4.multiplyByPoint(
    matrix,
    new Cesium.Cartesian3(0, 0, -radiusZ),
    new Cesium.Cartesian3()
  );
  return result;
}

//求点按orientation方向射向地球与地球的交点
export function getRayEarthPosition(position, orientation, _reverse, ellipsoid) {
  if (orientation instanceof Cesium.HeadingPitchRoll) {
    orientation = Cesium.Transforms.headingPitchRollQuaternion(position, orientation);
  }

  var matrix = Cesium.Matrix4.fromRotationTranslation(
    Cesium.Matrix3.fromQuaternion(orientation, new Cesium.Matrix3()),
    position,
    new Cesium.Matrix4()
  );
  return getRayEarthPositionByMatrix(matrix, _reverse, ellipsoid);
}

//求矩阵射向地球与地球的交点
export function getRayEarthPositionByMatrix(_matrix, _reverse, ellipsoid) {
  var scratchWC = new Cesium.Cartesian3();
  var scratchRay = new Cesium.Ray();

  Cesium.Matrix4.multiplyByPoint(_matrix, Cesium.Cartesian3.ZERO, scratchWC);
  scratchWC.clone(scratchRay.origin);

  var bottomCenter = new Cesium.Cartesian3(0, 0, _reverse ? -100 : 100);
  var groundPosition = extend2Earth(bottomCenter, _matrix, scratchRay, ellipsoid);
  return groundPosition;
}

//求地球交点
export function extend2Earth(positionLC, matrix, ray, ellipsoid) {
  ellipsoid = ellipsoid ? ellipsoid : Cesium.Ellipsoid.WGS84;

  var scratchWC = new Cesium.Cartesian3();
  Cesium.Matrix4.multiplyByPoint(matrix, positionLC, scratchWC);

  //取延长线与地球相交的点
  Cesium.Cartesian3.subtract(scratchWC, ray.origin, ray.direction);
  Cesium.Cartesian3.normalize(ray.direction, ray.direction);

  //Get the first intersection point of a ray and an ellipsoid.
  var intersection = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
  var point = null;
  if (intersection) {
    point = Cesium.Ray.getPoint(ray, intersection.start);
  }
  if (point) {
    try {
      var scratchCartographic2 = new Cesium.Cartographic();
      Cesium.Cartographic.fromCartesian(point, null, scratchCartographic2);
    } catch (e) {
      return null;
    }
  }
  return point;
}
