//拖拽点控制类
import * as Cesium from "cesium";
import { message } from "../core/Tooltip";

export var PixelSize = 12; //编辑点的像素大小

//拖拽点分类
export var PointType = {
  Control: 1, //位置控制
  MoveAll: 2, //整体平移(如线面)
  AddMidPoint: 3, //辅助增加新点
  MoveHeight: 4, //上下移动高度
  EditAttr: 5, //辅助修改属性（如半径）
  EditRotation: 6 //旋转角度修改
};

//拖拽点分类
export var PointColor = {
  Control: Cesium.Color.fromCssColorString("#1c197d"), //位置控制拖拽点
  MoveAll: Cesium.Color.fromCssColorString("#8c003a"), //整体平移(如线面)拖拽点
  MoveHeight: Cesium.Color.fromCssColorString("#9500eb"), //上下移动高度的拖拽点
  EditAttr: Cesium.Color.fromCssColorString("#f531e8"), //辅助修改属性（如半径）的拖拽点
  AddMidPoint: Cesium.Color.fromCssColorString("#04c2c9").withAlpha(0.3) //增加新点，辅助拖拽点
};

function getAttrForType(type, attr) {
  switch (type) {
    case PointType.AddMidPoint:
      attr.color = PointColor.AddMidPoint;
      attr.outlineColor = Cesium.Color.fromCssColorString("#ffffff").withAlpha(0.4);
      break;
    case PointType.MoveAll:
      attr.color = PointColor.MoveAll;
      break;
    case PointType.MoveHeight:
      attr.color = PointColor.MoveHeight;
      break;
    case PointType.EditAttr:
      attr.color = PointColor.EditAttr;
      break;
    case PointType.Control:
    default:
      attr.color = PointColor.Control;
      break;
  }
  return attr;
}

/** 创建Dragger拖动点的公共方法 */
export function createDragger(entityCollection, options) {
  var dragger;
  if (options.dragger) {
    dragger = options.dragger;
  } else {
    var attr = {
      scale: 1,
      pixelSize: PixelSize,
      outlineColor: Cesium.Color.fromCssColorString("#ffffff").withAlpha(0.5),
      outlineWidth: 2,
      scaleByDistance: new Cesium.NearFarScalar(1000, 1, 1000000, 0.5),
      disableDepthTestDistance: Number.POSITIVE_INFINITY //一直显示，不被地形等遮挡
    };
    attr = getAttrForType(options.type, attr);

    dragger = entityCollection.add({
      position: Cesium.defaultValue(options.position, Cesium.Cartesian3.ZERO),
      point: attr,
      draw_tooltip: options.tooltip || message.dragger.def
    });
    dragger.contextmenuItems = false; //不加右键菜单
  }

  dragger._isDragger = true;
  dragger._noMousePosition = true; //不被getCurrentMousePosition拾取
  dragger._pointType = options.type || PointType.Control; //默认是位置控制拖拽点

  dragger.onDragStart = Cesium.defaultValue(options.onDragStart, null);
  dragger.onDrag = Cesium.defaultValue(options.onDrag, null);
  dragger.onDragEnd = Cesium.defaultValue(options.onDragEnd, null);

  return dragger;
}
