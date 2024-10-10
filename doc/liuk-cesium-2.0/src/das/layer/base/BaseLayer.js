import * as Cesium from "cesium";
import { DasClass, eventType } from "../../core/DasClass";
import { msg } from "../../util/util";
import * as daslog from "../../util/log";

export class BaseLayer extends DasClass {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      var temppar = options;
      options = viewer;
      viewer = temppar;
    }
    if (options.calback) {
      var callbackfun = options.calback;
      delete options.calback;
      this.on(eventType.load, event => {
        callbackfun(event.tileset);
      });
    }
    if (options.click) {
      var clickfun = options.click;
      delete options.click;
      this.on(eventType.click, event => {
        clickfun(event.sourceTarget, event);
      });
    }
    if (options.mouseover) {
      var mouseoverfun = options.mouseover;
      delete options.mouseover;
      this.on(eventType.mouseOver, event => {
        mouseoverfun(event.sourceTarget, event);
      });
    }
    if (options.mouseout) {
      var mouseoutfun = options.mouseout;
      delete options.mouseout;
      this.on(eventType.mouseOut, event => {
        mouseoutfun(event.sourceTarget, event);
      });
    }
    this.config = options;
    this.getVisible = () => {
      return this.visible;
    };
    this.setVisible = val => {
      this.visible = val;
    };
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = viewer;
    this.options = options; //配置的config信息

    this.name = options.name;
    this.hasZIndex = Cesium.defaultValue(options.hasZIndex, false);
    this.hasOpacity = Cesium.defaultValue(options.hasOpacity, false);
    this._opacity = Cesium.defaultValue(options.opacity, 1);
    if (options.hasOwnProperty("alpha")) this._opacity = Number(options.alpha);

    //单体化时，不可调整透明度
    if (options.dth) {
      this.hasOpacity = false;

      options.symbol = options.symbol || {};
      options.symbol.styleOptions = options.symbol.styleOptions || {};
      options.symbol.styleOptions.clampToGround = true;
    }

    this.create();

    this._visible = false;
    if (options.visible) {
      if (this.options.visibleTimeout) {
        setTimeout(() => {
          this.visible = true;
        }, this.options.visibleTimeout);
      } else {
        this.visible = true;
      }

      if (options.flyTo) {
        this.centerAtByFlyEnd(this.options.flyToDuration || 0);
      }
    }
  }
  //========== 对外属性 ==========
  get visible() {
    return this._visible;
  }
  set visible(val) {
    if (this._visible == val) return;

    this._visible = val;
    this.options.visible = val;

    if (val) {
      if (this.options.msg) msg(this.options.msg);
      this.add();
    } else {
      this.remove();
    }
  }

  get opacity() {
    return this._opacity;
  }
  set opacity(val) {
    this.setOpacity(val);
  }

  //提示框
  get popup() {
    return this.options.popup;
  }
  set popup(value) {
    this.options.popup = value;
  }
  get tooltip() {
    return this.options.tooltip;
  }
  set tooltip(value) {
    this.options.tooltip = value;
  }

  //========== 方法==========
  create() {
    if (this.options.onCreate) {
      this.options.onCreate(this.viewer);
    }
  }
  showError(title, error) {
    if (!error) error = "未知错误";

    if (this.viewer) this.viewer.cesiumWidget.showErrorPanel(title, undefined, error);

    daslog.warn("layer错误:" + title + error);
  }

  //添加
  add() {
    this._visible = true;
    this.options.visible = this._visible;

    if (this.options.onAdd) {
      this.options.onAdd(this.viewer);
    }
    this.fireMap(eventType.add);
  }
  //移除
  remove() {
    this._visible = false;
    this.options.visible = this._visible;

    if (this.options.onRemove) {
      this.options.onRemove(this.viewer);
    }
    this.fireMap(eventType.remove);
  }
  //定位至数据区域
  centerAt(duration) {
    if (this.options.extent || this.options.center) {
      this.viewer.das.centerAt(this.options.extent || this.options.center, {
        duration: duration,
        isWgs84: true
      });
    } else if (this.options.onCenterAt) {
      this.options.onCenterAt(duration, this.viewer);
    }
  }
  centerAtByFlyEnd(duration) {
    if (this.viewer.das.isFlyAnimation()) {
      this.viewer.das.openFlyAnimationEndFun = () => {
        duration = Cesium.defined(duration) ? duration : this.options.flyToDuration;
        this.centerAt(duration);
      };
    } else {
      this.centerAt(0);
    }
  }

  //设置透明度
  setOpacity(value) {
    if (this.options.onSetOpacity) {
      this.options.onSetOpacity(value, this.viewer);
    }
  }
  //设置叠加顺序
  setZIndex(value) {
    if (this.options.onSetZIndex) {
      this.options.onSetZIndex(value, this.viewer);
    }
  }

  //同时在viewer.das上抛出事件
  fireMap(type, data, propagate) {
    data = data || {};
    data.sourceTarget = this;

    this.fire(type, data, propagate);
    this.viewer.das.fire(type, data, propagate);
    return this;
  }

  destroy() {
    this.visible = false;
    super.destroy();
  }
}

//[静态属性]本类中支持的事件类型常量
BaseLayer.event = {
  add: eventType.add,
  remove: eventType.remove,
  load: eventType.load,
  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};
