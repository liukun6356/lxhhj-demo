import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as measureUtil from "../../util/measure";
import { getPositionValue, setPositionsHeight } from "../../util/point";
import { MeasureArea } from "./MeasureArea";

//贴地线
export class MeasureAreaSurface extends MeasureArea {
  get type() {
    return "areaSurface";
  }
  //开始绘制
  _startDraw(options) {
    options.style.clampToGround = true;

    return super._startDraw(options);
  }
  //绘制完成后
  showDrawEnd(entity) {
    // super.showDrawEnd(entity);
    if (entity.polygon == null) return;

    entity._totalLable = this.totalLable;
    this.totalLable = null;

    this.updateAreaForTerrain(entity);
  }
  //编辑修改后
  updateForEdit(entity) {
    super.updateForEdit(entity);
    this.updateAreaForTerrain(entity);
  }
  //计算贴地面
  updateAreaForTerrain(entity) {
    var that = this;

    //更新lable等
    var totalLable = entity._totalLable;
    var unit = totalLable && totalLable.attribute && totalLable.attribute.unit;
    var thisCenter = getPositionValue(totalLable.position);

    var positions = this.drawControl.getPositions(entity);

    this.target.fire(eventType.start, {
      mtype: this.type
    });

    //贴地总面积
    measureUtil.getClampArea(positions, {
      scene: this.viewer.scene,
      splitNum: this.options.splitNum,
      has3dtiles: this.options.has3dtiles,
      asyn: true, //异步求准确的
      callback: (area, resultInter) => {
        // if (that.options.onInterEnd)
        //     that.options.onInterEnd(resultInter);

        totalLable.position = setPositionsHeight(thisCenter, resultInter.maxHeight); //更新lable高度

        totalLable.attribute.value = area;
        var areastr = totalLable.showText(unit);

        this.target.fire(eventType.change, {
          mtype: this.type,
          value: area,
          label: areastr
        });
        this.target.fire(eventType.end, {
          ...resultInter,
          mtype: this.type,
          entity: entity,
          value: area
        });
      }
    });
  }
}
