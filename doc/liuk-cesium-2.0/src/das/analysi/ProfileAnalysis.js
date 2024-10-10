/*剖面分析*/
import * as Cesium from "cesium";
import {DasClass, eventType} from "../core/DasClass";
import {Draw} from "../draw/Draw";
//剖面分析 类
export class ProfileAnalysis extends DasClass {
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    if (!Cesium.defined(options.viewer)) {
      throw new Cesium.DeveloperError("options.viewer is required.");
    }
    this._positions = Cesium.defaultValue(options.elevation, []);
    this._viewer = options.viewer;
    this._scene = this._viewer.scene;
    this._height = Cesium.defaultValue(options.height, options.viewer.scene.drawingBufferWidth * 0.8);
    this._width = Cesium.defaultValue(options.width, options.viewer.scene.drawingBufferWidth);
    this._frustumH = Cesium.defaultValue(options.frustumH, 100);
    this._extendWidth = Cesium.defaultValue(options.extendWidth, 0.1);
    this._context = this._scene.context;
    this.uniformState = this._context.uniformState;
    this._isShowDown = Cesium.defaultValue(options.isShowDown, !1);
    this.customCamera = null;
    this._angle = Cesium.defaultValue(options.angle, 30);
    this._angleHeight = Cesium.defaultValue(options.angleHeight, 10);
    this._elevation = options.elevation;
    this.initialize();
  }
  initialize() {
    this._createTexture();
    this._createFramebuffer();
    this._clear();
    this.updateBuffer();
  }

  _createTexture() {
    this.colorTexture = new Cesium.Texture({
      context: this._context,
      width: this._width,
      height: this._height,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
      sampler: new Cesium.Sampler({
        minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
        magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
      })
    });
    this.depthStencilTexture = new Cesium.Texture({
      context: this._context,
      width: this._width,
      height: this._height,
      pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8,
      sampler: new Cesium.Sampler({
        minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
        magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
      })
    });
  }
  _createFramebuffer() {
    this.frameBuffer = new Cesium.Framebuffer({
      context: this._context,
      colorTextures: [this.colorTexture],
      depthStencilTexture: this.depthStencilTexture,
      destroyAttachments: false
    });
    this.passState = new Cesium.PassState(this._context);
    this.passState.framebuffer = this.frameBuffer;
    this.passState.viewport = new Cesium.BoundingRectangle(0, 0, this.width, this.height);
  }
  _destroyTexture() {
    this.colorTexture = this.colorTexture;
    if (!this.colorTexture.isDestroyed()) {
      this.colorTexture.destroy();
    }
    this.depthStencilTexture = this.depthStencilTexture;
    if (!this.depthStencilTexture.isDestroyed()) {
      this.depthStencilTexture.destroy();
    }
  }
  _destroyFrameBuffer() {
    if (!this.frameBuffer.isDestroyed()) {
      this.frameBuffer.destroy();
    }
  }
  _clear() {
    this.clearCommand = new Cesium.ClearCommand({
      depth: 1,
      color: new Cesium.Color(1, 1, 1, 0)
    });
    this.clearPassState = new Cesium.PassState(this._context);
    this.clearCommand.framebuffer = this.frameBuffer;
  }
  _newCommand() {
    this.clearCommand.execute(this._context, this.clearPassState);
    this._computeCameraCP();
    this._updateCustomCamera();
    this.uniformState.updateCamera(this.camera);
    this.passState.viewport = new Cesium.BoundingRectangle(0, 0, this.width, this.height);
    var renderState = new Cesium.RenderState;
    renderState.depthTest.enabled = true;
    renderState.cull.enabled = false;
    for (var frustumCommandsList = this._scene._view.frustumCommandsList, frustumCommandsIndex = frustumCommandsList.length, commandsItem = void 0, indicesItem = void 0, indicesItemIndex = void 0, tiles = [Cesium.Pass.CESIUM_3D_TILE], s = 0; s < frustumCommandsIndex; ++s) {
      var l = frustumCommandsIndex - s - 1
        , u = frustumCommandsList[l];
      this.uniformState.updateFrustum(this.camera.frustum);
      for (var h = 0; h < tiles.length; h++)
        for (this.uniformState.updatePass(tiles[h]),
          commandsItem = u.commands[tiles[h]],
          indicesItem = u.indices[tiles[h]],
          indicesItemIndex = 0; indicesItemIndex < indicesItem; ++indicesItemIndex) {
          commandsItem[indicesItemIndex]._framebuffer;
          commandsItem[indicesItemIndex].renderState = renderState;
          commandsItem[indicesItemIndex].execute(this._context, this.passState);
        }
    }
  }
  _computeCameraCP() {
    this.bs = Cesium.Cartesian3.add(this._positions[0], this._positions[1], new Cesium.Cartesian3);
    var Scalar = Cesium.Cartesian3.divideByScalar(this.bs, 2, new Cesium.Cartesian3)
      , t = Cesium.Cartesian3.distance(this._positions[0], this._positions[1]);
    this._frustumW = t / 2,
      this._offsetPos = Math.abs(Math.tan(this._angle * Math.PI / 180) * t / 2),
      this._offsetPos = this._offsetPos > 20 ? this._offsetPos : 20,
      this._offsetHeight = Math.abs(Math.tan(this._angleHeight * Math.PI / 180) * this._offsetPos / 2),
      this.boundingCP = Scalar
  }
  _updateCustomCamera() {
    var scene = this._scene;
    if (!this.customCamera) {
      this.customCamera = new Cesium.Camera(scene);
    }
    this._cartographic = Cesium.Cartographic.fromCartesian(this.boundingCP);
    this._perspectiveOffCenterFrustum();
     
  }
  _perspectiveOffCenterFrustum() {
    this.customCamera.frustum = new Cesium.PerspectiveOffCenterFrustum;
    this.customCamera.frustum.near = this._offsetPos - this._extendWidth / 2;
    this.customCamera.frustum.far = this._offsetPos + this._extendWidth / 2;
    this.customCamera.frustum.left = -this._frustumW;

    var startPointHeight = das3d.point.formatPosition(this._positions[0]).z;
    var endPointHeight = das3d.point.formatPosition(this._positions[1]).z;
    var offset = startPointHeight > endPointHeight ? endPointHeight : startPointHeight;

    if (this._isShowDown) {
      this.customCamera.frustum.top = this._offsetHeight - this._frustumH;
      this.customCamera.frustum.bottom = this._offsetHeight + this._frustumH;
    } else {
      this.customCamera.frustum.bottom = this._offsetHeight;
      this.customCamera.frustum.top = this._frustumH + this._offsetHeight + offset;
    }
    this.customCamera.frustum.right = this._frustumW;
    this.customCamera.direction = this.cameraDir;
    this.customCamera.up = this.cameraUp;
    this.customCamera.right = this.cameraRight;
    var point = Cesium.Cartesian3.fromRadians(this._cartographic.longitude, this._cartographic.latitude, this._offsetHeight);
    var multiply = Cesium.Cartesian3.multiplyByScalar(this.cameraDir, this._offsetPos, new Cesium.Cartesian3);
    Cesium.Cartesian3.subtract(point, multiply, point);
    this.customCamera.position = point;
    this.camera = this.customCamera;
  }
  _getBuffer() {
    var context = this._context;
    var width = this.width;
    var height = this.height;
    var pixels = context.readPixels({
      x: this.passState.viewport.x,
      y: this.passState.viewport.y,
      width: width,
      height: height,
      framebuffer: this.frameBuffer
    });
    var pointsArr = [];
    this._data = {
        x: [],
        y: [],
        xys: [],
        xysAll: [],
        pixels: []
      };
    for (var pixel = 0; pixel < pixels.length; pixel += 4) {
      var a = pixels[pixel];
      var s = pixels[pixel + 1];
      var l = pixels[pixel + 2];
      var u = pixels[pixel + 3];
      var h = pixel / 4 % width;
      var c = Math.floor(pixel / (4 * width));
      var d = new Cesium.Cartesian2(h, c);
      if (u > 0) {
        pointsArr.push(0, 255, 255, u);
        this._data.pixels.push([a, s, l, u]);
        this._data.xys.push(d);
      } else {
        pointsArr.push(a, s, l, u);
        this._data.xysAll.push(d);
      }
    }
    var worldPoints = this.computeWorldPositions(this._data.xys);
    this.worldPoints = this._filterWorldPoints(worldPoints);
  }

  /**
   * 过滤结果点
   * @private
   */
  _filterWorldPoints(arr) {
    var arrDegree = this._toDegrees(arr);
    var drawPoints = this._filterByXYZ(arrDegree);

    // 位置不对，直接返回
    if (drawPoints.drawPoints && drawPoints.drawPoints.length == 0) {
      return []
    }

    return this._concatStartAndEnd(drawPoints.drawPoints, drawPoints.arrMinZ);   // 第四步：前后各加一个点，高度为arrMinZ
  }

  /**
   * 将原始点转成经纬度
   * @param arr
   * @private
   */
  _toDegrees(arr) {
    return arr.map(function (item) {
      // 先把坐标转成经纬度，相同经纬度的点取高度最高的那个点
      var cartesian3 = new Cesium.Cartesian3(item.x, item.y, item.z);
      var carto = Cesium.Cartographic.fromCartesian(cartesian3);

      var x = Math.floor(Cesium.Math.toDegrees(carto.longitude) * 10000000) / 10000000;
      var y = Math.floor(Cesium.Math.toDegrees(carto.latitude) * 10000000) / 10000000;
      var z = Math.floor(carto.height * 100000000) / 100000000;

      return { x, y, z }
    });
  }

  /**
   * 过滤结果点
   * @param arr
   * @private
   */
  _filterByXYZ(arrDegree) {
    var tempData = {};
    var arrMinZ = 10000;
    for (var i = 0, len = arrDegree.length; i < len; i++) {
      var item = arrDegree[i];
      var keyName = item.x + "_" + item.y;
      var height = item.z;
      arrMinZ = arrMinZ > height ? height : arrMinZ
      if (!tempData[keyName]) {
        tempData[keyName] = height
      } else {
        tempData[keyName] = tempData[keyName] > height ? tempData[keyName] : height;
      }
    }
    var tempArr = [];
    for (var m in tempData) {
      var pointItem = m.split("_");
      tempArr.push({
        "x": Number(pointItem[0]),
        "y": Number(pointItem[1]),
        "z": tempData[m]
      })
    }
    function sortNumber(a, b) {
      return (a.x*a.y)-(b.x*b.y)
    }
    tempArr.sort(sortNumber)

    return {
      drawPoints: tempArr,
      arrMinZ: arrMinZ
    };
  }

  /**
   * 首尾加一个点
   * @param directionPoints
   * @private
   */
  _concatStartAndEnd(drawPointsSort, arrMinZ) {
    var len = drawPointsSort.length - 1;
    var resultPoints = [{
      x: drawPointsSort[0].x,
      y: drawPointsSort[0].y,
      z: arrMinZ
    }].concat(drawPointsSort).concat([{
      x: drawPointsSort[len].x,
      y: drawPointsSort[len].y,
      z: arrMinZ
    }]);

    return resultPoints;
  }

  _computerDirction() {
    if (this._positions.length >= 2) {
      var statePoint = this._elevation[0];
      var endPoint = this._elevation[1];
      var centerHeight = Math.abs((statePoint.height + endPoint.height) / 2);
      var stateCenterPoint = Cesium.Cartesian3.fromDegrees(
        statePoint.longitude,
        statePoint.latitude,
        centerHeight
      );
      var stateBottomPoint = Cesium.Cartesian3.fromDegrees(
        statePoint.longitude,
        statePoint.latitude,
        0
      );
      var endCenterPoint = Cesium.Cartesian3.fromDegrees(endPoint.longitude,
        endPoint.latitude,
        centerHeight
      );
      var stateDvalue = Cesium.Cartesian3.subtract(
        stateCenterPoint,
        stateBottomPoint,
        new Cesium.Cartesian3()
      );
      var wholeDvalue = Cesium.Cartesian3.subtract(
        stateCenterPoint,
        endCenterPoint,
        new Cesium.Cartesian3()
      );
      var sctDvalue = Cesium.Cartesian3.cross(wholeDvalue, stateDvalue, new Cesium.Cartesian3());
      var normalsctPoint = Cesium.Cartesian3.normalize(sctDvalue, new Cesium.Cartesian3());
      var normalStartPoint = Cesium.Cartesian3.normalize(stateDvalue, new Cesium.Cartesian3());
      var normalWholePoint = Cesium.Cartesian3.normalize(wholeDvalue, new Cesium.Cartesian3());
      this.cameraDir = normalsctPoint;
      this.cameraUp = normalStartPoint;
      this.cameraRight = normalWholePoint;
      this._newCommand();
      this._getBuffer();
    }
  }

  updateBuffer() {
    var positionArr = [];
    return this._elevation.forEach(function (t) {
      positionArr.push((t[0] || t.longitude), (t[1] || t.latitude), (t[2] || t.height));
    }),
      this._positions = Cesium.Cartesian3.fromDegreesArrayHeights(positionArr),
      this._computerDirction();
  }
  computeWorldPositions(dataXys) {
    for (var t = this._data.xys.length, n = (this.customCamera.frustum.near,
      this.customCamera.frustum.far,
      this.uniformState), VectorMultiplyArr = [], width = this.width, height = this.height, a = 0; a < t; a++) {
      var tempPoint = new Cesium.Cartesian4();
      tempPoint.x = dataXys[a].x / width * 2 - 1;
      tempPoint.y = dataXys[a].y / height * 2 - 1;
      tempPoint.z = 2;
      tempPoint.w = 1;
      var multiply = Cesium.Matrix4.multiply(this.customCamera.inverseViewMatrix, n.inverseProjection, new Cesium.Matrix4());
      var VectorMultiply = Cesium.Matrix4.multiplyByVector(multiply, tempPoint, new Cesium.Cartesian4());
      var VectorMultiplyW = 1 / VectorMultiply.w;
      Cesium.Cartesian3.multiplyByScalar(VectorMultiply, VectorMultiplyW, VectorMultiply);
      VectorMultiplyArr.push(VectorMultiply);
    }
    return VectorMultiplyArr;
  }
  clearBuffer() {
    return new Uint8ClampedArray(0);
  }
  destroy() {
    return this._destroyTexture(),
      this._destroyFrameBuffer(),
      Cesium.destroyObject(this)
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

  get elevation() {
    return this._positions;
  }
  set elevation(val) {
    if (val) {
      this._elevation = val;
    }
  }

  get height() {
    return this._height;
  }
  set height(val) {
    if (this._height) {
      this._height = val;
    }
  }

  get width() {
    return this._width;
  }
  set width(val) {
    if (this._width) {
      this._width = val;
    }
  }

  get frustumH() {
    return this._frustumH;
  }
  set frustumH(val) {
    if (val) {
      this._frustumH = val;
    }
  }

  get extendWidth() {
    return this._extendWidth;
  }
  set extendWidth(val) {
    if (val) {
      this._extendWidth = val;
    }
  }

  get type() {
    return "profileAnalysis";
  }
}
