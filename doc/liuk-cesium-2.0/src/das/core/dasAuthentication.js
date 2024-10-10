import * as Cesium from "cesium";
//授权验证类

export class dasAuthentication {
    constructor(options) {
        this.viewer = options.viewer;
        this.ipstr = window.location.hostname + ":" + (window.location.port || 80);
        this.serverIP = this.viewer.das.config.serverIP || "http://" + this.ipstr;
        this.noAuthorization = false; //没有授权?
        this.initWidth; //水印图片宽度
        this.initHeight;//水印高度
        this.degree; //水印旋转角度
        this.userAgent = navigator.userAgent;//得到浏览器信息
        this.idx = 1;
        var that=this;
        setTimeout(function(){
            that.getToken(that);
        },5000)

    }
    getToken(that) {
        //var that = this;
        $.ajax({
            type: "GET",
            // url: ipstr+'api/check.do?token='+dasToken,
            url: that.serverIP + "/auth/license?datetime=" + new Date().getTime(),
            success: function success(config) {
                if (!(config.data[19] - 0)) {
                  debugger
                    alert(Base64.decode("5b2T5YmN5L2/55So55qE5LqR56uv5Zyw55CD5pyq5rOo5YaM"));
                    that.addImage(that.viewer);
                    that.noAuthorization = true;
                    setInterval(function () { alert(Base64.decode("5b2T5YmN5L2/55So55qE5LqR56uv5Zyw55CD5pyq5rOo5YaM")) }, 30000);
                    that.watermark()
                }else{
                    if (that.viewer.das.config.showLogo === true) {
                        that.addImage(that.viewer);
                      }
                }
            },
            error: function error(XMLHttpRequest, textStatus, errorThrown) {
                that.addImage(that.viewer);
                that.watermark();
                debugger
                alert(Base64.decode("5b2T5YmN5L2/55So55qE5LqR56uv5Zyw55CD5pyq5rOo5YaM"));
            }
        })
    }
    addImage(viewer) {
        var ViewportQuad = new Cesium.ViewportQuad();
        //左 下 长 宽  PB
        ViewportQuad.rectangle = new Cesium.BoundingRectangle(17, 50, 140, 42),
            viewer.scene.primitives.add(ViewportQuad),
            ViewportQuad.material = new Cesium.Material({
                fabric: {
                    type: "Image",
                    uniforms: {
                        color: new Cesium.Color(1, 1, 1, 1),
                        image: "data:image/png;base64,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"
                    }
                }
            })
        viewer.das.logoObj = ViewportQuad;
    }
    watermark(settings) {
        //默认设置
        var defaultSettings = {
            watermarl_element: "body",
            watermark_txt: "云端地球未注册",
            watermark_x: 20,//水印起始位置x轴坐标
            watermark_y: 20,//水印起始位置Y轴坐标
            watermark_rows: 2000,//水印行数
            watermark_cols: 2000,//水印列数
            watermark_x_space: 70,//水印x轴间隔
            watermark_y_space: 30,//水印y轴间隔
            watermark_color: '#aaa',//水印字体颜色
            watermark_alpha: 0.4,//水印透明度
            watermark_fontsize: '15px',//水印字体大小
            watermark_font: '微软雅黑',//水印字体
            watermark_width: 210,//水印宽度
            watermark_height: 80,//水印长度
            watermark_angle: 15//水印倾斜度数
        };
        //采用配置项替换默认值，作用类似jquery.extend
        if (arguments.length === 1 && typeof arguments[0] === "object") {
            var src = arguments[0] || {};
            for (key in src) {
                if (src[key] && defaultSettings[key] && src[key] === defaultSettings[key])
                    continue;
                else if (src[key])
                    defaultSettings[key] = src[key];
            }
        }
        var oTemp = document.createDocumentFragment();
        var maskElement = document.getElementById(defaultSettings.watermarl_element) || document.body;
        //获取页面最大宽度
        var page_width = Math.max(maskElement.scrollWidth, maskElement.clientWidth);
        //获取页面最大高度
        var page_height = Math.max(maskElement.scrollHeight, maskElement.clientHeight);
        //水印数量自适应元素区域尺寸
        defaultSettings.watermark_cols = Math.ceil(page_width / (defaultSettings.watermark_x_space + defaultSettings.watermark_width));
        defaultSettings.watermark_rows = Math.ceil(page_height / (defaultSettings.watermark_y_space + defaultSettings.watermark_height));
        var x;
        var y;
        for (var i = 0; i < defaultSettings.watermark_rows; i++) {
            y = defaultSettings.watermark_y + (defaultSettings.watermark_y_space + defaultSettings.watermark_height) * i;
            for (var j = 0; j < defaultSettings.watermark_cols; j++) {
                x = defaultSettings.watermark_x + (defaultSettings.watermark_width + defaultSettings.watermark_x_space) * j;
                var mask_div = document.createElement('div');
                mask_div.id = 'mask_div' + i + j;
                mask_div.className = 'mask_div';
                //mask_div.appendChild(document.createTextNode(defaultSettings.watermark_txt));
                mask_div.innerHTML = (defaultSettings.watermark_txt);
                //设置水印div倾斜显示
                mask_div.style.webkitTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                mask_div.style.MozTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                mask_div.style.msTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                mask_div.style.OTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                mask_div.style.transform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                mask_div.style.visibility = "";
                mask_div.style.position = "absolute";
                mask_div.style.left = x + 'px';
                mask_div.style.top = y + 'px';
                mask_div.style.overflow = "hidden";
                mask_div.style.zIndex = "9999";
                mask_div.style.pointerEvents = 'none';//pointer-events:none  让水印不遮挡页面的点击事件
                //mask_div.style.border="solid #eee 1px";　　　　　　　　　　//兼容IE9以下的透明度设置                mask_div.style.filter="alpha(opacity=50)";
                mask_div.style.opacity = defaultSettings.watermark_alpha;
                mask_div.style.fontSize = defaultSettings.watermark_fontsize;
                mask_div.style.fontFamily = defaultSettings.watermark_font;
                mask_div.style.color = defaultSettings.watermark_color;
                mask_div.style.textAlign = "center";
                mask_div.style.width = defaultSettings.watermark_width + 'px';
                mask_div.style.height = defaultSettings.watermark_height + 'px';
                mask_div.style.display = "block";
                oTemp.appendChild(mask_div);
            };
        };
        maskElement.appendChild(oTemp);
    }
}
