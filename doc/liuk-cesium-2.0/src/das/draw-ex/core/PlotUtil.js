import * as Cesium from "cesium";

//基本计算方法
class PlotUtilClass {
  constructor() {
    this.HALF_PI = Math.PI / 2;
    this.ZERO_TOLERANCE = 0.0001;
  }

  //获取第三点
  getThirdPoint(startPnt, endPnt, angle, distance, clockWise) {
    var azimuth = this.getAzimuth(startPnt, endPnt);
    var alpha = clockWise ? azimuth + angle : azimuth - angle;
    var dx = distance * Math.cos(alpha);
    var dy = distance * Math.sin(alpha);
    return [endPnt[0] + dx, endPnt[1] + dy];
  }

  //计算夹角
  getAzimuth(startPoint, endPoint) {
    var azimuth = void 0;
    var angle = Math.asin(
      Math.abs(endPoint[1] - startPoint[1]) / this.MathDistance(startPoint, endPoint)
    );
    if (endPoint[1] >= startPoint[1] && endPoint[0] >= startPoint[0]) {
      azimuth = angle + Math.PI;
    } else if (endPoint[1] >= startPoint[1] && endPoint[0] < startPoint[0]) {
      azimuth = Math.PI * 2 - angle;
    } else if (endPoint[1] < startPoint[1] && endPoint[0] < startPoint[0]) {
      azimuth = angle;
    } else if (endPoint[1] < startPoint[1] && endPoint[0] >= startPoint[0]) {
      azimuth = Math.PI - angle;
    }
    return azimuth;
  }
  MathDistance(pnt1, pnt2) {
    return Math.sqrt(Math.pow(pnt1[0] - pnt2[0], 2) + Math.pow(pnt1[1] - pnt2[1], 2));
  }
  //计算闭合曲面上的点
  isClockWise(pnt1, pnt2, pnt3) {
    return (pnt3[1] - pnt1[1]) * (pnt2[0] - pnt1[0]) > (pnt2[1] - pnt1[1]) * (pnt3[0] - pnt1[0]);
  }
  getBisectorNormals(t, pnt1, pnt2, pnt3) {
    var normal = this.getNormal(pnt1, pnt2, pnt3);
    var bisectorNormalRight = null,
      bisectorNormalLeft = null,
      dt = null,
      x = null,
      y = null;

    var dist = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
    var uX = normal[0] / dist;
    var uY = normal[1] / dist;
    var d1 = this.MathDistance(pnt1, pnt2);
    var d2 = this.MathDistance(pnt2, pnt3);
    if (dist > this.ZERO_TOLERANCE) {
      if (this.isClockWise(pnt1, pnt2, pnt3)) {
        dt = t * d1;
        x = pnt2[0] - dt * uY;
        y = pnt2[1] + dt * uX;
        bisectorNormalRight = [x, y];
        dt = t * d2;
        x = pnt2[0] + dt * uY;
        y = pnt2[1] - dt * uX;
        bisectorNormalLeft = [x, y];
      } else {
        dt = t * d1;
        x = pnt2[0] + dt * uY;
        y = pnt2[1] - dt * uX;
        bisectorNormalRight = [x, y];
        dt = t * d2;
        x = pnt2[0] - dt * uY;
        y = pnt2[1] + dt * uX;
        bisectorNormalLeft = [x, y];
      }
    } else {
      x = pnt2[0] + t * (pnt1[0] - pnt2[0]);
      y = pnt2[1] + t * (pnt1[1] - pnt2[1]);
      bisectorNormalRight = [x, y];
      x = pnt2[0] + t * (pnt3[0] - pnt2[0]);
      y = pnt2[1] + t * (pnt3[1] - pnt2[1]);
      bisectorNormalLeft = [x, y];
    }
    return [bisectorNormalRight, bisectorNormalLeft];
  }

  getCubicValue(t, startPnt, cPnt1, cPnt2, endPnt) {
    t = Math.max(Math.min(t, 1), 0);
    var tp = 1 - t,
      t2 = t * t;

    var t3 = t2 * t;
    var tp2 = tp * tp;
    var tp3 = tp2 * tp;
    var x = tp3 * startPnt[0] + 3 * tp2 * t * cPnt1[0] + 3 * tp * t2 * cPnt2[0] + t3 * endPnt[0];
    var y = tp3 * startPnt[1] + 3 * tp2 * t * cPnt1[1] + 3 * tp * t2 * cPnt2[1] + t3 * endPnt[1];
    return [x, y];
  }

  getNormal(pnt1, pnt2, pnt3) {
    var dX1 = pnt1[0] - pnt2[0];
    var dY1 = pnt1[1] - pnt2[1];
    var d1 = Math.sqrt(dX1 * dX1 + dY1 * dY1);
    dX1 /= d1;
    dY1 /= d1;
    var dX2 = pnt3[0] - pnt2[0];
    var dY2 = pnt3[1] - pnt2[1];
    var d2 = Math.sqrt(dX2 * dX2 + dY2 * dY2);
    dX2 /= d2;
    dY2 /= d2;
    var uX = dX1 + dX2;
    var uY = dY1 + dY2;
    return [uX, uY];
  }

  getArcPoints(center, radius, startAngle, endAngle) {
    var x = null,
      y = null,
      pnts = [],
      angleDiff = endAngle - startAngle;
    angleDiff = angleDiff < 0 ? angleDiff + Math.PI * 2 : angleDiff;
    for (var i = 0; i <= 100; i++) {
      var angle = startAngle + (angleDiff * i) / 100;
      x = center[0] + radius * Math.cos(angle);
      y = center[1] + radius * Math.sin(angle);
      pnts.push([x, y]);
    }
    return pnts;
  }

  getBaseLength(points) {
    return Math.pow(this.wholeDistance(points), 0.99);
  }

  wholeDistance(points) {
    var distance = 0;
    var that = this;
    if (points && Array.isArray(points) && points.length > 0) {
      points.forEach(function(item, index) {
        if (index < points.length - 1) {
          distance += that.MathDistance(item, points[index + 1]);
        }
      });
    }
    return distance;
  }

  getArrowHeadPoints(obj) {
    if (!obj) return [];
    var points = obj.points;
    var tailLeft = obj.tailLeft;
    var tailRight = obj.tailRight;
    var headTailFactor = obj.headTailFactor;
    var neckWidthFactor = obj.neckWidthFactor;
    var neckHeightFactor = obj.neckHeightFactor;
    var headWidthFactor = obj.headWidthFactor;
    var headHeightFactor = obj.headHeightFactor;
    var len = this.getBaseLength(points);
    var headHeight = len * headHeightFactor;
    var headPnt = points[points.length - 1];
    len = this.MathDistance(headPnt, points[points.length - 2]);
    var tailWidth = this.MathDistance(tailLeft, tailRight);
    if (headHeight > tailWidth * headTailFactor) {
      headHeight = tailWidth * headTailFactor;
    }
    var headWidth = headHeight * headWidthFactor;
    var neckWidth = headHeight * neckWidthFactor;
    headHeight = headHeight > len ? len : headHeight;
    var neckHeight = headHeight * neckHeightFactor;
    var headEndPnt = this.getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true);
    var neckEndPnt = this.getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true);
    var headLeft = this.getThirdPoint(headPnt, headEndPnt, this.HALF_PI, headWidth, false);
    var headRight = this.getThirdPoint(headPnt, headEndPnt, this.HALF_PI, headWidth, true);
    var neckLeft = this.getThirdPoint(headPnt, neckEndPnt, this.HALF_PI, neckWidth, false);
    var neckRight = this.getThirdPoint(headPnt, neckEndPnt, this.HALF_PI, neckWidth, true);
    return [neckLeft, headLeft, headPnt, headRight, neckRight];
  }

  getTailPoints(obj) {
    if (!obj) return;
    var points = obj.points;
    var tailWidthFactor = obj.tailWidthFactor;
    var swallowTailFactor = obj.swallowTailFactor;
    var allLen = this.getBaseLength(points);
    var tailWidth = allLen * tailWidthFactor;
    var tailLeft = this.getThirdPoint(points[1], points[0], this.HALF_PI, tailWidth, false);
    var tailRight = this.getThirdPoint(points[1], points[0], this.HALF_PI, tailWidth, true);
    var len = tailWidth * swallowTailFactor;
    var swallowTailPnt = this.getThirdPoint(points[1], points[0], 0, len, true);
    return [tailLeft, swallowTailPnt, tailRight];
  }

  getArrowBodyPoints(points, neckLeft, neckRight, tailWidthFactor) {
    var allLen = this.wholeDistance(points);
    var len = this.getBaseLength(points);
    var tailWidth = len * tailWidthFactor;
    var neckWidth = this.MathDistance(neckLeft, neckRight);
    var widthDif = (tailWidth - neckWidth) / 2;
    var tempLen = 0,
      leftBodyPnts = [],
      rightBodyPnts = [];

    for (var i = 1; i < points.length - 1; i++) {
      var angle = this.getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
      tempLen += this.MathDistance(points[i - 1], points[i]);
      var w = (tailWidth / 2 - (tempLen / allLen) * widthDif) / Math.sin(angle);
      var left = this.getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
      var right = this.getThirdPoint(points[i - 1], points[i], angle, w, false);
      leftBodyPnts.push(left);
      rightBodyPnts.push(right);
    }
    return leftBodyPnts.concat(rightBodyPnts);
  }
  getAngleOfThreePoints(pntA, pntB, pntC) {
    var angle = this.getAzimuth(pntB, pntA) - this.getAzimuth(pntB, pntC);
    return angle < 0 ? angle + Math.PI * 2 : angle;
  }

  getQBSplinePoints(points) {
    if (points.length <= 2) {
      return points;
    } else {
      var n = 2,
        bSplinePoints = [];

      var m = points.length - n - 1;
      bSplinePoints.push(points[0]);
      for (var i = 0; i <= m; i++) {
        for (var t = 0; t <= 1; t += 0.05) {
          var x = 0,
            y = 0;

          for (var k = 0; k <= n; k++) {
            var factor = this.getQuadricBSplineFactor(k, t);
            x += factor * points[i + k][0];
            y += factor * points[i + k][1];
          }
          bSplinePoints.push([x, y]);
        }
      }
      bSplinePoints.push(points[points.length - 1]);
      return bSplinePoints;
    }
  }
  getQuadricBSplineFactor(k, t) {
    var res = 0;
    if (k === 0) {
      res = Math.pow(t - 1, 2) / 2;
    } else if (k === 1) {
      res = (-2 * Math.pow(t, 2) + 2 * t + 1) / 2;
    } else if (k === 2) {
      res = Math.pow(t, 2) / 2;
    }
    return res;
  }

  Mid(point1, point2) {
    return [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2];
  }

  getCircleCenterOfThreePoints(point1, point2, point3) {
    var pntA = [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2];
    var pntB = [pntA[0] - point1[1] + point2[1], pntA[1] + point1[0] - point2[0]];
    var pntC = [(point1[0] + point3[0]) / 2, (point1[1] + point3[1]) / 2];
    var pntD = [pntC[0] - point1[1] + point3[1], pntC[1] + point1[0] - point3[0]];
    return this.getIntersectPoint(pntA, pntB, pntC, pntD);
  }

  getIntersectPoint(pntA, pntB, pntC, pntD) {
    if (pntA[1] === pntB[1]) {
      var _f = (pntD[0] - pntC[0]) / (pntD[1] - pntC[1]);
      var _x = _f * (pntA[1] - pntC[1]) + pntC[0];
      var _y = pntA[1];
      return [_x, _y];
    }
    if (pntC[1] === pntD[1]) {
      var _e = (pntB[0] - pntA[0]) / (pntB[1] - pntA[1]);
      var _x2 = _e * (pntC[1] - pntA[1]) + pntA[0];
      var _y2 = pntC[1];
      return [_x2, _y2];
    }
    var e = (pntB[0] - pntA[0]) / (pntB[1] - pntA[1]);
    var f = (pntD[0] - pntC[0]) / (pntD[1] - pntC[1]);
    var y = (e * pntA[1] - pntA[0] - f * pntC[1] + pntC[0]) / (e - f);
    var x = e * y - e * pntA[1] + pntA[0];
    return [x, y];
  }

  getBezierPoints(points) {
    if (points.length <= 2) {
      return points;
    } else {
      var bezierPoints = [];
      var n = points.length - 1;
      for (var t = 0; t <= 1; t += 0.01) {
        var x = 0,
          y = 0;

        for (var index = 0; index <= n; index++) {
          var factor = this.getBinomialFactor(n, index);
          var a = Math.pow(t, index);
          var b = Math.pow(1 - t, n - index);
          x += factor * a * b * points[index][0];
          y += factor * a * b * points[index][1];
        }
        bezierPoints.push([x, y]);
      }
      // bezierPoints.push(points[n]);
      return bezierPoints;
    }
  }
  getFactorial(n) {
    var result = 1;
    switch (n) {
      case n <= 1:
        result = 1;
        break;
      case n === 2:
        result = 2;
        break;
      case n === 3:
        result = 6;
        break;
      case n === 24:
        result = 24;
        break;
      case n === 5:
        result = 120;
        break;
      default:
        for (var i = 1; i <= n; i++) {
          result *= i;
        }
        break;
    }
    return result;
  }
  getBinomialFactor(n, index) {
    return this.getFactorial(n) / (this.getFactorial(index) * this.getFactorial(n - index));
  }
}

//外部使用，单例模式
export var plotUtil = new PlotUtilClass();
