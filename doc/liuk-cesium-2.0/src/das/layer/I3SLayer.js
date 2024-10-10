/**
 * I3SLayer
 */

import * as Cesium from "cesium";
import { BaseLayer } from "./base/BaseLayer";

export class I3SLayer extends BaseLayer {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(viewer, options);

    this.hasOpacity = true;
    this.hasZIndex = true;
  }

  get layer() {
    return this.dataSource;
  }

  //添加
  add() {
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
    if (this.dataSource) {
      this.viewer.scene.primitives.remove(this.dataSource._sceneServer._layerCollection[0].tileset);
      delete this.dataSource;
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

  queryData() {
    var dataSource = new Cesium.I3SDataSource("I3SLayer", viewer.scene, {
      autoCenterCameraOnStart : true, // auto center to the location of the i3s
      geoidTiledTerrainProvider : this.options.geoidTiledTerrainProvider,  // pass the geoid service
    });

    dataSource.camera = this.viewer.camera; // for debug

    dataSource
        .loadUrl(this.options.url)
        .then(function () {
        });

    this.dataSource = dataSource;
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
}
