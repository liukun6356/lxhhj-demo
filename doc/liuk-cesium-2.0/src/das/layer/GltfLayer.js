import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { BaseLayer } from "./base/BaseLayer";
import { style2Entity as modelStyle2Entity } from "../draw/attr/Attr.Model";
import { isString, getPopupForConfig } from "../util/util";

export class GltfLayer extends BaseLayer {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(viewer, options);

    this.hasOpacity = true;
  }

  get layer() {
    return this.entity;
  }
  get model() {
    return this.entity;
  }
  //添加
  add() {
    if (this.entity) {
      this.viewer.entities.add(this.entity);
    } else {
      this.initData();
    }
    super.add();
  }
  //移除
  remove() {
    this.viewer.entities.remove(this.entity);
    super.remove();
  }
  //定位至数据区域
  centerAt(duration) {
    if (this.entity == null) return;

    if (this.options.extent || this.options.center) {
      this.viewer.das.centerAt(this.options.extent || this.options.center, {
        duration: duration,
        isWgs84: true
      });
    } else {
      var cfg = this.options.position;
      this.viewer.das.centerPoint(cfg, { duration: duration, isWgs84: true });
    }
  }

  initData() {
    //位置信息
    var cfg = this.options.position;
    cfg = this.viewer.das.point2map(cfg); //转换坐标系
    var position = Cesium.Cartesian3.fromDegrees(cfg.x, cfg.y, cfg.z || 0);

    //样式信息
    var style = this.options.style || {};
    if (Cesium.defined(this._opacity) && this._opacity != 1) style.opacity = this._opacity;

    //方向
    var heading = Cesium.Math.toRadians(style.heading || cfg.heading || 0);
    var pitch = Cesium.Math.toRadians(style.pitch || cfg.pitch || 0);
    var roll = Cesium.Math.toRadians(style.roll || cfg.roll || 0);
    var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    var converter = this.options.converter || Cesium.Transforms.eastNorthUpToFixedFrame;
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      hpr,
      this.viewer.scene.globe.ellipsoid,
      converter
    );

    var modelattr = modelStyle2Entity(style);
    modelattr.uri = this.options.url;

    this.entity = this.viewer.entities.add(
      new Cesium.Entity({
        name: this.options.name,
        position: position,
        orientation: orientation,
        model: modelattr
      })
    );
    //das3d扩展的属性
    this.entity._config = this.options;
    this.entity.eventTarget = this;

    //readyPromise为修改cesium内部源码来实现的回调
    this.entity.readyPromise = (entity, model) => {
      this.fireMap(eventType.load, { entity: entity, model: model });
    };

    var config = this.options;
    if (this.options.popup) {
      this.entity.popup = {
        html: function(entity) {
          var attr = entity.properties || entity.data || {};

          if (isString(attr)) return attr;
          else return getPopupForConfig(config, attr);
        },
        anchor: config.popupAnchor || [0, -15]
      };
    }
    if (this.options.tooltip) {
      this.entity.tooltip = {
        html: function(entity) {
          var attr = entity.properties || entity.data || {};

          if (isString(attr)) return attr;
          else return getPopupForConfig({ popup: config.tooltip }, attr);
        },
        anchor: config.tooltipAnchor || [0, -15]
      };
    }

    if (this.options.flyTo) this.centerAtByFlyEnd();

    this.fireMap(eventType.loadBefore, { entity: this.entity });
  }
  //设置透明度
  setOpacity(value) {
    if (this.entity == null) return;
    this.entity.model.color = Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(value);
  }
}

//[静态属性]本类中支持的事件类型常量
GltfLayer.event = {
  load: eventType.load,
  loadBefore: eventType.loadBefore,
  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};
