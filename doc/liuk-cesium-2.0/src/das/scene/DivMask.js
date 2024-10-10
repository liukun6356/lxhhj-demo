import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
export class DivMask extends DasClass {
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    this._viewer = Cesium.defaultValue(options.viewer, viewer);
    this._color = Cesium.defaultValue(options.color, "#000000");
    this._zIndex = Cesium.defaultValue(options.zIndex, 9999);
    this.id = Cesium.defaultValue(options.id, "DasDivMask");
    this.initialize();
  }
  initialize() {
    var basePanel = viewer._element.parentElement;
    var DivMask_Div = $("<div>");
    DivMask_Div.addClass(this.id);
    DivMask_Div.attr("id", this.id);
    DivMask_Div.css({
      'zIndex': this._zIndex,
       'position':'absolute',
       'left': '0px',
       'top': '0px',
       'width': '100%',
       'height': '100%',
       'boxShadow': 'inset 1px 0px 500px 170px '+this._color,
       'pointerEvents': 'none'
    });
    DivMask_Div.appendTo(basePanel);
  }
  remove(){
      $("."+this.id).remove();
  }
}
