import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import { isObject, isString } from "../util/util";
import * as daslog from "../util/log";
import { formatPosition, getRectangle, sliceByMaxDistance } from "../util/point";
import { getHeadingPitchRollByOrientation, getRayEarthPositionByMatrix } from "../util/matrix";
import * as drawAttr from "../draw/attr/index";

//飞行路线管理类 基类
export class BaseFlyLine extends DasClass {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options.onStep) {
      var onStepfun = options.onStep;
      delete options.onStep;
      this.on(eventType.endItem, e => {
        onStepfun(e.index, e.counts);
      });
    }
    if (isObject(options.shadow) && options.shadow.show) {
      //兼容v1版本shadow
      options.shadow = [options.shadow];
    }
    this.toGeoJSON = this.toJSON;
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = viewer;
    this.options = options; //属性
    this._mergeDefVal(); //合并默认值

    this.id = options.id || 0;
    this.name = options.name || "";
    this._popup = options.popup;
    this._tooltip = options.tooltip;
    this._fixedFrameTransform = Cesium.defaultValue(
      options.fixedFrameTransform,
      Cesium.Transforms.eastNorthUpToFixedFrame
    ); //参考系

    this.positions = [];
    this.times = [];

    this.init();
  }

  //========== 对外属性 ==========
  get data() {
    return this.options;
  }
  set data(item) {
    for (var key in item) {
      this.options[key] = item[key];
    }
  }

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
      path: {
        show: false,
        lineType: "solid",
        color: "#3388ff",
        opacity: 0.5,
        width: 1,
        outline: false,
        outlineColor: "#ffffff",
        outlineWidth: 2
      },
      camera: { type: "", followedX: 50, followedZ: 10 },
      showGroundHeight: false
    };
  }
  _mergeDefVal() {
    for (var key in this.defConfig) {
      var val = this.defConfig[key];

      if (this.options.hasOwnProperty(key) && typeof this.options[key] === "object") {
        for (var key2 in val) {
          if (!this.options[key].hasOwnProperty(key2)) this.options[key][key2] = val[key2];
        }
      } else {
        if (!Cesium.defined(this.options[key])) this.options[key] = val;
      }
    }
  }

  //提示框
  get popup() {
    return this._popup;
  }
  set popup(value) {
    this._popup = value;
    if (this.entity) this.entity.popup = value;
  }
  get tooltip() {
    return this._tooltip;
  }
  set tooltip(value) {
    this._tooltip = value;
    if (this.entity) this.entity.tooltip = value;
  }

  //已经飞行过的点index
  get indexForFlyOK() {
    return this._flyok_point_index;
  }

  // 当前点
  get position() {
    var position = Cesium.Property.getValueOrUndefined(
      this.property,
      this.viewer.clock.currentTime,
      new Cesium.Cartesian3()
    );
    // if (!position && this.positions && this.positions.length > 0) {
    //   position = this.positions[this.positions.length - 1];
    // }
    if (!position && this._lastItem) {
      position = this._lastItem.position;
    }
    return position;
  }

  //无坐标时的最后一个位置及信息
  get lastItem() {
    return this._lastItem;
  }
  set lastItem(value) {
    this._lastItem = value;
  }

  // 获取当前角度
  get orientation() {
    var _orientation = Cesium.Property.getValueOrUndefined(
      this.velocityOrientation,
      this.viewer.clock.currentTime,
      new Cesium.Quaternion()
    );
    return _orientation;
  }

  // 获取当前hdr角度
  get hdr() {
    var position = this.position; //当前点
    var _orientation = this.orientation; //获取当前角度
    if (!position || !_orientation) return null;

    var autoHpr = getHeadingPitchRollByOrientation(
      position,
      _orientation,
      this.viewer.scene.globe.ellipsoid,
      this._fixedFrameTransform
    );
    return autoHpr;
  }

  // 获取当前矩阵
  get matrix() {
    return this.getModelMatrix();
  }

  get heading() {
    if (!Cesium.defined(this._heading)) {
      var hdr = this.hdr;
      if (hdr) return hdr.heading;
      else return null;
    }
    return this._heading;
  }
  get pitch() {
    if (!Cesium.defined(this._pitch)) {
      var hdr = this.hdr;
      if (hdr) return hdr.pitch;
      else return null;
    }
    return this._pitch;
  }
  set pitch(val) {
    this._pitch = val;
    this.updateAngle(false, { pitch: this._pitch, roll: this._roll });
  }

  get roll() {
    if (!Cesium.defined(this._roll)) {
      var hdr = this.hdr;
      if (hdr) return hdr.roll;
      else return null;
    }
    return this._roll;
  }
  set roll(val) {
    this._roll = val;
    this.updateAngle(false, { pitch: this._pitch, roll: this._roll });
  }

  //求射线与地球相交点
  get groundPosition() {
    return getRayEarthPositionByMatrix(this.matrix, true, this.viewer.scene.globe.ellipsoid);
  }

  //========== 方法 ==========
  init() {}

  _createEntity() {
    var entityAttr = {
      name: this.name,
      position: new Cesium.CallbackProperty(time => {
        return this.position;
      }, false),
      orientation: this.velocityOrientation,
      point: {
        //必须有对象，否则viewer.trackedEntity无法跟随(无model时使用)
        show: !(this.options.model && this.options.model.show),
        color: Cesium.Color.fromCssColorString("#ffffff").withAlpha(0.01),
        pixelSize: 1
      }
      // show: false
    };

    if (this.options.label && this.options.label.show) {
      this.options.label.text = this.options.label.text || this.name;
      entityAttr.label = drawAttr.label.style2Entity(this.options.label, null, this);
    }
    if (this.options.billboard && this.options.billboard.show) {
      entityAttr.billboard = drawAttr.billboard.style2Entity(this.options.billboard);
    }
    if (this.options.point && this.options.point.show) {
      entityAttr.point = drawAttr.point.style2Entity(this.options.point);
    }
    if (this.options.model && this.options.model.show) {
      entityAttr.model = drawAttr.model.style2Entity(this.options.model);
    }
    if (this.options.path && this.options.path.show) {
      var pathAttr = drawAttr.polyline.style2Entity(this.options.path);
      if (!pathAttr.isAll) {
        pathAttr.leadTime = 0; //只显示飞过的路线
        pathAttr.trailTime = this.alltimes * 10;
      }
      entityAttr.path = pathAttr;
      entityAttr.position = this.property; //path时需要为直接property
    }
    if (this.options.circle && this.options.circle.show) {
      entityAttr.ellipse = drawAttr.circle.style2Entity(this.options.circle);
    }
    this.entity = this.viewer.entities.add(new Cesium.Entity(entityAttr));

    this.entity.eventTarget = this;
    if (this.popup) this.entity.popup = this.popup;
    if (this.tooltip) this.entity.tooltip = this.tooltip;
  }

  updateConfig(params) {
    return this.updateStyle(params);
  }

  updateStyle(params) {
    if (!this.options) return;
    for (var i in params) {
      if (typeof params[i] === "object" && this.options[i]) {
        for (var key2 in params[i]) {
          this.options[i][key2] = params[i][key2];
        }
      } else {
        this.options[i] = params[i];
      }
    }
  }

  updateAngle(isAuto, opts) {
    if (isAuto) {
      this.entity.orientation = this.velocityOrientation; //基于移动位置自动计算方位

      this._heading = null;
      this._pitch = null;
      this._roll = null;
    } else {
      opts = opts || {};

      var position = this.position; //当前点
      var _orientation = this.orientation; //获取当前角度
      if (!position || !_orientation) return null;

      var autoHpr = getHeadingPitchRollByOrientation(
        position,
        _orientation,
        this.viewer.scene.globe.ellipsoid,
        this._fixedFrameTransform
      );

      //重新赋值新角度
      var heading = autoHpr.heading;
      var pitch = Cesium.Math.toRadians(Number(opts.pitch || 0.0));
      var roll = Cesium.Math.toRadians(Number(opts.roll || 0.0));

      this._heading = heading;
      this._pitch = pitch;
      this._roll = roll;

      this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
        position,
        new Cesium.HeadingPitchRoll(heading, pitch, roll),
        this.viewer.scene.globe.ellipsoid,
        this._fixedFrameTransform
      );
    }
  }

  //获取已飞行完成的点的位置
  //JulianDate.compare(left, right), 如果left小于right，则为负值；如果left大于right，则为正值；如果left和right相等，则为零。
  getCurrIndex() {
    var lineLength = this.times.length - 1;
    if (lineLength < 0) return -1;

    if (Cesium.JulianDate.compare(this.viewer.clock.currentTime, this.times[0]) <= 0) {
      this._flyok_point_index = 0;
    }
    if (this._flyok_point_index < 0 || this._flyok_point_index >= lineLength)
      this._flyok_point_index = 0;

    for (let i = this._flyok_point_index; i <= lineLength; i++) {
      let time = this.times[i];
      if (Cesium.JulianDate.compare(this.viewer.clock.currentTime, time) <= 0) {
        return i - 1;
      }
    }
    for (let i = 0; i <= lineLength; i++) {
      let time = this.times[i];
      if (Cesium.JulianDate.compare(this.viewer.clock.currentTime, time) <= 0) {
        return i - 1;
      }
    }
    return lineLength;
  }

  //锁定视角计算
  getModelMatrix() {
    var matrix4 = new Cesium.Matrix4();
    var matrix3Scratch = new Cesium.Matrix3();

    var position = this.position;
    if (!Cesium.defined(position)) {
      return undefined;
    }
    var result;
    var orientation = this.orientation;
    if (!Cesium.defined(orientation)) {
      result = this._fixedFrameTransform(position, undefined, matrix4);
    } else {
      result = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromQuaternion(orientation, matrix3Scratch),
        position,
        matrix4
      );
    }
    return result;
  }

  //加投影等额外的entity对象
  _addArrShading() {
    this.arrShowingEntity = [];
    for (var i = 0, len = this.options.shadow.length; i < len; i++) {
      var item = this.options.shadow[i];
      if (!item.show) continue;
      this.addShading(item);
    }
  }
  _updateArrShading(position) {
    for (var i = 0, len = this.options.shadow.length; i < len; i++) {
      var item = this.options.shadow[i];
      if (!item.show) continue;
      let positions;
      switch (item.type) {
        case "wall":
          positions = this.positions.slice(0, this._flyok_point_index + 1);
          positions.push(position);
          this.updateWallShading(positions);
          break;
        case "polyline":
          positions = this.positions.slice(0, this._flyok_point_index + 1);
          positions.push(position);
          if (item.maxDistance)
            this._passed_positions = sliceByMaxDistance(positions, item.maxDistance);
          else this._passed_positions = positions;
          break;
        case "polyline-going":
          positions = [position].concat(this.positions.slice(this._flyok_point_index + 1));
          this._going_positions = positions;
          break;
      }
    }
  }

  //添加单个投影
  addShading(item) {
    var entity;
    switch (item.type) {
      case "wall":
        entity = this.addWallShading(item);
        break;
      case "cylinder":
        entity = this.addCylinderShading(item);
        break;
      case "circle":
        entity = this.addCircleShading(item);
        break;
      case "polyline":
      case "polyline-going":
        entity = this.addPolylineShading(item);
        break;
      default:
        daslog.warn("存在未标识type的无效shadow配置", item);
        break;
    }
    if (entity) {
      entity.data = item;
      this.arrShowingEntity.push(entity);
    }
  }

  //移除单个投影
  removeShading(entity) {
    if (entity == null) {
      if (this.arrShowingEntity.length == 0) return;
      //为空时，默认删除最后一个。
      var index = this.arrShowingEntity.length - 1;
      this.viewer.entities.remove(this.arrShowingEntity[index]);
      this.arrShowingEntity.splice(index, 1);
    } else if (isString(entity)) {
      //删除指定类型的
      for (let i = 0, len = this.arrShowingEntity.length; i < len; i++) {
        if (this.arrShowingEntity[i].data.type == entity) {
          this.viewer.entities.remove(this.arrShowingEntity[i]);
          this.arrShowingEntity.splice(i, 1);
          break;
        }
      }
      return;
    } else {
      //删除传入的entity
      this.viewer.entities.remove(entity);
      if (this.arrShowingEntity) {
        for (let i = 0, len = this.arrShowingEntity.length; i < len; i++) {
          if (this.arrShowingEntity[i] == entity) {
            this.arrShowingEntity.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  //垂直线立体投影
  addWallShading(options) {
    this._wall_positions = [];
    this._wall_minimumHeights = [];
    this._wall_maximumHeights = [];

    options = { ...{ color: "#00ff00", outline: false, opacity: 0.3 }, ...options };

    var that = this;
    var wallattr = drawAttr.wall.style2Entity(options);
    wallattr.minimumHeights = new Cesium.CallbackProperty(time => {
      return that._wall_minimumHeights;
    }, false);
    wallattr.maximumHeights = new Cesium.CallbackProperty(time => {
      return that._wall_maximumHeights;
    }, false);
    wallattr.positions = new Cesium.CallbackProperty(time => {
      return that._wall_positions;
    }, false);

    var wallEntity = this.viewer.entities.add(
      new Cesium.Entity({
        wall: wallattr
      })
    );
    return wallEntity;
  }

  updateWallShading(positions) {
    var newposition = [];
    var minimumHeights = [];
    var maximumHeights = [];
    for (var i = 0; i < positions.length; i++) {
      var point = positions[i].clone();
      if (!point) continue;

      newposition.push(point);
      var carto = Cesium.Cartographic.fromCartesian(point);
      minimumHeights.push(0);
      maximumHeights.push(carto.height);
    }
    this._wall_positions = newposition;
    this._wall_minimumHeights = minimumHeights;
    this._wall_maximumHeights = maximumHeights;
  }

  //圆锥立体 投影
  addCylinderShading(options) {
    var bottomRadiusNow = 100;
    var lengthNow = 100;

    var that = this;

    options = { ...{ color: "#00ff00", outline: false, opacity: 0.3 }, ...options };

    var wallattr = drawAttr.wall.style2Entity(options); //主要是颜色值等属性
    wallattr.length = new Cesium.CallbackProperty(time => {
      return lengthNow;
    }, false);
    wallattr.topRadius = 0;
    wallattr.bottomRadius = new Cesium.CallbackProperty(time => {
      return bottomRadiusNow;
    }, false);
    wallattr.numberOfVerticalLines = 0;

    var cylinderEntity = this.viewer.entities.add(
      new Cesium.Entity({
        position: new Cesium.CallbackProperty(time => {
          var position = that.position;
          if (!position) return null;
          var car = Cesium.Cartographic.fromCartesian(position);
          var newPoint = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, car.height / 2);

          lengthNow = car.height;
          bottomRadiusNow = lengthNow * 0.3; //地面圆半径

          return newPoint;
        }, false),
        cylinder: wallattr
      })
    );
    return cylinderEntity;
  }

  //扩散圆 投影
  addCircleShading(options) {
    var attr = drawAttr.circle.style2Entity(options);

    var entity = this.viewer.entities.add(
      new Cesium.Entity({
        position: this.property,
        ellipse: attr
      })
    );
    return entity;
  }

  //polyline路线 投影
  addPolylineShading(options) {
    var that = this;
    var attr = drawAttr.polyline.style2Entity(options);
    attr.positions = new Cesium.CallbackProperty(time => {
      if (options.type == "polyline-going") return that._going_positions;
      else return that._passed_positions;
    }, false);

    var entity = this.viewer.entities.add(
      new Cesium.Entity({
        polyline: attr
      })
    );
    return entity;
  }

  //视角定位[路线范围]
  centerAt(opts) {
    opts = opts || {};

    var rectangle = getRectangle(this.positions);
    this.viewer.camera.flyTo({
      duration: Cesium.defaultValue(opts.duration, 0),
      destination: rectangle
    });
    return rectangle;
  }

  //视角定位[目标点]
  flyTo(opts) {
    opts = opts || {};

    var viewer = this.viewer;
    var position = this.position;
    if (!position) return;

    if (this.viewer.scene.mode == Cesium.SceneMode.SCENE3D) {
      this.viewer.clock.shouldAnimate = false;
      setTimeout(() => {
        var heading =
          Cesium.Math.toDegrees(this.hdr.heading) + Cesium.defaultValue(opts.heading, 0);

        viewer.das.centerPoint(position, {
          radius: Cesium.defaultValue(opts.radius, Cesium.defaultValue(opts.distance, 500)), //距离目标点的距离
          heading: heading,
          pitch: Cesium.defaultValue(opts.pitch, -50),
          duration: 0.1,
          complete: function() {
            viewer.clock.shouldAnimate = true;
          }
        });
      }, 500);
    } else {
      //二维模式下
      if (this.entity) this.viewer.flyTo(this.entity);
    }
  }

  //暂停
  pause() {
    this.viewer.clock.shouldAnimate = false;
  }
  //继续
  proceed() {
    this.viewer.clock.shouldAnimate = true;
  }

  toCZML() {
    //时间
    var currentTime = this.times[0].toString();
    var stopTime = this.times[this.times.length - 1].toString();

    //路径位置点
    var cartographicDegrees = [];
    for (var i = 0, length = this.positions.length; i < length; i++) {
      var item = formatPosition(this.positions[i]);
      var second =
        i == 0 ? 0 : Cesium.JulianDate.secondsDifference(this.times[i], this.times[i - 1]);

      cartographicDegrees.push(second);
      cartographicDegrees.push(item.x);
      cartographicDegrees.push(item.y);
      cartographicDegrees.push(item.z);
    }

    var czmlLine = {
      id: this.name,
      description: this.options.remark,
      availability: currentTime + "/" + stopTime,
      orientation: {
        //方向
        velocityReference: "#position"
      },
      position: {
        //位置
        epoch: currentTime,
        cartographicDegrees: cartographicDegrees
      }
    };
    if (this.options.interpolation) {
      czmlLine.position.interpolationAlgorithm = "LAGRANGE"; //插值时使用的插值算法,有效值为“LINEAR”，“LAGRANGE”和“HERMITE”。
      czmlLine.position.interpolationDegree = this.options.interpolationDegree || 2; //插值时使用的插值程度。
    }

    if (this.options.label.show) {
      //是否显示注记
      czmlLine.label = {
        show: true,
        outlineWidth: 2,
        text: this.name,
        font: "12pt 微软雅黑 Console",
        outlineColor: { rgba: [0, 0, 0, 255] },
        horizontalOrigin: "LEFT",
        fillColor: { rgba: [213, 255, 0, 255] }
      };
    }
    if (this.options.path.show) {
      //是否显示路线
      czmlLine.path = {
        //路线
        show: true,
        material: { solidColor: { color: { rgba: [255, 0, 0, 255] } } },
        width: 5,
        resolution: 1,
        leadTime: 0,
        trailTime: this.alltimes
      };
    }
    //漫游对象(模型)
    if (this.options.model.show) {
      //是否显示模型
      czmlLine.model = this.options.model;
    }

    var czml = [
      {
        version: "1.0",
        id: "document",
        clock: {
          interval: currentTime + "/" + stopTime,
          currentTime: currentTime,
          multiplier: 1
        }
      },
      czmlLine
    ];
    return czml;
  }

  destroy() {
    if (this.viewer.trackedEntity == this.entity) {
      this.viewer.trackedEntity = undefined;
    }
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

    this.stop();
    super.destroy();
  }
}
