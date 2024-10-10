import * as Cesium from "cesium";

var isArray =
  Array.isArray ||
  function(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };

//格式化 数字 小数位数
function formatNum(num, digits) {
  return Number(num.toFixed(digits || 0));
}

//===============提供了cesium内部不同对象之间的坐标转换==============

//cesium笛卡尔空间坐标 转 经纬度坐标【用于转geojson】
export function cartesian2lonlat(cartesian) {
  var carto = Cesium.Cartographic.fromCartesian(cartesian);
  if (carto == null) return null;

  var x = formatNum(Cesium.Math.toDegrees(carto.longitude), 6);
  var y = formatNum(Cesium.Math.toDegrees(carto.latitude), 6);
  var z = formatNum(carto.height, 2);

  return [x, y, z];
}

//数组，cesium笛卡尔空间坐标 转 经纬度坐标【用于转geojson】
export function cartesians2lonlats(positions) {
  var coordinates = [];
  for (var i = 0, len = positions.length; i < len; i++) {
    var point = cartesian2lonlat(positions[i]);
    if (point) coordinates.push(point);
  }
  return coordinates;
}

//cesium笛卡尔空间坐标 转 web mercator投影坐标
export function cartesian2mercator(position) {
  if (!position) return null;

  var lonlat = cartesian2lonlat(position);
  return lonlat2mercator(lonlat);
}

//数组，cesium笛卡尔空间坐标 转 web mercator投影坐标
export function cartesians2mercators(arr) {
  var arrNew = [];
  for (var i = 0, len = arr.length; i < len; i++) {
    var point = cartesian2mercator(arr[i]);
    if (point) arrNew.push(point);
  }
  return arrNew;
}

//经纬度坐标 转 cesium笛卡尔空间坐标
export function lonlat2cartesian(coord, defHeight) {
  if (!coord || coord.length < 2) return null;
  return Cesium.Cartesian3.fromDegrees(coord[0], coord[1], coord[2] || defHeight || 0);
}

//数组，经纬度坐标 转 cesium笛卡尔空间坐标
export function lonlats2cartesians(coords, defHeight) {
  var arr = [];
  for (var i = 0, len = coords.length; i < len; i++) {
    var item = coords[i];
    if (isArray(item[0])) {
      var arr2 = lonlats2cartesians(item, defHeight);
      if (arr2 && arr2.length > 0) arr.push(arr2);
    } else {
      var cartesian = lonlat2cartesian(item, defHeight);
      if (cartesian) arr.push(cartesian);
    }
  }
  return arr;
}

//地理坐标 转 投影坐标
export function lonlat2mercator(lnglat) {
  return jwd2mct(lnglat);
}
//数组，地理坐标 转 投影坐标
export function lonlats2mercators(arr) {
  var arrNew = [];
  for (var i = 0, len = arr.length; i < len; i++) {
    var point = lonlat2mercator(arr[i]);
    arrNew.push(point);
  }
  return arrNew;
}

//投影坐标 转 cesium笛卡尔空间坐标
export function mercator2cartesian(point) {
  if (isNaN(point[0]) || isNaN(point[1])) return null;

  var lonlat = mercator2lonlat(point);
  return lonlat2cartesian(lonlat);
}
//数组，投影坐标 转 cesium笛卡尔空间坐标
export function mercators2cartesians(arr) {
  var arrNew = [];
  for (var i = 0, len = arr.length; i < len; i++) {
    var point = mercator2cartesian(arr[i]);
    if (point) arrNew.push(point);
  }
  return arrNew;
}

//投影坐标 转 地理坐标
export function mercator2lonlat(point) {
  return mct2jwd(point);
}
//数组，投影坐标 转 地理坐标
export function mercators2lonlats(arr) {
  var arrNew = [];
  for (var i = 0, len = arr.length; i < len; i++) {
    var point = mercator2lonlat(arr[i]);
    arrNew.push(point);
  }
  return arrNew;
}

//========提供了百度（BD09）、国测局（GCJ02）、WGS84、Web墨卡托 4类坐标之间的转换=======
//传入参数 和 返回结果 均是数组：[经度,纬度]

//定义一些常量
var x_PI = (3.14159265358979324 * 3000.0) / 180.0;
var PI = 3.1415926535897932384626;
var a = 6378245.0;
var ee = 0.00669342162296594323;

function transformlat(lng, lat) {
  var ret =
    -100.0 +
    2.0 * lng +
    3.0 * lat +
    0.2 * lat * lat +
    0.1 * lng * lat +
    0.2 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformlng(lng, lat) {
  var ret =
    300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

/**
 * 判断是否在国内，不在国内则不做偏移
 * @param lng
 * @param lat
 * @returns {boolean}
 */
function out_of_china(lng, lat) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271 || false;
}

/**
 * 百度坐标系 (BD-09) 与 国测局坐标系 (GCJ-02)的转换
 * 即 百度 转 谷歌、高德
 * @param bd_lon
 * @param bd_lat
 * @returns {*[]}
 */
export function bd2gcj(arrdata) {
  var bd_lon = Number(arrdata[0]);
  var bd_lat = Number(arrdata[1]);

  var x_pi = (3.14159265358979324 * 3000.0) / 180.0;
  var x = bd_lon - 0.0065;
  var y = bd_lat - 0.006;
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
  var gg_lng = z * Math.cos(theta);
  var gg_lat = z * Math.sin(theta);

  gg_lng = Number(gg_lng.toFixed(6));
  gg_lat = Number(gg_lat.toFixed(6));
  return [gg_lng, gg_lat];
}

/**
 * 国测局坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换
 * 即谷歌、高德 转 百度
 * @param lng
 * @param lat
 * @returns {*[]}
 */
export function gcj2bd(arrdata) {
  var lng = Number(arrdata[0]);
  var lat = Number(arrdata[1]);

  var z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_PI);
  var theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_PI);
  var bd_lng = z * Math.cos(theta) + 0.0065;
  var bd_lat = z * Math.sin(theta) + 0.006;

  bd_lng = Number(bd_lng.toFixed(6));
  bd_lat = Number(bd_lat.toFixed(6));
  return [bd_lng, bd_lat];
}

/**
 * WGS84转GCj02
 * @param lng
 * @param lat
 * @returns {*[]}
 */
export function wgs2gcj(arrdata) {
  var lng = Number(arrdata[0]);
  var lat = Number(arrdata[1]);

  if (out_of_china(lng, lat)) {
    return [lng, lat];
  } else {
    var dlat = transformlat(lng - 105.0, lat - 35.0);
    var dlng = transformlng(lng - 105.0, lat - 35.0);
    var radlat = (lat / 180.0) * PI;
    var magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
    dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
    var mglat = lat + dlat;
    var mglng = lng + dlng;

    mglng = Number(mglng.toFixed(6));
    mglat = Number(mglat.toFixed(6));
    return [mglng, mglat];
  }
}

/**
 * GCJ02 转换为 WGS84
 * @param lng
 * @param lat
 * @returns {*[]}
 */
export function gcj2wgs(arrdata) {
  var lng = Number(arrdata[0]);
  var lat = Number(arrdata[1]);

  if (out_of_china(lng, lat)) {
    return [lng, lat];
  } else {
    var dlat = transformlat(lng - 105.0, lat - 35.0);
    var dlng = transformlng(lng - 105.0, lat - 35.0);
    var radlat = (lat / 180.0) * PI;
    var magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
    dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);

    var mglat = lat + dlat;
    var mglng = lng + dlng;

    var jd = lng * 2 - mglng;
    var wd = lat * 2 - mglat;

    jd = Number(jd.toFixed(6));
    wd = Number(wd.toFixed(6));
    return [jd, wd];
  }
}

//百度经纬度坐标 转 标准WGS84坐标
export function bd2wgs(arrdata) {
  return gcj2wgs(bd2gcj(arrdata));
}

//标准WGS84坐标  转 百度经纬度坐标
export function wgs2bd(arrdata) {
  return gcj2bd(wgs2gcj(arrdata));
}

//经纬度转Web墨卡托
export function jwd2mct(arrdata) {
  var lng = Number(arrdata[0]);
  var lat = Number(arrdata[1]);

  var x = (lng * 20037508.34) / 180;
  var y = Math.log(Math.tan(((90 + lat) * PI) / 360)) / (PI / 180);
  y = (y * 20037508.34) / 180; //+ 7.081154553416204e-10;

  x = Number(x.toFixed(2));
  y = Number(y.toFixed(2));
  return [x, y, arrdata[2] || 0];
}

//Web墨卡托转经纬度
export function mct2jwd(arrdata) {
  var lng = Number(arrdata[0]);
  var lat = Number(arrdata[1]);

  var x = (lng / 20037508.34) * 180;
  var y = (lat / 20037508.34) * 180;
  y = (180 / PI) * (2 * Math.atan(Math.exp((y * PI) / 180)) - PI / 2);

  x = Number(x.toFixed(6));
  y = Number(y.toFixed(6));
  return [x, y, arrdata[2] || 0];
}
