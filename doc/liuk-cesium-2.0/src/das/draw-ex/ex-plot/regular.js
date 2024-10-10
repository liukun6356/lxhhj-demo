import * as Cesium from "cesium";
import { DrawPolygonEx } from "../../draw/draw/Draw.PolygonEx";
import { EditPolygonEx } from "../../draw/edit/Edit.PolygonEx";
import { register } from "../../draw/Draw";
import { getRotateCenterPoint } from "../../util/matrix";

//正多边形  边数取决于config.border
var drawtype = "regular";

function getPositions(positions, attribute) {
  var center = positions[0];
  var point = positions[1];
  var num = attribute.config.border || 3; //边数量

  var addAngle = 360 / num;

  var pointArr = [];
  for (var i = 0; i < num; i++) {
    var thisAngle = addAngle * i;
    var newPoint = getRotateCenterPoint(center, point, thisAngle);
    pointArr.push(newPoint);
  }
  return pointArr;
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

    this._minPointNum = 2; //至少需要点的个数
    this._maxPointNum = 2; //最多允许点的个数
  }
  //根据标绘绘制的点，生成显示的边界点
  getShowPositions(positions, attribute) {
    return getPositions(positions, attribute);
  }
}

//注册到Draw中
register(drawtype, DrawEx);
