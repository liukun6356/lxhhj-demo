import * as Cesium from "cesium";
import { plotUtil } from "../../core/PlotUtil";
import { ArrowParent } from "./ArrowParent";
import * as pointconvert from "../../../util/pointconvert";

//计算粗单尖直箭头(带燕尾)坐标
export class FineArrowYW extends ArrowParent {
  constructor(opt) {
    super(opt);
    if (!opt) opt = {};
    //影响因素
    this.headHeightFactor = opt.headHeightFactor || 0.18;
    this.headWidthFactor = opt.headWidthFactor || 0.3;
    this.neckHeightFactor = opt.neckHeightFactor || 0.85;
    this.neckWidthFactor = opt.neckWidthFactor || 0.15;
    this.tailWidthFactor = opt.tailWidthFactor || 0.1;
    this.swallowTailFactor = opt.swallowTailFactor || 1;
    this.positions = null;
    this.plotUtil = plotUtil;
  }

  startCompute(positions) {
    if (!positions) return;
    this.positions = positions;

    var pnts = pointconvert.cartesians2mercators(positions);

    var tailPnts = this.getTailPoints(pnts);
    var headPnts = this.getArrowHeadPoints(pnts, tailPnts[0], tailPnts[2]);
    var neckLeft = headPnts[0];
    var neckRight = headPnts[4];
    var bodyPnts = this.getArrowBodyPoints(pnts, neckLeft, neckRight, this.tailWidthFactor);
    var _count = bodyPnts.length;
    var leftPnts = [tailPnts[0]].concat(bodyPnts.slice(0, _count / 2));
    leftPnts.push(neckLeft);
    var rightPnts = [tailPnts[2]].concat(bodyPnts.slice(_count / 2, _count));
    rightPnts.push(neckRight);
    leftPnts = this.plotUtil.getQBSplinePoints(leftPnts);
    rightPnts = this.plotUtil.getQBSplinePoints(rightPnts);
    var pList = leftPnts.concat(headPnts, rightPnts.reverse(), [tailPnts[1], leftPnts[0]]);

    var returnArr = pointconvert.mercators2cartesians(pList);
    return returnArr;
  }
  getTailPoints(points) {
    var allLen = this.plotUtil.getBaseLength(points);
    var tailWidth = allLen * this.tailWidthFactor;
    var tailLeft = this.plotUtil.getThirdPoint(points[1], points[0], Math.PI / 2, tailWidth, false);
    var tailRight = this.plotUtil.getThirdPoint(points[1], points[0], Math.PI / 2, tailWidth, true);
    var len = tailWidth * this.swallowTailFactor;
    var swallowTailPnt = this.plotUtil.getThirdPoint(points[1], points[0], 0, len, true);
    return [tailLeft, swallowTailPnt, tailRight];
  }
}
