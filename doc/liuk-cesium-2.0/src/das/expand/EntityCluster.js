import * as Cesium from "cesium";

//绑定到Entity上
Object.defineProperties(Cesium.EntityCluster.prototype, {
  circleImageRadius: {
    set: function(value) {
      this._circleImageRadius = value;
      this._circleImageRadius2 = value - 5;
    },
    get: function() {
      if (!this._circleImageRadius) {
        this._circleImageRadius = 28;
      }
      return this._circleImageRadius;
    }
  },
  circleImageRadius2: {
    set: function(value) {
      this._circleImageRadius2 = value;
    },
    get: function() {
      if (!this._circleImageRadius2) {
        this._circleImageRadius2 = 23;
      }
      return this._circleImageRadius2;
    }
  },
  circleImage: {
    set: function(value) {
      this._circleImage = value;
    },
    get: function() {
      if (!this._circleImage) {
        this._circleImage = {};
      }
      return this._circleImage;
    }
  }
});

//生产聚合圆形图标 base64格式
Cesium.EntityCluster.prototype.getCircleImage = function(count, options = {}) {
  if (!this.circleImage[count]) {
    var clr;
    var clr2;
    if (options.color) {
      clr = options.color;
      clr2 = options.color2;
    } else {
      if (count < 10) {
        clr = "rgba(181, 226, 140, 0.6)";
        clr2 = "rgba(110, 204, 57, 0.5)";
      } else if (count < 100) {
        clr = "rgba(241, 211, 87, 0.6)";
        clr2 = "rgba(240, 194, 12, 0.5)";
      } else {
        clr = "rgba(253, 156, 115, 0.6)";
        clr2 = "rgba(241, 128, 23, 0.5)";
      }
    }

    var thisSize = this.circleImageRadius * 2;

    var circleCanvas = document.createElement("canvas");
    circleCanvas.width = thisSize;
    circleCanvas.height = thisSize;
    var circleCtx = circleCanvas.getContext("2d");

    circleCtx.fillStyle = "#ffffff00";
    circleCtx.globalAlpha = 0.0;
    circleCtx.fillRect(0, 0, thisSize, thisSize);

    //圆形底色 (外圈)
    if (clr) {
      circleCtx.globalAlpha = 1.0;
      circleCtx.beginPath();
      circleCtx.arc(
        this.circleImageRadius,
        this.circleImageRadius,
        this.circleImageRadius,
        0,
        Math.PI * 2,
        true
      );
      circleCtx.closePath();
      circleCtx.fillStyle = clr;
      circleCtx.fill();
    }

    //圆形底色(内圈)
    if (clr2) {
      circleCtx.globalAlpha = 1.0;
      circleCtx.beginPath();
      circleCtx.arc(
        this.circleImageRadius,
        this.circleImageRadius,
        this.circleImageRadius2,
        0,
        Math.PI * 2,
        true
      );
      circleCtx.closePath();
      circleCtx.fillStyle = clr2;
      circleCtx.fill();
    }

    //数字文字
    circleCtx.font = options.font || this.circleImageRadius2 * 0.9 + "px bold normal"; // 设置字体
    circleCtx.fillStyle = options.fontColor || "#ffffff"; // 设置颜色
    circleCtx.textAlign = "center"; // 设置水平对齐方式
    circleCtx.textBaseline = "middle"; // 设置垂直对齐方式
    circleCtx.fillText(count, this.circleImageRadius, this.circleImageRadius); // 绘制文字（参数：要写的字，x坐标，y坐标）

    this.circleImage[count] = circleCanvas.toDataURL();
  }
  return this.circleImage[count];
};
