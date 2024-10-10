import * as Cesium from "cesium";
import PolygonTextureVS from "../shaders/PolygonTextureVS.glsl";
import PolygonTextureFS from "../shaders/PolygonTextureFS.glsl";

// 模型分析（裁剪、压平、淹没） 基础类
//原理：利用绘制的点数组，先计算其外包矩形，然后根据点创建一个polygonGeometry，然后利用此geometry创建指令，绘制出polygon纹理，
//源码里会根据此纹理判断模型顶点是否在polygon纹理中，如果在就进行后续操作

//多处压平思考：创建多个polygon纹理有点不大合理，一张FBO里多个polygon纹理，可能会导致压平闪烁（因为到着色器里，增大了顶点和polygon纹理的比对误差）
//多处压平思路之一张FBO里多个polygon纹理：就是想办法在我创建的FBO帧缓存里绘制多少polygon纹理，创建polygon数组，每次绘制都是往这里添加polygon，
//遍历polygon，依次创建指令绘制到fbo里
export class TilesBase {
  //========== 构造方法 ==========

  constructor(options) {
    this.viewer = options.viewer;
    this.tileset = options.tileset;

    this.tileset.dasEditor = this.tileset.dasEditor || {};
    this.tileset.dasEditor.enable = true;
    this.positions = options.positions;

    this._b3dmOffset = options.b3dmOffset || new Cesium.Cartesian2();
    if (this.tileset && this.tileset.das.options.editOffset) {
      this.b3dmOffset = new Cesium.Cartesian2(
        this.tileset.das.options.editOffset.x,
        this.tileset.das.options.editOffset.y
      );
    }

    if (this.positions) {
      this._preparePos(this.positions);
    }
    if (this.localPosArr && !(options.floodAll === true)) {
      this._prepareWorks();
    }
  }

  //========== 对外属性 ==========
  //编辑对象
  get tileset() {
    return this._tileset;
  }
  set tileset(val) {
    this._tileset = val;
    var inverseMat = new Cesium.Matrix4();
    Cesium.Matrix4.fromArray(val._root.transform, 0, inverseMat);
    Cesium.Matrix4.inverse(inverseMat, inverseMat);
    this.tileInverTransform = inverseMat;

    if (this.tileset.das.options.editOffset) {
      this._b3dmOffset = new Cesium.Cartesian2(
        this.tileset.das.options.editOffset.x,
        this.tileset.das.options.editOffset.y
      );
    }
  }

  //偏移量
  get b3dmOffset() {
    return this._b3dmOffset;
  }
  set b3dmOffset(val) {
    if (!val) return;
    this._b3dmOffset.x = val.x || 0;
    this._b3dmOffset.y = val.y || 0;

    this.tileset.dasEditor.b3dmOffset = this._b3dmOffset;
  }

  //========== 方法 ==========
  setPositions(posArr) {
    if (!posArr || posArr.length == 0) return;

    this.positions = posArr;
    this._preparePos(this.positions);
    if (this.localPosArr) {
      this._prepareWorks();
      this.clear();
      this.activeEdit();
    }
  }

  //输入模型上方向轴向，目前使用实验室的工具，好像会把模型转成Z向上的，所以该功能已遗弃，未被使用
  setUpAxis(val) {
    if (val == "X") {
      this.base_height = this.flatRect[0];
      return;
    }
    if (val == "Y") {
      this.base_height = this.flatRect[1];
      return;
    }
    if (val == "Z") {
      this.base_height = this.flatRect[2];
      return;
    }
    this.base_height = this.flatRect[2];
  }

  _prepareWorks() {
    //准备工作
    this._createTexture();
    this._createCommand();
  }
  _createTexture() {
    //创建FBO以及清除指令
    var context = this.viewer.scene.context;
    let tt = new Cesium.Texture({
      context: context,
      width: 4096,
      height: 4096,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.FLOAT,
      sampler: new Cesium.Sampler({
        wrapS: Cesium.TextureWrap.CLAMP_TO_EDGE,
        wrapT: Cesium.TextureWrap.CLAMP_TO_EDGE,
        minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
        magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
      })
    });

    var depthStencilTexture = new Cesium.Texture({
      context: context,
      width: 4096,
      height: 4096,
      pixelFormat: Cesium.PixelFormat.DEPTH_STENCIL,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT_24_8
    });

    this.fbo = new Cesium.Framebuffer({
      context: context,
      colorTextures: [tt],
      depthStencilTexture: depthStencilTexture,
      destroyAttachments: false
    });

    this._fboClearCommand = new Cesium.ClearCommand({
      color: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
      framebuffer: this.fbo
    });
  }

  _createCamera() {
    //创建相机
    return {
      viewMatrix: Cesium.Matrix4.IDENTITY,
      inverseViewMatrix: Cesium.Matrix4.IDENTITY,
      frustum: new Cesium.OrthographicOffCenterFrustum(),
      positionCartographic: new Cesium.Cartographic(),
      positionWC: new Cesium.Cartesian3(),
      directionWC: Cesium.Cartesian3.UNIT_Z,
      upWC: Cesium.Cartesian3.UNIT_Y,
      rightWC: Cesium.Cartesian3.UNIT_X,
      viewProjectionMatrix: Cesium.Matrix4.IDENTITY
    };
  }

  _createPolygonGeometry() {
    //创建geometry
    var flattenPolygon = new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(this.localPosArr),
      perPositionHeight: true
    });
    return Cesium.PolygonGeometry.createGeometry(flattenPolygon);
  }

  _createCommand() {
    //创建指令
    var context = this.viewer.scene.context;
    var ppp = this._createPolygonGeometry();
    var _camera = this._createCamera();
    var sp = Cesium.ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: PolygonTextureVS,
      fragmentShaderSource: PolygonTextureFS,
      attributeLocations: {
        position: 0
      }
    });
    var vao = Cesium.VertexArray.fromGeometry({
      context: context,
      geometry: ppp,
      attributeLocations: sp._attributeLocations,
      bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
      interleave: true
    });

    var rs = new Cesium.RenderState();
    rs.depthTest.enabled = false;
    rs.depthRange.near = -1000000.0;
    rs.depthRange.far = 1000000.0;

    var bg = Cesium.BoundingRectangle.fromPoints(this.localPosArr, new Cesium.BoundingRectangle());
    _camera.frustum.left = bg.x;
    _camera.frustum.top = bg.y + bg.height;
    _camera.frustum.right = bg.x + bg.width;
    _camera.frustum.bottom = bg.y;

    this._camera = _camera;

    var myPorjection = Cesium.Matrix4.computeOrthographicOffCenter(
      _camera.frustum.left,
      _camera.frustum.right,
      _camera.frustum.bottom,
      _camera.frustum.top,
      _camera.frustum.near,
      _camera.frustum.far,
      new Cesium.Matrix4()
    );

    this.polygonBounds = new Cesium.Cartesian4(
      _camera.frustum.left,
      _camera.frustum.bottom,
      _camera.frustum.right,
      _camera.frustum.top
    );

    this.drawCommand = new Cesium.DrawCommand({
      boundingVolume: ppp.boundingVolume,
      primitiveType: Cesium.PrimitiveType.TRIANGLES,
      vertexArray: vao,
      shaderProgram: sp,
      renderState: rs,
      pass: Cesium.Pass.CESIUM_3D_TILE,
      uniformMap: {
        myPorjection: function() {
          return myPorjection;
        }
      }
    });
  }

  //重置编辑对象
  clear() {
    if (this._tileset && this.tileset.dasEditor) {
      this.tileset.dasEditor.IsYaPing = [false, false, false, false]; //[是否开启编辑，是否开启压平，是否开启裁剪，是否开启淹没]
      this.tileset.dasEditor.editVar = [false, false, false, false]; //[是否开启裁剪外部，是否开启淹没全局，]

      this.tileset.dasEditor.b3dmOffset = undefined;
      this.tileset.dasEditor.floodColor = [0.0, 0.0, 0.0, 0.5]; //[淹没颜色的r(0-1之间)，淹没颜色的g，淹没颜色的b，淹没混合系数（建议取值范围0.3-0.7）]
      this.tileset.dasEditor.floodVar = [0, 0, 0, 0]; //[基础淹没高度，当前淹没高度，最大淹没高度,默认高度差(最大淹没高度 - 基础淹没高度)]
      this.tileset.dasEditor.heightVar = [0, 0]; //基础压平高度，调整压平高度值
      this.tileset.dasEditor.enable = false;
    }
    this.drawed = false;
  }

  activeEdit() {}

  deActiveEdit() {
    //激活
    this.tileset.dasEditor.IsYaPing[0] = false;
  }

  update(frameState) {
    //更新
    if (this.drawed) return; //如果已经绘制过纹理，则退出，无需再绘制
    this.drawed = true;
    var context = frameState.context;
    var width = 4096;
    var height = 4096;
    if (!this._passState) {
      this._passState = new Cesium.PassState(context);
    }
    this._passState.framebuffer = this.fbo;
    this._passState.viewport = new Cesium.BoundingRectangle(0, 0, width, height);
    var us = context.uniformState;
    us.updateCamera(this._camera);
    us.updatePass(this.drawCommand.pass);
    this.drawCommand.framebuffer = this.fbo;
    this.drawCommand.execute(context, this._passState);
  }

  //预处理顶点
  _preparePos(positions) {
    if (!positions || positions.length == 0) return;
    var localPos = [];
    var minHeight = 99999;
    var minLocalPos;
    for (var i = 0; i < positions.length; i++) {
      var cart = Cesium.Cartographic.fromCartesian(positions[i]);
      var height = cart.height;
      var currLocalPos = Cesium.Matrix4.multiplyByPoint(
        this.tileInverTransform,
        positions[i],
        new Cesium.Cartesian3()
      );

      // if (this.tileset.das.options.offset && this.tileset.das.options.offset.z) {
      //   currLocalPos.z -= this.tileset.das.options.offset.z;
      // }
      if (this.tileset.das.options.editOffset && this.tileset.das.options.editOffset.z) {
        currLocalPos.z += this.tileset.das.options.editOffset.z;
      }

      localPos.push(currLocalPos);
      if (height < minHeight) {
        minHeight = height;
        minLocalPos = currLocalPos;
      }
    }
    this.minHeight = minHeight;
    this.minLocalPos = minLocalPos;
    this.localPosArr = localPos;
  }

  addToScene() {
    if (!this.viewer.scene.primitives.contains(this)) {
      this.viewer.scene.primitives.add(this);
    }
  }

  //销毁
  destroy() {
    if (this.viewer.scene.primitives.contains(this)) {
      this.viewer.scene.primitives.remove(this);
      if (!this.viewer) return;
    }
    this.clear();

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
