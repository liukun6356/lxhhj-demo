import * as Cesium from "cesium";
import { DrawPolygonEx } from "../../draw/draw/Draw.PolygonEx";
import { EditPolygonEx } from "../../draw/edit/Edit.PolygonEx";
import { register } from "../../draw/Draw";

import { FineArrowYW } from "../core/algorithm/FineArrowYW";

//直箭头(2个点)
var drawtype = "fineArrowYW";
var fineArrowYW = new FineArrowYW();
//编辑
class EditEx extends EditPolygonEx {
  //根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return fineArrowYW.startCompute(positions);
  }
}

//绘制
class DrawEx extends DrawPolygonEx {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = drawtype;
    this.editClass = EditEx; //获取编辑对象

    this._minPointNum = 2; //至少需要点的个数
    this._maxPointNum = 2; //最多允许点的个数
  }
  //根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return fineArrowYW.startCompute(positions);
  }
}

//注册到Draw中
register(drawtype, DrawEx);
