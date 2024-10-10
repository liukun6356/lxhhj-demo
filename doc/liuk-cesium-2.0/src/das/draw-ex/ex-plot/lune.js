import * as Cesium from "cesium";
import { DrawPolygonEx } from "../../draw/draw/Draw.PolygonEx";
import { EditPolygonEx } from "../../draw/edit/Edit.PolygonEx";
import { register } from "../../draw/Draw";

import { Lune } from "../core/algorithm/Lune";

//弓形面(3个点)
var drawtype = "lune";
var lune = new Lune();

//编辑
class EditEx extends EditPolygonEx {
  //根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return lune.startCompute(positions);
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
    return lune.startCompute(positions);
  }
}

//注册到Draw中
register(drawtype, DrawEx);
