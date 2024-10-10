import * as Cesium from "cesium";
import * as pointconvert from "../util/pointconvert";
import { msg } from "../util/util";
import * as token from "../util/token";

//高德POI查询 类
export class GaodePOIGeocoder {
  //========== 构造方法 ==========
  constructor(options) {
    options = options || {};
    this.citycode = options.citycode || "";
    //内置高德地图服务key，建议后期传入自己申请的
    this.gaodekey = options.key || token.gaodeArr;
  }

  //========== 对外属性 ==========
  // //裁剪距离
  // get distance() {
  //     return this._distance || 0;
  // }
  // set distance(val) {
  //     this._distance = val;
  // }

  //========== 方法 ==========

  getOneKey() {
    var arr = this.gaodekey;
    var n = Math.floor(Math.random() * arr.length + 1) - 1;
    return arr[n];
  }

  geocode(query, geocodeType) {
    var that = this;

    var key = this.getOneKey();

    var resource = new Cesium.Resource({
      url: "https://restapi.amap.com/v3/place/text",
      queryParameters: {
        key: key,
        city: this.citycode,
        //citylimit: true,
        keywords: query
      }
    });

    return resource.fetchJson().then(function(results) {
      if (results.status == 0) {
        msg("请求失败(" + results.infocode + ")：" + results.info);
        return;
      }
      if (results.pois.length === 0) {
        msg("未查询到“" + query + "”相关数据！");
        return;
      }

      var height = 3000;
      if (that.viewer.camera.positionCartographic.height < height)
        height = that.viewer.camera.positionCartographic.height;

      return results.pois.map(function(resultObject) {
        var arrjwd = resultObject.location.split(",");
        arrjwd = pointconvert.gcj2wgs(arrjwd); //纠偏
        var lnglat = that.viewer.das.point2map({ x: arrjwd[0], y: arrjwd[1] });

        return {
          displayName: resultObject.name,
          destination: Cesium.Cartesian3.fromDegrees(lnglat.x, lnglat.y, height)
        };
      });
    });
  }
}
