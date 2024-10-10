import * as Cesium from "cesium";
export class MouseOperationController {
  constructor(options) {
    this.viewer = options.viewer;
    this.viewer.scene.screenSpaceCameraController.inertiaSpin = 0.7; //限制左键惯性
    this.operation = Cesium.defaultValue(this.viewer.das.config.operation, {});
    this.minViewingAngle = Cesium.defaultValue(this.operation.minViewingAngle, 1); //摄像机最低角度
    this.maxViewingAngle = Cesium.defaultValue(this.operation.maxViewingAngle, 89); //摄像机最高角度
    this.PitchAngleReversal = Cesium.defaultValue(this.operation.PitchAngleReversal, false); //俯仰角是否翻转
    this.lowHeight = Cesium.defaultValue(this.operation.lowHeight, 10); //摄像机距离地面最低高度
    this.isCenterRotation = Cesium.defaultValue(this.operation.CenterRotation, false); //是否是中心旋转
    this.LRRotationSpeed = 0.005; // Cesium.defaultValue(this.operation.LRRotationSpeed, 0.005); //左右旋转速度
    this.TDRotationSpeed = 0.005; // Cesium.defaultValue(this.operation.TDRotationSpeed, 0.005); //上下旋转速度
    this.rotateKey = "right"; //设置旋转的按钮(left,center,right)
    this.MAX_ALTITUDE = 100000000;
    if (!this.operation.MouseRightRotate) {
      this.rotateKey = "center";
    }
    this._downMousePosition = null; //鼠标按下原始位置
    this._downTranslationPosition = null; //拖拽平移按下的原始位置
    this.icon = null; //旋转中心点图标
    this.rotateCenter = Cesium.defaultValue(this.operation.rotateCenter, "mouse");
    //是否锁定旋转
    this._rotationLock = false;
    this._preCameraAngle = 0;
  }
  //启动
  init() {
    /*先把原生鼠标操作都禁止了*/
    this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = this.MAX_ALTITUDE; //设置个最高的高度
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    this.viewer.scene.screenSpaceCameraController.enableZoom = true;
    this.viewer.scene.screenSpaceCameraController.enableTilt = false;
    var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas); //获取地图对象

    this.handler = handler;
    this.maximumZoomDistance = this.viewer.scene.screenSpaceCameraController.maximumZoomDistance;

    var that = this;
    this.viewer.camera.rotateAroundPoint = this._rotateAroundPoint;
    //如果是右键旋转
    if (this.rotateKey == "right") {
      this.viewer.scene.screenSpaceCameraController.zoomEventTypes = [
        Cesium.CameraEventType.MIDDLE_DRAG,
        Cesium.CameraEventType.WHEEL,
        Cesium.CameraEventType.PINCH
      ];
      //右键按下
      handler.setInputAction(function(event) {
        that.initMouseDownParameters(event);
      }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      //右键抬起
      handler.setInputAction(function(event) {
        that.resetMouseDownParameters(event);
      }, Cesium.ScreenSpaceEventType.RIGHT_UP);
      //左键按下
      handler.setInputAction(function(event) {
        that.initMouseTranslationDown(event);
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      //左键抬起
      handler.setInputAction(function(event) {
        that.initMouseTranslationUp(event);
      }, Cesium.ScreenSpaceEventType.LEFT_UP);
    } else if (this.rotateKey == "center") {
      //如果是中键旋转
      this.viewer.scene.screenSpaceCameraController.zoomEventTypes = [
        Cesium.CameraEventType.RIGHT_DRAG,
        Cesium.CameraEventType.WHEEL,
        Cesium.CameraEventType.PINCH
      ];
      //中键按下
      handler.setInputAction(function(event) {
        that.initMouseDownParameters(event);
      }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
      //中键抬起
      handler.setInputAction(function(event) {
        that.resetMouseDownParameters(event);
      }, Cesium.ScreenSpaceEventType.MIDDLE_UP);
      //左键按下
      handler.setInputAction(function(event) {
        //  that.initMouseTranslationDown(event);
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      //左键抬起
      handler.setInputAction(function(event) {
        // that.initMouseTranslationUp(event);
      }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }
    //鼠标移动
    handler.setInputAction(function(event) {
      that.mouseMoveParameters(event);
      // that.cameraTranslation(event);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
   //原生的zoom事件不简单,可以有效预防roll错误的情况
    // handler.setInputAction(function(event) {
    //   that.mouseZoom(event);
    // }, Cesium.ScreenSpaceEventType.WHEEL);
  }
  //鼠标旋转按下事件
  initMouseDownParameters(e) {
    if (this.rotateCenter == "mouse") {
      this._downMousePosition = das3d.point.getCurrentMousePosition(this.viewer.scene, e.position);
    } else {
      var canvas = viewer.scene.canvas;
      var center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
      this._downMousePosition = das3d.point.getCurrentMousePosition(this.viewer.scene, center);
    }

    if (!this.icon) {
      //如果没有图标entity就创建一个图标
      this.createIcon(this._downMousePosition);
    } else {
      //如果有图标entity则移到对应的位置
      this.icon.show = true;
      this.icon.position = this._downMousePosition;
    }
    this.setCursor("CloseHandDragRotate");
  }
  //鼠标旋转抬起事件
  resetMouseDownParameters(e) {
    this._downMousePosition = null;
    this.icon.show = false;
    this.setCursor("OpenHand");
  }
  //鼠标拖拽平移按下事件
  initMouseTranslationDown(e) {
    //   this._downTranslationPosition = das3d.point.getCurrentMousePosition(this.viewer.scene, event.position);
    this.setCursor("CloseHand");
  }
  //鼠标拖拽平移抬起事件
  initMouseTranslationUp(e) {
    // this._downTranslationPosition = null;
    this.setCursor("OpenHand");
  }
  //鼠标中键缩放
  mouseZoom(e) {
    //如果取屏幕中心点,可以用注释的代码
    // var canvasWidth = viewer.scene.canvas.width / 2;
    // var canvasHeight = viewer.scene.canvas.height / 2;
    // var canvasCenter=Cesium.Cartesian2.fromElements(canvasWidth, canvasHeight)
    var centerPoint = das3d.point.getCurrentMousePosition(this.viewer.scene, this.mousePosition);
    if (centerPoint != undefined) {
      var distance = Cesium.Cartesian3.distance(centerPoint, viewer.camera.position); //获取缩放点和摄像机的距离
      var SplitDistance = (Cesium.Math.sign(e) * distance) / 10;
      SplitDistance = Cesium.Math.sign(e) * Math.abs(SplitDistance);
      if (SplitDistance < 0.5 && e > 0) {
        return;
      }
      this.viewer.camera.position = das3d.matrix.getOnLinePointByLen(
        centerPoint,
        this.viewer.camera.position,
        -SplitDistance,
        true
      );
    }
  }
  //旋转
  mouseMoveParameters(event) {
    //如果有值说明鼠标是按下状态
    if (this._downMousePosition && !this.rotationLock) {
      var startPosition = event.startPosition;
      var endPosition = event.endPosition;
      //是否是右移
      var LRspeed = Cesium.Math.clamp(startPosition.x - endPosition.x, -40, 40);
      var TDspeed = Cesium.Math.clamp(startPosition.y - endPosition.y, -20, 20);
      if(this.PitchAngleReversal){
        TDspeed=-TDspeed;
      }
      this.viewer.camera.rotateAroundPoint(
        this._downMousePosition,
        this._downMousePosition,
        -LRspeed * this.LRRotationSpeed,
        this
      );
      this.viewer.camera.rotateAroundPoint(
        this._downMousePosition,
        this.viewer.camera.right,
        TDspeed * this.TDRotationSpeed,
        this
      );
    }
    this.mousePosition = event.endPosition;
  }
  //拖拽平移
  cameraTranslation(event) {
    //如果有值说明鼠标是按下状态
    if (this._downTranslationPosition) {
      var HeightAboveGround = this.viewer.camera.positionCartographic.height;
      var crossVal = new Cesium.Cartesian3();
      Cesium.Cartesian3.cross(this.viewer.camera.position, this.viewer.camera.right, crossVal);
      this.viewer.camera.rotateAroundPoint(
        Cesium.Cartesian3.ZERO,
        crossVal,
        HeightAboveGround,
        this
      );
    }
  }

  _rotateAroundPoint(position, cameraAngle, speed, that) {
    
    var result = new Cesium.Cartesian3();
    var speedValue = Cesium.defaultValue(speed, this.defaultRotateAmount);
    var angleResult = Cesium.Quaternion.fromAxisAngle(cameraAngle, -speedValue);
    var result1 = Cesium.Matrix3.fromQuaternion(angleResult); //从提供的四元数计算3x3旋转矩阵。
    Cesium.Cartesian3.subtract(this.position, position, result); //计算两个笛卡尔分量差(left, right, result)
    Cesium.Matrix3.multiplyByVector(result1, result, result); //计算矩阵和列向量的乘积。  矩阵, 列, 结果
    var newCameraPosition = new Cesium.Cartesian3();
    Cesium.Cartesian3.add(result, position, newCameraPosition); //计算两个笛卡尔的分量和
    //提前判断一下摄像机可能移动到的位置和角度
    var orientationUp = this.up.clone();
    Cesium.Matrix3.multiplyByVector(result1.clone(), orientationUp, orientationUp);
    //得到下一次摄像机会移动到的角度
    var cameraAngle = Cesium.Cartesian3.angleBetween(newCameraPosition, orientationUp);
    //如果角度在设定的最高和最低角度之间, 允许移动
    //如果预测角度大于限制角度(只能向下移动,不许向上移动)
    var newPositionHeight = das3d.point.formatPosition(newCameraPosition).z;
    var centerPositionHeight = das3d.point.formatPosition(position).z;
    if (cameraAngle >= Cesium.Math.toRadians(that.maxViewingAngle) && speedValue > 0) {
      return;
    }
    //如果预测角度小于限制角度(只能向上移动,不许向下移动)
    else if (cameraAngle <= Cesium.Math.toRadians(that.minViewingAngle) && speedValue < 0) {
      return;
    } else if (newPositionHeight < 0 || newPositionHeight < centerPositionHeight + 2) {
      if (speedValue < 0) {
        return;
      }
    }

    this.position = newCameraPosition;
    Cesium.Matrix3.multiplyByVector(result1, this.direction, this.direction);
    Cesium.Matrix3.multiplyByVector(result1, this.up, this.up);
    Cesium.Matrix3.multiplyByVector(result1, this.right, this.right);

    this._preCameraAngle = cameraAngle;
    
  }
  createIcon(position) {
    this.icon = this.viewer.entities.add({
      id: "mouseCursorIcon",
      position: position,
      billboard: {
        image:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0NiIgdmlld0JveD0iMCAwIDQwIDQ2Ij4NCiAgPGcgaWQ9IuWbvuWxgl80IiBkYXRhLW5hbWU9IuWbvuWxgiA0IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzg4LjcyOSAtNDgwLjIxNCkiIG9wYWNpdHk9IjAuOSI+DQogICAgPHBhdGggaWQ9Iui3r+W+hF81MjYiIGRhdGEtbmFtZT0i6Lev5b6EIDUyNiIgZD0iTTQ2My4yNTcsNDg5LjNhNC41NzUsNC41NzUsMCwwLDEtNS4wNDEsMGwtMTMuNy03LjY5MWEyLjUzNywyLjUzNywwLDAsMC0zLjMsMy42OTEsMTAyLjk2LDEwMi45NiwwLDAsMSwxNi45LDM5LDMuMzUxLDMuMzUxLDAsMCwxLC4wNTEuNDA5LDIuNTQ5LDIuNTQ5LDAsMSwwLDUuMSwwLDMuMzc4LDMuMzc4LDAsMCwxLC4wNTEtLjQxNSwxMDMuNDc2LDEwMy40NzYsMCwwLDEsMTYuOTI2LTM4Ljk5MywyLjUzOCwyLjUzOCwwLDAsMC0zLjMtMy42OTFaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTIgLTEuMDU0KSIgZmlsbD0iI2Y1ZjVmNSIvPg0KICA8L2c+DQo8L3N2Zz4NCg==",
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scale: 0.4
      }
    });
  }
  setCursor(actionName) {
    var str = "";
    switch (actionName) {
      case "CloseHand":
        str =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAcElEQVR42u3VOw4AIQgEULn/oVkTKWxYPgHdTYaKhuGphTQuFwEAAAAAAABAYoa3Wa1vA/CsNUg0tD6SnQaogYIRiJmfegILsd1EOYBFcAXgOvknAN7lUYAb0QkwEZHlWcAr4higKveXfwEAAABQWg/OxzEh/2tENwAAAABJRU5ErkJggg==";
        break;
      case "CloseHandDragRotate":
        str =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAoElEQVR42u2VSxKAIAxDyf0PjbqQwULKZxBdpCucYvLaOhXh44AABCAAAQjAPMcNUA+P3CyeEQC82ZnCA3kiUfkQ90U4Z2puPWATDYh098qzM+tuzSORV+hcABY3jCmAekyNoAVBNOgIRgCKSlYB9EB0VU7ep9rujD2RFeZum3O90S7UPkCiN7VwXIjRRTa78SjENoBVur/7GwpAAALYHgdornUfxNnupAAAAABJRU5ErkJggg==";
        break;
      case "OpenHand":
        str =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAiUlEQVR42u3W0Q6AIAgF0Pj/j6a2Xpzi5ArI3ODNZZdjloue5KICFKAAtwPYmoPe2Dbkr/4B0XYmMnlo2I67a+rcSABr8uEtmDWVcJqnEQJAtkMLEF8+MTAAMN37VbkD+hVam2sBA8Jr9QgARqQCkMNo+zPMAiwRkUexCnEM4JV7/Q9JAQpQAHO9VDxkIVP18bUAAAAASUVORK5CYII=";
        break;
      case "OpenHandDragRotate":
        str =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAvElEQVR42u2WUQ7DIAxDm/sfmk2bKnWOvSQUtaoU/mjAfmAQte3mZg3QAA3wdIBxVqc68Wg43u3bMZvWrAx2hsc+1NK6OHD8mVwFUFo/3w0NghUMZcrgiJbzMBQOtjEFIOKgHoYFAUEPH81UxKE89qw2QucmY/ZRg/NAPTIRuFoGQOXPIogAXL24+hTAcojMAUSDUhQrzBnAZwLqVXdB3CDqOfOIhNewojv7ikmIywBW6T7+h6QBGqABTrcX7hSoH1Ml49YAAAAASUVORK5CYII=";
        break;
    }
    $(this.viewer.container).css({
      cursor: "url(" + str + ") 16 16, pointer"
    });
  }
  get rotationLock() {
    return this._rotationLock;
  }
  set rotationLock(val) {
    this._rotationLock = val;
  }

  destroy() {
    var handler = this.handler;
    //如果是右键旋转
    if (this.rotateKey == "right") {
      //右键按下
      handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      //右键抬起
      handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_UP);
      //左键按下
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
      //左键抬起
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    } else if (this.rotateKey == "center") {
      //如果是中键旋转
      //中键按下
      handler.removeInputAction(Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
      //中键抬起
      handler.removeInputAction(Cesium.ScreenSpaceEventType.MIDDLE_UP);
      //左键按下
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
      //左键抬起
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = this.maximumZoomDistance;
    this.viewer.scene.screenSpaceCameraController.zoomEventTypes = [
      Cesium.CameraEventType.RIGHT_DRAG,
      Cesium.CameraEventType.WHEEL,
      Cesium.CameraEventType.PINCH
    ];
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    this.viewer.scene.screenSpaceCameraController.enableZoom = true;
    this.viewer.scene.screenSpaceCameraController.enableTilt = true;
  }
}
