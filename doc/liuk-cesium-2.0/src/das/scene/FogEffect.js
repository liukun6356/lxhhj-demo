import * as Cesium from "cesium";
import FogFS from "../shaders/PostProcessStage/Fog.glsl";

// 场景雾效果
//原理：根据深度图的深度值，对片元进行不同程度的模糊
export class FogEffect {
  //========== 构造方法 ==========
  constructor(options) {
    this.viewer = options.viewer;

    this.fogByDistance = Cesium.defaultValue(
      options.fogByDistance,
      new Cesium.Cartesian4(10, 0.0, 1000, 0.9)
    ); //雾强度
    this.color = Cesium.defaultValue(options.color, Cesium.Color.WHITE); //雾颜色

    this._show = Cesium.defaultValue(options.show, true);
    this._maxHeight = Cesium.defaultValue(options.maxHeight, 9000);

    this.init();
  }

  //========== 对外属性 ==========
  //是否开启效果
  get show() {
    return this._show;
  }
  set show(val) {
    this._show = Boolean(val);
    this.FogStage.enabled = this._show;
  }

  //========== 方法 ==========

  init() {
    var that = this;

    this.FogStage = new Cesium.PostProcessStage({
      fragmentShader: FogFS,
      uniforms: {
        fogByDistance: function() {
          return that.fogByDistance;
        },
        fogColor: function() {
          return that.color;
        }
      },
      enabled: this._show
    });
    this.viewer.scene.postProcessStages.add(this.FogStage);

    //加控制，只在相机高度低于一定高度时才开启本效果
    this.viewer.scene.camera.changed.addEventListener(this.camera_changedHandler, this);
  }

  camera_changedHandler(event) {
    if (this.viewer.camera.positionCartographic.height < this._maxHeight) {
      this.FogStage.enabled = this._show;
    } else {
      this.FogStage.enabled = false;
    }
  }

  //销毁
  destroy() {
    this.viewer.scene.camera.changed.removeEventListener(this.camera_changedHandler, this);
    this.viewer.scene.postProcessStages.remove(this.FogStage);

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
