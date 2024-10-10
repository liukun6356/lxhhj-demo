import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { BaseLayer } from "./base/BaseLayer";
import { getProxyUrl } from "../util/util";
import { pickCenterPoint, getSurfaceTerrainHeight } from "../util/point";
import * as daslog from "../util/log";

export class Tiles3dLayer extends BaseLayer {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(viewer, options);

    this.hasOpacity = true;

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options.readyPromise) {
      var readyPromisefun = options.readyPromise;
      delete options.readyPromise;
      this.on(eventType.loadBefore, event => {
        readyPromisefun(event.tileset);
      });
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码
  }

  get layer() {
    return this.tileset;
  }
  get model() {
    return this.tileset;
  }
  //添加
  add() {
    if (this.tileset) {
      if (!this.viewer.scene.primitives.contains(this.tileset))
        this.viewer.scene.primitives.add(this.tileset);
    } else {
      this.initData();
    }
    super.add();
  }
  //移除
  remove() {
    if (Cesium.defined(this.options.visibleDistanceMax))
      this.viewer.scene.camera.changed.removeEventListener(this.updateVisibleDistance, this);

    //解除绑定的事件
    if (this.tileset) {
      this.tileset.initialTilesLoaded.removeEventListener(this.onInitialTilesLoaded, this);
      this.tileset.allTilesLoaded.removeEventListener(this.onAllTilesLoaded, this);

      if (this.viewer.scene.primitives.contains(this.tileset))
        this.viewer.scene.primitives.remove(this.tileset);

      delete this.tileset;
    }
    if (this.boundingSphere) delete this.boundingSphere;
    super.remove();
  }
  //定位至数据区域
  centerAt(duration) {
    if (this.options.extent || this.options.center) {
      this.viewer.das.centerAt(this.options.extent || this.options.center, {
        duration: duration,
        isWgs84: true
      });
    } else if (this.boundingSphere && !isNaN(this.boundingSphere.radius)) {
      this.viewer.camera.flyToBoundingSphere(this.boundingSphere, {
        offset: new Cesium.HeadingPitchRange(
          this.viewer.camera.heading,
          this.viewer.camera.pitch,
          this.boundingSphere.radius * 2
        ),
        duration: duration
      });
    } else if (this.tileset._loadOk) {
      this.viewer.das.centerPoint(this.tileset.das.position, {
        duration: duration
      });
    }
  }

  /**
   * 创建顶点着色器代码
   * @param modelSwings
   * @returns {string}
   * @private
   */
  _createVS() {
    var vs = `
            uniform mat4 dasModelSwing;\n
        `;

    var vsmain = `
            float swing_speed;   //震动频率
            float swing_angle;   //振幅
            float swing_height;
            float swing_isSwing;   //是否开始摇
            
            for (int i = 0; i < 4; i++) {
                swing_height = dasModelSwing[i][0];
                swing_angle =  dasModelSwing[i][1];
                swing_speed =  dasModelSwing[i][2];
                swing_isSwing =  dasModelSwing[i][3];
    
                swing_angle =( swing_angle/ 8.0);           // 振幅
                
                if(v_stcVertex.z > swing_height && swing_isSwing == 1.0){
                    float index = (czm_frameNumber / swing_speed);    // 控制频率
                    float positionx= ( sin(index) * (v_stcVertex.z * 0.13) * swing_angle);
                    gl_Position.x +=positionx;
                }    
            }
        `;
    return {
      vs: vs,
      vsmain: vsmain
    };
  }

  initData() {
    // 构造vs
    if (this.options && this.options.vs) {
      this.options.dasVS = this._createVS(this.options.vs);
    }

    this.tileset = this.viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset(getProxyUrl(this.options))
    );
    this.tileset.das = this.options; //Cesium3DTilesetEx
    this.tileset.eventTarget = this;

    //兼容历史版本
    this.tileset._config = this.options;
    // for (var key in this.options) {
    //   if (key == "url" || key == "type" || key == "style" || key == "classificationType") continue;
    //   try {
    //     this.tileset[key] = this.options[key];
    //   } catch (e) {
    //     //
    //   }
    // }

    //绑定一些事件
    this.tileset.initialTilesLoaded.addEventListener(this.onInitialTilesLoaded, this);
    this.tileset.allTilesLoaded.addEventListener(this.onAllTilesLoaded, this);

    if (this.tileset._loadOk) {
      this._initModel(this.tileset);
    } else {
      this.tileset.das.on(eventType.load, e => {
        this._initModel(e.sourceTarget);
      });
    }
  }
  _initModel(tileset) {
    this.fireMap(eventType.loadBefore, { tileset: tileset });

    //记录模型原始的中心点
    this.boundingSphere = tileset.boundingSphere;
    this.orginMatrixInverse = tileset.das.orginMatrix;
    this.originalCenter = tileset.das.orginCenter;

    //高度自动贴地处理
    if (
      this.options.offset &&
      (this.options.offset.z == "auto" || this.options.offset.z == "-height")
    ) {
      tileset.das.clampToGround(this.viewer);
    }

    //转换坐标进行加偏处理，如果是国测局坐标系时
    var rawCenter = this.viewer.das.point2map(tileset.das.orginCenter);
    if (rawCenter !== tileset.das.orginCenter) {
      delete rawCenter.z;
      tileset.das.offset = rawCenter;
    }

    //透明度
    if (this.hasOpacity && this._opacity != 1) {
      this.setOpacity(this._opacity);
    }
    //设置最大视距后自动隐藏（不建议，效率一般）
    if (Cesium.defined(this.options.visibleDistanceMax)) this.bindVisibleDistance();

    if (this.options.flyTo) this.centerAtByFlyEnd();

    this.fireMap(eventType.load, { tileset: tileset });
  }
  //刷新事件
  refreshEvent() {
    if (this.tileset == null) return false;

    this.tileset.eventTarget = this;
    this.tileset.contextmenuItems = this.options.contextmenuItems;
    return true;
  }
  //该回调只执行一次
  onInitialTilesLoaded(e) {
    this.fireMap(eventType.initialTilesLoaded, { tile: e });
  }
  //该回调会执行多次，视角变化后重新加载一次完成后都会回调
  onAllTilesLoaded(e) {
    this.fireMap(eventType.allTilesLoaded, { tile: e });
  }

  //设置透明度
  setOpacity(value) {
    this._opacity = value;

    if (this.options.onSetOpacity) {
      this.options.onSetOpacity(value); //外部自定义处理
    } else {
      if (this.tileset) {
        this.tileset.das.opacity = value;
      }
    }
  }

  showClickFeature(value) {
    this.tileset.das.options.showClickFeature = value;
  }

  //绑定  设置最大视距后自动隐藏（不建议，效率一般）
  bindVisibleDistance() {
    this.viewer.scene.camera.changed.addEventListener(this.updateVisibleDistance, this);
  }
  updateVisibleDistance() {
    if (!this._visible) return;
    if (this.viewer.scene.mode !== Cesium.SceneMode.SCENE3D) return;
    if (!this.tileset || !this.tileset._loadOk) return;

    var camera_distance = Cesium.Cartesian3.distance(
      this.tileset.das.position,
      this.viewer.camera.positionWC
    );
    if (camera_distance > this.options.visibleDistanceMax + 100000) {
      //在模型的外包围外
      this.tileset.show = false;
    } else {
      var target = pickCenterPoint(this.viewer.scene); //取屏幕中心点坐标
      if (Cesium.defined(target)) {
        var distance = Cesium.Cartesian3.distance(target, this.viewer.camera.positionWC);
        this.tileset.show = distance < this.options.visibleDistanceMax;
      } else {
        this.tileset.show = true;
      }
    }
  }
}

//[静态属性]本类中支持的事件类型常量
Tiles3dLayer.event = {
  load: eventType.load,
  loadBefore: eventType.loadBefore,
  initialTilesLoaded: eventType.initialTilesLoaded,
  allTilesLoaded: eventType.allTilesLoaded,
  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};
