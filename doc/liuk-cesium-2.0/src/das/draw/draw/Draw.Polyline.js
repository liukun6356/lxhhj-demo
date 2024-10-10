import * as Cesium from "cesium";
import { eventType } from "../../core/DasClass";
import { getCurrentMousePosition, addPositionsHeight } from "../../util/point";
import { message } from "../core/Tooltip";
import * as attr from "../attr/Attr.Polyline";
import { EditPolyline } from "../edit/Edit.Polyline";
import { DrawBase } from "./Draw.Base";

export class DrawPolyline extends DrawBase {
  //========== 构造方法 ==========
  constructor(opts) {
    super(opts);

    this.type = "polyline";
    this.attrClass = attr; //对应的属性控制静态类
    this.editClass = EditPolyline; //获取编辑对象

    this._minPointNum = 2; //至少需要点的个数
    this._maxPointNum = 9999; //最多允许点的个数
  }

  //根据attribute参数创建Entity
  createFeature(attribute, dataSource) {
    dataSource = dataSource || this.dataSource;
    this._positions_draw = [];

    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum;
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum;

    if (attribute.config) {
      //允许外部传入
      this._minPointNum = attribute.config.minPointNum || this._minPointNum_def;
      this._maxPointNum = attribute.config.maxPointNum || this._maxPointNum_def;
    } else {
      this._minPointNum = this._minPointNum_def;
      this._maxPointNum = this._maxPointNum_def;
    }

    var that = this;
    var addattr = {
      polyline: attr.style2Entity(attribute.style),
      attribute: attribute
    };
    addattr.polyline.positions = new Cesium.CallbackProperty(time => {
      var arr = that.getDrawPosition();
      if (attribute.style.closure) return arr.concat(arr[0]);
      //闭合
      else return arr;
    }, false);

    this.entity = dataSource.entities.add(addattr); //创建要素对象
    this.entity._positions_draw = this._positions_draw;
    return this.entity;
  }
  //重新激活绘制
  reCreateFeature(entity) {
    if (!this._minPointNum_def) this._minPointNum_def = this._minPointNum;
    if (!this._maxPointNum_def) this._maxPointNum_def = this._maxPointNum;

    var attribute = entity.attribute;
    if (attribute.config) {
      //允许外部传入
      this._minPointNum = attribute.config.minPointNum || this._minPointNum_def;
      this._maxPointNum = attribute.config.maxPointNum || this._maxPointNum_def;
    } else {
      this._minPointNum = this._minPointNum_def;
      this._maxPointNum = this._maxPointNum_def;
    }

    this.entity = entity;
    this._positions_draw =
      entity._positions_draw || entity.polyline.positions.getValue(this.viewer.clock.currentTime);
    return this.entity;
  }
  style2Entity(style, entity) {
    return attr.style2Entity(style, entity.polyline);
  }
  removeNearPoint() {
    if (this._positions_draw.length < 3) return;
    //消除双击带来的多余经纬度
    for (var i = this._positions_draw.length - 1; i > 0; i--) {
      var mpt1 = this._positions_draw[i];
      var mpt2 = this._positions_draw[i - 1];
      if (
        Math.abs(mpt1.x - mpt2.x) < 0.01 &&
        Math.abs(mpt1.y - mpt2.y) < 0.01 &&
        Math.abs(mpt1.z - mpt2.z) < 0.01
      )
        this._positions_draw.pop();
      else break;
    }
  }
  //绑定鼠标事件
  bindEvent() {
    var lastPointTemporary = false;
    this.getHandler().setInputAction(event => {
      //单击添加点
      var point = getCurrentMousePosition(this.viewer.scene, event.position, this.entity);
      if (!point && lastPointTemporary) {
        //如果未拾取到点，并且存在MOUSE_MOVE时，取最后一个move的点
        point = this._positions_draw[this._positions_draw.length - 1];
      }

      if (point) {
        if (lastPointTemporary) {
          this._positions_draw.pop();
        }
        lastPointTemporary = false;

        this.removeNearPoint(); //消除双击带来的多余经纬度

        //在绘制点基础自动增加高度
        if (
          this.entity.attribute &&
          this.entity.attribute.config &&
          this.entity.attribute.config.addHeight
        )
          point = addPositionsHeight(point, this.entity.attribute.config.addHeight);

        this._positions_draw.push(point);
        this.updateAttrForDrawing();

        this.fire(eventType.drawAddPoint, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: this._positions_draw
        });

        if (this._positions_draw.length >= this._maxPointNum) {
          //点数满足最大数量，自动结束
          this.disable();
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.getHandler().setInputAction(event => {
      //右击删除上一个点
      this._positions_draw.pop(); //删除最后标的一个点

      var point = getCurrentMousePosition(this.viewer.scene, event.position, this.entity);
      if (point) {
        if (lastPointTemporary) {
          this._positions_draw.pop();
        }
        lastPointTemporary = true;

        this.fire(eventType.drawRemovePoint, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: this._positions_draw
        });

        this._positions_draw.push(point);
        this.updateAttrForDrawing();
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    this.getHandler().setInputAction(event => {
      //鼠标移动

      if (this._positions_draw.length <= 1)
        this.tooltip.showAt(event.endPosition, message.draw.polyline.start);
      else if (this._positions_draw.length < this._minPointNum)
        //点数不满足最少数量
        this.tooltip.showAt(event.endPosition, message.draw.polyline.cont);
      else if (this._positions_draw.length >= this._maxPointNum)
        //点数满足最大数量
        this.tooltip.showAt(event.endPosition, message.draw.polyline.end2);
      else this.tooltip.showAt(event.endPosition, message.draw.polyline.end);

      var point = getCurrentMousePosition(this.viewer.scene, event.endPosition, this.entity);
      if (point) {
        if (lastPointTemporary) {
          this._positions_draw.pop();
        }
        lastPointTemporary = true;

        this._positions_draw.push(point);
        this.updateAttrForDrawing();

        this.fire(eventType.drawMouseMove, {
          drawtype: this.type,
          entity: this.entity,
          position: point,
          positions: this._positions_draw
        });
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.getHandler().setInputAction(event => {
      //双击结束标绘
      this.removeNearPoint(); //消除双击带来的多余经纬度
      this.endDraw();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }
  //外部控制，完成绘制，比如手机端无法双击结束
  endDraw() {
    if (!this._enabled) {
      return this;
    }

    if (this._positions_draw.length < this._minPointNum) return; //点数不够
    this.updateAttrForDrawing();
    this.disable();
  }
  updateAttrForDrawing(isLoad) {}
  //图形绘制结束后调用
  finish() {
    var entity = this.entity;

    entity.editing = this.getEditClass(entity); //绑定编辑对象

    entity._positions_draw = this.getDrawPosition();
    // entity.polyline.positions = new Cesium.CallbackProperty((time)=> {
    //     return entity._positions_draw;
    // }, false);

    //显示depthFailMaterial时，不能使用CallbackProperty属性，否则depthFailMaterial不显示
    if (Cesium.defined(entity.polyline.depthFailMaterial)) {
      var arr = entity._positions_draw;
      if (entity.attribute.style.closure) arr = arr.concat(arr[0]); //闭合
      entity.polyline.positions = arr;
    } else {
      entity.polyline.positions = new Cesium.CallbackProperty(time => {
        var arr = entity._positions_draw;
        if (entity.attribute.style.closure) return arr.concat(arr[0]);
        //闭合
        else return arr;
      }, false);
    }
  }
}
