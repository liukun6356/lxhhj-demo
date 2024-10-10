import * as Cesium from "cesium";
import * as ver from "../../version";
import { FlashingEntity, loopArrayForFun as loopArray } from "../core/FlashingEntity";
import { buffer as turf_buffer } from "@turf/turf";
import * as daslog from "./log";

//打印信息
export function printVersion() {
  var msg = "";
  var c1 = "\n\tfont-size: 19px;\n\tpadding-left: 10px;\n\tcolor: rgb(240, 133, 25);\n",
    c2 =
      '\n\tfont-size: 17px;\n\tline-height: 1.5;\n\tfont-weight: 1000;\n\tfont-family: "\u5FAE\u8F6F\u96C5\u9ED1";\n\tcolor: rgb(240, 133, 25);\n',
    c3 =
      '\n\tfont-size: 15px;\n\tline-height: 1.5;\n\tfont-family: "\u5FAE\u8F6F\u96C5\u9ED1";\n\tfont-style: italic;\n\tcolor: rgb(240, 133, 25);\n\tpadding-bottom: 5px;\n',
    c4 =
      '\n\tfont-size: 12px;\n\tline-height: 1.5;\n\tfont-family: "\u5FAE\u8F6F\u96C5\u9ED1";\n\tcolor: rgb(0, 138, 255);\n\t';
  // eslint-disable-next-line no-console
  // console.log(msg, c1, c2, c3, c4);
  console.log('当前版本号:' + ver.version + ",当前Cesium版本:" + Cesium.VERSION);
}

export function isNumber(obj) {
  return typeof obj == "number" && obj.constructor == Number;
}

export function isString(str) {
  return typeof str == "string" && str.constructor == String;
}

export function isObject(obj) {
  return typeof obj == "object" && obj.constructor == Object;
}

export var isArray =
  Array.isArray ||
  function(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };

export function alert(msg, title) {
  if (window.haoutil && window.haoutil.alert)
    //此方法需要引用haoutil
    window.haoutil.alert(msg, title);
  else if (window.layer)
    //此方法需要引用layer.js
    window.layer.alert(msg, {
      title: title || "提示",
      skin: "layui-layer-lan layer-das-dialog",
      closeBtn: 0,
      anim: 0
    });
  else window.alert(msg);
}

export function msg(msg) {
  if (window.haoutil && window.haoutil.msg)
    //此方法需要引用haoutil
    window.haoutil.msg(msg);
  else if (window.toastr)
    //此方法需要引用toastr
    window.toastr.info(msg);
  else if (window.layer) window.layer.msg(msg);
  //此方法需要引用layer.js
  else window.alert(msg);
}

//url参数获取
export function getRequest() {
  var url = location.search; //获取url中"?"符后的字串
  var theRequest = new Object();
  if (url.indexOf("?") != -1) {
    var str = url.substr(1);
    var strs = str.split("&");
    for (var i = 0; i < strs.length; i++) {
      theRequest[strs[i].split("=")[0]] = decodeURI(strs[i].split("=")[1]);
    }
  }
  return theRequest;
}

export function getRequestByName(name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return decodeURI(r[2]);
  return null;
}

Array.prototype.indexOf =
  Array.prototype.indexOf ||
  function(val) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == val) return i;
    }
    return -1;
  };

export function removeArrayItem(arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == val) {
      arr.splice(i, 1);
      return true;
    }
  }
  return false;
}

export function clone(obj, removeKeys, level) {
  if (level == null) level = 5; //避免死循环，拷贝的层级最大深度
  if (removeKeys == null) removeKeys = ["_layer"];

  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    let copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (isArray(obj) && level >= 0) {
    let copy = [];
    for (var i = 0, len = obj.length; i < len; ++i) {
      copy[i] = clone(obj[i], removeKeys, level - 1);
    }
    return copy;
  }

  // Handle Object
  if (typeof obj === "object" && level >= 0) {
    try {
      let copy = {};
      for (var attr in obj) {
        if (typeof attr === "function") continue;
        if (removeKeys.indexOf(attr) != -1) continue;

        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr], removeKeys, level - 1);
      }
      return copy;
    } catch (e) {
      daslog.warn("util.clone方法时异常", e);
    }
  }
  return obj;
}

export function isPCBroswer() {
  var sUserAgent = navigator.userAgent.toLowerCase();

  var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
  var bIsIphoneOs = sUserAgent.match(/iphone/i) == "iphone";
  var bIsMidp = sUserAgent.match(/midp/i) == "midp";
  var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
  var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
  var bIsAndroid = sUserAgent.match(/android/i) == "android";
  var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
  var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
  if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
    return false;
  } else {
    return true;
  }
}

//获取浏览器类型及版本
export function getExplorerInfo() {
  var ver;
  var explorer = window.navigator.userAgent.toLowerCase();
  //ie
  if (explorer.indexOf("msie") >= 0) {
    ver = Number(explorer.match(/msie ([\d]+)/)[1]);
    return { type: "IE", version: ver };
  }
  //firefox
  else if (explorer.indexOf("firefox") >= 0) {
    ver = Number(explorer.match(/firefox\/([\d]+)/)[1]);
    return { type: "Firefox", version: ver };
  }
  //Chrome
  else if (explorer.indexOf("chrome") >= 0) {
    ver = Number(explorer.match(/chrome\/([\d]+)/)[1]);
    return { type: "Chrome", version: ver };
  }
  //Opera
  else if (explorer.indexOf("opera") >= 0) {
    ver = Number(explorer.match(/opera.([\d]+)/)[1]);
    return { type: "Opera", version: ver };
  }
  //Safari
  else if (explorer.indexOf("Safari") >= 0) {
    ver = Number(explorer.match(/version\/([\d]+)/)[1]);
    return { type: "Safari", version: ver };
  }
  return { type: explorer, version: -1 };
}

//检测浏览器webgl支持
export function webglreport() {
  var exinfo = getExplorerInfo();
  if (exinfo.type == "IE" && exinfo.version < 11) {
    return false;
  }

  try {
    var glContext;
    var canvas = document.createElement("canvas");
    var requestWebgl2 = typeof WebGL2RenderingContext !== "undefined";
    if (requestWebgl2) {
      glContext =
        canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2") || undefined;
    }
    if (glContext == null) {
      glContext =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl") || undefined;
    }
    if (glContext == null) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}

function download(fileName, blob) {
  var aLink = document.createElement("a");
  aLink.download = fileName;
  aLink.href = URL.createObjectURL(blob);
  document.body.appendChild(aLink);
  aLink.click();
  document.body.removeChild(aLink);
}

function base64Img2Blob(code) {
  var parts = code.split(";base64,");
  var contentType = parts[0].split(":")[1];
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;

  var uInt8Array = new Uint8Array(rawLength);
  for (var i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

//下载导出图片
export function downloadBase64Image(name, base64) {
  var blob = base64Img2Blob(base64);
  download(name + ".png", blob);
}

//下载保存文件
export function downloadFile(fileName, string) {
  var blob = new Blob([string]);
  download(fileName, blob);
}

//格式化经度/纬度，返回度分秒字符串
export function formatDegree(value) {
  value = Math.abs(value);
  var v1 = Math.floor(value); //度
  var v2 = Math.floor((value - v1) * 60); //分
  var v3 = Math.round(((value - v1) * 3600) % 60); //秒
  return v1 + "° " + v2 + "'  " + v3 + '"';
}

//  计算长度后，格式化显示长度值, 可指定单位
//  unit支持:m、km、mile、zhang   默认自动判断 m 或 km
export function formatLength(val, unit) {
  if (val == null) return "";

  if (unit == null || unit == "auto") {
    if (val < 1000) unit = "m";
    else unit = "km";
  }

  var valstr = "";
  switch (unit) {
    default:
    case "m":
      valstr = val.toFixed(2) + "米";
      break;
    case "km":
      valstr = (val * 0.001).toFixed(2) + "公里";
      break;
    case "mile":
      valstr = (val * 0.00054).toFixed(2) + "海里";
      break;
    case "zhang":
      valstr = (val * 0.3).toFixed(2) + "丈";
      break;
  }
  return valstr;
}

//  计算面积后，格式化显示面积值, 可指定单位
//  unit支持:m、km、mu、ha   默认自动判断 m 或 km
export function formatArea(val, unit) {
  if (val == null) return "";

  if (unit == null || unit == "auto") {
    if (val < 1000000) unit = "m";
    else unit = "km";
  }

  var valstr = "";
  switch (unit) {
    default:
    case "m":
      valstr = val.toFixed(2) + "m²";
      break;
    case "km":
      valstr = (val / 1000000).toFixed(2) + "km²";
      break;
    case "mu":
      valstr = (val * 0.0015).toFixed(2) + "亩";
      break;
    case "ha":
      valstr = (val * 0.0001).toFixed(2) + "ha²";
      break;
  }

  return valstr;
}

//根据高度获取地图层级
export function heightToZoom(altitude) {
  var A = 40487.57;
  var B = 0.00007096758;
  var C = 91610.74;
  var D = -40467.74;

  return Math.round(D + (A - D) / (1 + Math.pow(altitude / C, B)));
}

//缓冲分析（比如是建筑物单体化时,缓冲扩大点范围）,单位：米
export function buffer(geojson, width) {
  try {
    width = Cesium.defaultValue(width, 1);
    //API: http://turfjs.org/docs/#buffer
    geojson = turf_buffer(geojson, width, { units: "meters", steps: 64 });
  } catch (e) {
    daslog.log("buffer缓冲分析异常", e);
  }
  return geojson;
}

//求Rectangle范围内 按count等比插值的granularity值
export function getGranularity(positions, count) {
  var recta = Cesium.Rectangle.fromCartesianArray(positions);
  var granularity = Math.max(recta.height, recta.width);
  granularity /= Cesium.defaultValue(count, 10); //默认分割10次
  return granularity;
}

//取当前时间，用于getValue传参
export function currentTime() {
  if (window.viewer) return window.viewer.clock.currentTime;
  else return Cesium.JulianDate.now();
}

//判断url加上配置的代理
export function getProxyUrl(config) {
  if (!config.url || (!config.proxy && !config.headers && !config.queryParameters)) return config;

  if (config.url instanceof Cesium.Resource) {
    config.url.headers = config.headers;
    return config;
  }

  var opts = {};
  for (var key in config) {
    opts[key] = config[key];
  }
  opts.url = new Cesium.Resource({
    url: opts.url,
    proxy: opts.proxy ? new Cesium.DefaultProxy(opts.proxy) : null,
    headers: opts.headers,
    queryParameters: opts.queryParameters
  });

  return opts;
}

var templateRe = /\{ *([a-zA-Z0-9_\u4e00-\u9fa5]+) *\}/g;

//popup的字符串模板
export function template(str, data) {
  if (str == null) return str;

  return str.replace(templateRe, function(str, key) {
    var value = data[key];
    if (!Cesium.defined(value)) return "";

    if (typeof value === "function") {
      value = value(data);
      if (!Cesium.defined(value)) return "";
    } else if (value.getValue && typeof value.getValue == "function") {
      value = value.getValue(currentTime());
      if (!Cesium.defined(value)) return "";
    }

    return value;
  });
}

//简化Cesium内的属性，去掉getValue等，取最简的键值对。方便popup、tooltip等使用
export function getAttrVal(attr) {
  if (!attr) return attr;

  try {
    if (attr.getValue) attr = attr.getValue(currentTime());

    var newattr = {};
    if (attr._propertyNames && attr._propertyNames.length > 0) {
      for (let key of attr._propertyNames) {
        let showval = attr[key];
        if (showval == null || showval == "" || showval == "Null" || showval == "Unknown") continue;

        if (showval.getValue && typeof showval.getValue == "function") {
          newattr[key] = showval.getValue(currentTime());
        } else {
          if (typeof showval === "function") continue;
          newattr[key] = showval;
        }
      }
    } else {
      for (var key in attr) {
        let showval = attr[key];
        if (showval == null || showval == "" || showval == "Null" || showval == "Unknown") continue;

        if (showval.getValue && typeof showval.getValue == "function") {
          newattr[key] = showval.getValue(currentTime());
        } else {
          if (typeof showval === "function") continue;
          newattr[key] = showval;
        }
      }
    }
    return newattr;
  } catch (e) {
    daslog.log("getAttrVal 出错", e);
  }
  return attr;
}

//根据config配置规则获取popup使用的html字符串
export function getPopupForConfig(cfg, attr) {
  var _title = cfg.popupNameField ? attr[cfg.popupNameField] : cfg.name;
  if (cfg.popupNoTitle) _title = null;

  if (cfg.popup) {
    return getPopup(cfg.popup, attr, { title: _title });
  } else if (cfg.columns) {
    return getPopup(cfg.columns, attr, { title: _title });
  }
  return false;
}

//根据config配置规则获取tooltip使用的html字符串
export function getTooltipForConfig(cfg, attr) {
  var _title = cfg.tooltipNameField ? attr[cfg.tooltipNameField] : cfg.name;

  if (cfg.tooltip) {
    return getPopup(cfg.tooltip, attr, { title: _title });
  }
  return false;
}

//获取Popup或Tooltip格式化字符串
export function getPopup(cfg, attr, options) {
  if (!attr) return false;

  options = options || {};
  if (isString(options)) {
    //兼容旧版本参数
    options = { title: options };
  }

  var title = options.title;
  var isEdit = options.edit;

  attr = getAttrVal(attr); //取值

  if (isArray(cfg)) {
    //数组
    let countsok = 0;
    let inhtml = title
      ? '<div class="das-popup-titile">' + title + "</div>"
      : '<div style="height: 10px;"></div>';
    inhtml += '<div class="das-popup-content" >';
    for (let i = 0; i < cfg.length; i++) {
      var thisfield = cfg[i];
      if (thisfield == null) continue;

      var col = thisfield.field;

      if (thisfield.type == "details" || thisfield.type == "button") {
        //详情等button按钮
        let showval = String.prototype.trim.call(attr[col || "OBJECTID"]);
        if (showval == null) continue;

        var onclickHtml = "";
        var callback = thisfield.callback || thisfield.calback;
        if (callback) {
          onclickHtml = `onclick="${callback}('${showval}');"  `;
        }

        inhtml += `<div style="text-align: center;padding: 2px 0;">
                            <button type="button"  ${onclickHtml}
                            data-type="${col}" class="btn btn-primary btn-sm das3d-popup-btn" >${thisfield.name ||
          "查看详情"}</button>
                        </div>`;
        continue;
      } else if (thisfield.type == "html") {
        inhtml += "<div>" + thisfield.html + "</div>";
        continue;
      }

      if (!isEdit) {
        //非编辑状态隐藏空值
        if (col == null || attr[col] == null) continue;
        if (typeof attr[col] === "function") continue;
      }

      //值
      var showval = String.prototype.trim.call(attr[col] || "");

      if (!isEdit) {
        //非编辑状态隐藏空值
        if (
          showval == null ||
          showval == "" ||
          showval == "Null" ||
          showval == "Unknown" ||
          showval == "0" ||
          showval.length == 0
        )
          continue;
      }

      if (thisfield.format) {
        //使用外部 格式化js方法
        try {
          showval = eval(thisfield.format + "(" + showval + ")");
        } catch (e) {
          daslog.log("getPopupByConfig方法format格式化异常", thisfield);
        }
      }

      if (isEdit) {
        switch (thisfield.type) {
          default:
          case "string":
          case "number":
            showval = `<input type="${thisfield.type ||
              "text"}" class="das3d-popup-edititem" style="width:${options.width || 190}px;"
                        data-type="${col}" value="${showval}" placeholder="请输入 ${
              thisfield.name
            }"  />`;
            break;
          case "textarea":
            showval = `<textarea class="das3d-popup-edititem" style="width:${options.width ||
              190}px;"
                        data-type="${col}"  placeholder="请输入 ${
              thisfield.name
            }"  >${showval}</textarea>`;
            break;
        }
      }

      if (thisfield.unit) {
        showval += thisfield.unit;
      }

      inhtml += "<div><label>" + thisfield.name + "</label>" + showval + "</div>";
      countsok++;
    }
    inhtml += "</div>";

    if (countsok == 0) return false;
    return inhtml;
  } else if (typeof cfg === "object") {
    //对象,type区分逻辑
    switch (cfg.type) {
      case "iframe":
        var _url = template(cfg.url, attr);

        var inhtml2 =
          '<iframe id="ifarm" src="' +
          _url +
          '"  style="width:' +
          (cfg.width || "300") +
          "px;height:" +
          (cfg.height || "300") +
          'px;overflow:hidden;margin:0;" scrolling="no" frameborder="0" ></iframe>';
        return inhtml2;
      // break;
      case "javascript":
        //回调方法
        var callbackFun = cfg.callback || cfg.calback;
        return eval(callbackFun + "(" + JSON.stringify(attr) + ")");
      // break;
    }
  } else if (typeof cfg === "function") {
    return cfg(attr);
  } else if (cfg == "all") {
    //全部显示
    let countsok = 0;
    let inhtml = title ? '<div class="das-popup-titile">' + title + "</div>" : "";
    inhtml += '<div class="das-popup-content" >';
    for (let col in attr) {
      try {
        if (col == null || attr[col] == null) continue;

        if (
          col == "Shape" ||
          col == "FID" ||
          col == "OBJECTID" ||
          col == "_definitionChanged" ||
          col == "_propertyNames"
        )
          continue; //不显示的字段

        if (col.substr(0, 1) == "_") {
          col = col.substring(1); //cesium 内部属性
        }

        if (
          typeof attr[col] === "object" &&
          attr[col].hasOwnProperty &&
          attr[col].hasOwnProperty("getValue")
        )
          attr[col] = attr[col].getValue(currentTime());
        if (typeof attr[col] === "function") continue;

        let showval = String.prototype.trim.call(attr[col]);
        if (
          showval == null ||
          showval == "" ||
          showval == "Null" ||
          showval == "Unknown" ||
          showval == "0" ||
          showval.length == 0
        )
          continue; //不显示空值，更美观友好

        inhtml += "<div><label>" + col + "</label>" + showval + "</div>";
        countsok++;
      } catch (e) {
        daslog.log("getPopup方法all构造时异常", e);
      }
    }
    inhtml += "</div>";

    if (countsok == 0) return false;
    return inhtml;
  } else {
    //格式化字符串
    return template(cfg, attr);
  }

  return false;
}

//对das3d内置图层的绑定处理（图层一般因为有属性读取及格式化处理）
export function bindLayerPopup(popup, getHtmlFun) {
  //显示内容
  var inhtml;
  if (typeof popup === "object" && popup.html) {
    inhtml = popup.html;
  } else {
    inhtml = popup;
    popup = {
      html: inhtml
    };
  }

  if (typeof inhtml === "function") {
    //自定义的回调方法
    popup.html = function(entity, cartesian, callback) {
      return inhtml(entity, cartesian, callback);
    };
  } else {
    //内置的格式化方法，一般使用getPopup
    popup.html = function(entity) {
      return getHtmlFun(inhtml, entity);
    };
  }
  popup.anchor = popup.anchor || [0, -15];

  return popup;
}

export var loopArrayForFun = loopArray;

var lastFlashingEntity;

//定时闪烁高亮Entity（点、线、面）
export function highlightEntity(entitys, opts) {
  var flashingEntity = new FlashingEntity();
  flashingEntity.highlight(entitys, opts);

  lastFlashingEntity = flashingEntity;
  return flashingEntity;
}

//取消定时闪烁高亮Entity（点、线、面）
export function unHighlightEntity(flashingEntity) {
  if (flashingEntity) return flashingEntity.unHighlight();
  else if (lastFlashingEntity) return lastFlashingEntity.unHighlight();
}

//文字转base64图片
export function getTextImage(text, textStyle) {
  var canvas = Cesium.writeTextToCanvas(text, textStyle);
  return canvas.toDataURL("image/png");
}

//合并属性
export function merge(dest, ...sources) {
  let i, j, len, src;
  for (j = 0, len = sources.length; j < len; j++) {
    src = sources[j];
    for (i in src) {
      dest[i] = src[i];
    }
  }
  return dest;
}
