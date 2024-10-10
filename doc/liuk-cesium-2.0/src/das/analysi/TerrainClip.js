import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
import { CustomPlaneGeometry } from "./core/CustomPlaneGeometry.js";
import { WellNoBottom } from "./core/WellNoBottom.js";

//地形开挖 类 (基于地形)
export class TerrainClip extends DasClass {
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
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = options.viewer;

    if (!this.viewer.scene.highDynamicRange) {
      this.viewer.scene.highDynamicRange = true;
      this._hasChangeHighDynamicRange = true;
    }

    this.bottomImg = options.bottomImg;
    this.wallImg = options.wallImg;

    this.opacityImg = Cesium.defaultValue(options.opacity, 1.0);
    this.splitNum = Cesium.defaultValue(options.splitNum, 30); //每两点之间插值个数
    this.dig_pos_x = Cesium.defaultValue(options.dig_pos_x, [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ]);
    this.dig_pos_y = Cesium.defaultValue(options.dig_pos_y, [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ]);
    this.dig_pos_z = Cesium.defaultValue(options.dig_pos_z, [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ]);
    this.rect_dig = Cesium.defaultValue(options.rect_dig, [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ]); //包围盒[minx,miny,minz,maxx,maxy,maxz,0.0,0.0,0.0]
    this.excavateMinHeight = Cesium.defaultValue(options.excavateMinHeight, 9999); //最低挖掘海拔值
    this.excavatePerPoint = Cesium.defaultValue(options.excavatePerPoint, false); //是否按插值点挖掘
    this.dig_max_index = Cesium.defaultValue(options.dig_max_index, 0); //点选点的个数
    this.defaultShowSelfOnly = Cesium.defaultValue(options.showSelfOnly, false); //是否只显示自己
    this._height = Cesium.defaultValue(options.height, 0); //挖掘深度
    this._show = Cesium.defaultValue(options.show, true);
    this.defaultBoundingSwell = Cesium.defaultValue(options.boundingSwell, 20);
    this._showWall = Cesium.defaultValue(options.wall, true); //是否显示挖掘的底部和wall

    if (options.positions && options.positions.length > 0) this.setPositions(options.positions);
  }

  //========== 对外属性 ==========
  //参数
  get excavateAnalysis() {
    return this.viewer.scene.globe._surface.tileProvider.excavateAnalysis;
  }

  //仅显示自己
  get showSelfOnly() {
    return this.defaultShowSelfOnly;
  }
  set showSelfOnly(val) {
    this.defaultShowSelfOnly = val;
    this.excavateAnalysis.showSelfOnly = val;
  }

  //挖掘深度
  get height() {
    return this._height;
  }
  set height(val) {
    this._height = val;

    if (this._showWall) {
      this._updateExcavateDepth(val);
    }
  }
  //显示和隐藏
  get show() {
    return this._show;
  }
  set show(val) {
    this._show = val;
    if (val) {
      this.viewer.scene.globe.material = Cesium.Material.fromType("WaJue");

      if (this._showWall) {
        this.wellWall.show = true;
        this.bottomSurface.show = true;
      }
    } else {
      this.viewer.scene.globe.material = null;

      if (this._showWall) {
        this.wellWall.show = false;
        this.bottomSurface.show = false;
      }
    }
  }

  //点集合的包围盒膨胀数值
  get boundingSwell() {
    return this.defaultBoundingSwell;
  }
  set boundingSwell(num) {
    var rect = this._base_rect;
    this.defaultBoundingSwell = Number(num);
    this.rect_dig = [
      rect[0] - this.boundingSwell,
      rect[1] - this.boundingSwell,
      rect[2] - this.boundingSwell,
      rect[3] + this.boundingSwell,
      rect[4] + this.boundingSwell,
      rect[5] + this.boundingSwell,
      0,
      0,
      0
    ];
    this.excavateAnalysis.rect_dig = this.rect_dig;
  }
  get positions() {
    return this._positions;
  }
  set positions(val) {
    this._positions = val;
    this.setPositions(val);
  }
  //========== 方法 ==========

  //初始化没传顶点，后面设置顶点
  setPositions(positions) {
    this._positions = positions;
    if (!positions || positions.length == 0) return;
    this._startExcavate(positions);
    this.viewer.scene.globe.material = Cesium.Material.fromType("WaJue");
    this.viewer.scene.globe.depthTestAgainstTerrain = true;
    this._effectExcavate();
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
        self.viewer.scene.primitives.add(self.wellWall);
      });
    } else {
      this._createBottomSurface(options.bottom_pos);
      this._createWellWall(options.bottom_pos, options.no_height_top);
      this.viewer.scene.primitives.add(this.wellWall);
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
  }
  //准备挖掘
  _prepareExcavate(arr) {
    var len = arr.length;
    if (len == 0) return;
    this.dig_max_index = len;

    var minX = 99999999;
    var minY = 99999999;
    var minZ = 99999999;
    var maxX = -99999999;
    var maxY = -99999999;
    var maxZ = -99999999;
    for (var i = 0; i < len; i++) {
      if (arr[i]) {
        this.dig_pos_x[i] = arr[i].x;
        this.dig_pos_y[i] = arr[i].y;
        this.dig_pos_z[i] = arr[i].z;
        var rad = Cesium.Cartographic.fromCartesian(arr[i]);
        this.excavateMinHeight =
          this.excavateMinHeight > rad.height ? rad.height : this.excavateMinHeight;
        if (arr[i].x > maxX) {
          maxX = arr[i].x;
        }
        if (arr[i].x < minX) {
          minX = arr[i].x;
        }

        if (arr[i].y > maxY) {
          maxY = arr[i].y;
        }
        if (arr[i].y < minY) {
          minY = arr[i].y;
        }

        if (arr[i].z > maxZ) {
          maxZ = arr[i].z;
        }
        if (arr[i].z < minZ) {
          minZ = arr[i].z;
        }
      } else {
        this.dig_pos_x[i] = 0.0;
        this.dig_pos_y[i] = 0.0;
        this.dig_pos_z[i] = 0.0;
      }
    }
    var chaNum = this.boundingSwell;
    this._base_rect = this.rect_dig = [
      minX - chaNum,
      minY - chaNum,
      minZ - chaNum,
      maxX + chaNum,
      maxY + chaNum,
      maxZ + chaNum,
      0.0,
      0.0,
      0.0
    ];
  }
  //开始挖掘
  _startExcavate(arr) {
    this.viewer.scene.globe.material = Cesium.Material.fromType("WaJue");
    this._prepareExcavate(arr);

    if (this._showWall) {
      this._prepareWell(arr);
      if (!this.wellData) return;
      this._createWell(this.wellData);
    }
  }
  //更新挖掘深度
  _updateExcavateDepth(depth) {
    if (depth == undefined || depth == null) return;
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

    if (this.bottomSurface) this.viewer.scene.primitives.add(this.bottomSurface);

    if (this.wellWall) this.viewer.scene.primitives.add(this.wellWall);
  }
  //挖掘生效
  _effectExcavate() {
    this.excavateAnalysis.dig_pos_x = this.dig_pos_x;
    this.excavateAnalysis.dig_pos_y = this.dig_pos_y;
    this.excavateAnalysis.dig_pos_z = this.dig_pos_z;
    this.excavateAnalysis.dig_max_index = this.dig_max_index;
    this.excavateAnalysis.showSelfOnly = this.showSelfOnly;
    this.excavateAnalysis.rect_dig = this.rect_dig;

    if (this.bottomSurface) this.viewer.scene.primitives.add(this.bottomSurface);
  }

  clear() {
    this.viewer.scene.globe.material = null;
    this.viewer.scene.globe._surface.tileProvider.resetExcavateAnalysis();

    if (this.bottomSurface) {
      this.viewer.scene.primitives.remove(this.bottomSurface);
      delete this.bottomSurface;
    }

    if (this.wellWall) {
      this.viewer.scene.primitives.remove(this.wellWall);
      delete this.wellWall;
    }
  }

  destroy() {
    if (this._hasChangeHighDynamicRange) {
      this.viewer.scene.highDynamicRange = false;
      this._hasChangeHighDynamicRange = false;
    }

    this.clear();
    super.destroy();
  }
}
