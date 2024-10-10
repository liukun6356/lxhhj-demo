import * as Cesium from "cesium";
import ViewVideoFS from "../shaders/PostProcessStage/Video3D.glsl";
import * as daslog from "../util/log";

let ratateDirection = {
  LEFT: "Z",
  RIGHT: "-Z",
  TOP: "Y",
  BOTTOM: "-Y",
  ALONG: "X",
  INVERSE: "-X"
};

let textStyles = {
  font: "50px 楷体",
  fill: true,
  fillColor: new Cesium.Color(1.0, 1.0, 0.0, 1.0),
  stroke: true,
  strokeWidth: 2,
  strokeColor: new Cesium.Color(1.0, 1.0, 1.0, 0.8),
  backgroundColor: new Cesium.Color(1.0, 1.0, 1.0, 0.1),
  textBaseline: "top",
  padding: 40
};

var Video3DType = {
  Color: 1,
  Image: 2,
  Video: 3,
  Text: 4
};

//视频融合（投射3D，贴物体表面）
//原理：在可视域的基础上，着色器里传入纹理，再计算UV进行贴图
export class Video3D {
  //========== 构造方法 ==========
  constructor(viewer, options) {
    this.viewer = viewer;

    options = options || {};

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (Cesium.defined(options.debugFrustum)) options.showFrustum = options.debugFrustum;
    this.debugFrustum = this.showFrustum;
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this._cameraPosition = options.cameraPosition; //相机位置
    this._position = options.position; //视点位置
    this.type = options.type; //投影类型
    this.alpha = options.alpha || 1.0; //透明度
    this.color = options.color; //投影的颜色
    this._debugFrustum = Cesium.defaultValue(options.showFrustum, true); //显示视椎体

    this._aspectRatio = options.aspectRatio || this._getWinWidHei(); //宽高比
    var fov = options.fov && Cesium.Math.toRadians(options.fov);
    this._camerafov = fov || this.viewer.scene.camera.frustum.fov; //相机水平张角
    this.videoTexture = this.texture =
      options.texture ||
      new Cesium.Texture({
        //默认材质
        context: this.viewer.scene.context,
        source: {
          width: 1,
          height: 1,
          arrayBufferView: new Uint8Array([255, 255, 255, 255])
        },
        flipY: false
      });
    this._videoPlay = Cesium.defaultValue(options.videoPlay, true); //暂停播放
    this.defaultShow = Cesium.defaultValue(options.show, true); //显示和隐藏
    this.clearBlack = Cesium.defaultValue(options.clearBlack, false); //消除鱼眼视频的黑色
    this._rotateDeg = 1;
    this._dirObj = Cesium.defaultValue(options.dirObj, undefined);
    this.text = Cesium.defaultValue(options.text, undefined);
    this.textStyles = Cesium.defaultValue(options.textStyles, textStyles);
    this._disViewColor = Cesium.defaultValue(options.disViewColor, new Cesium.Color(0, 0, 0, 0.5));

    if (!this.cameraPosition || !this.position) {
      daslog.warn("初始化失败：请确认相机位置与视点位置正确！");
      return;
    }

    //传入了DOM
    if (options.dom) {
      this.dom = options.dom;
      if (this.dom instanceof HTMLElement) {
        this.dom = options.dom;
      }
      if (options.dom instanceof Object && options.dom.length) {
        this.dom = options.dom[0];
      }
    }
    //传入了URL
    this.url = options.url; //url

    switch (this.type) {
      default:
      case Video3DType.Video:
        this.activeVideo(this.url);
        break;
      case Video3DType.Image:
        this.activePicture(this.url);
        this.deActiveVideo();
        break;
      case Video3DType.Color:
        this.activeColor(this.color);
        this.deActiveVideo();
        break;
      case Video3DType.Text:
        this.activeText(this.text, this.textStyles);
        this.deActiveVideo();
        break;
    }

    this._createShadowMap();
    this._getOrientation();
    this._addCameraFrustum();
    this._addPostProcess();
    this.viewer.scene.primitives.add(this);
  }

  //========== 对外属性 ==========
  //混合系数0-1
  get alpha() {
    return this._alpha;
  }
  set alpha(val) {
    this._alpha = val;
  }

  //相机宽高比例
  get aspectRatio() {
    return this._aspectRatio;
  }
  set aspectRatio(val) {
    this._aspectRatio = val;
    this._changeVideoWidHei();
  }
  //视椎体显隐
  get showFrustum() {
    return this._debugFrustum;
  }
  set showFrustum(val) {
    this._debugFrustum = val;
    this.cameraFrustum.show = val;
  }
  //相机水平张角
  get fov() {
    return this._camerafov;
  }
  set fov(val) {
    this._camerafov = Cesium.Math.toRadians(val);
    this._changeCameraFov();
  }
  //相机位置
  get cameraPosition() {
    return this._cameraPosition;
  }
  set cameraPosition(pos) {
    if (!pos) return;
    this._cameraPosition = pos;
    this._changeCameraPos();
  }
  //视点位置
  get position() {
    return this._position;
  }
  set position(pos) {
    if (!pos) return;
    this._position = pos;
    this._changeViewPos();
  }
  //切换视频 播放/暂停
  get videoPlay() {
    return this._videoPlay;
  }
  set videoPlay(val) {
    this._videoPlay = Boolean(val);
    if (this.videoElement) {
      if (this.videoPlay) this.videoElement.play();
      else this.videoElement.pause();
    }
  }

  /** 所有相机的参数  */
  get params() {
    var viewJson = {};
    viewJson.type = this.type;
    if (this.type == Video3DType.Color) viewJson.color = this.color;
    else viewJson.url = this.url;

    viewJson.position = this.position;
    viewJson.cameraPosition = this.cameraPosition;
    viewJson.fov = Cesium.Math.toDegrees(this.fov);
    viewJson.aspectRatio = this.aspectRatio;
    viewJson.alpha = this.alpha;
    viewJson.showFrustum = this.showFrustum;
    viewJson.dirObj = this._dirObj;
    return viewJson;
  }

  //显示和隐藏
  get show() {
    return this.defaultShow;
  }
  set show(val) {
    this.defaultShow = Boolean(val);
    this._switchShow();
  }
  get camera() {
    return this.viewShadowMap._lightCamera;
  }
  //========== 方法 ==========

  get disViewColor() {
    return this._disViewColor;
  }
  set disViewColor(color) {
    if (!color) return;
    this._disViewColor = color;
    if (!color.a && color.a != 0) {
      this._disViewColor.a = 1.0;
    }
  }

  //旋转相机
  rotateCamera(axis, deg) {
    var rotateDegree = Cesium.defaultValue(deg, this._rotateDeg);
    switch (axis) {
      case ratateDirection.LEFT:
        break;
      case ratateDirection.RIGHT:
        rotateDegree *= -1;
        break;
      case ratateDirection.TOP:
        break;
      case ratateDirection.BOTTOM:
        rotateDegree *= -1;
        break;
      case ratateDirection.ALONG:
        break;
      case ratateDirection.INVERSE:
        rotateDegree *= -1;
        break;
    }
    var newDir = this._computedNewViewDir(axis, rotateDegree);

    this.viewer.scene.postProcessStages.remove(this.postProcess);
    this.viewer.scene.primitives.remove(this.cameraFrustum);
    this.viewShadowMap.destroy();
    // this.cameraFrustum.destroy();
    this._resetCameraDir(newDir);
    this._getOrientation();
    this._addCameraFrustum();
    this._addPostProcess();
  }
  _resetCameraDir(dirObj) {
    if (!dirObj || !dirObj.up || !dirObj.right || !dirObj.direction) return;
    this._dirObj = dirObj;
    this._createShadowMap();
  }
  //计算新视点
  _computedNewViewDir(axis, deg) {
    deg = Cesium.Math.toRadians(deg);
    var camera = this.viewShadowMap._lightCamera;
    var oldDir = Cesium.clone(camera.direction);
    var oldRight = Cesium.clone(camera.right);
    var oldTop = Cesium.clone(camera.up);
    var mat3 = new Cesium.Matrix3();

    switch (axis) {
      case ratateDirection.LEFT:
        Cesium.Matrix3.fromRotationZ(deg, mat3);
        break;
      case ratateDirection.RIGHT:
        Cesium.Matrix3.fromRotationZ(deg, mat3);
        break;
      case ratateDirection.TOP:
        Cesium.Matrix3.fromRotationY(deg, mat3);
        break;
      case ratateDirection.BOTTOM:
        Cesium.Matrix3.fromRotationY(deg, mat3);
        break;
      case ratateDirection.ALONG:
        Cesium.Matrix3.fromRotationX(deg, mat3);
        break;
      case ratateDirection.INVERSE:
        Cesium.Matrix3.fromRotationX(deg, mat3);
        break;
    }
    var localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(camera.position);
    // var hpr = new Cesium.HeadingPitchRoll(viewer.camera.heading,viewer.camera.pitch,viewer.camera.roll);
    // localToWorld_Matrix = Cesium.Transforms.headingPitchRollToFixedFrame(viewer.camera.position,hpr,Cesium.Ellipsoid.WGS84,Cesium.Transforms.eastNorthUpToFixedFrame);
    var worldToLocal_Matrix = Cesium.Matrix4.inverse(localToWorld_Matrix, new Cesium.Matrix4());

    var localDir = Cesium.Matrix4.multiplyByPointAsVector(
      worldToLocal_Matrix,
      oldDir,
      new Cesium.Cartesian3()
    );
    var localNewDir = Cesium.Matrix3.multiplyByVector(mat3, localDir, new Cesium.Cartesian3());
    var newDir = Cesium.Matrix4.multiplyByPointAsVector(
      localToWorld_Matrix,
      localNewDir,
      new Cesium.Cartesian3()
    );

    var localRight = Cesium.Matrix4.multiplyByPointAsVector(
      worldToLocal_Matrix,
      oldRight,
      new Cesium.Cartesian3()
    );
    var localNewRight = Cesium.Matrix3.multiplyByVector(mat3, localRight, new Cesium.Cartesian3());
    var newRight = Cesium.Matrix4.multiplyByPointAsVector(
      localToWorld_Matrix,
      localNewRight,
      new Cesium.Cartesian3()
    );

    var localTop = Cesium.Matrix4.multiplyByPointAsVector(
      worldToLocal_Matrix,
      oldTop,
      new Cesium.Cartesian3()
    );
    var localNewTop = Cesium.Matrix3.multiplyByVector(mat3, localTop, new Cesium.Cartesian3());
    var newTop = Cesium.Matrix4.multiplyByPointAsVector(
      localToWorld_Matrix,
      localNewTop,
      new Cesium.Cartesian3()
    );
    return {
      direction: newDir,
      right: newRight,
      up: newTop
    };
  }

  getPercentagePoint(cartesian) {
    if (!cartesian) return;
    var vm = this.viewShadowMap._lightCamera._viewMatrix;
    var pm = this.viewShadowMap._lightCamera.frustum.projectionMatrix;
    var c4 = new Cesium.Cartesian4(cartesian.x, cartesian.y, cartesian.z, 1.0);
    var pvm = Cesium.Matrix4.multiply(pm, vm, new Cesium.Matrix4());
    var epos1 = Cesium.Matrix4.multiplyByVector(pvm, c4, new Cesium.Cartesian4());
    var epos2 = new Cesium.Cartesian2(epos1.x / epos1.w, epos1.y / epos1.w);
    var epos3 = new Cesium.Cartesian2(epos2.x / 2 + 0.5, epos2.y / 2 + 0.5);
    return epos3;
  }

  /**
   * 改变相机的水平张角
   */
  _changeCameraFov() {
    this.viewer.scene.postProcessStages.remove(this.postProcess);
    this.viewer.scene.primitives.remove(this.cameraFrustum);
    this._createShadowMap();
    this._getOrientation();
    this._addCameraFrustum();
    this._addPostProcess();
  }

  /**
   * 改变相机视野的宽高比例（垂直张角）
   */
  _changeVideoWidHei() {
    this.viewer.scene.postProcessStages.remove(this.postProcess);
    this.viewer.scene.primitives.remove(this.cameraFrustum);
    this._createShadowMap();
    this._getOrientation();
    this._addCameraFrustum();
    this._addPostProcess();
  }

  /**
   * 改变相机的位置
   */
  _changeCameraPos() {
    this.viewer.scene.postProcessStages.remove(this.postProcess);
    this.viewer.scene.primitives.remove(this.cameraFrustum);
    this.viewShadowMap.destroy();
    // this.cameraFrustum.destroy();
    this._createShadowMap(true);
    this._getOrientation();
    this._addCameraFrustum();
    this._addPostProcess();
  }

  /**
   * 改变相机视点的位置
   */
  _changeViewPos() {
    this.viewer.scene.postProcessStages.remove(this.postProcess);
    this.viewer.scene.primitives.remove(this.cameraFrustum);
    this.viewShadowMap.destroy();
    // this.cameraFrustum.destroy();
    this._createShadowMap(true);
    this._getOrientation();
    this._addCameraFrustum();
    this._addPostProcess();
  }

  _switchShow() {
    if (this.show) {
      !this.postProcess && this._addPostProcess();
    } else {
      this.viewer.scene.postProcessStages.remove(this.postProcess);
      delete this.postProcess;
      this.postProcess = null;
    }
    // this.cameraFrustum.show = this.show;
  }

  /**
   * 激活或重置视频URL
   * @param videoSrc
   * @returns
   */
  activeVideo(videoSrc) {
    //在可视域添加视频
    var videoElement;
    if (this.dom) {
      videoElement = this.dom;
    } else {
      videoElement = this._createVideoEle(videoSrc);
    }

    var that = this;
    if (videoElement) {
      this.type = Video3DType.Video;
      this.videoElement = videoElement;
      videoElement.addEventListener("canplaythrough", function() {
        if (!that.viewer) return;
        that.viewer.clock.onTick.addEventListener(that.activeVideoListener, that);
      });
    }
  }
  activeVideoListener() {
    try {
      if (this._videoPlay && this.videoElement.paused) this.videoElement.play();
    } catch (e) {
      //规避浏览器权限异常
    }

    if (!this.videoElement || !this.viewer) return;

    this.videoTexture && this.videoTexture.destroy();
    this.videoTexture = new Cesium.Texture({
      context: this.viewer.scene.context,
      source: this.videoElement,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE
    });
  }

  //删除视频播放监听
  deActiveVideo() {
    this.viewer.clock.onTick.removeEventListener(this.activeVideoListener, this);
    delete this.activeVideoListener;
  }

  /**
   * 激活或重置图片URL
   * @param videoSrc
   * @returns
   */
  activePicture(picSrc) {
    //在可视域添加图片
    this.videoTexture = this.texture;

    var that = this;
    var image = new Image();
    image.onload = function() {
      that.type = Video3DType.Image;
      that.videoTexture = new Cesium.Texture({
        context: that.viewer.scene.context,
        source: image
      });
    };
    image.onerror = function(e) {
      daslog.warn("图片加载失败：" + picSrc, e);
    };
    image.src = picSrc;
  }

  /**
   * 激活或重置颜色
   * @param color
   * @returns
   */
  activeColor(color) {
    //在可视域添加纯色
    var that = this;
    this.type = Video3DType.Color;
    var r, g, b, a;
    if (color) {
      r = color.red * 255;
      g = color.green * 255;
      b = color.blue * 255;
      a = color.alpha * 255;
    } else {
      r = Math.random() * 255;
      g = Math.random() * 255;
      b = Math.random() * 255;
      a = Math.random() * 255;
    }
    that.videoTexture = new Cesium.Texture({
      context: that.viewer.scene.context,
      source: {
        width: 1,
        height: 1,
        arrayBufferView: new Uint8Array([r, g, b, a])
      },
      flipY: false
    });
  }

  /**
   * 激活或重置文本
   * @param text
   * @param styles
   * @returns
   */
  // Name	               Type	          Default	                     Description
  // font	               String	      '10px sans-serif'	             optional The CSS font to use.
  // textBaseline	       String	      'bottom'	                     optional The baseline of the text.
  // fill	               Boolean	      true	                         optional Whether to fill the text.
  // stroke	           Boolean	      false	                         optional Whether to stroke the text.
  // fillColor	       Color	      Color.WHITE	                 optional The fill color.
  // strokeColor	       Color	      Color.BLACK	                 optional The stroke color.
  // strokeWidth	       Number	      1	                             optional The stroke width.
  // backgroundColor	   Color	      Color.TRANSPARENT	             optional The background color of the canvas.
  // padding	           Number	      0	                             optional The pixel size of the padding to add around the text.
  activeText(text, styles) {
    //在可视域添加纯色
    var that = this;
    this.type = Video3DType.Text;
    if (!text) return;
    styles = styles || {};
    styles.textBaseline = "top";
    this.textCanvas = Cesium.writeTextToCanvas(text, styles);
    that.videoTexture = new Cesium.Texture({
      context: that.viewer.scene.context,
      source: this.textCanvas,
      flipY: true
    });
  }

  /**
   * 呈现投影相机的第一视角
   */
  locate() {
    var camera_pos = Cesium.clone(this.cameraPosition);
    var lookat_pos = Cesium.clone(this.position);
    this.viewer.camera.position = camera_pos;
    if (this._dirObj) {
      this.viewer.camera.direction = Cesium.clone(this._dirObj.direction);
      this.viewer.camera.right = Cesium.clone(this._dirObj.right);
      this.viewer.camera.up = Cesium.clone(this._dirObj.up);
      return;
    }
    this.viewer.camera.direction = Cesium.Cartesian3.subtract(
      lookat_pos,
      camera_pos,
      new Cesium.Cartesian3(0, 0, 0)
    );
    this.viewer.camera.up = Cesium.Cartesian3.normalize(camera_pos, new Cesium.Cartesian3(0, 0, 0));
  }

  //获取四元数
  _getOrientation() {
    var cpos = this.cameraPosition;
    var position = this.position;
    var direction = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(position, cpos, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );
    var up = Cesium.Cartesian3.normalize(cpos, new Cesium.Cartesian3());
    var camera = new Cesium.Camera(this.viewer.scene);
    camera.position = cpos;
    camera.direction = direction;
    camera.up = up;
    direction = camera.directionWC;
    up = camera.upWC;
    var right = camera.rightWC;
    var scratchRight = new Cesium.Cartesian3();
    var scratchRotation = new Cesium.Matrix3();
    var scratchOrientation = new Cesium.Quaternion();

    // var right = Cesium.Cartesian3.cross(direction,up,new Cesium.Cartesian3());
    right = Cesium.Cartesian3.negate(right, scratchRight);
    var rotation = scratchRotation;
    Cesium.Matrix3.setColumn(rotation, 0, right, rotation);
    Cesium.Matrix3.setColumn(rotation, 1, up, rotation);
    Cesium.Matrix3.setColumn(rotation, 2, direction, rotation);
    //计算视锥姿态
    var orientation = Cesium.Quaternion.fromRotationMatrix(rotation, scratchOrientation);
    this.orientation = orientation;
    return orientation;
  }
  //创建video元素
  _createVideoEle(src) {
    //创建可视域video DOM  元素
    var source_map4 = document.createElement("SOURCE");
    source_map4.type = "video/mp4";
    source_map4.src = src;

    var source_mov = document.createElement("SOURCE");
    source_mov.type = "video/quicktime";
    source_mov.src = src;

    var videoEle = document.createElement("video");
    videoEle.setAttribute("autoplay", true);
    videoEle.setAttribute("loop", true);
    videoEle.setAttribute("crossorigin", true);
    videoEle.appendChild(source_map4);
    videoEle.appendChild(source_mov);
    videoEle.style.display = "none";
    document.body.appendChild(videoEle);
    return videoEle;
  }

  //获取canvas宽高
  _getWinWidHei() {
    var scene = this.viewer.scene;
    return scene.canvas.clientWidth / scene.canvas.clientHeight;
  }

  //创建ShadowMap
  _createShadowMap(reset) {
    var camera_pos = this.cameraPosition;
    var lookat_pos = this.position;
    var scene = this.viewer.scene;
    var camera1 = new Cesium.Camera(scene);
    camera1.position = camera_pos;
    if (this._dirObj && !reset) {
      camera1.direction = this._dirObj.direction;
      camera1.right = this._dirObj.right;
      camera1.up = this._dirObj.up;
    } else {
      camera1.direction = Cesium.Cartesian3.subtract(
        lookat_pos,
        camera_pos,
        new Cesium.Cartesian3(0, 0, 0)
      );
      camera1.up = Cesium.Cartesian3.normalize(camera_pos, new Cesium.Cartesian3(0, 0, 0));
      // this._dirObj = {
      //     direction:camera1.direction,
      //     right:camera1.right,
      //     up:camera1.up
      // }
    }

    var far = Cesium.Cartesian3.distance(lookat_pos, camera_pos);
    this.viewDis = far;
    camera1.frustum = new Cesium.PerspectiveFrustum({
      fov: this.fov,
      aspectRatio: this.aspectRatio,
      near: 0.1,
      far: far * 2
    });

    var isSpotLight = true;
    this.viewShadowMap = new Cesium.ShadowMap({
      lightCamera: camera1,
      enable: false,
      isPointLight: !isSpotLight,
      isSpotLight: isSpotLight,
      cascadesEnabled: false,
      context: scene.context,
      pointLightRadius: far
    });
  }

  //添加视椎体
  _addCameraFrustum() {
    var that = this;
    this.cameraFrustum = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.FrustumOutlineGeometry({
          origin: that.cameraPosition,
          orientation: that.orientation,
          frustum: this.viewShadowMap._lightCamera.frustum,
          _drawNearPlane: true
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(0.0, 0.5, 0.5))
        }
      }),
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: false,
        flat: true
      }),
      asynchronous: false,
      show: this.showFrustum && this.show
    });
    this.viewer.scene.primitives.add(this.cameraFrustum);
  }
  //添加后处理
  _addPostProcess() {
    var that = this;
    var bias = that.viewShadowMap._isPointLight
      ? that.viewShadowMap._pointBias
      : that.viewShadowMap._primitiveBias;
    if (!this.show) return;
    this.postProcess = new Cesium.PostProcessStage({
      fragmentShader: ViewVideoFS,
      uniforms: {
        mixNum: function() {
          return that.alpha;
        },
        dasShadow: function() {
          return that.viewShadowMap._shadowMapTexture;
        },
        videoTexture: function() {
          return that.videoTexture;
        },
        _shadowMap_matrix: function() {
          return that.viewShadowMap._shadowMapMatrix;
        },
        shadowMap_lightPositionEC: function() {
          return that.viewShadowMap._lightPositionEC;
        },
        shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: function() {
          var texelStepSize = new Cesium.Cartesian2();
          texelStepSize.x = 1.0 / that.viewShadowMap._textureSize.x;
          texelStepSize.y = 1.0 / that.viewShadowMap._textureSize.y;
          return Cesium.Cartesian4.fromElements(
            texelStepSize.x,
            texelStepSize.y,
            bias.depthBias,
            bias.normalShadingSmooth,
            this.combinedUniforms1
          );
        },
        shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: function() {
          return Cesium.Cartesian4.fromElements(
            bias.normalOffsetScale,
            that.viewShadowMap._distance,
            that.viewShadowMap.maximumDistance,
            that.viewShadowMap._darkness,
            this.combinedUniforms2
          );
        },
        disViewColor: function() {
          return that._disViewColor;
        },
        clearBlack: function() {
          return that.clearBlack;
        }
      }
    });
    this.viewer.scene.postProcessStages.add(this.postProcess);
  }

  update(frameState) {
    this.viewShadowMap && frameState.shadowMaps.push(this.viewShadowMap);
  }

  destroy() {
    this.viewer.scene.primitives.remove(this);
    if (!this.viewer) return;

    this.viewer.scene.postProcessStages.remove(this.postProcess);
    this.viewer.scene.primitives.remove(this.cameraFrustum);

    if (this.videoElement) {
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
    this.deActiveVideo();

    //删除所有绑定的数据
    for (let i in this) {
      delete this[i];
    }
  }
}
Video3D.Type = Video3DType;
