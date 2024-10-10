import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
import { CustomPlaneGeometry } from "./core/CustomPlaneGeometry.js";
import { WellNoBottom } from "./core/WellNoBottom.js";
import { getAngle } from "../util/measure";
import * as daslog from "../util/log";

//地形开挖 类（平面 Plan原生）
export class TerrainClipPlan extends DasClass {
  //========== 构造方法 ==========
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    this.updateData = this.setPositions;
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.options = options;
    this.viewer = options.viewer;

    this._height = this.options.height || 0;
    this._showWall = Cesium.defaultValue(options.wall, true); //是否显示挖掘的底部和wall
    this.bottomImg = options.bottomImg;
    this.wallImg = options.wallImg;
    this.opacityImg = Cesium.defaultValue(options.opacity, 1.0);
    this.splitNum = Cesium.defaultValue(options.splitNum, 50);

    if (options.positions && options.positions.length > 0) {
      this.setPositions(options.positions);
    }
  }

  //========== 对外属性 ==========
  //挖掘深度
  get show() {
    return this._show;
  }
  set show(val) {
    this._show = val;

    if (this.viewer.scene.globe.clippingPlanes)
      this.viewer.scene.globe.clippingPlanes.enabled = val;

    if (this._showWall) {
      this._switchExcavate(val);
    }
  }

  //裁剪距离
  get height() {
    return this._height;
  }
  set height(val) {
    this._height = val;

    if (this._showWall) {
      this._updateExcavateDepth(val);
    }
  }
  get positions() {
    return this._positions;
  }
  set positions(val) {
    this._positions = val;
    this.setPositions(val);
  }
  //========== 方法 ==========

  // 创建裁剪面
  setPositions(points, opts = {}) {
    this.clear();

    if (!points || points.length < 3) {
      daslog.warn("挖地坐标数据存在问题！", points);
      return;
    }
    this._positions = points;

    var clippingPlanes = [];
    var pointsLength = points.length;

    var unionClippingRegions = Cesium.defaultValue(opts.unionClippingRegions, false); //true时外切

    //是否顺时针
    var startAngle = getAngle(points[0], points[1]);
    var endAngle = getAngle(points[0], points[2]);
    var direction = startAngle < endAngle;
    if (unionClippingRegions) direction = !direction;

    this.excavateMinHeight = 9999;

    for (var i = 0; i < pointsLength; ++i) {
      var nextIndex = (i + 1) % pointsLength;
      var midpoint = Cesium.Cartesian3.midpoint(
        points[i],
        points[nextIndex],
        new Cesium.Cartesian3()
      );

      var tempCarto = Cesium.Cartographic.fromCartesian(points[i]);
      var heightTerrain = this.viewer.scene.globe.getHeight(tempCarto) || tempCarto.height; //地形高度
      if (heightTerrain < this.excavateMinHeight) {
        this.excavateMinHeight = heightTerrain;
      }

      var up = Cesium.Cartesian3.normalize(midpoint, new Cesium.Cartesian3());
      var right;
      if (direction) {
        //顺时针
        right = Cesium.Cartesian3.subtract(points[i], midpoint, new Cesium.Cartesian3());
      } else {
        right = Cesium.Cartesian3.subtract(points[nextIndex], midpoint, new Cesium.Cartesian3());
      }
      right = Cesium.Cartesian3.normalize(right, right);
      var normal = Cesium.Cartesian3.cross(right, up, new Cesium.Cartesian3());
      normal = Cesium.Cartesian3.normalize(normal, normal);
      var originCenteredPlane = new Cesium.Plane(normal, 0.0);
      var distance = Cesium.Plane.getPointDistance(originCenteredPlane, midpoint);
      clippingPlanes.push(new Cesium.ClippingPlane(normal, distance));
    }

    this.viewer.scene.globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
      planes: clippingPlanes,
      edgeWidth: Cesium.defaultValue(opts.edgeWidth, 1.0),
      edgeColor: Cesium.defaultValue(opts.edgeColor, Cesium.Color.WHITE),
      enabled: true,
      unionClippingRegions: unionClippingRegions
    });

    if (this._showWall) {
      this._prepareWell(points);
      this._createWell(this.wellData);
    }
  }

  //准备井数据
  _prepareWell(arr) {
    var splitNum = this.splitNum;
    var len = arr.length;
    if (len == 0) return;
    var targetHeight = this.excavateMinHeight - this.height;
    this.targetHeight = targetHeight;
    var no_height_top = [];
    var bottom_pos = [];
    var lerp_pos = [];
    for (var i = 0; i < len; i++) {
      var static_i = i == len - 1 ? 0 : i + 1;
      var currRad = Cesium.Cartographic.fromCartesian(arr[i]);
      var nextRad = Cesium.Cartographic.fromCartesian(arr[static_i]);
      var pos1 = [currRad.longitude, currRad.latitude];
      var pos2 = [nextRad.longitude, nextRad.latitude];
      // if (i == 0) {
      //     lerp_pos.push(new Cesium.Cartographic(pos1[0], pos1[1]));
      //     bottom_pos.push(Cesium.Cartesian3.fromRadians(pos1[0], pos1[1], targetHeight));
      //     no_height_top.push(Cesium.Cartesian3.fromRadians(pos1[0], pos1[1], 0));
      // }
      for (var j = 0; j < splitNum; j++) {
        var curr_pos_lon = Cesium.Math.lerp(pos1[0], pos2[0], j / splitNum);
        var curr_pos_lat = Cesium.Math.lerp(pos1[1], pos2[1], j / splitNum);
        // if (!(i == len - 1 && j == splitNum)) {
        lerp_pos.push(new Cesium.Cartographic(curr_pos_lon, curr_pos_lat));
        bottom_pos.push(Cesium.Cartesian3.fromRadians(curr_pos_lon, curr_pos_lat, targetHeight));
        no_height_top.push(Cesium.Cartesian3.fromRadians(curr_pos_lon, curr_pos_lat, 0));
        // }
      }
    }
    this.wellData = {
      lerp_pos: lerp_pos,
      bottom_pos: bottom_pos,
      no_height_top: no_height_top
    };
  }
  //创建井
  _createWell(options) {
    var hasTerrain = Boolean(this.viewer.terrainProvider._layers);
    if (hasTerrain) {
      var self = this;
      this._createBottomSurface(options.bottom_pos);
      var promise = Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, options.lerp_pos);
      var maxHeight = -9999;
      Cesium.when(promise, function(updatedPositions) {
        var len = updatedPositions.length;
        var top_pos = [];
        var top_heights = [];
        for (var k = 0; k < len; k++) {
          top_heights.push(updatedPositions[k].height);
          if (updatedPositions[k].height > maxHeight) maxHeight = updatedPositions[k].height;
          var top_car = Cesium.Cartesian3.fromRadians(
            updatedPositions[k].longitude,
            updatedPositions[k].latitude,
            updatedPositions[k].height
          );
          top_pos.push(top_car);
        }
        self.maxHeight = maxHeight;
        self.top_heights = top_heights;
        self._createWellWall(options.bottom_pos, top_pos);
        // self.viewer.scene.primitives.add(self.wellWall);
      });
    } else {
      this._createBottomSurface(options.bottom_pos);
      this._createWellWall(options.bottom_pos, options.no_height_top);
      // this.viewer.scene.primitives.add(this.wellWall);
    }
  }
  //创建井壁
  _createWellWall(bottom, top) {
    var geo = new WellNoBottom({
      minimumArr: bottom,
      maximumArr: top
    });
    geo = geo.createGeometry(geo, this);
    var _material = new Cesium.Material({
      fabric: {
        type: "Image",
        uniforms: {
          image: this.wallImg,
          color: Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(this.opacityImg)
        }
      }
    });
    var _appearance = new Cesium.MaterialAppearance({
      translucent: false,
      flat: true,
      material: _material
    });
    this.wellWall = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: geo,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.GREY)
        },
        id: "PitWall"
      }),
      appearance: _appearance,
      asynchronous: false
    });
    this.viewer.scene.primitives.add(this.wellWall);
  }
  //创建井底
  _createBottomSurface(bottom_pos) {
    if (!bottom_pos.length) {
      return;
    }
    var geo = new CustomPlaneGeometry({
      pos_arr: bottom_pos
    });
    geo = geo.createGeometry(geo);
    var _material = new Cesium.Material({
      fabric: {
        type: "Image",
        uniforms: {
          image: this.bottomImg,
          color: Cesium.Color.fromCssColorString("#FFFFFF").withAlpha(this.opacityImg)
        }
      }
    });
    var _appearance = new Cesium.MaterialAppearance({
      translucent: false,
      flat: true,
      material: _material
    });
    this.bottomSurface = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: geo
      }),
      appearance: _appearance,
      asynchronous: false
    });
    this.viewer.scene.primitives.add(this.bottomSurface);
  }

  //切换挖掘显隐
  _switchExcavate(val) {
    if (val) {
      if (this.wellWall) this.wellWall.show = true;
      if (this.bottomSurface) this.bottomSurface.show = true;
    } else {
      if (this.wellWall) this.wellWall.show = false;
      if (this.bottomSurface) this.bottomSurface.show = false;
    }
  }

  //更新挖掘深度
  _updateExcavateDepth(depth) {
    if (!this.wellData) return;

    this.bottomSurface && this.viewer.scene.primitives.remove(this.bottomSurface);
    this.wellWall && this.viewer.scene.primitives.remove(this.wellWall);

    var lerp_pos = this.wellData.lerp_pos;
    var bottom_pos = [];
    var len = lerp_pos.length;
    for (var i = 0; i < len; i++) {
      bottom_pos.push(
        Cesium.Cartesian3.fromRadians(
          lerp_pos[i].longitude,
          lerp_pos[i].latitude,
          this.excavateMinHeight - depth
        )
      );
    }
    this.wellData.bottom_pos = bottom_pos;
    this._createWell(this.wellData);

    this.viewer.scene.primitives.add(this.bottomSurface);
    this.viewer.scene.primitives.add(this.wellWall);
  }

  //清除裁剪面
  clear() {
    if (this.viewer.scene.globe.clippingPlanes) {
      this.viewer.scene.globe.clippingPlanes.enabled = false;
      this.viewer.scene.globe.clippingPlanes.removeAll();
      // if (!this.viewer.scene.globe.clippingPlanes.isDestroyed())
      //   this.viewer.scene.globe.clippingPlanes.destroy();
    }
    this.viewer.scene.globe.clippingPlanes = undefined;

    if (this.bottomSurface) {
      this.viewer.scene.primitives.remove(this.bottomSurface);
      delete this.bottomSurface;
    }

    if (this.wellWall) {
      this.viewer.scene.primitives.remove(this.wellWall);
      delete this.wellWall;
    }
    delete this.wellData;
    this.viewer.scene.render();
  }

  destroy() {
    this.clear();
    super.destroy();
  }
}
