import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import { addPositionsHeight } from "../util/point";

import ScrollWallGlowVS from "../shaders/ScrollWallGlowVS.glsl";
import ScrollWallGlowFS from "../shaders/ScrollWallGlowFS.glsl";

import ScrollWallGlowMaterial from "../shaders/Materials/ScrollWallGlowMaterial.glsl";
import ScrollWallGlowMaterial2 from "../shaders/Materials/ScrollWallGlowMaterial2.glsl";

//走马灯围墙效果
export class ScrollWallGlow extends DasClass {
  constructor(viewer, options) {
    super(options);

    this.viewer = viewer;
    this.options = options;

    this.positions = options.positions;

    this.height = Cesium.defaultValue(options.height, 500);
    this.style = Cesium.defaultValue(options.style, 1);
    this.color = Cesium.defaultValue(options.color, Cesium.Color.YELLOW);
    this.speed = Cesium.defaultValue(options.speed, 600);
    this.direction = Cesium.defaultValue(options.direction, -1); //方向：1往上、-1往下
    this._show = Cesium.defaultValue(options.show, true);
    this._transparent = Cesium.defaultValue(options.transparent, true);

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
    var up = addPositionsHeight(cps, this.height);

    //计算位置
    let pos = []; //坐标
    let sts = []; //纹理
    let indices = []; //索引
    let normal = []; //法向量

    for (let i = 0, len = cps.length; i < len; i++) {
      let ni = i + 1;
      if (ni == len) ni = 0;

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
      indices.push(...[ii, i1, i2, i2, i3, ii]);
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
          translucent: this._transparent,
          fabric: {
            uniforms: {
              u_color: this.color,
              speed: this.speed,
              direction: this.direction
            },
            source: this.createShader()
          }
        }),
        vertexShaderSource: ScrollWallGlowVS,
        fragmentShaderSource: ScrollWallGlowFS
      }),
      asynchronous: false
    });
    this.primitive.show = this._show;
    this.primitive.eventTarget = this;
    this.primitive.popup = this.options.popup;
    this.primitive.tooltip = this.options.tooltip;

    this.viewer.scene.primitives.add(this.primitive);
  }

  createShader() {
    if (this.style === 1) {
      return ScrollWallGlowMaterial;
    } else {
      return ScrollWallGlowMaterial2;
    }
  }

  destroy() {
    if (this.primitive) {
      this.viewer.scene.primitives.remove(this.primitive);
      delete this.primitive;
    }

    for (let i in this) {
      delete this[i];
    }
  }
}
