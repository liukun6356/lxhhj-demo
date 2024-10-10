import * as Cesium from "cesium";
import { getCenter } from "../util/point";

var moveStep = 10; //平移步长 (米)
var dirStep = 25; //相机原地旋转步长，值越大步长越小。
var rotateStep = 1.0; //相机围绕目标点旋转速率，0.3 - 2.0
var minPitch = 0.1; //最小仰角  0 - 1
var maxPitch = 0.95; //最大仰角  0 - 1

export var KeyboardType = {
  ENLARGE: 0,
  NARROW: 1,
  LEFT_ROTATE: 2,
  RIGHT_ROTATE: 3,
  TOP_ROTATE: 4,
  BOTTOM_ROTATE: 5
};

//快捷键，键盘漫游
export class KeyboardRoam {
  //========== 构造方法 ==========
  constructor(options) {
    this.viewer = options.viewer;
    var canvas = this.viewer.scene.canvas;

    this.flags = {
      moveForward: false,
      moveBackward: false,
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false
    };

    canvas.setAttribute("tabindex", "0"); // needed to put focus on the canvas
    canvas.onclick = function() {
      canvas.focus();
    };

    var that = this;
    document.addEventListener(
      "keydown",
      function(event) {
        if (!that._enable) return;

        var flagName = that.getFlagForKeyCode(event.keyCode);
        if (typeof flagName !== "undefined") {
          that.flags[flagName] = true;
        }
      },
      false
    );
    document.addEventListener(
      "keyup",
      function(event) {
        if (!that._enable) return;

        var flagName = that.getFlagForKeyCode(event.keyCode);
        if (typeof flagName !== "undefined") {
          that.flags[flagName] = false;
        }
      },
      false
    );

    this._enable = false;
  }

  //========== 对外属性 ==========

  //是否禁用
  get enable() {
    return this._enable;
  }
  set enable(value) {
    if (value) this.bind();
    else this.unbind();
  }

  get moveStep() {
    return moveStep;
  }
  set moveStep(value) {
    moveStep = value;
  }

  get dirStep() {
    return dirStep;
  }
  set dirStep(value) {
    dirStep = value;
  }

  get rotateStep() {
    return rotateStep;
  }
  set rotateStep(value) {
    rotateStep = value;
  }

  get minPitch() {
    return minPitch;
  }
  set minPitch(value) {
    minPitch = value;
  }

  get maxPitch() {
    return maxPitch;
  }
  set maxPitch(value) {
    maxPitch = value;
  }

  //========== 方法 ==========

  bind(opts) {
    if (this._enable) return;
    this._enable = true;

    if (Cesium.defined(opts)) {
      //支持绑定方法内重新赋值参数
      moveStep = opts.moveStep || opts.speedRatio || moveStep;
      dirStep = opts.dirStep || dirStep;
      rotateStep = opts.rotateStep || rotateStep;
      minPitch = opts.minPitch || minPitch;
      maxPitch = opts.maxPitch || maxPitch;
    }

    this.viewer.clock.onTick.addEventListener(this.cameraFunc, this);
  }
  unbind() {
    if (!this._enable) return;
    this._enable = false;

    this.viewer.clock.onTick.removeEventListener(this.cameraFunc, this);
  }
  destroy() {
    this.unbind();
    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }

  //=================相关事件回调方法======================
  getFlagForKeyCode(keyCode) {
    switch (keyCode) {
      //平移
      case "W".charCodeAt(0): //向前平移镜头，不改变相机朝向
        return "moveForward";
      case "S".charCodeAt(0): //向后平移镜头，不改变相机朝向
        return "moveBackward";
      case "D".charCodeAt(0): //向右平移镜头，不改变相机朝向
        return "moveRight";
      case "A".charCodeAt(0): //向左平移镜头，不改变相机朝向
        return "moveLeft";
      case "Q".charCodeAt(0): //向上平移镜头，不改变相机朝向
        return "moveUp";
      case "E".charCodeAt(0): //向下平移镜头，不改变相机朝向
        return "moveDown";

      //相对于相机本身
      case 38: //方向键上键
        this.rotateCamera(KeyboardType.TOP_ROTATE); //相机原地上旋转
        break;
      case 37: //方向键左键
        this.rotateCamera(KeyboardType.LEFT_ROTATE); //相机原地左旋转
        break;
      case 39: //方向键右键
        this.rotateCamera(KeyboardType.RIGHT_ROTATE); //相机原地右旋转
        break;
      case 40: //方向键下键
        this.rotateCamera(KeyboardType.BOTTOM_ROTATE); //相机原地下旋转
        break;

      //相对于屏幕中心点
      case "I".charCodeAt(0):
      case 104: //数字键盘8
        this.moveCamera(KeyboardType.ENLARGE); //向屏幕中心靠近
        break;
      case "K".charCodeAt(0):
      case 101: //数字键盘5
        this.moveCamera(KeyboardType.NARROW); //向屏幕中心远离
        break;
      case "J".charCodeAt(0):
      case 100: //数字键盘4
        this.moveCamera(KeyboardType.LEFT_ROTATE); //围绕屏幕中心左旋转
        break;
      case "L".charCodeAt(0):
      case 102: //数字键盘6
        this.moveCamera(KeyboardType.RIGHT_ROTATE); //围绕屏幕中心右旋转
        break;
      case "U".charCodeAt(0):
      case 103: //数字键盘7
        this.moveCamera(KeyboardType.TOP_ROTATE); //围绕屏幕中心上旋转
        break;
      case "O".charCodeAt(0):
      case 105: //数字键盘9
        this.moveCamera(KeyboardType.BOTTOM_ROTATE); //围绕屏幕中心下旋转
        break;

      default:
        break;
    }
    return undefined;
  }

  //=================平移======================
  startMoveForward() {
    this.flags["moveForward"] = true;
  }
  stopMoveForward() {
    this.flags["moveForward"] = false;
  }
  startMoveBackward() {
    this.flags["moveBackward"] = true;
  }
  stopMoveBackward() {
    this.flags["moveBackward"] = false;
  }
  startMoveRight() {
    this.flags["moveRight"] = true;
  }
  stopMoveRight() {
    this.flags["moveRight"] = false;
  }
  startMoveLeft() {
    this.flags["moveLeft"] = true;
  }
  stopMoveLeft() {
    this.flags["moveLeft"] = false;
  }

  moveForward(distance) {
    //和模型的相机移动不太一样  不是沿着相机目标方向，而是默认向上方向 和 向右 方向的插值方向
    var camera = this.viewer.camera;
    var direction = camera.direction;
    //获得此位置默认的向上方向
    var up = Cesium.Cartesian3.normalize(camera.position, new Cesium.Cartesian3());

    // right = direction * up
    var right = Cesium.Cartesian3.cross(direction, up, new Cesium.Cartesian3());

    direction = Cesium.Cartesian3.cross(up, right, new Cesium.Cartesian3());

    direction = Cesium.Cartesian3.normalize(direction, direction);
    direction = Cesium.Cartesian3.multiplyByScalar(direction, distance, direction);

    camera.position = Cesium.Cartesian3.add(camera.position, direction, camera.position);
  }

  cameraFunc(clock) {
    var camera = this.viewer.camera;

    // Change movement speed based on the distance of the camera to the surface of the ellipsoid.
    // var cameraHeight = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(camera.position).height;
    // var moveRate = cameraHeight / moveStep;
    var moveRate = moveStep;

    if (this.flags.moveForward) {
      this.moveForward(moveRate);
    }
    if (this.flags.moveBackward) {
      this.moveForward(-moveRate);
    }
    if (this.flags.moveUp) {
      camera.moveUp(moveRate);
    }
    if (this.flags.moveDown) {
      camera.moveDown(moveRate);
    }
    if (this.flags.moveLeft) {
      camera.moveLeft(moveRate);
    }
    if (this.flags.moveRight) {
      camera.moveRight(moveRate);
    }
  }

  //=================相对于屏幕或相机======================
  resetCameraPos(newCamera) {
    if (!newCamera) return;
    this.viewer.scene.camera.position = newCamera.position;
    this.viewer.scene.camera.direction = newCamera.direction;
    this.viewer.scene.camera.right = newCamera.right;
    this.viewer.scene.camera.up = newCamera.up;
  }

  limitAngle(up, position, type) {
    var dotNum = Cesium.Cartesian3.dot(
      up,
      Cesium.Cartesian3.normalize(position, new Cesium.Cartesian3())
    );
    if (type == "up" && dotNum < minPitch) return false;
    if (type == "down" && dotNum > maxPitch) return false;
    return true;
  }
  computedNewPos(camera, dir, rotate) {
    // var step = rotateStep;
    var oldpos = camera.position;
    var winCenter = getCenter(this.viewer);
    if (!winCenter) return;
    var center = Cesium.Cartesian3.fromDegrees(winCenter.x, winCenter.y, winCenter.z);
    if (!center) return;
    var oldDis = Cesium.Cartesian3.distance(center, oldpos);
    var step = oldDis / 100;
    step = rotate ? step * rotateStep : step;
    var newCamera = {};
    var ray = new Cesium.Ray(oldpos, dir);
    newCamera.position = Cesium.Ray.getPoint(ray, step);

    // var cheight = Cesium.Cartographic.fromCartesian(newCamera.position).height;
    // if (cheight < 500)   return;

    newCamera.direction = camera.direction;
    newCamera.right = camera.right;
    newCamera.up = camera.up;
    if (rotate) {
      var newDir = Cesium.Cartesian3.normalize(
        Cesium.Cartesian3.subtract(newCamera.position, center, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
      );
      ray = new Cesium.Ray(center, newDir);
      newCamera.position = Cesium.Ray.getPoint(ray, oldDis);
      newCamera.direction = Cesium.Cartesian3.negate(newDir, new Cesium.Cartesian3());
      // newCamera.up = camera.up;
      newCamera.up = Cesium.Cartesian3.normalize(newCamera.position, new Cesium.Cartesian3());
      newCamera.right = Cesium.Cartesian3.cross(
        newCamera.direction,
        newCamera.up,
        new Cesium.Cartesian3()
      );
    }
    return newCamera;
  }

  moveCamera(type) {
    var camera = this.viewer.scene.camera;
    var newCamera;
    switch (type) {
      case KeyboardType.ENLARGE:
        newCamera = this.computedNewPos(camera, camera.direction);
        break;
      case KeyboardType.NARROW:
        newCamera = this.computedNewPos(
          camera,
          Cesium.Cartesian3.negate(camera.direction, new Cesium.Cartesian3())
        );
        break;
      case KeyboardType.LEFT_ROTATE:
        newCamera = this.computedNewPos(
          camera,
          Cesium.Cartesian3.negate(camera.right, new Cesium.Cartesian3()),
          true
        );
        break;
      case KeyboardType.RIGHT_ROTATE:
        newCamera = this.computedNewPos(camera, camera.right, true);
        break;
      case KeyboardType.TOP_ROTATE:
        if (!this.limitAngle(Cesium.clone(camera.up), Cesium.clone(camera.position), "up")) return;
        newCamera = this.computedNewPos(camera, Cesium.clone(camera.up), true);
        break;
      case KeyboardType.BOTTOM_ROTATE:
        if (!this.limitAngle(Cesium.clone(camera.up), Cesium.clone(camera.position), "down"))
          return;
        newCamera = this.computedNewPos(
          camera,
          Cesium.Cartesian3.negate(camera.up, new Cesium.Cartesian3()),
          true
        );
        break;
    }
    if (!newCamera) return;
    this.resetCameraPos(newCamera);
  }

  rotateCamera(type) {
    var winPos = [0, 0];
    var width = this.viewer.scene.canvas.clientWidth;
    var height = this.viewer.scene.canvas.clientHeight;
    var step = (width + height) / dirStep;
    switch (type) {
      case KeyboardType.LEFT_ROTATE:
        winPos = [(-step * width) / height, 0];
        break;
      case KeyboardType.RIGHT_ROTATE:
        winPos = [(step * width) / height, 0];
        break;
      case KeyboardType.TOP_ROTATE:
        winPos = [0, step];
        break;
      case KeyboardType.BOTTOM_ROTATE:
        winPos = [0, -step];
        break;
      default:
        return;
    }
    var x = winPos[0] / width;
    var y = winPos[1] / height;
    //这计算了，分别向右 和 向上移动的
    var lookFactor = 0.05;
    var camera = this.viewer.camera;
    camera.lookRight(x * lookFactor);
    camera.lookUp(y * lookFactor);

    //获得direction 方向
    var direction = camera.direction;
    //获得此位置默认的向上方向
    var up = Cesium.Cartesian3.normalize(camera.position, new Cesium.Cartesian3());

    // right = direction * up
    var right = Cesium.Cartesian3.cross(direction, up, new Cesium.Cartesian3());
    // up = right * direction
    up = Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3());

    camera.up = up;
    camera.right = right;
  }
}
