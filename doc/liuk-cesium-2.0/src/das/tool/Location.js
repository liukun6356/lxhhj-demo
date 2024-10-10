import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { zepto } from "../util/zepto";
import * as point from "../util/point";
import * as pointconvert from "../util/pointconvert";
import * as _util from "../util/util";

//“鼠标经纬度提示”控件
export class Location {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    this.viewer = viewer;
    this.options = options;

    this.format =
      options.format ||
      "<div>经度:{x}</div> <div>纬度:{y}</div> <div>海拔：{z}米</div> <div>方向：{heading}度</div> <div>俯仰角：{pitch}度</div>  <div>视高：{height}米</div>";

    var containerid = viewer._container.id + "-das3d-location";
    var inhtml =
      '<div id="' +
      containerid +
      '"  class="das3d-locationbar animation-slide-bottom no-print" ><div class="das3d-locationbar-content"></div></div>';
    zepto("#" + viewer._container.id).append(inhtml);

    this._dom = zepto("#" + containerid);
    this._domContent = zepto("#" + containerid + " .das3d-locationbar-content");

    if (options.style) this._dom.css(options.style);
    else {
      this._dom.css({
        left: viewer.animation ? "170px" : "0",
        right: "0",
        bottom: viewer.timeline ? "25px" : "0"
      });
    }
    this._visible = true;

    this.locationData = {};
    this.locationData.height = viewer.camera.positionCartographic.height.toFixed(1);
    this.locationData.heading = Cesium.Math.toDegrees(viewer.camera.heading).toFixed(0);
    this.locationData.pitch = Cesium.Math.toDegrees(viewer.camera.pitch).toFixed(0);

    this.options.cacheTime = Cesium.defaultValue(this.options.cacheTime, 100);
    this.viewer.das.on(eventType.mouseMove, this.mouseMoveHandler, this);

    //帧率
    if (options.fps) {
      // 帧率的计算借助了Cesium中的东西，需要开启debugShowFramesPerSecond
      viewer.scene.debugShowFramesPerSecond = true;

      var timeTik = setInterval(() => {
        if (!viewer || !viewer.scene._performanceDisplay) return;
        clearInterval(timeTik);
        this.timeTik = null;

        var domFPS = zepto(".cesium-performanceDisplay");

        //修改样式
        domFPS.addClass("das3d-locationbar-content").removeClass("cesium-performanceDisplay");

        //移除空节点
        domFPS.children(".cesium-performanceDisplay-throttled").remove();

        //添加到状态栏
        this._dom.prepend(domFPS);
      }, 500);
      this.timeTik = timeTik;
    }

    //相机移动结束事件
    viewer.scene.camera.moveEnd.addEventListener(this.updaeCamera, this);
  }

  //========== 对外属性 ==========
  //是否显示
  get show() {
    return this._visible;
  }
  set show(value) {
    this._visible = value;

    if (value) this._dom.show();
    else this._dom.hide();
  }

  //========== 方法 ==========
  //鼠标移动事件，setTimeout是为了优化效率
  mouseMoveHandler(event) {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
      delete this.moveTimer;
    }
    this.moveTimer = setTimeout(() => {
      delete this.moveTimer;
      this.updateData(event);
    }, this.options.cacheTime);
  }
  updateData(movement) {
    if (!this._visible) return;

    if (this.viewer.scene.mode !== Cesium.SceneMode.SCENE3D) {
      return;
    }

    var cartesian = point.getCurrentMousePosition(this.viewer.scene, movement.endPosition);
    if (!cartesian) return;

    var cartographic = Cesium.Cartographic.fromCartesian(cartesian);

    this.locationData.z = (cartographic.height / this.viewer.scene.terrainExaggeration).toFixed(1);
    this.locationData.height = this.viewer.camera.positionCartographic.height.toFixed(1);
    this.locationData.heading = Cesium.Math.toDegrees(this.viewer.camera.heading).toFixed(0);
    this.locationData.pitch = Cesium.Math.toDegrees(this.viewer.camera.pitch).toFixed(0);
    this.locationData.level = this.viewer.das.level;

    var jd = Cesium.Math.toDegrees(cartographic.longitude);
    var wd = Cesium.Math.toDegrees(cartographic.latitude);
    var fixedLen;
    switch (this.options.crs) {
      default:
        //和地图一致的原坐标
        fixedLen = this.options.hasOwnProperty("toFixed") ? this.options.toFixed : 6;
        this.locationData.x = jd.toFixed(fixedLen);
        this.locationData.y = wd.toFixed(fixedLen);
        break;
      case "degree": //度分秒形式
        this.locationData.x = _util.formatDegree(jd);
        this.locationData.y = _util.formatDegree(wd);
        break;
      case "project": //投影坐标
        fixedLen = this.options.hasOwnProperty("toFixed") ? this.options.toFixed : 0;
        var mkt = pointconvert.cartesian2mercator([cartesian.x, cartesian.y]);
        this.locationData.x = mkt[0].toFixed(fixedLen);
        this.locationData.y = mkt[1].toFixed(fixedLen);
        break;

      case "wgs": //标准wgs84格式坐标
        fixedLen = this.options.hasOwnProperty("toFixed") ? this.options.toFixed : 6;
        var wgsPoint = this.viewer.das.point2wgs({ x: jd, y: wd }); //坐标转换为wgs
        this.locationData.x = wgsPoint.x.toFixed(fixedLen);
        this.locationData.y = wgsPoint.y.toFixed(fixedLen);
        break;
      case "wgs-degree": //标准wgs84格式坐标
        var wgsPointD = this.viewer.das.point2wgs({ x: jd, y: wd }); //坐标转换为wgs
        this.locationData.x = _util.formatDegree(wgsPointD.x);
        this.locationData.y = _util.formatDegree(wgsPointD.y);
        break;
    }

    var inhtml;
    if (typeof this.format === "function") {
      //回调方法
      inhtml = this.format(this.locationData);
    } else {
      inhtml = _util.template(this.format, this.locationData);
    }
    this._domContent.html(inhtml);
  }
  updaeCamera() {
    if (!this._visible) return;

    if (this.viewer.scene.mode !== Cesium.SceneMode.SCENE3D) {
      return;
    }

    this.locationData.height = this.viewer.camera.positionCartographic.height.toFixed(1);
    this.locationData.heading = Cesium.Math.toDegrees(this.viewer.camera.heading).toFixed(0);
    this.locationData.pitch = Cesium.Math.toDegrees(this.viewer.camera.pitch).toFixed(0);
    this.locationData.level = this.viewer.das.level;

    if (this.locationData.x == null) return;

    var inhtml;
    if (typeof this.format === "function") {
      //回调方法
      inhtml = this.format(this.locationData);
    } else {
      inhtml = _util.template(this.format, this.locationData);
    }

    this._domContent.html(inhtml);
  }

  css(style) {
    this._dom.css(style);
  }

  destroy() {
    //相机移动结束事件
    this.viewer.scene.camera.moveEnd.removeEventListener(this.updaeCamera, this);
    this.viewer.das.off(eventType.mouseMove, this.mouseMoveHandler, this);

    if (this.options.fps) {
      this.viewer.scene.debugShowFramesPerSecond = false;
    }

    if (this.timeTik) {
      clearInterval(this.timeTik);
      this.timeTik = null;
    }

    this._dom.remove();

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
