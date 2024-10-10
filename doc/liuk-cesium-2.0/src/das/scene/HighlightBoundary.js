import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
//高亮边界
export class HighlightBoundary extends DasClass {
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    this._viewer = Cesium.defaultValue(options.viewer, viewer);
    this.feature = options.feature;
    this.bufCount = Cesium.defaultValue(options.bufCount, 50);
    this.bufDis = Cesium.defaultValue(options.bufDis, 20);
    this.color = Cesium.Color.fromCssColorString(Cesium.defaultValue(options.color, '#ffffff'));
    this.dataSource = [];
    var multipleRingBuffer = this.multipleRingBuffer(this.feature, this.bufCount, this.bufDis);
    this.addRegionData(multipleRingBuffer, this.bufCount);
  }
  multipleRingBuffer(feature, bufCount, bufDis) {
    for (var featureList = [feature], o = 1; o <= bufCount; o++) {
      var turfBuffer = turf.buffer(feature, o * bufDis, {
        units: "meters"
      });
      (turfBuffer.properties.opacity = (bufCount - o) / bufCount), featureList.push(turfBuffer);
    }
    for (var featureLength = featureList.length - 1; featureLength > 0; featureLength--) {
      var featureItem = featureList[featureLength];
      (featureList[featureLength] = turf.difference(featureItem, featureList[featureLength - 1])),
        (featureList[featureLength].properties.opt = featureItem.properties.opacity);
    }
    return (
      (featureList = featureList.slice(-(featureList.length - 1))),
      turf.featureCollection([].concat(featureList))
    );
  }
  addRegionData(multipleRingBuffer, bufCount) {
    var that = this;
    var alpha = 0;
    Cesium.GeoJsonDataSource.load(multipleRingBuffer)
      .then(function(e) {
        that._viewer.dataSources.add(e);
        for (var entitiesValues = e.entities.values, r = 0; r < entitiesValues.length; r++) {
          var entitiesValue = entitiesValues[r];
          entitiesValue.polygon.outline = false;
          alpha = ((bufCount - r) / bufCount) * 0.8;
          entitiesValue.polygon.material = that.color.withAlpha(alpha);
          entitiesValue.alpha = alpha;
        }
        that.dataSource = e;
      })
      .otherwise(function(e) {});
  }
  changeBufCount(count){
    this.remove();
    this.bufCount=count;
    var multipleRingBuffer = this.multipleRingBuffer(this.feature, this.bufCount, this.bufDis);
    this.addRegionData(multipleRingBuffer, this.bufCount);
  }
  changeBufDis(dis){
    this.remove();
    this.bufDis=dis;
    var multipleRingBuffer = this.multipleRingBuffer(this.feature, this.bufCount, this.bufDis);
    this.addRegionData(multipleRingBuffer, this.bufCount);
  }
  changeColor(color) {
    this.color=Cesium.Color.fromCssColorString(color);
    for (var t = this.dataSource.entities.values, i = 0; i < t.length; i++) {
      var n = t[i];
      n.polygon.material = this.color.withAlpha(n.alpha);
    }
  }
  remove() {
    this._viewer.dataSources.remove(this.dataSource);
  }
}
