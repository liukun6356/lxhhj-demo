import * as Cesium from "cesium";
import { GeoJsonLayer } from "./GeoJsonLayer";
import { getProxyUrl } from "../util/util";

export class CzmlLayer extends GeoJsonLayer {
  queryData() {
    var that = this;

    var config = getProxyUrl(this.options);

    var dataSource = Cesium.CzmlDataSource.load(config.url, config);
    dataSource
      .then(function(dataSource) {
        that.showResult(dataSource);
      })
      .otherwise(function(error) {
        that.showError("服务出错", error);
      });
  }
  getEntityAttr(entity) {
    if (entity.description && entity.description.getValue)
      return entity.description.getValue(this.viewer.clock.currentTime);
  }
}
