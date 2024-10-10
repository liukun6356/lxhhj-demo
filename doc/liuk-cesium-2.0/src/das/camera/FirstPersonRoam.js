import * as Cesium from "cesium";


//第一人称贴地漫游
export class FirstPersonRoam {
  constructor(options) {
    this.options = options;
    this.viewer = options.viewer;
    this.camera = this.viewer.camera;
    this.moveX = 0;
    this.moveY = 0;
    this.oldPosition = 0;
    this.heightType = "free"; // "fixed",//free  固定视角高度 or 自由移动
    this._rotateStep = Cesium.defaultValue(options.rotateStep, 0.05);  // 相机围绕当前点旋转速率
    this._moveStep = Cesium.defaultValue(options.moveStep, 0.5);       // 平移步长(米)
    this.scene=this.viewer.scene;
    this.canvas=this.viewer.canvas;
    this.ellipsoid=this.scene.globe.ellipsoid;
    this.element = this.viewer.container;
    this.flags = {
      looking: false,
      moveForward: false,
      moveBackward: false,
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false,
      oldHeight: 0
    }

    this.elementClickHandler = this.elementClick.bind(this);
    this.documentPointerlockchangeHandler = this.documentPointerlockchange.bind(this);
    this.documentKyeDownHandler = this.documentKyeDown.bind(this);
    this.documentKyeUpHandler = this.documentKyeUp.bind(this);
    this.preRenderListenerHandler = this.preRenderListener.bind(this);
    this.rotate3DHandler = this.rotate3D.bind(this);
  }

  //========== 方法 ==========
  init() {
    this.element.addEventListener('click', this.elementClickHandler,false);
    document.addEventListener('pointerlockchange',this.documentPointerlockchangeHandler, false);
  }
  elementClick(){
    var element=this.element;
    element.requestPointerLock();
    var scene = this.viewer.scene;
    var canvas = this.viewer.canvas;
    canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
    canvas.onclick = function () {
      canvas.focus();
    };
    //碰撞检测?
    scene.screenSpaceCameraController.enableIndoorColliDetection = true;
    scene.screenSpaceCameraController.enableRotate = false;
    scene.screenSpaceCameraController.enableTranslate = false;
    scene.screenSpaceCameraController.enableTilt = false;
    scene.screenSpaceCameraController.enableLook = false;
    //先删除事件,防止多次注册事件
    document.removeEventListener('keydown',this.documentKyeDownHandler, false);
    document.removeEventListener('keyup',this.documentKyeUpHandler, false);
    this.viewer.scene.preRender.removeEventListener(this.preRenderListenerHandler,this);
    //再添加事件
    document.addEventListener('keydown', this.documentKyeDownHandler, false);
    document.addEventListener('keyup', this.documentKyeUpHandler, false);
    this.viewer.scene.preRender.addEventListener(this.preRenderListenerHandler,this);
  }
  documentKyeDown(event){
    var flagName = this.getFlagForKeyCode(event.keyCode);
    if (typeof flagName !== 'undefined') {
      this.flags[flagName] = true;
    }
  }
  documentKyeUp(event){
    var flagName = this.getFlagForKeyCode(event.keyCode);
    if (typeof flagName !== 'undefined') {
      this.flags[flagName] = false;
    }
  }
  preRenderListener(){
    var camera = this.camera;
    var moveRate = this._moveStep;
    if (this.flags.moveForward) {
      //W
      camera.move(camera.direction, moveRate);
      //camera.moveForward(moveRate);
    }
    if (this.flags.moveBackward) {
      //S
      camera.moveBackward(moveRate);
    }
    if (this.flags.moveUp) {
      //Q
      camera.moveUp(moveRate > 2 ? 2 : moveRate);
    }
    if (this.flags.moveDown) {
      //E
      camera.moveDown(moveRate);
    }
    if (this.flags.moveLeft) {
      //D
      camera.moveLeft(moveRate * 0.7);
    }
    if (this.flags.moveRight) {
      //A
      camera.moveRight(moveRate * 0.7);
    }
    var split = this._rotateStep;
    var x = this.moveX * split;
    var y = -this.moveY * split;
    var cartographic = Cesium.Cartographic.fromCartesian(this.viewer.camera.position);
    var newPosition = Cesium.clone(cartographic);
    //如果是固定视高,就给固定高度
    if (this.heightType == "fixed") {
      var baseHeight = this.scene.sampleHeight(cartographic);
      if (baseHeight < 0) {
        baseHeight = this.scene.globe.getHeight(cartographic);
      }
      newPosition.height = baseHeight + 1.75;
    }
    if (this.oldPosition == 0) {
      this.oldPosition = newPosition;
    } else {
      this.flags.oldHeight = this.oldPosition.height;
      if (newPosition.height - this.oldPosition.height >= 2) {
        if (!this.isCollision(this, this.ellipsoid)) {
          newPosition = this.oldPosition;
        } else {
          newPosition.height = flags.oldHeight;
          this.oldPosition = newPosition;
        }
      } else {
        this.oldPosition = newPosition;
      }
    }
    newPosition = this.ellipsoid.cartographicToCartesian(newPosition);
    this.viewer.camera.setView({
      destination: newPosition,
      orientation: {
        heading: Cesium.Math.toRadians(x), // 方向
        pitch: Cesium.Math.toRadians(y), // 倾斜角度
        roll: Cesium.Math.toRadians(0.0)
      }
    });
  }
  documentPointerlockchange(){
    var element = this.viewer.container;
    if (document.pointerLockElement == element) {
      document.addEventListener("mousemove",this.rotate3DHandler, false);
    } else {
      document.removeEventListener("mousemove",this.rotate3DHandler,false);
    }
  }

  rotate3D(event) {
    this.moveX += event.movementX;
    this.moveY += event.movementY;
  }
  isCollision(that, ellipsoid) {
    var camera = that.camera;
    var direction = camera.direction;
    //建立射线
    var ray = new Cesium.Ray(camera.position, direction);
    var result = that.viewer.scene.pickFromRay(ray);
    var point1cartographic = Cesium.Cartographic.fromCartesian(camera.position);
    var point2cartographic = Cesium.Cartographic.fromCartesian(result.position);
    point1cartographic.height = 0;
    point2cartographic.height = 0;
    point1cartographic = Cesium.Cartographic.toCartesian(point1cartographic, ellipsoid);
    point2cartographic = Cesium.Cartographic.toCartesian(point2cartographic, ellipsoid);
    var distance = Cesium.Cartesian3.distance(point1cartographic, point2cartographic);
    if (distance > 0.5) {
      return true;
    } else {
      return false;
    }
  }
  getFlagForKeyCode(keyCode) {
    switch (keyCode) {
      case 'W'.charCodeAt(0):
        return 'moveForward';
      case 'S'.charCodeAt(0):
        return 'moveBackward';
      case 'Q'.charCodeAt(0):
        return 'moveUp';
      case 'E'.charCodeAt(0):
        return 'moveDown';
      case 'D'.charCodeAt(0):
        return 'moveRight';
      case 'A'.charCodeAt(0):
        return 'moveLeft';
      //case 13:
      //    return "enter";
      default:
        return undefined;
    }
  }
  destroy() {
    //先删除子事件
    var that=this;
    document.removeEventListener('keydown',that.documentKyeDownHandler,false);
    document.removeEventListener('keyup', that.documentKyeUpHandler,false);
    that.viewer.scene.preRender.removeEventListener(that.preRenderListenerHandler,that);
    //再删除父事件
    this.viewer.container.removeEventListener('click', that.elementClickHandler,false);
    document.removeEventListener("mousemove",that.rotate3DHandler,false);
    document.removeEventListener('pointerlockchange', that.documentPointerlockchangeHandler, false);

    // 注册左键平移地图事件
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    this.viewer.scene.screenSpaceCameraController.enableZoom = false;
  }

  //========== 对外属性 ==========
  get moveStep() {
    return this._moveStep;
  }
  set moveStep(value) {
    this._moveStep = value;
  }

  get rotateStep() {
    return this._rotateStep;
  }
  set rotateStep(value) {
    this._rotateStep = value;
  }
}
