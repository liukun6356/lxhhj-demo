import * as Cesium from "cesium";
import { DrawPolygonEx } from "../../draw/draw/Draw.PolygonEx";
import { EditPolygonEx } from "../../draw/edit/Edit.PolygonEx";
import { register } from "../../draw/Draw";
import { getAngle } from "../../util/measure";
import { getRotateCenterPoint } from "../../util/matrix";

//等腰三角形(3个点)
var drawtype = "triangleDY";

var midPoint = new Cesium.Cartesian3();

function getPositions(positions) {
  //p1 p2 用于控制腰的高度 p3用于控制夹角
  var p1 = positions[0];
  var p2 = positions[1];
  var p3 = positions[2];

  var midpoint = Cesium.Cartesian3.midpoint(p1, p2, midPoint);

  var angle1 = getAngle(midpoint, p2);
  var angle2 = getAngle(midpoint, p3);
  var angle = angle1 - angle2 - 90;
  var newPoint2 = getRotateCenterPoint(midpoint, p3, angle);

  return [p1, p2, newPoint2];
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
