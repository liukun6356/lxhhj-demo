import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { isNumber, formatLength } from "../util/util";
import * as daslog from "../util/log";
import { formatPosition } from "../util/point";
import { computeSurfaceLine, computeStepSurfaceLine } from "../util/polyline";
import { getOnLinePointByLen } from "../util/matrix";
import { BaseFlyLine } from "./BaseFlyLine";

//飞行路线管理类【静态一次性传入的数据】
export class FlyLine extends BaseFlyLine {
  //========== 对外属性 ==========
  //当前信息
  get info() {
    return this.timeinfo;
  }

  //========== 方法 ==========
  init() {
    this._isStart = false;

    if (this.options.points) this.createPath(this.options.points, this.options);
  }

  //创建并计算飞行时间及坐标
  createPath(lonlats, options) {
    if (!lonlats || lonlats.length < 2) {
      daslog.warn("路线无坐标数据，无法漫游！", lonlats);
      return;
    }
    this.points = lonlats; //坐标

    options = options || {};

    var offsetHeight = Cesium.defaultValue(options.offsetHeight, 0);

    var startTime; //飞行开始时间
    var stopTime; //飞行结束时间
    if (options.startTime) startTime = Cesium.JulianDate.fromDate(new Date(options.startTime));
    else startTime = this.viewer.clock.currentTime;

    var arrSpeed = options.speed;
    var isSpeedArray = !isNumber(arrSpeed);
    if (lonlats.length == 2) {
      //2个点时，需要插值，否则穿地
      var centerPt = [
        (lonlats[0][0] + lonlats[1][0]) / 2,
        (lonlats[0][1] + lonlats[1][1]) / 2,
        lonlats[0][2]
      ];
      lonlats.splice(1, 0, centerPt);
      if (arrSpeed && isSpeedArray) arrSpeed.splice(1, 0, arrSpeed[0]);
    }

    var property = new Cesium.SampledPositionProperty();
    this.positions = [];
    this.times = [];

    var defSpeed = 100; //无速度值时的 默认速度  单位：千米/小时
    var speedsNew = [];

    var alltimes = 0; //总时长,单位：秒
    var alllen = 0; //总长度,单位：米
    var stepLen = {}; //每一步的距离长度
    var stepTime = {}; //每一步的时长
    var lastPoint;
    for (var i = 0, length = lonlats.length; i < length; i++) {
      var lonlat = lonlats[i];
      var item = Cesium.Cartesian3.fromDegrees(
        lonlat[0],
        lonlat[1],
        (lonlat[2] || 0) + offsetHeight
      );
      item.lonlat = lonlat;

      var sTime;
      if (i == 0) {
        //起点
        sTime = Cesium.JulianDate.addSeconds(startTime, alltimes, new Cesium.JulianDate());
        item.time = sTime;
        item.second = alltimes;
        property.addSample(sTime, item);
      } else {
        var speed = isSpeedArray ? (arrSpeed ? arrSpeed[i - 1] : defSpeed) : arrSpeed || defSpeed;
        speedsNew.push(speed);

        speed = speed / 3.6; //速度：km/h换算m/s

        var len = Cesium.Cartesian3.distance(item, lastPoint);
        var stime = len / speed;
        if (stime < 0.01) stime = 0.01; //限定为最小值，防止速度值设置太大时，为0的错误

        alltimes += stime;
        alllen += len;

        sTime = Cesium.JulianDate.addSeconds(startTime, alltimes, new Cesium.JulianDate());
        item.time = sTime;
        item.second = alltimes;
        property.addSample(sTime, item);

        if (options.pauseTime) {
          if (typeof options.pauseTime === "function") {
            alltimes += options.pauseTime(i, item);
          } else {
            alltimes += options.pauseTime;
          }
          sTime = Cesium.JulianDate.addSeconds(startTime, alltimes, new Cesium.JulianDate());
          property.addSample(sTime, getOnLinePointByLen(lastPoint, item, 0.01, true));
        }
      }
      lastPoint = item;
      this.positions.push(item);
      this.times.push(sTime);

      stepLen[i] = alllen;
      stepTime[i] = alltimes;
    }
    this.arrSpeed = speedsNew;

    this.lastItem = {
      position: this.positions[this.positions.length - 1],
      time: this.times[this.times.length - 1]
    };

    stopTime = Cesium.JulianDate.addSeconds(startTime, alltimes, new Cesium.JulianDate());

    this.alltimes = alltimes;
    this.alllen = alllen;
    this.stepLen = stepLen;
    this.stepTime = stepTime;

    this.startTime = startTime;
    this.stopTime = stopTime;

    this.property = property;
    this.velocityOrientation = new Cesium.VelocityOrientationProperty(this.property); //基于移动位置自动计算方位

    //插值，使折线边平滑 ,并且长距离下不穿地
    if (options.interpolation) {
      this.property.setInterpolationOptions({
        interpolationDegree: options.interpolationDegree || 2,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation //HermitePolynomialApproximation
      });
    }
  }

  start(opts) {
    if (!Cesium.defined(this.positions) || this.positions.length == 0) {
      daslog.warn("没有坐标数据，飞行路线启动失败", this.positions);
      return;
    }

    if (this._isStart) this.stop();
    this._isStart = true;

    this._createEntity();

    //=====================绑定clock timeline====================
    if (Cesium.defined(this.options.multiplier)) {
      //飞行速度
      this._bak_multiplier = this.viewer.clock.multiplier;
      this.viewer.clock.multiplier = this.options.multiplier;
    }

    this.viewer.clock.shouldAnimate = true;
    this.viewer.clock.currentTime = this.startTime.clone();

    if (this.options.clockRange === Cesium.ClockRange.LOOP_STOP || this.options.clockLoop) {
      //循环播放
      this._bak_clockRange = this.viewer.clock.clockRange;
      this._bak_startTime = this.viewer.clock.startTime;
      this._bak_stopTime = this.viewer.clock.stopTime;

      //Cesium.ClockRange.CLAMPED 到达终点后停止，Cesium.ClockRange.LOOP_STOP 到达终止时间后 循环从头播放
      this.viewer.clock.clockRange = Cesium.defaultValue(
        this.options.clockRange,
        Cesium.ClockRange.LOOP_STOP
      );
      this.viewer.clock.startTime = this.startTime.clone();
      this.viewer.clock.stopTime = this.stopTime.clone();
    }

    if (this.viewer.timeline) this.viewer.timeline.zoomTo(this.startTime, this.stopTime);

    //加投影
    if (this.options.shadow && this.options.shadow.length > 0) {
      this._addArrShading();
    }

    this._flyok_point_index = 0; //优化查询效率，飞行过的点id
    this.fire(eventType.endItem, {
      index: this._flyok_point_index,
      counts: this.positions.length
    });
    this.fire(eventType.start);
    this.viewer.scene.preRender.addEventListener(this.preRender_eventHandler, this);
  }

  //停止，结束漫游
  stop() {
    this.viewer.trackedEntity = undefined;
    this.viewer.scene.preRender.removeEventListener(this.preRender_eventHandler, this);

    if (this.entity) {
      this.viewer.entities.remove(this.entity);
      delete this.entity;
    }
    if (this.arrShowingEntity) {
      for (var i = 0, len = this.arrShowingEntity.length; i < len; i++) {
        this.viewer.entities.remove(this.arrShowingEntity[i]);
      }
      delete this.arrShowingEntity;
    }

    if (this._bak_startTime) {
      this.viewer.clock.startTime = this._bak_startTime;
      delete this._bak_startTime;
    }
    if (this._bak_stopTime) {
      this.viewer.clock.stopTime = this._bak_stopTime;
      delete this._bak_stopTime;
    }
    if (this._bak_multiplier) {
      this.viewer.clock.multiplier = this._bak_multiplier;
      delete this._bak_multiplier;
    }
    if (this._bak_clockRange) {
      this.viewer.clock.clockRange = this._bak_clockRange;
      delete this._bak_clockRange;
    }

    // this._flyok_point_index = 0;
    // this._isStart = false;
    // this.fire(eventType.end);
  }

  //实时监控事件
  preRender_eventHandler(e) {
    if (!this._isStart || this.entity == null) return;

    if (this.viewer.clock.shouldAnimate && Cesium.JulianDate.greaterThanOrEquals(this.viewer.clock.currentTime, this.stopTime)) {
      this._flyok_point_index = this.positions.length - 1;

      //Cesium.ClockRange.CLAMPED 到达终点后停止，Cesium.ClockRange.LOOP_STOP 到达终止时间后 循环从头播放

      if (this.options.autoStop || this.viewer.clock.clockRange == Cesium.ClockRange.UNBOUNDED)
        this.stop();

      if (!this._onStepTempBS) {
        this.fire(eventType.endItem, {
          index: this._flyok_point_index,
          counts: this.positions.length
        });

        this._isStart = false;
        this._flyok_point_index = 0;

        this.fire(eventType.end);
        this._onStepTempBS = true; //为了标识只回调一次
      }

      return;
    }

    //当前点
    var _position = this.position;
    if (Cesium.defined(_position)) {
      switch (
        this.options.camera.type //视角处理
      ) {
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
            new Cesium.Cartesian3(-1, 0, this.options.camera.followedZ) //followedZ 距离运动点的高度（上方）
          );
          break;
      }

      //实时监控
      if (this.viewer.clock.shouldAnimate) this.realTime(_position);
    }
  }

  realTime(position) {
    var time = Cesium.JulianDate.secondsDifference(this.viewer.clock.currentTime, this.startTime); //已飞行时间
    var point = formatPosition(position);

    var currIndex = this.getCurrIndex();
    var lineLength = this.positions.length;
    // if (currIndex < 0) currIndex = 0;
    // if (currIndex >= lineLength) currIndex = lineLength - 1;

    var thislen = this.stepLen[currIndex];

    var lastPosition = this.positions[currIndex];
    if (Cesium.defined(lastPosition)) thislen += Cesium.Cartesian3.distance(position, lastPosition);

    if (thislen >= this.alllen) {
      currIndex = lineLength - 1;
      thislen = this.alllen;
    }

    if (currIndex != this._flyok_point_index) {
      // daslog.log('已飞行过点：' + currIndex);
      this.fire(eventType.endItem, {
        index: currIndex,
        counts: lineLength
      });
    }
    this._flyok_point_index = currIndex;

    this.timeinfo = {
      time: time, //已飞行时间
      len: thislen, //已飞行距离
      x: point.x,
      y: point.y,
      z: point.z
    };

    if (this.options.shadow && this.options.shadow.length > 0) {
      //投影
      this._updateArrShading(position);
    }

    //求概略的 地面海拔 和 离地高度
    var carto = Cesium.Cartographic.fromCartesian(position);
    var heightTerrain = this.viewer.scene.globe.getHeight(carto); //地形高度
    if (heightTerrain != null && heightTerrain > 0) {
      this.timeinfo.hbgd = heightTerrain;
      this.timeinfo.ldgd = point.z - heightTerrain;
    }

    //求准确的 地面海拔 和 离地高度 (没有此需求时可以关闭，提高效率)
    if (this.options.showGroundHeight) {
      var that = this;
      computeSurfaceLine({
        viewer: that.viewer,
        positions: [position, position],
        callback: function(raisedPositions, noHeight) {
          if (raisedPositions == null || raisedPositions.length == 0 || noHeight) {
            return;
          }

          var hbgd = formatPosition(raisedPositions[0]).z; //地面高程
          var ldgd = point.z - hbgd; //离地高度

          that.timeinfo.hbgd = hbgd;
          that.timeinfo.ldgd = ldgd;

          if (that.entity.label) {
            var fxgd_str = formatLength(that.timeinfo.z);
            var ldgd_str = formatLength(that.timeinfo.ldgd);
            that.entity.label.text =
              that.name + "\n" + "漫游高程：" + fxgd_str + "\n离地距离：" + ldgd_str;
          }
        }
      });
    }
  }

  //计算贴地线
  clampToGround(onEnd, opts) {
    opts = opts || {};

    //贴地线
    var lonlats = this.points;
    var arrSpeed = this.arrSpeed || this.options.speed;
    var lonlatsNew = [];
    var speedsNew = [];

    //剖面的数据
    var alllen = 0;
    var arrLength = [];
    var arrHbgd = [];
    var arrFxgd = [];
    var arrPoint = [];

    var that = this;
    computeStepSurfaceLine({
      viewer: this.viewer,
      positions: this.positions,
      has3dtiles: opts.has3dtiles,
      splitNum: opts.splitNum,
      offset: opts.offset,
      //计算每个分段后的回调方法
      endItem: function(raisedPositions, noHeight, index) {
        var speed = arrSpeed[index];

        if (noHeight) {
          lonlatsNew.push(lonlats[index]);
          speedsNew.push(speed);
        } else {
          for (let i = 0; i < raisedPositions.length; i++) {
            var position = raisedPositions[i];
            var carto = Cesium.Cartographic.fromCartesian(position);

            lonlatsNew.push([
              Cesium.Math.toDegrees(carto.longitude),
              Cesium.Math.toDegrees(carto.latitude),
              carto.height
            ]);
            speedsNew.push(speed);
          }
        }

        //剖面的数据
        var h1 = lonlats[index][2] || 0;
        var h2 = lonlats[index + 1][2] || 0;
        var hstep = (h2 - h1) / raisedPositions.length;

        for (let i = 0; i < raisedPositions.length; i++) {
          //已飞行长度
          if (i != 0) {
            alllen += Cesium.Cartesian3.distance(raisedPositions[i], raisedPositions[i - 1]);
          }
          arrLength.push(Number(alllen.toFixed(1)));

          //坐标
          var point = formatPosition(raisedPositions[i]);
          arrPoint.push(point);

          //海拔高度
          var hbgd = noHeight ? 0 : point.z;
          arrHbgd.push(hbgd);

          //飞行高度
          var fxgd = Number((h1 + hstep * i).toFixed(1));
          arrFxgd.push(fxgd);
        }
      },
      //计算全部完成的回调方法
      end: function() {
        //剖面的数据(记录下，提高效率，避免多次计算)
        that.terrainHeight = {
          arrLength: arrLength,
          arrFxgd: arrFxgd,
          arrHbgd: arrHbgd,
          arrPoint: arrPoint
        };

        that.createPath(lonlatsNew, {
          ...that.options,
          speed: speedsNew
        });

        if (onEnd) {
          onEnd({ lonlats: lonlatsNew, speed: speedsNew });
        }
      }
    });
  }

  //获取剖面数据
  getTerrainHeight(callback, opts) {
    if (this.terrainHeight) {
      callback(this.terrainHeight);
      return this.terrainHeight;
    } else {
      opts = opts || {};

      var lonlats = this.points;

      //剖面的数据
      var alllen = 0;
      var arrLength = [];
      var arrHbgd = [];
      var arrFxgd = [];
      var arrPoint = [];

      var that = this;
      computeStepSurfaceLine({
        viewer: this.viewer,
        positions: this.positions,
        has3dtiles: opts.has3dtiles,
        splitNum: opts.splitNum,
        offset: opts.offset,
        //计算每个分段后的回调方法
        endItem: function(raisedPositions, noHeight, index) {
          //剖面的数据
          var h1 = lonlats[index][2] || 0;
          var h2 = lonlats[index + 1][2] || 0;
          var hstep = (h2 - h1) / raisedPositions.length;

          for (var i = 0; i < raisedPositions.length; i++) {
            //已飞行长度
            if (i != 0) {
              alllen += Cesium.Cartesian3.distance(raisedPositions[i], raisedPositions[i - 1]);
            }
            arrLength.push(Number(alllen.toFixed(1)));

            //坐标
            var point = formatPosition(raisedPositions[i]);
            arrPoint.push(point);

            //海拔高度
            var hbgd = noHeight ? 0 : point.z;
            arrHbgd.push(hbgd);

            //飞行高度
            var fxgd = Number((h1 + hstep * i).toFixed(1));
            arrFxgd.push(fxgd);
          }
        },
        //计算全部完成的回调方法
        end: function() {
          //剖面的数据(记录下，提高效率，避免多次计算)
          that.terrainHeight = {
            arrLength: arrLength,
            arrFxgd: arrFxgd,
            arrHbgd: arrHbgd,
            arrPoint: arrPoint
          };
          callback(that.terrainHeight);
        }
      });
    }
  }

  toJSON() {
    return this.options;
  }

  destroy() {
    this.stop();
    super.destroy();
  }
}

//[静态属性]本类中支持的事件类型常量
FlyLine.event = {
  start: eventType.start,
  endItem: eventType.endItem,
  end: eventType.end
};
