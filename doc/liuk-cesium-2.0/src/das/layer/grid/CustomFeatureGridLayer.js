//分块加载矢量数据公共类
import * as Cesium from "cesium";
import { getAttrVal } from "../../util/util";
import { FeatureGridLayer } from "./FeatureGridLayer";
import { config2Entity } from "../../core/config2Entity";

export class CustomFeatureGridLayer extends FeatureGridLayer {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(viewer, options);

    this._cacheGrid = {}; //网格缓存,存放矢量对象id集合
    this._cacheFeature = {}; //矢量对象缓存,存放矢量对象和其所对应的网格集合
    this.hasOpacity = true;
  }

  //========== 方法==========
  _addImageryCache(opts) {
    this._cacheGrid[opts.key] = { opts: opts, isLoading: true };

    var that = this;

    this.getDataForGrid(opts, function(arrdata) {
      if (that._visible) that._showData(opts, arrdata);
    });
  }
  getDataForGrid(opts, callback) {
    //子类可继承, callback为回调方法,callback参数传数据数组

    //直接使用本类,传参方式
    if (this.options.getDataForGrid) {
      this.options.getDataForGrid(opts, callback);
    }
  }
  checkHasBreak(cacheKey) {
    if (!this._visible || !this._cacheGrid[cacheKey]) {
      return true;
    }
    return false;
  }
  _showData(opts, arrdata) {
    var cacheKey = opts.key;
    if (this.checkHasBreak[cacheKey]) {
      return; //异步请求结束时,如果已经卸载了网格就直接跳出。
    }

    var that = this;

    var arrIds = [];
    for (var i = 0, len = arrdata.length; i < len; i++) {
      var attributes = arrdata[i];
      var id = attributes[this.options.IdName || "id"];

      var layer = this._cacheFeature[id];
      if (layer) {
        //已存在
        layer.grid.push(cacheKey);
        this.updateEntity(layer.entity, attributes);
      } else {
        var entity = this.createEntity(opts, attributes, function(entity) {
          if (that.options.debuggerTileInfo) {
            //测试用
            entity._temp_id = id;
            entity.popup = function(entity) {
              return JSON.stringify(that._cacheFeature[entity._temp_id].grid);
            };
          }
          that._cacheFeature[id] = {
            grid: [cacheKey],
            entity: entity
          };
          if (that.options.onEachEntity)
            //添加到地图后回调方法
            that.options.onEachEntity(entity, that);
        });
        if (entity != null) {
          if (that.options.debuggerTileInfo) {
            //测试用
            entity._temp_id = id;
            entity.popup = function(entity) {
              return JSON.stringify(that._cacheFeature[entity._temp_id].grid);
            };
          }
          that._cacheFeature[id] = {
            grid: [cacheKey],
            entity: entity
          };
          if (that.options.onEachEntity)
            //添加到地图后回调方法
            that.options.onEachEntity(entity, that);
        }
      }
      arrIds.push(id);
    }

    this._cacheGrid[cacheKey] = this._cacheGrid[cacheKey] || {};
    this._cacheGrid[cacheKey].ids = arrIds;
    this._cacheGrid[cacheKey].isLoading = false;
  }

  createEntity(opts, attributes, callback) {
    //子类可以继承,根据数据创造entity

    //直接使用本类,传参方式
    if (this.options.createEntity) {
      return this.options.createEntity(opts, attributes, callback);
    }
    return null;
  }
  updateEntity(enetity, attributes) {
    //子类可以继承,更新entity（动态数据时有用）

    //直接使用本类,传参方式
    if (this.options.updateEntity) {
      this.options.updateEntity(enetity, attributes);
    }
  }
  removeEntity(enetity) {
    //子类可以继承,移除entity

    //直接使用本类,传参方式
    if (this.options.removeEntity) {
      this.options.removeEntity(enetity);
    } else {
      this.dataSource.entities.remove(enetity);
    }
  }
  _removeImageryCache(opts) {
    var cacheKey = opts.key;
    var layers = this._cacheGrid[cacheKey];
    if (layers) {
      if (layers.ids) {
        for (var i = 0; i < layers.ids.length; i++) {
          var id = layers.ids[i];
          var layer = this._cacheFeature[id];
          if (layer) {
            layer.grid.remove(cacheKey);
            if (layer.grid.length == 0) {
              delete this._cacheFeature[id];
              this.removeEntity(layer.entity);
            }
          }
        }
      }
      delete this._cacheGrid[cacheKey];
    }
  }
  _removeAllImageryCache() {
    if (this.options.removeAllEntity) {
      this.options.removeAllEntity();
    } else {
      this.dataSource.entities.removeAll();
      this.primitives.removeAll();
    }

    this._cacheFeature = {};
    this._cacheGrid = {};
  }
  //移除
  removeEx() {
    if (this.options.removeAllEntity) {
      this.options.removeAllEntity();
    } else {
      this.dataSource.entities.removeAll();
      // this.primitives.removeAll(); // 修改删除wfs数据bug
    }

    this._cacheFeature = {};
    this._cacheGrid = {};

    this.viewer.dataSources.remove(this.dataSource);
    // this.viewer.scene.primitives.remove(this.primitives);  // 修改删除wfs数据bug
  }
  //重新加载数据
  reload() {
    var that = this;
    for (var i in this._cacheGrid) {
      var item = this._cacheGrid[i];
      if (item == null || item.opts == null || item.isLoading) continue;

      var opts = item.opts;
      this.getDataForGrid(opts, function(arrdata) {
        that._showData(opts, arrdata);
      });
    }
  }

  //设置透明度
  setOpacity(value) {
    this._opacity = value;

    for (var i in this._cacheFeature) {
      var entity = this._cacheFeature[i].entity;

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

  //获取属性
  getEntityAttr(entity) {
    return getAttrVal(entity.properties);
  }
  //根据config配置，更新entitys
  config2Entity(entity) {
    return config2Entity([entity], this.options);
  }
}
