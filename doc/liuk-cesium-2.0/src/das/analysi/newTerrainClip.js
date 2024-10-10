import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
import { PitPrimitive } from "./core/PitPrimitive";

//地形开挖 类 (基于地形)
export class newTerrainClip extends DasClass {
  //========== 构造方法 ==========
  /**
   * TerrainClip地形挖掘
   * @param options
   */
  constructor(options) {
    super(options);
    // this.options = options;
    this.viewer = options.viewer || null;
    this._areaList = [],
      this.totalCenter = null,
      this.trans = undefined,
      this.inverTrans = undefined,
      this.ratio = 0,
      this.totalRect = [],
      this.ortCamera = {};
    this._show = true;
    this.options = {
      diffHeight: options.diffHeight || 50, //井的深度
      image: options.image || './img/textures/excavate_side_min.jpg',
      imageBottom: options.imageBottom || './img/textures/excavate_bottom_min.jpg',
      splitNum: options.splitNum || 80, //井边界插值数
    }
    // this.viewer.scene.globe.depthTestAgainstTerrain = true;//开启深度检查
    this.floodVar = [0, 0, 0, 500];
    this._areaList = [];
    this._canvasWidth = 2048;
    this._clipOutSide = false;
    this.graphic = [];
    this._enabled = true;
    // this._addedHook(this.options);
  }


  get clipOutSide() {
    var _0x12654e;
    return null === (_0x12654e = this.terrainEditCtl) || void 0x0 === _0x12654e ? void 0x0 :
      _0x12654e.showTailorOnly;
  }
  set clipOutSide(_0x702e3d) {
    this.terrainEditCtl.showTailorOnly = _0x702e3d;
  }
  //创建地形开挖
  addArea(_coordinate, height) {
    var coordinate = _coordinate;
    if (coordinate.length < 3) {
      return
    }
    var options = {
      positions_original: coordinate,
      positions: this.toCartesians(coordinate), //Cartesian3
      show: true
    }
    this.options.diffHeight = height || 50;
    return this.terrainEditCtl = this.viewer.scene.globe._surface.tileProvider.excavateAnalysis,
      // this.terrainEditCtl = {
      //     enableTailor: false,
      //     excavateHeight: 0,
      //     excavateMinHeight: 9999,
      //     excavatePerPoint: false,
      //     inverTailorCenterMat: false,
      //     showElseArea: true,
      //     showTailorOnly: false,
      //     splitNum: 30,
      //     tailorArea: undefined,
      //     tailorRect: new Cesium.Cartesian4()
      // },
      this._areaList.push(options),
      this.computedCenter(),
      this._prepareFlood(),
      this.prepareCamera(),
      this.prepareFBO(),
      this.drawPolygon(),
      this.beginTailor(),
      this._addAreaHook(options, height),
      options;
  }

  toCartesians(coordinate) {
    return das3d.pointconvert.lonlats2cartesians(coordinate);
    // if (!Array.isArray(coordinate))
    //     return coordinate;
    // var _0x17eb8d = [];
    // return coordinate.forEach(function(d) {
    //     var _0xc3ba94 = _0x427e95['a'].parse(d);
    //     _0xc3ba94 && _0x17eb8d['push'](_0xc3ba94['toCartesian'](true));
    // }),
    // _0x17eb8d;
  }

  _enabledHook(boolea) { //是否挖地
    this.viewer.scene.globe._surface.tileProvider.applyTailor = boolea,
      this.terrainEditCtl.enableTailor = boolea,
      // this._graphicLayer && (this._graphicLayer.show = boolea),
      this.viewer.scene.globe.material = boolea ? Cesium.Material.fromType("WaJue") : null;
  }
  enabled(boolea) {
    this._show != boolea && (this.options.show = boolea,
      this._show = boolea,
      // this.layer && (Array.isArray(this.layer) ? this.layer.forEach(function(_0x4409ff) {
      //     _0x4409ff.show = boolea;
      // }) : this.layer.show = boolea),
      // this.isAdded && 
      (this._showHook && this._showHook(boolea)))
    // boolea ? this.fire("show", {
    //     'layer': this
    // }) : this.fire("hide", {
    //     'layer': this
    // })));
  }
  _showHook(boolea) {
    for (var i = 0; i < this.graphic.length; i++) {
      this.graphic[i].primitiveCollection.show = boolea;
    }
  }
  // _addedHook() {
  //     this.viewer.scene.highDynamicRange || (this.viewer.scene.highDynamicRange = true,
  //     this._hasChangeHighDynamicRange = true),
  //     this.viewer.scene.globe.depthTestAgainstTerrain || (this.viewer.scene.globe.depthTestAgainstTerrain = true,
  //     this._hasChangeDepthTestAgainstTerrain = true),
  //     this._graphicLayer = new GraphicLayer(this.options),
  //     this.viewer.addLayer(this._graphicLayer),
  //     this.terrainEditCtl.showElseArea = Cesium.defaultValue(this.options.showElseArea, !0x0)
  //     // this.options.positions && this.addArea(this.options.positions);
  //     // _0xf98977()(_0x1e778c()(_0x2ba465.prototype), "_addedHook", this).call(this);
  // }
  // _removedHook() {
  //     this.clear(),
  //     this.tailorTex && this.tailorTex.destroy && this.tailorTex.destroy(),
  //     this.yanmoFbo = null,
  //     this.viewer.scene.globe._surface.tileProvider.applyTailor = false,
  //     this.terrainEditCtl.enableTailor = false,
  //     this.terrainEditCtl.inverTailorCenterMat = Cesium.Matrix4.IDENTITY,
  //     this.terrainEditCtl.tailorArea = undefined,
  //     this.viewer.removeLayer(this._graphicLayer),
  //     delete this._graphicLayer,
  //     this._hasChangeHighDynamicRange && (this.viewer.scene.highDynamicRange = false,
  //     this._hasChangeHighDynamicRange = false),
  //     this._hasChangeDepthTestAgainstTerrain && (this.viewer.scene.globe.depthTestAgainstTerrain = false,
  //     this._hasChangeDepthTestAgainstTerrain = false);
  // }
  computedCenter() {
    var that = this,
      Cartesian3_0 = new Cesium.Cartesian3();
    that._areaList.forEach(function (data) {
      var positions = data.positions;
      if (positions) {
        //创建面
        var polygon = new Cesium.PolygonGeometry({
            'polygonHierarchy': new Cesium.PolygonHierarchy(positions)
          })
          //中心点（Cartesian3）
          ,
          center = (polygon = Cesium.PolygonGeometry.createGeometry(polygon)).boundingSphere
          .center;
        Cesium.Cartesian3.add(Cartesian3_0, center, Cartesian3_0);
      }
      //Cartesian3
      that.totalCenter = Cesium.Cartesian3.multiplyByScalar(Cartesian3_0, 1 / that._areaList
        .length, new Cesium.Cartesian3());
    })

  }

  _prepareFlood() {
    var that = this,
      context = this.viewer.scene.context;
    //trans
    this.trans = Cesium.Transforms.eastNorthUpToFixedFrame(this.totalCenter),
      this.inverTrans = Cesium.Matrix4.inverse(this.trans, new Cesium.Matrix4());
    var _0x460752 = 99999999,
      _0x22a6f2 = 99999999,
      _0x3dc463 = -99999999,
      _0x2dac75 = -99999999;

    this._areaList.forEach(function (data) {
        var positions = data.positions,
          _1eddb0 = new Cesium.PolygonGeometry({
            'polygonHierarchy': new Cesium.PolygonHierarchy(positions)
          }),
          _0x59e67c = (_1eddb0 = Cesium.PolygonGeometry.createGeometry(_1eddb0)).indices,
          _0x2e4fc9 = _1eddb0.attributes.position.values,
          _0x32c3a1 = _0x2e4fc9.length,
          _0xf8ba53 = [],
          tempArray = [];
        for (var index = 0; index < _0x32c3a1; index += 3) {

          var _0x5a4621 = _0x2e4fc9[index],
            _0x5d2bf9 = _0x2e4fc9[index + 1],
            _0x205406 = _0x2e4fc9[index + 2],
            _0x552726 = new Cesium.Cartesian3(_0x5a4621, _0x5d2bf9, _0x205406),
            multiplyByPoint = Cesium.Matrix4.multiplyByPoint(that.inverTrans, _0x552726,
              new Cesium.Cartesian3());
          multiplyByPoint['z'] = 0,
            _0xf8ba53.push(multiplyByPoint),
            tempArray.push(multiplyByPoint['x']),
            tempArray.push(multiplyByPoint['y']),
            tempArray.push(multiplyByPoint['z']),
            _0x460752 >= multiplyByPoint['x'] && (_0x460752 = multiplyByPoint['x']),
            _0x22a6f2 >= multiplyByPoint['y'] && (_0x22a6f2 = multiplyByPoint['y']),
            _0x3dc463 <= multiplyByPoint['x'] && (_0x3dc463 = multiplyByPoint['x']),
            _0x2dac75 <= multiplyByPoint['y'] && (_0x2dac75 = multiplyByPoint['y']);
        }
        data.localPos = _0xf8ba53;
        var float64Array = new Float64Array(tempArray),
          boundingSphere = Cesium.BoundingSphere.fromVertices(float64Array),
          geometry = new Cesium.Geometry({
            'attributes': {
              'position': new Cesium.GeometryAttribute({
                'componentDatatype': Cesium.ComponentDatatype.DOUBLE,
                'componentsPerAttribute': 3,
                'values': float64Array
              })
            },
            'indices': _0x59e67c,
            'primitiveType': Cesium.PrimitiveType.TRIANGLES,
            'boundingSphere': boundingSphere
          }),
          shaderProgram = Cesium.ShaderProgram.fromCache({
            'context': context,
            'vertexShaderSource': that.getVS(),
            'fragmentShaderSource': that.getFS(),
            'attributeLocations': {
              'position': 0
            }
          }),
          vertexArray = Cesium.VertexArray.fromGeometry({
            'context': context,
            'geometry': geometry,
            'attributeLocations': shaderProgram._attributeLocations,
            'bufferUsage': Cesium.BufferUsage.STATIC_DRAW,
            'interleave': true
          }),
          renderState = new Cesium.RenderState();
        renderState.depthRange.near = -1000000,
          renderState.depthRange.far = 1000000,
          data.drawAreaCommand = new Cesium.DrawCommand({
            'boundingVolume': boundingSphere,
            'primitiveType': Cesium.PrimitiveType.TRIANGLES,
            'vertexArray': vertexArray,
            'shaderProgram': shaderProgram,
            'renderState': renderState,
            'pass': Cesium.Pass.TRANSLUCENT
          });
      }),
      this.ratio = (_0x2dac75 - _0x22a6f2) / (_0x3dc463 - _0x460752),
      this.totalRect = [_0x460752, _0x22a6f2, _0x3dc463, _0x2dac75];
  }

  getVS() {
    return "attribute vec3 position;\n" +
      "void main()\n" +
      "{\n" +
      "vec4 pos = vec4(position.xyz,1.0);\n" +
      "gl_Position = czm_projection*pos;\n" +
      "}\n";
  }

  getFS() {
    return "#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
      "precision highp float;\n" +
      "#else\n" +
      "precision mediump float;\n" +
      "#endif\n" +
      "void main()\n" +
      "{\n" +
      "gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n" +
      "}\n";
  }

  prepareCamera() {
    this.ortCamera = {
        'viewMatrix': Cesium.Matrix4.IDENTITY,
        'inverseViewMatrix': Cesium.Matrix4.IDENTITY,
        'frustum': new Cesium.OrthographicOffCenterFrustum(),
        'positionCartographic': {
          'height': 0,
          'latitude': 0,
          'longitude': 0
        },
        'positionWC': new Cesium.Cartesian3(0, 0, 60000),
        'directionWC': new Cesium.Cartesian3(0, 0, -1),
        'upWC': new Cesium.Cartesian3(0, 1, 0),
        'rightWC': new Cesium.Cartesian3(1, 0, 0),
        'viewProjectionMatrix': Cesium.Matrix4.IDENTITY
      },
      Object.defineProperties(this.ortCamera.frustum, {
        'projectionMatrix': {
          value: this.ortCamera.frustum._orthographicMatrix,
          writable: true
        }
      }),
      // this.ortCamera.frustum.projectionMatrix = this.ortCamera.frustum._orthographicMatrix,
      this.ortCamera.frustum.infiniteProjectionMatrix = {},
      this.ortCamera.frustum.left = this.totalRect[0],
      this.ortCamera.frustum.top = this.totalRect[3],
      this.ortCamera.frustum.right = this.totalRect[2],
      this.ortCamera.frustum.bottom = this.totalRect[1],
      this.ortCamera.frustum.near = 0.1,
      this.ortCamera.frustum.far = -120000,
      this.floodRect = new Cesium.Cartesian4(this.totalRect[0], this.totalRect[1], this.totalRect[
        2] - this.totalRect[0], this.totalRect[3] - this.totalRect[1]);

  }

  prepareFBO() {
    var context = this.viewer.scene.context,
      width = this._canvasWidth //2048
      ,
      texture = new Cesium.Texture({
        'context': context,
        'width': width,
        'height': width * this.ratio,
        'pixelFormat': Cesium.PixelFormat.RGBA,
        'pixelDatatype': Cesium.PixelDatatype.FLOAT,
        'flipY': false
      });
    this.tailorTex = texture,
      this.yanmoFbo = new Cesium.Framebuffer({
        'context': context,
        'colorTextures': [texture],
        'destroyAttachments': false
      }),
      this._fboClearCommand = new Cesium.ClearCommand({
        'color': new Cesium.Color(0, 0, 0, 0),
        'framebuffer': this.yanmoFbo
      });

  }

  drawPolygon() {
    var _this = this,
      context = this.viewer.scene.context,
      width = this._canvasWidth //2048
      ,
      _ratio = width * this.ratio,
      passState = new Cesium.PassState(context);
    passState.viewport = new Cesium.BoundingRectangle(0, 0, width, _ratio);
    var uniformState = context.uniformState;
    uniformState.updateCamera(this.ortCamera);
    this._fboClearCommand.execute(context);
    this._areaList.forEach(function (data) {
      var _drawAreaCommand = data.drawAreaCommand;
      _drawAreaCommand && data.show && (uniformState.updatePass(_drawAreaCommand.pass),
        _drawAreaCommand.framebuffer = _this.yanmoFbo,
        _drawAreaCommand.execute(context, passState));
    });

  }
  _removeAreaHook(data) {
    null != data && data.pitPrimitive && this._graphicLayer.removeGraphic(data.pitPrimitive);
  }
  beginTailor() {
    this._enabledHook(true);

    this.viewer.scene.globe._surface.tileProvider.applyTailor = true,
      this.terrainEditCtl.inverTailorCenterMat = this.inverTrans,
      this.terrainEditCtl.tailorArea = this.yanmoFbo,
      this.terrainEditCtl.tailorRect = this.floodRect;


    // this.terrainEditCtl.inverFloodCenterMat = this.inverTrans,
    // this.terrainEditCtl.floodArea = this.yanmoFbo,
    // this.terrainEditCtl.enableFlood = true,
    // this.terrainEditCtl.floodRect = this.floodRect, //a0_0x2307('0x7de')
    // this.terrainEditCtl.globe = false;
    // a0_0x2307('0x553')
  }

  _addAreaHook(option, _0x2f9474) {

    var that = this;
    // this.options.image && (
    option.pitPrimitive = new PitPrimitive({
        'viewer': that.viewer,
        'style': that.options,
        'positions_original': option.positions_original,
        'positions': option.positions
      }),
      that.graphic.push(option.pitPrimitive);
  }

  diffHeight(height) {
    for (var i = 0; i < this.graphic.length; i++) {
      this.graphic[i].diffHeight = height;
    }
  }
  clear() {

    for (var i = 0; i < this.graphic.length; i++) {
      this.graphic[i]._removePit();
    }
    // _0x40f6e5()(_0x3ea740()(_0x4e6bb5['prototype']), 'clear', this)[a0_0x8650('0xe0f')](this),
    // this[a0_0x8650('0xcf6')][a0_0x8650('0x7ba')]();
    // _0x40f6e5()(_0x3ea740()(_0x4e6bb5['prototype']), 'clear', this).call(this),
    // this._graphicLayer.clear();

    this.viewer.scene.globe.material = null,
      this.viewer.scene.globe._surface.tileProvider.resetFloodAnalysis(),
      this.viewer.scene.globe._surface.tileProvider.resetExcavateAnalysis(),
      this._areaList = [],
      this.graphic = [],
      this.tailorTex && this.tailorTex.destroy();
  }
  _0x133526(option) {
    var _0x159f21;
    return _0x264c51()(this, _0x39da96),
      (_0x159f21 = _0x4bb5c3.call(this, option)).style.diffHeight = Cesium.defaultValue(_0x159f21
        .style.diffHeight, 10),
      _0x159f21.style.splitNum = Cesium.defaultValue(_0x159f21.style.splitNum, 50),
      _0x159f21;
  }

}
