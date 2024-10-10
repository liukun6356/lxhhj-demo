//polygon管理对象,用于阴影分析
import * as Cesium from "cesium";
import { DasClass } from "../../core/DasClass";
export class pShineTexture extends DasClass {
  constructor(options, oldparam) {
    super(options);
    if (!Cesium.defined(options.viewer)) {
      throw new Cesium.DeveloperError("options.viewer is required.");
    }
    if (!Cesium.defined(options.matrix)) {
      throw new Cesium.DeveloperError("options.matrix is required.");
    }
    this._viewer = options.viewer;
    this._scene = this._viewer.scene;
    this.isUpdateColor = false;
    this.context = this._scene.context;
    this._matrix = options.matrix;
    this._textureWidth = Cesium.defaultValue(options.textureWidth, 1024);
    this._textureHeight = Cesium.defaultValue(options.textureHeight, 1024);
    this._modelMatrix = Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY);
    this.modelMatrix = new Cesium.Matrix4();
    this.vertexArrayFinished = false;
    this._spacing = Cesium.defaultValue(options.spacing, 10);
    this._showCurrent = Cesium.defaultValue(options.showCurrent, false);
    this._export3DDataFile = Cesium.defaultValue(options.export3DDataFile, false);
    this._isUpdate = false;
    this._isFinish = false;
    this.a = 0;
  }

  setbinddf(e, t, n) {
    var getdf=function(e, t, n) {
      return Object.defineProperty(e, t, n);
    }
    return t in e ?
      getdf(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }) : e[t] = n,
      e
  }
  getVertexArray(e) {
    "point" == e._type ? (this.aPositionTypedArray = e.aPositionTypedArrayPoint,
      this.rangeTypedArray = e.rangeTypedArrayPoint,
      this.indexTypedArray = e.indexTypedArrayPoint,
      this.a_coordTypedArray = e.a_coordTypedArrayPoint,
      this.lineVertexArray = e.lineVertexArrayPoint) : (this.aPositionTypedArray = e.aPositionTypedArrayCube,
        this.rangeTypedArray = e.rangeTypedArrayCube,
        this.indexTypedArray = e.indexTypedArrayCube,
        this.a_coordTypedArray = e.a_coordTypedArrayCube,
        this.lineVertexArray = e.lineVertexArrayCube);
    for (var t = this.lineVertexArray.indexBuffer._buffer.buffer.length, n = 1; t / Math.pow(256 * n, 2) > 1;)
      n++;
    this._textureWidth = 256 * n,
      this._textureHeight = 256 * n,
      this.attributeLocations = e.attributeLocations,
      this.vertexArrayFinished = !0,
      this.createCommand()
  }
  createCommand() {
    var e, that = this, n = this._scene.context, i = Cesium.RenderState.fromCache({
      cull: {
        enabled: !1
      },
      depthTest: {
        enabled: !0
      }
    }), r = (e = {
      u_matrix: function () {
        return that._matrix
      },
      shadowMap_texture: function () {
        return that._viewer.shadowMap._shadowMapTexture
      },
      shadowMap_cascadeSplits: function () {
        return that._viewer.shadowMap._shadowMapTexture
      },
      shadowMap_textureCube: function () {
        return that._viewer.shadowMap._shadowMapTexture
      },
      shadowMap_matrix: function () {
        return that._viewer.shadowMap._shadowMapMatrix
      }
    },
      (0,
        this.setbinddf)(e, "shadowMap_cascadeSplits", function () {
          return that._viewer.shadowMap._cascadeSplits
        }),
      (0,
      this.setbinddf)(e, "shadowMap_cascadeMatrices", function () {
          return that._viewer.shadowMap._cascadeMatrices
        }),
      (0,
      this.setbinddf)(e, "shadowMap_lightDirectionEC", function () {
          return that._viewer.shadowMap._lightDirectionEC
        }),
      (0,
      this.setbinddf)(e, "shadowMap_lightPositionEC", function () {
          return that._viewer.shadowMap._lightPositionEC
        }),
      (0,
      this.setbinddf)(e, "shadowMap_cascadeDistances", function () {
          return that._viewer.shadowMap._cascadeDistances
        }),
      (0,
      this.setbinddf)(e, "u_shadowRateTex", function () {
          return that._shadowRateTexture
        }),
      (0,
      this.setbinddf)(e, "u_showCurrent", function () {
          return that._showCurrent
        }),
      (0,
      this.setbinddf)(e, "u_spaceing", function () {
          return that._spacing
        }),
      e), a = Cesium.ShaderProgram.fromCache({
        context: n,
        vertexShaderSource: `uniform mat4 u_matrix;
                                                  attribute vec4 aPosition;
                                                  attribute vec4 a_range;
                                                  attribute vec2 a_coord;
                                                  varying vec4 v_positionEC;
                                                  varying vec4 v_range;
                                                  varying vec2 v_coord;
                                                  void main() 
                                                  {
                                                      gl_Position = vec4(a_coord*2.0-1.0,0.5,1.0);
                                                      // v_positionEC = czm_modelView * u_matrix * aPosition;
                                                      v_positionEC = czm_view*czm_model*u_matrix * aPosition;
                                                      v_coord = a_coord;
                                                      gl_PointSize = 1.0;
                                                  }`,
        fragmentShaderSource: `#ifdef GL_EXT_frag_depth
                              #extension GL_EXT_frag_depth:enable
                              #endif
                              #ifdef GL_OES_standard_derivatives
                              #extension GL_OES_standard_derivatives:enable
                              #endif
                              varying vec4 v_positionEC;
                              varying vec2 v_coord;
                              uniform sampler2D shadowMap_texture;
                              uniform sampler2D u_shadowRateTex;
                              uniform bool u_showCurrent;
                              uniform float u_spaceing;
                              float unpackDepth(const in vec4 rgba_depth) {
                                const vec4 bitShifts = vec4(1.0, 1.0 / 255.0, 1.0 / (255.0 * 255.0), 1.0 / (255.0 * 255.0 * 255.0));
                                float depth = dot(rgba_depth, bitShifts);
                                return depth;
                              }
                              vec4 packDepth(float depth) {
                                  const vec4 bias = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
                                  float r = depth;
                                  float g = fract(r * 255.0);
                                  float b = fract(g * 255.0);
                                  float a = fract(b * 255.0);
                                  vec4 color = vec4(r, g, b, a);
                                  return color - (color.yzww * bias);
                                }
                              void main()
                              {
                                  vec2 vTexcoord = v_coord;
                                  gl_FragColor = texture2D(u_shadowRateTex,vTexcoord);
                                  vec4 positionEC = v_positionEC;
                                  float depth = -positionEC.z; //Get the cascade based on the eye-space depth
                                  float maxDepth = shadowMap_cascadeSplits[1].w; //Stop early if the eye depth exceeds the last cascad
                                  if(depth > maxDepth)
                                  {
                                     return;
                                  }
                                  vec4 weights = czm_cascadeWeights(depth); //Transform position into the cascade
                                  vec4 shadowPosition = czm_cascadeMatrix(weights) * positionEC;
                                  vec2 texCoords = shadowPosition.xy;
                                  float shadowDepth = shadowPosition.z;
                                  float visibility = czm_shadowDepthCompare(shadowMap_texture,texCoords,shadowDepth);   // Get visibility
                                  if(u_showCurrent){
                                    if(visibility < 0.001){
                                      gl_FragColor = packDepth(0.99);//这个是有阴影的
                                    }
                                    else{
                                       gl_FragColor = packDepth(0.01);//这个是没有阴影的
                                      }
                                  }else{
                                    if(visibility > .001)//累计的光照照射的次数
                                    {
                                        float oldRate = unpackDepth(gl_FragColor);
                                        float shadowRate = clamp(oldRate,0.0,1.0) + 3.8/u_spaceing;
                                        gl_FragColor = packDepth(shadowRate);
                                    }
                                  }
                              }`,
        attributeLocations: this.attributeLocations
      });
    this._shaderprogram = a,
      this.sunshineVertexArray = this.lineVertexArray,
      this._initBoundingSphere = Cesium.BoundingSphere.fromVertices(this.aPositionTypedArray);
    var s = Cesium.PrimitiveType.POINTS
      , l = this._scene.frameState
      , u = l.mapProjection.ellipsoid;
    this._sunshineCommand = new Cesium.DrawCommand({
      vertexArray: this.sunshineVertexArray,
      primitiveType: s,
      renderState: i,
      shaderProgram: a,
      uniformMap: r,
      owner: this,
      pass: Cesium.Pass.OPAQUE,
      modelMatrix: new Cesium.Matrix4,
      boundingVolume: new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, u.maximumRadius),
      cull: !0
    })
  }
  createFrameBuffer() {
    this._framebuffer = new Cesium.Framebuffer({
      context: this.context,
      colorTextures: [this._colorTexture],
      depthStencilTexture: this._depthStencilTexture,
      destroyAttachments: !1
    })
  }
  destroyTexture() {
    !(this._colorTexture && !this._colorTexture.isDestroyed() && this._colorTexture.destroy()) && this._colorTexture && (this._colorTexture.destroy = function () {
      console.log("已销毁")
    }
      ,
      this._colorTexture = void 0)
  }
  destroyFramebuffer() {
    this._framebuffer = this._framebuffer && !this._framebuffer.isDestroyed() && this._framebuffer.destroy();
  }
  createTexture(e, t) {
    this._colorTexture = new Cesium.Texture({
      context: this.context,
      width: e,
      height: t,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
      sampler: new Cesium.Sampler({
        minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
        magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
      })
    }),
      this._depthStencilTexture = new Cesium.Texture({
        context: this.context,
        width: e,
        height: t,
        pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8,
        sampler: new Cesium.Sampler({
          minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
          magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
        })
      }),
      this._shadowRateTexture = new Cesium.Texture({
        context: this.context,
        width: e,
        height: t,
        pixelFormat: Cesium.PixelFormat.RGBA,
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
        sampler: new Cesium.Sampler({
          minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
          magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
        }),
        flipY: !1
      });
  }
  updateTextureAndFrameBuffer(width, height) {
    var n = this._colorTexture,
       i = !Cesium.defined(n) || n.width !== width || n.height !==  height;
    Cesium.defined(this._framebuffer) && !i || (this.destroyTexture(),
      this.destroyFramebuffer(),
      this.createTexture(this._textureWidth, this._textureHeight),
      this.createFrameBuffer(),
      this._clear());
  }
  _clear() {
    this._clearCommand = new Cesium.ClearCommand({
      depth: 1,
      color: new Cesium.Color(0, 0, 0, 0)
    }),
      this._clearPassState = new Cesium.PassState(this.context);
  }
  setUpdateState() {
    this._isUpdate = true;
  }
  //a = 0;
  stop() {
    this._export3DDataFile && this.makeUpShdowRateJson();
  }
  makeUpShdowRateJson() {
    this.shadowRatepixels ? (this.content = this.shadowRatepixels,
      this.fileName = e || "shadowRateAnliles",
      this.makeUpJsonFile()) : console.error("请先生成阴影数据")
  }
  makeUpJsonFile() {
    var e = document.createElement("a");
    e.download = this.fileName;
    var t = new Blob([this.content], {
      type: "application/octet-stream"
    });
    e.href = URL.createObjectURL(t),
      document.body.appendChild(e),
      e.click(),
      document.body.removeChild(e)
  }
  executeCommands() {
    var e = this.context
      , t = this._textureWidth
      , n = this._textureHeight
      , i = this._colorTexture
      , r = !Cesium.defined(i) || i.width !== t || i.height !== n;
    Cesium.defined(this._framebuffer) && !r || this.updateTextureAndFrameBuffer(this._textureWidth, this._textureHeight),
      Cesium.defined(this._passState) || (this._passState = new Cesium.PassState(e),
        this._passState.framebuffer = this._framebuffer,
        this._passState.viewport = new Cesium.BoundingRectangle(0, 0, this._textureWidth, this._textureHeight));
    var o = e.uniformState;
    this._clearCommand.framebuffer = this._framebuffer,
      this._clearCommand.execute(e, this._clearPassState),
      Cesium.Matrix4.equals(this.modelMatrix, this._modelMatrix) || (Cesium.Matrix4.clone(this.modelMatrix, this._modelMatrix),
        this._sunshineCommand.modelMatrix = Cesium.Matrix4.IDENTITY),
      o.updatePass(Cesium.Pass.OPAQUE),
      this._sunshineCommand.execute(e, this._passState),
      this._sunshineCommand.framebuffer = this._framebuffer;
    var s = e.readPixels({
      x: 0,
      y: 0,
      width: this._textureWidth,
      height: this._textureHeight,
      framebuffer: this._framebuffer
    });
    this.shadowRatepixels = s,
      this._shadowRateTexture.copyFrom({
        width: this._textureWidth,
        height: this._textureHeight,
        arrayBufferView: s
      }),
      this.a++
  }
  update() {
    this._isUpdate && (this.executeCommands(),
      this._isUpdate = !1)
  }
  destroy() {
    return this.destroyTexture(),
      this.destroyFramebuffer(),
      this._shadowRateTexture.destroy(),
      Cesium.destroyObject(this)
  }
  //========== 对外属性 ==========
  //scene
  get scene() {
    return this._viewer;
  }
  set scene(val) {
    if (val) {
      this._scene = val;
    }
  }

  //height
  get height() {
    return this._height;
  }
  set height(val) {
    if (val) {
      this._height = Number(val);
    }
  }

  get spacing() {
    return this._spacing;
  }
  set spacing(val) {
    if (val !== 0) {
      this._spacing = Number(val);
    }
  }

  get showCurrent() {
    return this._showCurrent;
  }
  set showCurrent(val) {
    this._showCurrent = Boolean(val);
  }
}
