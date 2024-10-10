import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as util from "../../util/util";
import { formatPosition } from "../../util/point";
import { computeStepSurfaceLine } from "../../util/polyline";
import { MeasureLength } from "./MeasureLength";

export class MeasureLengthSection extends MeasureLength {
  get type() {
    return "section";
  }
  //开始绘制
  _startDraw(options) {
    options.style.clampToGround = true;
    options.splitNum = Cesium.defaultValue(options.splitNum, 200);

    return super._startDraw(options);
  }

  //绘制完成后
  showDrawEnd(entity) {
    super.showDrawEnd(entity);
    this.updateSectionForTerrain(entity);
  }

  //编辑修改了线
  updateForEdit(entity) {
    super.updateForEdit(entity);
    this.updateSectionForTerrain(entity);
  }

  //计算剖面
  updateSectionForTerrain(entity) {
    var positions = this.drawControl.getPositions(entity);
    if (positions.length < 2) return;

    var arrLables = entity.arrEntityEx;
    var totalLable = entity._totalLable;
    var unit = totalLable && totalLable.attribute && totalLable.attribute.unit;

    this.target.fire(eventType.start, {
      mtype: this.type
    });

    var all_distance = 0;
    var arrLen = [];
    var arrHB = [];
    var arrLX = [];
    var arrPoint = [];
    // var positionsNew = [];

    var that = this;
    computeStepSurfaceLine({
      viewer: this.viewer,
      positions: positions,
      splitNum: that.options.splitNum,
      has3dtiles: that.options.has3dtiles,
      //计算每个分段后的回调方法
      endItem: (raisedPositions, noHeight, index) => {
        var h1 = Cesium.Cartographic.fromCartesian(positions[index]).height;
        var h2 = Cesium.Cartographic.fromCartesian(positions[index + 1]).height;
        var hstep = (h2 - h1) / raisedPositions.length;

        var this_distance = 0;
        for (var i = 0; i < raisedPositions.length; i++) {
          //长度
          if (i != 0) {
            var templen = Cesium.Cartesian3.distance(raisedPositions[i], raisedPositions[i - 1]);
            all_distance += templen;
            this_distance += templen;
          }
          arrLen.push(Number(all_distance.toFixed(1)));

          //海拔高度
          var point = formatPosition(raisedPositions[i]);
          arrHB.push(point.z);
          arrPoint.push(point);

          //路线高度
          var fxgd = Number((h1 + hstep * i).toFixed(1));
          arrLX.push(fxgd);
        }

        index++;
        var thisLabel = arrLables[index];
        if (thisLabel) {
          thisLabel.attribute.value = all_distance;
          thisLabel.attribute.valueFD = this_distance;
          thisLabel.showText(unit);
        } else if (index == positions.length - 1 && totalLable) {
          //最后一个
          totalLable.attribute.value = all_distance;
          totalLable.attribute.valueFD = this_distance;
          totalLable.showText(unit);
        }
      },
      //计算全部完成的回调方法
      end: () => {
        var distancestr = util.formatLength(all_distance, unit);
        var result = {
          mtype: this.type,
          entity: entity,
          value: all_distance,
          label: distancestr,

          distancestr: distancestr,
          distance: all_distance,
          arrLen: arrLen,
          arrLX: arrLX,
          arrHB: arrHB,
          arrPoint: arrPoint
        };

        this.target.fire(eventType.change, result);
        this.target.fire(eventType.end, result);
      }
    });
  }
}
