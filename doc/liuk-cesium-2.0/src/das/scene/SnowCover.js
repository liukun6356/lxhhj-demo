import * as Cesium from "cesium";
import SnowCoverFS from "../shaders/PostProcessStage/SnowCover.glsl";

// 雪覆盖 效果
//原理：法线越垂直与地面越白
export class SnowCover {
  //========== 构造方法 ==========

  constructor(options) {
    this.viewer = options.viewer;

    this.alpha = Cesium.defaultValue(options.alpha, 1.0); //覆盖强度  0-1
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
    this.postStage.enabled = this._show;
  }

  //========== 方法 ==========

  init() {
    var that = this;
    this.postStage = new Cesium.PostProcessStage({
      name: "SnowCover",
      fragmentShader: SnowCoverFS,
      uniforms: {
        alpha: function() {
          return that.alpha;
        }
      }
    });
    this.postStage.enabled = this._show;
    this.viewer.scene.postProcessStages.add(this.postStage);

    //加控制，只在相机高度低于一定高度时才开启本效果
    this.viewer.scene.camera.changed.addEventListener(this.camera_changedHandler, this);
  }

  camera_changedHandler(event) {
    if (this.viewer.camera.positionCartographic.height < this._maxHeight) {
      this.postStage.enabled = this._show;
    } else {
      this.postStage.enabled = false;
    }
  }

  //销毁
  destroy() {
    this.viewer.scene.camera.changed.removeEventListener(this.camera_changedHandler, this);
    this.viewer.scene.postProcessStages.remove(this.postStage);

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
