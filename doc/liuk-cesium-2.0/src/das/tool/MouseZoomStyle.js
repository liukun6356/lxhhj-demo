import * as Cesium from "cesium";
import { zepto } from "../util/zepto";
import * as point from "../util/point";
import * as _util from "../util/util";

//鼠标旋转、放大时的美化图标
export class MouseZoomStyle {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    this.viewer = viewer;
    this.options = options || {};

    var containerid = viewer._container.id + "-das3d-mousezoom";
    zepto("#" + viewer._container.id).append(
      '<div id="' + containerid + '" class="das3d-mousezoom"><div class="zoomimg"/></div>'
    );
    this._dom = zepto("#" + containerid);

    this.enable = Cesium.defaultValue(this.options.enable, true);

    var timetik = -1;
    var that = this;
    var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction(evnet => {
      if (!this._enable) return;
      // this._dom.addClass("das3d-mousezoom-visible");
      clearTimeout(timetik);
      timetik = setTimeout(function() {
        //  that._dom.removeClass("das3d-mousezoom-visible");
      }, 200);
    }, Cesium.ScreenSpaceEventType.WHEEL);

    handler.setInputAction(
      evnet => {
        if (!this._enable) return;
        var position = point.getCurrentMousePosition(viewer.scene, evnet.position);
        if (!position) return;

        if (
          viewer.camera.positionCartographic.height >
          viewer.scene.screenSpaceCameraController.minimumCollisionTerrainHeight
        )
          return;

        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        clearTimeout(timetik);
        this._dom.css({
          top: evnet.position.y + "px",
          left: evnet.position.x + "px"
        });
        // this._dom.addClass("das3d-mousezoom-visible");
      },
      options.rightDrag
        ? Cesium.ScreenSpaceEventType.RIGHT_DOWN
        : Cesium.ScreenSpaceEventType.MIDDLE_DOWN
    );

    handler.setInputAction(
      evnet => {
        //  this._dom.removeClass("das3d-mousezoom-visible");
        handler.setInputAction(evnet => {
          that._dom.css({
            top: evnet.endPosition.y + "px",
            left: evnet.endPosition.x + "px"
          });
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      },
      options.rightDrag
        ? Cesium.ScreenSpaceEventType.RIGHT_UP
        : Cesium.ScreenSpaceEventType.MIDDLE_UP
    );

    this.handler = handler;
  }

  //========== 对外属性 ==========

  //是否显示
  get enable() {
    return this._enable;
  }
  set enable(val) {
    this._enable = val;
    if (val) this._dom.show();
    else this._dom.hide();
  }

  //========== 方法 ==========

  destroy() {
    if (this.handler) {
      this.handler.destroy();
      delete this.handler;
    }
    this._dom.remove();

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
