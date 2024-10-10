//纹理变化对象
import * as Cesium from "cesium";

export class TextureChangedWater {
  constructor() {

    this._framebuffer = null;
    this._colorTexture = null;
    this._textureChangedEvent = new Cesium.Event();
  }
  getTextureChangedEvent() {
    return this._textureChangedEvent;
  }
  update(context, width, height) {
    var colorTexture = this._colorTexture
    if (!Cesium.defined(this._framebuffer)) {
      if (!Cesium.defined(colorTexture) || colorTexture.width !== width || colorTexture.height !== height) {
        this.setNewTexture(this, context, width, height);
        this._textureChangedEvent.raiseEvent(this._colorTexture);
      }
    }
  }
  isDestroyed() {
    return false;
  }
  destroy() {
    this.destroyDepthStencilTexture(this);
    this.framebufferDestroy(this);
    Cesium.destroyObject(this);
  }

  destroyDepthStencilTexture(texture) {
    texture._colorTexture && !texture._colorTexture.isDestroyed() && texture._colorTexture.destroy() || !texture._colorTexture || (texture._colorTexture.destroy = function () { },
      texture._colorTexture = void 0),
      texture._depthStencilTexture = texture._depthStencilTexture && !texture._depthStencilTexture.isDestroyed() && texture._depthStencilTexture.destroy();
  }
  framebufferDestroy(texture) {
    if (texture._framebuffer && !texture._framebuffer.isDestroyed()) {
      texture._framebuffer.destroy();
    }
  }
  setNewTexture(texture, context, width, height) {
    this.destroyDepthStencilTexture(texture);
    this.framebufferDestroy(texture);
    texture._colorTexture = new Cesium.Texture({
      context: context,
      width: width,
      height: height,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE
    });
    texture._depthStencilTexture = new Cesium.Texture({
      context: context,
      width: width,
      height: height,
      pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8
    });
    texture._framebuffer = new Cesium.Framebuffer({
      context: context,
      colorTextures: [texture._colorTexture],
      depthStencilTexture: texture._depthStencilTexture,
      destroyAttachments: false
    });
  }

}
export default TextureChangedWater;
