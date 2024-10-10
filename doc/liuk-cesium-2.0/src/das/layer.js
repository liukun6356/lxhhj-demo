import * as Cesium from "cesium";
import * as daslog from "./util/log";
import { getProxyUrl } from "./util/util";
import * as token from "./util/token";

import { BaseLayer } from "./layer/base/BaseLayer";
import { GroupLayer } from "./layer/base/GroupLayer";
import { TileLayer } from "./layer/tile/TileLayer";
import { SuperMapImgLayer } from "./layer/tile/SuperMapImgLayer";
import { GraticuleLayer } from "./layer/tile/GraticuleLayer";
import { CustomFeatureGridLayer } from "./layer/grid/CustomFeatureGridLayer";
import { POILayer } from "./layer/grid/POILayer";
import { WFSLayer } from "./layer/grid/WFSLayer";
import { GeoJsonLayer } from "./layer/GeoJsonLayer";
import { WaterLayer } from "./layer/WaterLayer";
import { GltfLayer } from "./layer/GltfLayer";
import { Tiles3dLayer } from "./layer/Tiles3dLayer";
import { KmlLayer } from "./layer/KmlLayer";
import { CzmlLayer } from "./layer/CzmlLayer";
import { TerrainLayer } from "./layer/TerrainLayer";
import { DrawLayer } from "./layer/DrawLayer";
import { ShpLayer } from "./layer/ShpLayer";
import { I3SLayer } from "./layer/I3SLayer";

import { BaiduImageryProvider } from "./layer/imageryProvider/BaiduImageryProvider";
import { TencentImageryProvider } from "./layer/imageryProvider/TencentImageryProvider";
import { FeatureGridImageryProvider } from "./layer/imageryProvider/FeatureGridImageryProvider";

//类库外部的类
var exLayer = {};
function regLayerForConfig(type, layerClass) {
  exLayer[type] = layerClass;
}

//创建图层
function createLayer(viewer, item, serverURL) {
  //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
  if (item instanceof Cesium.Viewer) {
    var temppar = item;
    item = viewer;
    viewer = temppar;
  }
  //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

  var layer;

  if (item.url) {
    if (serverURL) {
      item.url = item.url.replace("$serverURL$", serverURL);
    }
    item.url = item.url.replace("$hostname$", location.hostname).replace("$host$", location.host);
  }

  switch (item.type) {
    //===============地图数组====================
    case "group":
      //示例：{ "name": "电子地图", "type": "group","layers": [    ]}
      if (item.layers && item.layers.length > 0) {
        var arrVec = [];
        for (var index = 0; index < item.layers.length; index++) {
          var temp = createLayer(viewer, item.layers[index], serverURL);
          if (temp == null) continue;
          arrVec.push(temp);
        }
        var newItem = {};
        for (var key in item) {
          newItem[key] = item[key];
        }
        newItem._layers = arrVec;
        layer = new GroupLayer(viewer, newItem);
      }
      break;
    case "base":
      layer = new BaseLayer(viewer, item);
      break;
    case "www_ion": //cesium ion资源地图
    case "www_bing": //bing地图
    case "www_osm": //OSM开源地图
    case "www_google": //谷歌国内
    case "www_gaode": //高德
    case "www_baidu": //百度
    case "www_tencent": //腾讯
    case "www_tdt": //天地图
    case "mapbox":
    case "www_mapbox":
    case "mapboxstyle":
    case "www_mapboxstyle":
    case "arcgis_cache":
    case "arcgis":
    case "arcgis_tile":
    case "arcgis_dynamic":
    case "wmts":
    case "tms":
    case "wms":
    case "xyz":
    case "tile":
    case "single":
    case "image":
    case "gee":
    case "custom_tilecoord": //瓦片信息
    case "custom_grid": //网格线
      //瓦片图层
      layer = new TileLayer(viewer, item);
      layer.isTile = true;
      break;
    case "sm_img": //超图底图支持
    case "supermap_img":
      //瓦片图层
      layer = new SuperMapImgLayer(viewer, item);
      layer.isTile = true;
      break;
    case "www_poi": //在线poi数据
      layer = new POILayer(viewer, item);
      break;
    case "custom_featuregrid": //自定义矢量网格图层
      layer = new CustomFeatureGridLayer(viewer, item);
      break;
    case "custom_graticule":
      layer = new GraticuleLayer(viewer, item);
      break;

    case "3dtiles":
      //倾斜模型加入一些基础参数

      item["dynamicScreenSpaceError"]= Cesium.defaultValue(item["dynamicScreenSpaceError"],true);
      item["dynamicScreenSpaceErrorDensity"]= Cesium.defaultValue(item["dynamicScreenSpaceErrorDensity"],0.00278);
      item["dynamicScreenSpaceErrorFactor"]= Cesium.defaultValue(item["dynamicScreenSpaceErrorFactor"],4.0);
      item["dynamicScreenSpaceErrorHeightFalloff"]= Cesium.defaultValue(item["dynamicScreenSpaceErrorHeightFalloff"],0.25);
      item["skipLevelOfDetail"]= Cesium.defaultValue(item["skipLevelOfDetail"],true);
      item["immediatelyLoadDesiredLevelOfDetail"]= Cesium.defaultValue(item["immediatelyLoadDesiredLevelOfDetail"],true);

      layer = new Tiles3dLayer(viewer, item);
      break;
    case "gltf":
      layer = new GltfLayer(viewer, item);
      break;
    case "geojson":
      layer = new GeoJsonLayer(viewer, item);
      break;
    case "geojson-draw": //基于框架内部draw绘制保存的geojson数据的加载
      layer = new DrawLayer(viewer, item);
      break;
    case "water":
    case "geojson-water":
      layer = new WaterLayer(viewer, item);
      break;
    case "kml":
      layer = new KmlLayer(viewer, item);
      break;
    case "czml":
      layer = new CzmlLayer(viewer, item);
      break;
    case "wfs":
      layer = new WFSLayer(viewer, item);
      break;
    case "terrain":
      if (serverURL && item.terrain && item.terrain.url) {
        item.terrain.url = item.terrain.url.replace("$serverURL$", serverURL);
      }
      layer = new TerrainLayer(viewer, item);
      break;
    case "shp":
      layer = new ShpLayer(viewer, item);
      break;
    case "i3s":
      layer = new I3SLayer(viewer, item);
      break;
    default:
      if (exLayer[item.type]) {
        layer = new exLayer[item.type](viewer, item);
      }
      if (layer == null) {
        daslog.warn("配置中的图层未处理", item);
      }
      break;
  }

  return layer;
}

//创建地图底图
function createImageryProvider(item, serverURL) {
  if (item.url) {
    if (serverURL) {
      item.url = item.url.replace("$serverURL$", serverURL);
    }
    item.url = item.url.replace("$hostname$", location.hostname).replace("$host$", location.host);
  }

  var opts = {};
  for (var key in item) {
    var value = item[key];
    if (value == null) continue;

    switch (key) {
      default:
        //直接赋值
        opts[key] = value;
        break;
      case "crs":
        value = (value + "").toUpperCase();
        if (value == "4326" || value == "EPSG4326" || value == "EPSG:4326") {
          opts.tilingScheme = new Cesium.GeographicTilingScheme({
            numberOfLevelZeroTilesX: item.numberOfLevelZeroTilesX || 2,
            numberOfLevelZeroTilesY: item.numberOfLevelZeroTilesY || 1
          });
        } else if (value == "4490" || value == "EPSG4490" || value == "EPSG:4490") {
          opts.tilingScheme = new Cesium.GeographicTilingScheme({
            numberOfLevelZeroTilesX: item.numberOfLevelZeroTilesX || 2,
            numberOfLevelZeroTilesY: item.numberOfLevelZeroTilesY || 1
          });
          opts.is4490 = true;
        } else {
          opts.tilingScheme = new Cesium.WebMercatorTilingScheme({
            numberOfLevelZeroTilesX: item.numberOfLevelZeroTilesX || 1,
            numberOfLevelZeroTilesY: item.numberOfLevelZeroTilesY || 1
          });
        }
        break;
      case "rectangle":
        opts.rectangle = Cesium.Rectangle.fromDegrees(
          value.xmin,
          value.ymin,
          value.xmax,
          value.ymax
        );
        break;
      case "bbox":
        //[xmin,ymin,xmax,ymax]
        opts.rectangle = Cesium.Rectangle.fromDegrees(value[0], value[1], value[2], value[3]);
        break;
    }
  }

  //4490坐标系z值是+1的
  if (opts.is4490 && opts.url) {
    opts.url = opts.url.replace("{z}", "{z4490}");
    opts.url = opts.url.replace("{arc_z}", "{arc_z4490}");
    opts.url = opts.url.replace("{arc_Z}", "{arc_Z4490}");
  }

  if (opts.url && (opts.proxy || opts.headers || opts.queryParameters)) {
    opts = getProxyUrl(opts);
  }

  var layer;
  var _url;
  switch (opts.type_new || opts.type) {
    //===============地图底图====================
    case "single":
    case "image":
      layer = new Cesium.SingleTileImageryProvider(opts);
      break;
    case "xyz":
    case "tile":
      opts.customTags = opts.customTags || {};
      opts.customTags["z4490"] = function(imageryProvider, x, y, level) {
        return level + 1;
      };
      layer = new Cesium.UrlTemplateImageryProvider(opts);
      break;
    case "wms":
      layer = new Cesium.WebMapServiceImageryProvider(opts);
      break;
    case "tms":
      if (!opts.url) opts.url = Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII");
      layer = new Cesium.TileMapServiceImageryProvider(opts);
      break;
    case "wmts":
      if (opts.is4490) {
        opts.tileMatrixLabels = [...Array(20).keys()].map(item => (item + 1).toString());
      }
      layer = new Cesium.WebMapTileServiceImageryProvider(opts);
      break;
    case "gee": //谷歌地球
      layer = new Cesium.GoogleEarthEnterpriseImageryProvider({
        metadata: new Cesium.GoogleEarthEnterpriseMetadata(opts)
      });
      break;
    case "mapbox": //mapbox
    case "www_mapbox":
      opts.accessToken = Cesium.defaultValue(opts.accessToken, token.mapbox);
      layer = new Cesium.MapboxImageryProvider(opts);
      break;
    case "mapboxstyle":
    case "www_mapboxstyle":
      //参考：https://docs.mapbox.com/api/maps/#request-embeddable-html
      opts.url = Cesium.defaultValue(opts.url, "https://api.mapbox.com/styles/v1");
      opts.username = Cesium.defaultValue(opts.username, "dasgis");
      opts.accessToken = Cesium.defaultValue(opts.accessToken, token.mapbox);

      layer = new Cesium.MapboxStyleImageryProvider(opts);
      break;
    case "arcgis":
    case "arcgis_tile":
    case "arcgis_dynamic":
      layer = new Cesium.ArcGisMapServerImageryProvider(opts);
      break;
    case "sm_img": //超图底图支持
    case "supermap_img":
      layer = new Cesium.SuperMapImageryProvider(opts);
      break;
    case "arcgis_cache":
      // 示例 /google/_alllayers/L{arc_z}/R{arc_y}/C{arc_x}.jpg
      if (!Cesium.UrlTemplateImageryProvider.prototype.padLeft0) {
        Cesium.UrlTemplateImageryProvider.prototype.padLeft0 = function(numStr, n) {
          numStr = String(numStr);
          var len = numStr.length;
          while (len < n) {
            numStr = "0" + numStr;
            len++;
          }
          return numStr;
        };
      }
      opts.customTags = {
        //小写
        arc_x: function(imageryProvider, x, y, level) {
          return imageryProvider.padLeft0(x.toString(16), 8);
        },
        arc_y: function(imageryProvider, x, y, level) {
          return imageryProvider.padLeft0(y.toString(16), 8);
        },
        arc_z: function(imageryProvider, x, y, level) {
          return imageryProvider.padLeft0(level.toString(), 2);
        },
        arc_z4490: function(imageryProvider, x, y, level) {
          return imageryProvider.padLeft0((level + 1).toString(), 2);
        },
        //大写
        arc_X: function(imageryProvider, x, y, level) {
          return imageryProvider.padLeft0(x.toString(16), 8).toUpperCase();
        },
        arc_Y: function(imageryProvider, x, y, level) {
          return imageryProvider.padLeft0(y.toString(16), 8).toUpperCase();
        },
        arc_Z: function(imageryProvider, x, y, level) {
          return imageryProvider.padLeft0(level.toString(), 2).toUpperCase();
        },
        arc_Z4490: function(imageryProvider, x, y, level) {
          return imageryProvider.padLeft0((level + 1).toString(), 2).toUpperCase();
        }
      };

      layer = new Cesium.UrlTemplateImageryProvider(opts);
      break;

    //===============互联网常用地图====================
    case "www_ion": //cesium ion资源地图
      layer = new Cesium.IonImageryProvider(opts);
      break;
    case "www_tdt": //天地图
      var _layer;
      var maxLevel = 18;
      switch (opts.layer) {
        default:
        case "vec_d":
          _layer = "vec";
          break;
        case "vec_z":
          _layer = "cva";
          break;
        case "img_d":
          _layer = "img";
          break;
        case "img_z":
          _layer = "cia";
          break;
        case "ter_d":
          _layer = "ter";
          maxLevel = 14;
          break;
        case "ter_z":
          _layer = "cta";
          maxLevel = 14;
          break;
      }

      var _key;
      if (opts.key == null || opts.key.length == 0) _key = token.tianditu;
      //默认
      else _key = getOneKey(opts.key);

      if (item.crs == "4326") {
        //wgs84
        _url =
          "https://t{s}.tianditu.gov.cn/" +
          _layer +
          "_c/wmts?service=WMTS&version=1.0.0&request=GetTile&tilematrix={TileMatrix}&layer=" +
          _layer +
          "&style={style}&tilerow={TileRow}&tilecol={TileCol}&tilematrixset={TileMatrixSet}&format=tiles&tk=" +
          _key;

        if (opts.proxy || opts.headers || opts.queryParameters) {
          //存在代理等参数时
          _url = getProxyUrl({
            url: _url.replace("{s}", "0"),
            proxy: opts.proxy,
            headers: opts.headers,
            queryParameters: opts.queryParameters
          }).url;
        }

        layer = new Cesium.WebMapTileServiceImageryProvider({
          subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
          maximumLevel: maxLevel,
          ...opts,

          url: _url,
          layer: _layer,
          style: "default",
          format: "tiles",
          tileMatrixSetID: "c",
          tileMatrixLabels: [...Array(18).keys()].map(item => (item + 1).toString()),
          tilingScheme: new Cesium.GeographicTilingScheme() //WebMercatorTilingScheme、GeographicTilingScheme
        });
      } else {
        //墨卡托
        _url =
          "https://t{s}.tianditu.gov.cn/" +
          _layer +
          "_w/wmts?service=WMTS&version=1.0.0&request=GetTile&tilematrix={TileMatrix}&layer=" +
          _layer +
          "&style={style}&tilerow={TileRow}&tilecol={TileCol}&tilematrixset={TileMatrixSet}&format=tiles&tk=" +
          _key;

        if (opts.proxy || opts.headers || opts.queryParameters) {
          //存在代理等参数时
          _url = getProxyUrl({
            url: _url.replace("{s}", "0"),
            proxy: opts.proxy,
            headers: opts.headers,
            queryParameters: opts.queryParameters
          }).url;
        }

        layer = new Cesium.WebMapTileServiceImageryProvider({
          subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
          maximumLevel: maxLevel,
          ...opts,

          url: _url,
          layer: _layer,
          style: "default",
          format: "tiles",
          tileMatrixSetID: "w",
          tileMatrixLabels: [...Array(18).keys()].map(item => item.toString()),
          tilingScheme: new Cesium.WebMercatorTilingScheme()
        });
      }
      break;
    case "www_gaode": //高德
      _url;
      switch (opts.layer) {
        case "vec":
        default:
          //style=7是立体的，style=8是灰色平面的
          _url =
            "https://" +
            (opts.bigfont ? "wprd" : "webrd") +
            "0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}";
          break;
        case "img_d":
          _url = "https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";
          break;
        case "img_z":
          _url =
            "https://webst0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8";
          break;
        case "time":
          var time = new Date().getTime();
          _url =
            "https://tm.amap.com/trafficengine/mapabc/traffictile?v=1.0&;t=1&x={x}&y={y}&z={z}&&t=" +
            time;
          break;
      }

      if (opts.proxy || opts.headers || opts.queryParameters) {
        //存在代理等参数时
        _url = getProxyUrl({
          url: _url.replace("{s}", "1"),
          proxy: opts.proxy,
          headers: opts.headers,
          queryParameters: opts.queryParameters
        }).url;
      }
      layer = new Cesium.UrlTemplateImageryProvider({
        subdomains: ["1", "2", "3", "4"],
        maximumLevel: 18,
        ...opts,
        url: _url
      });
      break;
    case "www_baidu": //百度
      layer = new BaiduImageryProvider(opts);
      break;
    case "www_tencent": //腾讯
      layer = new TencentImageryProvider(opts);
      break;

    case "www_google": //谷歌国内
      _url;

      if (item.crs == "4326" || item.crs == "wgs84") {
        //无偏移
        switch (opts.layer) {
          default:
          case "img_d":
            // _url = 'http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}';
            // _url = 'http://mt{s}.google.cn/vt/lyrs=s&x={x}&y={y}&z={z}';
            _url = "http://mt3.google.cn/vt?lyrs=s@187&hl=us&gl=us&x={x}&y={y}&z={z}";
            break;
        }
      } else {
        //有偏移
        switch (opts.layer) {
          case "vec":
          default:
            _url =
              "http://mt{s}.google.cn/vt/lyrs=m@207000000&hl=zh-CN&gl=CN&src=app&x={x}&y={y}&z={z}&s=Galile";
            break;
          case "img_d":
            _url = "http://mt{s}.google.cn/vt/lyrs=s&hl=zh-CN&gl=CN&x={x}&y={y}&z={z}&s=Gali";
            break;
          case "img_z":
            _url =
              "http://mt{s}.google.cn/vt/imgtp=png32&lyrs=h@207000000&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&s=Galil";
            break;
          case "ter":
            _url =
              "http://mt{s}.google.cn/vt/lyrs=t@131,r@227000000&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&s=Galile";
            break;
        }
      }

      if (opts.proxy || opts.headers || opts.queryParameters) {
        //存在代理等参数时
        _url = getProxyUrl({
          url: _url.replace("{s}", "1"),
          proxy: opts.proxy,
          headers: opts.headers,
          queryParameters: opts.queryParameters
        }).url;
      }
      layer = new Cesium.UrlTemplateImageryProvider({
        subdomains: ["1", "2", "3"],
        maximumLevel: 20,
        ...opts,
        url: _url
      });
      break;

    case "www_osm": //OSM开源地图
      _url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      if (opts.proxy || opts.headers || opts.queryParameters) {
        //存在代理等参数时
        _url = getProxyUrl({
          url: _url.replace("{s}", "a"),
          proxy: opts.proxy,
          headers: opts.headers,
          queryParameters: opts.queryParameters
        }).url;
      }
      layer = new Cesium.UrlTemplateImageryProvider({
        subdomains: "abc",
        maximumLevel: 18,
        ...opts,
        url: _url
      });
      break;
    case "www_bing": //bing地图
      _url = "https://dev.virtualearth.net";

      if (opts.proxy || opts.headers || opts.queryParameters) {
        //存在代理等参数时
        _url = getProxyUrl({
          url: _url,
          proxy: opts.proxy,
          headers: opts.headers,
          queryParameters: opts.queryParameters
        }).url;
      }
      opts.key = opts.key || token.bing;

      //无标记影像 Aerial,
      //有英文标记影像   AerialWithLabels,
      //矢量道路  Road
      //OrdnanceSurvey,
      //CollinsBart
      var style = opts.layer || Cesium.BingMapsStyle.Aerial;
      layer = new Cesium.BingMapsImageryProvider({
        mapStyle: style,
        ...opts,
        url: _url
      });
      break;

    //===============内部定义的图层====================
    case "custom_grid": //网格线
      opts.cells = opts.cells || 2;
      opts.color = Cesium.Color.fromCssColorString(opts.color || "rgba(255,255,255,1)");
      opts.glowWidth = opts.glowWidth || 3;
      if (opts.glowColor) opts.glowColor = Cesium.Color.fromCssColorString(opts.glowColor);
      else opts.glowColor = opts.color.withAlpha(0.3);
      opts.backgroundColor = Cesium.Color.fromCssColorString(
        opts.backgroundColor || "rgba(0,0,0,0)"
      );

      layer = new Cesium.GridImageryProvider(opts);
      break;
    case "custom_tilecoord": //瓦片信息
      layer = new Cesium.TileCoordinatesImageryProvider(opts);
      break;
    case "custom_featuregrid": //自定义矢量网格图层
      layer = new FeatureGridImageryProvider(opts);
      break;
    default:
      daslog.warn("配置中的图层未处理", item);
      break;
  }
  layer.config = opts;

  return layer;
}

function getOneKey(arr) {
  var n = Math.floor(Math.random() * arr.length + 1) - 1;
  return arr[n];
}

export {
  BaseLayer,
  GroupLayer,
  TileLayer,
  SuperMapImgLayer,
  GraticuleLayer,
  CustomFeatureGridLayer,
  POILayer,
  WFSLayer,
  GeoJsonLayer,
  WaterLayer,
  GltfLayer,
  Tiles3dLayer,
  KmlLayer,
  CzmlLayer,
  TerrainLayer,
  DrawLayer,
  ShpLayer,
  I3SLayer,
  BaiduImageryProvider,
  TencentImageryProvider,
  FeatureGridImageryProvider,
  regLayerForConfig,
  createLayer,
  createImageryProvider
};

//===================================== 地形相关 =================================

var _ellipsoid = new Cesium.EllipsoidTerrainProvider({
  ellipsoid: Cesium.Ellipsoid.WGS84
});

//是否无地形
export function hasTerrain(viewer) {
  return !(
    viewer.terrainProvider == _ellipsoid ||
    viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider
  );
}
export function getEllipsoidTerrain() {
  return _ellipsoid;
}
export function getTerrainProvider(cfg) {
  cfg = cfg || { type: "ion" };
  cfg.requestWaterMask = Cesium.defaultValue(cfg.requestWaterMask, true);
  cfg.requestVertexNormals = Cesium.defaultValue(cfg.requestVertexNormals, true);

  var terrainProvider;
  switch (cfg.type) {
    default:
      //默认是自定义的
      terrainProvider = new Cesium.CesiumTerrainProvider(getProxyUrl(cfg));
      break;
    case "ion":
    case "cesium": //cesium官方在线的
      terrainProvider = new Cesium.CesiumTerrainProvider({
        url: Cesium.IonResource.fromAssetId(1),
        requestWaterMask: cfg.requestWaterMask,
        requestVertexNormals: cfg.requestVertexNormals
      });
      break;
    case "gee":
    case "google": //谷歌地球地形服务
      terrainProvider = new Cesium.GoogleEarthEnterpriseTerrainProvider({
        metadata: new Cesium.GoogleEarthEnterpriseMetadata(getProxyUrl(cfg))
      });
      break;
    case "arcgis": //ArcGIS地形服务
      terrainProvider = new Cesium.ArcGISTiledElevationTerrainProvider(getProxyUrl(cfg));
      break;
    case "ellipsoid":
      terrainProvider = _ellipsoid;
      break;
  }

  return terrainProvider;
}
