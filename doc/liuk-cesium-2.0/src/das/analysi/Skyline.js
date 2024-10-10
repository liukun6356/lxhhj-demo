import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
import fragmentShaderSource from "../shaders/PostProcessStage/Skyline.glsl";

//天际线 类
export class Skyline extends DasClass {
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
    this.tjxWidth = Cesium.defaultValue(options.tjxWidth, 2); //天际线宽度
    this.strokeType = Cesium.defaultValue(
      options.strokeType,
      new Cesium.Cartesian3(true, false, false)
    ); //天际线，物体描边，全描边
    this.tjxColor = Cesium.defaultValue(options.tjxColor, new Cesium.Color(1.0, 0.0, 0.0)); //边际线颜色
    this.bjColor = Cesium.defaultValue(options.bjColor, new Cesium.Color(0.0, 0.0, 1.0)); //物体描边颜色
    this.mbDis = Cesium.defaultValue(options.mbDis, 500); //物体描边距离

    var that = this;
    this.postProcess = new Cesium.PostProcessStage({
      fragmentShader: fragmentShaderSource,
      uniforms: {
        height: function() {
          return that.viewer.camera.positionCartographic.height;
        },
        lineWidth: function() {
          return that.tjxWidth;
        },
        strokeType: function() {
          return that.strokeType;
        },
        tjxColor: function() {
          return that.tjxColor;
        },
        bjColor: function() {
          return that.bjColor;
        },
        cameraPos: function() {
          return that.viewer.scene.camera.position;
        },
        mbDis: function() {
          return that.mbDis;
        }
      }
    });
    this.postProcess.enabled = Cesium.defaultValue(options.enabled, true);
    this.viewer.scene.postProcessStages.add(this.postProcess);
  }

  //显示和隐藏
  get enabled() {
    return this.postProcess.enabled;
  }
  set enabled(val) {
    this.postProcess.enabled = val;
  }

  destroy() {
    this.viewer.scene.postProcessStages.remove(this.postProcess);
    // this.postProcess.destroy();
    // delete this.postProcess;

    super.destroy();
  }
}
