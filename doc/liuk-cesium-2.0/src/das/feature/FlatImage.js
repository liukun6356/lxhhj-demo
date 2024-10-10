import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import FlatImageMaterial from "../shaders/Materials/FlatImageMaterial.glsl";

//平放的图片（图片随地图缩放）
export class FlatImage extends DasClass {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(options);

    this.viewer = viewer;
    this.options = options || {};

    this.size = Cesium.defaultValue(options.size, 50);
    this._show = Cesium.defaultValue(options.show, true);

    //
    var primitiveCollection = new Cesium.PrimitiveCollection();
    primitiveCollection.show = this._show;
    this.viewer.scene.primitives.add(primitiveCollection);

    this.primitiveCollection = primitiveCollection;

    if (options.data) this.init(options.data);
  }

  //========== 对外属性 ==========
  //数据
  get data() {
    return this.options.data;
  }
  set data(val) {
    this.options.data = val;
    this.init(val);
  }

  //数据
  get show() {
    return this._show;
  }
  set show(val) {
    this._show = val;
    if (this.primitiveCollection) this.primitiveCollection.show = this._show;
  }

  //========== 方法 ==========
  init(arrdata) {
    this.clear();

    for (let i = 0, len = arrdata.length; i < len; i++) {
      var item = arrdata[i];
      var primitive = this.createPrimitive(item, item.size || this.size);
      this.primitiveCollection.add(primitive);
    }
  }

  createPrimitive(item, size) {
    const mat4 = Cesium.Transforms.eastNorthUpToFixedFrame(item.position);

    let mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(item.angle));
    let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
    Cesium.Matrix4.multiply(mat4, rotationZ, mat4);

    const vertices = new Float64Array([
      //顶点坐标
      -size,
      -size,
      0,
      size,
      -size,
      0,
      size,
      size,
      0,
      -size,
      size,
      0
    ]);
    const st = new Float32Array([
      //纹理坐标
      0.0,
      0.0,
      1.0,
      0.0,
      1.0,
      1.0,
      0.0,
      1.0
    ]);
    //let positions=new Float64Array;
    const attributes = new Cesium.GeometryAttributes();
    const indices = new Uint16Array(6); //顶点索引
    indices[0] = 0;
    indices[1] = 1;
    indices[2] = 2;
    indices[3] = 0;
    indices[4] = 2;
    indices[5] = 3;
    attributes.position = new Cesium.GeometryAttribute({
      //顶点attributes
      componentDatatype: Cesium.ComponentDatatype.DOUBLE,
      componentsPerAttribute: 3,
      values: vertices
    });
    attributes.st = new Cesium.GeometryAttribute({
      componentDatatype: Cesium.ComponentDatatype.FLOAT,
      componentsPerAttribute: 2,
      values: st
    });
    //自定义几何图形时，使用图片纹理，需要自己设置st,normal属性
    const rect = new Cesium.Geometry({
      attributes: attributes,
      primitiveType: Cesium.PrimitiveType.TRIANGLES,
      indices: indices,
      boundingSphere: Cesium.BoundingSphere.fromVertices(vertices)
    });
    Cesium.GeometryPipeline.computeNormal(rect);
    const instance = new Cesium.GeometryInstance({
      geometry: rect,
      modelMatrix: mat4,
      id: "flatImage"
    });

    const primitive = new Cesium.Primitive({
      geometryInstances: [instance],
      appearance: new Cesium.MaterialAppearance({
        flat: true,
        material: new Cesium.Material({
          fabric: {
            uniforms: {
              image: item.image,
              speed: 0.0
            },
            source: FlatImageMaterial
          }
        }),
        materialSupport: Cesium.MaterialAppearance.MaterialSupport.TEXTURED
      }),
      compressVertices: false,
      asynchronous: false
    });

    primitive.tooltip = item.tooltip;
    primitive.popup = item.popup;
    primitive.eventTarget = this;

    // let speed = 0.0;
    // const setIntervalID = setInterval(function () {//如果使用scene.preUpdate等帧刷新，则图片不显示
    //     if (speed <= 1.0) {
    //         speed += 0.05;
    //     } else {
    //         clearInterval(setIntervalID);
    //         speed = 0.0
    //     }
    //     primitive.appearance.material.uniforms.speed = speed;
    // }, 500)

    return primitive;
  }

  clear() {
    this.primitiveCollection.removeAll();
  }

  destroy() {
    this.clear();
    this.viewer.scene.primitives.remove(this.primitiveCollection);

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}

//[静态属性]本类中支持的事件类型常量
FlatImage.event = {
  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};
