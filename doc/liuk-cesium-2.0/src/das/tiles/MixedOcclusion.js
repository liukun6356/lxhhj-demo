import * as Cesium from "cesium";
import fragmentShaderSource from "../shaders/PostProcessStage/MixedOcclusion.glsl";

// 建筑物混合遮挡
// 原理：自己创建FBO，把收集到的所有瓦片绘制指令，都绘制到这个FBO里，开启深度检测，然后再贴屏
// 1.楼块不能遮挡道路、水系、绿地和标注等地图元素；
// 2.楼快之间，需要实现不透明的实际遮挡效果。
export class MixedOcclusion {
  //========== 构造方法 ==========
  constructor(options, oldparam) {
    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (oldparam) {
      oldparam.viewer = options;
      options = oldparam;
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = options.viewer;

    this._enabled = Cesium.defaultValue(options.enabled, true);
    this._alpha = Cesium.defaultValue(options.alpha, 0.5);

    this.init();
  }

  //========== 对外属性 ==========
  //透明度
  get alpha() {
    return this._alpha;
  }
  set alpha(val) {
    this._alpha = val;
  }

  //开启关闭
  get enabled() {
    return this._enabled;
  }
  set enabled(val) {
    this._enabled = val;
    this.setEnabled(val);
  }

  //========== 方法 ==========

  init() {
    var context = this.viewer.scene.context;
    var width = this.viewer.scene.drawingBufferWidth;
    var height = this.viewer.scene.drawingBufferHeight;

    this.width = width;
    this.height = height;

    this.colorTexture = new Cesium.Texture({
      context: context,
      width: width,
      height: height,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.FLOAT,
      sampler: new Cesium.Sampler({
        wrapS: Cesium.TextureWrap.CLAMP_TO_EDGE,
        wrapT: Cesium.TextureWrap.CLAMP_TO_EDGE,
        minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
        magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
      })
    });

    this.depthStencilTexture = new Cesium.Texture({
      context: context,
      width: width,
      height: height,
      pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8
    });

    Cesium.ExpandByDas.mixedOcclusion.tilesFbo = new Cesium.Framebuffer({
      context: context,
      colorTextures: [this.colorTexture],
      depthStencilTexture: this.depthStencilTexture,
      destroyAttachments: false
    });

    Cesium.ExpandByDas.mixedOcclusion.tilesFboClear = new Cesium.ClearCommand({
      color: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
      framebuffer: Cesium.ExpandByDas.mixedOcclusion.tilesFbo,
      depth: 2.0,
      stencil: 2.0
    });

    this.viewer.scene._preUpdate.addEventListener(this._preUpdateHandler, this);
    this.setEnabled(this._enabled);
  }

  _preUpdateHandler(e) {
    Cesium.ExpandByDas.mixedOcclusion.newFrame = true;

    var newWidth = this.viewer.scene.drawingBufferWidth;
    var newHeight = this.viewer.scene.drawingBufferHeight;
    if (newWidth != this.width || newHeight != this.height) {
      var context = this.viewer.scene.context;
      var width = newWidth;
      var height = newHeight;

      this.width = width;
      this.height = height;

      this.depthTexture && this.depthTexture.destroy();
      this.depthStencilTexture && this.depthStencilTexture.destroy();
      this.colorTexture && this.colorTexture.destroy();
      Cesium.ExpandByDas.mixedOcclusion.tilesFbo &&
        Cesium.ExpandByDas.mixedOcclusion.tilesFbo.destroy();

      this.colorTexture = new Cesium.Texture({
        context: context,
        width: width,
        height: height,
        pixelFormat: Cesium.PixelFormat.RGBA,
        pixelDatatype: Cesium.PixelDatatype.FLOAT,
        sampler: new Cesium.Sampler({
          wrapS: Cesium.TextureWrap.CLAMP_TO_EDGE,
          wrapT: Cesium.TextureWrap.CLAMP_TO_EDGE,
          minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
          magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
        })
      });

      this.depthStencilTexture = new Cesium.Texture({
        context: context,
        width: width,
        height: height,
        pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8
      });

      this.depthTexture = new Cesium.Texture({
        context: context,
        width: width,
        height: height,
        pixelFormat: Cesium.PixelFormat.RGBA,
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
        sampler: new Cesium.Sampler({
          wrapS: Cesium.TextureWrap.CLAMP_TO_EDGE,
          wrapT: Cesium.TextureWrap.CLAMP_TO_EDGE,
          minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
          magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
        })
      });

      Cesium.ExpandByDas.mixedOcclusion.tilesFbo = new Cesium.Framebuffer({
        context: context,
        colorTextures: [this.colorTexture],
        depthStencilTexture: this.depthStencilTexture,
        destroyAttachments: false
      });
      Cesium.ExpandByDas.mixedOcclusion.tilesFboClear = new Cesium.ClearCommand({
        color: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
        framebuffer: Cesium.ExpandByDas.mixedOcclusion.tilesFbo,
        depth: 2.0,
        stencil: 2.0
      });
    }
  }

  setEnabled(val) {
    var that = this;

    Cesium.ExpandByDas.mixedOcclusion.enable = val;

    if (val) {
      this.postProcess = new Cesium.PostProcessStage({
        fragmentShader: fragmentShaderSource,
        uniforms: {
          mergeTexture: function() {
            return Cesium.ExpandByDas.mixedOcclusion.tilesFbo._colorTextures[0];
          },
          alpha: function() {
            return that._alpha;
          }
        }
      });
      this.viewer.scene.postProcessStages.add(this.postProcess);
    } else {
      Cesium.ExpandByDas.mixedOcclusion.tilesFboClear.execute(this.viewer.scene.context);
      if (this.postProcess) this.viewer.scene.postProcessStages.remove(this.postProcess);
    }
  }

  //销毁
  destroy() {
    this.setEnabled(false);
    this.viewer.scene._preUpdate.removeEventListener(this._preUpdateHandler, this);

    if (this.depthTexture) {
      this.depthTexture.destroy();
      delete this.depthTexture;
    }
    if (this.depthStencilTexture) {
      this.depthStencilTexture.destroy();
      delete this.depthStencilTexture;
    }
    if (this.colorTexture) {
      this.colorTexture.destroy();
      delete this.colorTexture;
    }

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
