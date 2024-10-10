import * as Cesium from "cesium";
import { hasTerrain } from "../layer";
import { getGranularity } from "./util";
import { pick3DTileset } from "./tileset";
import { getSurfaceHeight } from "./point";

//路线进行贴地(或贴模型)插值, splitNum为次数
export function interPolyline(opts) {
  var positions = opts.positions;
  var scene = opts.scene;

  var granularity = getGranularity(positions, opts.splitNum || 100);
  if (granularity <= 0) granularity = null;

  var flatPositions = Cesium.PolylinePipeline.generateArc({
    positions: positions,
    height: opts.height, //未传入时，内部默认为0
    minDistance: opts.minDistance, //插值间隔(米)，优先级高于granularity
    granularity: granularity //splitNum分割的个数
  });

  var arr = [];
  for (var i = 0; i < flatPositions.length; i += 3) {
    var position = Cesium.Cartesian3.unpack(flatPositions, i);
    if (scene && Cesium.defaultValue(opts.surfaceHeight, true)) {
      var height = getSurfaceHeight(scene, position, opts);
      var car = Cesium.Cartographic.fromCartesian(position);
      position = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, height);
    }
    arr.push(position);
  }
  return arr;
}

//计算贴地(或贴模型)路线（异步）
var surfaceLineWork = {
  start: function(params) {
    this.params = params;
    this.scene = params.viewer ? params.viewer.scene : params.scene;

    var positions = params.positions;
    if (positions == null || positions.length == 0) {
      //无数据
      this.end(positions);
      return;
    }
    this.positions = positions;

    //线中间插值
    var _split = Cesium.defaultValue(params.split, true);
    if (_split) {
      positions = interPolyline({
        scene: this.scene,
        positions: positions,
        height: params.height,
        minDistance: params.minDistance,
        surfaceHeight: params.splitSurfaceHeight,
        splitNum: Cesium.defaultValue(params.splitNum, 100)
      });

      var positionsClone = [];
      for (var i = 0, len = positions.length; i < len; ++i) {
        positionsClone.push(positions[i].clone());
      }
      this.positions = positionsClone;
    }

    var _has3dtiles = Cesium.defaultValue(
      params.has3dtiles,
      Cesium.defined(pick3DTileset(this.scene, positions))
    ); //是否在3ditiles上面
    var _hasTerrain = hasTerrain(this.scene); //是否有地形

    this._has3dtiles = _has3dtiles;
    this._hasTerrain = _hasTerrain;

    if (!_hasTerrain && !_has3dtiles) {
      //无地形和无模型时，直接返回
      this.end(positions);
      return;
    }

    //开始分析
    if (_hasTerrain) {
      this.clampToTerrain(positions);
    } else {
      this.clampTo3DTileset(positions);
    }
    return this;
  },
  clampToTerrain: function(positions) {
    var ellipsoid = this.scene.globe.ellipsoid;
    var cartographicArray = ellipsoid.cartesianArrayToCartographicArray(positions);

    //用于缺少地形数据时，赋值的高度
    var tempHeight = Cesium.Cartographic.fromCartesian(positions[0]).height;

    var that = this;
    Cesium.when(
      Cesium.sampleTerrainMostDetailed(this.scene.terrainProvider, cartographicArray),
      function(samples) {
        samples = that.removeNullData(samples);

        var noHeight = false;
        var offset = Cesium.defaultValue(that.params.offset, 0); //增高高度，便于可视

        for (var i = 0; i < samples.length; ++i) {
          if (samples[i].height == null) {
            noHeight = true;
            samples[i].height = tempHeight;
          } else {
            samples[i].height = offset + samples[i].height * that.scene._terrainExaggeration;
          }
        }

        var raisedPositions = ellipsoid.cartographicArrayToCartesianArray(samples);

        if (that._has3dtiles) {
          that.clampTo3DTileset(raisedPositions);
        } else {
          that.end(raisedPositions, noHeight);
        }
      }
    );
  },
  clampTo3DTileset: function(positions) {
    var that = this;
    var positionsClone = [];
    for (var i = 0, len = positions.length; i < len; ++i) {
      positionsClone.push(positions[i].clone());
    }
    this.scene
      .clampToHeightMostDetailed(positionsClone, this.params.objectsToExclude, 0.2)
      .then(function(clampedCartesians) {
        clampedCartesians = that.removeNullData(clampedCartesians);
        if (clampedCartesians.length == 0) {
          clampedCartesians = positions;
        }
        that.end(clampedCartesians);
      });
  },
  end: function(raisedPositions, noHeight) {
    var callback = this.params.callback || this.params.calback; //兼容不同参数名
    if (callback) {
      callback(raisedPositions, noHeight, this.positions);
    }
  },
  removeNullData: function(samples) {
    var arrNew = [];
    for (var i = 0; i < samples.length; ++i) {
      if (samples[i] != null) {
        arrNew.push(samples[i]);
      }
    }
    return arrNew;
  }
};

//对外接口,求路线的贴地线
export function computeSurfaceLine(params) {
  return surfaceLineWork.start(params);
}

//对外接口,求多个点的的贴地新坐标（不插值）
export function computeSurfacePoints(params) {
  params.split = false;
  return surfaceLineWork.start(params);
}

//对外接口,按2个坐标点分段计算 求路线的贴地线
export function computeStepSurfaceLine(opts) {
  var positions = opts.positions;

  var params = {};
  for (var key in opts) {
    if (key == "positions" || key == "callback" || key == "calback") continue;
    params[key] = opts[key];
  }

  var index = 0;
  var allcount = positions.length - 1;
  function getLineFD() {
    if (index >= allcount) {
      if (opts.callback) opts.callback();
      if (opts.end) opts.end();

      //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
      if (opts.calback) opts.calback();
      if (opts.calbakEnd) opts.calbakEnd();
      //兼容v2.2之前旧版本处理,非升级用户可删除上面代码
      return;
    }

    params.positions = [positions[index], positions[index + 1]];
    params.callback = function(raisedPositions, noHeight) {
      if (opts.endItem) {
        opts.endItem(raisedPositions, noHeight, index);
      }

      //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
      if (opts.calbakStep) {
        opts.calbakStep(raisedPositions, noHeight, index);
      }
      //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

      index++;
      getLineFD();
    };
    surfaceLineWork.start(params);
  }
  getLineFD();
}

//插值线（高度值按原高度等比计算）
export function interLine(positions, opts) {
  if (!positions || positions.length < 2) return positions;

  opts = opts || {};

  var granularity;
  if (opts.splitNum) {
    //splitNum分割的个数
    granularity = getGranularity(positions, opts.splitNum);
    if (granularity <= 0) granularity = null;
  }

  var arr = [positions[0]];
  for (var index = 1, length = positions.length; index < length; index++) {
    var startP = positions[index - 1];
    var endP = positions[index];

    var interPositions = Cesium.PolylinePipeline.generateArc({
      positions: [startP, endP],
      minDistance: opts.minDistance, //插值间隔(米)，优先级高于granularity
      granularity: granularity //splitNum分割的个数
    });

    //剖面的数据
    var h1 = Cesium.Cartographic.fromCartesian(startP).height;
    var h2 = Cesium.Cartographic.fromCartesian(endP).height;
    var hstep = (h2 - h1) / interPositions.length;

    for (var i = 3, len = interPositions.length; i < len; i += 3) {
      var position = Cesium.Cartesian3.unpack(interPositions, i);

      var car = Cesium.Cartographic.fromCartesian(position);

      var height = Number((h1 + hstep * i).toFixed(1));
      position = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, height);

      arr.push(position);
    }
  }
  return arr;
}

/**
 * 计算曲线链路的点集（a点到b点的，空中曲线）
 * @param startPoint 开始节点
 * @param endPoint 结束节点
 * @param angularityFactor 曲率
 * @param numOfSingleLine 点集数量
 * @returns {Array}
 */
export function getLinkedPointList(startPoint, endPoint, angularityFactor, numOfSingleLine) {
  var result = [];

  var startPosition = Cesium.Cartographic.fromCartesian(startPoint);
  var endPosition = Cesium.Cartographic.fromCartesian(endPoint);

  var startLon = (startPosition.longitude * 180) / Math.PI;
  var startLat = (startPosition.latitude * 180) / Math.PI;
  var endLon = (endPosition.longitude * 180) / Math.PI;
  var endLat = (endPosition.latitude * 180) / Math.PI;

  var dist = Math.sqrt(
    (startLon - endLon) * (startLon - endLon) + (startLat - endLat) * (startLat - endLat)
  );

  //var dist = Cesium.Cartesian3.distance(startPoint, endPoint);
  var angularity = dist * angularityFactor;

  var startVec = Cesium.Cartesian3.clone(startPoint);
  var endVec = Cesium.Cartesian3.clone(endPoint);

  var startLength = Cesium.Cartesian3.distance(startVec, Cesium.Cartesian3.ZERO);
  var endLength = Cesium.Cartesian3.distance(endVec, Cesium.Cartesian3.ZERO);

  Cesium.Cartesian3.normalize(startVec, startVec);
  Cesium.Cartesian3.normalize(endVec, endVec);

  if (Cesium.Cartesian3.distance(startVec, endVec) == 0) {
    return result;
  }

  //var cosOmega = Cesium.Cartesian3.dot(startVec, endVec);
  //var omega = Math.acos(cosOmega);

  var omega = Cesium.Cartesian3.angleBetween(startVec, endVec);

  result.push(startPoint);
  for (var i = 1; i < numOfSingleLine - 1; i++) {
    var t = (i * 1.0) / (numOfSingleLine - 1);
    var invT = 1 - t;

    var startScalar = Math.sin(invT * omega) / Math.sin(omega);
    var endScalar = Math.sin(t * omega) / Math.sin(omega);

    var startScalarVec = Cesium.Cartesian3.multiplyByScalar(
      startVec,
      startScalar,
      new Cesium.Cartesian3()
    );
    var endScalarVec = Cesium.Cartesian3.multiplyByScalar(
      endVec,
      endScalar,
      new Cesium.Cartesian3()
    );

    var centerVec = Cesium.Cartesian3.add(startScalarVec, endScalarVec, new Cesium.Cartesian3());

    var ht = t * Math.PI;
    var centerLength = startLength * invT + endLength * t + Math.sin(ht) * angularity;
    centerVec = Cesium.Cartesian3.multiplyByScalar(centerVec, centerLength, centerVec);

    result.push(centerVec);
  }

  result.push(endPoint);

  return result;
}
