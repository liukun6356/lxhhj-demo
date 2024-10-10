import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import * as daslog from "../util/log";

//地形淹没（材质）分析 类
export class FloodByTerrain extends DasClass {
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
    this.minHeight = options.minHeight;
    this.maxHeight = options.maxHeight;

    //检查参数
    if (!Cesium.defined(this.minHeight)) {
      daslog.warn("minHeight请传入有效数值！");
      return;
    }
    if (!Cesium.defined(this.maxHeight)) {
      daslog.warn("maxHeight请传入有效数值！");
      return;
    }
    if (this.minHeight > this.maxHeight) {
      //互相交换数据
      var temp = this.minHeight;
      this.minHeight = this.maxHeight;
      this.maxHeight = temp;
    }

    this.height = options.height;
    this.floodVar = Cesium.defaultValue(options.floodVar, [0, 0, 0, 500]); //[基础淹没高度，当前淹没高度，最大淹没高度,默认高度差(最大淹没高度 - 基础淹没高度)]
    this.ym_pos_x = Cesium.defaultValue(options.ym_pos_x, [
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
    this.ym_pos_y = Cesium.defaultValue(options.ym_pos_y, [
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
    this.ym_pos_z = Cesium.defaultValue(options.ym_pos_z, [
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
    this.rect_flood = Cesium.defaultValue(options.rect_flood, [
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
    this.ym_max_index = Cesium.defaultValue(options.ym_max_index, 0); //点选点的个数
    this._globe = Cesium.defaultValue(options.globe, true); //是否全球淹没
    this._speed = Cesium.defaultValue(options.speed, 1); //淹没速度
    this._visibleOutArea = Cesium.defaultValue(options.visibleOutArea, true); //是否显示非淹没区域
    this._boundingSwell = Cesium.defaultValue(options.boundingSwell, 20); //点集合的包围盒膨胀数值
    this._show = Cesium.defaultValue(options.show, true);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options.onChange) {
      var onChangefun = options.onChange;
      delete options.onChange;
      this.on(eventType.change, e => {
        onChangefun(e.height);
      });
    }
    if (options.onStop) {
      var onStopfun = options.onStop;
      delete options.onStop;
      this.on(eventType.end, onStopfun);
    }
    this.cancelFloodSpeed = this.stop; //别名
    this.reFlood = this.restart;
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    if (options.positions && options.positions.length > 0) this.start(options.positions);
  }

  //========== 对外属性 ==========
  //分析参数
  get floodAnalysis() {
    return this.viewer.scene.globe._surface.tileProvider.floodAnalysis;
  }
  get positions() {
    return this._positions;
  }
  set positions(val) {
    this._positions = val;
    this.start(val);
  }

  //显示非淹没区域
  get visibleOutArea() {
    return this._visibleOutArea;
  }
  set visibleOutArea(val) {
    this._visibleOutArea = val;
    this.floodAnalysis.showElseArea = val;
  }

  //全球淹没
  get globe() {
    return this._globe;
  }
  set globe(val) {
    this._globe = val;
    this.floodAnalysis.globe = val;
  }

  //淹没速度
  get speed() {
    return this._speed;
  }
  set speed(val) {
    this._speed = Number(val);
  }
  //点集合的包围盒膨胀数值
  get boundingSwell() {
    return this._boundingSwell;
  }
  set boundingSwell(num) {
    var rect = this._base_rect;
    this._boundingSwell = Number(num);
    this.rect_flood = [
      rect[0] - this.boundingSwell,
      rect[1] - this.boundingSwell,
      rect[2] - this.boundingSwell,
      rect[3] - this.boundingSwell,
      rect[4] - this.boundingSwell,
      rect[5] - this.boundingSwell,
      0,
      0,
      0
    ];
    this.floodAnalysis.rect_flood = this.rect_flood;
  }

  //显示和隐藏
  get show() {
    return this._show;
  }
  set show(val) {
    this._show = val;
    if (val) {
      this.viewer.scene.globe.material = Cesium.Material.fromType("YanMo");
    } else {
      this.viewer.scene.globe.material = null;
    }
  }
  //========== 方法 ==========

  //初始化
  start(positions) {
    this._positions = positions || this._positions;
    if (!positions || positions.length == 0) return;

    this._prepareFlood(positions);
    this._setFloodVar();
    this._startFlood();
    this._activeFloodSpeed();
  }

  //激活淹没动画
  _activeFloodSpeed() {
    var that = this;
    if (!this.activeFlooding) {
      this.fire(eventType.start);
      this.activeFlooding = function() {
        if (that.height) {
          that.floodVar[1] = that.height();
        } else {
          that.floodVar[1] += that.speed / 50; //50帧每秒
        }
        if (that.floodVar[1] > that.floodVar[2]) {
          that.floodVar[1] = that.floodVar[2];
          that.stop();
          // that.onStop&&that.onStop();
          return;
        }
        if (that.floodVar[1] < that.floodVar[0]) {
          that.floodVar[1] = that.floodVar[0];
          that.stop();
          // that.onStop&&that.onStop();
          return;
        }
        that.floodAnalysis.floodVar[1] = that.floodVar[1];
        that.fire(eventType.change, {
          height: that.floodVar[1]
        });
      };
      this.viewer.clock.onTick.addEventListener(this.activeFlooding);
    }
  }

  //暂停淹没动画
  stop() {
    if(this.activeFlooding){
      this.viewer.clock.onTick.removeEventListener(this.activeFlooding);
    }
    this.activeFlooding = null;
    this.fire(eventType.end);
  }
  //重新淹没
  restart() {
    this.floodVar[1] = this.floodVar[0];
    this._activeFloodSpeed();
  }

  //与处理顶点数组
  _prepareFlood(arr) {
    this.ym_pos_arr = arr;
    var len = arr.length;
    if (len == 0) return;
    this.ym_max_index = len;
    var minX = 99999999;
    var minY = 99999999;
    var minZ = 99999999;
    var maxX = -99999999;
    var maxY = -99999999;
    var maxZ = -99999999;
    for (var i = 0; i < len; i++) {
      if (arr[i]) {
        this.ym_pos_x[i] = arr[i].x;
        this.ym_pos_y[i] = arr[i].y;
        this.ym_pos_z[i] = arr[i].z;

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
        this.ym_pos_x[i] = 0.0;
        this.ym_pos_y[i] = 0.0;
        this.ym_pos_z[i] = 0.0;
      }
    }
    var chaNum = this.boundingSwell;
    this._base_rect = this.rect_flood = [
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
  //设置淹没高度
  _setFloodVar() {
    this.floodVar = [
      this.minHeight,
      this.minHeight,
      this.maxHeight,
      this.maxHeight - this.minHeight
    ];
  }
  //开始淹没
  _startFlood() {
    this.floodAnalysis.floodVar[0] = this.floodVar[0];
    this.floodAnalysis.floodVar[1] = this.floodVar[1];
    this.floodAnalysis.ym_pos_x = this.ym_pos_x;
    this.floodAnalysis.ym_pos_y = this.ym_pos_y;
    this.floodAnalysis.ym_pos_z = this.ym_pos_z;
    this.floodAnalysis.rect_flood = this.rect_flood;
    this.floodAnalysis.ym_pos_arr = this.ym_pos_arr;
    this.floodAnalysis.floodSpeed = this.speed;
    this.floodAnalysis.ym_max_index = this.ym_max_index;
    this.floodAnalysis.globe = this.globe = false;
    this.floodAnalysis.showElseArea = this.visibleOutArea;
    this.viewer.scene.globe.material = Cesium.Material.fromType("YanMo");
  }

  clear() {
    this.stop();
    this.viewer.scene.globe.material = null;
    this.viewer.scene.globe._surface.tileProvider.resetFloodAnalysis();
  }

  destroy() {
    this.clear();
    super.destroy();
  }
}
//[静态属性]本类中支持的事件类型常量
FloodByTerrain.event = {
  start: eventType.start,
  change: eventType.change,
  end: eventType.end
};
