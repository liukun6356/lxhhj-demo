import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";

//粒子效果封装，方便控制。
export class ParticleSystemEx {
  //========== 构造方法 ==========

  constructor(viewer, options) {
    if (!viewer) return;

    this.viewer = viewer;
    this.options = options;

    this.viewer.clock.shouldAnimate = true;

    //一些临时数据
    this.emitterModelMatrix = new Cesium.Matrix4();
    this.translation = new Cesium.Cartesian3();
    this.rotation = new Cesium.Quaternion();
    this.hpr = new Cesium.HeadingPitchRoll();
    this.trs = new Cesium.TranslationRotationScale();

    //内部属性
    this.position = options.position; //中心点位置
    this._show = Cesium.defaultValue(options.show, true);
    this._maxHeight = Cesium.defaultValue(options.maxHeight, 5000);
    this.gravity = Cesium.defaultValue(options.gravity, 0); //重力因子，会修改速度矢量以改变方向或速度（基于物理的效果）

    this.transX = Cesium.defaultValue(options.transX, 0);
    this.transY = Cesium.defaultValue(options.transY, 0);
    this.transZ = Cesium.defaultValue(options.transZ, 0);

    this.target = Cesium.defaultValue(options.target, new Cesium.Cartesian3(0, 0, 0)); //粒子的方向

    this._init(options);
  }

  //========== 对外属性 ==========
  //显示隐藏
  get show() {
    return this._show;
  }
  set show(val) {
    this._show = val;
    if (this.particleSystem) this.particleSystem.show = this._show;
  }

  //修改Image大小
  get particleSize() {
    return this.particleSize || 25;
  }
  set particleSize(particleSize) {
    if (!this.particleSystem) return;

    this.particleSystem.minimumImageSize.x = particleSize;
    this.particleSystem.minimumImageSize.y = particleSize;
    this.particleSystem.maximumImageSize.x = particleSize;
    this.particleSystem.maximumImageSize.y = particleSize;
  }

  //========== 方法 ==========
  _init(options) {
    //默认值
    var viewModel = {
      startColor: Cesium.Color.LIGHTCYAN.withAlpha(0.3), //粒子出生时的颜色
      endColor: Cesium.Color.WHITE.withAlpha(0.0), //当粒子死亡时的颜色

      imageSize: new Cesium.Cartesian2(25, 25), //粒子图片的Size大小（单位：像素）
      // scale:1.0,//粒子的比例
      startScale: 2.0, //粒子在出生时的比例（单位：相对于imageSize大小的倍数）
      endScale: 4.0, //粒子在死亡时的比例（单位：相对于imageSize大小的倍数）

      // particleLife:1.1, //粒子存在的时间（单位：秒）
      minimumParticleLife: 1.1, //粒子可能存在的最短寿命时间，实际寿命将随机生成（单位：秒）
      maximumParticleLife: 3.1, //粒子可能存在的最长寿命时间，实际寿命将随机生成（单位：秒）

      // speed:1.0,//粒子初速度
      minimumSpeed: 1.0, //粒子初速度的最小界限，超过该最小界限，随机选择粒子的实际速度。（单位：米/秒）
      maximumSpeed: 2.0, //粒子初速度的最大界限，超过该最大界限，随机选择粒子的实际速度。（单位：米/秒）

      emissionRate: 100, //粒子发射器的发射速率 （单位：次/秒）

      loop: true, //是否循环
      lifetime: 16.0, //生命周期（单位：秒）

      // bursts: [//而粒子会在5s、10s、15s时分别进行一次粒子大爆发
      //     new Cesium.ParticleBurst({ time: 5.0, minimum: 10, maximum: 100 }),  // 当在5秒时，发射的数量为10-100
      //     new Cesium.ParticleBurst({ time: 10.0, minimum: 50, maximum: 100 }), // 当在10秒时，发射的数量为50-100
      //     new Cesium.ParticleBurst({ time: 15.0, minimum: 200, maximum: 300 })  // 当在15秒时，发射的数量为200-300
      // ],
      emitter: new Cesium.CircleEmitter(2.0), //此系统的粒子发射器(指定方向)，  共有 圆形、锥体、球体、长方体 ( BoxEmitter,CircleEmitter,ConeEmitter,SphereEmitter ) 几类

      modelMatrix: this._computeModelMatrix(this.viewer.clock.currentTime), // 4x4转换矩阵，可将粒子系统从模型转换为世界坐标
      emitterModelMatrix: this._computeEmitterModelMatrix(this), // 4x4转换矩阵，用于在粒子系统本地坐标系中转换粒子系统发射器
      show: this._show
    };

    if (Cesium.defaultValue(options.hasDefUpdate, true)) {
      var that = this;
      //回调函数，参数是(particle,dt)，分别是单个粒子的属性和两次发射之间的时间间隔(单位:s)
      // eslint-disable-next-line no-inner-declarations
      function applyGravity(particle, dt) {
        var translatCar3 = that.target.clone();

        var position = particle.position;
        Cesium.Cartesian3.add(particle.position, translatCar3, particle.position);

        var gravityScratch = new Cesium.Cartesian3();

        Cesium.Cartesian3.normalize(position, gravityScratch);
        Cesium.Cartesian3.multiplyByScalar(gravityScratch, that.gravity * dt, gravityScratch);
        particle.velocity = Cesium.Cartesian3.add(
          particle.velocity,
          gravityScratch,
          particle.velocity
        );
      }
      viewModel.updateCallback = applyGravity;
    }

    for (var key in options) {
      var value = options[key];
      switch (key) {
        default:
          //直接赋值
          viewModel[key] = value;
          break;
        case "position": //跳过扩展其他属性的参数
        case "modelMatrix":
        case "gravity":
          break;
        case "particleSize":
          viewModel.imageSize = new Cesium.Cartesian2(value, value);
          break;
      }
    }

    //构造粒子对象
    this.particleSystem = this.viewer.scene.primitives.add(new Cesium.ParticleSystem(viewModel));

    this.viewer.scene.preUpdate.addEventListener(this._scene_preUpdateHandler, this);

    //加控制，只在相机高度低于一定高度时才开启本效果
    this.viewer.scene.camera.changed.addEventListener(this._camera_changedHandler, this);
  }
  _scene_preUpdateHandler(scene, time) {
    if (!this.particleSystem) return;

    this.particleSystem.modelMatrix = this._computeModelMatrix(time);
    this.particleSystem.emitterModelMatrix = this._computeEmitterModelMatrix(this);
  }
  _computeModelMatrix(time) {
    if (this.position) {
      var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);
      // var hprRotation = Cesium.Matrix3.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(2.619729, 0.0, 0.0));
      // var hpr = Cesium.Matrix4.fromRotationTranslation(hprRotation, new Cesium.Cartesian3(0.0, 0.0, -2.0));
      // Cesium.Matrix4.multiply(modelMatrix, hpr, modelMatrix);
      return modelMatrix;
    } else if (this.options.modelMatrix) {
      return this.options.modelMatrix(time);
    }
  }
  _computeEmitterModelMatrix(that) {
    that.hpr = Cesium.HeadingPitchRoll.fromDegrees(0, 0, 0, that.hpr);
    that.trs.translation = Cesium.Cartesian3.fromElements(
      that.transX,
      that.transY,
      that.transZ,
      that.translation
    );
    that.trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(that.hpr, that.rotation);

    Cesium.Matrix4.fromTranslationRotationScale(that.trs, that.emitterModelMatrix);

    // var translatCar3 = new Cesium.Cartesian3(-2, -2, 2);
    // Cesium.Matrix4.multiplyByTranslation(that.emitterModelMatrix, translatCar3, that.emitterModelMatrix);
    return that.emitterModelMatrix;
  }

  _camera_changedHandler(event) {
    if (this.viewer.camera.positionCartographic.height < this._maxHeight) {
      if (this.particleSystem.show != this._show) this.particleSystem.show = this._show;
    } else {
      if (this.particleSystem.show) this.particleSystem.show = false;
    }
  }

  //销毁
  destroy() {
    this.viewer.scene.preUpdate.removeEventListener(this._scene_preUpdateHandler, this);
    this.viewer.scene.camera.changed.removeEventListener(this._camera_changedHandler, this);

    this.viewer.scene.primitives.remove(this.particleSystem);

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
