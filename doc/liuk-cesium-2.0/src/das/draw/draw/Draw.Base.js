import * as Cesium from "cesium";
import { formatNum, getPositionByGeoJSON } from "../../util/point";
import { DasClass, eventType } from "../../core/DasClass";

export class DrawBase extends DasClass {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.viewer = opts.viewer;
    this.dataSource = opts.dataSource;
    this.tooltip = opts.tooltip;

    this._positions_draw = null; //坐标位置相关
    this.editClass = null; //编辑对象
    this.attrClass = null; //对应的属性控制静态类
  }

  get enabled() {
    return this._enabled;
  }

  fire(type, data, propagate) {
    if (this._fire) this._fire(type, data, propagate);
  }

  formatNum(num, digits) {
    return formatNum(num, digits);
  }

  enableControl(value) {
    if (this.viewer.das.popup) this.viewer.das.popup.enable = value;
    if (this.viewer.das.tooltip) this.viewer.das.tooltip.enable = value;
    if (this.viewer.das.contextmenu) this.viewer.das.contextmenu.enable = value;
  }
  //激活绘制
  activate(attribute, drawOkCallback, dataSource) {
    if (this._enabled) {
      return this;
    }
    this._enabled = true;
    this.drawOkCallback = drawOkCallback;

    if (attribute instanceof Cesium.Entity) {
      this.reCreateFeature(attribute);
    } else {
      this.createFeature(attribute, dataSource);
    }

    if (this.entity) this.entity.inProgress = true;

    this.setCursor(true);
    this.enableControl(false);
    this.bindEvent();

    this.fire(eventType.drawStart, { drawtype: this.type, entity: this.entity });

    return this.entity;
  }
  //释放绘制
  disable(hasWB) {
    if (!this._enabled) {
      return this;
    }
    this._enabled = false;

    this.setCursor(false);
    this.enableControl(true);

    if (hasWB && this.entity.inProgress) {
      //外部释放时，尚未结束的标绘移除。
      if (this.entity.entityCollection.contains(this.entity))
        this.entity.entityCollection.remove(this.entity);

      this.destroyHandler();
      this.tooltip.setVisible(false);
    } else {
      var entity = this.entity;
      this.entity.inProgress = false;
      this.finish();

      this.destroyHandler();
      this.tooltip.setVisible(false);
      this._positions_draw = null;
      this.entity = null;

      if (this.drawOkCallback) {
        this.drawOkCallback(entity);
        delete this.drawOkCallback;
      }
      this.fire(eventType.drawCreated, { drawtype: this.type, entity: entity });
    }

    return this;
  }
  createFeature(attribute, dataSource) {}
  reCreateFeature(entity) {}
  //============= 事件相关 =============
  getHandler() {
    if (!this.handler || this.handler.isDestroyed()) {
      this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    }
    return this.handler;
  }
  destroyHandler() {
    this.handler && this.handler.destroy();
    this.handler = undefined;
  }
  setCursor(val) {
    this.viewer._container.style.cursor = val ? "crosshair" : "";
  }
  //绑定鼠标事件
  bindEvent() {}
  //=============  =============
  //坐标位置相关
  getDrawPosition() {
    return this._positions_draw;
  }
  //获取编辑对象
  getEditClass(entity) {
    if (this.editClass == null) return null;

    var _edit = new this.editClass(entity, this.viewer);
    if (this._minPointNum != null) _edit._minPointNum = this._minPointNum;
    if (this._maxPointNum != null) _edit._maxPointNum = this._maxPointNum;

    _edit._fire = this._fire;
    _edit.tooltip = this.tooltip;

    return _edit;
  }
  //更新坐标后调用下，更新相关属性，子类使用
  updateAttrForDrawing(isLoad) {}
  //图形绘制结束后调用
  finish() {}
  //通用方法
  getCoordinates(entity) {
    return this.attrClass.getCoordinates(entity);
  }
  getPositions(entity) {
    return this.attrClass.getPositions(entity);
  }
  toGeoJSON(entity) {
    return this.attrClass.toGeoJSON(entity);
  }
  //属性转entity
  attributeToEntity(attribute, positions, dataSource) {
    var entity = this.createFeature(attribute, dataSource);
    this._positions_draw = positions;
    this.updateAttrForDrawing(true);
    this.finish();
    return entity;
  }
  //geojson转entity
  jsonToEntity(geojson, dataSource) {
    var attribute = geojson.properties;
    var positions = getPositionByGeoJSON(geojson);
    return this.attributeToEntity(attribute, positions, dataSource);
  }
  setDrawPositionByEntity(entity) {
    var positions = this.getPositions(entity);
    this._positions_draw = positions;
  }
  //绑定外部entity到标绘
  bindExtraEntity(entity, attribute) {
    this.entity = entity;
    entity.attribute = attribute;

    if (attribute.style) this.style2Entity(attribute.style, entity);

    this.setDrawPositionByEntity(entity);

    this.updateAttrForDrawing(true);
    this.finish();
    return entity;
  }

  destroy() {
    this.disable();
    super.destroy();
  }
}
