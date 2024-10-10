import * as Cesium from "cesium";
import { DasClass, eventType } from "../../core/DasClass";
import { getDefStyle } from "../../draw/attr/index";
import { Draw } from "../../draw/Draw";

//显示测量结果文本的字体
var defaultLabelStyle = getDefStyle("label", {
  color: "#ffffff",
  font_size: 20,
  border: true,
  border_color: "#000000",
  border_width: 3,
  background: true,
  background_color: "#000000",
  background_opacity: 0.5,
  scaleByDistance: true,
  scaleByDistance_far: 800000,
  scaleByDistance_farValue: 0.5,
  scaleByDistance_near: 1000,
  scaleByDistance_nearValue: 1,
  pixelOffset: [0, -15],
  visibleDepth: false //一直显示，不被地形等遮挡
});

export class MeasureBase extends DasClass {
  //========== 构造方法 ==========
  constructor(options, target) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      target.viewer = options;
      options = target;
      target = null;
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = options.viewer;
    this.config = options;
    this.target = target || this; //用于抛出的事件对象

    //文本样式
    if (Cesium.defined(options.label)) {
      this.labelStyle = { ...defaultLabelStyle, ...options.label };
    } else {
      this.labelStyle = { ...defaultLabelStyle };
    }

    //标绘对象
    this.drawControl = options.draw;
    if (!this.drawControl) {
      this.drawControl = new Draw(this.viewer, {
        hasEdit: false,
        ...options
      });
      this.hasDelDraw = true;
    }

    this._bindEvent();
  }
  get draw() {
    return this.drawControl;
  }

  get dataSource() {
    return this.drawControl.dataSource;
  }

  _bindEvent() {
    //事件监听
    this.drawControl.on(Draw.event.drawAddPoint, e => {
      var entity = e.entity;
      if (entity.type != this.type) return;

      this.entity = entity;
      this.showAddPointLength(entity);
      this.target.fire(Draw.event.drawAddPoint, e);
    });
    this.drawControl.on(Draw.event.drawRemovePoint, e => {
      if (e.entity.type != this.type) return;

      this.showRemoveLastPointLength(e);
      this.target.fire(Draw.event.drawRemovePoint, e);
    });
    this.drawControl.on(Draw.event.drawMouseMove, e => {
      var entity = e.entity;
      if (entity.type != this.type) return;

      this.entity = entity;
      this.showMoveDrawing(entity);
      this.target.fire(Draw.event.drawMouseMove, e);
    });

    this.drawControl.on(Draw.event.drawCreated, e => {
      var entity = e.entity;
      if (entity.type != this.type) return;

      this.entity = entity;
      this.showDrawEnd(entity);
      this.bindDeleteContextmenu(entity);
      this.entity = null;
      this.target.fire(Draw.event.drawCreated, e);
    });

    //编辑了线
    this.drawControl.on([Draw.event.editMovePoint, Draw.event.editRemovePoint], e => {
      var entity = e.entity;
      if (entity.type != this.type) return;
      this.updateForEdit(entity);
    });
    //编辑中，拖动了点
    this.drawControl.on(Draw.event.editMouseMove, e => {
      var entity = e.entity;
      if (entity.type != this.type) return;
      if (this.updateForEditMouseMove) this.updateForEditMouseMove(entity);
    });
  }
  showAddPointLength(entity) {}
  showRemoveLastPointLength(e) {}
  showMoveDrawing(entity) {}
  showDrawEnd(entity) {}
  updateForEdit(entity) {}

  startDraw(options) {
    this.options = options || {};
    this.options.style = this.options.style || {};

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (this.options.calback) {
      var calbackfun = options.calback;
      delete options.calback;
      this.target.off(eventType.change);
      this.target.on(eventType.change, e => {
        if (e.mtype == "section") calbackfun(e);
        else calbackfun(e.label, Number(Number(e.value || 0).toFixed(2)), e);
      });
    }
    if (this.options.onStart) {
      var onStartfun = options.onStart;
      delete options.onStart;
      this.target.off(eventType.start);
      this.target.on(eventType.start, onStartfun);
    }
    if (this.options.onEnd) {
      var onEndfun = options.onEnd;
      delete options.onEnd;
      this.target.off(eventType.end);
      this.target.on(eventType.end, e => {
        onEndfun(e.entity, e);
      });
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    var entity = this._startDraw(this.options);
    entity.type = this.type;
  }

  _startDraw() {}

  //取消并停止绘制
  //如果上次未完成绘制就单击了新的，清除之前未完成的。
  stopDraw() {
    this.clearLastNoEnd();
    this.drawControl.stopDraw();
  }

  //外部控制，完成绘制，比如手机端无法双击结束
  endDraw() {
    if (this.entity) {
      var entity = this.entity;
      this.showMoveDrawing(entity);
      this.drawControl.endDraw(); //会触发drawCreated
      // this.showDrawEnd(entity);
      // this.bindDeleteContextmenu(entity);
      // this.target.fire(Draw.event.drawCreated, { entity: entity });
      this.entity = null;
    }
  }

  /*清除测量*/
  clear() {
    this.stopDraw();
    this.drawControl.deleteAll();

    this.target.fire(eventType.delete, {
      mtype: this.type
    });
  }

  //右键菜单
  bindDeleteContextmenu(entity) {
    var that = this;
    entity.contextmenuItems = entity.contextmenuItems || [];
    entity.contextmenuItems.push({
      text: "删除测量",
      iconCls: "fa fa-trash-o",
      visible: function(e) {
        that.drawControl.closeTooltip();

        var entity = e.target;
        if (entity.inProgress && !entity.editing) return false;
        else return true;
      },
      callback: function(e) {
        var entity = e.target;

        if (entity.target) entity = entity.target;

        if (Cesium.defined(entity._totalLable)) {
          that.dataSource.entities.remove(entity._totalLable);
          delete entity._totalLable;
        }
        if (Cesium.defined(entity.arrEntityEx) && entity.arrEntityEx.length > 0) {
          var arrLables = entity.arrEntityEx;
          if (arrLables && arrLables.length > 0) {
            for (var i = 0, len = arrLables.length; i < len; i++) {
              that.dataSource.entities.remove(arrLables[i]);
            }
          }
          delete entity.arrEntityEx;
        }
        // if (entity._exLine) {
        //     that.dataSource.entities.remove(entity._exLine);
        //     delete entity._exLine;
        // }

        that.drawControl.deleteEntity(entity);

        that.drawControl.closeTooltip();
        that.viewer.das.popup.close();

        that.target.fire(eventType.delete, {
          mtype: that.type,
          entity: entity
        });
      }
    });
  }

  destroy() {
    this.clear();

    if (this.hasDelDraw) {
      this.drawControl.destroy();
      delete this.drawControl;
    }
    super.destroy();
  }
}
//[静态属性]本类中支持的事件类型常量
MeasureBase.event = {
  start: eventType.start,
  change: eventType.change,
  end: eventType.end,
  delete: eventType.delete
};
