import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import { BaseLayer } from "../base/BaseLayer";
import { createImageryProvider } from "../../layer";

export class TileLayer extends BaseLayer {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(viewer, options);

    this.hasOpacity = true;
    this.hasZIndex = true;
  }
  get layer() {
    return this.imageryLayer;
  }

  //添加
  add() {
    if (this.imageryLayer != null) {
      this.remove();
    }

    this.addEx();
    var imageryProvider = this.createImageryProvider(this.options);
    if (!Cesium.defined(imageryProvider)) return;

    var options = this.options;

    var imageryOpt = {
      show: true,
      alpha: this._opacity
    };
    if (
      Cesium.defined(options.rectangle) &&
      Cesium.defined(options.rectangle.xmin) &&
      Cesium.defined(options.rectangle.xmax) &&
      Cesium.defined(options.rectangle.ymin) &&
      Cesium.defined(options.rectangle.ymax)
    ) {
      var xmin = options.rectangle.xmin;
      var xmax = options.rectangle.xmax;
      var ymin = options.rectangle.ymin;
      var ymax = options.rectangle.ymax;
      let rectangle = Cesium.Rectangle.fromDegrees(xmin, ymin, xmax, ymax);
      this.rectangle = rectangle;
      imageryOpt.rectangle = rectangle;
    }
    if (Cesium.defined(options.bbox) && options.bbox.length && options.bbox.length == 4) {
      let rectangle = Cesium.Rectangle.fromDegrees(
        options.bbox[0],
        options.bbox[1],
        options.bbox[2],
        options.bbox[3]
      ); //[xmin,ymin,xmax,ymax]
      this.rectangle = rectangle;
      imageryOpt.rectangle = rectangle;
    }

    if (Cesium.defined(options.brightness)) imageryOpt.brightness = options.brightness;
    if (Cesium.defined(options.contrast)) imageryOpt.contrast = options.contrast;
    if (Cesium.defined(options.hue)) imageryOpt.hue = options.hue;
    if (Cesium.defined(options.saturation)) imageryOpt.saturation = options.saturation;
    if (Cesium.defined(options.gamma)) imageryOpt.gamma = options.gamma;
    if (Cesium.defined(options.maximumAnisotropy))
      imageryOpt.maximumAnisotropy = options.maximumAnisotropy;
    if (Cesium.defined(options.minimumTerrainLevel))
      imageryOpt.minimumTerrainLevel = options.minimumTerrainLevel;
    if (Cesium.defined(options.maximumTerrainLevel))
      imageryOpt.maximumTerrainLevel = options.maximumTerrainLevel;

    this.imageryLayer = new Cesium.ImageryLayer(imageryProvider, imageryOpt);
    this.imageryLayer.eventTarget = this;
    this.imageryLayer.config = this.options;

    var that = this;
    this.imageryLayer.onLoadTileStart = function(imagery) {
      that.fireMap(eventType.loadTileStart, { imagery: imagery });
    };
    this.imageryLayer.onLoadTileEnd = function(imagery) {
      that.fireMap(eventType.loadTileEnd, { imagery: imagery });
    };
    this.imageryLayer.onLoadTileError = function(imagery) {
      that.fireMap(eventType.loadTileError, { imagery: imagery });
    };

    this.viewer.imageryLayers.add(this.imageryLayer);

    this.setZIndex(this.options.order);

    super.add();

    this.fireMap(eventType.load, {
      imageryLayer: this.imageryLayer
    });
  }
  //方便外部继承覆盖该方法
  createImageryProvider(config) {
    return createImageryProvider(config); //调用layer.js
  }
  addEx() {
    //子类使用
  }
  //移除
  remove() {
    if (this.imageryLayer == null) return;

    this.removeEx();
    this.viewer.imageryLayers.remove(this.imageryLayer, false);
    this.imageryLayer = null;
    super.remove();
  }
  removeEx() {
    //子类使用
  }
  //定位至数据区域
  centerAt(duration) {
    if (this.imageryLayer == null) return;

    if (this.options.extent || this.options.center) {
      this.viewer.das.centerAt(this.options.extent || this.options.center, {
        duration: duration,
        isWgs84: true
      });
    } else if (Cesium.defined(this.rectangle)) {
      this.viewer.camera.flyTo({
        destination: this.rectangle,
        duration: duration
      });
    } else {
      var rectangle = this.imageryLayer.imageryProvider.rectangle; //arcgis图层等，读取配置信息
      if (
        Cesium.defined(rectangle) &&
        rectangle != Cesium.Rectangle.MAX_VALUE &&
        rectangle.west > 0 &&
        rectangle.south > 0 &&
        rectangle.east > 0 &&
        rectangle.north > 0
      ) {
        this.viewer.camera.flyTo({
          destination: rectangle,
          duration: duration
        });
      }
    }
  }
  //设置透明度
  setOpacity(value) {
    this._opacity = value;
    if (this.imageryLayer == null) return;

    this.imageryLayer.alpha = value;
  }
  //设置叠加顺序
  setZIndex(order) {
    if (this.imageryLayer == null || order == null) return;

    //先移动到最顶层
    this.viewer.imageryLayers.raiseToTop(this.imageryLayer);

    var layers = this.viewer.imageryLayers._layers;
    for (var i = layers.length - 1; i >= 0; i--) {
      if (layers[i] == this.imageryLayer) continue;
      var _temp = layers[i].config;
      if (_temp && _temp.order) {
        if (order < _temp.order) {
          this.viewer.imageryLayers.lower(this.imageryLayer); //下移一个位置
        }
      }
    }
  }
}
//[静态属性]本类中支持的事件类型常量
TileLayer.event = {
  loadTileStart: eventType.loadTileStart,
  loadTileEnd: eventType.loadTileEnd,
  loadTileError: eventType.loadTileError,
  load: eventType.load,
  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};
