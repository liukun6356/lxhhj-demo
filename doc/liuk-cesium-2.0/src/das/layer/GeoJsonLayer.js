import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { getProxyUrl, getAttrVal, isArray } from "../util/util";
import { setPositionsHeight } from "../util/point";
import { config2Entity, createDthEntity } from "../core/config2Entity";
import { BaseLayer } from "./base/BaseLayer";
import { zepto } from "../util/zepto";
import * as daslog from "../util/log";

export class GeoJsonLayer extends BaseLayer {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(viewer, options);

    this.hasOpacity = true;
    this.hasZIndex = true;
  }

  get layer() {
    return this.dataSource;
  }
  create() {
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
  }
  //添加
  add() {
    if (this.labelCollection && !this.viewer.scene.primitives.contains(this.labelCollection)) {
      this.viewer.scene.primitives.add(this.labelCollection);
    }

    if (!this.options.reload && this.dataSource) {
      //this.options.reload可以外部控制每次都重新请求数据
      this.viewer.dataSources.add(this.dataSource);
    } else {
      this.queryData();
    }
    super.add();
  }
  //移除
  remove() {
    //是建筑物单体化时
    if (this.dthEvent) {
      this.dthEvent.mouseout();
    }
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource);
      delete this.dataSource;
    }
    if (this.labelCollection && this.viewer.scene.primitives.contains(this.labelCollection)) {
      this.viewer.scene.primitives.destroyPrimitives = false;
      this.viewer.scene.primitives.remove(this.labelCollection);
    }
    super.remove();
  }
  //定位至数据区域
  centerAt(duration) {
    if (this.options.extent || this.options.center) {
      this.viewer.das.centerAt(this.options.extent || this.options.center, {
        duration: duration,
        isWgs84: true
      });
    } else {
      if (this.dataSource == null) return;
      this.viewer.das.flyTo(this.dataSource.entities.values, { duration: duration });
    }
  }
  clearData() {
    if (this.dataSource) this.dataSource.entities.removeAll();

    if (this.labelCollection) this.labelCollection.removeAll();

    this.options.data = null;
  }
  setData(geojson) {
    //兼容不同命名
    this.clearData();
    return this.queryData(geojson);
  }
  //是否贴地
  hasClampToGround() {
    if (this.options.clampToGround) return true;
    if (
      this.options.symbol &&
      this.options.symbol.styleOptions &&
      this.options.symbol.styleOptions.clampToGround
    )
      return true;
    return false;
  }
  getLoadConfig() {
    var config = getProxyUrl(this.options);
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
          style.outlineColor || style.color || "#FFFFFF"
        ).withAlpha(
          Cesium.defaultValue(style.outlineOpacity, Cesium.defaultValue(style.opacity, 1.0))
        );
        config.stroke = outlineColor;
      }
      if (Cesium.defined(style.outlineWidth)) {
        config.strokeWidth = style.outlineWidth;
      }
    }
    return config;
  }
  queryData(geojson) {
    var that = this;

    var config = this.getLoadConfig();
    geojson = geojson || config.url || config.data;
    if (!geojson) return; //没有需要加载的对象

    if (config.url) {
      zepto.ajax({
        type: "get",
        dataType: "json",
        url: config.url,
        timeout: Cesium.defaultValue(config.timeout, 0), //永不超时
        success: function(geojson) {
          var dataSource = Cesium.GeoJsonDataSource.load(geojson, config);
          dataSource
            .then(function(dataSource) {
              that.showResult(dataSource);
            })
            .otherwise(function(error) {
              that.showError("服务出错", error);
            });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          daslog.warn("json文件加载失败！", config);
        }
      });
    } else {
      this.options.data = geojson;
      var dataSource = Cesium.GeoJsonDataSource.load(geojson, config);
      dataSource
        .then(function(dataSource) {
          that.showResult(dataSource);
        })
        .otherwise(function(error) {
          that.showError("服务出错", error);
        });
    }
  }
  showResult(dataSource) {
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource);
      delete this.dataSource;
    }
    if (this.labelCollection) {
      this.labelCollection.removeAll();
    }

    if (!this._visible) return;

    this.dataSource = dataSource;
    this.dataSource.order = this.options.order;
    this.viewer.dataSources.add(dataSource);

    if (this.hasZIndex) this.setZIndex(this.options.order);

    if (this.options.flyTo) this.centerAtByFlyEnd();

    //根据config配置，更新entitys
    this.options.getAttrVal = entity => {
      return this.getEntityAttr(entity);
    };
    this.options.eventTarget = this;

    var entities = dataSource.entities.values;
    config2Entity(entities, this.options, (position, labelattr, attr) => {
      return this.lblAddFun(position, labelattr, attr);
    });

    if (this._opacity != 1) this.setOpacity(this._opacity);

    this.fireMap(eventType.load, {
      dataSource: dataSource,
      entities: entities
    });
  }

  updateStyle(symbol) {
    if (!this.dataSource) return;

    if (symbol) {
      this.options.symbol = {
        ...this.options.symbol,
        ...symbol
      };
    }

    var entities = this.dataSource.entities.values;
    config2Entity(entities, this.options, (position, labelattr, attr) => {
      return this.lblAddFun(position, labelattr, attr);
    });
  }

  lblAddFun(position, labelattr, attr) {
    if (labelattr.text == "") return null;

    if (Cesium.defined(labelattr.height)) {
      position = setPositionsHeight(position, labelattr.height);
    }

    //entity方式
    var lblEx = this.dataSource.entities.add({
      position: position,
      label: labelattr,
      properties: attr
    });

    //LabelCollection方式
    // if (!this.labelCollection) {
    //     this.labelCollection = new Cesium.LabelCollection({ scene: this.viewer.scene });
    //     this.viewer.scene.primitives.add(this.labelCollection);
    // }
    // labelattr.position = position;
    // var lblEx = this.labelCollection.add(labelattr);
    // lblEx.properties = attr;

    return lblEx;
  }
  //刷新事件
  refreshEvent() {
    if (this.dataSource == null) return false;

    var entities = this.dataSource.entities.values;
    for (var i = 0, len = entities.length; i < len; i++) {
      var entity = entities[i];

      entity.eventTarget = this;
      entity.contextmenuItems = this.options.contextmenuItems;
    }
    return true;
  }
  //设置透明度
  setOpacity(value) {
    this._opacity = value;
    if (this.dataSource == null) return;

    var entities = this.dataSource.entities.values;

    for (var i = 0, len = entities.length; i < len; i++) {
      var entity = entities[i];

      if (entity.polygon && entity.polygon.material && entity.polygon.material.color) {
        this._updatEntityAlpha(entity.polygon.material.color, this._opacity);
        if (entity.polygon.outlineColor) {
          this._updatEntityAlpha(entity.polygon.outlineColor, this._opacity);
        }
      }

      if (entity.polyline && entity.polyline.material && entity.polyline.material.color) {
        this._updatEntityAlpha(entity.polyline.material.color, this._opacity);
      }

      if (entity.billboard) {
        entity.billboard.color = Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(
          this._opacity
        );
      }

      if (entity.model) {
        entity.model.color = Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(this._opacity);
      }

      if (entity.label) {
        var _opacity = this._opacity;
        if (entity.styleOpt && entity.styleOpt.label && entity.styleOpt.label.opacity)
          _opacity = entity.styleOpt.label.opacity;

        if (entity.label.fillColor) this._updatEntityAlpha(entity.label.fillColor, _opacity);
        if (entity.label.outlineColor) this._updatEntityAlpha(entity.label.outlineColor, _opacity);
        if (entity.label.backgroundColor)
          this._updatEntityAlpha(entity.label.backgroundColor, _opacity);
      }
    }
  }
  _updatEntityAlpha(color, opacity) {
    if (!color) return;
    var newclr = color.getValue(this.viewer.clock.currentTime);
    if (!newclr || !newclr.withAlpha) return color;

    newclr = newclr.withAlpha(opacity);
    color.setValue(newclr);
  }

  //设置叠加顺序
  setZIndex(order) {
    if (this.dataSource == null || order == null) return;
    if (!this.viewer.dataSources.contains(this.dataSource)) return;

    //先移动到最顶层
    this.viewer.dataSources.raiseToTop(this.dataSource);

    var layers = this.viewer.dataSources;
    for (var i = layers.length - 1; i >= 0; i--) {
      var layer = layers.get(i);
      if (layer == this.dataSource) continue;
      if (Cesium.defined(layer.order) && order < layer.order) {
        this.viewer.dataSources.lower(this.dataSource); //下移一个位置
      }
    }
  }

  //获取属性
  getEntityAttr(entity) {
    return getAttrVal(entity.properties);
  }

  //外部自定义添加entity
  addEntity(entitys) {
    if (!this.dataSource) {
      this.dataSource = new Cesium.CustomDataSource();
      this.viewer.dataSources.add(this.dataSource);
    }

    if (!isArray(entitys)) entitys = [entitys];

    for (var i = 0, len = entitys.length; i < len; i++) {
      var entity = entitys[i];

      if (entity.entityCollection) entity.entityCollection.remove(entity); //从原有的集合中删除
      this.dataSource.entities.add(entity); //加入到当前图层集合图层中
    }

    config2Entity(entitys, this.options, (position, labelattr, attr) => {
      return this.lblAddFun(position, labelattr, attr);
    });
  }
  removeEntity(entity) {
    this.dataSource.entities.remove(entity); //加入到当前图层集合图层中
  }
  getEntitys() {
    if (this.dataSource) return this.dataSource.entities.values;
    else return null;
  }
}
