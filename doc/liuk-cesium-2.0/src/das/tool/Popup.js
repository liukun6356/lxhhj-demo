import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { zepto } from "../util/zepto";
import { getCurrentMousePosition, setPositionSurfaceHeight, getPositionValue } from "../util/point";
import { getPopupForConfig, getPopup, bindLayerPopup } from "../util/util";
import * as daslog from "../util/log";
import * as attrUtil from "../draw/attr/index";
import { style2Entity } from "../core/config2Entity";

//该类不仅仅是popup处理，是所有一些有关单击事件的统一处理入口（从效率考虑）。

export class Popup {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    this.viewer = viewer;
    this.options = options || {};

    this._isOnly = true;
    this._enable = true;
    this._depthTest = true;
    this.viewerid = viewer._container.id;
    this.objPopup = {};

    this.highlighted = {
      feature: undefined,
      originalColor: new Cesium.Color()
    };
    this.defaultHighlightedClr = Cesium.Color.fromCssColorString("#95e40c");

    //兼容历史接口
    this.getPopupForConfig = getPopupForConfig;
    this.getPopup = getPopup;

    //添加弹出框
    var infoDiv = '<div id="' + this.viewerid + '-das3d-pupup-all" ></div>';
    zepto("#" + this.viewerid).append(infoDiv);

    //单击事件
    this.viewer.das.on(eventType.click, this.mousePickingClick, this);
    //移动事件
    this.viewer.scene.postRender.addEventListener(this.bind2scene, this);
  }

  //========== 对外属性 ==========
  //显示单个模式
  get isOnly() {
    return this._isOnly;
  }
  set isOnly(val) {
    this._isOnly = val;
  }

  //是否禁用
  get enable() {
    return this._enable;
  }
  set enable(value) {
    this._enable = value;
    if (!value) {
      this.close();
    }
  }

  //是否打开深度判断（true时判断是否在球背面）
  get depthTest() {
    return this._depthTest;
  }
  set depthTest(value) {
    this._depthTest = value;
  }

  //========== 方法 ==========

  //鼠标点击事件
  mousePickingClick(event) {
    this.removeFeatureForImageryLayer();
    this.removeFeatureFor3dtiles();

    if (this._isOnly) this.close();
    if (!this._enable) return;

    var position = event.position;
    var pickedObject;
    try {
      pickedObject = this.viewer.scene.pick(position);
    } catch (e) {
      //
    }

    var isFindPopup = false;
    var isFindClick = false;

    //存在单击的对象
    if (Cesium.defined(pickedObject)) {
      //普通entity对象 && viewer.scene.pickPositionSupported
      if (Cesium.defined(pickedObject.id) && pickedObject.id instanceof Cesium.Entity) {
        var entity = pickedObject.id;

        // if (entity.eventTarget && entity.eventTarget.popup) {
        //   entity.popup = entity.popup || entity.eventTarget.popup;
        // }

        //popup
        if (Cesium.defined(entity.popup)) {
          let cartesian;
          if (entity.billboard || entity.label || entity.point || entity.model) {
            //对点状数据做特殊处理，
            cartesian = entity.position;
          } else {
            cartesian = getCurrentMousePosition(this.viewer.scene, position);
          }
          this.show(entity, cartesian, position);
          isFindPopup = true;
        }

        //加统一的click处理
        if (entity.click && typeof entity.click === "function") {
          entity.click(entity, position);
          isFindClick = true;
        }
        //单击对象所关联的管理类(基于DasClass)，进行click事件抛出。
        if (entity.eventTarget && entity.eventTarget.fire) {
          entity.eventTarget.fire(eventType.click, {
            sourceTarget: entity,
            position: position
          });
          isFindClick = true;
        }
      }
      //单体化3dtiles数据的处理(如：BIM的构件，城市白膜建筑)
      else if (Cesium.defined(pickedObject.tileset) && Cesium.defined(pickedObject.getProperty)) {
        //取属性
        var attr = {};
        var names = pickedObject.getPropertyNames();
        for (var i = 0; i < names.length; i++) {
          var name = names[i];
          if (!pickedObject.hasProperty(name)) continue;

          var val = pickedObject.getProperty(name);
          if (val == null) continue;
          attr[name] = val;
        }

        var cfg = pickedObject.tileset.das.options;

        //popup
        if (Cesium.defined(cfg.popup)) {
          let cartesian = getCurrentMousePosition(this.viewer.scene, position);
          var item = {
            id: pickedObject._batchId,
            popup: bindLayerPopup(cfg.popup, function(inhtml, entity) {
              return getPopupForConfig(
                {
                  name: cfg.name,
                  popup: inhtml,
                  popupNameField: cfg.popupNameField
                },
                attr
              );
            }),
            popupPosition: cfg.popupPosition,
            tileset: pickedObject.tileset,
            eventTarget: pickedObject.tileset.eventTarget,
            data: attr
          };
          this.show(item, cartesian, position);
          isFindPopup = true;
        }

        //高亮显示单体对象
        if (cfg.showClickFeature) {
          if (cfg.clickFeatureColor) {
            //兼容历史写法
            cfg.pickFeatureStyle = cfg.pickFeatureStyle || {};
            cfg.pickFeatureStyle.color = cfg.clickFeatureColor;
          }
          this.showFeatureFor3dtiles(pickedObject, cfg.pickFeatureStyle);
        }

        //加统一的click处理
        if (cfg.click && typeof cfg.click === "function") {
          cfg.click({ attr: attr, feature: pickedObject, tileset: pickedObject.tileset }, position);
          isFindClick = true;
        }
        //单击对象所关联的管理类(基于DasClass)，进行click事件抛出。
        if (pickedObject.tileset.eventTarget && pickedObject.tileset.eventTarget.fire) {
          pickedObject.tileset.eventTarget.fire(eventType.click, {
            sourceTarget: pickedObject,
            tileset: pickedObject.tileset,
            data: attr,
            position: position
          });
          isFindClick = true;
        }
      }
      //primitive对象
      else if (Cesium.defined(pickedObject.primitive)) {
        var primitive = pickedObject.primitive;

        //popup
        if (Cesium.defined(primitive.popup)) {
          let cartesian = getCurrentMousePosition(this.viewer.scene, position);
          this.show(primitive, cartesian, position);
          isFindPopup = true;
        }

        //加统一的click处理
        if (primitive.click && typeof primitive.click === "function") {
          primitive.click(primitive, position);
          isFindClick = true;
        }
        //单击对象所关联的管理类(基于DasClass)，进行click事件抛出。
        if (primitive.eventTarget && primitive.eventTarget.fire) {
          primitive.eventTarget.fire(eventType.click, {
            sourceTarget: primitive,
            position: position
          });
          isFindClick = true;
        }
      } else {
        //未单击到矢量或模型数据时
        daslog.log("单击到了对象，请确认是否要做处理", pickedObject);
      }
    }

    if (!isFindPopup) {
      this.pickImageryLayerFeatures(position);
    }

    //单击地图空白（未单击到矢量或模型数据）时
    if (!isFindClick) {
      this.viewer.das.fire(eventType.clickMap, {
        position: position
      });
    }
  }

  //瓦片图层上的矢量对象，动态获取
  pickImageryLayerFeatures(position) {
    var scene = this.viewer.scene;
    var pickRay = scene.camera.getPickRay(position); //position : Cesium.Cartesian2
    var imageryLayerFeaturePromise = scene.imageryLayers.pickImageryLayerFeatures(pickRay, scene);
    if (!Cesium.defined(imageryLayerFeaturePromise)) {
      return;
    }

    var that = this;
    Cesium.when(
      imageryLayerFeaturePromise,
      function(features) {
        if (!Cesium.defined(features) || features.length === 0) {
          return;
        }

        //单击选中的要素对象
        var feature = features[0];
        if (feature.imageryLayer == null || feature.imageryLayer.config == null) return;
        var cfg = feature.imageryLayer.config;

        that.pickFeatures(feature, position, cfg);

        if (cfg.click && typeof cfg.click === "function") {
          cfg.click(features, position); //返回所有的features
        }
        //单击对象所关联的管理类(基于DasClass)，进行click事件抛出。
        if (feature.imageryLayer.eventTarget && feature.imageryLayer.eventTarget.fire) {
          feature.imageryLayer.eventTarget.fire(eventType.click, {
            sourceTarget: feature.imageryLayer,
            features: features,
            position: position
          });
        }
      },
      function(e) {
        daslog.warn("pickImageryLayerFeatures底图出错", e);
      }
    );
  }

  pickFeatures(feature, viewerPoint, cfg) {
    //属性
    var attr = feature.properties;
    if (!Cesium.defined(attr) && feature.data) {
      attr = feature.data.properties || feature.data.attributes;
    }

    //显示popup
    var result = getPopupForConfig(cfg, attr);
    if (result) {
      var position = getCurrentMousePosition(this.viewer.scene, viewerPoint);
      this.show(
        {
          id: "imageryLayerFeaturePromise",
          popup: {
            html: result,
            anchor: cfg.popupAnchor || [0, -12]
          },
          popupPosition: cfg.popupPosition
        },
        position,
        viewerPoint
      );
    }

    //显示要素
    if (cfg.showClickFeature && feature.data) {
      if (
        feature.data.geometry &&
        JSON.stringify(feature.data.geometry).length > Cesium.defaultValue(cfg.pickFeatureMax, 9000)
      ) {
        //配置有maxLength时，屏蔽大数据下的页面卡顿
        daslog.log("showFeatureForImageryLayer屏蔽的大数据，避免卡顿", feature.data.geometry);
        return;
      }

      this.showFeatureForImageryLayer(feature.data, cfg.pickFeatureStyle);
    }
  }

  //popup处理
  show(entity, cartesian, viewPoint) {
    if (entity == null || entity.popup == null) return;

    if (!cartesian) {
      //外部直接传入entity调用show时，可以不传入坐标，自动取值
      cartesian = attrUtil.getCenterPosition(entity);
    }

    //对点状贴地数据做特殊处理，
    var graphic = entity.billboard || entity.label || entity.point || entity.model;
    if (graphic && graphic.heightReference) {
      cartesian = getPositionValue(cartesian);

      var tempCarto = Cesium.Cartographic.fromCartesian(cartesian);
      if (tempCarto) {
        // && tempCarto.height == 0
        var that = this;
        if (graphic.heightReference._value == Cesium.HeightReference.CLAMP_TO_GROUND) {
          //贴地点，重新计算高度
          cartesian = setPositionSurfaceHeight(this.viewer, cartesian, {
            asyn: true,
            callback: function(newHeight, cartOld) {
              //daslog.log("原始高度为：" + cartOld.height.toFixed(2) + ",贴地高度：" + newHeight.toFixed(2))

              var cartesianNew = Cesium.Cartesian3.fromRadians(
                cartOld.longitude,
                cartOld.latitude,
                newHeight
              );
              that._showView(entity, cartesianNew, viewPoint);
            }
          });
          return;
        } else if (graphic.heightReference._value == Cesium.HeightReference.RELATIVE_TO_GROUND) {
          cartesian = setPositionSurfaceHeight(this.viewer, cartesian, {
            relativeHeight: true,
            asyn: true,
            callback: function(newHeight, cartOld) {
              //daslog.log("原始高度为：" + cartOld.height.toFixed(2) + ",贴地高度：" + newHeight.toFixed(2))

              var cartesianNew = Cesium.Cartesian3.fromRadians(
                cartOld.longitude,
                cartOld.latitude,
                newHeight
              );
              that._showView(entity, cartesianNew, viewPoint);
            }
          });
          return;
        }
      }
    }

    this._showView(entity, cartesian, viewPoint);
  }

  _showView(entity, cartesian, viewPoint) {
    var eleId = this.getPopupId(entity);
    this.close(eleId);

    this.objPopup[eleId] = {
      id: entity.id,
      popup: entity.popup,
      popupPosition: entity.popupPosition, //配置的固定位置 类似弹窗
      entity: entity,
      cartesian: cartesian,
      viewPoint: viewPoint
    };

    //显示内容
    var inhtml;
    if (typeof entity.popup === "object") {
      inhtml = entity.popup.html;
      this.objPopup[eleId].onAdd = entity.popup.onAdd;
      this.objPopup[eleId].onRemove = entity.popup.onRemove;

      if (typeof entity.popup.visible === "function") {
        if (!entity.popup.visible(entity)) {
          return;
        }
      }
    } else {
      inhtml = entity.popup;
    }
    if (!inhtml) return;

    var that = this;
    if (typeof inhtml === "function") {
      //回调方法
      inhtml = inhtml(entity, cartesian, function(inhtml) {
        that._camera_cache = null;
        zepto("#" + eleId).remove();
        that._showHtml(inhtml, eleId, entity, cartesian, viewPoint);
      });
    }

    if (!inhtml) return;

    this._showHtml(inhtml, eleId, entity, cartesian, viewPoint);
  }

  getItem(eleId) {
    return this.objPopup[eleId];
  }

  _showHtml(inhtml, eleId, entity, cartesian, viewPoint) {
    zepto("#" + this.viewerid + "-das3d-pupup-all").append(
      '<div id="' +
        eleId +
        '" class="das3d-popup">' +
        '            <a id="' +
        eleId +
        '-popup-close" data-id="' +
        eleId +
        '" class="das3d-popup-close-button das3d-popup-color" >×</a>' +
        '            <div class="das3d-popup-content-wrapper das3d-popup-background">' +
        '                <div class="das3d-popup-content das3d-popup-color">' +
        inhtml +
        "</div>" +
        "            </div>" +
        '            <div id="' +
        eleId +
        '-popup-btmtip" class="das3d-popup-tip-container"><div class="das3d-popup-tip das3d-popup-background"></div></div>' +
        "        </div>"
    );

    var that = this;
    zepto("#" + eleId + "-popup-close").click(function() {
      var eleId = zepto(this).attr("data-id");
      that.close(eleId, true);
    });

    //计算显示位置
    if (entity.popupPosition) {
      //固定显示，类似弹窗
      this.showFixViewPoint(eleId, cartesian, entity.popup, entity.popupPosition);
      zepto("#" + eleId + "-popup-btmtip").remove(); //去掉小箭头
    } else {
      this._camera_cache = null;

      var result = this.updateViewPoint(eleId, cartesian, entity.popup, viewPoint);
      if (!result && this._depthTest) {
        this.close(eleId);
        return;
      }
    }

    //popup的DOM添加到页面的回调方法
    if (this.objPopup[eleId] && this.objPopup[eleId].onAdd) {
      this.objPopup[eleId].onAdd(eleId, entity);
    }
  }

  updateViewPoint(eleId, position, popup, point) {
    var _position = getPositionValue(position);
    if (!Cesium.defined(_position)) {
      return false;
    }

    //如果视角和位置都没有变化，直接返回
    var camera = this.viewer.camera;
    var _thiscache = `${_position.x}=${_position.y}-${_position.z}-${camera.positionWC.x}=${camera.positionWC.y}-${camera.positionWC.z}-${camera.heading}-${camera.pitch}-${camera.roll}`;
    if (_thiscache == this._camera_cache) {
      return true;
    }
    this._camera_cache = _thiscache;
    //如果视角和位置都没有变化，直接返回

    var newpoint = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, _position);
    if (Cesium.defined(newpoint)) {
      point = newpoint;
      if (this.objPopup[eleId]) this.objPopup[eleId].viewPoint = newpoint;
    }

    var _dom = zepto("#" + eleId);
    if (!Cesium.defined(point)) {
      daslog.log("wgs84ToWindowCoordinates无法转换为屏幕坐标", _position);
      _dom.hide();
      return true;
    }

    //判断是否在球的背面
    var scene = this.viewer.scene;
    if (this._depthTest && scene.mode === Cesium.SceneMode.SCENE3D) {
      //三维模式下
      var occluder = new Cesium.EllipsoidalOccluder(scene.globe.ellipsoid, scene.camera.positionWC);
      var visible = occluder.isPointVisible(_position);
      //visible为true说明点在球的正面，否则点在球的背面。
      //需要注意的是不能用这种方法判断点的可见性，如果球放的比较大，点跑到屏幕外面，它返回的依然为true
      if (!visible) {
        _dom.hide();
        return true;
      }
    }
    //判断是否在球的背面

    _dom.show();

    //更新html ，实时更新
    if (
      typeof popup === "object" &&
      popup.timeRender &&
      popup.html &&
      typeof popup.html === "function"
    ) {
      var inhtml = popup.html(this.objPopup[eleId] && this.objPopup[eleId].entity, _position);
      zepto("#" + eleId + " .das3d-popup-content").html(inhtml);
    }

    var x = point.x - _dom.width() / 2;
    var y = point.y - _dom.height();

    if (popup && typeof popup === "object" && popup.anchor) {
      x += popup.anchor[0];
      y += popup.anchor[1];
    }
    _dom.css("transform", "translate3d(" + x + "px," + y + "px, 0)");

    return true;
  }

  //固定显示再一个配置的popupPosition位置（类似弹窗）
  showFixViewPoint(eleId, position, popup, popupPosition) {
    //更新html ，实时更新
    if (
      typeof popup === "object" &&
      popup.timeRender &&
      popup.html &&
      typeof popup.html === "function"
    ) {
      var inhtml = popup.html(this.objPopup[eleId] && this.objPopup[eleId].entity, position);
      zepto("#" + eleId + " .das3d-popup-content").html(inhtml);
    }

    var _dom = zepto("#" + eleId);

    var x = 0;
    if (Cesium.defined(popupPosition.left)) x = popupPosition.left;
    if (Cesium.defined(popupPosition.right)) {
      x = document.documentElement.clientWidth - _dom.width() - popupPosition.right;
    }

    var y = 0;
    if (Cesium.defined(popupPosition.top)) y = popupPosition.top;
    if (Cesium.defined(popupPosition.bottom)) {
      y = document.documentElement.clientHeight - _dom.height() - popupPosition.bottom;
    }

    _dom.css("transform", "translate3d(" + x + "px," + y + "px, 0)");

    return true;
  }

  bind2scene() {
    for (var i in this.objPopup) {
      var item = this.objPopup[i];
      if (item.popupPosition) continue;

      var result = this.updateViewPoint(i, item.cartesian, item.popup, item.viewPoint);
      if (!result && this._depthTest) {
        this.close(i);
      }
    }
  }

  getPopupId(entity) {
    var eleId =
      this.viewerid +
      "popup_" +
      ((entity.id || "") + "").replace(new RegExp("[^0-9a-zA-Z_]", "gm"), "_");
    return eleId;
  }

  close(eleId, removFea) {
    if (!this._isOnly && eleId) {
      if (typeof eleId === "object") {
        //传入参数是eneity对象
        eleId = this.getPopupId(eleId);
      }

      for (let i in this.objPopup) {
        if (eleId == this.objPopup[i].id || eleId == i) {
          //popup的DOM从页面移除的回调方法
          if (this.objPopup[i] && this.objPopup[i].onRemove) {
            this.objPopup[i].onRemove(i, this.objPopup[i].entity);
          }

          zepto("#" + i).remove();
          delete this.objPopup[i];
          break;
        }
      }
    } else {
      for (let i in this.objPopup) {
        //popup的DOM从页面移除的回调方法
        if (this.objPopup[i] && this.objPopup[i].onRemove) {
          this.objPopup[i].onRemove(i, this.objPopup[i].entity);
        }
      }

      zepto("#" + this.viewerid + "-das3d-pupup-all").empty();
      this.objPopup = {};
    }
    this._camera_cache = null;

    if (removFea) {
      this.removeFeatureForImageryLayer();
      this.removeFeatureFor3dtiles();
    }
  }

  //=====================单击高亮对象处理========================
  //单击Tile瓦片时同步，高亮显示要素处理
  removeFeatureForImageryLayer() {
    if (this.lastShowFeature == null) return;
    this.viewer.dataSources.remove(this.lastShowFeature);
    this.lastShowFeature = null;
  }
  showFeatureForImageryLayer(item, style) {
    var that = this;
    this.removeFeatureForImageryLayer();

    var feature = item;
    if (item.geometryType && item.geometryType.indexOf("esri") != -1) {
      //arcgis图层时
      let L = window.das3d.L || window.L;
      if (L && L.esri) {
        feature = L.esri.Util.arcgisToGeoJSON(item.geometry);
      } else {
        daslog.warn("需要引入 das-esri 插件解析arcgis标准的json数据！");
        return;
      }
    } else if (item.geometry && item.geometry.type) {
      let L = window.das3d.L || window.L;
      if (L) {
        //处理数据里面的坐标为4326
        var geojson = L.geoJSON(item.geometry, {
          coordsToLatLng: function(coords) {
            if (coords[0] > 180 || coords[0] < -180) {
              return L.CRS.EPSG3857.unproject(L.point(coords[0], coords[1]));
            }
            return new L.LatLng(coords[1], coords[0], coords[2]);
          }
        });
        feature = geojson.toGeoJSON();
      }
    }

    if (feature == null) return;

    var loadOpts;
    if (style) {
      loadOpts = {
        clampToGround: Cesium.defaultValue(style.clampToGround, false),
        fill: Cesium.Color.fromCssColorString(
          Cesium.defaultValue(style.color, "#FFFF00")
        ).withAlpha(Number(Cesium.defaultValue(style.opacity, 0.5))),
        stroke: Cesium.Color.fromCssColorString(
          style.outlineColor || style.color || "#FFFFFF"
        ).withAlpha(
          Cesium.defaultValue(style.outlineOpacity, Cesium.defaultValue(style.opacity, 1.0))
        ),
        strokeWidth: Cesium.defaultValue(style.outlineWidth, 1)
      };
    }

    var dataSource = Cesium.GeoJsonDataSource.load(feature, loadOpts);
    dataSource
      .then(function(dataSource) {
        that.viewer.dataSources.add(dataSource);
        that.lastShowFeature = dataSource;

        if (style) {
          var entities = dataSource.entities.values;
          style2Entity(entities, style);

          if (Cesium.defined(style.showTime)) {
            //定时自动关闭
            setTimeout(() => {
              that.removeFeatureForImageryLayer();
            }, style.showTime);
          }
        }
      })
      .otherwise(function(error) {
        daslog.warn("json加载出错", error);
      });
  }

  //单击3dtiles单体化，高亮显示构件处理
  removeFeatureFor3dtiles() {
    if (Cesium.defined(this.highlighted.feature)) {
      try {
        this.highlighted.feature.color = this.highlighted.originalColor;
      } catch (ex) {
        //
      }
      this.highlighted.feature = undefined;
    }
  }
  showFeatureFor3dtiles(pickedFeature, style) {
    this.removeFeatureFor3dtiles();
    this.highlighted.feature = pickedFeature;

    // Cesium.Color.clone(pickedFeature.color, this.highlighted.originalColor);

    if (style) {
      pickedFeature.color = Cesium.Color.fromCssColorString(
        Cesium.defaultValue(style.color, "#FFFF00")
      ).withAlpha(Number(Cesium.defaultValue(style.opacity, 1.0)));
    } else {
      pickedFeature.color = this.defaultHighlightedClr;
    }
  }

  //=================================================

  destroy() {
    this.close();
    this.viewer.scene.postRender.removeEventListener(this.bind2scene, this);
    this.viewer.das.off(eventType.click, this.mousePickingClick, this);

    zepto("#" + this.viewerid + "-das3d-pupup-all").remove();

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
