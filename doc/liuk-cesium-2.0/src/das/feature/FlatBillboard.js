import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import FlatBillboardFS from "../shaders/FlatBillboardFS.glsl";
import FlatBillboardVS from "../shaders/FlatBillboardVS.glsl";

//平放的图标
//目前DrawCommand单向渲染的，无法鼠标单击拾取对象
export class FlatBillboard extends DasClass {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(options);

    this.viewer = viewer;
    this.options = options || {};

    this.width = options.width || options.size || 50;
    this.height = Cesium.defaultValue(options.height, this.width);
    this.scale3d = Cesium.defaultValue(options.scale3d, 0.6);
    this._show = Cesium.defaultValue(options.show, true);

    var oldVal = Cesium.defaultValue(
      options.distanceDisplayCondition,
      new Cesium.DistanceDisplayCondition(0, 5000000)
    );
    this.distanceDisplayCondition = new Cesium.Cartesian2(oldVal.near, oldVal.far);

    this.textures = {};
    this.textureDef = new Cesium.Texture({
      context: this.viewer.scene.context,
      width: 500,
      height: 500
    });
    this._pickId = this.viewer.scene.context.createPickId({
      id: "FlatBillboard",
      primitive: this
    });

    if (options.data) this.init(options.data);

    //切换场景后事件
    this.viewer.scene.morphComplete.addEventListener(this.onMorphComplete, this);

    this.viewer.scene.primitives.add(this);
  }

  //========== 对外属性 ==========
  //数据
  get data() {
    return this.options.data;
  }
  set data(val) {
    this.init(val);
  }

  //是否显示
  get show() {
    return this._show;
  }
  set show(val) {
    this._show = val;
  }

  //========== 方法 ==========
  init(arrdata) {
    this.clear();

    this.options.data = arrdata;
    this.draw();
  }
  //渲染数据
  draw() {
    this._removeCollectionBy3D();
    this._removeCollectionBy2D();

    if (this.viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
      this._initCollectionBy3D();
    } else {
      this._initCollectionBy2D();
    }
  }
  onMorphComplete(e) {
    this.draw();
  }
  update(frameState) {
    if (!this.show) {
      if (this.billboardCollection) {
        this._removeCollectionBy2D();
      }
      return;
    }

    //三维模式下
    if (frameState.mode === Cesium.SceneMode.SCENE3D) {
      var commandList = frameState.commandList;
      if (commandList && this.commands) {
        commandList.push(...this.commands);
      }
    } else {
      if (!this.billboardCollection) {
        this._initCollectionBy2D();
      }
    }
  }

  //二维模式下的处理
  isInit2D() {
    return this.billboardCollection;
  }
  _initCollectionBy2D() {
    var arrdata = this.data;
    if (!arrdata) return;

    this.billboardCollection = new Cesium.BillboardCollection({ scene: this.viewer.scene });
    this.viewer.scene.primitives.add(this.billboardCollection);

    for (let i = 0, len = arrdata.length; i < len; i++) {
      var item = arrdata[i];

      var primitive = this.billboardCollection.add({
        position: item.position,
        image: item.image,
        rotation: Cesium.Math.toRadians(item.angle),
        scale: 1,
        width: this.width,
        height: this.height
      });

      primitive.data = item.data || item;
      primitive.eventTarget = this;
      primitive.tooltip = this.options.tooltip;
      primitive.popup = this.options.popup;
    }
  }
  _removeCollectionBy2D() {
    if (!this.billboardCollection) return;

    this.viewer.scene.primitives.remove(this.billboardCollection);
    delete this.billboardCollection;
  }

  //三维模式下的处理
  isInit3D() {
    return this.commands;
  }
  _initCollectionBy3D() {
    var arrdata = this.data;
    if (!arrdata) return;

    //按图片分组
    var imaObj = {};
    for (let i = 0, len = arrdata.length; i < len; i++) {
      var item = arrdata[i];

      if (!imaObj[item.image]) imaObj[item.image] = [];

      imaObj[item.image].push(item);
    }

    var commands = [];
    for (var key in imaObj) {
      var arr = imaObj[key];
      var image = key;

      //加载图片
      this.prepareTexture(image);

      //生成Command
      var VAO = this.prepareVAO(arr);
      var command = this.prepareCommand(VAO, image);
      commands.push(command);
    }
    this.commands = commands;
  }

  _removeCollectionBy3D() {
    if (this.commands) {
      delete this.commands;
    }

    for (var key in this.textures) {
      if (this.textures[key]) {
        this.textures[key].destroy();
      }
    }
    this.textures = {};
  }

  prepareTexture(imgUrl) {
    let image = new Image();
    image.onload = e => {
      let texture = new Cesium.Texture({
        context: this.viewer.scene.context,
        source: image
      });
      this.textures[imgUrl] = texture;
    };
    image.src = imgUrl;
  }

  prepareVAO(points) {
    var vertexs_H = [];
    var vertexs_L = [];
    var indexs = [];
    var uvs = [];
    var colors = [];
    for (let i = 0, len = points.length; i < len; i++) {
      var currP = points[i];
      var currCar = currP.position;
      var angle = currP.angle;

      indexs.push(i * 4 + 0);
      indexs.push(i * 4 + 2);
      indexs.push(i * 4 + 1);
      indexs.push(i * 4 + 0);
      indexs.push(i * 4 + 3);
      indexs.push(i * 4 + 2);

      // 伪造双精度数据
      let currDF = new Float32Array(6);
      currDF[0] = currCar.x;
      currDF[1] = currCar.x - currDF[0];
      currDF[2] = currCar.y;
      currDF[3] = currCar.y - currDF[2];
      currDF[4] = currCar.z;
      currDF[5] = currCar.z - currDF[4];

      vertexs_H.push(currDF[0]);
      vertexs_H.push(currDF[2]);
      vertexs_H.push(currDF[4]);
      vertexs_L.push(currDF[1]);
      vertexs_L.push(currDF[3]);
      vertexs_L.push(currDF[5]);

      vertexs_H.push(currDF[0]);
      vertexs_H.push(currDF[2]);
      vertexs_H.push(currDF[4]);
      vertexs_L.push(currDF[1]);
      vertexs_L.push(currDF[3]);
      vertexs_L.push(currDF[5]);

      vertexs_H.push(currDF[0]);
      vertexs_H.push(currDF[2]);
      vertexs_H.push(currDF[4]);
      vertexs_L.push(currDF[1]);
      vertexs_L.push(currDF[3]);
      vertexs_L.push(currDF[5]);

      vertexs_H.push(currDF[0]);
      vertexs_H.push(currDF[2]);
      vertexs_H.push(currDF[4]);
      vertexs_L.push(currDF[1]);
      vertexs_L.push(currDF[3]);
      vertexs_L.push(currDF[5]);

      uvs.push(0, 0);
      uvs.push(0, 1);
      uvs.push(1, 1);
      uvs.push(1, 0);
      var trans = Cesium.Transforms.eastNorthUpToFixedFrame(currCar);
      let mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(angle));
      let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
      let currMat = Cesium.Matrix4.multiply(trans, rotationZ, new Cesium.Matrix4());

      var heightScale = this.height / this.width;

      var zxj = new Cesium.Cartesian3(-1, -heightScale, 0);
      Cesium.Matrix4.multiplyByPointAsVector(currMat, zxj, zxj);
      Cesium.Cartesian3.normalize(zxj, zxj);
      colors.push(zxj.x, zxj.y, zxj.z);

      var zsj = new Cesium.Cartesian3(-1, heightScale, 0);
      Cesium.Matrix4.multiplyByPointAsVector(currMat, zsj, zsj);
      Cesium.Cartesian3.normalize(zsj, zsj);
      colors.push(zsj.x, zsj.y, zsj.z);

      var ysj = new Cesium.Cartesian3(1, heightScale, 0);
      Cesium.Matrix4.multiplyByPointAsVector(currMat, ysj, ysj);
      Cesium.Cartesian3.normalize(ysj, ysj);
      colors.push(ysj.x, ysj.y, ysj.z);

      var yxj = new Cesium.Cartesian3(1, -heightScale, 0);
      Cesium.Matrix4.multiplyByPointAsVector(currMat, yxj, yxj);
      Cesium.Cartesian3.normalize(yxj, yxj);
      colors.push(yxj.x, yxj.y, yxj.z);
    }

    return {
      index: new Uint16Array(indexs),
      vertex_H: {
        values: new Float32Array(vertexs_H),
        componentDatatype: "DOUBLE",
        componentsPerAttribute: 3
      },
      vertex_L: {
        values: new Float32Array(vertexs_L),
        componentDatatype: "DOUBLE",
        componentsPerAttribute: 3
      },
      uv: {
        values: new Float32Array(uvs),
        componentDatatype: "FLOAT",
        componentsPerAttribute: 2
      },
      color: {
        values: new Float32Array(colors),
        componentDatatype: "FLOAT",
        componentsPerAttribute: 3
      }
    };
  }

  prepareCommand(VAO, imgUrl) {
    let context = this.viewer.scene.context;

    let width = context.drawingBufferWidth;
    let height = context.drawingBufferHeight;
    let sp = Cesium.ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: FlatBillboardVS,
      fragmentShaderSource: FlatBillboardFS,
      attributeLocations: {
        position3DHigh: 0,
        position3DLow: 1,
        color: 2,
        st: 3
      }
    });

    let indexBuffer = Cesium.Buffer.createIndexBuffer({
      context: context,
      typedArray: VAO.index,
      usage: Cesium.BufferUsage.STATIC_DRAW,
      indexDatatype: Cesium.IndexDatatype.UNSIGNED_SHORT
    });

    let va = new Cesium.VertexArray({
      context: context,
      attributes: [
        {
          index: 0,
          vertexBuffer: Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: VAO.vertex_H.values,
            usage: Cesium.BufferUsage.STATIC_DRAW
          }),
          componentsPerAttribute: 3
        },
        {
          index: 1,
          vertexBuffer: Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: VAO.vertex_L.values,
            usage: Cesium.BufferUsage.STATIC_DRAW
          }),
          componentsPerAttribute: 3
        },
        {
          index: 2,
          vertexBuffer: Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: VAO.color.values,
            usage: Cesium.BufferUsage.STATIC_DRAW
          }),
          componentsPerAttribute: 3
        },
        {
          index: 3,
          vertexBuffer: Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: VAO.uv.values,
            usage: Cesium.BufferUsage.STATIC_DRAW
          }),
          componentsPerAttribute: 2
        }
      ],
      indexBuffer: indexBuffer
    });

    let rs = Cesium.RenderState.fromCache();
    let that = this;
    var bs = Cesium.BoundingSphere.fromVertices(VAO.vertex_H.values);
    bs.radius = 1000000;
    // rs.depthMask = true;

    var command = new Cesium.DrawCommand({
      primitiveType: Cesium.PrimitiveType.TRIANGLES,
      shaderProgram: sp,
      vertexArray: va,
      modelMatrix: Cesium.Matrix4.IDENTITY,
      pickOnly: true,
      renderState: rs,
      boundingVolume: bs,
      uniformMap: {
        mm: function() {
          // return that.viewer.scene.camera.frustum._offCenterFrustum._perspectiveMatrix;
          if (that.viewer.scene.camera.frustum._offCenterFrustum)
            return that.viewer.scene.camera.frustum._offCenterFrustum._perspectiveMatrix;
          else return that.viewer.scene.camera.frustum._orthographicMatrix;
        },
        vv: function() {
          return that.viewer.scene.camera._viewMatrix;
        },
        resolution: function() {
          return new Cesium.Cartesian2(width, height);
        },
        billWidth: function() {
          return that.width * that.scale3d * 2;
        },
        billImg: function() {
          return that.textures[imgUrl] || that.textureDef;
        },
        u_distanceDisplayCondition: function() {
          return that.distanceDisplayCondition;
        },
        u_eyePos: function() {
          return that.viewer.scene.camera.positionWC;
        }
      },
      castShadows: false,
      receiveShadows: false,
      pass: Cesium.Pass.TRANSLUCENT,
      pickCommand: new Cesium.DrawCommand({
        owner: this,
        pickOnly: true
      })
    });
    return command;
  }

  clear() {
    if (this.options && this.options.data) this.options.data = null;

    if (this.billboardCollection) {
      this.billboardCollection.removeAll();
    }
    this._removeCollectionBy3D();
  }

  destroy() {
    //切换场景后事件
    this.viewer.scene.morphComplete.removeEventListener(this.onMorphComplete, this);
    this.viewer.scene.primitives.remove(this);
    if (!this.viewer) return;

    this.clear();
    this._removeCollectionBy2D();

    this.textureDef.destroy();

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
