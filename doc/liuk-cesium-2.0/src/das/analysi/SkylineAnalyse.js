import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
import { Drawline } from "./core/Drawline";

//天际线 类
export class SkylineAnalyse extends DasClass {
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
    this._viewer = options.viewer;
    this.scene = options.viewer.scene;
    this.context = this.scene.context;
    this._viewer = options.viewer;
    this._lineColor = Cesium.defaultValue(options.lineColor, Cesium.Color.RED); //天际线颜色
    this._lineWidth = Cesium.defaultValue(options.lineWidth, 2); //天际线线宽
    this._faceColor = Cesium.defaultValue(options.faceColor, Cesium.Color.CHOCOLATE); //限高体颜色
    this._faceOutlineColor = Cesium.defaultValue(options.faceOutlineColor, Cesium.Color.WHITE); //限高体轮廓颜色
    this._radius = Cesium.defaultValue(options.radius, 5000); //天际线分析范围
    this._viewPosition = Cesium.defaultValue(options.viewPosition, void 0);
    this._heading = Cesium.defaultValue(options.heading, void 0);
    this._pitch = Cesium.defaultValue(options.pitch, void 0);
    this._roll = Cesium.defaultValue(options.roll, void 0);
    this._fov = Cesium.defaultValue(options.fov, void 0);
    this.height = this.context.drawingBufferHeight;
    this.width = this.context.drawingBufferWidth;
    this.uniformState = this.context.uniformState;
    this.camera = this.scene.camera;
    this.customCamera = null;
    this.isUpdateRadius = true; //是否可以修改半径
    this.fragmentShader =
      "\n    #extension GL_OES_standard_derivatives : enable\n    uniform sampler2D depthTexture;\n    varying vec2 v_textureCoordinates;\n    void main() \n    {\n        gl_FragColor = czm_packDepth(texture2D(depthTexture, v_textureCoordinates).r);\n    }";
    this.init();
  }
  init() {
    this.createTexture();
    this.createFramebuffer();
    this.clear();
    this.isDestroyStatus = false;
  }

  //创建纹理
  createTexture() {
    //颜色纹理
    this.colorTexture = new Cesium.Texture({
      context: this.context,
      width: this.width,
      height: this.height,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE
    });
    //深度模版纹理
    this.depthStencilTexture = new Cesium.Texture({
      context: this.context,
      width: this.width,
      height: this.height,
      pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8,
      sampler: new Cesium.Sampler({
        wrapS: Cesium.TextureWrap.CLAMP_TO_EDGE,
        wrapT: Cesium.TextureWrap.CLAMP_TO_EDGE,
        minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
        magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
      })
    });
    //_深度纹理
    this._depthTexture = new Cesium.Texture({
      context: this.context,
      width: this.width,
      height: this.height,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
      sampler: new Cesium.Sampler({
        wrapS: Cesium.TextureWrap.CLAMP_TO_EDGE,
        wrapT: Cesium.TextureWrap.CLAMP_TO_EDGE,
        minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
        magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
      })
    });
  }
  //创建缓冲器
  createFramebuffer() {
    this.frameBuffer = new Cesium.Framebuffer({
      context: this.context,
      colorTextures: [this.colorTexture],
      depthStencilTexture: this.depthStencilTexture,
      destroyAttachments: !1
    });
    this._copyDepthFramebuffer = new Cesium.Framebuffer({
      context: this.context,
      colorTextures: [this._depthTexture],
      destroyAttachments: !1
    });
    this.passState = new Cesium.PassState(this.context);
    this.passState.framebuffer = this.frameBuffer;
    this.passState.viewport = new Cesium.BoundingRectangle(0, 0, this.width, this.height);
    this.depthPassState = new Cesium.PassState(this.context);
    this.depthPassState.framebuffer = this._copyDepthFramebuffer;
    this.depthPassState.viewport = new Cesium.BoundingRectangle(0, 0, this.width, this.height);
  }
  //清除
  clear() {
    this.clearCommand = new Cesium.ClearCommand({
      depth: 1,
      color: new Cesium.Color(1, 1, 1, 0)
    });
    this.clearPassState = new Cesium.PassState(this.context);
    this.clearCommand.framebuffer = this.frameBuffer;
  }

  //修改命令
  updateCommand() {
    this.clearCommand.execute(this.context, this.clearPassState),
      this.updateCustomCamera(),
      this.uniformState.updateCamera(this.camera);
    for (
      var frustumCommandsList = this.scene._view.frustumCommandsList,
        frustumCommandsListLength = frustumCommandsList.length,
        commands = void 0,
        itemIndices = void 0,
        oldIndex = void 0,
        PassArr = [Cesium.Pass.ENVIRONMENT, Cesium.Pass.GLOBE, Cesium.Pass.CESIUM_3D_TILE],
        s = 0;
      s < frustumCommandsListLength;
      ++s
    ) {
      var l = frustumCommandsListLength - s - 1;
      var item = frustumCommandsList[l];
      this.uniformState.updateFrustum(this.camera.frustum);
      for (var h = 0; h < PassArr.length; h++) {
        var arrItem = PassArr[h];
        for (
          this.uniformState.updatePass(arrItem),
            commands = item.commands[arrItem],
            itemIndices = item.indices[arrItem],
            oldIndex = 0;
          oldIndex < itemIndices;
          ++oldIndex
        ) {
          commands[oldIndex]._framebuffer;
          commands[oldIndex].execute(this.context, this.passState);
        }
      }
    }
    var fromCache = Cesium.RenderState.fromCache({
      viewport: new Cesium.BoundingRectangle(0, 0, this.width, this.height)
    });
    var overlay = Cesium.Pass.OVERLAY;
    var that = this;
    that.drawDepthCommand = that.context.createViewportQuadCommand(that.fragmentShader, {
      renderState: fromCache,
      uniformMap: {
        depthTexture: function() {
          return that.frameBuffer.depthStencilTexture;
        }
      },
      pass: overlay,
      framebuffer: this._copyDepthFramebuffer,
      primitiveType: Cesium.PrimitiveType.TRIANGLES
    });
    this.drawDepthCommand.execute(this.context, this.depthPassState);
  }

  //更新自定义相机
  updateCustomCamera() {
    var that = this;
    var scene = this.scene;
    var heading = void 0;
    var pitch = void 0;
    var roll = void 0;
    var fov = void 0;
    var position = void 0;
    if (!this.customCamera) {
      this.customCamera = new Cesium.Camera(scene);
      this.customCamera = Cesium.Camera.clone(scene.camera, this.customCamera);
      this.customCamera.frustum.near = 1;
      this.customCamera.frustum.far = that._radius;
      if (Cesium.defined(this._viewPosition)) {
        position = this._viewPosition;
      } else {
        position = scene.camera.position;
      }
      if (Cesium.defined(this._heading)) {
        heading = this._heading;
      } else {
        heading = scene.camera.heading;
      }
      if (Cesium.defined(this._pitch)) {
        pitch = this._pitch;
      } else {
        pitch = scene.camera.pitch;
      }
      if (Cesium.defined(this._roll)) {
        roll = this._roll;
      } else {
        roll = scene.camera.roll;
      }
      if (Cesium.defined(this._fov)) {
        fov = this._fov;
      } else {
        fov = scene.camera.frustum.fov;
      }
      this.customCamera.frustum.fov = fov;
      this.customCamera.setView({
        destination: position,
        orientation: {
          heading: heading,
          pitch: pitch,
          roll: roll
        },
        convert: !1
      });
      this.camera = this.customCamera;
      var gpsPosition = new Cesium.Cartographic.fromCartesian(position);
      var lon = Cesium.Math.toDegrees(gpsPosition.longitude);
      var lat = Cesium.Math.toDegrees(gpsPosition.latitude);
      var height = gpsPosition.height;
      this.historyViewPosition = [lon, lat, height];
    }
  }

  //更新缓冲区
  updateBuffer() {
    var that = this;
    that.updateCommand();
    var width = this.width;
    var height = this.height;
    var readPixels = this.context.readPixels({
      x: this.passState.viewport.x,
      y: this.passState.viewport.y,
      width: width,
      height: height,
      framebuffer: that._copyDepthFramebuffer
    });
    var tempCartesian = new Cesium.Cartesian4(1, 1 / 255, 1 / 65025, 1 / 16581375);
    var contextUniformState = this.context.uniformState;
    var contextProjection =
      (contextUniformState.inverseProjection, contextUniformState.currentFrustum);
    var inverseProjectionX = contextProjection.x;
    var inverseProjectionY = contextProjection.y;
    var pointsArr = [];
    var newCartesian = new Cesium.Cartesian4();
    this.pixels = readPixels;
    for (
      var firsrtType = 0,
        pixelsLengthArr = new Uint8Array(readPixels.length),
        formBufferArr = {
          drawingBufferXArray: [],
          drawingBufferYArray: [],
          x: [],
          y: [],
          unpackDepthArray: []
        },
        p = 0;
      p < width;
      p++
    ) {
      firsrtType = true;
      for (var m = height; m > -1; m--) {
        var g = m * width * 4 + 4 * p;
        if (
          (pixelsLengthArr[g] = readPixels[g]),
          (pixelsLengthArr[g + 1] = readPixels[g + 1]),
          (pixelsLengthArr[g + 2] = readPixels[g + 2]),
          (pixelsLengthArr[g + 3] = readPixels[g + 3]),
          1 == firsrtType && readPixels[g] > 0) {
          formBufferArr.drawingBufferXArray.push(p),
            formBufferArr.drawingBufferYArray.push(m),
            formBufferArr.x.push(1 - p / width),
            formBufferArr.y.push(m / height),
            formBufferArr.unpackDepthArray.push(readPixels[g]);
          var unpack = Cesium.Cartesian4.unpack(readPixels, g, new Cesium.Cartesian4);
          Cesium.Cartesian4.divideByScalar(unpack, 255, unpack);
          var tempCartesianY = Cesium.Cartesian4.dot(unpack, tempCartesian)
            , UNIT_WClone = Cesium.Cartesian4.clone(Cesium.Cartesian4.UNIT_W, new Cesium.Cartesian4);
          UNIT_WClone.x = p / width * 2 - 1,
            UNIT_WClone.y = m / height * 2 - 1,
            UNIT_WClone.z = 2 * tempCartesianY - 1,
            UNIT_WClone.w = 1;
          var multiplyByVector, frustum = that.camera.frustum;
          if (Cesium.defined(frustum.fovy)) {
            multiplyByVector = Cesium.Matrix4.multiplyByVector(contextUniformState.inverseViewProjection, UNIT_WClone, new Cesium.Cartesian4);
            var multiplyByVectorEnt = 1 / multiplyByVector.w;
            Cesium.Cartesian3.multiplyByScalar(multiplyByVector, multiplyByVectorEnt, multiplyByVector)
          } else
            Cesium.defined(frustum._offCenterFrustum) && (frustum = frustum._offCenterFrustum),
              multiplyByVector = newCartesian,
              multiplyByVector.x = .5 * (UNIT_WClone.x * (frustum.right - frustum.left) + frustum.left + frustum.right),
              multiplyByVector.y = .5 * (UNIT_WClone.y * (frustum.top - frustum.bottom) + frustum.bottom + frustum.top),
              multiplyByVector.z = .5 * (UNIT_WClone.z * (inverseProjectionX - inverseProjectionY) - inverseProjectionX - inverseProjectionY),
              multiplyByVector.w = 1,
              multiplyByVector = Cesium.Matrix4.multiplyByVector(contextUniformState.inverseView, multiplyByVector, multiplyByVector);
          var multiplyByVectorCartesian4 = Cesium.Cartesian3.fromCartesian4(multiplyByVector, new Cesium.Cartesian3);
          pointsArr.push(multiplyByVectorCartesian4),
            firsrtType = false
        } else
          pixelsLengthArr[g + 3] = 0
      }
    }
    return this.data = formBufferArr,
      this.points = pointsArr,
      this.collinear(),
      formBufferArr;
  }

  //极限高度
  limitHeight() {
    Cesium.defined(this.points) || this.updateBuffer(),
      this.drawline && this.removeAlllimitHeights(),
      this.highlight = new Cesium.ClassificationPrimitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(this.points),
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
            extrudedHeight: 1e4,
            perPositionHeight: !0
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString("#F26419").withAlpha(.9)),
            show: new Cesium.ShowGeometryInstanceAttribute(!0)
          },
          id: "volume 1"
        }),
        classificationType: Cesium.ClassificationType.CESIUM_3D_TILE
      }),
      this.scene.primitives.add(this.highlight);
  }

  //是否准备好导出数据
  isReadyExportGeoData() {
    return !!this.geoObj;
  }

  //是否准备好导出czml数据
  isReadyExportCzmlData() {
    return !!this.czmlData;
  }

  //拾取天际线
  pickSkyLine(e) {
    var t = this
      , n = this;
    if (Cesium.defined(this.points) && Cesium.defined(this.degreeArray) || this.updateBuffer(),
      this.geoObj = {
        type: "Feature",
        properties: {
          camera: {
            position: this.scene.camera.position,
            heading: this.scene.camera.heading,
            pitch: this.scene.camera.pitch,
            roll: this.scene.camera.roll
          }
        },
        geometry: { 
          type: "LineString",
          coordinates: this.degreeArray
        }
      },
      e) {
      this.removeGeoJsonDataSource();
      Cesium.GeoJsonDataSource.load(this.geoObj, {
        stroke: n._lineColor,
        strokeWidth: n._lineWidth
      }).then(function (e) {
        t.geoJsonDataSource = e,
        t._viewer.dataSources.add(t.geoJsonDataSource)
      })
    } else {
      if (this.drawline) {
        this.removeAllLines()
      }
      this.drawline = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          id: 'polylineinstance',
          geometry: new Cesium.PolylineGeometry({
            positions: this.car3Array,
            width: this._lineWidth, //线宽
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(this._lineColor),//color  必须设置 不然没有效果
          }
        }),
        appearance: new Cesium.PolylineColorAppearance({
          translucent: false
        })
      });
      this.scene.primitives.add(this.drawline);
    }
  }

  //绘制
  drawHeightGeo(e) {
    var that = this,
      nthat = this;
    Cesium.defined(this.faceArray) || this.updateBuffer(),
      this.removeAllFaces(),
      this.removeCzmlJsonDataSource();
    var Color_i = [255 * this._faceColor.red, 255 * this._faceColor.green, 255 * this._faceColor.blue, 255 * this._faceColor.alpha]
      , color_r = [255 * this._faceOutlineColor.red, 255 * this._faceOutlineColor.green, 255 * this._faceOutlineColor.blue, 255 * this._faceOutlineColor.alpha]
      , concat = this.historyViewPosition.concat(this.faceArray);
    if (this.czmlData = [{
          id: "document",
          name: "CZML zIndex",
          version: "1.0"
        },
        {
          id: "orangePolygon",
          name: "Orange polygon with per-position heights and outline",
          polygon: {
            positions: {
              cartographicDegrees: concat
            },
            material: {
              solidColor: {
                color: {
                  rgba: Color_i
                }
              }
            },
            extrudedHeight: 0,
            perPositionHeight: !0,
            outline: !0,
            outlineColor: {
              rgba: color_r
            }
          }
        },
        {
          id: "myObject",
          properties: {
            camera: {
              position: this.scene.camera.position,
              heading: this.scene.camera.heading,
              pitch: this.scene.camera.pitch,
              roll: this.scene.camera.roll
            }
          }
        }],
      true !== e) {
      Cesium.CzmlDataSource.load(nthat.czmlData).then(function (e) {
        that.czmlJsonDataSource = e,
          nthat._viewer.dataSources.add(that.czmlJsonDataSource)
      })
    } else {
      this.drawFace = new Drawline({
        positions: this.points,
        scene: this.scene,
        type: "face",
        color: this._faceColor
      });
      this.scene.primitives.add(this.drawFace);
    }
  }

  //帧循环
  update() {
    //(Cesium.defined(this.drawline) || Cesium.defined(this.geoJsonDataSource) || Cesium.defined(this.geojsonDataSourceUrl)) && (this.isUpdateLineColor || this.isUpdateRadius) && (this.isUpdateRadius ? this.pickSkyLine() : (Cesium.defined(this.drawline) && (this.drawline.getGeometryInstanceAttributes('polylineinstance').color = Cesium.ColorGeometryInstanceAttribute.toValue(this._lineColor)),
    //  Cesium.defined(this.geoJsonDataSource) && (this.geoJsonDataSource.stroke = this._lineColor),
    //  Cesium.defined(this.geojsonDataSourceUrl) && (this.geojsonDataSourceUrl.stroke = this._lineColor))),
    //  Cesium.defined(this.drawFace) && (this.isUpdateFaceColor || this.isUpdateRadius) && (this.isUpdateRadius ? this.drawHeightGeo() : this.drawFace.color = this._faceColor),
    //  this.isUpdateRadius = !1
    (Cesium.defined(this.drawline) || Cesium.defined(this.geoJsonDataSource) || Cesium.defined(this.geojsonDataSourceUrl)) && (this.isUpdateLineColor || this.isUpdateRadius) && (this.isUpdateRadius ? this.pickSkyLine() : (Cesium.defined(this.drawline) && (this.drawline.getGeometryInstanceAttributes('polylineinstance').color = Cesium.ColorGeometryInstanceAttribute.toValue(this._lineColor)),
      Cesium.defined(this.geoJsonDataSource) && (this.geoJsonDataSource.stroke = this._lineColor),
      Cesium.defined(this.geojsonDataSourceUrl) && (this.geojsonDataSourceUrl.stroke = this._lineColor)));
    Cesium.defined(this.drawFace) && (this.isUpdateFaceColor || this.isUpdateRadius) && (this.isUpdateRadius ? this.drawHeightGeo() : this.drawFace.color = this._faceColor);
    this.isUpdateRadius = false;

  }

  //销毁纹理
  _destroyTexture() {
    this.colorTexture = this.colorTexture && !this.colorTexture.isDestroyed() && this.colorTexture.destroy(),
      this.depthStencilTexture = this.depthStencilTexture && !this.depthStencilTexture.isDestroyed() && this.depthStencilTexture.destroy()
  }

  //销毁缓冲区
  _destroyFrameBuffer() {
    this.framebuffer = this.framebuffer && !this.framebuffer.isDestroyed() && this.framebuffer.destroy()
  }

  //获取销毁状态
  isDestroyed() {
    return this.isDestroyStatus;
  }

  //销毁所有绘制的线段
  removeAllLines() {
    Cesium.defined(this.drawline) && (this.scene.primitives.remove(this.drawline),
      this.drawline = void 0)
  }

  //删除GeoJson数据源
  removeGeoJsonDataSource() {
    Cesium.defined(this.geojsonDataSourceUrl) && (this._viewer.dataSources.remove(this.geojsonDataSourceUrl),
      this.geojsonDataSourceUrl = void 0),
      Cesium.defined(this.geoJsonDataSource) && (this._viewer.dataSources.remove(this.geoJsonDataSource),
        this.geoJsonDataSource = void 0)
  }

  removeCzmlJsonDataSource() {
    Cesium.defined(this.czmlJsonUrlDataSource) && (this._viewer.dataSources.remove(this.czmlJsonUrlDataSource),
      this.czmlJsonUrlDataSource = void 0),
      Cesium.defined(this.czmlJsonDataSource) && (this._viewer.dataSources.remove(this.czmlJsonDataSource),
        this.czmlJsonDataSource = void 0)
  }

  removeAlllimitHeights() {
    Cesium.defined(this.highlight) && (this.scene.primitives.remove(this.highlight),
      this.highlight = void 0)
  }
  removeAllFaces() {
    Cesium.defined(this.drawFace) && (this.scene.primitives.remove(this.drawFace),
      this.drawFace = void 0)
  }

  remove() {
    this.removeAlllimitHeights(),
      this.removeAllFaces(),
      this.removeAllLines(),
      this.removeGeoJsonDataSource(),
      this.removeCzmlJsonDataSource()
  }

  removeHeightGeo() {
    this.removeAlllimitHeights(), this.removeAllFaces(), this.removeGeoJsonDataSource(), this.removeCzmlJsonDataSource();
  }

  _destroy() {
    this._destroyTexture(),
      this._destroyFrameBuffer(),
      Cesium.defined(this.drawDepthCommand) && (this.drawDepthCommand.shaderProgram && this.drawDepthCommand.shaderProgram.destroy(),
        this.drawDepthCommand = void 0),
      this.remove(),
      this.isDestroyStatus = !0
  }

  destroy() {
    return this._destroy(),
      Cesium.destroyObject(this)
  }

  makeUpLineGeojson(e) {
    if (this.geoObj) {
      this.content = JSON.stringify(this.geoObj);
      this.fileName = e || "skylineAnliles";
      this.makeUpGeojsonFile();
    } else {
      console.error("请先提取天际线数据");
    }
    //this.geoObj ? (this.content = (0,
    //  l.default)(this.geoObj, null, 2),
    //  this.fileName = e || "skylineAnliles",
    //  this.makeUpGeojsonFile()) : console.error("请先提取天际线数据")
  }

  makeUpGeojsonFile() {
    var domlink = document.createElement("a");
    domlink.download = this.fileName;
    var t = new Blob([this.content], {
      type: "application/json"
    });
    domlink.href = URL.createObjectURL(t);
    document.body.appendChild(domlink);
    domlink.click();
    document.body.removeChild(domlink);
  }

  loadLines() {
    var o = this;
    this.remove();
    var a = this;
    if (e)
      if (1 == t) {
        var s = Cesium.GeoJsonDataSource.load(e, {
          stroke: Cesium.defined(i) ? i : Cesium.Color.RED,
          strokeWidth: Cesium.defined(r) ? r : 2
        });
        s.then(function (e) {
          o.geojsonDataSourceUrl = e,
            o._viewer.dataSources.add(o.geojsonDataSourceUrl)
        }),
          Cesium.loadJson(e).then(function (e) {
            e.properties && e.properties.camera && n(e.properties.camera)
          }).otherwise(function (e) {
            console.error(e)
          })
      } else
        Cesium.loadJson(e).then(function (e) {
          if (e && e.geometry && e.geometry.coordinates.length > 0) {
            var t = e.geometry.coordinates.flat()
              , r = Cesium.Cartesian3.fromDegreesArrayHeights(t);
            a._lineColor;
            i && i,
              a.drawline = new Drawline({
                positions: r,
                scene: a.scene,
                type: "line",
                color: a._lineColor
              }),
              a.scene.primitives.add(a.drawline)
          } else
            console.error("geo数据不正常");
          e.properties && e.properties.camera && n(e.properties.camera)
        }).otherwise(function (e) {
          console.error(e)
        });
    else
      console.error("路径错误")
  }

  makeupgeoface(e) {
    if (!this.czmlData)
      return void console.error("请先绘制限高体");
    this.content = JSON.stringify(this.czmlData);
    this.fileName = e || "skyfaceAnliles";
      this.makeUpGeojsonFile()
  }

  loadFaces() {
    var that = this;
    if (this.remove(),
      e) {
      Cesium.CzmlDataSource.load(e).then(function (e) {
        that.czmlJsonUrlDataSource = e,
          that._viewer.dataSources.add(that.czmlJsonUrlDataSource)
      }).then(function () {
        Cesium.loadJson(e).then(function (e) {
          var n = e.filter(function (e) {
            return "myObject" == e.id
          });
          n.length > 0 && t(n[0].properties.camera)
        })
      })
    } else
      console.error("路径错误")
  }

  collinear() {
    for (var e = [this.points[0]], t = [], n = [], i = [], r = 0, o = 1; o < this.points.length - 1; o++) {
      var a = this.points[o - 1]
        , s = this.points[o]
        , l = this.points[o + 1]
        , u = Cesium.Cartesian3.subtract(s, a, new Cesium.Cartesian3)
        , h = Cesium.Cartesian3.subtract(l, s, new Cesium.Cartesian3)
        , c = Cesium.Cartesian3.cross(u, h, new Cesium.Cartesian3)
        , d = Cesium.Cartesian3.magnitude(c)
        , f = Cesium.Cartesian3.magnitude(u)
        , p = Cesium.Cartesian3.magnitude(h)
        , m = d / (f * p);
      if (Math.abs(m) > 0.3) {
        var g = new Cesium.Cartographic.fromCartesian(this.points[o])
          , v = Cesium.Math.toDegrees(g.longitude)
          , y = Cesium.Math.toDegrees(g.latitude)
          , _ = g.height;
        t.push([v, y, _]),
          n.push(this.points[o]),
          i.push(v, y, _),
          e.push(this.points[o]),
          r++
      }
    }
    this.degreeArray = t,
      this.car3Array = n,
      this.faceArray = i
  }

  //========== 对外属性 ==========
  get viewer() {
    return this._viewer;
  }
  set viewer(val) {
    if (val) {
      this._viewer = val;
    }
  }

  get lineColor() {
    return this._lineColor;
  }
  set lineColor(val) {
    if (val) {
      this._lineColor = val;
      this.isUpdateLineColor = true;
      this.update();
    }
  }

  get lineWidth() {
    return this._lineWidth;
  }
  set lineWidth(val) {
    if (val) {
      this._lineWidth = val;

      if (this.drawline) {
        this.removeAllLines();
      }
      this.drawline = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          id: 'polylineinstance',
          geometry: new Cesium.PolylineGeometry({
            positions: this.car3Array,
            width: this._lineWidth, //线宽
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(this._lineColor) //color  必须设置 不然没有效果
          }
        }),
        appearance: new Cesium.PolylineColorAppearance({
          translucent: false
        })
      });
      this.scene.primitives.add(this.drawline);
    }
  }

  get faceColor() {
    return this._faceColor;
  }
  set faceColor(val) {
    if (val) {
      this._faceColor = val;
      this.isUpdateFaceColor = true;
      this.drawHeightGeo();
    }
  }

  get faceOutlineColor() {
    return this._faceOutlineColor;
  }
  set faceOutlineColor(val) {
    if (val) {
      this._faceOutlineColor = val;
      this.isUpdateFaceColor = true;
      this.drawHeightGeo();
    }
  }

  get radius() {
    return this._radius;
  }
  set radius(val) {
    if (val) {
      this._radius = Number(val);
      this.isUpdateRadius = true;
      this.update();
    }
  }

  get viewPosition() {
    return this._viewPosition;
  }
  set viewPosition(val) {
    if (val) {
      this._viewPosition = val;
    }
  }

  get heading() {
    return this._heading;
  }
  set heading(val) {
    if (val) {
      this._heading = val;
    }
  }

  get pitch() {
    return this._pitch;
  }
  set pitch(val) {
    if (val) {
      this._pitch = val;
    }
  }

  get roll() {
    return this._roll;
  }
  set roll(val) {
    if (val) {
      this._roll = val;
    }
  }

  get fov() {
    return this._fov;
  }
  set fov(val) {
    if (val) {
      this._fov = val;
    }
  }
}
