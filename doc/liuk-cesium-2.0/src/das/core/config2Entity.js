import * as Cesium from "cesium";
import {
  isString,
  isNumber,
  clone,
  getPopupForConfig,
  getTooltipForConfig,
  bindLayerPopup,
  getAttrVal,
  currentTime,
  template
} from "../util/util";
import { centerOfMass, setPositionsHeight } from "../util/point";

import { style2Entity as billboardStyle2Entity } from "../draw/attr/Attr.Billboard";
import { style2Entity as labelStyle2Entity } from "../draw/attr/Attr.Label";
import { style2Entity as modelStyle2Entity } from "../draw/attr/Attr.Model";
import { style2Entity as pointStyle2Entity } from "../draw/attr/Attr.Point";
import { style2Entity as corridorStyle2Entity } from "../draw/attr/Attr.Corridor";
import {
  style2Entity as polylineStyle2Entity,
  getPositions as getPolylinePositions
} from "../draw/attr/Attr.Polyline";
import {
  style2Entity as polygonStyle2Entity,
  getPositions as getPolygonPositions,
  getAllPositions as getPolygonAllPositions
} from "../draw/attr/Attr.Polygon";

var nullColor = new Cesium.Color(0.0, 0.0, 0.0, 0.01);

//根据config配置，更新entitys
export function config2Entity(entities, config, lblAddFun) {
  for (var i = 0, len = entities.length; i < len; i++) {
    var entity = entities[i];

    //属性
    if (typeof config.getAttrVal === "function") {
      var attr = config.getAttrVal(entity);
      entity.properties = attr || {}; //重新绑定，后续使用
    }

    //样式
    var symbol = config.symbol;
    if (symbol) {
      if (typeof symbol === "function") {
        //完全自定义的回调方法，自行处理entity
        symbol(entity, entity.properties);
      } else {
        setConfigSymbol(entity, config, lblAddFun);
      }
    }

    //popup、鼠标事件等
    bindMourseEvnet(entity, config);
  }

  return entities;
}

//根据config配置，更新entitys
export function style2Entity(entities, style, lblAddFun) {
  for (var i = 0, len = entities.length; i < len; i++) {
    var entity = entities[i];
    //样式
    setConfigSymbol(entity, { symbol: { styleOptions: style }, lblAddFun });
  }
  return entities;
}

//外部配置的symbol
function setConfigSymbol(entity, config, lblAddFun) {
  var attr = entity.properties;
  if (attr && attr.type && attr.attr) {
    //说明是内部标绘生产的geojson
    attr = attr.attr;
  }
  attr = getAttrVal(attr);

  var symbol = config.symbol;
  var styleOpt = symbol.styleOptions;

  if (symbol.styleField) {
    //存在多个symbol，按styleField进行分类
    let styleFieldVal = attr[symbol.styleField];
    let styleOptField = symbol.styleFieldOptions[styleFieldVal];
    if (styleOptField != null) {
      styleOpt = clone(styleOpt);
      styleOpt = { ...styleOpt, ...styleOptField };
    }
  }

  //外部使用代码示例
  // var layerWork = viewer.das.getLayer(301087, "id")
  // layerWork.config.symbol.callback = function (attr, entity, styleOpt) {
  //     var val = attr.floor;
  //     if (val < 10)
  //         return { color: "#ff0000" };
  //     else
  //         return { color: "#0000ff" };
  // }
  var callback = symbol.callback || symbol.calback; //兼容不同参数名
  if (typeof callback === "function") {
    //只是动态返回symbol的自定义的回调方法，返回style
    styleOpt = clone(styleOpt);
    let styleOptField = callback(attr, entity, styleOpt);
    if (!styleOptField) return;

    styleOpt = { ...styleOpt, ...styleOptField };
  }
  styleOpt = styleOpt || {};

  //兼容v1历史的 label.field 定义方式
  if (styleOpt.label && styleOpt.label.field)
    styleOpt.label.text = "{" + styleOpt.label.field + "}";

  var entityCollection = entity.entityCollection; //entity原有的集合

  //添加文本的统一回调方法 ，默认为entity方式，可以外部处理。
  function defaultLblAdd(position, labelattr, attr) {
    if (labelattr.text == "") return null;

    if (Cesium.defined(labelattr.height)) {
      position = setPositionsHeight(position, labelattr.height);
    }

    var lblEx = entityCollection.add({
      position: position,
      label: labelattr,
      properties: attr
    });
    return lblEx;
  }
  lblAddFun = lblAddFun || defaultLblAdd;

  if (entity.polyline) {
    polylineStyle2Entity(styleOpt, entity.polyline);

    //存在附加的条带时
    if (styleOpt.corridor) {
      var corridorStyle = {
        color: styleOpt.color,
        opacity: styleOpt.opacity,
        ...styleOpt.corridor
      };
      // 可采用格式化字符串
      if (isString(styleOpt.corridor.width))
        corridorStyle.width = template(styleOpt.corridor.width, attr);

      if (entity._corridorEx) {
        corridorStyle2Entity(corridorStyle, entity._corridorEx.corridor);
      } else {
        var corridor = corridorStyle2Entity(corridorStyle);
        corridor.positions = getPolylinePositions(entity);
        let lineEx = entityCollection.add({
          corridor: corridor,
          properties: attr
        });
        bindMourseEvnet(lineEx, config);
        entity._corridorEx = lineEx;
      }
    }

    //线时，加上文字标签
    if (styleOpt.label && styleOpt.label.text) {
      if (entity._labelEx) {
        labelStyle2Entity(styleOpt.label, entity._labelEx.label, attr);
      } else {
        //计算中心点
        var pots = getPolylinePositions(entity);
        var position = pots[Math.floor(pots.length / 2)];
        if (styleOpt.label.position) {
          if (styleOpt.label.position == "center") {
            position = centerOfMass(pots, styleOpt.label.height);
          } else if (isNumber(styleOpt.label.position)) {
            position = pots[styleOpt.label.position];
          }
        }

        //文本属性
        var labelattr = labelStyle2Entity(styleOpt.label, null, attr);
        labelattr.heightReference = Cesium.defaultValue(
          labelattr.heightReference,
          Cesium.HeightReference.CLAMP_TO_GROUND
        );

        var lblEx = lblAddFun(position, labelattr, attr);
        if (lblEx) bindMourseEvnet(lblEx, config);
        entity._labelEx = lblEx;
      }
    }
  }
  if (entity.polygon) {
    polygonStyle2Entity(styleOpt, entity.polygon);
    //是建筑物时
    if (config.buildings) {
      var floor = Number(attr[config.buildings.cloumn] || 1); //层数

      var height = 3.5; //层高
      var heightCfg = config.buildings.height;
      if (isNumber(heightCfg)) {
        height = heightCfg;
      } else if (isString(heightCfg)) {
        height = attr[heightCfg] || height;
      }

      entity.polygon.extrudedHeight = floor * height;
    }
    //是建筑物单体化时
    if (config.dth) {
      entity.polygon.classificationType = Cesium.ClassificationType.BOTH;
      if (!Cesium.defined(styleOpt.color)) entity.polygon.material = nullColor;
      entity.polygon.perPositionHeight = false;
      entity.polygon.zIndex = 99;
    }

    //加上线宽
    if (styleOpt.outlineWidth && styleOpt.outlineWidth > 1) {
      entity.polygon.outline = false;
      var outlineStyle = {
        ...styleOpt,
        outline: false,
        color: styleOpt.outlineColor,
        width: styleOpt.outlineWidth,
        opacity: styleOpt.outlineOpacity,
        ...(styleOpt.outlineStyle || {})
      };
      //_outlineEx是数组，支持挖洞多边形的多个边线。
      if (entity._outlineEx) {
        for (let i = 0, len = entity._outlineEx.length; i < len; i++) {
          polylineStyle2Entity(outlineStyle, entity._outlineEx[i].polyline);
        }
      } else {
        var arrline = getPolygonAllPositions(entity);
        entity._outlineEx = [];
        for (let i = 0, len = arrline.length; i < len; i++) {
          var polyline = polylineStyle2Entity(outlineStyle);
          polyline.positions = arrline[i];
          let lineEx = entityCollection.add({
            polyline: polyline,
            properties: attr
          });
          bindMourseEvnet(lineEx, config);
          entity._outlineEx.push(lineEx);
        }
      }
    }

    //面时，加上文字标签
    if (styleOpt.label && styleOpt.label.text) {
      if (entity._labelEx) {
        labelStyle2Entity(styleOpt.label, entity._labelEx.label, attr);
      } else {
        //计算中心点
        let position = centerOfMass(getPolygonPositions(entity), styleOpt.label.height);

        //文本属性
        let labelattr = labelStyle2Entity(styleOpt.label, null, attr);
        labelattr.heightReference = Cesium.defaultValue(
          labelattr.heightReference,
          Cesium.HeightReference.CLAMP_TO_GROUND
        );

        let lblEx = lblAddFun(position, labelattr, attr);
        if (lblEx) bindMourseEvnet(lblEx, config);
        entity._labelEx = lblEx;
      }
    }
  }

  //entity本身存在文字标签
  if (entity.label) {
    styleOpt.label = styleOpt.label || styleOpt || {};

    if (
      !Cesium.defined(styleOpt.label.clampToGround) &&
      !Cesium.defined(styleOpt.label.heightReference)
    )
      styleOpt.label.heightReference = Cesium.defaultValue(
        styleOpt.label.heightReference,
        Cesium.HeightReference.CLAMP_TO_GROUND
      );

    labelStyle2Entity(styleOpt.label, entity.label, attr);
  } else {
    //外部完全自定义的方式
    if (styleOpt.label && typeof styleOpt.label === "function") {
      styleOpt.label(entity, attr, function(position, styleLbl) {
        //文本属性
        var labelattr = labelStyle2Entity(styleLbl, null, attr);
        labelattr.heightReference = Cesium.defaultValue(
          labelattr.heightReference,
          Cesium.HeightReference.CLAMP_TO_GROUND
        );

        var lblEx = lblAddFun(position, labelattr, attr);
        if (lblEx) bindMourseEvnet(lblEx, config);
      });
    }
  }

  //图标时
  if (entity.billboard) {
    if (!Cesium.defined(styleOpt.clampToGround) && !Cesium.defined(styleOpt.heightReference))
      styleOpt.heightReference = Cesium.defaultValue(
        styleOpt.heightReference,
        Cesium.HeightReference.CLAMP_TO_GROUND
      );
    // 可采用格式化字符串
    styleOpt.image = template(styleOpt.image, attr);

    billboardStyle2Entity(styleOpt, entity.billboard);

    //支持小模型
    if (styleOpt.model) {
      if (entity._modelEx) {
        modelStyle2Entity(styleOpt.model, entity._modelEx.model);
      } else {
        var modelattr = modelStyle2Entity(styleOpt.model);
        modelattr.heightReference = Cesium.defaultValue(
          modelattr.heightReference,
          Cesium.HeightReference.CLAMP_TO_GROUND
        );

        var modelEx = entityCollection.add({
          position: entity.position,
          model: modelattr,
          properties: attr
        });
        bindMourseEvnet(lblEx, config);
        entity._modelEx = modelEx;
      }
    }

    //支持point
    if (styleOpt.point) {
      if (entity._pointEx) {
        pointStyle2Entity(styleOpt.point, entity._pointEx.point);
      } else {
        let modelattr = pointStyle2Entity(styleOpt.point);
        modelattr.heightReference = Cesium.defaultValue(
          modelattr.heightReference,
          Cesium.HeightReference.CLAMP_TO_GROUND
        );

        var pointEx = entityCollection.add({
          position: entity.position,
          point: modelattr,
          properties: attr
        });
        bindMourseEvnet(lblEx, config);
        entity._pointEx = pointEx;
      }
    }

    //加上文字标签 (entity本身不存在label时)
    if (styleOpt.label && styleOpt.label.text && !entity.label) {
      if (entity._labelEx) {
        labelStyle2Entity(styleOpt.label, entity._labelEx.label, attr);
      } else {
        //计算中心点
        let position = entity.position;

        //文本属性
        let labelattr = labelStyle2Entity(styleOpt.label, null, attr);
        labelattr.heightReference = Cesium.defaultValue(
          labelattr.heightReference,
          Cesium.HeightReference.CLAMP_TO_GROUND
        );

        let lblEx = lblAddFun(position, labelattr, attr);
        if (lblEx) bindMourseEvnet(lblEx, config);
        entity._labelEx = lblEx;
      }
    }
  }

  //记录下样式配置
  entity.styleOpt = styleOpt;
}

//鼠标事件，popup tooltip
function bindMourseEvnet(entity, config) {
  //popup弹窗
  if (config.columns || config.popup) {
    entity.popup = bindLayerPopup(config.columns || config.popup, function(inhtml, entity) {
      var attr = entity.properties || entity.attribute;
      if (attr && attr.type && attr.attr) {
        //说明是内部标绘生产的geojson
        attr = attr.attr;
      }
      if (isString(attr)) return attr;
      else
        return getPopupForConfig(
          {
            name: config.name,
            popup: inhtml,
            popupNameField: config.popupNameField
          },
          attr
        );
    });
  }
  if (config.tooltip) {
    entity.tooltip = bindLayerPopup(config.tooltip, function(inhtml, entity) {
      var attr = entity.properties || entity.attribute;
      if (attr && attr.type && attr.attr) {
        //说明是内部标绘生产的geojson
        attr = attr.attr;
      }

      if (isString(attr)) return attr;
      else
        return getTooltipForConfig(
          {
            name: config.name,
            tooltip: inhtml,
            tooltipNameField: config.tooltipNameField
          },
          attr
        );
    });
  }

  if (config.click) {
    entity.click = config.click;
  }
  if (config.mouseover) {
    entity.mouseover = config.mouseover;
  }
  if (config.mouseout) {
    entity.mouseout = config.mouseout;
  }

  if (config.eventTarget) {
    entity.eventTarget = config.eventTarget;
  }

  if (config.contextmenuItems) {
    entity.contextmenuItems = config.contextmenuItems;
  }
}

//单体化处理
var highlighted_hierarchy; //单体化坐标位置

var highlighColor; //高亮时颜色
var highlightedEntity; //单体化显示的面

function mouseover(entity) {
  //移入
  highlighted_hierarchy = entity.polygon.hierarchy.getValue(currentTime());
  highlightedEntity.polygon.show = true;

  highlightedEntity.properties = entity.properties;
  highlightedEntity.tooltip = entity.tooltip ? entity.tooltip : null;
  highlightedEntity.popup = entity.popup ? entity.popup : null;
}

function mouseout() {
  //移出
  if (Cesium.defined(highlightedEntity)) {
    highlightedEntity.polygon.show = false;
  }
}

//创建单体化显示的面【每个对象只用一次】
export function createDthEntity(dataSource, styleOpt) {
  styleOpt = styleOpt || {};

  if (!highlightedEntity) {
    //高亮时颜色
    highlighColor = Cesium.Color.fromCssColorString(
      Cesium.defaultValue(styleOpt.color, "#ffff00")
    ).withAlpha(Cesium.defaultValue(styleOpt.opacity, 0.3)); //高亮时颜色

    //单体化显示的面
    highlightedEntity = dataSource.entities.add({
      name: "单体化高亮面",
      noMouseMove: true, //标识下，内部不监听其移入事件
      polygon: {
        perPositionHeight: false,
        classificationType: Cesium.ClassificationType.BOTH,
        material: highlighColor,
        hierarchy: new Cesium.CallbackProperty(time => {
          return highlighted_hierarchy;
        }, false),
        zIndex: 0
      }
    });
  }

  return {
    mouseover: mouseover,
    mouseout: mouseout
  };
}
