//阴影率分析类
import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
import { pShineTexture } from "./core/pShineTexture";
import { voxel } from "./core/voxel";

export class ShadowAnalyse extends DasClass {
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    this._positions = options.positions;
    this._viewer = options.viewer;
    this._scene = this._viewer.scene;
    this._options = options;
    this._currentDate = Cesium.defaultValue(options.currentDate, new Date("2021-05-20"));
    this._startTime = Cesium.defaultValue(options.startTime, 0);
    this._endTime = Cesium.defaultValue(options.endTime, 8);
    this._timeSpacing = Cesium.defaultValue(options.timeSpacing, 30);
    this._width = Cesium.defaultValue(options.width, 2);
    this._radius = Cesium.defaultValue(options.radius, 2);
    this._spacing = Cesium.defaultValue(options.spacing, 0.1 * this._width);
    this._extrudeHeight = Cesium.defaultValue(options.extrudeHeight, 20);
    this._baseHeight = Cesium.defaultValue(options.baseHeight, 20);
    this._depthStep = Cesium.defaultValue(options.depthStep, 40);
    this._widthStep = Cesium.defaultValue(options.widthStep, 40);
    this._heightStep = Cesium.defaultValue(options.heightStep, 4);
    this.textureState = false;
    this._bound = new Cesium.BoundingRectangle();
    this._type = Cesium.defaultValue(options.type, "point");
    this._showAnimate = Cesium.defaultValue(options.showAnimate, true);
    this._alpha = Cesium.defaultValue(options.alpha, false);
    this._showCurrent = Cesium.defaultValue(options.showCurrent, false);
    this._alpha = Cesium.defaultValue(options.alpha, false);
    this._filterValue = Cesium.defaultValue(options.filterValue, 0);
    this._oitEnable = Cesium.defaultValue(options.oitEnable, false);
    this._alphaScale = Cesium.defaultValue(options.alphaScale, 1);
    this.initlize();
  }
  _extends(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }
  getdf(target) {
    if (target) {
      if (target.__esModule) {
        return target;
      } else {
        return { default: target };
      }
    }
  }
  setbinddf(e, t, n) {
    return t in e ?
      getdf(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }) : e[t] = n,
      e;
  }
  polygonMannage() {
    function createPosition() {
      this.viewMatrix = Cesium.Matrix4.IDENTITY,
        this.inverseViewMatrix = Cesium.Matrix4.IDENTITY,
        this.frustum = new Cesium.OrthographicOffCenterFrustum,
        this.positionCartographic = new Cesium.Cartographic,
        this.positionWC = new Cesium.Cartesian3,
        this.directionWC = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Z),
        this.upWC = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y),
        this.rightWC = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_X),
        this.viewProjectionMatrix = Cesium.Matrix4.IDENTITY
    }
    function CreateFramebuffer(polygon, context, width, height) {
      width = parseInt(width),
        height = parseInt(height);
      var colorTexture = polygon._colorTexture
        , differentType = !Cesium.defined(colorTexture) || colorTexture.width !== width || colorTexture.height !== height;
      Cesium.defined(polygon.framebuffer) && !differentType || (destroyDepthStencilTexture(polygon),
        destroyBuffer(polygon),
        addTexture(polygon, context, width, height),
        addFramebuffer(polygon, context))
    }
    function destroyDepthStencilTexture(polygon) {
      !(polygon._colorTexture && !polygon._colorTexture.isDestroyed() && polygon._colorTexture.destroy()) && polygon._colorTexture && (polygon._colorTexture.destroy = function () {
        console.log("ddd")
      }
        ,
        polygon._colorTexture = void 0),
        polygon._depthStencilTexture = polygon._depthStencilTexture && !polygon._depthStencilTexture.isDestroyed() && polygon._depthStencilTexture.destroy()
    }
    function destroyBuffer(polygon) {
      polygon._framebuffer = polygon._framebuffer && !polygon._framebuffer.isDestroyed() && polygon._framebuffer.destroy();
    }
    function addTexture(polygon, context, width, height) {
      polygon._clearPassState = new Cesium.PassState(context),
        polygon._colorTexture = new Cesium.Texture({
          context: context,
          width: width,
          height: height,
          pixelFormat: Cesium.PixelFormat.RGBA,
          pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
          sampler: new Cesium.Sampler({
            minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
          })
        }),
        polygon._depthStencilTexture = new Cesium.Texture({
          context: context,
          width: width,
          height: height,
          pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
          pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8,
          sampler: new Cesium.Sampler({
            minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
          })
        })
    }
    function addFramebuffer(polygon, context) {
      polygon.framebuffer = new Cesium.Framebuffer({
        context: context,
        colorTextures: [polygon._colorTexture],
        depthStencilTexture: polygon._depthStencilTexture,
        destroyAttachments: false
      })
    }
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    createPosition.prototype.clone = function (position) {
      Cesium.Matrix4.clone(position.viewMatrix, this.viewMatrix);
      Cesium.Matrix4a.clone(position.inverseViewMatrix, this.inverseViewMatrix);
      this.frustum = position.frustum.clone(this.frustum);
      Cesium.Cartographic.clone(position.positionCartographic, this.positionCartographic);
        Cesium.Cartesian3.clone(position.positionWC, this.positionWC);
      Cesium.Cartesian3.clone(position.directionWC, this.directionWC);
        Cesium.Cartesian3.clone(position.upWC, this.upWC);
      Cesium.Cartesian3.clone(position.rightWC, this.rightWC);
    }
      ;
    var p = function () {
      var e = function () {
        this._framebuffer = void 0;
        this._colorTexture = void 0;
        this._depthStencilTexture = void 0;
        this._clearPassState = void 0;
        this._passState = void 0;
        this.canvas = void 0;
        this._polygons = [];
        this._polygonDrawCommands = [];
        this._clearCommand = new Cesium.ClearCommand({
          depth: 1,
          color: new Cesium.Color(0, 0, 0, 0)
        });
        this._clearPassState = void 0;
        this._width = 4096;
        this._height = 4096;
        this._textureChangedEvent = new Cesium.Event();
        this._viewport = new Cesium.BoundingRectangle();
        this._bound = new Cesium.Cartesian4();
        this._camera = new createPosition();
        this.canvas = void 0;
        this._polygonDirty = false;
        this._PolygonDirtyEvent = new Cesium.Event();
        this._matrix = void 0;
        this._scratchBS = new Cesium.BoundingSphere();
        this._autoMatrix = void 0;
        this._globe = [];
        this._uniforMap = {};
        this._drawCommand = null;
      }
      return (0,
        _createClass)(e, [{
          key: "getTextureChangedEvent",
          value: function () {
            return this._textureChangedEvent
          }
        }, {
          key: "update",
          value: function (context, t, n) {
            this._polygonDirty && (this._autoMatrixDirty && (this._computeAutoMatrix(),
              this._autoMatrixDirty = false),
              this._PolygonDirtyEvent.raiseEvent(),
              this._polygonDirty = false,
              this.updateCommands(context),
              this.executeCommands(this, context, t, n))
          }
        }, {
          key: "updateCommands",
          value: function (context) {
            if (0 != this._polygons.length) {
              this._polygonDrawCommands = [];
              var Locations = {
                position: 0
              }
                , MatrixClone = Cesium.Matrix4.clone(this.getMatrix());
              Cesium.Matrix4.inverse(MatrixClone, MatrixClone);
              for (var BoundingRectangle = new Cesium.BoundingRectangle(), PositionArr = [], polygonIndex = 0; polygonIndex < this._polygons.length; polygonIndex++) {
                var polygonItem = this._polygons[polygonIndex]
                  , tempGeometry = Cesium.PolygonGeometry.createGeometry(polygonItem);
                if (tempGeometry) {
                  for (var positionValue = tempGeometry.attributes.position.values, positionIndex = 0; positionIndex < positionValue.length / 3; positionIndex++) {
                    var tempPosition = new Cesium.Cartesian3(0, 0, 0);
                    tempPosition.x = positionValue[3 * positionIndex],
                      tempPosition.y = positionValue[3 * positionIndex + 1],
                      tempPosition.z = positionValue[3 * positionIndex + 2],
                      Cesium.Matrix4.multiplyByPoint(MatrixClone, tempPosition, tempPosition),
                      PositionArr.push(tempPosition),
                      tempGeometry.attributes.position.values[3 * positionIndex] = tempPosition.x,
                      tempGeometry.attributes.position.values[3 * positionIndex + 1] = tempPosition.y,
                      tempGeometry.attributes.position.values[3 * positionIndex + 2] = tempPosition.z
                  }
                  var boundingSphere = Cesium.BoundingSphere.transform(tempGeometry.boundingSphere, MatrixClone, boundingSphere);
                  tempGeometry.boundingSphere = boundingSphere;
                  var fromGeometry = Cesium.VertexArray.fromGeometry({
                    context: context,
                    geometry: tempGeometry,
                    attributeLocations: Locations,
                    bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
                    interleave: !0
                  })
                    , fromCache = Cesium.ShaderProgram.fromCache({
                      context: context,
                      vertexShaderSource: `attribute vec3 position; 
                                                                    varying float das3d_depth; 
                                                                    void main() 
                                                                    { 
                                                                        das3d_depth = position.z; 
                                                                        gl_Position = czm_projection*vec4(position.xy, 0.0, 1.0); 
                                                                    }`,
                      fragmentShaderSource: `vec3 das3d_packDepth(float depth) 
                                                                        { 
                                                                        vec3 enc = vec3(1.0, 255.0, 65025.0) * depth; 
                                                                        enc = fract(enc); 
                                                                        enc -= enc.yzz * vec3(1.0 / 255.0, 1.0 / 255.0, 0.0); 
                                                                        return enc; 
                                                                        } 
 
                                                                        varying float das3d_depth; 
                                                                        void main() 
                                                                        { 
                                                                        // das3d_depth_range -3000.0 - 3000.0;  
                                                                        float fDepth = (das3d_depth + 3000.0) / 6000.0; 
                                                                        gl_FragColor.rgb = vec3(1.0,1.0,0.0); 
                                                                        gl_FragColor.a = 1.0; 
                                                                        }`
                    })
                    , renderState = new Cesium.RenderState();
                  renderState.depthTest.enabled = !0,
                    renderState.cull.enabled = !0,
                    renderState.cull.face = Cesium.CullFace.BACK;
                  var uniforMap = this._uniforMap
                    , polygonDrawCommandItem = new Cesium.DrawCommand({
                      boundingVolume: boundingSphere,
                      modelMatrix: new Cesium.Matrix4(),
                      primitiveType: Cesium.PrimitiveType.TRIANGLES,
                      vertexArray: fromGeometry,
                      shaderProgram: fromCache,
                      uniformMap: uniforMap,
                      renderState: renderState,
                      pass: Cesium.Pass.COMPUTE
                    });
                  this._polygonDrawCommands.push(polygonDrawCommandItem),
                    this._drawCommand = polygonDrawCommandItem
                }
              }
              Cesium.BoundingRectangle.fromPoints(PositionArr, BoundingRectangle),
                this._bound.x = BoundingRectangle.x,
                this._bound.y = BoundingRectangle.y + BoundingRectangle.height,
                this._bound.z = BoundingRectangle.x + BoundingRectangle.width,
                this._bound.w = BoundingRectangle.y,
                this.updateFrustum(this._bound.x, this._bound.y, this._bound.z, this._bound.w)
            } else
              this.updateFrustum(0, 0, 0, 0)
          }
        }, {
          key: "getMatrix",
          value: function () {
            return this._matrix ? this._matrix : (this._autoMatrixDirty && (this._computeAutoMatrix(),
              this._autoMatrixDirty = !1),
              this._autoMatrix)
          }
        }, {
          key: "_computeAutoMatrix",
          value: function () {
            var pointsArr = [];
            if (this._polygons.forEach(function (polygonItem) {
              var polygonPositions = polygonItem._polygonHierarchy.positions;
              Array.prototype.push.apply(pointsArr, polygonPositions)
            }),
              pointsArr.length > 0) {
              var t = Cesium.BoundingSphere.fromPoints(pointsArr, this._scratchBS);
              pointsArr.length = 0;
              var ellipsoid = this._ellipsoid || Cesium.Ellipsoid.WGS84
                , scaleToGeodeticSurface = ellipsoid.scaleToGeodeticSurface(t.center);
              this._scratchAutoMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(scaleToGeodeticSurface, ellipsoid, this._scratchAutoElevationMatrix),
                this._autoMatrix = this._scratchAutoMatrix
            } else
              this._autoMatrix = void 0
          }
        }, {
          key: "updateFrustum",
          value: function (frustumLeft, frustumTop, frustumRight, frustumBottom) {
            this._camera.frustum.left = frustumLeft,
              this._camera.frustum.top = frustumTop,
              this._camera.frustum.right = frustumRight,
              this._camera.frustum.bottom = frustumBottom
          }
        }, {
          key: "addPolygon",
          value: function (polygon) {
            return this._polygons.push(polygon),
              this.refreshPolygons(),
              this._polygons.length - 1
          }
        }, {
          key: "removePolygon",
          value: function (polygon) {
            var t = this._polygons.indexOf(polygon);
            t > -1 && (this._polygons.splice(t, 1),
              this.refreshPolygons())
          }
        }, {
          key: "removeAllPolygon",
          value: function () {
            this._polygonDrawCommands = [],
              this._polygons = [],
              this.refreshPolygons()
          }
        }, {
          key: "refreshPolygons",
          value: function () {
            this._polygonDirty = true,
              this._autoMatrixDirty = true
          }
        }, {
          key: "executeCommands",
          value: function (polygon, context, width, height) {
            var colorTexture = polygon._colorTexture
              , TextureType = !Cesium.defined(colorTexture) || colorTexture.width !== width || colorTexture.height !== height;
            Cesium.defined(polygon._framebuffer) && !TextureType || (CreateFramebuffer(polygon, context, width, height),
              polygon._textureChangedEvent.raiseEvent(polygon._colorTexture)),
              Cesium.defined(this._passState) || (this._passState = new Cesium.PassState(context),
                this._passState.framebuffer = this.framebuffer,
                this._passState.viewport = new Cesium.BoundingRectangle(0, 0, width, height));
            var uniformState = context.uniformState;
            uniformState.updateCamera(this._camera),
              this._clearCommand.framebuffer = this.framebuffer,
              this._clearCommand.execute(context, this._clearPassState);
            for (var l = 0; l < this._polygonDrawCommands.length; l++) {
              var polygonDrawCommandItem = this._polygonDrawCommands[l];
              uniformState.updatePass(polygonDrawCommandItem.pass),
                polygonDrawCommandItem.framebuffer = this.framebuffer,
                polygonDrawCommandItem.execute(context, this._passState)
            }
          }
        }, {
          key: "isDestroyed",
            value: function () {
              return false;
          }
        }, {
          key: "destroy",
          value: function () {
            return destroyDepthStencilTexture(this),
              destroyBuffer(this),
              Cesium.destroyObject(this)
          }
        }, {
          key: "attachTileset",
          value: function (polygon) {
            -1 === this._globe.indexOf(polygon) && (polygon._PolygonTexture = this,
              this._globe.push(polygon))
          }
        }, {
          key: "detachTileset",
          value: function (tileset) {
            var hasTileset = this._globe.indexOf(tileset);
            if (-1 !== hasTileset)
              return tileset._flattenedPolygonTexture = void 0,
                void this._globe.splice(hasTileset, 1)
          }
        }]),
        e
    }();
    return p
  }
  initlize() {
    this.offsetTime = this._timeSpacing / 60;
    this._totalNumber = (this._endTime - this._startTime) / this.offsetTime;
    this.setOit();
    this._polygonTextureW = 256;
    this._polygonTextureH = 256;
    this.computeRectangle();
    this.getRange();
    this.createVoxel();
    this._viewer.scene.primitives.add(this);
  }
  setTime() {
    var that = this
      , sTime = this._startTime - 8
      , eTime = this._endTime - 8;
    this.julianDate = Cesium.JulianDate.fromDate(new Date(this._currentDate.toJSON())),
      Cesium.JulianDate.addHours(this.julianDate, sTime, this.julianDate),
      this._viewer.clock.currentTime = this.julianDate;
    var i = 0;
      var  r = setInterval(function () {
        sTime < eTime ? (i += 1,
          i > 60 && (i = 0),
          sTime += that.offsetTime,
          that.setCurrenTime()) : (clearInterval(r),
            that.sunshineTexture && that.sunshineTexture.stop())
      }, 10)
  }
  setCurrenTime() {
    Cesium.JulianDate.addHours(this.julianDate, this.offsetTime, this.julianDate),
      this._viewer.clock.currentTime = this.julianDate,
      this.sunshineTexture && this.sunshineTexture.setUpdateState()
  }
  setOit() {
    this._oitEnable ? this._viewer.scene.view.oit || (this._viewer.scene.view.oit = new Cesium.OIT(this._viewer.scene.context)) : this._viewer.scene.view.oit = void 0
  }
  getRange() {
    var plgfbo = new this.polygonMannage();
    this._plgfbo = new plgfbo(),
      this._plgfbo.removeAllPolygon();
    var e = Cesium.PolygonGeometry.fromPositions({
      positions: this._positions
    });
    this._plgfbo.addPolygon(e),
      this._plgfbo.attachTileset(this._scene.globe)
  }
  computeRectangle() {
    for (var positions = this._positions, t = null, n = null, i = null, r = null, positionsIndex = 0; positionsIndex < positions.length; positionsIndex++) {
      var a = Cesium.Cartographic.fromCartesian(positions[positionsIndex])
        , s = [Cesium.Math.toDegrees(a.longitude), Cesium.Math.toDegrees(a.latitude)];
      t ? (t = Math.min(t, s[0]),
        n = Math.max(n, s[0]),
        i = Math.min(i, s[1]),
        r = Math.max(r, s[1])) : (t = s[0],
          n = s[0],
          i = s[1],
          r = s[1])
    }
    this._boundingSphere = new Cesium.BoundingSphere;
    var l = Cesium.Ellipsoid.WGS84
      , u = (n + t) / 2
      , h = (r + i) / 2
      , c = this._baseHeight + this._extrudeHeight / 2
      , d = new Cesium.Cartesian3.fromDegrees(u, h, c)
      , f = new Cesium.Cartesian3.fromDegrees(t, i, this._baseHeight);
    Cesium.Cartesian3.clone(d, this._boundingSphere.center),
      this._boundingSphere.radius = .5 * Cesium.Cartesian3.magnitude(d);
    var p = Cesium.Transforms.eastNorthUpToFixedFrame(f, l, new Cesium.Matrix4)
      , m = Cesium.Matrix4.inverse(p, new Cesium.Matrix4);
    this.locPos = [];
    for (var positionsIndex = 0; positionsIndex < positions.length; positionsIndex++) {
      var g = Cesium.Matrix4.multiplyByPoint(m, positions[positionsIndex], new Cesium.Cartesian3);
      this.locPos.push(g)
    }
    var v = Cesium.BoundingRectangle.fromPoints(this.locPos, new Cesium.BoundingRectangle);
    this._bound = v,
      this._matrix = p
  }
  getShadowRate(e) {
    var t = Cesium.Matrix4.inverse(this._matrix, new Cesium.Matrix4)
      , n = Cesium.Matrix4.multiplyByPoint(t, e, new Cesium.Cartesian3)
      , i = this._viewer.scene.context.readPixels({
        x: 0,
        y: 0,
        width: this.sunshineTexture._textureWidth,
        height: this.sunshineTexture._textureHeight,
        framebuffer: this.sunshineTexture._framebuffer
      })
      , r = [];
    this.maxDistance = this.voxel.maxDistance / 2;
    for (var o = new Cesium.Cartesian4(1, 1 / 255, 1 / 65025, 1 / 16581375), a = {
      minDis: this.voxel.maxDistance,
      currentPos: null,
      shadowRate: null,
      num: 0
    }, s = this.voxel._coordPositions.length, l = 0; l < 4 * s; l += 4) {
      var u = new Cesium.Cartesian4(i[l], i[l + 1], i[l + 2], i[l + 3])
        , h = Cesium.Cartesian4.dot(u, o) / 255
        , c = Cesium.Cartesian3.distance(n, this.voxel._coordPositions[l / 4]);
      c < a.minDis && (a.minDis = c,
        a.currentPos = this.voxel._coordPositions[l / 4],
        a.shadowRate = 1 - h,
        a.num = l / 4),
        r.push(h)
    }
    var d = -1;
    return null !== a.currentPos && (Cesium.Matrix4.multiplyByPoint(this._matrix, a.currentPos, a.currentPos),
      d = a),
      d
  }
  createVoxel() {
    var that = this;
    //var vvvpbobj= new vvvpb();
    this.voxelOptions = that._extends(this._options, {
      bound: this._bound,
      matrix: this._matrix,
      plgfbo: this._plgfbo,
      baseHeight: this._baseHeight,
      extrudeHeight: this._extrudeHeight,
      boundingSphere: this._boundingSphere
    }),
      this.voxel = new voxel(this.voxelOptions)
  }
  getShadowRateTexture() {
    var that = this;
    var e = that._extends(this.voxelOptions, {
      showCurrent: this._showCurrent
    });
    //var sTexture = new pShineTexture();
    //this.sunshineTexture = new wwwpb.default(e),
    this.sunshineTexture = new pShineTexture(e),
      this.sunshineTexture.spacing = this._totalNumber,
      this.sunshineTexture.getVertexArray(this.voxel),
      this.setTime()
  }
  getIJKRange() {
    var that = this;
    return new c.default(function (t, n) {
      that.voxel ? t(1) : n(-1)
    }
    )
  }
  update(e) {
    this._plgfbo.update(this._viewer.scene.context, this._polygonTextureW, this._polygonTextureH),
      this.voxel && this.voxel.isDestroyed || this.sunshineTexture && this.sunshineTexture.isDestroyed || (this.voxel && this.voxel._computePositionFinish && !this.sunshineTexture && this.getShadowRateTexture(),
        this.sunshineTexture && this.voxel && (this._showAnimate ? (this.voxel.dataTexture = this.sunshineTexture,
          this.voxelUpdate = !0) : this.sunshineTexture._isFinish && !this.voxelUpdate && (console.log("纹理赋值给体素"),
            this.voxel.dataTexture = this.sunshineTexture,
            this.voxelUpdate = !0)),
        this.voxel && this.voxelUpdate && !this.voxel.isDestroyed && this.sunshineTexture && !this.sunshineTexture.isDestroyed && (this.voxel._changeState && ("point" == this.voxel._type ? this.sunshineTexture._sunshineCommand.vertexArray = this.voxel.lineVertexArrayPoint : this.sunshineTexture._sunshineCommand.vertexArray = this.voxel.lineVertexArrayCube),
          this.voxel.update(e)),
        !this.sunshineTexture || this.sunshineTexture._isFinish || this.sunshineTexture.isDestroyed || this.sunshineTexture.update(e))
  }
  remove() {
    this.voxel && (this.voxel.destroy(),
      this.voxel = null),
      this.sunshineTexture && (this.sunshineTexture.destroy(),
        this.sunshineTexture = null)
  }
  reset() {
    this.remove();
    this.initlize();
  }
  destroy() {
    this.oitEnable = false;
    this.voxel && (this.voxel.destroy(),
      this.voxel = null),
      this.sunshineTexture && (this.sunshineTexture.destroy(),
        this.sunshineTexture = null),
      this._viewer.scene.primitives.remove(this);
  }

  //对外属性
  get scene() {
    return this._viewer;
  }
  set scene(val) {
    if (val) {
      this._scene = val;
    }
  }

  get height() {
    return this._height;
  }
  set height(val) {
    if (val) {
      this._height = Number(val);
    }
  }

  get startTime() {
    return this._startTime;
  }
  set startTime(val) {
    if (val) {
      this._startTime = Number(val);
      this.reset();
    }
  }

  get endTime() {
    return this._endTime;
  }
  set endTime(val) {
    if (val) {
      this._endTime = Number(val);
      this.reset();
    }
  }

  get showAnimate() {
    return this._showAnimate;
  }
  set showAnimate(val) {
    if (val) {
      this._showAnimate = Boolean(val);
    }
  }

  get type() {
    return this._type;
  }
  set type(val) {
    if (val) {
      this._type = val;
      if (this.voxel) {
        this.voxel.type = val;
      }
    }
  }

  get showCurrent() {
    return this._showCurrent;
  }
  set showCurrent(val) {
    if (val) {
      this._showCurrent = Boolean(val);
      if (this.sunshineTexture) {
        this.sunshineTexture.showCurrent = val;
      }
    }
  }

  get alpha() {
    return this._alpha;
  }
  set alpha(val) {
    if (val) {
      this._alpha = Boolean(val);
      if (this.voxel) {
        this.voxel.alpha = this._alpha;
      }
    }
  }

  get filterValue() {
    return this._filterValue;
  }
  set filterValue(val) {
    if (val) {
      this._filterValue = Number(val);
      if (this.voxel) {
        this.voxel.filterValue = this._filterValue;
      }
    }
  }

  get extrudeHeight() {
    return this._extrudeHeight;
  }
  set extrudeHeight(val) {
    if (val) {
      this._extrudeHeight = Number(val);
      if (this.voxel) {
        this.voxel.extrudeHeight = this._extrudeHeight;
      }
      this.reset();
    }
  }

  get ijk() {
    return this._ijk;
  }
  set ijk(val) {
      this._ijk = val;
      if (this.voxel) {
        this.voxel.ijk = this._ijk;
      }
  }

  get baseHeight() {
    return this._baseHeight;
  }
  set baseHeight(val) {
    this._baseHeight = val;
    this.reset()
  }


  get currentDate() {
    return this._extrudeHeight
  }
  set currentDate(val) {
    this._extrudeHeight = val;
    this.reset()
  }

  get oitEnable() {
    return this._oitEnable;
  }
  set oitEnable(val) {
    this._oitEnable = val;
    this.setOit()
  }

  get alphaScale() {
    return this._alphaScale;
  }
  set alphaScale(val) {
    if (this.voxel) {
      this.voxel.alphaScale = Number(val);
    }
  }
}
