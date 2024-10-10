import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import { addPositionsHeight } from "../util/point";

import ConeGlowCircleOuterMaterial from "../shaders/Materials/ConeGlowCircleOuterMaterial.glsl";
import ConeGlowCylinderGaussMaterial from "../shaders/Materials/ConeGlowCylinderGaussMaterial.glsl";
import ConeGlowGradientMaterial from "../shaders/Materials/ConeGlowGradientMaterial.glsl";
import ConeGlowRingScanMaterial from "../shaders/Materials/ConeGlowRingScanMaterial.glsl";

//光柱
export class ConeGlow extends DasClass {
  constructor(viewer, options) {
    super(options);

    this.viewer = viewer;
    this.options = options;

    this.position = options.position; //中心点
    this.extrudedHeight = Cesium.defaultValue(options.height, 1000);
    this.u_color = Cesium.defaultValue(options.color, Cesium.Color.fromCssColorString("#00ffff"));
    this._show = Cesium.defaultValue(options.show, true);
    this._distanceDisplayCondition = Cesium.defaultValue(
      options.distanceDisplayCondition,
      new Cesium.DistanceDisplayConditionGeometryInstanceAttribute()
    );

    var radius = Cesium.defaultValue(options.radius, 100);

    this.topRadius = radius / 100.0;
    this.topRadius = this.topRadius > 1.0 ? 1.0 : this.topRadius;
    this.inner_controlPoints = getCirclePosition(this.position, radius * 0.7);
    this.outer_controlPoints = getCirclePosition(this.position, radius); //计算底部外圈
    this.circular_clone_topPoints = getCirclePosition(this.position, this.topRadius); //计算顶部
    this.circlePoints_2 = getCirclePosition(this.position, radius * 2); //计算顶部

    this.primitive1 = null; //外圈
    this.primitive2 = null; //内圈
    this.primitive3 = null; //底部圆
    this.primitive4 = null; //底部放大钰圆环

    this.ringCanvas = this.drawRingCanvas();
    this.gradientCircleCanvas = this.cirdrawGradientCircleCanvas();

    //兼容直接传入单击回调方法，适合简单场景下使用。
    if (options.click) {
      this.on(eventType.click, options.click);
    }

    this.draw();
  }

  //========== 对外属性 ==========
  get show() {
    return this._show;
  }
  set show(value) {
    this._show = value;

    if (this.primitive1) {
      this.primitive1.show = value;
    }
    if (this.primitive2) {
      this.primitive2.show = value;
    }
    if (this.primitive3) {
      this.primitive3.show = value;
    }
    if (this.primitive4) {
      this.primitive4.show = value;
    }
  }

  get popup() {
    return this.options.popup;
  }
  set popup(value) {
    this.options.popup = value;

    if (this.primitive1) {
      this.primitive1.popup = value;
    }
    if (this.primitive2) {
      this.primitive2.popup = value;
    }
    if (this.primitive3) {
      this.primitive3.popup = value;
    }
    if (this.primitive4) {
      this.primitive4.popup = value;
    }
  }

  get tooltip() {
    return this.options.tooltip;
  }
  set tooltip(value) {
    this.options.tooltip = value;

    if (this.primitive1) {
      this.primitive1.tooltip = value;
    }
    if (this.primitive2) {
      this.primitive2.tooltip = value;
    }
    if (this.primitive3) {
      this.primitive3.tooltip = value;
    }
    if (this.primitive4) {
      this.primitive4.tooltip = value;
    }
  }

  //========== 方法 ==========

  draw() {
    this.getParticleImage(() => {
      this.addOuter(); //外圈
    });

    this.addInner(); //内圈
    this.addCircle(); //底部圆
    this.addRing(); //底部放大钰圆环
  }

  //添加绘制外圈粒子效果
  addOuter() {
    let side_instances = createCylinderInstance(
      this.outer_controlPoints,
      this.circular_clone_topPoints,
      {
        height: this.extrudedHeight,
        distanceDisplayCondition: this._distanceDisplayCondition
      }
    );
    this.primitive1 = new Cesium.Primitive({
      geometryInstances: side_instances,
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
          fabric: {
            uniforms: {
              u_color: this.u_color,
              image: this.image
            },
            source: ConeGlowCircleOuterMaterial
          }
        })
      }),
      asynchronous: false
    });
    this.primitive1.tooltip = this.options.tooltip;
    this.primitive1.popup = this.options.popup;
    this.primitive1.eventTarget = this;
    this.viewer.scene.primitives.add(this.primitive1);
  }

  //添加绘制内圈圆柱闪烁效果
  addInner() {
    let side_instances = createCylinderInstance(
      this.inner_controlPoints,
      this.circular_clone_topPoints,
      {
        height: this.extrudedHeight,
        color: this.v_color,
        distanceDisplayCondition: this._distanceDisplayCondition
      }
    );
    let a = new Cesium.EllipsoidSurfaceAppearance({
      material: new Cesium.Material({
        //translucent:false,
        fabric: {
          uniforms: {
            u_color: this.u_color
          },
          source: ConeGlowCylinderGaussMaterial
        }
      })
    });
    this.primitive2 = new Cesium.Primitive({
      geometryInstances: side_instances,
      appearance: a,
      asynchronous: false
    });
    this.primitive2.tooltip = this.options.tooltip;
    this.primitive2.popup = this.options.popup;
    this.primitive2.eventTarget = this;
    this.primitive2.show = this._show;
    this.viewer.scene.primitives.add(this.primitive2);
  }

  //绘制底部圆
  addCircle() {
    let carto = Cesium.Cartographic.fromCartesian(this.position);
    let instance = createCircleInstance(this.circlePoints_2, {
      perPositionHeight: carto.height >= 1,
      distanceDisplayCondition: this._distanceDisplayCondition
    });
    this.primitive3 = new Cesium.Primitive({
      geometryInstances: instance,
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
          fabric: {
            uniforms: {
              u_color: this.u_color,
              image: this.gradientCircleCanvas
            },
            source: ConeGlowGradientMaterial
          }
        })
      }),
      asynchronous: false
    });

    this.primitive3.tooltip = this.options.tooltip;
    this.primitive3.popup = this.options.popup;
    this.primitive3.eventTarget = this;
    this.primitive3.show = this._show;
    this.viewer.scene.primitives.add(this.primitive3);
  }

  //添加绘制底部扩散圆环
  addRing() {
    let carto = Cesium.Cartographic.fromCartesian(this.position);
    let instance = createCircleInstance(this.circlePoints_2, {
      perPositionHeight: carto.height >= 1,
      distanceDisplayCondition: this._distanceDisplayCondition
    });
    this.primitive4 = new Cesium.Primitive({
      geometryInstances: instance,
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
          fabric: {
            uniforms: {
              u_color: this.u_color,
              image: this.ringCanvas
            },
            source: ConeGlowRingScanMaterial
          }
        })
      }),
      asynchronous: false
    });

    this.primitive4.tooltip = this.options.tooltip;
    this.primitive4.popup = this.options.popup;
    this.primitive4.eventTarget = this;
    this.primitive4.show = this._show;
    this.viewer.scene.primitives.add(this.primitive4);
  }

  destroy() {
    if (this.primitive1) {
      this.viewer.scene.primitives.remove(this.primitive1);
    }
    if (this.primitive2) {
      this.viewer.scene.primitives.remove(this.primitive2);
    }
    if (this.primitive3) {
      this.viewer.scene.primitives.remove(this.primitive3);
    }
    if (this.primitive4) {
      this.viewer.scene.primitives.remove(this.primitive4);
    }
    super.destroy();
  }

  //================材质贴图Canvas ====================
  //画粒子图
  getParticleImage(callback) {
    let image = new Image();
    image.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAEACAYAAADSoXR2AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjExQTg0NDEyMDEzQjExRUFBNDhBRjhGMUMzOUUyNTU0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjExQTg0NDEzMDEzQjExRUFBNDhBRjhGMUMzOUUyNTU0Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MTFBODQ0MTAwMTNCMTFFQUE0OEFGOEYxQzM5RTI1NTQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MTFBODQ0MTEwMTNCMTFFQUE0OEFGOEYxQzM5RTI1NTQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz41vRwAAAAE90lEQVR42uydyW4UMRCG3T2dgYSAEGs4sp44cCJBcGUJbwCvALwWPAI8ABwAiUVwgLBdkEikJEiAGMhkZqhfU1aa1sy0g+yaJPyWSupOpPjz0uVyucrJer2eG2fJ3ZgLAQhAgC0PgN8XIlkqgGLE75oih0WmRVZEvop0rHog18rnRe6IzInsthyCXFt+TuSKyGmRXZZDgK5eFrkv8l7kiUhrxN/JSo3pigSvcNmI1bCh3b5LK2+NqHyvyEF9x3z5HgqRRViOAXhW5JrCoNdei/y20gMYxhmRSyIXRY6JTMT4DENLW+SdyD19x/NajDmwmYIW79Hnn+MA4GJEAAIQgABJbMJB+n5Sl9zWZvR9DABUfkJkVt8fi3zUldAEoKl24Y2S1fPZEmBdZFHkkb4vxTLRQ5djbyUf0ncYrD/UADUB8MZno2Q19yx7gIqIAAQgAAEIQIAtYZT+85LvRnjQCoPKR3rQUgN4Y3ZeK30g8qps0qeeAzDn4TWD9+ySG+BBS90DaGnVg9a2tgnR4il9/jkOACoiAhCAAASIZpAAFl6yulO0JACo/IDrn6CedP1zxOciv6wAYNnAP3RVBeWtJQCWzG8iL/X9g4vkqNzMctzUXtintt2KM/aS+bmQaY90rb8CF6tSKiICEIAABCAAAQiwbfcFIWVCbUcc9bZDLKiYAKj4uOv7Bb+ILLj+8W7PCgC7Jhzv44Qdh9yrru8V61jPgd645gD2io+15RiC5ZA5ENNPmGmDmtrta9YAVEQE2FlrQUM/J6efU8cSAD87ojodBaccS6kgiiErGiq/qe93XT+3oGU5BJnbyKrIUs6BQZoQUEcrQ7CYagiGqeKiMgnXLXsg5uJUm/RQJKy8fGS7PMw6SgVQPrJFGZr0kCfUL/7IFjIzrLGpemBQ0kPbehL6I9vMjUh6oEVEAAIQgAAEIAABdpyj0qcK71YrqGUJANNrv+sHOcAiRpDDM1cTY1BEHk7kqyP/2Ac5vLEEQEG8aDnIoTb5ObZRWg5ywG5o1dX4ClNYxT7IISgJPsXGpLut9MCWU0S5bqkmdAa3LQEwcZDAfkZ3tthQfkwNkVeeD6kiuaUabcp6DpS9YyalrAdQ8bT1EFQVUabarND9fNuyB2gREYAABCAAAQhAAAIQoM770UgBXARCIr/koDogVlzgrWuxemBKd0m4JnBed0+5ZQ9gn3BK5LK+P4y5ewoB8DFiKO91COLFfwVuTCZV1hSoYw1APZCsFIkbN1Haaa87wwiKQe6eT27AEX6esPVVd8/kOOdAz/oz9FE0p+uGIKUeqE5C8xgSKiICEIAABCAAAQhAAAIQgAAEIAABCECA6AA+sbkREyDUUYlKD6ggZwzRkr8tewBhusisv+0in5qE/hFchoZTE0TL4p8sTbtIpyahQ4Ag5fKpSVBmfdDECvQTZjoM0U9N6KgkwH9xY7PXpPiCmq5yuaLVldHIO7jgNi5XfOEhCqNh9udHV/RnC5YAUDTftdV4/ivvwEoRVS9XXPWa1FIT5ird8jpSB+BDN3rO8AaGMnGy0I0QRYTvdk6NkOsucuhGCMAgI8Q0isaHbmAevNMhiD4P6iZhstANGiQE2PEGCRo2NcgAsQDwKnxWFdlT17/duWU1BJmuHz6A5bwbEsCScgh+qAHit3Jr1oooOPExdRBLbeJjSpuwuy30AAH+CDAAPH5ltESNYl4AAAAASUVORK5CYII=";
    image.onload = function() {
      this.image = this.drawCanvas(image);
      if (callback) callback();
    }.bind(this);
  }

  drawCanvas(image) {
    let canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 256;
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 64, 256);
    ctx.drawImage(image, 0, 0);
    ctx.drawImage(image, 33, 0);
    return canvas;
  }

  //画圆环图
  drawRingCanvas() {
    let canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    let ctx = canvas.getContext("2d");

    //ctx.clearRect(0,0,512,512);
    ctx.fillStyle = "rgba(255,255,255,0)";
    ctx.strokeStyle = "rgba(255, 255, 255,255)";
    ctx.setLineDash([50, 50]);
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.arc(256, 256, 150, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.restore();
    return canvas;
  }

  //画渐变圆
  cirdrawGradientCircleCanvas() {
    let canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    let ctx = canvas.getContext("2d");

    let gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0.1, "rgba(255, 255, 255, 1.0)");
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.0)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.0)");
    gradient.addColorStop(0.9, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1.0, "rgba(255, 255, 255, 1.0)");

    ctx.clearRect(0, 0, 512, 512);
    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2, true);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    return canvas;
  }
}

//[静态属性]本类中支持的事件类型常量
ConeGlow.event = {
  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};

//创建 圆 效果
function createCircleInstance(pos, options) {
  let polygon = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(pos),
    perPositionHeight: options.perPositionHeight
  });
  return new Cesium.GeometryInstance({
    geometry: polygon,
    attributes: {
      distanceDisplayCondition: options.distanceDisplayCondition
    }
  });
}

//创建 圆锥柱体 效果
function createCylinderInstance(pts, topPts, options) {
  var height = options.height,
    color = options.color || new Cesium.Color(0.5, 0.8, 1.0, 2);

  let newpts = pts.slice();

  let length = pts.length;
  let len_2 = 2 * length;
  let sts = [];
  let st_interval = 1.0 / (length - 1);
  let define_indices = [];

  let ep = [];
  for (let i = 0; i < length; i++) {
    ep.push(addPositionsHeight(topPts[i], height));
    sts.push(i * st_interval);
    sts.push(0);

    let i_1 = i + 1;
    let i_11 = (i + 1) % length;
    let len_2_i_1 = len_2 - i_1;
    define_indices.push(...[len_2_i_1 - 1, len_2_i_1, i]); //用materialAppearance贴纹理正确
    define_indices.push(...[i, i_11, len_2_i_1 - 1]);
  }

  for (let i = 0; i < ep.length; i++) {
    newpts.push(ep[length - i - 1]);

    sts.push(1 - i * st_interval);
    sts.push(1);
  }

  let polygon = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(newpts),
    perPositionHeight: true
  });
  polygon = Cesium.PolygonGeometry.createGeometry(polygon);
  polygon.indices = define_indices;
  polygon.attributes.st.values = sts;

  return new Cesium.GeometryInstance({
    geometry: polygon,
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
      distanceDisplayCondition: options.distanceDisplayCondition
    }
  });
}

//计算圆坐标
export function getCirclePosition(center, radius, length = 120) {
  let res = [];
  let mm = Cesium.Transforms.eastNorthUpToFixedFrame(center);

  let interval = (2 * Math.PI) / length;
  let startPos = (2 * Math.PI * 270) / 360;

  for (let i = 0; i < length; i++) {
    let a = startPos - interval * i;
    let p = new Cesium.Cartesian3(Math.sin(a) * radius, Math.cos(a) * radius, 0);
    res.push(Cesium.Matrix4.multiplyByPoint(mm, p, new Cesium.Cartesian3()));
  }
  res.push(res[0]);

  return res;
}
