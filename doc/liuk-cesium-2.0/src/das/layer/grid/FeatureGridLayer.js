import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import { TileLayer } from "../tile/TileLayer";
import { createDthEntity } from "../../core/config2Entity";

export class FeatureGridLayer extends TileLayer {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(viewer, options);
    this.hasOpacity = false;
  }
  //========== 对外属性 ==========
  get layer() {
    return this.dataSource;
  }

  create() {
    this.dataSource = new Cesium.CustomDataSource(); //用于entity
    this._bindClustering(this.options.clustering);

    this.primitives = new Cesium.PrimitiveCollection(); //用于primitive

    this.options.id = Cesium.defaultValue(this.options.id, new Date().getTime());

    var that = this;
    this.options.type_new = "custom_featuregrid";
    this.options.addImageryCache = function(opts) {
      return that._addImageryCache(opts);
    };
    this.options.removeImageryCache = function(opts) {
      return that._removeImageryCache(opts);
    };
    this.options.removeAllImageryCache = function(opts) {
      return that._removeAllImageryCache(opts);
    };

    if (Cesium.defined(this.options.minimumLevel))
      this.options.minimumTerrainLevel = this.options.minimumLevel;
    if (Cesium.defined(this.options.maximumLevel))
      this.options.maximumTerrainLevel = this.options.maximumLevel;

    //是建筑物单体化时
    if (this.options.dth) {
      var dthEvent = createDthEntity(this.viewer, this.options.dth);

      if (this.options.dth.type == "click") {
        this.on(eventType.click, e => {
          dthEvent.mouseover(e.sourceTarget);
        });
        this.viewer.das.on(eventType.clickMap, e => {
          if (!this._visible) return;
          dthEvent.mouseout();
        });
      } else {
        this.on(eventType.mouseOver, e => {
          dthEvent.mouseover(e.sourceTarget);
        });
        this.on(eventType.mouseOut, e => {
          dthEvent.mouseout();
        });
      }
      this.dthEvent = dthEvent;
    }

    var config = this.options;
    if (config.symbol && config.symbol.styleOptions) {
      var style = config.symbol.styleOptions;
      if (Cesium.defined(style.clampToGround)) {
        config.clampToGround = style.clampToGround;
      }
      if (Cesium.defined(style.color)) {
        var color = Cesium.Color.fromCssColorString(
          Cesium.defaultValue(style.color, "#FFFF00")
        ).withAlpha(Number(Cesium.defaultValue(style.opacity, 0.5)));
        config.fill = color;
      }
      if (Cesium.defined(style.outlineColor)) {
        var outlineColor = Cesium.Color.fromCssColorString(
          style.outlineColor || "#FFFFFF"
        ).withAlpha(
          Cesium.defaultValue(style.outlineOpacity, Cesium.defaultValue(style.opacity, 1.0))
        );
        config.stroke = outlineColor;
      }
      if (Cesium.defined(style.outlineWidth)) {
        config.strokeWidth = style.outlineWidth;
      }
      this.options = config;
    }
  }
  getLength() {
    return this.primitives.length + this.dataSource.entities.values.length;
  }
  addEx() {
    this.viewer.dataSources.add(this.dataSource);
    this.viewer.scene.primitives.add(this.primitives);
  }
  removeEx() {
    //是建筑物单体化时
    if (this.dthEvent) {
      this.dthEvent.mouseout();
    }
    this.viewer.dataSources.remove(this.dataSource);
    this.viewer.scene.primitives.remove(this.primitives);
  }
  _addImageryCache(opts) {}
  _removeImageryCache(opts) {}
  _removeAllImageryCache() {}
  //聚合处理
  _bindClustering(options) {
    options = options || { enabled: false };

    this.dataSource.clustering.enabled = Cesium.defaultValue(options.enabled, false);
    this.dataSource.clustering.pixelRange = Cesium.defaultValue(options.pixelRange, 20); //多少像素矩形范围内聚合

    //一些属性
    var color = Cesium.Color.fromCssColorString(
      Cesium.defaultValue(options.color, "#00ff00")
    ).withAlpha(Cesium.defaultValue(options.opacity, 1.0));
    var size = Cesium.defaultValue(options.pixelSize, 48);
    var heightReference = Cesium.defaultValue(
      options.heightReference,
      Cesium.HeightReference.CLAMP_TO_GROUND
    );
    if (options.clampToGround) heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;

    var singleDigitPins = {};
    var pinBuilder = new Cesium.PinBuilder();
    this.dataSource.clustering.clusterEvent.addEventListener(function(clusteredEntities, cluster) {
      var count = clusteredEntities.length;

      cluster.label.show = false;
      cluster.billboard.show = true;
      cluster.billboard.id = cluster.label.id;
      cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
      cluster.billboard.heightReference = heightReference; //贴地

      if (!singleDigitPins[count]) {
        singleDigitPins[count] = pinBuilder.fromText(count, color, size).toDataURL();
      }
      cluster.billboard.image = singleDigitPins[count];
    });
  }
}
