import * as Cesium from "cesium";
import { zepto } from "../util/zepto";
import { DasClass, eventType } from "../core/DasClass";
import * as util from "../util/util";
import { getPositionByGeoJSON } from "../util/point";
import * as pointconvert from "../util/pointconvert";
import * as daslog from "../util/log";

import { message, Tooltip } from "./core/Tooltip";
import * as attr from "./attr/index";

import { DrawBase } from "./draw/Draw.Base";
import { DrawPoint } from "./draw/Draw.Point";
import { DrawBillboard } from "./draw/Draw.Billboard";
import { DrawLabel } from "./draw/Draw.Label";
import { DrawModel } from "./draw/Draw.Model";
import { DrawPolyline } from "./draw/Draw.Polyline";
import { DrawCurve } from "./draw/Draw.Curve";
import { DrawPolylineVolume } from "./draw/Draw.PolylineVolume";
import { DrawCorridor } from "./draw/Draw.Corridor";
import { DrawPolygon } from "./draw/Draw.Polygon";
import { DrawPolygonEx } from "./draw/Draw.PolygonEx";
import { DrawRectangle } from "./draw/Draw.Rectangle";
import { DrawCircle } from "./draw/Draw.Circle";
import { DrawCylinder } from "./draw/Draw.Cylinder";
import { DrawEllipsoid } from "./draw/Draw.Ellipsoid";
import { DrawWall } from "./draw/Draw.Wall";
import { DrawPlane } from "./draw/Draw.Plane";
import { DrawBox } from "./draw/Draw.Box";

//类库外部扩展的类
var exDraw = {};
export function register(type, layerClass) {
  exDraw[type] = layerClass;
}

//绘制entity类型
export class Draw extends DasClass {
  //========== 构造方法 ==========
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.options = options;
    this.viewer = options.viewer;
    this.popup = options.popup;
    this.mouseEdit = Cesium.defaultValue(this.options.mouseEdit, true); //是否开启鼠标编辑事件

    this.options.groupName = Cesium.defaultValue(this.options.groupName, "默认分组");

    this.arrGroup = []; //分组
    this.dataSource = Cesium.defaultValue(
      this.options.dataSource,
      this.addGroup(this.options.groupName)
    );

    if (Cesium.defaultValue(this.options.removeScreenSpaceEvent, true)) {
      this.viewer.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      );
      this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    this.tooltip = new Tooltip(this.viewer.container); //鼠标提示信息

    this.hasEdit(Cesium.defaultValue(this.options.hasEdit, true)); //是否可编辑

    //编辑工具初始化
    var _opts = {
      viewer: this.viewer,
      dataSource: this.dataSource,
      tooltip: this.tooltip
    };

    //entity
    this.drawCtrl = {};
    this.drawCtrl["point"] = new DrawPoint(_opts);
    this.drawCtrl["billboard"] = new DrawBillboard(_opts);
    this.drawCtrl["label"] = new DrawLabel(_opts);
    this.drawCtrl["model"] = new DrawModel(_opts);

    this.drawCtrl["polyline"] = new DrawPolyline(_opts);
    this.drawCtrl["curve"] = new DrawCurve(_opts);
    this.drawCtrl["polylineVolume"] = new DrawPolylineVolume(_opts);
    this.drawCtrl["corridor"] = new DrawCorridor(_opts);

    this.drawCtrl["polygon"] = new DrawPolygon(_opts);
    this.drawCtrl["rectangle"] = new DrawRectangle(_opts);
    this.drawCtrl["ellipse"] = new DrawCircle(_opts);
    this.drawCtrl["circle"] = this.drawCtrl["ellipse"]; //圆
    this.drawCtrl["cylinder"] = new DrawCylinder(_opts);
    this.drawCtrl["ellipsoid"] = new DrawEllipsoid(_opts);
    this.drawCtrl["wall"] = new DrawWall(_opts);
    this.drawCtrl["box"] = new DrawBox(_opts);
    this.drawCtrl["plane"] = new DrawPlane(_opts);

    //外部图层
    for (var key in exDraw) {
      this.drawCtrl[key] = new exDraw[key](_opts);
    }

    //绑定事件抛出方法
    var that = this;
    for (var type in this.drawCtrl) {
      this.drawCtrl[type]._fire = function(type, data, propagate) {
        that.fire(type, data, propagate);
      };
    }

    this.isContinued = Cesium.defaultValue(this.options.isContinued, false);
    this.isAutoEditing = Cesium.defaultValue(this.options.isAutoEditing, true);
    this.on(
      eventType.drawCreated,
      e => {
        this.bindExtension(e.entity);

        setTimeout(() => {
          if (this.isContinued) {
            //连续标绘时
            this.stopDraw();
            this.startDraw(this._last_attribute, this._last_drawOkCallback);
          } else if (this.isAutoEditing) {
            //创建完成后激活编辑
            this.startEditing(e.entity);
          }
        }, 50);
      },
      this
    );
  }
  //========== 对外属性 ==========
  get visible() {
    return this.getVisible();
  }
  set visible(val) {
    this.setVisible(val);
  }

  get edit() {
    return this._hasEdit;
  }
  set edit(val) {
    this.hasEdit(val);
  }

  //是否还在绘制中
  get drawing() {
    for (var type in this.drawCtrl) {
      if (this.drawCtrl[type].enabled) return true;
    }
    return false;
  }

  //获取所有分组
  get dataSources() {
    return this.arrGroup;
  }

  //当前激活的分组
  get dataSource() {
    return this._dataSourceAct;
  }
  set dataSource(layer) {
    if (this._dataSourceAct) {
      //上一次的取消激活状态
      delete this._dataSourceAct.isActivate;
    }

    this._dataSourceAct = layer;
    if (this._dataSourceAct) {
      //本次的标记为激活状态
      this._dataSourceAct.isActivate = true;
    }

    if (this.drawCtrl) {
      for (var type in this.drawCtrl) {
        this.drawCtrl[type].dataSource = layer;
      }
    }
  }

  //==========分组相关==========
  //新增添加分组
  addGroup(name, item) {
    var dataSource = new Cesium.CustomDataSource(name);
    dataSource.attribute = item; //携带数据，非必须
    this.viewer.dataSources.add(dataSource);

    this.arrGroup.push(dataSource);
    return dataSource;
  }
  //校验分组是否有同名的
  checkGroupName(name, thisLayer) {
    for (var i = 0; i < this.arrGroup.length; i++) {
      var layer = this.arrGroup[i];
      if (thisLayer && layer == thisLayer) continue;

      if (layer.name == name) return true;
    }
    return false;
  }
  //根据name获取分组
  getGroup(name) {
    for (var i = 0; i < this.arrGroup.length; i++) {
      var layer = this.arrGroup[i];
      if (layer.name == name) return layer;
    }
    return null;
  }
  //新增或获取已有分组
  addOrGetGroup(name) {
    if (!name) return this.dataSource;
    var group = this.getGroup(name);
    if (group) {
      return group;
    } else {
      return this.addGroup(name);
    }
  }
  //删除分组后的对默认图层和激活图层的特殊处理
  _processForRemoveGroup() {
    if (this.arrGroup.length == 0) {
      this.dataSource = this.addGroup(this.options.groupName);
    } else if (this.dataSource == null) {
      //如果删除的是当前激活的图层，默认再次激活第1个图层
      this.dataSource = this.arrGroup[0];
    }
  }
  //根据name删除分组
  removeGroup(name) {
    var layer;
    if (name instanceof Cesium.CustomDataSource) layer = name;
    else layer = this.getGroup(name);

    if (layer) {
      if (this.dataSource == layer) {
        this.dataSource = null;
      }
      this.removeByGroup(layer);
      this.viewer.dataSources.remove(layer, true);
      util.removeArrayItem(this.arrGroup, layer);

      this._processForRemoveGroup();
      return true;
    }
    return false;
  }
  //删除所有非空数组
  removeNullGroup() {
    for (var i = this.arrGroup.length - 1; i >= 0; i--) {
      var layer = this.arrGroup[i];
      if (layer.entities.values.length == 0) {
        this.viewer.dataSources.remove(layer, true);
        this.arrGroup.splice(i, 1);

        if (this.dataSource == layer) {
          this.dataSource = null;
        }
      }
    }
    this._processForRemoveGroup();
  }
  //激活图层，新增的标绘是加到当前激活的图层中。
  activateGroup(name) {
    var layer;
    if (name instanceof Cesium.CustomDataSource) layer = name;
    else layer = this.getGroup(name);

    if (!layer) return false;

    this.dataSource = layer;
    return true;
  }

  //移动标号到新分组
  moveEntityGroup(entity, group) {
    var dataSource;
    if (group instanceof Cesium.CustomDataSource) dataSource = group;
    else dataSource = this.getGroup(group);

    entity.entityCollection.remove(entity); //从原有的集合中删除
    dataSource.entities.add(entity); //加入到draw集合图层中

    entity.attribute.group = dataSource.name; //记录分组信息
  }
  getDataSource() {
    return this.dataSource;
  }

  //==========绘制相关==========
  startDraw(attribute, drawOkCallback) {
    //参数是字符串id或uri时
    if (typeof attribute === "string") {
      attribute = { type: attribute };
    } else {
      if (attribute == null || attribute.type == null) {
        daslog.warn("需要传入指定绘制的type类型！", attribute);
        return;
      }
    }

    var type = attribute.type;
    if (this.drawCtrl[type] == null) {
      daslog.warn("不能进行type为【" + type + "】的绘制，无该类型！");
      return;
    }

    if (!drawOkCallback && attribute.success) {
      drawOkCallback = attribute.success;
      delete attribute.success;
    }
    this._last_drawOkCallback = drawOkCallback;
    this._last_attribute = attribute;

    //赋默认值
    attribute = attr.addGeoJsonDefVal(attribute);

    this.stopDraw();
    var entity = this.drawCtrl[type].activate(attribute, drawOkCallback);
    return entity;
  }
  //对已经绘制完成的entity，重新激活开始编辑[目前仅支持polyline、polygon]
  restartDraw(entity, drawOkCallback) {
    var attribute = entity.attribute;
    var type = attribute.type;
    if (this.drawCtrl[type] == null) {
      daslog.warn("不能进行type为【" + type + "】的绘制，无该类型！");
      return;
    }

    if (!drawOkCallback && attribute.success) {
      drawOkCallback = attribute.success;
      delete attribute.success;
    }
    this._last_drawOkCallback = drawOkCallback;
    this._last_attribute = attribute;

    this.stopDraw();
    entity = this.drawCtrl[type].activate(entity, drawOkCallback);
    return entity;
  }
  //外部控制，完成绘制，比如手机端无法双击结束
  endDraw() {
    for (var type in this.drawCtrl) {
      if (this.drawCtrl[type].endDraw) this.drawCtrl[type].endDraw();
    }
    return this;
  }
  stopDraw() {
    this.stopEditing();
    for (var type in this.drawCtrl) {
      this.drawCtrl[type].disable(true);
    }
    return this;
  }
  closeTooltip() {
    if (!this.tooltip) return;

    this.tooltip.setVisible(false);
    if (this.tiptimeTik) {
      clearTimeout(this.tiptimeTik);
      delete this.tiptimeTik;
    }
  }
  //==========编辑相关==========
  // currEditFeature: null,      //当前编辑的要素
  getCurrentEntity() {
    return this.currEditFeature;
  }
  // _hasEdit: null,
  hasEdit(val) {
    if (this._hasEdit !== null && this._hasEdit === val) return;

    this._hasEdit = val;
    if (val) {
      this.bindSelectEvent();
    } else {
      this.stopEditing();
      this.destroySelectEvent();
    }
  }
  //绑定鼠标选中事件
  bindSelectEvent() {
    var _that = this;
    //选取对象
    var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    if(this.mouseEdit){ //是否开启鼠标编辑事件
      handler.setInputAction(
        event => {
          if (!this._hasEdit || this.drawing) return; //无法编辑或还在绘制中时，跳出
  
          var pickedObject = this.viewer.scene.pick(event.position, 5, 5);
          if (Cesium.defined(pickedObject)) {
            var entity = pickedObject.id;
            if (this.currEditFeature && this.currEditFeature === entity) return; //重复单击了跳出
  
            if (
              entity &&
              entity instanceof Cesium.Entity &&
              !entity.inProgress &&
              this.isMyEntity(entity) &&
              Cesium.defaultValue(entity.hasEdit, true)
            ) {
              this.startEditing(entity);
              this.closeTooltip();
              if (entity.draw_tooltip) {
                this.tooltip.showAt(event.position, entity.draw_tooltip);
              }
              return;
            }
          }
          this.stopEditing();
        },
        this.options.editEvent == "dblclick"
          ? Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
          : Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
  
      if (this.options.editEvent == "dblclick") {
        message.edit.start = message.edit.start.replace("单击", "双击");
        this.viewer.das.on(eventType.clickMap, event => {
          this.stopEditing();
        });
      }
    }else{
      this.viewer.das.on(eventType.clickMap, event => {
        this.stopEditing();
      });
    }

    //编辑提示事件
    handler.setInputAction(event => {
      if (!this._hasEdit || this.drawing) return; //无法编辑或还在绘制中时，跳出

      //正在拖拽其他的entity时，跳出
      if (!this.viewer.scene.screenSpaceCameraController.enableInputs) return;

      this.closeTooltip();

      var pickedObject = this.viewer.scene.pick(event.endPosition, 5, 5);
      if (Cesium.defined(pickedObject)) {
        var entity = pickedObject.id;
        if (
          entity &&
          entity instanceof Cesium.Entity &&
          Cesium.defaultValue(entity.hasEdit, true) &&
          entity.editing &&
          !entity.inProgress &&
          _that.mouseEdit &&
          this.isMyEntity(entity)
        ) {
          var tooltip = this.tooltip;

          //删除右键菜单打开了不显示tooltip
          if (
            this.viewer.das.contextmenu &&
            this.viewer.das.contextmenu.show &&
            this.viewer.das.contextmenu.target == entity
          )
            return;

          this.tiptimeTik = setTimeout(function() {
            //edit中的MOUSE_MOVE会关闭提示，延迟执行。
            tooltip.showAt(event.endPosition, message.edit.start);
          }, 100);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.selectHandler = handler;
  }
  destroySelectEvent() {
    this.selectHandler && this.selectHandler.destroy();
    this.selectHandler = undefined;
  }
  startEditing(entity) {
    this.stopEditing();
    if (entity == null || !this._hasEdit) return;

    if (entity.editing && entity.editing.activate) {
      entity.editing.activate();
    }
    this.currEditFeature = entity;
  }
  stopEditing() {
    this.closeTooltip();
    if (
      this.currEditFeature &&
      this.currEditFeature.editing &&
      this.currEditFeature.editing.disable
    ) {
      this.currEditFeature.editing.disable();
    }
    this.currEditFeature = null;
  }
  //修改了属性
  updateAttribute(attribute, entity) {
    if (entity == null) entity = this.currEditFeature;
    if (entity == null || attribute == null) return;

    attribute.style = attribute.style || {};
    attribute.attr = attribute.attr || {};

    //更新属性
    var type = entity.attribute.type;
    this.drawCtrl[type].style2Entity(attribute.style, entity);
    entity.attribute = attribute;

    //如果在编辑状态，更新绑定的拖拽点
    if (entity.editing) {
      if (entity.editing.updateAttrForEditing) entity.editing.updateAttrForEditing();

      if (entity.editing.updateDraggers) entity.editing.updateDraggers();
    }

    return entity;
  }
  updateStyle(style, entity) {
    if (entity == null) entity = this.currEditFeature;
    if (entity == null) return;

    var type = entity.attribute.type;

    var oldstyle = entity.attribute.style || {};
    for (var key in style) {
      oldstyle[key] = style[key];
    }
    this.drawCtrl[type].style2Entity(oldstyle, entity);
  }

  //修改坐标、高程
  setPositions(positions, entity) {
    if (entity == null) entity = this.currEditFeature;
    if (entity == null || positions == null) return;

    //如果在编辑状态，更新绑定的拖拽点
    if (entity.editing) {
      entity.editing.setPositions(positions);
      entity.editing.updateDraggers();
    }
    return entity;
  }

  //绑定扩展的右键、popup等处理
  bindExtension(entity) {
    var that = this;

    entity.eventTarget = this;

    entity.hasDrawEdit = () => {
      return this.edit;
    };

    //右键菜单
    entity.contextmenuItems = entity.contextmenuItems || [];
    entity.contextmenuItems.push({
      text: "删除对象",
      iconCls: "fa fa-trash-o",
      visible: function(e) {
        that.closeTooltip();

        var entity = e.target;
        if (entity.inProgress && !entity.editing) return false;

        if (Cesium.defined(that.options.hasDel))
          if (typeof that.options.hasDel === "function")
            return that._hasEdit && that.options.hasDel(e);
          else return that._hasEdit && that.options.hasDel;
        else return that._hasEdit;
      },
      callback: function(e) {
        var entity = e.target;

        if (entity.editing && entity.editing.disable) {
          entity.editing.disable();
        }
        that.deleteEntity(entity);
      }
    });

    //名称 绑定到tooltip
    if (this.options.nameTooltip) {
      entity.tooltip = {
        visible: function() {
          return !that._hasEdit;
        },
        html: function(entity) {
          if (entity.attribute.attr && entity.attribute.attr.name)
            return entity.attribute.attr.name;
          else return null;
        }
      };
    }

    if (this.popup) {
      entity.popup = {
        visible: function(entity) {
          return that.popup.enable;
        },
        html: function(entity) {
          var html = util.getPopup(
            [
              ...that.popup.columns,
              that.popup.edit ? { field: "id", name: "确定", type: "button" } : null
            ],
            entity.attribute.attr,
            {
              title: that.popup.title || "属性信息",
              edit: that.popup.edit,
              width: 200
            }
          );
          return html;
        },
        onAdd: function(eleId, entity) {
          //popup的DOM添加到页面的回调方法
          zepto("#" + eleId + " .das3d-popup-btn").click(function(e) {
            zepto("#" + eleId + " .das3d-popup-edititem").each(function() {
              var val = zepto(this).val();
              var key = zepto(this).attr("data-type");
              entity.attribute.attr[key] = val;
            });
            that.viewer.das.popup.close();
            if (that.popup.callback) that.popup.callback();
          });
        },
        onRemove: function(eleId, entity) {
          //popup的DOM从页面移除的回调方法
        },
        anchor: this.popup.enable.anchor || [0, -20]
      };
    }
  }
  //==========删除相关==========
  //删除单个
  deleteEntity(entity) {
    if (entity == null) entity = this.currEditFeature;
    if (entity == null) return;

    if (entity.editing) {
      entity.editing.destroy();
      delete entity.editing;
    }
    if (entity.featureEx) {
      entity.featureEx.destroy();
      delete entity.featureEx;
    }

    if (entity.entityCollection.contains(entity)) entity.entityCollection.remove(entity);

    this.fire(eventType.delete, { entity: entity });
  }
  remove(entity) {
    //兼容不同习惯命名
    return this.deleteEntity(entity);
  }
  //是否为当前编辑器编辑的标号
  isMyEntity(entity) {
    if (!entity || !(entity instanceof Cesium.Entity)) return false;

    for (var i = 0; i < this.arrGroup.length; i++) {
      var layer = this.arrGroup[i];
      if (layer.entities.contains(entity)) return true;
    }
    return false;
  }
  removeByGroup(layer) {
    var arrEntity = layer.entities.values;
    for (var i = 0, len = arrEntity.length; i < len; i++) {
      var entity = arrEntity[i];
      if (entity.editing) {
        entity.editing.destroy();
        delete entity.editing;
      }
      if (entity.featureEx) {
        entity.featureEx.destroy();
        delete entity.featureEx;
      }
    }
    layer.entities.removeAll();
  }
  //删除所有
  deleteAll() {
    //兼容不同习惯命名
    this.removeAll();
  }
  clearDraw() {
    //兼容不同习惯命名
    this.removeAll();
  }
  removeAll() {
    this.stopDraw();

    for (var i = 0; i < this.arrGroup.length; i++) {
      this.removeByGroup(this.arrGroup[i]);
    }

    return this;
  }
  //==========转换GeoJSON==========
  //转换当前所有为geojson
  toGeoJSON(entity) {
    this.stopDraw();

    if (entity == null) {
      //全部数据
      var features = [];
      var groupName = [];
      for (var k = 0; k < this.arrGroup.length; k++) {
        var layer = this.arrGroup[k];
        groupName.push(layer.name);
        features = features.concat(this.getJsonByGroup(layer));
      }

      return {
        type: "FeatureCollection",
        group: groupName,
        features: features
      };
    } else if (entity instanceof Cesium.CustomDataSource) {
      return {
        type: "FeatureCollection",
        features: this.getJsonByGroup(entity)
      };
    } else {
      var type = entity.attribute.type;
      var geojson = this.drawCtrl[type].toGeoJSON(entity);
      geojson = attr.removeGeoJsonDefVal(geojson);
      return geojson;
    }
  }
  getJsonByGroup(layer) {
    var features = [];
    var arrEntity = layer.entities.values;
    for (var i = 0, len = arrEntity.length; i < len; i++) {
      var entity = arrEntity[i];
      if (entity.attribute == null || entity.attribute.type == null) continue;

      var type = entity.attribute.type;
      var geojson = this.drawCtrl[type].toGeoJSON(entity);
      if (geojson == null) continue;
      geojson = attr.removeGeoJsonDefVal(geojson);
      geojson.properties.group = layer.name; //记录分组信息

      features.push(geojson);
    }
    return features;
  }

  //加载goejson数据
  jsonToEntity(json, isClear, isFly) {
    //兼容旧版本方法名
    return this.loadJson(json, {
      clear: isClear,
      flyTo: isFly
    });
  }
  loadJson(json, opts) {
    opts = opts || {};

    var jsonObjs = json;
    try {
      if (util.isString(json)) jsonObjs = JSON.parse(json);
    } catch (e) {
      util.alert(e.name + ": " + e.message + " \n请确认json文件格式正确!!!");
      return;
    }

    if (opts.clear) {
      this.clearDraw();
    }

    var arrthis = [];
    var jsonFeatures = jsonObjs.features ? jsonObjs.features : [jsonObjs];

    //存在分组信息
    var groupName = jsonObjs.group;
    if (groupName) {
      for (var k = 0; k < groupName.length; k++) {
        this.addOrGetGroup(groupName[k]);
      }
    }

    for (var i = 0, len = jsonFeatures.length; i < len; i++) {
      var feature = jsonFeatures[i];

      if (!feature.properties || !feature.properties.type) {
        //非本身保存的外部其他geojson数据
        feature.properties = feature.properties || {};
        switch (feature.geometry.type) {
          case "MultiPolygon":
          case "Polygon":
            feature.properties.type = "polygon";
            break;
          case "MultiLineString":
          case "LineString":
            feature.properties.type = "polyline";
            break;
          case "MultiPoint":
          case "Point":
            feature.properties.type = "point";
            break;
        }
      }
      feature.properties.style = opts.style || feature.properties.style || {};
      feature.properties.attr = feature.properties.attr || {};

      if (opts.onEachFeature)
        //添加到地图前 回调方法
        opts.onEachFeature(feature, feature.properties.type, i);

      var type = feature.properties.type;
      if (this.drawCtrl[type] == null) {
        daslog.warn("数据无法识别或者数据的[" + type + "]类型参数有误");
        continue;
      }

      var entity = this.getEntityById(feature.properties.attr.id);
      if (entity) {
        this.updateStyle(feature.properties.style, entity);

        var positions = getPositionByGeoJSON(feature);
        if (positions) this.setPositions(positions, entity);
      } else {
        entity = this.addFeature(type, feature);
      }

      if (opts.onEachEntity)
        //添加到地图后回调方法
        opts.onEachEntity(feature, entity, i);

      arrthis.push(entity);
    }

    if (opts.flyTo) {
      this.viewer.das.flyTo(arrthis);
    }

    return arrthis;
  }

  //外部添加billboard点数据
  addBillboard(point, style) {
    if (point instanceof Cesium.Cartesian3) {
      point = pointconvert.cartesian2lonlat(point);
    }
    var type = "billboard";

    var feature = {
      type: "Feature",
      properties: { style: style },
      geometry: { type: "Point", coordinates: point }
    };

    var entity = this.addFeature(type, feature);
    return entity;
  }
  //外部添加billboard点数据
  addPoint(point, style) {
    if (point instanceof Cesium.Cartesian3) {
      point = pointconvert.cartesian2lonlat(point);
    }

    var type = "point";

    var feature = {
      type: "Feature",
      properties: { style: style },
      geometry: { type: "Point", coordinates: point }
    };

    var entity = this.addFeature(type, feature);
    return entity;
  }
  //外部添加线数据
  addPolyline(coordinates, style) {
    var type = "polyline";

    var feature = {
      type: "Feature",
      properties: { style: style },
      geometry: {
        type: "LineString",
        coordinates: coordinates
      }
    };

    var entity = this.addFeature(type, feature);
    return entity;
  }
  //外部添加面数据
  addPolygon(coordinates, style) {
    var type = "polygon";

    var feature = {
      type: "Feature",
      properties: { style: style },
      geometry: {
        type: "Polygon",
        coordinates: [coordinates]
      }
    };

    var entity = this.addFeature(type, feature);
    return entity;
  }
  //外部添加数据（内部使用的）
  addFeature(type, geojson) {
    geojson.properties.type = type;
    geojson.properties.style = geojson.properties.style || {};

    //赋默认值
    geojson.properties = attr.addGeoJsonDefVal(geojson.properties);

    //或者分组
    var group = this.addOrGetGroup(geojson.properties.group);

    var entity = this.drawCtrl[type].jsonToEntity(geojson, group);
    this.bindExtension(entity);
    return entity;
  }
  //属性转entity
  attributeToEntity(attribute, positions) {
    var entity = this.drawCtrl[attribute.type].attributeToEntity(attribute, positions);
    this.bindExtension(entity);
    return entity;
  }
  //绑定外部非Draw产生的entity到标绘
  bindExtraEntity(entity, attribute) {
    attribute = attribute || {};
    attribute.type = attribute.type || attr.getTypeName(entity);
    attribute.style = attribute.style || {};
    // attribute = attr.addGeoJsonDefVal(attribute);

    entity = this.drawCtrl[attribute.type].bindExtraEntity(entity, attribute);
    this.bindExtension(entity);

    entity.entityCollection.remove(entity); //从原有的集合中删除
    this.dataSource.entities.add(entity); //加入到draw集合图层中
  }
  //==========对外接口==========
  setVisible(visible) {
    this._visible = visible;
    if (!visible) {
      this.stopDraw();
    }

    for (var i = 0; i < this.arrGroup.length; i++) {
      var layer = this.arrGroup[i];
      layer.show = visible;
    }
  }
  //是否存在绘制
  hasDraw() {
    for (var i = 0; i < this.arrGroup.length; i++) {
      var layer = this.arrGroup[i];
      if (layer.entities.values.length > 0) return true;
    }
    return false;
  }
  //获取所有绘制的实体对象列表
  getEntitys(noStop) {
    if (!noStop) this.stopDraw();

    var arr = [];
    for (var i = 0; i < this.arrGroup.length; i++) {
      var layer = this.arrGroup[i];
      var arrEntity = layer.entities.values;
      for (var j = 0, len = arrEntity.length; j < len; j++) {
        var entity = arrEntity[j];
        entity.attribute.group = layer.name; //记录分组信息
        arr.push(entity);
      }
    }
    return arr;
  }

  getEntityById(id) {
    if (!id) return null;

    var arrEntity = this.getEntitys();
    for (var i = 0, len = arrEntity.length; i < len; i++) {
      var entity = arrEntity[i];
      if (id == entity.attribute.attr.id) {
        return entity;
      }
    }
    return null;
  }
  //获取实体的经纬度值 坐标数组
  getCoordinates(entity) {
    var type = entity.attribute.type;
    var coor = this.drawCtrl[type].getCoordinates(entity);
    return coor;
  }
  //获取实体的坐标数组
  getPositions(entity) {
    var type = entity.attribute.type;
    var positions = this.drawCtrl[type].getPositions(entity);
    return positions;
  }

  flyTo(entity, opts) {
    this.viewer.das.flyTo(entity, opts);
  }

  destroy() {
    this.stopDraw();
    this.hasEdit(false);

    for (var type in this.drawCtrl) {
      this.drawCtrl[type].destroy();
    }
    delete this.drawCtrl;
    this.clearDraw();

    for (var i = 0; i < this.arrGroup.length; i++) {
      var layer = this.arrGroup[i];
      if (this.viewer.dataSources.contains(layer)) {
        this.viewer.dataSources.remove(layer, true);
      }
    }
    if (this.tooltip) {
      this.tooltip.destroy();
      delete this.tooltip;
    }

    super.destroy();
  }
}
//[静态属性]本类中支持的事件类型常量
Draw.event = {
  drawStart: eventType.drawStart,
  drawAddPoint: eventType.drawAddPoint,
  drawRemovePoint: eventType.drawRemovePoint,
  drawMouseMove: eventType.drawMouseMove,
  drawCreated: eventType.drawCreated,
  editStart: eventType.editStart,
  editMouseDown: eventType.editMouseDown,
  editMouseMove: eventType.editMouseMove,
  editMovePoint: eventType.editMovePoint,
  editRemovePoint: eventType.editRemovePoint,
  editStyle: eventType.editStyle,
  editStop: eventType.editStop,
  delete: eventType.delete,
  load: eventType.load,

  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};

//绑定到draw，方便外部使用
Draw.Base = DrawBase;
Draw.Billboard = DrawBillboard;
Draw.Circle = DrawCircle;
Draw.Cylinder = DrawCylinder;
Draw.Corridor = DrawCorridor;
Draw.Curve = DrawCurve;
Draw.Ellipsoid = DrawEllipsoid;
Draw.Label = DrawLabel;
Draw.Model = DrawModel;
Draw.Point = DrawPoint;
Draw.Polygon = DrawPolygon;
Draw.Polyline = DrawPolyline;
Draw.PolylineVolume = DrawPolylineVolume;
Draw.Rectangle = DrawRectangle;
Draw.Wall = DrawWall;
Draw.PolygonEx = DrawPolygonEx;
