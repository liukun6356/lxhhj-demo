//通用处理方法
import * as Cesium from "cesium";
import { LineFlowMaterialProperty } from "../../material/property/LineFlowMaterialProperty";
import { CircleWaveMaterialProperty } from "../../material/property/CircleWaveMaterialProperty";

export function setFillMaterial(entityattr, style) {
  if (style.material) {
    //material属性优先
    entityattr.material = style.material;
    return entityattr;
  }

  if (style.color || style.fillType) {
    var color = Cesium.Color.fromCssColorString(
      Cesium.defaultValue(style.color, "#FFFF00")
    ).withAlpha(Number(Cesium.defaultValue(style.opacity, 1.0)));

    switch (style.fillType) {
      default:
      case "color": //纯色填充
        entityattr.material = color;
        break;
      case "image": //图片填充
        var repeat = Cesium.defaultValue(style.image_repeat, 1);
        entityattr.material = new Cesium.ImageMaterialProperty({
          image: style.image,
          color: Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(
            Number(Cesium.defaultValue(style.opacity, 1.0))
          ),
          transparent: style.transparent, //是否png透明
          repeat: new Cesium.Cartesian2(repeat, repeat)
        });
        break;
      case "grid": //网格
        var lineCount = Cesium.defaultValue(style.grid_lineCount, 8);
        var lineThickness = Cesium.defaultValue(style.grid_lineThickness, 2.0);
        entityattr.material = new Cesium.GridMaterialProperty({
          color: color,
          cellAlpha: Cesium.defaultValue(style.grid_cellAlpha, 0.1),
          lineCount: new Cesium.Cartesian2(lineCount, lineCount),
          lineThickness: new Cesium.Cartesian2(lineThickness, lineThickness)
        });
        break;
      case "checkerboard": //棋盘
        var checkerboard_repeat = Cesium.defaultValue(style.checkerboard_repeat, 4);
        entityattr.material = new Cesium.CheckerboardMaterialProperty({
          evenColor: color,
          oddColor: Cesium.Color.fromCssColorString(
            style.checkerboard_oddcolor || "#ffffff"
          ).withAlpha(Number(Cesium.defaultValue(style.opacity, 1.0))),
          repeat: new Cesium.Cartesian2(checkerboard_repeat, checkerboard_repeat)
        });
        break;
      case "stripe": // 条纹
        entityattr.material = new Cesium.StripeMaterialProperty({
          evenColor: color,
          oddColor: Cesium.Color.fromCssColorString(style.stripe_oddcolor || "#ffffff").withAlpha(
            Number(Cesium.defaultValue(style.opacity, 1.0))
          ),
          repeat: Cesium.defaultValue(style.stripe_repeat, 6)
        });
        break;
      case "animationLine": //流动线
        entityattr.material = new LineFlowMaterialProperty({
          //动画线材质
          color: color,
          duration: Cesium.defaultValue(style.animationDuration, 2000), //时长，控制速度
          url: style.animationImage, //图片
          repeat: new Cesium.Cartesian2(style.animationRepeatX || 1, style.animationRepeatY || 1),
          axisY: style.animationAxisY,
          bgUrl: style.bgUrl,
          bgColor: style.bgColor ? Cesium.Color.fromCssColorString(style.bgColor) : null
        });
        break;
      case "animationCircle": //动态圆
        entityattr.material = new CircleWaveMaterialProperty({
          duration: Cesium.defaultValue(style.animationDuration, 2000), //时长，控制速度
          color: Cesium.Color.fromCssColorString(style.color || "#FFFF00").withAlpha(
            Number(Cesium.defaultValue(style.opacity, 1.0))
          ),
          gradient: Cesium.defaultValue(style.animationGradient, 0),
          count: Cesium.defaultValue(style.animationCount, 1)
        });
        break;
    }
  }

  //如果未设置任何material，默认设置随机颜色
  if (entityattr.material == null || style.randomColor) {
    entityattr.material = Cesium.Color.fromRandom({
      minimumRed: Cesium.defaultValue(style.minimumRed, 0.0),
      maximumRed: Cesium.defaultValue(style.maximumRed, 0.75),
      minimumGreen: Cesium.defaultValue(style.minimumGreen, 0.0),
      maximumGreen: Cesium.defaultValue(style.maximumGreen, 0.75),
      minimumBlue: Cesium.defaultValue(style.minimumBlue, 0.0),
      maximumBlue: Cesium.defaultValue(style.maximumBlue, 0.75),
      alpha: Cesium.defaultValue(style.opacity, 1.0)
    });
  }

  return entityattr;
}
