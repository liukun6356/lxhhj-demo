import * as Cesium from "cesium";
import { plotUtil } from "../../core/PlotUtil";
import { ArrowParent } from "./ArrowParent";
import * as pointconvert from "../../../util/pointconvert";

//攻击箭头（燕尾）
export class AttackArrowYW extends ArrowParent {
  constructor(opt) {
    super();
    if (!opt) opt = {};
    //影响因素
    this.headHeightFactor = opt.headHeightFactor || 0.18;
    this.headWidthFactor = opt.headWidthFactor || 0.3;
    this.neckHeightFactor = opt.neckHeightFactor || 0.85;
    this.neckWidthFactor = opt.neckWidthFactor || 0.15;
    this.tailWidthFactor = opt.tailWidthFactor || 0.1;
    this.headTailFactor = opt.headTailFactor || 0.8;
    this.swallowTailFactor = opt.swallowTailFactor || 1;
    this.positions = null;
    this.plotUtil = plotUtil;
  }

  startCompute(positions) {
    if (!positions) return;
    this.positions = positions;

    var pnts = pointconvert.cartesians2mercators(positions);

    var _ref = [pnts[0], pnts[1]],
      tailLeft = _ref[0],
      tailRight = _ref[1];

    if (this.plotUtil.isClockWise(pnts[0], pnts[1], pnts[2])) {
      tailLeft = pnts[1];
      tailRight = pnts[0];
    }
    var midTail = this.plotUtil.Mid(tailLeft, tailRight);
    var bonePnts = [midTail].concat(pnts.slice(2));
    var headPnts = this.getArrowHeadPoints(bonePnts, tailLeft, tailRight);
    var _ref2 = [headPnts[0], headPnts[4]],
      neckLeft = _ref2[0],
      neckRight = _ref2[1];

    var tailWidth = this.plotUtil.MathDistance(tailLeft, tailRight);
    var allLen = this.plotUtil.getBaseLength(bonePnts);
    var len = allLen * this.tailWidthFactor * this.swallowTailFactor;
    var swallowTailPnt = this.plotUtil.getThirdPoint(bonePnts[1], bonePnts[0], 0, len, true);
    var factor = tailWidth / allLen;
    var bodyPnts = this.getArrowBodyPoints(bonePnts, neckLeft, neckRight, factor);
    var count = bodyPnts.length;
    var leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
    leftPnts.push(neckLeft);
    var rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
    rightPnts.push(neckRight);
    leftPnts = this.plotUtil.getQBSplinePoints(leftPnts);
    rightPnts = this.plotUtil.getQBSplinePoints(rightPnts);
    var pList = leftPnts.concat(headPnts, rightPnts.reverse(), [swallowTailPnt, leftPnts[0]]);

    var returnArr = pointconvert.mercators2cartesians(pList);
    return returnArr;
  }
}
