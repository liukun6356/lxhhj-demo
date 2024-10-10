import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import { centerOfMass, getSurfaceHeight } from "../../util/point";
import { formatArea } from "../../util/util";
import { interPolygon, updateVolumeByMinHeight, updateVolume } from "../../util/polygon";
import { style2Entity as labelStyle2Entity } from "../../draw/attr/Attr.Label";
import { style2Entity as polygonStyle2Entity } from "../../draw/attr/Attr.Polygon";
import { getDefStyle } from "../../draw/attr/index";
import { MeasureArea } from "./MeasureArea";

//体积测量（方量）
export class MeasureVolume extends MeasureArea {
  constructor(opts, target) {
    super(opts, target);

    //高度文本样式
    this.labelHeightStyle = {
      ...this.labelStyle,
      font_size: 15,
      background: false
    };
    if (Cesium.defined(opts.labelHeight)) {
      this.labelHeightStyle = { ...this.labelHeightStyle, ...opts.labelHeight };
    }

    //面的样式
    this.polygonStyle = getDefStyle("polygon", {
      color: "#00fff2",
      opacity: 0.4
    });
    if (Cesium.defined(opts.polygon)) {
      this.polygonStyle = { ...this.polygonStyle, ...opts.polygon };
    }

    //基准面的样式
    this.polygonJzmStyle = getDefStyle("polygon", {
      color: "#00ff00",
      opacity: 0.3
    });
    if (Cesium.defined(opts.polygonJzm)) {
      this.polygonJzmStyle = { ...this.polygonJzmStyle, ...opts.polygonJzm };
    }

    this.heightLabel = Cesium.defaultValue(opts.heightLabel, true);
    this.offsetLabel = Cesium.defaultValue(opts.offsetLabel, false);

    this._last_depthTestAgainstTerrain = this.viewer.scene.globe.depthTestAgainstTerrain;
    this._hasFX = false;
  }
  //========== 对外属性 ==========
  get type() {
    return "volume";
  }

  //面内的最高地表高度
  get polygonMaxHeight() {
    if (this.interPolygonObj) return this.interPolygonObj.maxHeight;
    else return this.maxHeight;
  }

  //高度
  get height() {
    return this._jzmHeight;
  }
  set height(val) {
    this._jzmHeight = val;
    if (val > this.maxHeight) this.maxHeight = val;
    if (val < this.minHeight) this.minHeight = val;

    if (!this._hasFX) return;

    var newFillV = updateVolume(this.interPolygonObj, this.height);
    this.totalLable.attribute.value = newFillV;
    this.totalLable.showText();

    if (this.arrLables) {
      for (var i = 0; i < this.arrLables.length; i++) {
        this.arrLables[i].showText();
      }
    }
    this.target.fire(eventType.change, {
      mtype: this.type,
      ...newFillV
    });
  }
  get minHeight() {
    return this._minHeight;
  }
  set minHeight(val) {
    this._minHeight = val;

    if (!this._hasFX) return;

    if (this.interPolygonObj) {
      this.interPolygonObj.minHeight = val;
      this.interPolygonObj = updateVolumeByMinHeight(this.interPolygonObj);
    }
    var newFillV = updateVolume(this.interPolygonObj, this.height);
    this.totalLable.attribute.value = newFillV;
    this.totalLable.showText();

    this.target.fire(eventType.change, {
      mtype: this.type,
      ...newFillV
    });
  }
  get maxHeight() {
    return this._maxHeight;
  }
  set maxHeight(val) {
    this._maxHeight = val;
  }

  //开始绘制
  _startDraw(options) {
    this.clear();
    options.style = this.polygonStyle || options.style;
    return super._startDraw(options);
  }
  //绘制完成后
  showDrawEnd(entity) {
    if (entity.polygon == null) return;

    this.totalLable.label.text = "正在计算体积…";

    var positions = this.drawControl.getPositions(entity);
    setTimeout(() => {
      this.calcVolume(positions, () => {
        this.drawControl.deleteEntity(entity);
      });
    }, 500);
  }
  //外部使用，直接传positons方式
  start(positions, options) {
    this.options = options;
    this.calcVolume(positions);
  }
  //计算贴地面
  calcVolume(positions, callback) {
    this.target.fire(eventType.start, {
      mtype: this.type,
      positions: positions
    });

    this._hasFX = true;

    //计算体积
    var result = interPolygon({
      positions: positions,
      scene: this.viewer.scene,
      asyn: true,
      ...this.options,
      callback: interPolygonObj => {
        if (callback) callback();

        if (!this._hasFX) return;
        this.showVolume(positions, interPolygonObj);
      }
    });

    if (result._has3dtiles) {
      this.viewer.scene.globe.depthTestAgainstTerrain = false;
    } else {
      this.viewer.scene.globe.depthTestAgainstTerrain = true;
    }
  }
  showVolume(positions, interPolygonObj) {
    this.interPolygonObj = updateVolumeByMinHeight(interPolygonObj);
    this._maxHeight = this.interPolygonObj.maxHeight;
    this._minHeight = this.interPolygonObj.minHeight;
    this._jzmHeight = this.interPolygonObj.minHeight;

    var fillV = updateVolume(this.interPolygonObj, this.height);

    // 显示基准面
    var entityattr = polygonStyle2Entity(this.polygonJzmStyle, {
      hierarchy: new Cesium.PolygonHierarchy(positions),
      height: new Cesium.CallbackProperty((time, result) => {
        return this.height;
      }, false)
    });
    delete entityattr.perPositionHeight;
    this.dataSource.entities.add({
      polygon: entityattr
    });

    // 显示立体边界
    delete this.polygonStyle.clampToGround;
    var entityattr3 = polygonStyle2Entity(this.polygonStyle, {
      hierarchy: new Cesium.PolygonHierarchy(positions),
      height: new Cesium.CallbackProperty((time, result) => {
        return this.minHeight;
      }, false),
      extrudedHeight: new Cesium.CallbackProperty((time, result) => {
        return this.maxHeight;
      }, false),
      closeTop: false,
      closeBottom: true
    });
    this.dataSource.entities.add({
      polygon: entityattr3
    });

    //显示各点的贴地高度文本
    if (this.heightLabel) this.showPointHeightLabel(positions, this.interPolygonObj.minHeight);

    //显示计算结果文本
    if (!this.totalLable) {
      var entityattr2 = labelStyle2Entity(this.labelStyle, {
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        show: false
      });
      this.totalLable = this.dataSource.entities.add({
        label: entityattr2,
        _noMousePosition: true,
        attribute: {}
      });
    }
    this.totalLable.attribute.value = fillV;
    this.totalLable.showText = function(unit) {
      var fillV = this.attribute.value;
      var fillText = "";
      if (fillV.fillVolume > 0) {
        fillText += "填方体积：" + formatNum(fillV.fillVolume) + "立方米\n";
      }
      if (fillV.digVolume > 0) {
        fillText += "挖方体积：" + formatNum(fillV.digVolume) + "立方米\n";
      }
      fillText += "横切面积：" + formatArea(fillV.totalArea);

      this.label.text = fillText;
      return fillText;
    };
    this.totalLable.showText();
    this.totalLable.position = centerOfMass(positions, this.interPolygonObj.maxHeight); //求中心点

    fillV.mtype = this.type;
    this.target.fire(eventType.change, fillV);
    this.target.fire(eventType.end, fillV);
  }

  //显示各点的贴地高度文本
  showPointHeightLabel(positions, minHeight) {
    var that = this;

    var arrLable = [];
    for (var i = 0; i < positions.length; i++) {
      var height = Math.max(getSurfaceHeight(this.viewer.scene, positions[i]), minHeight);

      var cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
      var position = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        height
      );

      //各点的文本
      var entityattr = labelStyle2Entity(this.labelHeightStyle, {
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      });
      var label = this.dataSource.entities.add({
        position: position,
        label: entityattr,
        attribute: { value: height }
      });
      // label.attribute.value = height;
      label.showText = function(unit) {
        var height = this.attribute.value;
        var text = "海拔：" + height.toFixed(2) + "米";

        if (that.offsetLabel) {
          var offset = height - that.height;
          if (offset > 0) text += "\n高度：" + offset.toFixed(2) + "米(面上)";
          else text += "\n高度：" + Math.abs(offset).toFixed(2) + "米(面下)";
        }

        this.label.text = text;
        return text;
      };
      label.showText();
      arrLable.push(label);
    }
    this.arrLables = arrLable;
  }

  selecteHeight(callback) {
    //拾取高度
    var that = this;
    this.drawControl.startDraw({
      type: "point",
      style: {
        color: "#00fff2"
      },
      success: function(entity) {
        if (!entity.point) return;

        var pos = entity._position._value;
        var height = Cesium.Cartographic.fromCartesian(pos).height;
        that.height = height;

        that.drawControl.deleteEntity(entity);

        if (callback) callback(height);
      }
    });
  }

  clear() {
    delete this.interPolygonObj;
    delete this._maxHeight;
    delete this._minHeight;
    delete this._jzmHeight;

    delete this.totalLable;
    delete this.arrLables;

    super.clear();
    this._hasFX = false;
  }
}

//格式化数值
function formatNum(num) {
  if (num > 10000) {
    return (num / 10000).toFixed(2) + "万";
  }
  return num.toFixed(2);
}
