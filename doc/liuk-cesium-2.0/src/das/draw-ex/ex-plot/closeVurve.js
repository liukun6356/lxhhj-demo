import * as Cesium from "cesium";
import { DrawPolygonEx } from "../../draw/draw/Draw.PolygonEx";
import { EditPolygonEx } from "../../draw/edit/Edit.PolygonEx";
import { register } from "../../draw/Draw";

import { CloseCurve } from "../core/algorithm/CloseCurve";

//闭合曲面(3个点)
var drawtype = "closeVurve";
var closeCurve = new CloseCurve();
//编辑
class EditEx extends EditPolygonEx {
  //========== 构造方法 ==========
  constructor(entity, viewer) {
    super(entity, viewer);

    this._hasMidPoint = true; //是否可以加点
  }
  //根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return closeCurve.startCompute(positions);
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
    this._maxPointNum = 999; //最多允许点的个数
  }
  //根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return closeCurve.startCompute(positions);
  }
}

//注册到Draw中
register(drawtype, DrawEx);
