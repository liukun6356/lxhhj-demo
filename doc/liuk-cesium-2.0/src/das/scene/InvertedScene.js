import * as Cesium from "cesium";
import InvertedSceneFS from "../shaders/PostProcessStage/InvertedScene.glsl";

//后处理实现倒影
//原理：利用空间镜面反射技术，计算倒影射线的UV进行采样
export class InvertedScene {
  //========== 构造方法 ==========

  constructor(options) {
    this.viewer = options.viewer;
    this._show = Cesium.defaultValue(options.show, true);

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
    this.postStage = new Cesium.PostProcessStage({
      name: "InvertedScene",
      fragmentShader: InvertedSceneFS
    });
    this.postStage.enabled = this._show;
    this.viewer.scene.postProcessStages.add(this.postStage);
  }

  //销毁
  destroy() {
    this.viewer.scene.postProcessStages.remove(this.postStage);

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
