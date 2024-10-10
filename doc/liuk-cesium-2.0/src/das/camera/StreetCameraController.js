import * as Cesium from "cesium";
import { windingPoint, getCurrentMousePosition } from "../util/point";

var MAX_PITCH_IN_DEGREE = 88;

//街景视角模式控制
// 1、右键拖拽，以相机视角为中心进行旋转。
// 2、中键拖拽，可以升高或降低相机高度。
// 3、左键双击，飞行定位到该点。
// 4、右键双击，围绕该点旋转。
export class StreetCameraController {
  constructor(options) {
    this.viewer = options.viewer;
    this.enable = Cesium.defaultValue(options.enable, false);
    this.rotateSpeed = Cesium.defaultValue(options.rotateSpeed, 30); //旋转的方向和速度，正负控制方向。

    this.heightStep = Cesium.defaultValue(options.heightStep, 0.2);
    this.moveStep = Cesium.defaultValue(options.moveStep, 0.1);

    this.options = options;
  }

  //========== 对外属性 ==========
  get enable() {
    return this._enable;
  }
  set enable(value) {
    if (this._enable == value) return;

    this._enable = value;
    if (this.viewer.das.mouseZoom) this.viewer.das.mouseZoom.enable = !value;

    if (value) {
      //去掉Cesium默认的中右键的操作
      this._default_zoomEventTypes = this.viewer.scene.screenSpaceCameraController.zoomEventTypes;
      this._default_tiltEventTypes = this.viewer.scene.screenSpaceCameraController.tiltEventTypes;
      this.viewer.scene.screenSpaceCameraController.zoomEventTypes = [
        Cesium.CameraEventType.WHEEL,
        Cesium.CameraEventType.PINCH,
        {
          eventType: Cesium.CameraEventType.RIGHT_DRAG,
          modifier: Cesium.KeyboardEventModifier.CTRL
        }
      ];
      this.viewer.scene.screenSpaceCameraController.tiltEventTypes = [
        {
          eventType: Cesium.CameraEventType.MIDDLE_DRAG,
          modifier: Cesium.KeyboardEventModifier.CTRL
        }
      ];

      this._init();
    } else {
      //还原Cesium默认的中右键的操作
      if (this._default_zoomEventTypes) {
        this.viewer.scene.screenSpaceCameraController.zoomEventTypes = this._default_zoomEventTypes;
        delete this._default_zoomEventTypes;
      }
      if (this._default_tiltEventTypes) {
        this.viewer.scene.screenSpaceCameraController.tiltEventTypes = this._default_tiltEventTypes;
        delete this._default_tiltEventTypes;
      }

      this.clear();
    }
  }

  //========== 方法 ==========

  _init() {
    var that = this;
    var canvas = this.viewer.canvas;

    //按住右键不松手，拖拽，就可以以当前相机为中心旋转角度
    this._handler = new Cesium.ScreenSpaceEventHandler(canvas);
    this._handler.setInputAction(event => {
      windingPoint.stop();

      this._isMouseLeftButtonPressed = true;
      this._mousePosition = this._startMousePosition = Cesium.Cartesian3.clone(event.position);

      this._headingWhenLeftClicked = Cesium.Math.toDegrees(this.viewer.camera.heading);
      this._pitchWhenLeftClicked = Cesium.Math.toDegrees(this.viewer.camera.pitch);
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

    this._handler.setInputAction(event => {
      that._onMouseMove(event);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this._handler.setInputAction(event => {
      this._isMouseLeftButtonPressed = false;
    }, Cesium.ScreenSpaceEventType.RIGHT_UP);

    //按住中键不松手，上下拖拽，可以“升高或降低”相机高度
    this._handler.setInputAction(event => {
      windingPoint.stop();

      this._isMouseUpdownPressed = true;
      this._mousePosition = this._startMousePosition = Cesium.Cartesian3.clone(event.position);
    }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);

    this._handler.setInputAction(event => {
      this._isMouseUpdownPressed = false;
    }, Cesium.ScreenSpaceEventType.MIDDLE_UP);

    //左键双击一个点，就飞过去
    this._handler.setInputAction(event => {
      windingPoint.stop();
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    this._handler.setInputAction(event => {
      windingPoint.stop();

      this._move(event);
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    //右键双击一个点，就围绕这个点旋转
    var time;
    this._handler.setInputAction(event => {
      if (time) {
        var delTime = Cesium.JulianDate.secondsDifference(this.viewer.clock.currentTime, time);
        if (delTime < 0.5) {
          if (this.viewer.das.contextmenu) this.viewer.das.contextmenu.close();

          var position = getCurrentMousePosition(this.viewer.scene, event.position);
          position.time = this.options.windingPointTime;
          position.autoStopAngle = this.options.windingPointAngle;
          position.direction = this.options.windingPointDirection;
          windingPoint.start(this.viewer, position);
        }
      }
      time = this.viewer.clock.currentTime.clone();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    canvas.setAttribute("tabindex", "0");
    canvas.onclick = function() {
      canvas.focus();
    };
  }

  _onMouseMove(event) {
    this._mousePosition = event.endPosition;

    if (this._isMouseLeftButtonPressed) {
      var width = this.viewer.canvas.clientWidth;
      var height = this.viewer.canvas.clientHeight;

      // Coordinate (0.0, 0.0) will be where the mouse was clicked.
      var deltaX = (this._mousePosition.x - this._startMousePosition.x) / width;
      var deltaY = -(this._mousePosition.y - this._startMousePosition.y) / height;

      if (
        Cesium.Math.equalsEpsilon(deltaX, 0, Cesium.Math.EPSILON6) &&
        Cesium.Math.equalsEpsilon(deltaY, 0, Cesium.Math.EPSILON6)
      )
        return;

      var deltaHeadingInDegree = deltaX * this.rotateSpeed;
      var newHeadingInDegree = this._headingWhenLeftClicked + deltaHeadingInDegree;

      var deltaPitchInDegree = deltaY * this.rotateSpeed;
      var newPitchInDegree = this._pitchWhenLeftClicked + deltaPitchInDegree;

      if (
        newPitchInDegree > MAX_PITCH_IN_DEGREE * 2 &&
        newPitchInDegree < 360 - MAX_PITCH_IN_DEGREE
      ) {
        newPitchInDegree = 360 - MAX_PITCH_IN_DEGREE;
      } else {
        if (
          newPitchInDegree > MAX_PITCH_IN_DEGREE &&
          newPitchInDegree < 360 - MAX_PITCH_IN_DEGREE
        ) {
          newPitchInDegree = MAX_PITCH_IN_DEGREE;
        }
      }

      this.viewer.camera.setView({
        orientation: {
          heading: Cesium.Math.toRadians(newHeadingInDegree),
          pitch: Cesium.Math.toRadians(newPitchInDegree),
          roll: this.viewer.camera.roll
        }
      });
    } else if (this._isMouseUpdownPressed) {
      var deltaHei =
        -(this._mousePosition.y - this._startMousePosition.y) / this.viewer.canvas.clientHeight;

      var lookFactor = this.viewer.camera.positionCartographic.height * this.heightStep;

      this.viewer.camera.moveDown(deltaHei * lookFactor);
    }
  }

  _move(event) {
    var position = getCurrentMousePosition(this.viewer.scene, event.position);
    if (position) {
      var camera_distance =
        Cesium.Cartesian3.distance(position, this.viewer.camera.positionWC) * this.moveStep;
      // if (camera_distance > 5000) camera_distance = 5000;

      this.viewer.das.centerPoint(position, {
        radius: camera_distance, //距离目标点的距离
        maximumHeight: this.viewer.camera.positionCartographic.height,
        duration: this.options.moveDuration
      });
    }
  }

  clear() {
    this._handler.destroy();
    delete this._handler;
  }

  destroy() {
    this.clear();
  }
}
