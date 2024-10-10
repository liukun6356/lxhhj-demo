import * as Cesium from "cesium";
import { pickCenterPoint } from "../util/point";

// 相机视角控制
export class CameraViewController {
  constructor(options) {
    this.viewer = options.viewer;

    this.position = pickCenterPoint(viewer.scene);

    this.minViewingAngle = viewer.das.config.operation.minViewingAngle;
    this.maxViewingAngle = viewer.das.config.operation.maxViewingAngle;
    this.PitchAngleReversal = viewer.das.config.operation.PitchAngleReversal;
    this.lowHeight = viewer.das.config.operation.lowHeight;
  }


  /**
   * 向左旋转
   * @param speed
   */
  turnLeft(speed) {
    var _speed = Cesium.defaultValue(speed, 0.01);
    this._rotateAroundPoint(this.position, this.position, _speed);
  }

  /**
   * 向右旋转
   * @param speed
   */
  turnRight(speed) {
    var _speed = Cesium.defaultValue(speed, 0.01);
    this._rotateAroundPoint(this.position, this.position, -_speed);
  }

  /**
   * 向上看
   * @param speed
   */
  lookUp(speed) {
    var speed = Cesium.defaultValue(speed, 0.01);
    this._lookUpOrDown(speed, true);
  }

  /**
   * 向下看
   * @param speed
   */
  lookDown(speed) {
    var speed = Cesium.defaultValue(speed, 0.01);
    this._lookUpOrDown(-speed, false);
  }

  /**
   * 上下方向旋转
   * @param speed
   * @param isUp 默认为true
   */
  _lookUpOrDown(speed, isUp) {
    var viewer = this.viewer;
    var d = Cesium.Cartesian3.angleBetween(viewer.camera.position, viewer.camera.up);

    var minViewingAngle = this.minViewingAngle;
    var maxViewingAngle = this.maxViewingAngle;
    var PitchAngleReversal = this.PitchAngleReversal;
    var position = this.position;

    var canMove = true;

    if (isUp) {
      if (PitchAngleReversal) {
        //俯仰角是否反转
        if (d >= Cesium.Math.toRadians(maxViewingAngle)) {
          canMove = false;
        }
      } else {
        if (d <= Cesium.Math.toRadians(minViewingAngle) || viewer.camera.pitch > 0) {
          canMove = false;
        }
      }

      if (d < Cesium.Math.toRadians(90)) {
        viewer.camera.rotateAroundPoint(position, viewer.camera.right, 0.01); //俯仰角移动
      }
    } else {
      if (PitchAngleReversal) {
        //俯仰角是否反转
        if (d <= Cesium.Math.toRadians(minViewingAngle) || viewer.camera.pitch > 0) {
          canMove = false;
        }
      } else {
        if (d >= Cesium.Math.toRadians(maxViewingAngle)) {
          canMove = false;
        }
      }
    }

    if (canMove) {
      viewer.camera.rotateAroundPoint(position, viewer.camera.right, speed); //俯仰角移动
    }
  }

  /**
   * 相机旋转
   * @param e
   * @param t
   * @param n
   * @private
   */
  _rotateAroundPoint(e, t, n) {
    var viewer = this.viewer;

    var i = new Cesium.Cartesian3();
    var lowHeight = this.lowHeight; //最低高度
    Cesium.Cartesian3.subtract(viewer.camera.position, e, i); //计算两个笛卡尔分量差(left, right, result)
    var s,
        o,
        u = Cesium.defaultValue(n, viewer.camera.defaultRotateAmount),
        a = Cesium.Quaternion.fromAxisAngle(t, -u, s),  //a为围绕这个z轴旋转d度的四元数
        f = Cesium.Matrix3.fromQuaternion(a, o);        //从提供的四元数计算3x3旋转矩阵。

    Cesium.Matrix3.multiplyByVector(f, i, i);   //计算矩阵和列向量的乘积。  矩阵, 列, 结果

    var cc = {
      x: 0,
      y: 0,
      z: 0
    };
    Cesium.Cartesian3.add(i, e, cc); //计算两个笛卡尔的分量和
    var mbPosition = viewer.scene.globe.ellipsoid.cartesianToCartographic(cc);
    mbPosition.longitude = Cesium.Math.toDegrees(mbPosition.longitude);
    mbPosition.latitude = Cesium.Math.toDegrees(mbPosition.latitude);
    var xx = Cesium.Cartographic.fromDegrees(mbPosition.longitude, mbPosition.latitude);
    var height = viewer.scene.globe.getHeight(xx);

    if (mbPosition.height - height > lowHeight) {
      this.position = cc;
    } else {
      this.position = Cesium.Cartesian3.fromDegrees(mbPosition.longitude, mbPosition.latitude, height + lowHeight);
    }
    Cesium.Matrix3.multiplyByVector(f, viewer.camera.direction, viewer.camera.direction);
    Cesium.Matrix3.multiplyByVector(f, viewer.camera.up, viewer.camera.up);
    Cesium.Matrix3.multiplyByVector(f, viewer.camera.right, viewer.camera.right);
  }
}
