//腾讯地图
import * as Cesium from "cesium";

export class TencentImageryProvider extends Cesium.UrlTemplateImageryProvider {
  constructor(options = {}) {
    var url = options.url;
    if (Cesium.defined(options.layer)) {
      switch (options.layer) {
        case "vec":
          url = "https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={reverseY}&styleid=1&scene=0";
          break;
        case "img_d":
          url = "https://p{s}.map.gtimg.com/sateTiles/{z}/{sx}/{sy}/{x}_{reverseY}.jpg?version=400";
          options["customTags"] = {
            sx: (imageryProvider, x, y, level) => {
              return x >> 4;
            },
            sy: (imageryProvider, x, y, level) => {
              return ((1 << level) - y) >> 4;
            }
          };
          break;
        case "img_z":
          url = "https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={reverseY}&styleid=2&scene=0";
          break;
        case "custom": //Custom 各种自定义样式
          //可选值：灰白地图:3,暗色地图:4
          options.customid = options.customid || "4";
          url =
            "https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={reverseY}&styleid=" +
            options.customid +
            "&scene=0";
          break;
      }
    }
    options.url = url;
    options.subdomains = Cesium.defaultValue(options.subdomains, ["0", "1", "2"]);

    super(options);
  }
}
