import * as Cesium from "cesium";
export class wrfboReflect {
  constructor() {
    this._framebuffer = null;
    this._colorTexture = null;
    this._textureChangedEvent = new Cesium.Event();
  }
  destroyDepthStencilTexture(texture) {
    (texture._colorTexture &&
      !texture._colorTexture.isDestroyed() &&
      texture._colorTexture.destroy()) ||
      !texture._colorTexture ||
      ((texture._colorTexture.destroy = function() {
        console.log("pb");
      }),
      (texture._colorTexture = void 0)),
      (texture._depthStencilTexture =
        texture._depthStencilTexture &&
        !texture._depthStencilTexture.isDestroyed() &&
        texture._depthStencilTexture.destroy());
  }
  framebufferDestroy(texture) {
    if (texture._framebuffer && !texture._framebuffer.isDestroyed()) {
      texture._framebuffer.destroy();
    }
  }
  getTextureChangedEvent() {
    return this._textureChangedEvent;
  }
  update(height1, t, context) {
    var i, r, context1, width1;
    (r = height1),
      (context1 = t),
      (width1 = context),
      (height1 = (i = this)._colorTexture),
      (t = !Cesium.defined(height1) || height1.width !== context1 || height1.height !== width1),
      (Cesium.defined(i._framebuffer) && !t) ||
        ((context = r),
        (height1 = context1),
        (t = width1),
        this.destroyDepthStencilTexture((r = i)),
        this.framebufferDestroy(r),
        (context1 = context),
        (width1 = height1),
        (height1 = t),
        ((t = r)._colorTexture = new Cesium.Texture({
          context: context1,
          width: width1,
          height: height1,
          pixelFormat: Cesium.PixelFormat.RGBA,
          pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
        })),
        (t._depthStencilTexture = new Cesium.Texture({
          context: context1,
          width: width1,
          height: height1,
          pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
          pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8,
        })),
        (r._framebuffer = new Cesium.Framebuffer({
          context: context,
          colorTextures: [r._colorTexture],
          depthStencilTexture: r._depthStencilTexture,
          destroyAttachments: !1,
        })),
        i._textureChangedEvent.raiseEvent(i._colorTexture));
  }
  isDestroyed() {
    return false;
  }
  destroy() {
    this.destroyDepthStencilTexture(this);
    this.framebufferDestroy(this);
  }
}
export default wrfboReflect;
