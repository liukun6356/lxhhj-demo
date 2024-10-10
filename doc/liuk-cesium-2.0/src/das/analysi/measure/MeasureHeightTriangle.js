import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as util from "../../util/util";
import { style2Entity as labelStyle2Entity } from "../../draw/attr/Attr.Label";
import { style2Entity as polylineStyle2Entity } from "../../draw/attr/Attr.Polyline";
import { MeasureHeight } from "./MeasureHeight";

export class MeasureHeightTriangle extends MeasureHeight {
  //========== 构造方法 ==========
  constructor(opts, target) {
    super(opts, target);

    this.totalLable = null; //高度差label
    this.xLable = null; //空间距离label
    this.hLable = null; //水平距离label
  }
  get type() {
    return "heightTriangle";
  }

  //清除未完成的数据
  clearLastNoEnd() {
    if (this.totalLable != null) this.dataSource.entities.remove(this.totalLable);
    if (this.xLable != null) this.dataSource.entities.remove(this.xLable);
    if (this.hLable != null) this.dataSource.entities.remove(this.hLable);

    this.totalLable = null;
    this.xLable = null;
    this.hLable = null;
  }
  //开始绘制
  _startDraw(options) {
    var entityattr2 = labelStyle2Entity(this.labelStyle, {
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      show: false
    });
    entityattr2.pixelOffset = new Cesium.Cartesian2(0, 0);
    this.xLable = this.dataSource.entities.add({
      label: entityattr2,
      _noMousePosition: true,
      attribute: {
        unit: options.unit,
        type: options.type
      }
    });
    this.xLable.showText = function(unit) {
      var heightstr = util.formatLength(this.attribute.value, unit);
      this.label.text = "空间距离:" + heightstr;
      return heightstr;
    };

    this.hLable = this.dataSource.entities.add({
      label: entityattr2,
      _noMousePosition: true,
      attribute: {
        unit: options.unit,
        type: options.type
      }
    });
    this.hLable.showText = function(unit) {
      var heightstr = util.formatLength(this.attribute.value, unit);
      this.label.text = "水平距离:" + heightstr;
      return heightstr;
    };

    return super._startDraw(options);
  }
  //绘制中删除了最后一个点
  showRemoveLastPointLength(e) {
    if (this.totalLable) this.totalLable.label.show = false;
    if (this.hLable) this.hLable.label.show = false;
    if (this.xLable) this.xLable.label.show = false;
  }
  //绘制过程移动中，动态显示长度信息
  showMoveDrawing(entity) {
    var positions = this.drawControl.getPositions(entity);
    if (positions.length < 2) {
      this.showRemoveLastPointLength();
      return;
    }

    var carto1 = Cesium.Cartographic.fromCartesian(positions[0]);
    var height1 = carto1.height;
    var carto2 = Cesium.Cartographic.fromCartesian(positions[1]);
    var height2 = carto2.height;

    var bottomPosition; //三角底部点
    var zPosition; //三角底部点 对应的高处的点
    var topPosion; //三角的顶部点

    if (height1 > height2) {
      zPosition = Cesium.Cartesian3.fromRadians(carto2.longitude, carto2.latitude, height1);
      topPosion = positions[0];
      bottomPosition = positions[1];
    } else {
      zPosition = Cesium.Cartesian3.fromRadians(carto1.longitude, carto1.latitude, height2);
      topPosion = positions[1];
      bottomPosition = positions[0];
    }

    //显示三角行 线
    this.updateExLine([bottomPosition, zPosition, topPosion, bottomPosition], entity); //参考线

    //[垂直方向]高度差
    var height = Math.abs(height2 - height1);
    var midPoint = Cesium.Cartesian3.midpoint(zPosition, bottomPosition, new Cesium.Cartesian3());
    this.updateHeightLabel(this.totalLable, midPoint, height);

    //[水平方向]水平距离
    var distanceSP = Cesium.Cartesian3.distance(zPosition, topPosion);
    var midPointSP = Cesium.Cartesian3.midpoint(zPosition, topPosion, new Cesium.Cartesian3());
    this.updateHeightLabel(this.hLable, midPointSP, distanceSP);

    //空间距离长度
    var distance = Cesium.Cartesian3.distance(positions[0], positions[1]);
    var midXPoint = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
    this.updateHeightLabel(this.xLable, midXPoint, distance);

    this.target.fire(eventType.change, {
      mtype: this.type,
      value: height, //高度差
      distance: distance, //空间长度
      distanceSP: distanceSP //水平距离
    });
  }
  updateHeightLabel(currentLabel, position, value) {
    if (currentLabel == null) return;

    currentLabel.attribute.value = value;
    currentLabel.showText(this.options.unit);
    currentLabel.position = position; //位置
    currentLabel.label.show = true;
  }
  updateExLine(positions, entity) {
    if (this.exLine) {
      this.exLine._positions = positions;
    } else {
      var entityattr = polylineStyle2Entity({
        positions: new Cesium.CallbackProperty(time => {
          return exLine._positions;
        }, false),
        lineType: "glow",
        color: "#ebe12c",
        width: 9,
        glowPower: 0.1,
        // "depthFail": true,
        // "depthFailColor": "#ebe12c",
        ...this.options.style
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
    entity.arrEntityEx = [this.totalLable, this.hLable, this.xLable, this.exLine];

    this.target.fire(eventType.end, {
      mtype: this.type,
      entity: entity,
      value: this.totalLable.attribute.value
    });

    this.totalLable = null;
    this.hLable = null;
    this.xLable = null;
    this.exLine = null;
  }

  //编辑修改后
  updateForEdit(entity) {
    this.totalLable = entity.arrEntityEx[0];
    this.hLable = entity.arrEntityEx[1];
    this.xLable = entity.arrEntityEx[2];
    this.exLine = entity.arrEntityEx[3];

    this.showMoveDrawing(entity);

    this.totalLable = null;
    this.hLable = null;
    this.xLable = null;
    this.exLine = null;
  }
}
