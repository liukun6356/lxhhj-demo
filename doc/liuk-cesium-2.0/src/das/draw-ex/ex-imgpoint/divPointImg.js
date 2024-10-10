import * as Cesium from "cesium";
import { zepto } from "../../util/zepto";
import { DrawBillboard } from "../../draw/draw/Draw.Billboard";
import { register } from "../../draw/Draw";
import * as daslog from "../../util/log";

//div点（转图片）
var drawtype = "div-point-img";

export class DrawEx extends DrawBillboard {
  //更新图标，子类用
  updateFeatureEx(style, entity) {
    var that = this;

    var div = zepto(style.html);
    div.appendTo(style.parent || "body");

    div = div.get(0);

    this._islosdImg = true;
    if (window.domtoimage) {
      //lib/dom2img/dom-to-image.js
      window.domtoimage
        .toPng(div)
        .then(function(dataUrl) {
          entity.billboard.image = "" + dataUrl;

          div.remove();
          that._islosdImg = false;
        })
        .catch(function(error) {
          daslog.warn("未知原因，导出失败!", error);

          div.remove();
          that._islosdImg = false;
        });
    } else if (window.html2canvas) {
      //lib/dom2img/html2canvas.js
      window
        .html2canvas(div, {
          backgroundColor: null,
          allowTaint: true
        })
        .then(canvas => {
          entity.billboard.image = "" + canvas.toDataURL("image/png");

          div.remove();
          that._islosdImg = false;
        })
        .catch(function(error) {
          daslog.warn("未知原因，导出失败!", error);

          div.remove();
          that._islosdImg = false;
        });
    }
  }
}

//注册到Draw中
register(drawtype, DrawEx);
