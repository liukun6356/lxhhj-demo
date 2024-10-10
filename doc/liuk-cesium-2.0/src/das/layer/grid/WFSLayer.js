import * as Cesium from "cesium";
import { CustomFeatureGridLayer } from "./CustomFeatureGridLayer";
import { buffer } from "../../util/util";
import { zepto } from "../../util/zepto";
import * as daslog from "../../util/log";

export class WFSLayer extends CustomFeatureGridLayer {
  //获取网格内的数据，callback为回调方法，参数传数据数组
  getDataForGrid(opts, callback) {
    var that = this;

    //请求的wfs参数
    var parameters = {
      service: "WFS",
      request: "GetFeature",
      typeName: this.options.layer || this.options.typeName,
      version: "1.0.0",
      outputFormat: "application/json",
      bbox:
        opts.rectangle.xmin +
        "," +
        opts.rectangle.ymin +
        "," +
        opts.rectangle.xmax +
        "," +
        opts.rectangle.ymax
    };

    //其他可选参数
    if (Cesium.defined(this.options.parameters)) {
      for (var key in this.options.parameters) {
        parameters[key] = this.options.parameters[key];
      }
    }

    zepto.ajax({
      url: this.options.url,
      type: "get",
      data: parameters,
      success: function(featureCollection) {
        if (!that._visible || !that._cacheGrid[opts.key]) {
          return; //异步请求结束时,如果已经卸载了网格就直接跳出。
        }

        if (featureCollection == undefined || featureCollection == null) {
          return; //数据为空
        }

        if (featureCollection.type == "Feature")
          featureCollection = { type: "FeatureCollection", features: [featureCollection] };

        callback(featureCollection.features);
      },
      error: function(data) {
        daslog.warn("wfs请求出错", data);
      }
    });
  }
  //根据数据创造entity
  createEntity(opts, item, callback) {
    if (this.options.dth && this.options.dth.buffer > 0) {
      //是建筑物单体化时,缓冲扩大点范围
      item = buffer(item, this.options.dth.buffer);
    }

    var that = this;
    var dataSource = Cesium.GeoJsonDataSource.load(item, this.options);
    dataSource
      .then(function(dataSource) {
        if (that.checkHasBreak[opts.key]) {
          return; //异步请求结束时，如果已经卸载了网格就直接跳出。
        }

        if (dataSource.entities.values.length == 0) return null;
        var entity = dataSource.entities.values[0];
        entity.entityCollection.remove(entity); //从原有的集合中删除

        entity._id = that.options.id + "_" + opts.key + "_" + entity.id;

        that._addEntity(entity, callback);
      })
      .otherwise(function(error) {
        that.showError("服务出错", error);
      });

    return null;
  }
  //更新entity，并添加到地图上
  _addEntity(entity, callback) {
    // this.dataSource.entities.removeById(entity._id);
    // if (this.dataSource.entities.contains(entity))return
    if (this.dataSource.entities.getById(entity._id)) return;

    this.dataSource.entities.add(entity); //加入到当前图层集合图层中

    //根据config配置，更新entitys
    this.config2Entity(entity);

    callback(entity);
  }
}
