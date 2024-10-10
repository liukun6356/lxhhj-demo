import * as Cesium from "cesium";
import { DrawPolygonEx } from "../../draw/draw/Draw.PolygonEx";
import { EditPolygonEx } from "../../draw/edit/Edit.PolygonEx";
import { register } from "../../draw/Draw";
import * as pointconvert from "../../util/pointconvert";

import { plotUtil } from "../core/PlotUtil";

//扇形(3个点)
var drawtype = "sector";

function getPositions(positions, attribute) {
  var pnts = pointconvert.cartesians2mercators(positions);
  var center = pnts[0],
    pnt2 = pnts[1],
    pnt3 = pnts[2];
  var radius = plotUtil.MathDistance(pnt2, center);
  var startAngle = plotUtil.getAzimuth(pnt2, center);
  var endAngle = plotUtil.getAzimuth(pnt3, center);
  var pList = plotUtil.getArcPoints(center, radius, startAngle, endAngle);
  pList.push(center, pList[0]);

  var returnArr = pointconvert.mercators2cartesians(pList);
  return returnArr;
}

//编辑
class EditEx extends EditPolygonEx {
  //根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return getPositions(positions, attribute);
  }
}

//绘制
class DrawEx extends DrawPolygonEx {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = drawtype;
    this.editClass = EditEx; //获取编辑对象

    this._minPointNum = 3; //至少需要点的个数
    this._maxPointNum = 3; //最多允许点的个数
  }
  //根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return getPositions(positions, attribute);
  }
}

//注册到Draw中
register(drawtype, DrawEx);
