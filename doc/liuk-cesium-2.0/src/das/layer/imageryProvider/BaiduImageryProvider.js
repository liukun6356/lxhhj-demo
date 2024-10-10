//百度地图
import * as Cesium from "cesium";

function BaiduImageryProvider(option) {
  var url = option.url;
  if (Cesium.defined(option.layer)) {
    switch (option.layer) {
      case "vec":
        url =
          "http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=" +
          (option.bigfont ? "ph" : "pl") +
          "&scaler=1&p=1";
        break;
      case "img_d":
        url = "http://shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46";
        break;
      case "img_z":
        url =
          "http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=" +
          (option.bigfont ? "sh" : "sl") +
          "&v=020";
        break;

      case "custom": //Custom 各种自定义样式
        //可选值：dark,midnight,grayscale,hardedge,light,redalert,googlelite,grassgreen,pink,darkgreen,bluish
        option.customid = option.customid || "midnight";
        url =
          "http://api{s}.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&scale=1&customid=" +
          option.customid;
        break;

      case "time": //实时路况
        var time = new Date().getTime();
        url =
          "http://its.map.baidu.com:8002/traffic/TrafficTileService?x={x}&y={y}&level={z}&time=" +
          time +
          "&label=web2D&v=017";
        break;
    }
  }
  this._url = url;

  this._tileWidth = 256;
  this._tileHeight = 256;
  this._maximumLevel = 18;

  this._tilingScheme = new Cesium.WebMercatorTilingScheme({
    rectangleSouthwestInMeters: new Cesium.Cartesian2(-33554054, -33746824),
    rectangleNortheastInMeters: new Cesium.Cartesian2(33554054, 33746824)
  });

  this._credit = undefined;
  this._rectangle = this._tilingScheme.rectangle;
  this._ready = true;
}
Object.defineProperties(BaiduImageryProvider.prototype, {
  url: {
    get: function() {
      return this._url;
    }
  },

  token: {
    get: function() {
      return this._token;
    }
  },

  proxy: {
    get: function() {
      return this._proxy;
    }
  },

  tileWidth: {
    get: function() {
      //>>includeStart('debug', pragmas.debug);
      if (!this._ready) {
        throw new Cesium.DeveloperError(
          "tileWidth must not be called before the imagery provider is ready."
        );
      }
      //>>includeEnd('debug');

      return this._tileWidth;
    }
  },

  tileHeight: {
    get: function() {
      //>>includeStart('debug', pragmas.debug);
      if (!this._ready) {
        throw new Cesium.DeveloperError(
          "tileHeight must not be called before the imagery provider is ready."
        );
      }
      //>>includeEnd('debug');

      return this._tileHeight;
    }
  },

  maximumLevel: {
    get: function() {
      //>>includeStart('debug', pragmas.debug);
      if (!this._ready) {
        throw new Cesium.DeveloperError(
          "maximumLevel must not be called before the imagery provider is ready."
        );
      }
      //>>includeEnd('debug');

      return this._maximumLevel;
    }
  },

  minimumLevel: {
    get: function() {
      //>>includeStart('debug', pragmas.debug);
      if (!this._ready) {
        throw new Cesium.DeveloperError(
          "minimumLevel must not be called before the imagery provider is ready."
        );
      }
      //>>includeEnd('debug');

      return 0;
    }
  },

  tilingScheme: {
    get: function() {
      //>>includeStart('debug', pragmas.debug);
      if (!this._ready) {
        throw new Cesium.DeveloperError(
          "tilingScheme must not be called before the imagery provider is ready."
        );
      }
      //>>includeEnd('debug');

      return this._tilingScheme;
    }
  },

  rectangle: {
    get: function() {
      //>>includeStart('debug', pragmas.debug);
      if (!this._ready) {
        throw new Cesium.DeveloperError(
          "rectangle must not be called before the imagery provider is ready."
        );
      }
      //>>includeEnd('debug');

      return this._rectangle;
    }
  },

  tileDiscardPolicy: {
    get: function() {
      //>>includeStart('debug', pragmas.debug);
      if (!this._ready) {
        throw new Cesium.DeveloperError(
          "tileDiscardPolicy must not be called before the imagery provider is ready."
        );
      }
      //>>includeEnd('debug');

      return this._tileDiscardPolicy;
    }
  },

  errorEvent: {
    get: function() {
      return this._errorEvent;
    }
  },

  ready: {
    get: function() {
      return this._ready;
    }
  },

  readyPromise: {
    get: function() {
      return this._readyPromise.promise;
    }
  },

  credit: {
    get: function() {
      return this._credit;
    }
  },

  usingPrecachedTiles: {
    get: function() {
      return this._useTiles;
    }
  },

  hasAlphaChannel: {
    get: function() {
      return true;
    }
  },

  layers: {
    get: function() {
      return this._layers;
    }
  }
});

BaiduImageryProvider.prototype.getTileCredits = function(x, y, level) {
  return undefined;
};

BaiduImageryProvider.prototype.requestImage = function(x, y, level) {
  if (!this._ready) {
    throw new Cesium.DeveloperError(
      "requestImage must not be called before the imagery provider is ready."
    );
  }

  var xTiles = this._tilingScheme.getNumberOfXTilesAtLevel(level);
  var yTiles = this._tilingScheme.getNumberOfYTilesAtLevel(level);

  var url = this._url
    .replace("{x}", x - xTiles / 2)
    .replace("{y}", yTiles / 2 - y - 1)
    .replace("{z}", level)
    .replace("{s}", "0");

  return Cesium.ImageryProvider.loadImage(this, url);
};

export { BaiduImageryProvider };
