import * as Cesium from "cesium";
import { BaseLayer } from "./base/BaseLayer";

export class ShpLayer extends BaseLayer {
  constructor(viewer, options) {
    super(viewer, options);

    this.hasOpacity = true;
  }

  get layer() {
    return this.imageryLayer;
  }

  initData() {
    this.viewer = viewer;
    this.serverUrl = this.options.url;
    this.serverName = this.options.layer;
    this.style = Cesium.defaultValue(this.options.style, { //参考api文档的Cesium.VectorStyle类
      tileCacheSize: 200,
      fill: false,    //是否填充，仅面数据有效。
      outline: true,  //是否显示边，仅面数据有效。
      outlineColor: "rgb(255,255,0)",
      lineWidth: 2,
      showMaker: false,
      showCenterLabel: false,
    });
  }

  add() {
    if (this.imageryLayer != null) {
      this.remove();
    }

    this.initData();

    var serverUrl = this.serverUrl;
    var serverName = this.serverName;
    var that = this;
    Cesium.when.all([Cesium.Resource.fetchBlob(serverUrl + "/" + serverName + ".shp"), Cesium.Resource.fetchBlob(serverUrl + "/" + serverName + ".dbf"), Cesium.Resource.fetchBlob(serverUrl + "/" + serverName + ".prj"),],
        function (files) {
          files[0].name = serverName + ".shp";
          files[1].name = serverName + ".dbf";
          files[2].name = serverName + ".prj";

          var shpProvider = new Cesium.VectorTileImageryProvider({
            source: files,
            removeDuplicate: false,
            zIndex: 2,
            defaultStyle: that.style,
            maximumLevel: 20,
            minimumLevel: 1,
            simplify: false
          });
          shpProvider.readyPromise.then(function () {
            that.imageryLayer = that.viewer.imageryLayers.addImageryProvider(shpProvider);
            //透明度
            if (that.hasOpacity && that._opacity != 1) {
              that.setOpacity(that._opacity);
            }
          });
        });
  }

  //设置透明度
  setOpacity(value) {
    this._opacity = value;
    if (this.imageryLayer == null) return;

    this.imageryLayer.alpha = value;
  }

  /**
   *  移除
   */
  remove() {
    if (this.imageryLayer == null) return;
    this.viewer.imageryLayers.remove(this.imageryLayer, false);
    this.imageryLayer = null;

    super.remove();
  }
}
