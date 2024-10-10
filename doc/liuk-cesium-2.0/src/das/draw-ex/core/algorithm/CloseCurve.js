import * as Cesium from "cesium";
import { plotUtil } from "../../core/PlotUtil";
import * as pointconvert from "../../../util/pointconvert";

//闭合曲面
export class CloseCurve {
  constructor(opt) {
    if (!opt) opt = {};
    //影响因素
    this.positions = null;
    this.plotUtil = plotUtil;
  }

  startCompute(positions) {
    var pnts = pointconvert.cartesians2mercators(positions);
    pnts.push(pnts[0], pnts[1]);

    var normals = [];
    var pList = [];
    for (var i = 0; i < pnts.length - 2; i++) {
      var normalPoints = this.plotUtil.getBisectorNormals(0.3, pnts[i], pnts[i + 1], pnts[i + 2]);
      normals = normals.concat(normalPoints);
    }
    var count = normals.length;
    normals = [normals[count - 1]].concat(normals.slice(0, count - 1));
    for (var _i = 0; _i < pnts.length - 2; _i++) {
      var pnt1 = pnts[_i];
      var pnt2 = pnts[_i + 1];
      pList.push(pnt1);
      for (var t = 0; t <= 100; t++) {
        var pnt = this.plotUtil.getCubicValue(
          t / 100,
          pnt1,
          normals[_i * 2],
          normals[_i * 2 + 1],
          pnt2
        );
        pList.push(pnt);
      }
      pList.push(pnt2);
    }

    var returnArr = pointconvert.mercators2cartesians(pList);
    return returnArr;
  }
}
