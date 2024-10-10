import * as Cesium from "cesium";

//圆锥 扩散效果 材质
export class CylinderWaveMaterial extends Cesium.Material {
  constructor(options) {
    super(conventOptions(options));

    //每秒刷新次数，因为requestAnimationFrame固定每秒60次的渲染，所以如果不想这么快，就把该数值调小一些
    this.frameTime = 1000 / (options.frameRate || 60);

    // 动态修改雷达材质中的offset变量，从而实现动态效果。
    var that = this;
    var then = Date.now();
    (function frame() {
      that.animateFrame = window.requestAnimationFrame(frame);
      var now = Date.now();
      var delta = now - then;
      if (delta > that.frameTime) {
        then = now - (delta % that.frameTime);
        that.updateOffset(); //按帧率执行
      }
    })();
  }

  // 动态修改雷达材质中的offset变量，从而实现动态效果。
  updateOffset() {
    var offset = this.uniforms.offset;
    offset -= 0.001;
    if (offset > 1.0) {
      offset = 0.0;
    }
    this.uniforms.offset = offset;

    // viewer.scene.preUpdate.addEventListener(function () {
    //     var offset = radar.appearance.material.uniforms.offset;
    //     offset -= 0.001;
    //     if (offset > 1.0) {
    //         offset = 0.0;
    //     }
    //     radar.appearance.material.uniforms.offset = offset;
    // });
  }

  destroy() {
    window.cancelAnimationFrame(this.animateFrame);
    delete this.animateFrame;

    return super.destroy();
  }
}

function conventOptions(options) {
  return {
    fabric: {
      uniforms: {
        color: Cesium.defaultValue(options.color, new Cesium.Color(2, 1, 0.0, 0.8)),
        repeat: Cesium.defaultValue(options.repeat, 30.0),
        offset: 0.0,
        thickness: 0.3
      },
      source: ` uniform vec4 color;
                uniform float repeat;
                uniform float offset;
                uniform float thickness;
                czm_material czm_getMaterial(czm_materialInput materialInput)
                {
                    czm_material material = czm_getDefaultMaterial(materialInput);
                    float sp = 1.0/repeat;
                    vec2 st = materialInput.st;
                    float dis = distance(st, vec2(0.5));
                    float m = mod(dis + offset, sp);
                    float a = step(sp*(1.0-thickness), m);
                    material.diffuse = color.rgb;
                    material.alpha = a * color.a;
                    return material;
                }  `
    },
    translucent: function(material) {
      return material.uniforms.color.alpha < 1.0;
    }
  };
}
