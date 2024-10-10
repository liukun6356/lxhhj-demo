import * as Cesium from "cesium";

import { BaseFlyLine } from "./BaseFlyLine";

//飞行路线管理类 【动态传入的数据】
export class DynamicFlyLine extends BaseFlyLine {
  //参数默认值
  get defConfig() {
    return {
      model: { show: false, scale: 1, minimumPixelSize: 50 },
      label: {
        show: false,
        color: "#ffffff",
        opacity: 1,
        font_family: "楷体",
        font_size: 20,
        border: true,
        border_color: "#000000",
        border_width: 3,
        background: false,
        hasPixelOffset: true,
        pixelOffsetX: 30,
        pixelOffsetY: -30,
        scaleByDistance: true,
        scaleByDistance_far: 10000000,
        scaleByDistance_farValue: 0.4,
        scaleByDistance_near: 5000,
        scaleByDistance_nearValue: 1
      },
      camera: { type: "", followedX: 50, followedZ: 10 },
      showGroundHeight: false
    };
  }

  //========== 方法 ==========
  init() {
    this._maxCount = Cesium.defaultValue(this.options.maxCount, 50); //保留的坐标点数量

    this.property = new Cesium.SampledPositionProperty();
    this.velocityOrientation = new Cesium.VelocityOrientationProperty(this.property); //基于移动位置自动计算方位

    delete this.options.path; //动态时非直接property，但path需要property，所以去掉path，可以用 "shadow": [{ "show": true, "type": "polyline", "color": "#ff0000" }]
    this._createEntity();

    this.entity.show = true;
    this.viewer.clock.shouldAnimate = true;

    //加投影
    if (this.options.shadow && this.options.shadow.length > 0) {
      this._addArrShading();
    }
    this.viewer.scene.preRender.addEventListener(this.preRender_eventHandler, this);
  }
  //根据传入的坐标数组，构造路线。
  updatePath(points, options = {}) {
    if (!points || points.length === 0) return;

    if (!this.property) {
      this.property = new Cesium.SampledPositionProperty();
      this.entity.orientation = new Cesium.VelocityOrientationProperty(this.property); // 方向
      this.entity.show = true;
    }

    var position, time;
    for (var i = 0, len = points.length; i < len; i++) {
      var item = points[i];
      time = Cesium.JulianDate.fromDate(new Date(item[options.timeColumn || "time"]));
      position = item.position || options.getPosition(item, i);
      this.property.addSample(time, position);

      this.positions.push(position);
      this.times.push(time);
    }

    this.lastItem = {
      position: position,
      time: time
    };

    var duoyu = this.positions.length - this._maxCount;
    if (duoyu > 0) {
      var _starttime = this.times[0];
      var _endtime = this.times[duoyu - 1];
      this.property.removeSamples(
        new Cesium.TimeInterval({
          start: _starttime,
          stop: _endtime
        })
      );

      this.positions.splice(0, duoyu);
      this.times.splice(0, duoyu);
    }

    this.position;
  }

  //实时监控事件
  preRender_eventHandler(e) {
    if (this.positions.length == 0) return;

    //当前点
    var _position = this.position;
    if (Cesium.defined(_position)) {
      //视角处理
      switch (this.options.camera && this.options.camera.type) {
        default:
          //无
          if (this.viewer.trackedEntity != undefined) {
            this.viewer.trackedEntity = undefined;
            this.flyTo(this.options.camera);
          }
          break;
        case "gs": //跟随视角
          if (this.viewer.trackedEntity != this.entity) {
            this.viewer.trackedEntity = this.entity;
            this.flyTo(this.options.camera);
          }
          break;
        case "dy": //锁定第一视角
          if (this.viewer.trackedEntity != this.entity) this.viewer.trackedEntity = this.entity;

          var matrix = this.getModelMatrix();

          var transformX = this.options.camera.followedX; //距离运动点的距离（后方）
          var transformZ = this.options.camera.followedZ; //距离运动点的高度（上方）
          this.viewer.scene.camera.lookAtTransform(
            matrix,
            new Cesium.Cartesian3(-transformX, 0, transformZ)
          );

          break;
        case "sd": //锁定上帝视角
          if (this.viewer.trackedEntity != this.entity) this.viewer.trackedEntity = this.entity;

          this.viewer.scene.camera.lookAtTransform(
            this.getModelMatrix(),
            new Cesium.Cartesian3(-1, 0, this.options.camera.followedZ) //followedZ距离运动点的高度（上方）
          );
          break;
      }

      //实时监控
      if (this.viewer.clock.shouldAnimate) this.realTime(_position);
    }
  }

  realTime(position) {
    this._flyok_point_index = this.getCurrIndex();

    if (this.options.shadow && this.options.shadow.length > 0) {
      //投影
      this._updateArrShading(position);
    }
  }

  destroy() {
    this.viewer.scene.preRender.removeEventListener(this.preRender_eventHandler, this);
    super.destroy();
  }
}

// function removeSamplesAll(property) {
//   var startIndex = 0,
//     numberToRemove = property._times.length;

//   var packedLength = property._packedLength;
//   property._times.splice(startIndex, numberToRemove);
//   property._values.splice(startIndex * packedLength, numberToRemove * packedLength);
//   property._updateTableLength = true;
//   property._definitionChanged.raiseEvent(property);
// }
