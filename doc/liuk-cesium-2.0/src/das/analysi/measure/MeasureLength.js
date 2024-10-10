import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as util from "../../util/util";
import * as measureUtil from "../../util/measure";
import { style2Entity as labelStyle2Entity } from "../../draw/attr/Attr.Label";
import { MeasureBase } from "./MeasureBase";

export class MeasureLength extends MeasureBase {
  //========== 构造方法 ==========
  constructor(opts, target) {
    super(opts, target);

    this.arrLables = []; //各线段label
    this.totalLable = null; //总长label
    this.disTerrainScale = 1.2; //贴地时的概略比例
  }
  get type() {
    return "length";
  }
  //清除未完成的数据
  clearLastNoEnd() {
    if (Cesium.defined(this.totalLable)) this.dataSource.entities.remove(this.totalLable);
    if (Cesium.defined(this.arrLables) && this.arrLables.length > 0) {
      var arrLables = this.arrLables;
      if (arrLables && arrLables.length > 0) {
        for (var i = 0, len = arrLables.length; i < len; i++) {
          this.dataSource.entities.remove(arrLables[i]);
        }
      }
    }
    this.totalLable = null;
    this.arrLables = [];
  }

  //开始绘制
  _startDraw(options) {
    this.stopDraw();

    //总长label
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
      var distancestr = util.formatLength(this.attribute.value, unit);
      if (this.attribute.value != this.attribute.valueFD) {
        var lastLenStr = util.formatLength(this.attribute.valueFD, unit);
        this.label.text = "总长:" + distancestr + "\n(+" + lastLenStr + ")";
      } else {
        this.label.text = "总长:" + distancestr;
      }
      return distancestr;
    };
    this.arrLables = [];

    return this.drawControl.startDraw({
      type: "polyline",
      config: {
        addHeight: options.addHeight,
        maxPointNum: options.maxPointNum
      },
      style: {
        lineType: "glow",
        color: "#ebe12c",
        width: 2,
        glowPower: 0.1,
        clampToGround: false, //是否贴地
        depthFail: true,
        depthFailType: "dash",
        depthFailOpacity: 0.5,
        depthFailColor: "#ebe12c",
        ...options.style
      }
    });
  }

  //绘制增加一个点后，显示该分段的长度
  showAddPointLength(entity) {
    var positions = this.drawControl.getPositions(entity);

    var entityattr = labelStyle2Entity(this.labelStyle, {
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      show: true
    });

    var labelEntity = this.dataSource.entities.add({
      position: positions[positions.length - 1],
      label: entityattr,
      _noMousePosition: true,
      attribute: {
        unit: this.options.unit,
        type: this.options.type
      }
    });

    if (positions.length == 1) {
      labelEntity.label.text = "起点";
      //labelEntity.attribute.value = 0;
    } else {
      var distance = measureUtil.getLength(positions);
      var lastLen = measureUtil.getLength([
        positions[positions.length - 2],
        positions[positions.length - 1]
      ]); //最后2点间距离
      //屏蔽比较小的数值
      // if (lastLen < 5)
      //     labelEntity.show = false;

      labelEntity.attribute.value = distance;
      labelEntity.attribute.valueFD = lastLen;
      labelEntity.showText = function(unit) {
        var distancestr = util.formatLength(this.attribute.value, unit);
        if (this.attribute.value != this.attribute.valueFD) {
          var lastLenStr = util.formatLength(this.attribute.valueFD, unit);
          this.label.text = distancestr + "\n(+" + lastLenStr + ")";
        } else {
          this.label.text = distancestr;
        }
      };
      labelEntity.showText(this.options.unit);
    }
    this.arrLables.push(labelEntity);
  }
  showRemoveLastPointLength(e) {
    var label = this.arrLables.pop();
    this.dataSource.entities.remove(label);

    this.showMoveDrawing(e.entity);
    this.totalLable.position = e.position;
  }
  //绘制过程移动中，动态显示长度信息
  showMoveDrawing(entity) {
    var positions = this.drawControl.getPositions(entity);
    if (positions.length < 2) {
      this.totalLable.label.show = false;
      return;
    }

    var distance = measureUtil.getLength(positions);
    var distancestr = util.formatLength(distance, this.options.unit);

    //最后2点间距离
    var lastLen = measureUtil.getLength([
      positions[positions.length - 2],
      positions[positions.length - 1]
    ]);
    if (lastLen == 0 && positions.length > 2) {
      lastLen = measureUtil.getLength([
        positions[positions.length - 3],
        positions[positions.length - 2]
      ]);
    }
    this.totalLable.attribute.value = distance;
    this.totalLable.attribute.valueFD = lastLen;

    this.totalLable.showText(this.options.unit);
    this.totalLable.position = positions[positions.length - 1];
    this.totalLable.label.show = true;

    this.target.fire(eventType.change, {
      mtype: this.type,
      value: distance,
      label: distancestr
    });
  }
  //绘制完成后
  showDrawEnd(entity) {
    var positions = this.drawControl.getPositions(entity);
    var count = this.arrLables.length - positions.length;
    if (count >= 0) {
      for (var i = this.arrLables.length - 1; i >= positions.length - 1; i--) {
        this.dataSource.entities.remove(this.arrLables[i]);
      }
      this.arrLables.splice(positions.length - 1, count + 1);
    }
    entity._totalLable = this.totalLable;
    entity.arrEntityEx = this.arrLables;

    this.totalLable = null;
    this.arrLables = [];

    if (this.type == "length") {
      this.target.fire(eventType.end, {
        mtype: this.type,
        entity: entity,
        value: entity._totalLable.attribute.value
      });
    }
  }
  //编辑修改了线
  updateForEdit(entity) {
    var positions = this.drawControl.getPositions(entity);

    var arrLables = entity.arrEntityEx;
    if (arrLables && arrLables.length > 0) {
      for (let i = 1, len = arrLables.length; i < len; i++) {
        this.dataSource.entities.remove(arrLables[i]);
      }
    }

    //起点
    var qidian = arrLables[0];
    qidian.position = positions[0];

    entity.arrEntityEx = [qidian];

    var alllen = 0;
    for (let i = 1, len = positions.length - 1; i < len; i++) {
      var lastLen = util.getLength([positions[i - 1], positions[i]]); //2点间距离
      alllen += lastLen;

      var entityattr = labelStyle2Entity(this.labelStyle, {
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      });
      var labelEntity = this.dataSource.entities.add({
        position: positions[i],
        label: entityattr,
        _noMousePosition: true,
        attribute: {
          unit: this.options.unit,
          type: this.options.type
        }
      });
      labelEntity.attribute.value = alllen;
      labelEntity.attribute.valueFD = lastLen;
      labelEntity.showText = function(unit) {
        var distancestr = util.formatLength(this.attribute.value, unit);
        if (this.attribute.value != this.attribute.valueFD) {
          var lastLenStr = util.formatLength(this.attribute.valueFD, unit);
          this.label.text = distancestr + "\n(+" + lastLenStr + ")";
        } else {
          this.label.text = distancestr;
        }
      };
      labelEntity.showText(this.options.unit);

      entity.arrEntityEx.push(labelEntity);
    }

    var lastlen = util.getLength([
      positions[positions.length - 2],
      positions[positions.length - 1]
    ]);
    alllen += lastlen;

    entity._totalLable.attribute.value = alllen;
    entity._totalLable.attribute.valueFD = lastlen;
    var alllenstr = entity._totalLable.showText();
    entity._totalLable.position = positions[positions.length - 1];

    this.target.fire(eventType.change, {
      mtype: this.type,
      value: alllen,
      label: alllenstr
    });
  }
}
