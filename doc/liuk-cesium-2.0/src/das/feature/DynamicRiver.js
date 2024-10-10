import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import { isArray } from "../util/util";
import * as daslog from "../util/log";
import { Draw } from "../draw/Draw";
import DynamicRiverFS from "../shaders/DynamicRiverFS.glsl";
import DynamicRiverVS from "../shaders/DynamicRiverVS.glsl";
import DynamicRiverMaterial from "../shaders/Materials/DynamicRiverMaterial.glsl";

//动态河流、公路
export class DynamicRiver extends DasClass {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    super(options);

    this.viewer = viewer;

    options = options || {};
    this.options = options;

    this._positions = Cesium.defaultValue(options.positions, null);

    this._image = Cesium.defaultValue(options.image, null); //贴图路径
    this._flipY = Cesium.defaultValue(options.flipY, false); //uv交换（图片横竖切换）
    this._width = Cesium.defaultValue(options.width, 10); //宽度
    this._height = Cesium.defaultValue(options.height, 0); //拔高数值
    this._alpha = Cesium.defaultValue(options.alpha, 0.5); //透明度
    this._speed = Cesium.defaultValue(options.speed, 1.0); //流动速度

    this._move = Cesium.defaultValue(options.move, true); //是否开启流动效果
    this._moveDir = Cesium.defaultValue(options.moveDir, true); //设置流动方向
    this._moveVar = Cesium.defaultValue(options.moveVar, new Cesium.Cartesian3(50, 1, 100)); //流动动画参数，不建议调整该参数

    this.resetPos();
  }

  //========== 对外属性 ==========
  get positions() {
    return this._positions;
  }
  set positions(val) {
    this.setPositions(val);
  }

  get width() {
    return this._width;
  }
  set width(val) {
    this._width = Number(val) || 1;
    this.resetPos();
  }

  get height() {
    return this._height;
  }
  set height(val) {
    this._height = Number(val);
    this.resetPos();
  }

  get alpha() {
    return this._alpha;
  }
  set alpha(val) {
    this._alpha = Number(val);
    this.material.uniforms.alpha = this._alpha;
  }

  get moveDir() {
    return this._moveDir;
  }
  set moveDir(val) {
    this._moveDir = Boolean(val);
    this.material.uniforms.reflux = this._moveDir ? -1 : 1;
  }

  get speed() {
    return this._speed;
  }
  set speed(val) {
    this._speed = Number(val) || 1;
    this.material.uniforms.speed = this._speed;
  }
  get image() {
    return this._image;
  }
  set image(str) {
    this._image = str;
    this.material.uniforms.image = this._image;
  }

  get move() {
    return this._move;
  }
  set move(val) {
    this._move = Boolean(val);
    this.material.uniforms.move = this._move;
  }

  get flipY() {
    return this._flipY;
  }
  set flipY(val) {
    this._flipY = Boolean(val);
    this.material.uniforms.flipY = this._flipY;
  }

  get moveVar() {
    return this._moveVar;
  }
  set moveVar(val) {
    this._moveVar = val;
    this.material.uniforms.moveVar = this._moveVar;
  }

  //========== 方法 ==========

  resetPos() {
    if (this.riverPrimitive) {
      this.viewer.scene.primitives.remove(this.riverPrimitive);
      delete this.riverPrimitive;
    }

    if (!isArray(this._positions) || !this._positions.length) return;

    this.sideRes = Lines2Plane(this._positions, this.width, this.height);
    if (!this.sideRes) return;

    this.material = this.prepareMaterial();
    this.riverPrimitive = this.createPrimitive();
    this.viewer.scene.primitives.add(this.riverPrimitive);
  }

  drawLines(style) {
    if (!this.drawControl) {
      this.drawControl = new Draw(this.viewer, {
        hasEdit: false,
        removeScreenSpaceEvent: true
      });
    }
    var control = this.drawControl;

    var that = this;
    control.startDraw({
      type: "polyline",
      style: style || {
        color: "#55ff33",
        width: 3,
        clampToGround: true
      },
      success: function(entity) {
        var positions = that.drawControl.getPositions(entity);
        that.setPositions(positions);
        that.drawControl.deleteAll();
      }
    });
  }

  setPositions(positions) {
    this._positions = positions;
    this.resetPos();
  }

  prepareMaterial() {
    var material;
    if (this.image) {
      material = new Cesium.Material({
        fabric: {
          uniforms: {
            image: this.image,
            alpha: this.alpha,
            moveVar: this.moveVar,
            reflux: this.moveDir ? -1 : 1,
            speed: this.speed,
            move: this.move,
            flipY: this.flipY
          },
          source: DynamicRiverMaterial
        }
      });
    } else {
      material = Cesium.Material.fromType("Color");
      material.uniforms.color = new Cesium.Color(0.0, 1.0, 0.0, this.alpha);
    }
    return material;
  }
  createPrimitive() {
    //创建图元
    var sides = this.sideRes;
    var positions = new Float64Array(sides.vertexs);
    var attributes = new Cesium.GeometryAttributes();
    attributes.position = new Cesium.GeometryAttribute({
      componentDatatype: Cesium.ComponentDatatype.DOUBLE,
      componentsPerAttribute: 3,
      values: positions
    });
    attributes.st = new Cesium.GeometryAttribute({
      componentDatatype: Cesium.ComponentDatatype.FLOAT,
      componentsPerAttribute: 2,
      values: sides.uvs
    });
    var geometry = new Cesium.Geometry({
      attributes: attributes,
      indices: sides.indexs,
      primitiveType: Cesium.PrimitiveType.TRIANGLES,
      boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
    });
    // geometry._workerName = ""

    var instance = new Cesium.GeometryInstance({
      geometry: geometry
    });
    var renderState = new Cesium.RenderState();
    renderState.depthTest.enabled = true;

    var primitive = new Cesium.Primitive({
      geometryInstances: instance,
      appearance: new Cesium.Appearance({
        material: this.material,
        renderState: renderState,
        vertexShaderSource: DynamicRiverVS,
        fragmentShaderSource: DynamicRiverFS //czm_lightDirectionEC在cesium1.66开始加入的
      })
    });
    primitive.eventTarget = this;
    primitive.popup = this.options.popup;
    primitive.tooltip = this.options.tooltip;
    return primitive;
  }

  offsetHeight(height, time) {
    if (!height || !time || !this.riverPrimitive) return;
    var that = this;
    var currH = 0;
    var avgF = 20; //平均每帧20毫秒，即每秒50帧；
    var avgH = height / (time * avgF);

    var selfV = this.sideRes.self;
    var totalN = new Cesium.Cartesian3();
    for (var i = 0, len = selfV.length; i < len; i++) {
      //求平均的法线
      var currN = Cesium.Cartesian3.normalize(selfV[i], new Cesium.Cartesian3());
      Cesium.Cartesian3.add(totalN, currN, totalN);
    }
    Cesium.Cartesian3.normalize(totalN, totalN);

    var initM = Cesium.clone(this.riverPrimitive.modelMatrix);

    this.dhEvent = function() {
      if (Math.abs(currH) <= Math.abs(height)) {
        //可以升高，可以降低，height可以为负值
        var currNor = Cesium.Cartesian3.multiplyByScalar(totalN, currH, new Cesium.Cartesian3());
        that.riverPrimitive.modelMatrix = Cesium.Matrix4.multiplyByTranslation(
          initM,
          currNor,
          new Cesium.Matrix4()
        );
      } else {
        that.viewer.clock.onTick.removeEventListener(that.dhEvent);
      }
      currH += avgH;
    };
    this.viewer.clock.onTick.addEventListener(this.dhEvent);
  }

  //销毁
  destroy() {
    this.viewer.scene.primitives.remove(this.riverPrimitive);

    if (this.drawControl) {
      this.drawControl.destroy();
      delete this.drawControl;
    }
    this.material.destroy();

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}

//[静态属性]本类中支持的事件类型常量
DynamicRiver.event = {
  click: eventType.click,
  mouseOver: eventType.mouseOver,
  mouseOut: eventType.mouseOut
};

export function Lines2Plane(lineArr, width, height) {
  if (!lineArr || lineArr.length <= 1 || !width || width == 0) {
    daslog.warn("请确认参数符合规则：数组长度大于1，宽高不能为0！", lineArr);
    return;
  }
  let len = lineArr.length;
  let leftPots = [];
  let rightPots = [];
  let halfW = width / 2.0;
  for (let i = 0; i < len; i++) {
    let prevP;
    let currP;
    let nextP;
    let leftPot;
    let rightPot;
    if (i == 0) {
      prevP = lineArr[i];
      currP = lineArr[i];
      nextP = lineArr[i + 1];
    } else if (i == len - 1) {
      prevP = lineArr[i - 1];
      currP = lineArr[i];
      nextP = lineArr[i - 1];
    } else {
      prevP = lineArr[i - 1];
      currP = lineArr[i];
      nextP = lineArr[i + 1];
    }

    if (height != 0) {
      prevP = RaisePoint(prevP, height);
      currP = RaisePoint(currP, height);
      nextP = RaisePoint(nextP, height);
    }

    if (prevP && currP && nextP) {
      let sides = GetSides(currP, nextP, halfW);
      leftPot = sides.left;
      rightPot = sides.right;

      if (i == 0) {
        leftPots.push(leftPot);
        rightPots.push(rightPot);
        leftPots.push(leftPot);
        rightPots.push(rightPot);
        continue;
      } else {
        if (i < len - 1) {
          leftPots.push(leftPot);
          rightPots.push(rightPot);
        } else {
          leftPots.push(rightPot);
          rightPots.push(leftPot);
          leftPots.push(rightPot);
          rightPots.push(leftPot);
          continue;
        }
      }

      sides = GetSides(currP, prevP, halfW);
      leftPot = sides.left;
      rightPot = sides.right;
      leftPots.push(rightPot);
      rightPots.push(leftPot);
    }
  }
  // return {
  //     left:leftPots,
  //     right:rightPots,
  //     self:lineArr
  // }

  let leftPotsRes = [];
  let rightPotsRes = [];
  if (leftPots.length == len * 2) {
    for (let i = 0; i < len; i++) {
      let CurrP = lineArr[i];

      let lf1 = leftPots[i * 2 + 0];
      let lf2 = leftPots[i * 2 + 1];
      let dir1 = Cesium.Cartesian3.subtract(lf1, CurrP, new Cesium.Cartesian3());
      let dir2 = Cesium.Cartesian3.subtract(lf2, CurrP, new Cesium.Cartesian3());
      let avgDir = Cesium.Cartesian3.add(dir1, dir2, new Cesium.Cartesian3());
      let avgPot = Cesium.Cartesian3.add(CurrP, avgDir, new Cesium.Cartesian3());
      leftPotsRes.push(Cesium.clone(avgPot));

      let rg1 = rightPots[i * 2 + 0];
      let rg2 = rightPots[i * 2 + 1];
      dir1 = Cesium.Cartesian3.subtract(rg1, CurrP, new Cesium.Cartesian3());
      dir2 = Cesium.Cartesian3.subtract(rg2, CurrP, new Cesium.Cartesian3());
      avgDir = Cesium.Cartesian3.add(dir1, dir2, new Cesium.Cartesian3());
      avgPot = Cesium.Cartesian3.add(CurrP, avgDir, new Cesium.Cartesian3());
      rightPotsRes.push(Cesium.clone(avgPot));
    }
  } else {
    daslog.warn("计算左右侧点出问题！");
    return;
  }

  var uvs = [];
  let vertexs = [];
  let vertexsH = [];
  let vertexsL = [];
  var indexs = [];

  //先记录右边点，后记录左边点、记录2遍为了分离UV
  for (let i = 0; i < len; i++) {
    let encodeRes = Cesium.EncodedCartesian3.fromCartesian(rightPotsRes[i]);
    vertexs.push(rightPotsRes[i].x);
    vertexs.push(rightPotsRes[i].y);
    vertexs.push(rightPotsRes[i].z);

    vertexsH.push(encodeRes.high.x);
    vertexsH.push(encodeRes.high.y);
    vertexsH.push(encodeRes.high.z);

    vertexsL.push(encodeRes.low.x);
    vertexsL.push(encodeRes.low.y);
    vertexsL.push(encodeRes.low.z);

    uvs.push(1, 1);

    //记录索引以及UV
    if (i < len - 1) {
      indexs.push(i + len * 2);
      indexs.push(i + 1);
      indexs.push(i + 1 + len);

      indexs.push(i + len * 2);
      indexs.push(i + 1 + len);
      indexs.push(len + i + len * 2);
    }
  }
  for (let i = 0; i < len; i++) {
    let encodeRes = Cesium.EncodedCartesian3.fromCartesian(leftPotsRes[i]);
    vertexs.push(leftPotsRes[i].x);
    vertexs.push(leftPotsRes[i].y);
    vertexs.push(leftPotsRes[i].z);

    vertexsH.push(encodeRes.high.x);
    vertexsH.push(encodeRes.high.y);
    vertexsH.push(encodeRes.high.z);

    vertexsL.push(encodeRes.low.x);
    vertexsL.push(encodeRes.low.y);
    vertexsL.push(encodeRes.low.z);

    uvs.push(1, 0);
  }

  for (let i = 0; i < len; i++) {
    let encodeRes = Cesium.EncodedCartesian3.fromCartesian(rightPotsRes[i]);
    vertexs.push(rightPotsRes[i].x);
    vertexs.push(rightPotsRes[i].y);
    vertexs.push(rightPotsRes[i].z);

    vertexsH.push(encodeRes.high.x);
    vertexsH.push(encodeRes.high.y);
    vertexsH.push(encodeRes.high.z);

    vertexsL.push(encodeRes.low.x);
    vertexsL.push(encodeRes.low.y);
    vertexsL.push(encodeRes.low.z);

    uvs.push(0, 1);

    // if(i<len-1){
    //     // indexs.push(i + len*2);
    //     // indexs.push(i+1 + len*2);
    //     // indexs.push(i+1+len + len*2);

    //     // indexs.push(i + len*2);
    //     // indexs.push(i+1+len + len*2);
    //     // indexs.push(len+i + len*2);
    // }
  }
  for (let i = 0; i < len; i++) {
    let encodeRes = Cesium.EncodedCartesian3.fromCartesian(leftPotsRes[i]);
    vertexs.push(leftPotsRes[i].x);
    vertexs.push(leftPotsRes[i].y);
    vertexs.push(leftPotsRes[i].z);

    vertexsH.push(encodeRes.high.x);
    vertexsH.push(encodeRes.high.y);
    vertexsH.push(encodeRes.high.z);

    vertexsL.push(encodeRes.low.x);
    vertexsL.push(encodeRes.low.y);
    vertexsL.push(encodeRes.low.z);

    uvs.push(0, 0);
  }

  return {
    left: leftPotsRes,
    right: rightPotsRes,
    self: lineArr,
    vertexs: new Float32Array(vertexs),
    vertexsH: new Float32Array(vertexsH),
    vertexsL: new Float32Array(vertexsL),
    indexs: new Uint16Array(indexs),
    uvs: new Float32Array(uvs)
  };
}

function RaisePoint(pot, height) {
  if (!(pot instanceof Cesium.Cartesian3)) {
    daslog.warn("请确认点是Cartesian3类型！");
    return;
  }
  if (!height || height == 0) {
    daslog.warn("请确认高度是非零数值！");
    return;
  }
  var dir = Cesium.Cartesian3.normalize(pot, new Cesium.Cartesian3());
  let ray = new Cesium.Ray(pot, dir);
  return Cesium.Ray.getPoint(ray, height);
}

function GetSides(firstP, sceondP, halfW) {
  let dir = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.subtract(sceondP, firstP, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  let nor = Cesium.Cartesian3.normalize(firstP, new Cesium.Cartesian3());
  let leftDir = Cesium.Cartesian3.cross(nor, dir, new Cesium.Cartesian3());
  let rightDir = Cesium.Cartesian3.cross(dir, nor, new Cesium.Cartesian3());
  let leftray = new Cesium.Ray(firstP, leftDir);
  let rightray = new Cesium.Ray(firstP, rightDir);
  let leftPot = Cesium.Ray.getPoint(leftray, halfW);
  let rightPot = Cesium.Ray.getPoint(rightray, halfW);
  return {
    left: leftPot,
    right: rightPot
  };
}
