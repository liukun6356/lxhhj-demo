import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import { addPositionsHeight, centerOfMass } from "../util/point";
import { getEllipseOuterPositions } from "../util/polygon";

import DiffuseWallGlowVS from "../shaders/DiffuseWallGlowVS.glsl";
import DiffuseWallGlowFS from "../shaders/DiffuseWallGlowFS.glsl";

//立体面(或圆)散射效果
export class DiffuseWallGlow extends DasClass {
  constructor(viewer, options) {
    super(options);

    this.viewer = viewer;
    this.options = options;

    if (options.positions) {
      //多边形时
      this.center = centerOfMass(options.positions);
      this.positions = options.positions;
    } else {
      //圆形时
      this.center = options.position;
      this.positions = getEllipseOuterPositions({
        position: options.position,
        radius: Cesium.defaultValue(options.radius, 100), //半径
        count: Cesium.defaultValue(options.count, 50) //共返回(count*4)个点
      });
    }

    this.translucent = Cesium.defaultValue(options.translucent, true);
    this.height = Cesium.defaultValue(options.height, 1000);
    this.direction = Cesium.defaultValue(options.direction, -1);
    this.color = Cesium.defaultValue(options.color, new Cesium.Color(0.5, 0.8, 1));
    this._show = Cesium.defaultValue(options.show, true);

    //缩放参数
    this.speed = Cesium.defaultValue(options.speed, 1000);
    this.mScale = Cesium.Matrix4.fromUniformScale(1.0);
    this.xyScale = 2;
    // this.modelMatrix = Cesium.Matrix4.fromUniformScale(1.0);

    this.draw();
  }

  //========== 对外属性 ==========
  get show() {
    return this._show;
  }
  set show(value) {
    this._show = value;

    if (this.primitive) {
      this.primitive.show = value;
    }
  }

  //========== 方法 ==========
  draw() {
    var cps = this.positions;
    var up = addPositionsHeight(this.positions, this.height);

    //计算位置
    let pos = []; //坐标
    let sts = []; //纹理
    let indices = []; //索引
    let normal = []; //法向量
    for (let i = 0, count = cps.length; i < count; i++) {
      let ni = (i + 1) % count;
      pos.push(...[cps[i].x, cps[i].y, cps[i].z]);
      pos.push(...[cps[ni].x, cps[ni].y, cps[ni].z]);
      pos.push(...[up[ni].x, up[ni].y, up[ni].z]);
      pos.push(...[up[i].x, up[i].y, up[i].z]);

      normal.push(...[0, 0, 1]);
      normal.push(...[0, 0, 1]);
      normal.push(...[0, 0, 1]);
      normal.push(...[0, 0, 1]);

      sts.push(...[0, 0, 1, 0, 1, 1, 0, 1]); //四个点的纹理一次存入

      let ii = i * 4;
      let i1 = ii + 1;
      let i2 = ii + 2;
      let i3 = ii + 3;
      indices.push(...[i2, i3, ii, ii, i1, i2]);
    }

    let positions = new Float64Array(pos);
    let gi = new Cesium.GeometryInstance({
      geometry: new Cesium.Geometry({
        attributes: {
          position: new Cesium.GeometryAttribute({
            // 使用double类型的position进行计算
            componentDatatype: Cesium.ComponentDatatype.DOUBLE,
            //componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            values: positions
          }),
          normal: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            values: new Float32Array(normal)
          }),
          st: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 2,
            values: new Float32Array(sts)
          })
        },
        indices: new Uint16Array(indices),
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
      })
    });
    this.primitive = new Cesium.Primitive({
      geometryInstances: gi,
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          translucent: this.translucent,
          fabric: {
            uniforms: {
              u_color: this.color
            },
            source: this.getShader(this.translucent)
          }
        }),
        vertexShaderSource: DiffuseWallGlowVS,
        fragmentShaderSource: DiffuseWallGlowFS
      }),
      asynchronous: false
    });
    this.primitive.show = this._show;
    this.primitive.eventTarget = this;
    this.primitive.popup = this.options.popup;
    this.primitive.tooltip = this.options.tooltip;

    this.viewer.scene.primitives.add(this.primitive);

    this.viewer.scene.primitives.add(this);
  }

  update(fs) {
    if (this.primitive && this._show) {
      let time = fs.frameNumber / this.speed;
      let tt = time - Math.floor(time);

      tt = tt < 0.01 ? 0.01 : tt;
      this.mScale[0] = this.mScale[5] = tt * this.xyScale;
      this.mScale[10] = 1.1 - tt;
      this.primitive.modelMatrix = scaleXYZ(this.center, this.mScale);
    }
  }

  destroy() {
    this.viewer.scene.primitives.remove(this);
    if (!this.viewer) return;

    if (this.primitive) {
      this.viewer.scene.primitives.remove(this.primitive);
      delete this.primitive;
    }

    for (let i in this) {
      delete this[i];
    }
  }

  //片源着色器
  getShader(t) {
    let fs =
      "uniform vec4 u_color;\n" +
      "    vec4 xh_getMaterial(vec2 st){" +
      "    float alpha = pow(1. - st.t, 4.);\n";
    if (t) {
      fs += "    vec4 color = vec4(u_color.rgb * u_color.a, alpha);";
    } else {
      fs += "    vec4 color = vec4(u_color.rgb * u_color.a, 1.);";
    }
    fs += "    return color;\n" + "}\n";
    return fs;
  }
}

//[静态属性]本类中支持的事件类型常量
DiffuseWallGlow.event = {
  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};

function scaleXYZ(point, mScale) {
  let m = Cesium.Transforms.eastNorthUpToFixedFrame(point);
  let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4());

  let tt = Cesium.Matrix4.multiply(mScale, inverse, new Cesium.Matrix4());
  return Cesium.Matrix4.multiply(m, tt, new Cesium.Matrix4());
}
