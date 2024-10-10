import * as Cesium from "cesium";
import { DrawBillboard } from "../../draw/draw/Draw.Billboard";
import { register } from "../../draw/Draw";
import * as daslog from "../../util/log";

//字体点（转图片）
var drawtype = "font-point";

export class DrawEx extends DrawBillboard {
  //更新图标，子类用
  updateFeatureEx(style, entity) {
    var that = this;

    var size = Cesium.defaultValue(style.iconSize, 50);

    var div = document.createElement("div"); //创建一个div
    div.setAttribute(
      "style",
      "padding: 10px;text-align:center;max-width:" +
        (size + 10) +
        "px;max-height:" +
        (size + 10) +
        "px;"
    );
    var jd = document.createElement("i");
    jd.setAttribute("class", Cesium.defaultValue(style.iconClass, "fa fa-automobile"));
    jd.setAttribute("style", "font-size:" + size + "px;color:" + style.color + ";");
    div.appendChild(jd);
    document.body.appendChild(div);

    this._islosdImg = true;
    if (window.domtoimage) {
      //lib/dom2img/dom-to-image.js
      window.domtoimage
        .toPng(div)
        .then(function(dataUrl) {
          entity.billboard.image = "" + dataUrl;

          document.body.removeChild(div);
          that._islosdImg = false;
        })
        .catch(function(error) {
          daslog.warn("未知原因，导出失败!", error);

          document.body.removeChild(div);
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

          document.body.removeChild(div);
          that._islosdImg = false;
        })
        .catch(function(error) {
          daslog.warn("未知原因，导出失败!", error);

          document.body.removeChild(div);
          that._islosdImg = false;
        });
    }
  }
}

//注册到Draw中
register(drawtype, DrawEx);
