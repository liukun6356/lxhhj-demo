import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as util from "../../util/util";
import { formatPosition, getPositionValue } from "../../util/point";
import { MeasureBase } from "./MeasureBase";

export class MeasurePoint extends MeasureBase {
  //========== 构造方法 ==========
  constructor(opts, target) {
    super(opts, target);

    this.totalLable = null; //角度label
  }
  get type() {
    return "point";
  }
  //清除未完成的数据
  clearLastNoEnd() {
    this.viewer.das.popup.close();
  }
  //开始绘制
  _startDraw(options) {
    var entity = this.drawControl.startDraw({
      type: "point",
      style: {
        visibleDepth: false,
        ...options.style
      }
    });
    entity.popup = {
      html: function(entity) {
        var position = getPositionValue(entity.position);
        var point = formatPosition(position);
        var x2 = util.formatDegree(point.x);
        var y2 = util.formatDegree(point.y);

        return `<div class="das-popup-titile">坐标测量</div>
                            <div class="das-popup-content">
                                <div><label>经度</label>${point.x}&nbsp;&nbsp;${x2}</div>
                                <div><label>纬度</label>${point.y}&nbsp;&nbsp;&nbsp;&nbsp;${y2}</div>
                                <div><label>海拔</label>${point.z}米</div>
                            </div>`;
      },
      anchor: [0, -15]
    };
    return entity;
  }
  //绘制过程移动中，动态显示长度信息
  showMoveDrawing(entity) {
    this.viewer.das.popup.show(entity);
  }
  //绘制完成后
  showDrawEnd(entity) {
    this.viewer.das.popup.show(entity);

    this.target.fire(eventType.end, {
      mtype: this.type,
      entity: entity
      // position: position,
      // point: point,
    });
  }

  //编辑修改后
  updateForEdit(entity) {
    this.viewer.das.popup.show(entity);
  }
}
