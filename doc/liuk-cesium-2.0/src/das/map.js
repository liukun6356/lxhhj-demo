import * as Cesium from "cesium";
import { zepto } from "./util/zepto";
import * as daslog from "./util/log";
import * as _util from "./util/util";
import * as token from "./util/token";
import { ViewerEx } from "./expand/ViewerEx";
import { GaodePOIGeocoder } from "./tool/GaodePOIGeocoder";
import * as _layer from "./layer";
import * as dasAuthentication from "./core/dasAuthentication";
export function createMap(opt) {
  if (opt.url) {
    zepto.ajax({
      type: "get",
      dataType: "json",
      url: opt.url,
      timeout: 0, //永不超时
      success: function (config) {
        if (config.serverURL) opt.serverURL = config.serverURL;
        //map初始化
        var viewer = initMap(config.map3d, opt);
        setTimeout(function(){
          var Authentication=new dasAuthentication.dasAuthentication({ viewer: viewer });
         })
        Cesium.MouseOperationController = new das3d.MouseOperationController({ viewer: viewer });
        Cesium.MouseOperationController.init();
        var skyAtmosphere = viewer.scene.skyAtmosphere;  //修改天空大气颜色, 显得好看点
        skyAtmosphere.saturationShift = 0.08;
        skyAtmosphere.brightnessShift = 0.45;
        skyAtmosphere.hueShift = 0;
        viewer.scene.highDynamicRange = false;

        // fangmm 20210817 把回调位置调整到最后，使外部调用MouseOperationController不会报错
        if (opt.success) opt.success(viewer, config, config); //第2个config为了兼容1.7以前版本

        //  var pOperation = changeOperation(viewer);
        // new pOperation().init();
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        daslog.warn("文件加载失败！", opt);
        _util.alert(opt.url + "文件加载失败！");
      }
    });
    return null;
  } else {
    var viewer = initMap(opt.data, opt);
   setTimeout(function(){
    var Authentication=new dasAuthentication.dasAuthentication({ viewer: viewer });
   })
     Cesium.MouseOperationController = new das3d.MouseOperationController({ viewer: viewer });
     Cesium.MouseOperationController.init();

    // fangmm 20210817 把回调位置调整到最后，使外部调用MouseOperationController不会报错
     if (opt.success) opt.success(viewer, opt.data);
    // var pOperation = changeOperation(viewer);
    // new pOperation().init();
    return viewer;
  }
}



function initMap(config, optsWB) {
  var id = optsWB.id;

  //数据优先级：optsWB > config > opts

  //如果options未设置时的默认参数
  var opts = {
    animation: false, //是否创建动画小器件，左下角仪表
    timeline: false, //是否显示时间线控件
    fullscreenButton: true, //右下角全屏按钮
    vrButton: false, //右下角vr虚拟现实按钮

    geocoder: false, //是否显示地名查找控件
    sceneModePicker: false, //是否显示投影方式控件
    homeButton: true, //回到默认视域按钮
    navigationHelpButton: true, //是否显示帮助信息控件
    navigationInstructionsInitiallyVisible: false, //在用户明确单击按钮之前是否自动显示

    infoBox: true, //是否显示点击要素之后显示的信息
    selectionIndicator: false, //选择模型是是否显示绿色框,
    shouldAnimate: true,
    showRenderLoopErrors: true, //是否显示错误弹窗信息

    baseLayerPicker: false, //地图底图
    contextmenu: true //右键菜单
  };

  //config中可以配置map所有options
  for (let key in config) {
    opts[key] = config[key];
  }
  //wboptions中可以配置map所有options覆盖

  for (let key in optsWB) {
    if (key === "id" || key === "success") continue;
    opts[key] = optsWB[key];
  }

  //一些默认值的修改
  Cesium.Ion.defaultAccessToken = opts.ionToken || token.ion;
  Cesium.AnimationViewModel.defaultTicks = opts.animationTicks || [
    0.1,
    0.25,
    0.5,
    1.0,
    2.0,
    5.0,
    10.0,
    15.0,
    30.0,
    60.0,
    120.0,
    300.0,
    600.0,
    900.0,
    1800.0,
    3600.0
  ];

  //自定义搜索栏Geocoder
  if (opts.geocoder === true) {
    opts.geocoder = new GaodePOIGeocoder(opts.geocoderConfig);
  }

  //地形
  var terrainProvider;
  if (opts.terrain && opts.terrain.visible) {
    terrainProvider = getTerrainProvider(opts.terrain, opts.serverURL);
    opts.terrainProvider = terrainProvider;
  } else {
    opts.terrainProvider = _layer.getEllipsoidTerrain();
  }

  //地图底图图层预处理
  var hasremoveimagery = false;
  if (opts.baseLayerPicker) {
    //有baseLayerPicker插件时
    if (!opts.imageryProviderViewModels && opts.basemaps && opts.basemaps.length > 0) {
      var imgOBJ = getImageryProviderArr(opts.basemaps);
      opts.imageryProviderViewModels = imgOBJ.imageryProviderViewModels;
      if (imgOBJ.index == -1) hasremoveimagery = true;
      else opts.selectedImageryProviderViewModel = imgOBJ.imageryProviderViewModels[imgOBJ.index];
    }

    if (!opts.terrainProviderViewModels) {
      opts.terrainProviderViewModels = getTerrainProviderViewModelsArr();
      opts.selectedTerrainProviderViewModel = opts.terrainProviderViewModels[1];
    }
  } else {
    //无baseLayerPicker插件时
    if (opts.imageryProvider == null) {
      //未配底图时
      hasremoveimagery = true;
      opts.imageryProvider = new Cesium.TileMapServiceImageryProvider({
        url: Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
      });
    }
  }

  //地球初始化
  var viewer = new Cesium.Viewer(id, opts);
  viewer.scene.postProcessStages.fxaa.enabled = true; //开启抗锯齿
  //地图底图图层
  if (hasremoveimagery) {
    var imageryLayerCollection = viewer.imageryLayers;
    var length = imageryLayerCollection.length;
    for (var i = 0; i < length; i++) {
      var layer = imageryLayerCollection.get(0);
      imageryLayerCollection.remove(layer, true);
    }
  }
  if (opts.geocoder) {
    opts.geocoder.viewer = viewer;
    delete opts.geocoder;
  }

  delete opts.imageryProviderViewModels;
  delete opts.selectedImageryProviderViewModel;
  delete opts.terrainProviderViewModels;
  delete opts.selectedTerrainProviderViewModel;
  delete opts.terrainProvider;
  delete opts.imageryProvider;

  viewer.das = new ViewerEx(viewer, opts); //扩展的viewer支持

  viewer.das.terrainProvider = terrainProvider;
  viewer.gisdata = { config: viewer.das.config }; //兼容1.7以前的历史版本属性
  if (opts.center) {
    var center = opts.center;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(center.x, center.y, center.z),
      orientation: {
        heading: Cesium.Math.toRadians(center.heading),
        pitch: Cesium.Math.toRadians(center.pitch),
        roll: Cesium.Math.toRadians(center.roll)
      }
    });
  }
  return viewer;
}

//获取配置的地形
function getTerrainProvider(cfg, serverURL) {
  if (cfg && cfg.url) {
    if (serverURL) {
      cfg.url = cfg.url.replace("$serverURL$", serverURL);
    }
    cfg.url = cfg.url.replace("$hostname$", location.hostname).replace("$host$", location.host);
  }

  return _layer.getTerrainProvider(cfg);
}

//获取自定义底图切换
function getImageryProviderArr(layersCfg) {
  var providerViewModels = [];
  var selectedIndex = -1;

  window._temp_createImageryProvider = _layer.createImageryProvider;

  for (var i = 0; i < layersCfg.length; i++) {
    var item = layersCfg[i];
    if (item.type == "group" && item.layers == null) continue;

    if (item.visible) selectedIndex = providerViewModels.length;

    var funstr =
      "window._temp_das_basemaps" +
      i +
      " = function () {\
                        var item = " +
      JSON.stringify(item) +
      ';\
                        if (item.type == "group") {\
                            var arrVec = [];\
                            for (var index = 0; index < item.layers.length; index++) {\
                                var temp = window._temp_createImageryProvider(item.layers[index]);\
                                if (temp == null) continue;\
                                arrVec.push(temp);\
                            }\
                            return arrVec;\
                        }\
                        else {\
                            return window._temp_createImageryProvider(item);\
                        } \
                    }';
    eval(funstr);

    var imgModel = new Cesium.ProviderViewModel({
      name: item.name || "未命名",
      tooltip: item.name || "未命名",
      iconUrl: item.icon || "",
      creationFunction: eval("window._temp_das_basemaps" + i)
    });
    providerViewModels.push(imgModel);
  }

  return {
    imageryProviderViewModels: providerViewModels,
    index: selectedIndex
  };
}

function getTerrainProviderViewModelsArr() {
  return [
    new Cesium.ProviderViewModel({
      name: "无地形",
      iconUrl: Cesium.buildModuleUrl("Widgets/Images/TerrainProviders/Ellipsoid.png"),
      tooltip: "WGS84标准椭球，即 EPSG:4326",
      category: "",
      creationFunction: function () {
        return _layer.getEllipsoidTerrain();
      }
    }),
    new Cesium.ProviderViewModel({
      name: "中国地形",
      iconUrl: Cesium.buildModuleUrl("Widgets/Images/TerrainProviders/CesiumWorldTerrain.png"),
      tooltip: "高分辨率中国地形",
      category: "",
      creationFunction: function () {
        return _layer.getTerrainProvider({
          // url: "//data.dasgis.cn/terrain"
          url: "//gisearth-1301434080.cos.ap-nanjing.myqcloud.com/MapData/terrain"
        });
      }
    }),
    new Cesium.ProviderViewModel({
      name: "Cesium Ion 全球地形",
      iconUrl: Cesium.buildModuleUrl("Widgets/Images/TerrainProviders/CesiumWorldTerrain.png"),
      tooltip: "Cesium官方Ion提供的高分辨率全球地形",
      category: "",
      creationFunction: function () {
        return _layer.getTerrainProvider({
          type: "ion"
        });
      }
    }),
    new Cesium.ProviderViewModel({
      name: "ArcGIS 全球地形",
      iconUrl: Cesium.buildModuleUrl("Widgets/Images/TerrainProviders/CesiumWorldTerrain.png"),
      tooltip: "arcgis官方提供的高分辨率全球地形",
      category: "",
      creationFunction: function () {
        return _layer.getTerrainProvider({
          type: "arcgis",
          url:
            "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
        });
      }
    })
  ];
}


