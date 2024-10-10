import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as draggerCtl from "./Dragger";
import * as circleAttr from "../attr/Attr.Circle";
import { message } from "../core/Tooltip";
import { EditBase } from "./Edit.Base";

import { getPositionValue, addPositionsHeight } from "../../util/point";
import { getPositionByDirectionAndLen, getHeadingPitchRollByMatrix } from "../../util/matrix";
import { getAngle } from "../../util/measure";
import * as util from "../../util/util";

export class EditModel extends EditBase {
  //外部更新位置
  setPositions(position) {
    if (util.isArray(position) && position.length == 1) {
      position = position[0];
    }
    this.entity.position.setValue(position);
  }
  bindDraggers() {
    var that = this;

    this.entity.draw_tooltip = message.dragger.def;
    draggerCtl.createDragger(this.entityCollection, {
      dragger: this.entity,
      onDragStart: (dragger, newPosition) => {
        if (this.axisModel) {
          this.axisModel.show = false;
        }
      },
      onDrag: (dragger, newPosition) => {
        that.entity.position.setValue(newPosition);
      },
      onDragEnd: (dragger, newPosition) => {
        if (this.axisModel) {
          this.axisModel.show = true;
        }
        that.updateDraggers();
      }
    });

    var style = this.entity.attribute.style;

    var position = getPositionValue(this.entity.position);
    var height = Cesium.Cartographic.fromCartesian(position).height;
    var radius = style.radius * style.scale;

    // 加载坐标轴模型
    if (this.entity.attribute.editType == "axis") {
      if (!this.axisModel) {
        var axisModel = this.viewer.scene.primitives.add(
          Cesium.Model.fromGltf({
            id: "axis",
            url: this.entity.attribute.axisUrl || "http://data.dasgis.cn/gltf/das/axis.gltf",
            modelMatrix: new Cesium.Matrix4(),
            colorBlendMode: Cesium.ColorBlendMode.HIGHLIGHT
          })
        );
        axisModel.readyPromise.then(function(axisModel) {
          axisModel.activeAnimations.addAll();
        });
        this.axisModel = axisModel;
      }
      this.axisModel.show = true;
      this.axisModel.modelMatrix = this.getModelMatrix(position);

      this.bindAxisEvent();
    } else if (this.entity.attribute.editType == "point") {
      //辅助显示：创建角度调整底部圆
      this.entityAngle = this.entityCollection.add({
        name: "角度调整底部圆",
        position: new Cesium.CallbackProperty(time => {
          return getPositionValue(that.entity.position);
        }, false),
        ellipse: circleAttr.style2Entity({
          fill: false,
          outline: true,
          outlineColor: "#ffff00",
          outlineOpacity: 0.8,
          radius: radius,
          height: height
        })
      });

      //创建角度调整 拖拽点
      var majorPos = getPositionByDirectionAndLen(position, -style.heading, radius);
      var majorDragger = draggerCtl.createDragger(this.entityCollection, {
        position: majorPos,
        type: draggerCtl.PointType.EditAttr,
        tooltip: message.dragger.editHeading,
        onDrag: function(dragger, position) {
          var entityPosition = getPositionValue(that.entity.position);
          var heading = getAngle(entityPosition, position);
          style.heading = that.formatNum(heading, 1);
          that.updateOrientation();

          dragger.position = getPositionByDirectionAndLen(entityPosition, -heading, radius);
        }
      });
      this.draggers.push(majorDragger);

      //缩放控制点
      var position_scale = addPositionsHeight(position, radius);
      var draggerScale = draggerCtl.createDragger(this.entityCollection, {
        position: position_scale,
        type: draggerCtl.PointType.MoveHeight,
        tooltip: message.dragger.editScale,
        onDrag: function(dragger, positionNew) {
          var radiusNew = Cesium.Cartesian3.distance(positionNew, position);

          var radiusOld = dragger.radius / style.scale;
          var scaleNew = radiusNew / radiusOld;
          dragger.radius = radiusNew;

          style.scale = that.formatNum(scaleNew, 2);
          that.entity.model.scale = style.scale;

          that.updateDraggers();
        }
      });
      draggerScale.radius = radius;
      this.draggers.push(draggerScale);
    }
  }
  destroyDraggers() {
    super.destroyDraggers();

    if (this.entityAngle) {
      this.entityCollection.remove(this.entityAngle);
      delete this.entityAngle;
    }

    if (this.axisModel) {
      this.axisModel.show = false;
      this.destroyAxisEvent();
    }
  }

  getModelMatrix(position) {
    var cfg = this.entity.attribute.style;

    position = position || getPositionValue(this.entity.position);

    var hpRoll = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(cfg.heading || 0),
      Cesium.Math.toRadians(cfg.pitch || 0),
      Cesium.Math.toRadians(cfg.roll || 0)
    );
    var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, hpRoll);

    var style = this.entity.attribute.style;
    var scale = (style.radius * style.scale) / 1.5;

    Cesium.Matrix4.multiplyByUniformScale(modelMatrix, scale, modelMatrix);

    return modelMatrix;
  }
  //角度更新
  updateOrientation() {
    var style = this.entity.attribute.style;
    var position = getPositionValue(this.entity.position);
    if (position == null) return;

    var heading = Cesium.Math.toRadians(Number(style.heading || 0.0));
    var pitch = Cesium.Math.toRadians(Number(style.pitch || 0.0));
    var roll = Cesium.Math.toRadians(Number(style.roll || 0.0));

    var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  }
  //图形编辑结束后调用
  finish() {
    if (this.axisModel) {
      this.viewer.scene.primitives.remove(this.axisModel);
      delete this.axisModel;
    }

    delete this.entity.draw_tooltip;
    delete this.entity._isDragger;
    delete this.entity._noMousePosition;
    delete this.entity._pointType;
    delete this.entity.onDrag;
  }

  //update Axis Matrix
  bindAxisEvent() {
    var that = this;
    // 判断当前是否点击在坐标轴上进行拖动和旋转
    var isAxis = false;
    var zhou = undefined; // 当前拖拽的是哪个轴

    var viewer = this.viewer;

    var downHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    downHandler.setInputAction(function(event) {
      var pickedObject = viewer.scene.pick(event.position);
      if (Cesium.defined(pickedObject) && pickedObject.id === that.axisModel.id) {
        zhou = pickedObject.mesh.name;
        isAxis = true;
        //console.log('单击了:' + zhou);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    downHandler.setInputAction(function(event) {
      var startCartesian3 = viewer.scene.pickPosition(event.startPosition);
      var endCartesian3 = viewer.scene.pickPosition(event.endPosition);

      if (isAxis && startCartesian3 && endCartesian3) {
        that.cameraControl(false); // 禁止球转动和拖动

        switch (zhou) {
          // case 'XArrow_1':
          //     that.axisMove(startCartesian3, endCartesian3, Cesium.Cartesian3.UNIT_X, 'x', 'z');
          //     break;
          // case 'YArrow_1':
          //     that.axisMove(startCartesian3, endCartesian3, Cesium.Cartesian3.UNIT_Z, 'y', 'z');
          //     break;
          // case 'ZArrow_1':
          //     that.axisMove(startCartesian3, endCartesian3, Cesium.Cartesian3.UNIT_Y, 'x', 'y');
          //     break;

          case "XAxis_1":
            that.axisRotate(startCartesian3, endCartesian3, Cesium.Cartesian3.UNIT_Y, "z", "x");
            break;
          case "YAxis_1":
            that.axisRotate(startCartesian3, endCartesian3, Cesium.Cartesian3.UNIT_X, "y", "z");
            break;
          case "ZAxis_1":
            that.axisRotate(startCartesian3, endCartesian3, Cesium.Cartesian3.UNIT_Z, "x", "y");
            break;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    downHandler.setInputAction(function(event) {
      isAxis = false;
      that.cameraControl(true);
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    this.downHandler = downHandler;
  }
  destroyAxisEvent() {
    if (this.downHandler) {
      this.downHandler.destroy();
      this.downHandler = null;
    }
  }
  //平移模型 处理
  // axisMove (startCartesian3, endCartesian3, surface, zeroAxis1, zeroAxis2) {

  //     var position = getPositionValue(this.entity.position);
  //     var modelMatrix = this.getModelMatrix(position) // this.model.modelMatrix;

  //     var point = this.axisTransForm(modelMatrix, startCartesian3, endCartesian3, surface);

  //     // 两点差值
  //     var sub = Cesium.Cartesian3.subtract(point.end, point.start, new Cesium.Cartesian3());
  //     sub[zeroAxis1] = 0;
  //     sub[zeroAxis2] = 0;

  //     var sub2 = Cesium.Matrix4.multiplyByPoint(modelMatrix, sub, new Cesium.Cartesian3());

  //     // 移动模型
  //     this.model.modelMatrix[12] = sub2.x;
  //     this.model.modelMatrix[13] = sub2.y;
  //     this.model.modelMatrix[14] = sub2.z;

  //     //更新 坐标轴模型
  //     this.updateAxisMatrix();
  // }
  //旋转模型 处理
  axisRotate(startCartesian3, endCartesian3, surface, tant1, tant2) {
    var position = getPositionValue(this.entity.position);
    var modelMatrix = this.getModelMatrix(position); // this.model.modelMatrix;
    var point = this.axisTransForm(modelMatrix, startCartesian3, endCartesian3, surface);

    // 两点角度
    var tant =
      (point.start[tant1] * point.end[tant2] - point.start[tant2] * point.end[tant1]) /
      (point.start[tant1] * point.end[tant1] + point.start[tant2] * point.end[tant2]);

    var quat = Cesium.Quaternion.fromAxisAngle(surface, Math.atan(tant)); //quat为围绕这个surface轴旋转d度的四元数
    var rot_mat3 = Cesium.Matrix3.fromQuaternion(quat);
    var m2 = Cesium.Matrix4.multiplyByMatrix3(modelMatrix, rot_mat3, new Cesium.Matrix4());

    var style = this.entity.attribute.style;

    var hpr = getHeadingPitchRollByMatrix(m2);
    style.heading = this.formatNum(Cesium.Math.toDegrees(hpr.heading), 1);
    style.pitch = this.formatNum(Cesium.Math.toDegrees(hpr.pitch), 1);
    style.roll = this.formatNum(Cesium.Math.toDegrees(hpr.roll), 1);

    this.updateOrientation();

    //更新 坐标轴模型
    this.axisModel.modelMatrix = this.getModelMatrix(position);

    this.fire(eventType.editStyle, {
      edittype: this.entity.attribute.type,
      entity: this.entity,
      position: position
    });
  }

  // 旋转和平移函数得到射线和面交点(基础方法)
  axisTransForm(modelMatrix, startCartesian3, endCartesian3, surface) {
    var matrix = Cesium.Matrix4.inverseTransformation(modelMatrix, new Cesium.Matrix4());

    // 获取相机坐标
    var camera1 = this.viewer.camera.position;

    // 转 模型坐标
    var camera = Cesium.Matrix4.multiplyByPoint(matrix, camera1, new Cesium.Cartesian3());
    var startM = Cesium.Matrix4.multiplyByPoint(matrix, startCartesian3, new Cesium.Cartesian3());
    var endM = Cesium.Matrix4.multiplyByPoint(matrix, endCartesian3, new Cesium.Cartesian3());

    // 从相机看模型的方向
    var startDirection = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(startM, camera, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );
    var endDirection = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(endM, camera, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );

    // 面
    var plane = Cesium.Plane.fromPointNormal(Cesium.Cartesian3.ZERO, surface);

    // 射线
    var startRay = new Cesium.Ray(camera, startDirection);
    var endRay = new Cesium.Ray(camera, endDirection);

    // 射线和面交点
    var start = Cesium.IntersectionTests.rayPlane(startRay, plane);
    var end = Cesium.IntersectionTests.rayPlane(endRay, plane);

    return { start: start, end: end };
  }

  //球是否可以转动（编辑时停止球的操作）
  cameraControl(isCamera) {
    this.viewer.scene.screenSpaceCameraController.enableRotate = isCamera;
    this.viewer.scene.screenSpaceCameraController.enableTranslate = isCamera;
    this.viewer.scene.screenSpaceCameraController.enableZoom = isCamera;
    this.viewer.scene.screenSpaceCameraController.enableTilt = isCamera;
    this.viewer.scene.screenSpaceCameraController.enableLook = isCamera;
  }
}
