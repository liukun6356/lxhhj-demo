import * as Cesium from "cesium";
import { centerOfMass, getPositionValue } from "../../util/point";
import { clone } from "../../util/util";

import * as billboard from "./Attr.Billboard";
import * as label from "./Attr.Label";
import * as point from "./Attr.Point";
import * as model from "./Attr.Model";
import * as plane from "./Attr.Plane";
import * as box from "./Attr.Box";

import * as polyline from "./Attr.Polyline";
import * as polylineVolume from "./Attr.PolylineVolume";
import * as wall from "./Attr.Wall";
import * as corridor from "./Attr.Corridor";

import * as polygon from "./Attr.Polygon";
import * as circle from "./Attr.Circle";
import * as cylinder from "./Attr.Cylinder";
import * as rectangle from "./Attr.Rectangle";
import * as ellipsoid from "./Attr.Ellipsoid";
import { defaultStyle } from "./defaultStyle";

var ellipse = circle;

export {
  billboard,
  label,
  point,
  model,
  polyline,
  polylineVolume,
  wall,
  polygon,
  circle,
  ellipse,
  cylinder,
  rectangle,
  ellipsoid,
  corridor,
  plane,
  box
};

export function getTypeName(entity) {
  if (entity.polygon) return "polygon";
  if (entity.rectangle) return "rectangle";

  if (entity.polyline) return "polyline";
  if (entity.polylineVolume) return "polylineVolume";
  if (entity.corridor) return "corridor";
  if (entity.wall) return "wall";

  if (entity.ellipse) return "circle";
  if (entity.ellipsoid) return "ellipsoid";
  if (entity.cylinder) return "cylinder";
  if (entity.plane) return "plane";
  if (entity.box) return "box";

  if (entity.billboard) return "billboard";
  if (entity.point) return "point";
  if (entity.model) return "model";
  if (entity.label) return "label";

  return "";
}

function defNullFun(entity) {
  return null;
}

function getAttrClass(entity) {
  if (entity.polygon) return polygon;
  if (entity.rectangle) return rectangle;

  if (entity.polyline) return polyline;
  if (entity.polylineVolume) return polylineVolume;
  if (entity.corridor) return corridor;
  if (entity.wall) return wall;

  if (entity.ellipse) return circle;
  if (entity.cylinder) return cylinder;
  if (entity.ellipsoid) return ellipsoid;
  if (entity.plane) return plane;
  if (entity.box) return box;

  if (entity.point) return point;
  if (entity.billboard) return billboard;
  if (entity.model) return model;
  if (entity.label) return label;

  return {
    getCoordinates: defNullFun,
    getPositions: defNullFun,
    toGeoJSON: defNullFun,
    style2Entity: defNullFun
  };
}

export function getCoordinates(entity) {
  return getAttrClass(entity).getCoordinates(entity);
}

export function getPositions(entity) {
  return getAttrClass(entity).getPositions(entity);
}

export function getCenterPosition(entity) {
  var position;
  if (entity.position) {
    //存在position属性时，直接取
    position = getPositionValue(entity.position);
    if (position) return position;
  }

  var pots = getPositions(entity);
  if (!pots || pots.length == 0) return null;
  if (pots.length == 1) return pots[0];

  if (entity.polygon) position = centerOfMass(pots);
  else position = pots[Math.floor(pots.length / 2)];
  return position;
}

export function toGeoJSON(entity) {
  return getAttrClass(entity).toGeoJSON(entity);
}

export function style2Entity(style, entity) {
  return getAttrClass(entity).style2Entity(style, entity);
}

//剔除与默认值相同的值
export function removeGeoJsonDefVal(geojson) {
  if (!geojson.properties || !geojson.properties.type) return geojson;

  var type = geojson.properties.edittype || geojson.properties.type;
  var defStyle = defaultStyle[type];
  if (!defStyle) return geojson;

  var newgeojson = clone(geojson);
  if (geojson.properties.style) {
    var newstyle = {};
    for (var i in geojson.properties.style) {
      var val = geojson.properties.style[i];
      if (!Cesium.defined(val)) continue;

      var valDef = defStyle[i];
      if (valDef === val) continue;
      newstyle[i] = val;
    }
    newgeojson.properties.style = newstyle;
  }

  return newgeojson;
}

export function addGeoJsonDefVal(properties) {
  //赋默认值
  var defStyle = defaultStyle[properties.edittype || properties.type];
  if (defStyle) {
    properties.style = properties.style || {};
    for (var key in defStyle) {
      var val = properties.style[key];
      if (Cesium.defined(val)) continue;

      properties.style[key] = defStyle[key];
    }
  }
  return properties;
}

//获取默认的样式
export function getDefStyle(type, style) {
  style = style || {};
  //赋默认值
  var defStyle = defaultStyle[type];
  if (defStyle) {
    for (var key in defStyle) {
      var val = style[key];
      if (val != null) continue;

      style[key] = defStyle[key];
    }
  }
  return clone(style);
}
