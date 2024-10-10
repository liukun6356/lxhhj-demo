import * as Cesium from "cesium";

let scratchCurrentDirection = new Cesium.Cartesian3();
let scratchDeltaPosition = new Cesium.Cartesian3();
let scratchNextPosition = new Cesium.Cartesian3();
let scratchTerrainConsideredNextPosition = new Cesium.Cartesian3();
let scratchNextCartographic = new Cesium.Cartographic();

export let RoamType = {
  DIRECTION_NONE: 0,
  DIRECTION_FORWARD: 1,
  DIRECTION_BACKWARD: 2,
  DIRECTION_LEFT: 3,
  DIRECTION_RIGHT: 4
};

//第一人称贴地漫游
export class FirstPersonRoam {
  constructor(options) {
    this.options = options;
    this.viewer = options.viewer;

    this._canvas = this.viewer.canvas;
    this._camera = this.viewer.camera;

    this.speed = Cesium.defaultValue(this.options.speed, 1.5); //速度
    this.rotateSpeed = Cesium.defaultValue(this.options.rotateSpeed, -5);
    this.height = Cesium.defaultValue(this.options.height, 10); //高度
    this.maxPitch = Cesium.defaultValue(this.options.maxPitch, 88); //最大pitch角度

    this.initEvent();
    this.enabled = Cesium.defaultValue(this.options.enabled, false);
  }
  //========== 对外属性 ==========
  get enable() {
    return this._enabled;
  }
  set enable(value) {
    this._enabled = value;

    if (this._enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  //========== 方法 ==========
  initEvent() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this._canvas);
    this.handler.setInputAction(
      this._onMouseLButtonClicked.bind(this),
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    );
    this.handler.setInputAction(this._onMouseUp.bind(this), Cesium.ScreenSpaceEventType.LEFT_UP);
    this.handler.setInputAction(
      this._onMouseMove.bind(this),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    this.handler.setInputAction(
      this._onMouseLButtonDoubleClicked.bind(this),
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    const canvas = this.viewer.canvas;
    canvas.setAttribute("tabindex", "0");
    canvas.onclick = function() {
      canvas.focus();
    };
    canvas.addEventListener("keydown", this._onKeyDown.bind(this));
    canvas.addEventListener("keyup", this._onKeyUp.bind(this));

    this.viewer.clock.onTick.addEventListener(this._onClockTick, this);
  }

  _onMouseLButtonClicked(movement) {
    if (!this._enabled) return;
    this._looking = true;
    this._mousePosition = this._startMousePosition = Cesium.Cartesian3.clone(movement.position);
  }

  _onMouseLButtonDoubleClicked(movement) {
    if (!this._enabled) return;
    this._looking = true;
    this._mousePosition = this._startMousePosition = Cesium.Cartesian3.clone(movement.position);
  }

  _onMouseUp(position) {
    if (!this._enabled) return;
    this._looking = false;
  }

  _onMouseMove(movement) {
    if (!this._enabled) return;
    this._mousePosition = movement.endPosition;
  }

  _onKeyDown(event) {
    if (!this._enabled) return;

    const keyCode = event.keyCode;
    this._direction = RoamType.DIRECTION_NONE;

    switch (keyCode) {
      case "W".charCodeAt(0):
        this._direction = RoamType.DIRECTION_FORWARD;
        return;
      case "S".charCodeAt(0):
        this._direction = RoamType.DIRECTION_BACKWARD;
        return;
      case "D".charCodeAt(0):
        this._direction = RoamType.DIRECTION_RIGHT;
        return;
      case "A".charCodeAt(0):
        this._direction = RoamType.DIRECTION_LEFT;
        return;
      default:
        return;
    }
  }

  //开始自动漫游
  startMoveForward() {
    if (!this._enabled) this.start();
    this._direction = RoamType.DIRECTION_FORWARD;
  }
  stopMoveForward() {
    this._direction = RoamType.DIRECTION_NONE;
  }

  _onKeyUp() {
    this._direction = RoamType.DIRECTION_NONE;
  }

  _onClockTick(clock) {
    if (!this._enabled) return;

    let dt = clock._clockStep;

    if (this._looking) this._changeHeadingPitch(dt);

    if (this._direction === RoamType.DIRECTION_NONE) return;

    let distance = this.speed * dt;

    if (this._direction === RoamType.DIRECTION_FORWARD)
      Cesium.Cartesian3.multiplyByScalar(this._camera.direction, 1, scratchCurrentDirection);
    else if (this._direction === RoamType.DIRECTION_BACKWARD)
      Cesium.Cartesian3.multiplyByScalar(this._camera.direction, -1, scratchCurrentDirection);
    else if (this._direction === RoamType.DIRECTION_LEFT)
      Cesium.Cartesian3.multiplyByScalar(this._camera.right, -1, scratchCurrentDirection);
    else if (this._direction === RoamType.DIRECTION_RIGHT)
      Cesium.Cartesian3.multiplyByScalar(this._camera.right, 1, scratchCurrentDirection);

    Cesium.Cartesian3.multiplyByScalar(scratchCurrentDirection, distance, scratchDeltaPosition);

    let currentCameraPosition = this._camera.position;

    Cesium.Cartesian3.add(currentCameraPosition, scratchDeltaPosition, scratchNextPosition);

    // consider terrain height

    let globe = this.viewer.scene.globe;
    let ellipsoid = globe.ellipsoid;

    // get height for next update position
    ellipsoid.cartesianToCartographic(scratchNextPosition, scratchNextCartographic);

    let height = globe.getHeight(scratchNextCartographic);

    if (height === undefined) {
      // console.warn('height is undefined!');
      return;
    }

    if (height < 0) {
      // console.warn(`height is negative!`);
    }

    scratchNextCartographic.height = height + this.height;

    ellipsoid.cartographicToCartesian(
      scratchNextCartographic,
      scratchTerrainConsideredNextPosition
    );

    this._camera.setView({
      destination: scratchTerrainConsideredNextPosition,
      orientation: new Cesium.HeadingPitchRoll(
        this._camera.heading,
        this._camera.pitch,
        this._camera.roll
      ),
      endTransform: Cesium.Matrix4.IDENTITY
    });
  }

  _changeHeadingPitch(dt) {
    let width = this._canvas.clientWidth;
    let height = this._canvas.clientHeight;

    // Coordinate (0.0, 0.0) will be where the mouse was clicked.
    let deltaX = (this._mousePosition.x - this._startMousePosition.x) / width;
    let deltaY = -(this._mousePosition.y - this._startMousePosition.y) / height;

    let currentHeadingInDegree = Cesium.Math.toDegrees(this._camera.heading);
    let deltaHeadingInDegree = deltaX * this.rotateSpeed;
    let newHeadingInDegree = currentHeadingInDegree + deltaHeadingInDegree;

    let currentPitchInDegree = Cesium.Math.toDegrees(this._camera.pitch);
    let deltaPitchInDegree = deltaY * this.rotateSpeed;
    let newPitchInDegree = currentPitchInDegree + deltaPitchInDegree;

    // console.log("rotationSpeed: " + this.rotateSpeed + " deltaY: " + deltaY + " deltaPitchInDegree" + deltaPitchInDegree);

    if (newPitchInDegree > this.maxPitch * 2 && newPitchInDegree < 360 - this.maxPitch) {
      newPitchInDegree = 360 - this.maxPitch;
    } else {
      if (newPitchInDegree > this.maxPitch && newPitchInDegree < 360 - this.maxPitch) {
        newPitchInDegree = this.maxPitch;
      }
    }

    this._camera.setView({
      orientation: {
        heading: Cesium.Math.toRadians(newHeadingInDegree),
        pitch: Cesium.Math.toRadians(newPitchInDegree),
        roll: this._camera.roll
      }
    });
  }

  enableScreenSpaceCameraController(enabled) {
    const scene = this.viewer.scene;
    scene.screenSpaceCameraController.enableRotate = enabled;
    scene.screenSpaceCameraController.enableTranslate = enabled;
    scene.screenSpaceCameraController.enableZoom = enabled;
    scene.screenSpaceCameraController.enableTilt = enabled;
    scene.screenSpaceCameraController.enableLook = enabled;
  }

  start() {
    this._enabled = true;
    this.enableScreenSpaceCameraController(false);

    let currentCameraPosition = this._camera.position;
    let cartographic = new Cesium.Cartographic();
    let globe = this.viewer.scene.globe;

    globe.ellipsoid.cartesianToCartographic(currentCameraPosition, cartographic);

    let height = globe.getHeight(cartographic);

    if (height === undefined) return false;

    if (height < 0) {
      // console.warn(`height is negative`);
    }

    cartographic.height = height + this.height;

    let newCameraPosition = new Cesium.Cartesian3();

    globe.ellipsoid.cartographicToCartesian(cartographic, newCameraPosition);

    let currentCameraHeading = this._camera.heading;
    this._heading = currentCameraHeading;
    this._camera.flyTo({
      destination: newCameraPosition,
      orientation: {
        heading: currentCameraHeading,
        pitch: Cesium.Math.toRadians(0),
        roll: 0.0
      }
    });

    return true;
  }

  stop() {
    this._enabled = false;
    this.enableScreenSpaceCameraController(true);
  }

  destroy() {
    this.stop();

    if (this.handler) {
      this.handler.destroy();
      delete this.handler;
    }

    const canvas = this.viewer.canvas;
    canvas.removeEventListener("keydown", this._onKeyDown, this);
    canvas.removeEventListener("keyup", this._onKeyUp, this);
    this.viewer.clock.onTick.removeEventListener(this._onClockTick, this);

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
