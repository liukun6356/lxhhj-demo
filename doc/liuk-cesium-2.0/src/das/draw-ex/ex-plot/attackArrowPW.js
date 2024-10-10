import * as Cesium from "cesium";
import { AttackArrowPW } from "../core/algorithm/AttackArrowPW";

import { DrawPolygonEx } from "../../draw/draw/Draw.PolygonEx";
import { EditPolygonEx } from "../../draw/edit/Edit.PolygonEx";
import { register } from "../../draw/Draw";

//攻击箭头(平尾)
var drawtype = "attackArrowPW";
var attackArrow = new AttackArrowPW();

//编辑

//编辑
class EditEx extends EditPolygonEx {
  //========== 构造方法 ==========
  constructor(entity, viewer) {
    super(entity, viewer);

    this._hasMidPoint = true; //是否可以加点
    this.hasClosure = false; //是否首尾相连闭合（线不闭合，面闭合），用于处理中间点
  }
  //根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return attackArrow.startCompute(positions);
  }
}

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
    return attackArrow.startCompute(positions);
  }
}

//注册到Draw中
register(drawtype, DrawEx);
