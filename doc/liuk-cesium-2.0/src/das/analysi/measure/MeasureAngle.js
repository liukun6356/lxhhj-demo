import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as util from "../../util/util";
import * as measureUtil from "../../util/measure";
import { getRotateCenterPoint } from "../../util/matrix";
import { style2Entity as labelStyle2Entity } from "../../draw/attr/Attr.Label";
import { style2Entity as polylineStyle2Entity } from "../../draw/attr/Attr.Polyline";
import { MeasureBase } from "./MeasureBase";

export class MeasureAngle extends MeasureBase {
  //========== 构造方法 ==========
  constructor(opts, target) {
    super(opts, target);

    this.totalLable = null; //角度label
    this.exLine = null; //辅助线
  }
  get type() {
    return "angle";
  }

  //清除未完成的数据
  clearLastNoEnd() {
    if (this.totalLable != null) this.dataSource.entities.remove(this.totalLable);
    this.totalLable = null;

    if (this.exLine != null) this.dataSource.entities.remove(this.exLine);
    this.exLine = null;
  }
  //开始绘制
  _startDraw(options) {
    var entityattr = labelStyle2Entity(this.labelStyle, {
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      show: false
    });

    this.totalLable = this.dataSource.entities.add({
      label: entityattr,
      _noMousePosition: true,
      attribute: {
        unit: options.unit,
        type: options.type
      }
    });
    this.totalLable.showText = function(unit) {
      var lenstr = util.formatLength(this.attribute.valueLen, unit);
      this.label.text = "角度:" + this.attribute.value + "°\n距离:" + lenstr;
      return lenstr;
    };

    return this.drawControl.startDraw({
      type: "polyline",
      config: { maxPointNum: 2 },
      style: {
        lineType: "arrow",
        color: "#ebe967",
        width: 9,
        clampToGround: true,
        // "depthFail": true,
        // "depthFailColor": "#ebe967",
        ...options.style
      }
    });
  }
  //绘制增加一个点后，显示该分段的长度
  showAddPointLength(entity) {
    this.showMoveDrawing(entity); //兼容手机端
  }
  //绘制中删除了最后一个点
  showRemoveLastPointLength(e) {
    if (this.exLine) {
      this.dataSource.entities.remove(this.exLine);
      this.exLine = null;
    }
    if (this.totalLable) this.totalLable.label.show = false;
  }
  //绘制过程移动中，动态显示长度信息
  showMoveDrawing(entity) {
    var positions = this.drawControl.getPositions(entity);
    if (positions.length < 2) {
      this.totalLable.label.show = false;
      return;
    }

    //求长度
    var len = Cesium.Cartesian3.distance(positions[0], positions[1]);

    //求方位角
    var bearing = measureUtil.getAngle(positions[0], positions[1]);

    //求参考点
    var new_position = getRotateCenterPoint(positions[0], positions[1], -bearing);
    this.updateExLine([positions[0], new_position], entity); //参考线

    //显示文本
    this.totalLable.attribute.value = bearing;
    this.totalLable.attribute.valueLen = len;

    var lenstr = this.totalLable.showText(this.options.unit);

    this.totalLable.position = positions[1];
    this.totalLable.label.show = true;

    this.target.fire(eventType.change, {
      mtype: this.type,
      value: bearing,
      label: lenstr,
      length: len
    });
  }
  updateExLine(positions, entity) {
    if (this.exLine) {
      this.exLine._positions = positions;
    } else {
      var entityattr = polylineStyle2Entity(this.options.styleEx, {
        positions: new Cesium.CallbackProperty(time => {
          return exLine._positions;
        }, false),
        width: 3,
        clampToGround: true,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.RED
        })
      });

      var exLine = this.dataSource.entities.add({
        polyline: entityattr
      });
      exLine._positions = positions;
      exLine.target = entity;
      this.bindDeleteContextmenu(exLine);

      this.exLine = exLine;
    }
  }
  //绘制完成后
  showDrawEnd(entity) {
    entity._totalLable = this.totalLable;
    this.totalLable = null;

    entity.arrEntityEx = [this.exLine];

    this.target.fire(eventType.end, {
      mtype: this.type,
      entity: entity,
      value: entity._totalLable.attribute.value
    });
  }

  //编辑修改后
  updateForEditMouseMove(entity) {
    this.updateForEdit(entity);
  }
  updateForEdit(entity) {
    this.totalLable = entity._totalLable;
    this.exLine = entity.arrEntityEx[0];

    this.showMoveDrawing(entity);

    this.totalLable = null;
    this.exLine = null;
  }
}
