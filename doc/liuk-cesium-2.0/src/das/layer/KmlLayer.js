import * as Cesium from "cesium";
import { GeoJsonLayer } from "./GeoJsonLayer";
import { getProxyUrl, getAttrVal } from "../util/util";

export class KmlLayer extends GeoJsonLayer {
  queryData() {
    var that = this;

    var config = getProxyUrl(this.options);

    if (config.symbol && config.symbol.styleOptions) {
      var style = config.symbol.styleOptions;
      if (Cesium.defined(style.clampToGround)) {
        config.clampToGround = style.clampToGround;
      }
    }

    var dataSource = Cesium.KmlDataSource.load(config.url, {
      camera: this.viewer.scene.camera,
      canvas: this.viewer.scene.canvas,
      clampToGround: config.clampToGround
    });
    dataSource
      .then(function(dataSource) {
        that.showResult(dataSource);
      })
      .otherwise(function(error) {
        that.showError("服务出错", error);
      });
  }
  getEntityAttr(entity) {
    var attr = { name: entity.name, description: entity.description };
    var extendedData = entity._kml.extendedData;
    for (var key in extendedData) {
      attr[key] = extendedData[key].value;
    }
    attr = getAttrVal(attr);

    if (attr.description) {
      attr.description = attr.description.replace(/<div[^>]+>/g, ""); //剔除div html标签
    }

    return attr;
  }
}
