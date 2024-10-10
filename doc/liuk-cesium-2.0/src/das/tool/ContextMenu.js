import * as Cesium from "cesium";
import { zepto } from "../util/zepto";
import * as point from "../util/point";
import * as daslog from "../util/log";

export class ContextMenu {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    this.viewer = viewer;
    this.viewerid = viewer._container.id;

    this._enable = true;
    this.menuIndex = 0;
    this.objMenu = {};

    //添加弹出框
    var infoDiv = `<div id="${this.viewerid}-das3d-contextmenu" class="das3d-contextmenu" style="display:none;">
                            <ul id="${this.viewerid}-das3d-contextmenu-ul" class="das3d-contextmenu-ul"> 
                            </ul>
                        </div>`;
    zepto("#" + viewer._container.id).append(infoDiv);

    this._contextmenuDOM = zepto("#" + this.viewerid + "-das3d-contextmenu");
    this._contextmenuULDOM = zepto("#" + this.viewerid + "-das3d-contextmenu-ul");

    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(event => {
      this.close();
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(event => {
      this.close();
    }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
    handler.setInputAction(event => {
      this.close();
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
    handler.setInputAction(event => {
      this.close();
    }, Cesium.ScreenSpaceEventType.PINCH_START);
    handler.setInputAction(event => {
      this.close();
    }, Cesium.ScreenSpaceEventType.WHEEL);
    handler.setInputAction(event => {
      this.close();
      if (!this._enable) return;

      var position = event.position;

      var entity; //鼠标感知的对象，可能是entity或primitive
      var pickedObject = viewer.scene.pick(position, 5, 5);

      // fangmm 拾取到的第一个entity是鼠标按下显示的图标
      if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id) && pickedObject.id instanceof Cesium.Entity) {
        if (pickedObject.id.id === 'mouseCursorIcon') {
          pickedObject = viewer.scene.drillPick(position)[1];
        }
      }

      var contextmenuItems = viewer.das.contextmenuItems;
      //普通entity对象
      if (
        Cesium.defined(pickedObject) &&
        Cesium.defined(pickedObject.id) &&
        pickedObject.id instanceof Cesium.Entity
      ) {
        entity = pickedObject.id;
        if (Cesium.defined(entity.contextmenuItems)) contextmenuItems = entity.contextmenuItems;
      }
      //primitive对象
      else if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.primitive)) {
        entity = pickedObject.primitive;
        if (Cesium.defined(entity.contextmenuItems) || (Cesium.defined(entity._config) && Cesium.defined(entity._config.contextmenuItems))) contextmenuItems = entity.contextmenuItems || entity._config.contextmenuItems;
      }

      this.showView(contextmenuItems, position, entity);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.handler = handler;
  }

  //========== 对外属性 ==========

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

  get show() {
    return this._show;
  }
  get target() {
    return this._target;
  }

  //========== 方法 ==========

  showView(contextmenu, positionMouse, entity) {
    if (!contextmenu || contextmenu.length == 0) {
      this.close();
      return;
    }

    var cartesian = point.getCurrentMousePosition(this.viewer.scene, positionMouse);

    var inhtml = "";
    for (var i = 0, len = contextmenu.length; i < len; i++) {
      var item = contextmenu[i];
      var result = this.getItemHtml(item, {
        positionMouse: positionMouse,
        position: cartesian,
        target: entity
      });
      if (result) inhtml += result;
    }

    if (inhtml == "") {
      this.close();
      return;
    }

    var that = this;
    this._contextmenuULDOM.html(inhtml);
    zepto("#" + this.viewerid + "-das3d-contextmenu-ul .contextmenu-item").click(function(e) {
      var index = Number(zepto(this).attr("data-index"));
      var item = that.objMenu[index];
      var callback = item.callback || item.calback; //兼容不同参数名
      if (callback) {
        callback({
          positionMouse: positionMouse,
          position: cartesian,
          data: item,
          target: entity
        });
      }
      that.close();
    });

    //鼠标滑过弹出二级菜单
    zepto("#" + this.viewerid + "-das3d-contextmenu-ul .contextmenu-item").mouseover(function(e) {
      zepto(".das3d-sub-menu").hide(); //所有的二级菜单隐藏

      var sub_menu = this.querySelector(".das3d-sub-menu");
      if (sub_menu) {
        sub_menu.style.display = "block";
      }

      zepto("#" + that.viewerid + "-das3d-contextmenu-ul .active").removeClass("active");
      zepto(this).addClass("active");
    });

    var top = positionMouse.y;
    var left = positionMouse.x;
    this._contextmenuDOM
      .css({
        //不显示前，无法计算width和width
        top: top,
        left: left
      })
      .show();
    this._show = true;
    this._target = entity;

    var menuHeight = this._contextmenuDOM.height();
    var menuWidth = this._contextmenuDOM.width();

    zepto("#" + this.viewerid + "-das3d-contextmenu-ul .das3d-sub-menu").css({
      left: menuWidth + 3 + "px"
    });

    //判断垂直方向 是否超过了 屏幕高度
    if (top + menuHeight > this.viewer.scene.canvas.clientHeight) {
      top -= menuHeight - 10;
      if (top <= 0) top = 0;
    } else {
      top += 10;
    }

    //判断水平方向 是否超过了屏幕宽度
    if (left + menuWidth > this.viewer.scene.canvas.clientWidth) {
      left -= menuWidth - 10;
      if (left <= 0) left = 0;
    } else {
      left += 10;
    }

    this._contextmenuDOM.css({
      top: top,
      left: left
    });
  }
  getItemHtml(item, eventresult) {
    if (item.hasOwnProperty("visible")) {
      var visible = item.visible;
      try {
        if (typeof visible === "function") {
          //回调方法
          eventresult.data = item;
          visible = item.visible(eventresult);
        }
      } catch (e) {
        daslog.error("右键菜单操作出错", e);
      }

      if (!visible) return null;
    }

    var inhtml;
    if (item.text) {
      var childrenHtml = "";
      var childTip = "";
      if (item.children) {
        childrenHtml = '<ul class="das3d-contextmenu-ul das3d-sub-menu">';
        for (var j = 0, len2 = item.children.length; j < len2; j++) {
          var childitem = item.children[j];
          eventresult.data = childitem;
          var result = this.getItemHtml(childitem, eventresult);
          if (result) childrenHtml += result;
        }
        childrenHtml += "</ul>";
        childTip = '&nbsp;&nbsp;<i class="fa fa-caret-right"></i>';
      }

      this.menuIndex++;
      this.objMenu[this.menuIndex] = item;

      inhtml = `<li class="contextmenu-item" data-index="${this.menuIndex}">
                        <a href="javascript:void(0)"><i class="${item.iconCls}"></i>${item.text}${childTip}</a>
                        ${childrenHtml}
                    </li>`;
    } else inhtml = '<li class="line"></li>';
    return inhtml;
  }

  close() {
    if (!this._show) return;
    this._contextmenuDOM.hide();
    this._show = false;
    this._target = null;
  }

  destroy() {
    this.close();

    this.handler.destroy();
    this._contextmenuDOM.remove();

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
