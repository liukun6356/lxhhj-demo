import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { getProxyUrl, getAttrVal, clone } from "../util/util";
import * as daslog from "../util/log";
import { getRectangle, setPositionsHeight } from "../util/point";
import { BaseLayer } from "./base/BaseLayer";
import { zepto } from "../util/zepto";
import { getPositions as getPolygonPositions } from "../draw/attr/Attr.Polygon";
import { createWaterPrimitive } from "../feature/water";

export class WaterLayer extends BaseLayer {
  get layer() {
    return this.primitives;
  }
  create() {}
  //添加
  add() {
    this.primitives = new Cesium.PrimitiveCollection();
    this.viewer.scene.primitives.add(this.primitives);

    if (this.arrData) {
      this.createWater();
    } else {
      this.queryData();
    }
    super.add();
  }
  //移除
  remove() {
    this.viewer.scene.primitives.remove(this.primitives);
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
      if (this.rectangle) this.viewer.das.centerAt(this.rectangle, { duration: duration });
    }
  }
  clearData() {
    if (this.primitives) this.primitives.removeAll();
    this.arrData = null;
  }
  setData(geojson) {
    //兼容不同命名
    this.clearData();
    return this.queryData(geojson);
  }
  queryData(geojson) {
    var that = this;

    var config = getProxyUrl(this.options);
    geojson = geojson || config.url || config.data;
    if (!geojson) return; //没有需要加载的对象

    if (config.url) {
      zepto.ajax({
        type: "get",
        dataType: "json",
        url: config.url,
        timeout: Cesium.defaultValue(config.timeout, 0), //永不超时
        success: function(geojson) {
          var dataSource = Cesium.GeoJsonDataSource.load(geojson);
          dataSource
            .then(function(dataSource) {
              var entities = dataSource.entities.values;
              that.showResult(entities);
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
      var dataSource = Cesium.GeoJsonDataSource.load(geojson, config);
      dataSource
        .then(function(dataSource) {
          var entities = dataSource.entities.values;
          that.showResult(entities);
        })
        .otherwise(function(error) {
          that.showError("服务出错", error);
        });
    }
  }
  showResult(entities) {
    var positionsALL = [];
    var arrData = [];

    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];

      var positions = getPolygonPositions(entity);
      positionsALL = positionsALL.concat(positions);

      positions = setPositionsHeight(positions, 0);

      var watercfg = this.getWaterCfg(entity);
      var height = Cesium.defaultValue(watercfg.height, 0);

      arrData.push({
        positions: positions,
        height: height,
        config: watercfg
      });
    }

    this.rectangle = getRectangle(positionsALL, true);

    this.arrData = arrData;
    this.createWater();

    this.fireMap(eventType.load, {
      primitives: this.primitives,
      data: arrData
    });
  }
  createWater() {
    if (!this._visible) return;

    for (var i = 0; i < this.arrData.length; i++) {
      var item = this.arrData[i];

      // 水效果
      var polygon = new Cesium.PolygonGeometry({
        height: item.height, //水面高度
        extrudedHeight: item.height, //底部高
        polygonHierarchy: new Cesium.PolygonHierarchy(item.positions)
      });
      var primitive = createWaterPrimitive(polygon, item.config);
      primitive.height_bak = item.height;
      this.primitives.add(primitive);
    }

    if (this.options.flyTo) this.centerAtByFlyEnd();
  }
  getWaterCfg(entity) {
    var attr = getAttrVal(entity.properties);

    var symbol = this.options.symbol;
    var styleOpt = symbol.styleOptions;

    if (symbol.styleField) {
      //存在多个symbol，按styleField进行分类
      let styleFieldVal = attr[symbol.styleField];
      let styleOptField = symbol.styleFieldOptions[styleFieldVal];
      if (styleOptField != null) {
        styleOpt = clone(styleOpt);
        styleOpt = { ...styleOpt, ...styleOptField };
      }
    }

    if (typeof symbol.callback === "function") {
      //只是动态返回symbol的自定义的回调方法，返回style
      let styleOptField = symbol.callback(attr, entity, symbol);
      if (styleOptField != null) {
        styleOpt = clone(styleOpt);
        styleOpt = { ...styleOpt, ...styleOptField };
      }
    }
    styleOpt = styleOpt || {};

    return styleOpt;
  }

  //更新 闸门内 水域
  updateHeight(height) {
    var eRadis = 6378137;
    for (var i = 0; i < this.primitives.length; i++) {
      var primitive = this.primitives.get(i);

      var n = (eRadis + height) / (eRadis + primitive.height_bak);
      var modelMatrix = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(n, n, n));
      primitive.modelMatrix = modelMatrix;
    }
  }
}
