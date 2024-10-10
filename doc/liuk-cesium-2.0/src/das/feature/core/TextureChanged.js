//纹理变化对象
import * as Cesium from "cesium";
import { DasClass } from "../../core/DasClass";
export class TextureChanged extends DasClass {
  constructor(options) {
    super(options);
    this._framebuffer = null;
    this._colorTexture = null;
    this._textureChangedEvent = new Cesium.Event();
  }
  getTextureChangedEvent() {
    return this._textureChangedEvent;
  }
  destroyDepthStencilTexture(texture) {
    !(texture._colorTexture && !texture._colorTexture.isDestroyed() && texture._colorTexture.destroy()) &&
      texture._colorTexture &&
      (texture._colorTexture.destroy = function () {
        console.log("ddd");
      },
        texture._colorTexture = void 0),
      texture._depthStencilTexture =
      texture._depthStencilTexture &&
      !texture._depthStencilTexture.isDestroyed() &&
      texture._depthStencilTexture.destroy()

  }
  framebufferDestroy(texture) {
    texture._framebuffer = texture._framebuffer && !texture._framebuffer.isDestroyed() && texture._framebuffer.destroy();
  }
  setNewTexture(texture, context, width, height) {
    texture._colorTexture = new Cesium.Texture({
      context: context,
      width: width,
      height: height,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE
    }),
      texture._depthStencilTexture = new Cesium.Texture({
        context: context,
        width: width,
        height: height,
        pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8
      })
  }

  setNewFramebuffer(texture, context, width, height) {
    this.destroyDepthStencilTexture(texture);
    this.framebufferDestroy(texture);
    this.setNewTexture(texture, context, width, height);
      texture._framebuffer = new Cesium.Framebuffer({
        context: context,
        colorTextures: [texture._colorTexture],
        depthStencilTexture: texture._depthStencilTexture,
        destroyAttachments: !1
      })
  }
  textureUpdate(texture, context, width, height) {
    var colorTexture = texture._colorTexture;
    var definedType = !Cesium.defined(colorTexture) || colorTexture.width !== width || colorTexture.height !== height;
    (Cesium.defined(texture._framebuffer) && !definedType) ||
      (this.setNewFramebuffer(texture, context, width, height),
        texture._textureChangedEvent.raiseEvent(texture._colorTexture))
  }
  update(context, width, height) {
    this.textureUpdate(this, context, width, height);
  }
  isDestroyed() {
    return false;
  }
  destroy() {
    this.destroyDepthStencilTexture(this);
    this.framebufferDestroy(this);
    Cesium.destroyObject(this);
  }
}
export default TextureChanged;
