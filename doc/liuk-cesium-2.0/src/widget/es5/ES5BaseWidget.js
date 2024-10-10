import { Loader } from "../loader";
import { getCacheVersion, getDefWindowOptions } from "../widgetManager";
import { ES5Class } from "./ES5Class";

import { zepto } from "../../das/util/zepto";
import { isArray } from "../../das/util/util";
import * as daslog from "../../das/util/log";

var layer = window.layer; //请引入layer弹窗插件

var _resources_cache = [];

export var ES5BaseWidget = ES5Class.extend({
  viewer: null,
  options: {},
  config: {}, //配置的config信息
  path: "", //当前widget目录相对路径
  isActivate: false, //是否激活状态
  isCreate: false,
  initialize: function(cfg, map) {
    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (cfg instanceof Cesium.Viewer) {
      var temppar = cfg;
      cfg = map;
      map = temppar;
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = map;
    this.config = cfg;
    this.path = cfg.path || "";
    this.init();
  },
  addCacheVersion: function(_resource) {
    if (_resource == null) return _resource;

    var cacheVersion = getCacheVersion();
    if (cacheVersion) {
      if (_resource.indexOf("?") == -1) _resource += "?time=" + cacheVersion;
      else if (_resource.indexOf("time=" + cacheVersion) == -1)
        _resource += "&time=" + cacheVersion;
    }
    return _resource;
  },
  //激活插件
  activateBase: function() {
    var that = this;

    if (this.isActivate) {
      //已激活状态时跳出
      this.changeWidgetView(function(viewopt) {
        if (viewopt._dom) {
          //将层置顶
          zepto(".layui-layer").each(function() {
            zepto(this).css("z-index", 19891000);
          });
          zepto(viewopt._dom).css("z-index", 19891014);
        }
      });
      return;
    }

    this.beforeActivate();
    this.isActivate = true;
    //daslog.log('激活widget:' + this.config.uri);

    if (!this.isCreate) {
      //首次进行创建
      if (this.options.resources && this.options.resources.length > 0) {
        var resources = [];

        for (var i = 0; i < this.options.resources.length; i++) {
          var _resource = this.options.resources[i];
          _resource = this._getUrl(_resource);

          if (_resources_cache.indexOf(_resource) != -1) continue; //不加重复资源

          resources.push(_resource);
        }
        _resources_cache = _resources_cache.concat(resources); //不加重复资源

        Loader.async(resources, function() {
          var result = that.create(function() {
            that._createWidgetView();
            that.isCreate = true;
          });
          if (result) return;
          if (that.config.createAtStart) {
            that.config.createAtStart = false;
            that.isActivate = false;
            that.isCreate = true;
            return;
          }
          that._createWidgetView();
          that.isCreate = true;
        });
        return;
      } else {
        var result = this.create(function() {
          that._createWidgetView();
          this.isCreate = true;
        });
        if (result) return;
        if (that.config.createAtStart) {
          that.config.createAtStart = false;
          that.isActivate = false;
          that.isCreate = true;
          return;
        }
      }
      this.isCreate = true;
    }
    this._createWidgetView();

    return this;
  },
  //创建插件的view
  _createWidgetView: function() {
    var viewopt = this.options.view;
    if (viewopt === undefined || viewopt === null) {
      this._startActivate();
    } else if (isArray(viewopt)) {
      this._viewcreate_allcount = viewopt.length;
      this._viewcreate_okcount = 0;

      for (var i = 0; i < viewopt.length; i++) {
        this.createItemView(viewopt[i]);
      }
    } else {
      this._viewcreate_allcount = 1;
      this._viewcreate_okcount = 0;
      this.createItemView(viewopt);
    }
  },
  changeWidgetView: function(callback) {
    var viewopt = this.options.view;
    if (viewopt === undefined || viewopt === null) {
      return false;
    } else if (isArray(viewopt)) {
      var hascal = false;
      for (var i = 0; i < viewopt.length; i++) {
        hascal = hascal || callback(viewopt[i]);
      }
      return hascal;
    } else {
      return callback(viewopt);
    }
  },
  createItemView: function(viewopt) {
    switch (viewopt.type) {
      default:
      case "window":
        this._openWindow(viewopt);
        break;
      case "divwindow":
        this._openDivWindow(viewopt);
        break;
      case "append":
        this.getHtml(this._getUrl(viewopt.url), html => {
          this._appendView(viewopt, html);
        });
        break;
      case "custom": //自定义
        var that = this;
        viewopt.open(
          this._getUrl(viewopt.url),
          function(html) {
            that.winCreateOK(viewopt, html);

            that._viewcreate_okcount++;
            if (that._viewcreate_okcount >= that._viewcreate_allcount) {
              that._startActivate(html);
            }
          },
          this
        );
        break;
    }
  },
  _viewcreate_allcount: 0,
  _viewcreate_okcount: 0,
  //==============layer弹窗=================
  _openWindow: function(viewopt) {
    var that = this;
    var view_url = this._getUrl(viewopt.url);

    var opts = {
      type: 2,
      content: [view_url, "no"],
      success: function(layero) {
        viewopt._layerOpening = false;
        viewopt._dom = layero;

        //得到iframe页的窗口对象，执行iframe页的方法：viewWindow.method();
        var viewWindow = window[layero.find("iframe")[0]["name"]];

        //设置css
        if (that.config.css) zepto("#layui-layer" + viewopt._layerIdx).css(that.config.css);

        //隐藏弹窗
        if (that.config.hasOwnProperty("visible") && !that.config.visible) zepto(layero).hide();

        layer.setTop(layero);
        that.winCreateOK(viewopt, viewWindow);

        that._viewcreate_okcount++;
        if (that._viewcreate_okcount >= that._viewcreate_allcount) that._startActivate(layero);

        //通知页面,页面需要定义initWidgetView方法
        if (viewWindow && viewWindow.initWidgetView) viewWindow.initWidgetView(that);
        else
          daslog.warn(
            "" + view_url + "页面没有定义function initWidgetView(widget)方法，无法初始化widget页面!"
          );
      }
    };
    if (viewopt._layerIdx > 0) {
      //debugger
    }

    viewopt._layerOpening = true;
    viewopt._layerIdx = layer.open(this._getWinOpt(viewopt, opts));
  },
  _openDivWindow: function(viewopt) {
    var view_url = this._getUrl(viewopt.url);
    //div弹窗
    var that = this;
    this.getHtml(view_url, function(data) {
      var opts = {
        type: 1,
        content: data,
        success: function(layero) {
          viewopt._layerOpening = false;
          viewopt._dom = layero;

          //隐藏弹窗
          if (that.config.hasOwnProperty("visible") && !that.config.visible) zepto(layero).hide();

          layer.setTop(layero);
          that.winCreateOK(viewopt, layero);

          that._viewcreate_okcount++;
          if (that._viewcreate_okcount >= that._viewcreate_allcount) that._startActivate(layero);
        }
      };
      viewopt._layerOpening = true;
      viewopt._layerIdx = layer.open(that._getWinOpt(viewopt, opts));
    });
  },
  _getUrl: function(url) {
    url = this.addCacheVersion(url);

    if (url.startsWith("/") || url.startsWith(".") || url.startsWith("http")) return url;
    else return this.path + url;
  },
  _getWinOpt: function(viewopt, opts) {
    //优先使用cofig中配置，覆盖js中的定义
    var def = getDefWindowOptions();
    var windowOptions = { ...def, ...viewopt.windowOptions, ...this.config.windowOptions };
    viewopt.windowOptions = windowOptions; //赋值

    var that = this;
    var _size = this._getWinSize(windowOptions);

    var title = false;
    if (!windowOptions.noTitle) {
      title = this.config.name || " ";
      if (this.config.icon) {
        title = '<i class="' + this.config.icon + '" ></i>&nbsp;' + title;
      }
    }

    //默认值
    var defOpts = {
      title: title,
      area: _size.area,
      offset: _size.offset,
      shade: 0,
      maxmin: false,
      beforeEnd: function() {
        that.beforeDisable();
      },
      end: function() {
        // 销毁后触发的回调
        viewopt._layerIdx = -1;
        viewopt._dom = null;
        that.disableBase(true);
      },
      full: function(dom) {
        //最大化后触发的回调
        that.winFull(dom);
      },
      min: function(dom) {
        //最小化后触发的回调
        that.winMin(dom);
      },
      restore: function(dom) {
        //还原 后触发的回调
        that.winRestore(dom);
      }
    };
    return { ...defOpts, ...windowOptions, ...opts };
  },
  //计算弹窗大小和位置
  _getWinSize: function(windowOptions) {
    //获取高宽
    var _width = this.bfb2Number(
      windowOptions.width,
      document.documentElement.clientWidth,
      windowOptions
    );
    var _height = this.bfb2Number(
      windowOptions.height,
      document.documentElement.clientHeight,
      windowOptions
    );

    //计算位置offset
    var offset = "";
    var position = windowOptions.position;
    if (position) {
      if (typeof position == "string") {
        //t顶部,b底部,r右边缘,l左边缘,lt左上角,lb左下角,rt右上角,rb右下角
        offset = position;
      } else if (typeof position == "object") {
        var _top;
        var _left;

        if (position.hasOwnProperty("top") && position.top != null) {
          _top = this.bfb2Number(
            position.top,
            document.documentElement.clientHeight,
            windowOptions
          );
        }
        if (position.hasOwnProperty("bottom") && position.bottom != null) {
          windowOptions._hasresize = true;

          var _bottom = this.bfb2Number(
            position.bottom,
            document.documentElement.clientHeight,
            windowOptions
          );

          if (_top != null) {
            _height = document.documentElement.clientHeight - _top - _bottom;
          } else {
            _top = document.documentElement.clientHeight - _height - _bottom;
          }
        }

        if (position.hasOwnProperty("left") && position.left != null) {
          _left = this.bfb2Number(
            position.left,
            document.documentElement.clientWidth,
            windowOptions
          );
        }
        if (position.hasOwnProperty("right") && position.right != null) {
          windowOptions._hasresize = true;
          var _right = this.bfb2Number(
            position.right,
            document.documentElement.clientWidth,
            windowOptions
          );

          if (_left != null) {
            _width = document.documentElement.clientWidth - _left - _right;
          } else {
            _left = document.documentElement.clientWidth - _width - _right;
          }
        }

        if (_top == null) _top = (document.documentElement.clientHeight - _height) / 2;
        if (_left == null) _left = (document.documentElement.clientWidth - _width) / 2;

        offset = [_top + "px", _left + "px"];
      }
    }

    //最大最小高度判断
    if (windowOptions.hasOwnProperty("minHeight") && _height < windowOptions.minHeight) {
      windowOptions._hasresize = true;
      _height = windowOptions.minHeight;
    }
    if (windowOptions.hasOwnProperty("maxHeight") && _height > windowOptions.maxHeight) {
      windowOptions._hasresize = true;
      _height = windowOptions.maxHeight;
    }

    //最大最小宽度判断
    if (windowOptions.hasOwnProperty("minHeight") && _width < windowOptions.minWidth) {
      windowOptions._hasresize = true;
      _width = windowOptions.minWidth;
    }
    if (windowOptions.hasOwnProperty("maxWidth") && _width > windowOptions.maxWidth) {
      windowOptions._hasresize = true;
      _width = windowOptions.maxWidth;
    }

    var area;
    if (_width && _height) area = [_width + "px", _height + "px"];
    else area = _width + "px";

    return { area: area, offset: offset };
  },
  bfb2Number: function(str, allnum, windowOptions) {
    if (typeof str == "string" && str.indexOf("%") != -1) {
      windowOptions._hasresize = true;

      return (allnum * Number(str.replace("%", ""))) / 100;
    }
    return str;
  },
  //==============直接添加到index上=================
  _appendView: function(viewopt, html) {
    viewopt._dom = zepto(html).appendTo(viewopt.parent || "body");

    //设置css
    if (this.config.css) zepto(viewopt._dom).css(this.config.css);

    this.winCreateOK(viewopt, html);

    this._viewcreate_okcount++;
    if (this._viewcreate_okcount >= this._viewcreate_allcount) this._startActivate(html);
  },

  //释放插件
  disableBase: function(nobefore) {
    if (!this.isActivate) return;

    if (!nobefore) this.beforeDisable();

    var has = this.changeWidgetView(function(viewopt) {
      if (viewopt._layerIdx != null && viewopt._layerIdx != -1) {
        if (viewopt._layerOpening) {
          //窗口还在加载中
          //daslog.log('释放widget窗口还在加载中:' + viewopt._layerIdx);
        }
        layer.close(viewopt._layerIdx);
        return true;
      } else {
        if (viewopt.type == "append" && viewopt._dom) {
          viewopt._dom.remove();
          viewopt._dom = null;
        }
        if (viewopt.type == "custom" && viewopt.close) {
          viewopt.close();
        }
        return false;
      }
    });
    if (has) return;

    this.disable();
    this.isActivate = false;

    //还原配置为初始状态
    if (this.config.autoReset) {
      this.resetConfig();
    }

    //daslog.log('释放widget:' + this.config.uri);
  },
  //还原配置为初始状态
  resetConfig: function() {
    if (this.config._firstConfigBak) {
      var _backData = this.config._firstConfigBak;
      for (var aa in _backData) {
        if (aa == "uri") continue;
        this.config[aa] = _backData[aa];
      }
    }
  },
  //设置view弹窗的显示和隐藏
  setViewVisible: function(visible) {
    this.changeWidgetView(function(viewopt) {
      if (viewopt._layerIdx != null && viewopt._layerIdx != -1) {
        if (visible) {
          zepto("#layui-layer" + viewopt._layerIdx).show();
        } else {
          zepto("#layui-layer" + viewopt._layerIdx).hide();
        }
      } else if (viewopt.type == "append" && viewopt._dom) {
        if (visible) zepto(viewopt._dom).show();
        else zepto(viewopt._dom).hide();
      }
    });
  },
  //设置view弹窗的css
  setViewCss: function(style) {
    this.changeWidgetView(function(viewopt) {
      if (viewopt._layerIdx != null && viewopt._layerIdx != -1) {
        zepto("#layui-layer" + viewopt._layerIdx).css(style);
      } else if (viewopt.type == "append" && viewopt._dom) {
        zepto(viewopt._dom).css(style);
      }
    });
  },
  //主窗体改变大小后触发
  indexResize: function() {
    if (!this.isActivate) return;

    var that = this;
    this.changeWidgetView(function(viewopt) {
      if (
        viewopt._layerIdx == null ||
        viewopt._layerIdx == -1 ||
        viewopt.windowOptions == null ||
        !viewopt.windowOptions._hasresize
      )
        return;

      var _size = that._getWinSize(viewopt.windowOptions);

      var _style = {};
      if (isArray(_size.area)) {
        if (_size.area[0]) _style.width = _size.area[0];
        if (_size.area[1]) _style.height = _size.area[1];
      }

      if (isArray(_size.offset)) {
        if (_size.offset[1]) _style.top = _size.offset[0];
        if (_size.offset[1]) _style.left = _size.offset[1];
      }
      zepto(viewopt._dom).attr("myTopLeft", true);
      layer.style(viewopt._layerIdx, _style);

      if (viewopt.type == "divwindow") layer.iframeAuto(viewopt._layerIdx);
    });
  },
  _startActivate: function(layero) {
    this.activate(layero);
    if (this.config.success) {
      this.config.success(this);
    }
    if (!this.isActivate) {
      //窗口打开中没加载完成时，被释放
      this.disableBase();
    }
  },
  //子类继承后覆盖
  init: function() {},
  //子类继承后覆盖
  create: function(endfun) {},
  //子类继承后覆盖
  beforeActivate: function() {},
  activate: function(layero) {},

  //子类继承后覆盖
  beforeDisable: function() {},
  disable: function() {},

  //子类继承后覆盖
  winCreateOK: function(opt, result) {},
  //窗口最大化后触发
  winFull: function() {},
  //窗口最小化后触发
  winMin: function() {},
  //窗口还原 后触发
  winRestore: function() {},

  //公共方法
  getHtml: function(url, callback) {
    zepto.ajax({
      url: url,
      type: "GET",
      dataType: "html",
      timeout: 0, //永不超时
      success: function(data) {
        callback(data);
      }
    });
  }
});
