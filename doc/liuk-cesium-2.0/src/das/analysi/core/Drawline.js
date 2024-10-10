import * as Cesium from "cesium";
import { DasClass } from "../../core/DasClass";
export class Drawline extends DasClass {
  constructor(options, oldparam) {
    super(options);
    if (!Cesium.defined(options.scene)) {
      throw new Cesium.DeveloperError("options.scene is required.");
    }
    if (!Cesium.defined(options.positions)) {
      throw new Cesium.DeveloperError("options.positions is required.");
    }
    this.positions = options.positions;
    this._scene = options.scene;
    this._type = Cesium.defaultValue(options.type, "line");
    this._color = Cesium.defaultValue(options.color, Cesium.Color.RED);
    this._height = Cesium.defaultValue(options.height, 100);
    this.isUpdateColor = false;
    this.init();
  }
  init() {
    this._modelMatrix = Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY);
    this.modelMatrix = new Cesium.Matrix4();
    this._boundingSphere = new Cesium.BoundingSphere();
    this._invertViewMatrix = new Cesium.Matrix4();
    this._viewMatrix = new Cesium.Matrix4();
  }
  createCommand() {
    var that = this;
    var t = this._scene;
    var n = this._scene.context;
    var i = this.positions;
    var r = null;
    var o = null;
    if ("line" == this._type) {
      r = Cesium.ComponentDatatype.createTypedArray(
        Cesium.ComponentDatatype.FLOAT,
        4 * (i.length + 1)
      );
      o = Cesium.ComponentDatatype.createTypedArray(
        Cesium.ComponentDatatype.UNSIGNED_SHORT,
        i.length
      );
      for (var a = 0; i.length > a; a++) {
        o[a] = a + 1;
      }
      r[0] = 0;
      r[1] = 0;
      r[2] = 0;
      r[3] = 1;
      this.primitiveType = Cesium.PrimitiveType.LINE_STRIP;
      for (var s = 0; s < i.length; s++) {
        var l = i[s];
        r[4 * (s + 1)] = l.x;
        r[4 * (s + 1) + 1] = l.y;
        r[4 * (s + 1) + 2] = l.z;
        r[4 * (s + 1) + 3] = 1;
      }
    } else {
      var u = i.length + 1;
      r = Cesium.ComponentDatatype.createTypedArray(
        Cesium.ComponentDatatype.FLOAT, 8 * u
      );
      o = Cesium.ComponentDatatype.createTypedArray(
        Cesium.ComponentDatatype.UNSIGNED_SHORT,
        12 * (i.length - 1) + 12
      );
      o[0] = 0;
      o[1] = u;
      o[2] = 1;
      o[3] = u;
      o[4] = 1;
      o[5] = u + 1;
      var h = 12 * (i.length - 1) + 6;
      o[h] = 0;
      o[h + 1] = u;
      o[h + 2] = u - 1;
      o[h + 3] = u;
      o[h + 4] = u - 1;
      o[h + 5] = 2 * u - 1;
      for (var a = 0; a < i.length - 1; a++) {
        var c = 12 * a + 6;
        o[c] = 0;
        o[c + 1] = a + 1;
        o[c + 2] = a + 2;
        o[c + 3] = u;
        o[c + 4] = u + a + 1;
        o[c + 5] = u + a + 2;
        o[c + 6] = a + 2;
        o[c + 7] = u + a + 2;
        o[c + 8] = a + 1;
        o[c + 9] = u + a + 2;
        o[c + 10] = a + 1;
        o[c + 11] = u + a + 1;
      }
      var d = Cesium.Cartesian3.clone(t.camera.position);
      var f = new Cesium.Cartographic.fromCartesian(d);
      var p = new Cesium.Cartesian3.fromRadians(f.longitude, f.latitude, this._height);
      var m = new Cesium.Cartesian3.fromRadians(f.longitude, f.latitude, 10);
      r[0] = p.x;
      r[1] = p.y;
      r[2] = p.z;
      r[3] = 1;
      r[4 * u] = m.x;
      r[4 * u + 1] = m.y;
      r[4 * u + 2] = m.z;
      r[4 * u + 3] = 1;
      this.primitiveType = Cesium.PrimitiveType.TRIANGLES;
      for (var s = 1; s < u; s++) {
        var l = i[s - 1];
        r[4 * s] = l.x;
        r[4 * s + 1] = l.y;
        r[4 * s + 2] = l.z;
        r[4 * s + 3] = 1;
        var g = new Cesium.Cartographic.fromCartesian(l);
        var v = new Cesium.Cartesian3.fromRadians(g.longitude, g.latitude, 10);
        r[4 * (s + u)] = v.x;
        r[4 * (s + u) + 1] = v.y;
        r[4 * (s + u) + 2] = v.z;
        r[4 * (s + u) + 3] = 1;
      }
    }
    var y = {
      enabled: true,
      factor: 1.1,
      units: 4
    };
    var _ = Cesium.RenderState.fromCache({
      cull: {
        enabled: !1
      },
      depthTest: {
        enabled: !0
      },
      polygonOffset: y
    });
    var x = {
      das3dColor: function () {
        return that._color
      }
    };
    var w = {
      aPosition: 0,
      normal: 1
    };
    var b = Cesium.ShaderProgram.fromCache({
      context: n,
      vertexShaderSource:
        "attribute vec4 aPosition;\n                        void main() \n                        {\n                            gl_Position = czm_modelViewProjection *  aPosition; \n                        } ",
      fragmentShaderSource:
        "uniform vec4 das3dColor;void main(){   gl_FragColor = das3dColor;}",
      attributeLocations: w
    });
    this._shaderprogram = b;
    var C = Cesium.Buffer.createVertexBuffer({
      context: n,
      typedArray: r,
      usage: Cesium.BufferUsage.STATIC_DRAW
    });
    var M = Cesium.Buffer.createIndexBuffer({
      context: n,
      typedArray: o,
      usage: Cesium.BufferUsage.STATIC_DRAW,
      indexDatatype: Cesium.IndexDatatype.UNSIGNED_SHORT
    });
    var S = new Cesium.VertexArray({
      context: n,
      attributes: [
        {
          index: 0,
          vertexBuffer: C,
          componentsPerAttribute: 4,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }
      ],
      indexBuffer: M
    });
    this._initBoundingSphere = Cesium.BoundingSphere.fromVertices(r);
    var T = this.primitiveType;
    this._lineCommand = new Cesium.DrawCommand({
      vertexArray: S,
      primitiveType: T,
      renderState: _,
      shaderProgram: b,
      uniformMap: x,
      owner: this,
      pass: Cesium.Pass.TRANSLUCENT,
      modelMatrix: new Cesium.Matrix4(),
      boundingVolume: new Cesium.BoundingSphere(),
      cull: true
    });
  }
  update(e) {
    var t = this;
    Cesium.defined(this._lineCommand) || this.createCommand(e.context);
    if (!Cesium.Matrix4.equals(this.modelMatrix, this._modelMatrix)) {
      Cesium.Matrix4.clone(this.modelMatrix, this._modelMatrix);
      this._lineCommand.modelMatrix = Cesium.Matrix4.IDENTITY;
      this._lineCommand.boundingVolume = Cesium.BoundingSphere.transform(
        this._initBoundingSphere,
        Cesium.Matrix4.IDENTITY,
        this._boundingSphere
      );
    }
    if (this.isUpdateColor) {
      this._lineCommand.uniformMap.das3dColor = function() {
        return t._color;
      };
      this.isUpdateColor = false;
      if (this._lineCommand) {
        e.commandList.push(this._lineCommand);
      }
    }
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

  //线状态
  get type() {
    return this._type;
  }
  set type(val) {
    if (val) {
      this._type = val;
    }
  }

  //线颜色
  get color() {
    return this._color;
  }
  set color(val) {
    if (val) {
      this._color = val;
      this.isUpdateColor = true;
    }
  }

  //线高
  get height() {
    return this._height;
  }
  set height(val) {
    if (val) {
      this._height = Number(val);
    }
  }
}
