import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as util from "../../util/util";
import * as measureUtil from "../../util/measure";
import { centerOfMass } from "../../util/point";
import { style2Entity as labelStyle2Entity } from "../../draw/attr/Attr.Label";
import { MeasureBase } from "./MeasureBase";

export class MeasureArea extends MeasureBase {
  //========== 构造方法 ==========
  constructor(opts, target) {
    super(opts, target);

    this.totalLable = null; //面积label
  }
  get type() {
    return "area";
  }

  //清除未完成的数据
  clearLastNoEnd() {
    if (this.totalLable != null) this.dataSource.entities.remove(this.totalLable);
    this.totalLable = null;
  }
  //开始绘制
  _startDraw(options) {
    var entityattr = labelStyle2Entity(this.labelStyle, {
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
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
      var areastr = util.formatArea(this.attribute.value, unit);
      this.label.text = "面积:" + areastr;
      return areastr;
    };

    return this.drawControl.startDraw({
      type: "polygon",
      style: {
        color: "#00fff2",
        outline: true,
        outlineColor: "#fafa5a",
        outlineWidth: 2,
        opacity: 0.4,
        clampToGround: true, //贴地
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
    var positions = this.drawControl.getPositions(e.entity);
    if (positions.length < 3) {
      this.totalLable.label.show = false;
    }
  }
  //绘制过程移动中，动态显示长度信息
  showMoveDrawing(entity) {
    var positions = this.drawControl.getPositions(entity);
    if (positions.length < 3) {
      this.totalLable.label.show = false;
      return;
    }

    var area = measureUtil.getArea(positions);
    this.totalLable.attribute.value = area;
    var areastr = this.totalLable.showText(this.options.unit);

    //求中心点
    var ptcenter = centerOfMass(positions);
    this.totalLable.position = ptcenter;
    this.totalLable.label.show = true;

    this.target.fire(eventType.change, {
      mtype: this.type,
      value: area,
      label: areastr
    });
  }
  //绘制完成后
  showDrawEnd(entity) {
    if (entity.polygon == null) return;

    entity._totalLable = this.totalLable;
    this.totalLable = null;

    this.target.fire(eventType.end, {
      mtype: this.type,
      entity: entity,
      value: entity._totalLable.attribute.value
    });
  }

  //编辑修改后
  updateForEdit(entity) {
    var positions = this.drawControl.getPositions(entity);
    var totalLable = entity._totalLable;

    var area = measureUtil.getArea(positions);
    totalLable.attribute.value = area;
    totalLable.position = centerOfMass(positions); //求中心点

    var areastr = totalLable.showText(this.options.unit);

    this.target.fire(eventType.change, {
      mtype: this.type,
      value: area,
      label: areastr
    });
  }
}
