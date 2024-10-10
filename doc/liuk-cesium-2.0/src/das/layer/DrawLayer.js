import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { zepto } from "../util/zepto";
import { BaseLayer } from "./base/BaseLayer";
import { Draw } from "../draw/Draw";
import { getPopupForConfig, getTooltipForConfig, bindLayerPopup } from "../util/util";
import * as daslog from "../util/log";

export class DrawLayer extends BaseLayer {
  get layer() {
    if (this.drawControl) return this.drawControl.dataSource;
    else return null;
  }
  create() {
    this.drawControl = new Draw(this.viewer, {
      hasEdit: false,
      nameTooltip: false,
      removeScreenSpaceEvent: false
    });
  }
  //添加
  add() {
    if (this._isload) this.drawControl.setVisible(true);
    else this._loadData();
    super.add();
  }
  //移除
  remove() {
    this.drawControl.setVisible(false);
    super.remove();
  }
  //定位至数据区域
  centerAt(duration) {
    var arr = this.drawControl.getEntitys();
    this.viewer.das.flyTo(arr, { duration: duration });
  }

  _loadData() {
    var that = this;
    zepto.ajax({
      type: "get",
      dataType: "json",
      url: this.options.url,
      timeout: 10000,
      success: function(data) {
        that._isload = true;
        var arr = that.drawControl.jsonToEntity(data, true, that.options.flyTo);
        that._bindEntityConfig(arr);

        that.fireMap(eventType.load, {
          draw: that.drawControl,
          entities: arr
        });

        if (that.options.flyTo) that.centerAtByFlyEnd();
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        daslog.warn("json文件加载失败！", that.options);
      }
    });
  }
  _bindEntityConfig(arrEntity) {
    var that = this;

    for (var i = 0, len = arrEntity.length; i < len; i++) {
      var entity = arrEntity[i];

      //popup弹窗
      if (this.options.columns || this.options.popup) {
        entity.popup = bindLayerPopup(this.options.popup, function(inhtml, entity) {
          var attr = entity.attribute.attr;
          attr.layer_name = that.options.name;
          attr.draw_type = entity.attribute.type;
          attr.draw_typename = entity.attribute.name;
          return getPopupForConfig(
            {
              name: that.options.name,
              popup: inhtml,
              popupNameField: that.options.popupNameField
            },
            attr
          );
        });
      }
      if (this.options.tooltip) {
        entity.tooltip = bindLayerPopup(this.options.tooltip, function(inhtml, entity) {
          var attr = entity.attribute.attr;
          attr.layer_name = that.options.name;
          attr.draw_type = entity.attribute.type;
          attr.draw_typename = entity.attribute.name;
          return getTooltipForConfig(
            {
              name: that.options.name,
              tooltip: inhtml,
              tooltipNameField: that.options.tooltipNameField
            },
            attr
          );
        });
      }
      entity.eventTarget = this;

      if (this.options.contextmenuItems) {
        entity.contextmenuItems = this.options.contextmenuItems;
      }
    }
  }

  //刷新事件
  refreshEvent() {
    var arrEntity = this.drawControl.getEntitys();
    for (var i = 0, len = arrEntity.length; i < len; i++) {
      var entity = arrEntity[i];

      entity.eventTarget = this;
      entity.contextmenuItems = this.options.contextmenuItems;
    }
    return true;
  }

  updateStyle(style) {
    var arrEntity = this.drawControl.getEntitys();
    for (var i = 0, len = arrEntity.length; i < len; i++) {
      var entity = arrEntity[i];
      this.drawControl.updateStyle(style, entity);
    }
    return arrEntity;
  }
}
