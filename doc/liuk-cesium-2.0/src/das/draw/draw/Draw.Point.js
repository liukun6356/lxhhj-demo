import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import { getCurrentMousePosition } from "../../util/point";

import * as attr from "../attr/Attr.Point";
import { style2Entity as labelStyle2Entity } from "../attr/Attr.Label";
import { message } from "../core/Tooltip";
import { EditPoint } from "../edit/Edit.Point";
import { DrawBase } from "./Draw.Base";

export class DrawPoint extends DrawBase {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "point";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditPoint; //获取编辑对象
  }

  //根据attribute参数创建Entity
  createFeature(attribute, dataSource) {
    dataSource = dataSource || this.dataSource;
    this._positions_draw = null;

    //绘制时，是否自动隐藏entity，可避免拾取坐标存在问题。
    var _drawShow = Cesium.defaultValue(attribute.drawShow, false);

    var that = this;
    var addattr = {
      show: _drawShow,
      _drawShow: _drawShow, //edit编辑时使用
      position: new Cesium.CallbackProperty(time => {
        return that.getDrawPosition();
      }, false),
      point: attr.style2Entity(attribute.style),
      attribute: attribute
    };

    if (attribute.style && attribute.style.label) {
      //同时加文字
      addattr.label = labelStyle2Entity(attribute.style.label);
    }

    this.entity = dataSource.entities.add(addattr); //创建要素对象
    //子类使用
    if (this.createFeatureEx) this.createFeatureEx(attribute.style, this.entity);
    return this.entity;
  }
  //重新激活绘制
  reCreateFeature(entity) {
    this.entity = entity;
    this._positions_draw = entity.position;
    return this.entity;
  }
  style2Entity(style, entity) {
    if (style && style.label) {
      //同时加文字
      labelStyle2Entity(style.label, entity.label);
    }
    if (entity.featureEx) {
      entity.featureEx.updateStyle(style);
    }
    return attr.style2Entity(style, entity.point);
  }
  //绑定鼠标事件
  bindEvent() {
    this.getHandler().setInputAction(event => {
      var point = getCurrentMousePosition(this.viewer.scene, event.endPosition, this.entity);
      if (point) {
        this._positions_draw = point;
        if (this.entity.featureEx) {
          this.entity.featureEx.position = point;
        }
      }
      this.tooltip.showAt(event.endPosition, this.entity.draw_tooltip || message.draw.point.start);

      this.fire(eventType.drawMouseMove, {
        drawtype: this.type,
        entity: this.entity,
        position: point
      });
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.getHandler().setInputAction(event => {
      var point = getCurrentMousePosition(this.viewer.scene, event.position, this.entity);
      if (point) {
        this._positions_draw = point;
      }

      if (this._positions_draw && this.isLoadOk()) this.disable();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }
  //子类使用，gltf时判断是否加载完成
  isLoadOk() {
    return true;
  }
  //获取外部entity的坐标到_positions_draw
  setDrawPositionByEntity(entity) {
    var positions = this.getPositions(entity);
    this._positions_draw = positions[0];
  }
  //图形绘制结束,更新属性
  finish() {
    this.entity.show = true;

    this.entity.editing = this.getEditClass(this.entity); //绑定编辑对象
    this.entity.position = this.getDrawPosition();
    if (this.entity.featureEx) {
      this.entity.featureEx.position = this.getDrawPosition();
      this.entity.featureEx.finish();
    }
  }
}
