import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as util from "../../util/util";
import * as measureUtil from "../../util/measure";
import { MeasureLength } from "./MeasureLength";

//贴地线
export class MeasureLengthSurface extends MeasureLength {
  get type() {
    return "lengthSurface";
  }
  //开始绘制
  _startDraw(options) {
    options.style.clampToGround = true;

    return super._startDraw(options);
  }

  //绘制完成后
  showDrawEnd(entity) {
    super.showDrawEnd(entity);
    this.updateLengthForTerrain(entity);
  }
  //编辑修改了线
  updateForEdit(entity) {
    super.updateForEdit(entity);
    this.updateLengthForTerrain(entity);
  }
  //计算贴地线
  updateLengthForTerrain(entity) {
    var that = this;

    var positions = this.drawControl.getPositions(entity);
    var arrLables = entity.arrEntityEx;
    var totalLable = entity._totalLable;
    var unit = totalLable && totalLable.attribute && totalLable.attribute.unit;

    this.target.fire(eventType.start, {
      mtype: this.type
    });

    //求贴地线长度
    measureUtil.getClampLength(positions, {
      scene: this.viewer.scene,
      splitNum: that.options.splitNum,
      has3dtiles: that.options.has3dtiles,
      disTerrainScale: that.disTerrainScale, //求高度失败，概略估算值
      //计算每个分段后的回调方法
      endItem: function(result) {
        var index = result.index;
        var all_distance = result.all_distance;
        var distance = result.distance;

        index++;
        var thisLabel = arrLables[index];
        if (thisLabel) {
          thisLabel.attribute.value = all_distance;
          thisLabel.attribute.valueFD = distance;
          thisLabel.showText(unit);
        } else if (index == positions.length - 1 && totalLable) {
          //最后一个
          totalLable.attribute.value = all_distance;
          totalLable.attribute.valueFD = distance;
          totalLable.showText(unit);
        }
      },
      //计算全部完成的回调方法
      callback(all_distance) {
        var distancestr = util.formatLength(all_distance, unit);
        var result = {
          mtype: that.type,
          entity: entity,
          value: all_distance,
          label: distancestr
        };
        that.target.fire(eventType.change, result);
        that.target.fire(eventType.end, result);
      }
    });
  }
}
