const _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
}();

function fRandomByfloat(under, over) {
    return under + Math.random() * (over - under);
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function CanvasParticle() {
    _classCallCheck(this, CanvasParticle);

    this.lng = null; //粒子初始经度
    this.lat = null; //粒子初始纬度
    // this.x = null;//粒子初始x位置(相对于棋盘网格，比如x方向有360个格，x取值就是0-360，这个是初始化时随机生成的)
    // this.y = null;//粒子初始y位置(同上)
    this.tlng = null; //粒子下一步将要移动的经度，这个需要计算得来
    this.tlat = null; //粒子下一步将要移动的y纬度，这个需要计算得来
    this.age = null; //粒子生命周期计时器，每次-1
    // this.speed = null;//粒子移动速度，可以根据速度渲染不同颜色
};

const CanvasWindField = function () {
    //========== 构造方法 ==========
    function CanvasWindField(data, reverseY) {
        _classCallCheck(this, CanvasWindField);

        //行列总数
        this.rows = data["rows"];
        this.cols = data["cols"];

        //经纬度边界
        this.xmin = data["xmin"];
        this.xmax = data["xmax"];
        this.ymin = data["ymin"];
        this.ymax = data["ymax"];

        this.grid = [];

        var uComponent = data["udata"];
        var vComponent = data["vdata"];
        var index = 0,
            arrRow = null,
            uv = null;

        for (var row = 0; row < this.rows; row++) {
            arrRow = [];
            for (var col = 0; col < this.cols; col++, index++) {
                uv = this._calcUV(uComponent[index], vComponent[index]);
                arrRow.push(uv);
            }
            this.grid.push(arrRow);
        }
        if (reverseY) {
            this.grid.reverse();
        }
        // console.log(this.grid);
    }
    //根据经纬度，算出棋盘格位置


    _createClass(CanvasWindField, [{
        key: "toGridXY",
        value: function toGridXY(lng, lat) {
            var x = (lng - this.xmin) / (this.xmax - this.xmin) * (this.cols - 1);
            var y = (this.ymax - lat) / (this.ymax - this.ymin) * (this.rows - 1);
            return { x: x, y: y };
        }
        //根据棋盘格获取UV值

    }, {
        key: "getUVByXY",
        value: function getUVByXY(x, y) {
            if (x < 0 || x >= 359 || y >= 180) {
                return [0, 0, 0];
            }
            var x0 = Math.floor(x),
                y0 = Math.floor(y),
                x1,
                y1;
            if (x0 === x && y0 === y) return this.grid[y][x];

            x1 = x0 + 1;
            y1 = y0 + 1;

            var g00 = this.getUVByXY(x0, y0),
                g10 = this.getUVByXY(x1, y0),
                g01 = this.getUVByXY(x0, y1),
                g11 = this.getUVByXY(x1, y1);
            var result = null;
            try {
                result = this._bilinearInterpolation(x - x0, y - y0, g00, g10, g01, g11);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.log(x, y);
            }
            return result;
        }

        //双线性插值算法计算给定节点的速度
        //https://blog.csdn.net/qq_37577735/article/details/80041586

    }, {
        key: "_bilinearInterpolation",
        value: function _bilinearInterpolation(x, y, g00, g10, g01, g11) {
            var rx = 1 - x;
            var ry = 1 - y;
            var a = rx * ry,
                b = x * ry,
                c = rx * y,
                d = x * y;
            var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
            var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
            return this._calcUV(u, v);
        }
    }, {
        key: "_calcUV",
        value: function _calcUV(u, v) {
            // u表示经度方向上的风，u为正，表示西风，从西边吹来的风。
            // v表示纬度方向上的风，v为正，表示南风，从南边吹来的风。
            return [+u, +v, Math.sqrt(u * u + v * v)]; //u, v，风速
        }

        //根据经纬度格获取UV值

    }, {
        key: "getUVByPoint",
        value: function getUVByPoint(lng, lat) {
            if (!this.isInExtent(lng, lat)) {
                return null;
            }
            var gridpos = this.toGridXY(lng, lat);
            var uv = this.getUVByXY(gridpos.x, gridpos.y);
            return uv;
        }

        //粒子是否在地图范围内

    }, {
        key: "isInExtent",
        value: function isInExtent(lng, lat) {
            if (lng >= this.xmin && lng <= this.xmax && lat >= this.ymin && lat <= this.ymax) return true;else return false;
        }
    }, {
        key: "getRandomLatLng",
        value: function getRandomLatLng() {
            var lng = fRandomByfloat(this.xmin, this.xmax);
            var lat = fRandomByfloat(this.ymin, this.ymax);
            return { lat: lat, lng: lng };
        }
    }]);

    return CanvasWindField;
}()

export const CanvasWindy = function () {
    //========== 构造方法 ==========
    function CanvasWindy(options) {
        debugger
        _classCallCheck(this, CanvasWindy);

        this.viewer = options.viewer;

        //可配置参数
        this.speedRate = options.speedRate || 50; //风前进速率，意思是将当前风场横向纵向分成100份，再乘以风速就能得到移动位置，无论地图缩放到哪一级别都是一样的速度，可以用该数值控制线流动的快慢，值越大，越慢，
        this._particlesNumber = options.particlesNumber || 20000; //初始粒子总数，根据实际需要进行调节
        this._maxAge = options.maxAge || 120; //每个粒子的最大生存周期
        this.frameTime = 1000 / (options.frameRate || 10); //每秒刷新次数，因为requestAnimationFrame固定每秒60次的渲染，所以如果不想这么快，就把该数值调小一些
        this.color = options.color || "#ffffff"; //线颜色，提供几个示例颜色['#14208e','#3ac32b','#e0761a']
        this.lineWidth = options.lineWidth || 1; //线宽度

        this.fixedHeight = Cesium.defaultValue(options.fixedHeight, 0);
        this.reverseY = Cesium.defaultValue(options.reverseY, false); //是否翻转纬度数组顺序，正常数据是从北往南的（纬度从大到小），如果反向时请传reverseY为true

        //内置参数
        this.calc_speedRate = [0, 0]; //根据speedRate参数计算经纬度步进长度
        this.particles = [];
        this._show = true;

        this.canvas = this._createCanvas();
        this.canvasContext = this.canvas.getContext("2d"); //canvas上下文

        this.bindEvent();

        if (options.data) this.updateDate(options.data);
    }

    _createClass(CanvasWindy, [{
        key: "_createCanvas",


        // canvas
        value: function _createCanvas() {
            var windContainer = document.createElement("canvas");
            windContainer.style.position = "absolute";
            windContainer.style.top = "0px";
            windContainer.style.left = "0px";
            windContainer.style.width = "100%";
            windContainer.style.height = "100%";
            windContainer.style.pointerEvents = "none"; //auto时可以交互，但是没法放大地球， none 没法交互
            windContainer.style.zIndex = 10;

            windContainer.setAttribute("id", "canvasWindy");
            windContainer.setAttribute("class", "canvasWindy");
            this.viewer.cesiumWidget.container.appendChild(windContainer);

            var scene = this.viewer.scene;
            windContainer.width = scene.canvas.clientWidth;
            windContainer.height = scene.canvas.clientHeight;

            return windContainer;
        }
    }, {
        key: "resize",
        value: function resize() {
            if (this.canvas) {
                this.canvas.width = this.canvasWidth;
                this.canvas.height = this.canvasHeight;
            }
        }

        //事件处理

    }, {
        key: "bindEvent",
        value: function bindEvent() {
            var _this = this;

            var that = this;

            //更新动画
            var then = Date.now();
            (function frame() {
                //animateFrame: requestAnimationFrame事件句柄，用来清除操作
                that.animateFrame = window.requestAnimationFrame(frame);
                var now = Date.now();
                var delta = now - then;
                if (delta > that.frameTime) {
                    then = now - delta % that.frameTime;
                    that.update(); //按帧率执行
                }
            })();

            // 添加 resize 绑定事件
            window.addEventListener("resize", this.resize.bind(this), false);

            //鼠标滚动、旋转后 需要重新生成风场
            this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

            var refreshTimer = -1;
            var mouse_down = false;
            var mouse_move = false;

            this.handler.setInputAction(function (e) {
                clearTimeout(refreshTimer);
                _this.show = false;
                setTimeout(function () {
                    _this.redraw();
                    _this.show = true;
                }, 200);
            }, Cesium.ScreenSpaceEventType.WHEEL);

            //鼠标左键、右键按下
            this.handler.setInputAction(function (e) {
                mouse_down = true;
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

            this.handler.setInputAction(function (e) {
                mouse_down = true;
            }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

            //鼠标移动
            this.handler.setInputAction(function (e) {
                if (mouse_down) {
                    _this.show = false;
                    mouse_move = true;
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            //鼠标左键、右键抬起
            this.handler.setInputAction(function (e) {
                if (mouse_down && mouse_move) {
                    _this.redraw();
                }
                _this.show = true;
                mouse_down = false;
                mouse_move = false;
            }, Cesium.ScreenSpaceEventType.LEFT_UP);

            this.handler.setInputAction(function (e) {
                if (mouse_down && mouse_move) {
                    _this.redraw();
                }
                _this.show = true;
                mouse_down = false;
                mouse_move = false;
            }, Cesium.ScreenSpaceEventType.RIGHT_UP);

            // this.viewer.camera.moveStart.addEventListener(this.moveStartEvent, this);
            // this.viewer.camera.moveEnd.addEventListener(this.moveEndEvent, this);

            //解决cesium有时 moveStart 后没有触发 moveEnd
            // this.handler = new Cesium.ScreenSpaceEventHandler(this.canvas);
            // this.handler.setInputAction(this._moveStartEvent.bind(this), Cesium.ScreenSpaceEventType.LEFT_DOWN);
            // this.handler.setInputAction(this._moveStartEvent.bind(this), Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
            // this.handler.setInputAction(this._moveStartEvent.bind(this), Cesium.ScreenSpaceEventType.RIGHT_DOWN);
            // this.handler.setInputAction(this._moveEndEvent.bind(this), Cesium.ScreenSpaceEventType.LEFT_UP);
            // this.handler.setInputAction(this._moveEndEvent.bind(this), Cesium.ScreenSpaceEventType.MIDDLE_UP);
            // this.handler.setInputAction(this._moveEndEvent.bind(this), Cesium.ScreenSpaceEventType.RIGHT_UP);
        }
    }, {
        key: "unbindEvent",
        value: function unbindEvent() {
            window.cancelAnimationFrame(this.animateFrame);
            delete this.animateFrame;

            window.removeEventListener("resize", this.resize);

            // this.viewer.camera.moveStart.removeEventListener(this.moveStartEvent, this);
            // this.viewer.camera.moveEnd.removeEventListener(this.moveEndEvent, this);

            if (this.handler) {
                this.handler.destroy();
                this.handler = null;
            }
        }
        //地图相关处理，同步地图与canvas
    }, {
        key: "_moveStartEvent",
        value: function _moveStartEvent() {
            // console.log('windy moveStartEvent');
            this.show = false;
        }
    }, {
        key: "_moveEndEvent",
        value: function _moveEndEvent() {
            // console.log('windy moveEndEvent');

            this.show = true;
            this.redraw();
        }

        //根据现有参数重新生成风场

    }, {
        key: "redraw",
        value: function redraw() {
            this.particles = [];
            this.drawWind();
        }
    }, {
        key: "updateDate",
        value: function updateDate(data) {
            this.clear();
            this.windData = data; //风场json数据

            // 创建风场网格
            this.windField = new CanvasWindField(this.windData, this.reverseY);
            debugger
            this.drawWind();
        }

        //绘制粒子效果处理

    }, {
        key: "drawWind",
        value: function drawWind() {
            //计算经纬度步进长度
            this._calcStep();

            // 创建风场粒子
            for (var i = 0; i < this.particlesNumber; i++) {
                var particle = this.randomParticle(new CanvasParticle());
                this.particles.push(particle);
            }
            this.canvasContext.fillStyle = "rgba(0, 0, 0, 0.97)";
            this.canvasContext.globalAlpha = 0.6;
            this.update();
        }
        //计算经纬度步进长度

    }, {
        key: "_calcStep",
        value: function _calcStep() {
            if (!this.windField) return;

            this.calc_speedRate = [(this.windField.xmax - this.windField.xmin) / this.speedRate, (this.windField.ymax - this.windField.ymin) / this.speedRate];
        }
    }, {
        key: "update",
        value: function update() {
            var _this2 = this;

            if (!this.show || this.particles.length <= 0) return;

            var nextLng = null;
            var nextLat = null;
            var uv = null;

            this.particles.forEach(function (particle) {
                if (particle.age <= 0) {
                    _this2.randomParticle(particle);
                }
                if (particle.age > 0) {
                    var tlng = particle.tlng; //上一次的位置
                    var tlat = particle.tlat;

                    // u表示经度方向上的风，u为正，表示西风，从西边吹来的风。
                    // v表示纬度方向上的风，v为正，表示南风，从南边吹来的风。
                    uv = _this2.windField.getUVByPoint(tlng, tlat);
                    if (uv) {
                        nextLng = tlng + _this2.calc_speedRate[0] * uv[0];
                        nextLat = tlat + _this2.calc_speedRate[1] * uv[1];

                        particle.lng = tlng;
                        particle.lat = tlat;
                        particle.tlng = nextLng;
                        particle.tlat = nextLat;
                        particle.age--;
                    } else {
                        particle.age = 0;
                    }
                }
            });

            this._drawLines();
        }

        //根据粒子当前所处的位置(棋盘网格位置)，计算经纬度，在根据经纬度返回屏幕坐标

    }, {
        key: "_tomap",
        value: function _tomap(lng, lat, particle) {
            var position = Cesium.Cartesian3.fromDegrees(lng, lat, this.fixedHeight);

            //判断是否在球的背面
            var scene = this.viewer.scene;
            if (scene.mode === Cesium.SceneMode.SCENE3D) {
                var occluder = new Cesium.EllipsoidalOccluder(scene.globe.ellipsoid, scene.camera.positionWC);
                var visible = occluder.isPointVisible(position);
                //visible为true说明点在球的正面，否则点在球的背面。
                //需要注意的是不能用这种方法判断点的可见性，如果球放的比较大，点跑到屏幕外面，它返回的依然为true
                if (!visible) {
                    particle.age = 0;
                    return null;
                }
            }
            //判断是否在球的背面

            var pos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.viewer.scene, position);
            if (pos) {
                return [pos.x, pos.y];
            } else {
                return null;
            }
        }
    }, {
        key: "_drawLines",
        value: function _drawLines() {
            var that = this;
            var particles = this.particles;
            this.canvasContext.lineWidth = that.lineWidth;
            //后绘制的图形和前绘制的图形如果发生遮挡的话，只显示后绘制的图形跟前一个绘制的图形重合的前绘制的图形部分，示例：https://www.w3school.com.cn/tiy/t.asp?f=html5_canvas_globalcompop_all
            this.canvasContext.globalCompositeOperation = "destination-in";
            this.canvasContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.canvasContext.globalCompositeOperation = "lighter"; //重叠部分的颜色会被重新计算
            this.canvasContext.globalAlpha = 0.9;
            this.canvasContext.beginPath();
            this.canvasContext.strokeStyle = this.color;

            var is2d = this.viewer.scene.mode !== Cesium.SceneMode.SCENE3D;

            particles.forEach(function (particle) {
                var movetopos = that._tomap(particle.lng, particle.lat, particle);
                var linetopos = that._tomap(particle.tlng, particle.tlat, particle);

                // console.log(movetopos,linetopos);
                if (movetopos != null && linetopos != null) {
                    var step = Math.abs(movetopos[0] - linetopos[0]);
                    if (is2d && step >= that.canvasWidth) {
                        //2d时容错
                        // console.log(particle.lng+","+particle.tlng)
                    } else {
                        that.canvasContext.moveTo(movetopos[0], movetopos[1]);
                        that.canvasContext.lineTo(linetopos[0], linetopos[1]);
                    }
                }
            });
            this.canvasContext.stroke();
        }

        //根据当前风场extent随机生成粒子

    }, {
        key: "randomParticle",
        value: function randomParticle(particle) {
            var point, uv;
            for (var i = 0; i < 30; i++) {
                console.log(this.windField)
                debugger
                point = this.windField.getRandomLatLng();
                uv = this.windField.getUVByPoint(point.lng, point.lat);

                if (uv && uv[2] > 0) break;
            }
            if (!uv) return particle;

            var nextLng = point.lng + this.calc_speedRate[0] * uv[0];
            var nextLat = point.lat + this.calc_speedRate[1] * uv[1];

            particle.lng = point.lng;
            particle.lat = point.lat;
            particle.tlng = nextLng;
            particle.tlat = nextLat;
            particle.age = Math.round(Math.random() * this.maxAge); //每一次生成都不一样
            return particle;
        }
    }, {
        key: "clear",
        value: function clear() {
            this.particles = [];
            delete this.windField;
            delete this.windData;
        }
    }, {
        key: "destory",
        value: function destory() {
            this.clear();
            this.unbindEvent();

            if (this.canvas) {
                this.viewer.cesiumWidget.container.removeChild(this.canvas);
                delete this.canvas;
            }

            //删除所有绑定的数据
            for (var i in this) {
                delete this[i];
            }
        }
    }, {
        key: "canvasWidth",
        get: function get() {
            return this.viewer.scene.canvas.clientWidth;
        }
    }, {
        key: "canvasHeight",
        get: function get() {
            return this.viewer.scene.canvas.clientHeight;
        }

        //风前进速率

    }, {
        key: "speedRate",
        get: function get() {
            return this._speedRate;
        },
        set: function set(value) {
            this._speedRate = (100 - (value > 99 ? 99 : value)) * 100;
            this._calcStep();
        }

        //初始粒子总数

    }, {
        key: "particlesNumber",
        get: function get() {
            return this._particlesNumber;
        },
        set: function set(value) {
            var _this3 = this;

            this._particlesNumber = value;

            //不能随时刷新，需要隔一段时间刷新，避免卡顿
            clearTimeout(this.canrefresh);
            this.canrefresh = setTimeout(function () {
                _this3.redraw();
            }, 500);
        }

        //每个粒子的最大生存周期

    }, {
        key: "maxAge",
        get: function get() {
            return this._maxAge;
        },
        set: function set(value) {
            var _this4 = this;

            this._maxAge = value;

            //不能随时刷新，需要隔一段时间刷新，避免卡顿
            clearTimeout(this.canrefresh);
            this.canrefresh = setTimeout(function () {
                _this4.redraw();
            }, 500);
        }

        //显示影藏

    }, {
        key: "show",
        get: function get() {
            return this._show;
        },
        set: function set(val) {
            this._show = val;
            if (!this.canvas) return;
            if (val) this.canvas.style.visibility = "visible"; else this.canvas.style.visibility = "hidden";
        }

        //数据

    }, {
        key: "data",
        get: function get() {
            return this.windData;
        },
        set: function set(value) {
            this.updateDate(value);
        }
    }]);

    return CanvasWindy;
}();
