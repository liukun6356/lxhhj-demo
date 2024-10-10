import * as Cesium from "cesium";
import { plotUtil } from "../../core/PlotUtil";

//箭头的父类
export class ArrowParent {
  constructor() {
    this.plotUtil = plotUtil;
  }
  getArrowHeadPoints(points, tailLeft, tailRight) {
    var len = this.plotUtil.getBaseLength(points);
    var headHeight = len * this.headHeightFactor;
    var headPnt = points[points.length - 1];
    len = this.plotUtil.MathDistance(headPnt, points[points.length - 2]);
    var tailWidth = this.plotUtil.MathDistance(tailLeft, tailRight);
    if (headHeight > tailWidth * this.headTailFactor) {
      headHeight = tailWidth * this.headTailFactor;
    }
    var headWidth = headHeight * this.headWidthFactor;
    var neckWidth = headHeight * this.neckWidthFactor;
    headHeight = headHeight > len ? len : headHeight;
    var neckHeight = headHeight * this.neckHeightFactor;
    var headEndPnt = this.plotUtil.getThirdPoint(
      points[points.length - 2],
      headPnt,
      0,
      headHeight,
      true
    );
    var neckEndPnt = this.plotUtil.getThirdPoint(
      points[points.length - 2],
      headPnt,
      0,
      neckHeight,
      true
    );
    var headLeft = this.plotUtil.getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, false);
    var headRight = this.plotUtil.getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, true);
    var neckLeft = this.plotUtil.getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, false);
    var neckRight = this.plotUtil.getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, true);
    return [neckLeft, headLeft, headPnt, headRight, neckRight];
  }
  getArrowBodyPoints(points, neckLeft, neckRight, tailWidthFactor) {
    var allLen = this.plotUtil.wholeDistance(points);
    var len = this.plotUtil.getBaseLength(points);
    var tailWidth = len * tailWidthFactor;
    var neckWidth = this.plotUtil.MathDistance(neckLeft, neckRight);
    var widthDif = (tailWidth - neckWidth) / 2;
    var tempLen = 0,
      leftBodyPnts = [],
      rightBodyPnts = [];

    for (var i = 1; i < points.length - 1; i++) {
      var angle = this.plotUtil.getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
      tempLen += this.plotUtil.MathDistance(points[i - 1], points[i]);
      var w = (tailWidth / 2 - (tempLen / allLen) * widthDif) / Math.sin(angle);
      var left = this.plotUtil.getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
      var right = this.plotUtil.getThirdPoint(points[i - 1], points[i], angle, w, false);
      leftBodyPnts.push(left);
      rightBodyPnts.push(right);
    }
    return leftBodyPnts.concat(rightBodyPnts);
  }
}
