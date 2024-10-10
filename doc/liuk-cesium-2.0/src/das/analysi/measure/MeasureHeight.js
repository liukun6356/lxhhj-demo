import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import * as util from "../../util/util";
import { style2Entity as labelStyle2Entity } from "../../draw/attr/Attr.Label";
import { style2Entity as polylineStyle2Entity } from "../../draw/attr/Attr.Polyline";
import { MeasureBase } from "./MeasureBase";
import * as draggerCtl from "../../draw/edit/Dragger";
import {getCurrentMousePosition, getPositionValue} from "../../util/point";
import { Tooltip } from "../../draw/core/Tooltip";

export class MeasureHeight extends MeasureBase {
  //========== 构造方法 ==========
  constructor(opts, target) {
    super(opts, target);

    this.totalLable = null;   // 高度label
    this.exLine = null;       // 辅助线

    this.drawDragger = null;  // 绘制线的拖拽点
    this.exDragger = null;    // 辅助线的拖拽点

    this.tooltipShow = true;  // 是否显示提示菜单
    this.tooltip = new Tooltip(this.viewer.container); //鼠标提示信息
  }
  get type() {
    return "height";
  }
  //清除未完成的数据
  clearLastNoEnd() {
    if (this.totalLable != null) this.dataSource.entities.remove(this.totalLable);
    this.totalLable = null;
    if (this.exLine != null) this.dataSource.entities.remove(this.exLine);
    this.exLine = null;
  }
  //开始绘制
  _startDraw(options) {
    var entityattr = labelStyle2Entity(this.labelStyle, {
      horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      show: false
    });
    this.totalLable = this.dataSource.entities.add({
      label: entityattr,
      _noMousePosition: true,
      attribute: {
        unit: options.unit,
        type: options.type
      }
    });
    this.totalLable.showText = function(unit) {
      var heightstr = util.formatLength(this.attribute.value, unit);
      this.label.text = "高度差:" + heightstr;
      return heightstr;
    };

    return this.drawControl.startDraw({
      type: "polyline",
      config: { maxPointNum: 2 },
      style: {
        lineType: "glow",
        color: "#ebe12c",
        width: 8,
        glowPower: 0.1,
        depthFail: true,
        depthFailType: "dash",
        depthFailOpacity: 0.5,
        depthFailColor: "#ebe12c",
        ...options.style
      }
    });
  }
  //绘制增加一个点后，显示该分段的长度
  showAddPointLength(entity) {
    this.showMoveDrawing(entity); //兼容手机端
  }
  //绘制中删除了最后一个点
  showRemoveLastPointLength(e) {
    if (this.exLine) {
      this.dataSource.entities.remove(this.exLine);
      this.exLine = null;
    }
    if (this.totalLable) this.totalLable.label.show = false;
  }
  //绘制过程移动中，动态显示长度信息
  showMoveDrawing(entity) {
    var positions = this.drawControl.getPositions(entity);
    if (positions.length < 2) {
      this.totalLable.label.show = false;
      return;
    }

    var cartographic = Cesium.Cartographic.fromCartesian(positions[0]);
    var cartographic1 = Cesium.Cartographic.fromCartesian(positions[1]);

    var temPoint = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic1.height,this.viewer.scene.globe.ellipsoid);
    var exLine_positions = [temPoint,positions[1]];
    entity._positions_draw[1] = temPoint;
    if (this.exLine) {
      this.exLine._positions = exLine_positions;
    } else {
      var entityattr = polylineStyle2Entity(this.options.styleEx, {
        positions: new Cesium.CallbackProperty(time => {
          return exLine._positions;
        }, false),
        width: 2,
        clampToGround: false,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.RED
        })
      });
      var exLine = this.dataSource.entities.add({
        polyline: entityattr
      });
      exLine._positions = exLine_positions;
      this.exLine = exLine;
    }
    //位置
    this.totalLable.position = Cesium.Cartesian3.midpoint(
        positions[0],
        temPoint,
        new Cesium.Cartesian3()
    );

    var height = Math.abs(cartographic1.height - cartographic.height);

    //绑定值及text显示
    this.totalLable.attribute.value = height;
    var heightstr = this.totalLable.showText(this.options.unit);
    this.totalLable.label.show = true;

    this.target.fire(eventType.change, {
      mtype: this.type,
      value: height,
      label: heightstr
    });
  }
  //绘制完成后
  showDrawEnd(entity) {
    entity.hasEdit = false;
    entity._totalLable = this.totalLable;
    this.totalLable = null;

    entity.arrEntityEx = [this.exLine];
    this.exLine = null;

    var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    //编辑提示事件
    handler.setInputAction(event => {
      if (this.drawing) return; //无法编辑或还在绘制中时，跳出

      //正在拖拽其他的entity时，跳出
      if (!this.viewer.scene.screenSpaceCameraController.enableInputs) return;

      this.closeTooltip();

      var pickedObject = this.viewer.scene.pick(event.endPosition, 5, 5);
      if (Cesium.defined(pickedObject)) {
        var entity = pickedObject.id;
        if (
            entity &&
            entity.type === 'height' &&
            entity instanceof Cesium.Entity &&
            entity.editing &&
            !entity.inProgress &&
            this.tooltipShow
        ) {
          var tooltip = this.tooltip;

          //删除右键菜单打开了不显示tooltip
          if (
              this.viewer.das.contextmenu &&
              this.viewer.das.contextmenu.show &&
              this.viewer.das.contextmenu.target == entity
          )
            return;

          this.tiptimeTik = setTimeout(function() {
            //edit中的MOUSE_MOVE会关闭提示，延迟执行。
            tooltip.showAt(event.endPosition, '单击后 激活编辑<br/>右击 单击菜单删除');
          }, 100);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((event) => {
      if (this.drawing) return; //无法编辑或还在绘制中时，跳出

      var pickedObject = this.viewer.scene.pick(event.position, 5, 5);
      if (Cesium.defined(pickedObject)) {
        var entity = pickedObject.id;
        if (this.currEditFeature && this.currEditFeature === entity) return; //重复单击了跳出

        if (entity && entity instanceof Cesium.Entity && entity.type === 'height' && !entity.inProgress && entity.arrEntityEx) {
          this.startEditing(entity);
          this.closeTooltip();
          if (entity.draw_tooltip) {
            this.tooltip.showAt(event.position, entity.draw_tooltip);
          }
          return;
        }
      }
      this.stopEditing();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.target.fire(eventType.end, {
      mtype: this.type,
      entity: entity,
      value: entity._totalLable.attribute.value
    });
  }

  startEditing(entity) {
    this.stopEditing(entity);
    if (entity == null) return;

    this.bindDraggers(entity);
    this.bindEvent();

    this.tooltipShow = false; // 不显示提示
    this.currEditFeature = entity;
  }

  stopEditing() {
    this.closeTooltip();

    if (this.currEditFeature) {
      this.destroyEvent();
      this.destroyDraggers();
    }

    this.tooltipShow = true; // 显示提示
    this.currEditFeature = null;
  }

  closeTooltip() {
    if (!this.tooltip) return;

    this.tooltip.setVisible(false);
    if (this.tiptimeTik) {
      clearTimeout(this.tiptimeTik);
      delete this.tiptimeTik;
      this.tooltipShow = true;
    }
  }

  bindDraggers(entity) {
    var _eventType = eventType;
    var _this = this;

    var drawDraggerPostion = entity._positions_draw[0];
    var exDraggerPostion = entity.arrEntityEx[0]._positions[1];

    this.drawDragger = draggerCtl.createDragger(entity.entityCollection, {
      position: drawDraggerPostion,
      onDrag: (dragger, position) => {
        var cartographic = Cesium.Cartographic.fromCartesian(position);
        var cartographic1 = Cesium.Cartographic.fromCartesian(exDraggerPostion);

        var temPoint = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic1.height,this.viewer.scene.globe.ellipsoid);
        var exLine_positions = [temPoint, exDraggerPostion];

        entity.arrEntityEx[0]._positions = exLine_positions;
        entity.polyline.positions = [position, temPoint];
        entity._positions_draw = [position, temPoint];

        var height = Math.abs(cartographic1.height - cartographic.height);

        //绑定值及text显示
        entity._totalLable.attribute.value = height;
        var heightstr = entity._totalLable.showText(this.options.unit);
        entity._totalLable.label.show = true;
        entity._totalLable.position = Cesium.Cartesian3.midpoint(
            drawDraggerPostion,
            temPoint,
            new Cesium.Cartesian3()
        );
        _this.target.fire(_eventType.change, {
            mtype: _this.type,
            value: height,
            label: heightstr
        });
      },
      onDragEnd: (dragger, position) => {
        drawDraggerPostion = position;

        _this.target.fire(_eventType.end, {
          mtype: _this.type,
          entity: entity,
          value: entity._totalLable.attribute.value
        });
      }
    });

    this.exDragger = draggerCtl.createDragger(entity.arrEntityEx[0].entityCollection, {
      position: exDraggerPostion,
      onDrag: (dragger, position) => {
        var cartographic = Cesium.Cartographic.fromCartesian(drawDraggerPostion);
        var cartographic1 = Cesium.Cartographic.fromCartesian(position);

        var temPoint = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic1.height,this.viewer.scene.globe.ellipsoid);
        var exLine_positions = [temPoint, position];

        entity.polyline.positions = [drawDraggerPostion, temPoint];
        entity._positions_draw = [drawDraggerPostion, temPoint];
        entity.arrEntityEx[0]._positions = exLine_positions;

        var height = Math.abs(cartographic1.height - cartographic.height);

        //绑定值及text显示
        entity._totalLable.attribute.value = height;
        var heightstr = entity._totalLable.showText(this.options.unit);
        entity._totalLable.label.show = true;
        entity._totalLable.position = Cesium.Cartesian3.midpoint(
            drawDraggerPostion,
            temPoint,
            new Cesium.Cartesian3()
        );
        _this.target.fire(_eventType.change, {
            mtype: _this.type,
            value: height,
            label: heightstr
        });
      },
      onDragEnd: (dragger, position) => {
        exDraggerPostion = position;

        _this.target.fire(_eventType.end, {
          mtype: _this.type,
          entity: entity,
          value: entity._totalLable.attribute.value
        });
      }
    });
  }

  bindEvent() {
    var draggerHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    draggerHandler.dragger = null;
    this.draggerHandler = draggerHandler;

    //选中后拖动
    draggerHandler.setInputAction((event) => {
      var pickedObject = this.viewer.scene.pick(event.position);
      if (Cesium.defined(pickedObject)) {
        var entity = pickedObject.id || pickedObject.primitive.id || pickedObject.primitive;
        if (entity && Cesium.defaultValue(entity._isDragger, false)) {
          this.viewer._hasEdit = true;
          this.viewer.scene.screenSpaceCameraController.enableRotate = false;
          this.viewer.scene.screenSpaceCameraController.enableTilt = false;
          this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
          this.viewer.scene.screenSpaceCameraController.enableInputs = false;

          if (this.viewer.das && this.viewer.das.popup) this.viewer.das.popup.close(entity);

          draggerHandler.dragger = entity;
          draggerHandler.dragger.show = false;

          this.setCursor(true);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    draggerHandler.setInputAction((event) => {
      var dragger = draggerHandler.dragger;
      if (dragger) {
        var point = getCurrentMousePosition(this.viewer.scene, event.endPosition, this.entity);

        if (point) {
          dragger.position = point;
          if (dragger.onDrag) {
            dragger.onDrag(dragger, point);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    draggerHandler.setInputAction((event) => {
      var dragger = draggerHandler.dragger;
      if (dragger) {
        this.setCursor(false);
        dragger.show = true;

        var position = getPositionValue(dragger.position, this.viewer.clock.currentTime);
        if (dragger.onDragEnd) {
          dragger.onDragEnd(dragger, position);
        }

        draggerHandler.dragger = null;
        this.viewer._hasEdit = false;
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        this.viewer.scene.screenSpaceCameraController.enableTilt = false;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
        this.viewer.scene.screenSpaceCameraController.enableInputs = true;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
  }

  destroyEvent() {
    this.viewer._hasEdit = false;
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    this.viewer.scene.screenSpaceCameraController.enableTilt = false;
    this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    this.viewer.scene.screenSpaceCameraController.enableInputs = true;

    this.setCursor(false);

    if (this.draggerHandler) {
      if (this.draggerHandler.dragger) this.draggerHandler.dragger.show = true;

      this.draggerHandler.destroy();
      this.draggerHandler = null;
    }
  }

  destroyDraggers() {
    if (this.drawDragger) {
      this.currEditFeature.entityCollection.remove(this.drawDragger);
      this.drawDragger = null;
    }

    if (this.exDragger) {
      this.currEditFeature.arrEntityEx[0].entityCollection.remove(this.exDragger);
      this.exDragger = null;
    }
  }

  setCursor(val) {
    this.viewer._container.style.cursor = val ? "crosshair" : "";
  }
}
