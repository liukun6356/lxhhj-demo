import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import fragmentShaderSource from "../shaders/PostProcessStage/ViewShed3D.glsl";
import { RectangularSensorGraphics } from "../feature/RectangularSensor/RectangularSensorGraphics";
import { getCurrentMousePosition, addPositionsHeight } from "../util/point";
import { getOnLinePointByLen } from "../util/matrix";

//   可视分析 类
export class ViewShed3D extends DasClass {
  //========== 构造方法 ==========
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    if (Cesium.defined(options.debugFrustum)) options.showFrustum = options.debugFrustum;
    this.debugFrustum = this.showFrustum;

    if (options.calback) {
      var calbackfun = options.calback;
      delete options.calback;
      this.on(eventType.end, e => {
        calbackfun(e.distance, this);
      });
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = options.viewer;
    this.viewer.terrainShadows = Cesium.ShadowMode.ENABLED;

    this.cameraPosition = options.cameraPosition; //相机位置
    this.viewPosition = options.viewPosition; //视点位置

    this._horizontalAngle = Cesium.defaultValue(options.horizontalAngle, 120); //水平张角
    this._verticalAngle = Cesium.defaultValue(options.verticalAngle, 90); //垂直张角
    this._visibleAreaColor = Cesium.defaultValue(
      options.visibleAreaColor,
      new Cesium.Color(0, 1, 0)
    ); //可视颜色
    this._hiddenAreaColor = Cesium.defaultValue(options.hiddenAreaColor, new Cesium.Color(1, 0, 0)); //不可视颜色
    this._alpha = Cesium.defaultValue(options.alpha, 0.5); //混合度
    this._distance = Cesium.defaultValue(options.distance, 100); //距离
    this._maximumDistance = Cesium.defaultValue(options.maximumDistance, 5000.0);
    this._offsetHeight = Cesium.defaultValue(options.offsetHeight, 1.5);
    this._debugFrustum = Cesium.defaultValue(options.showFrustum, true); //视椎体显示
    this._show = Cesium.defaultValue(options.show, true); //可视域显示
    this.isAdd = false; //是否添加过视口
    this._defaultColorTexture = new Cesium.Texture({
      //默认材质
      context: this.viewer.scene.context,
      source: {
        width: 1,
        height: 1,
        arrayBufferView: new Uint8Array([0, 0, 0, 0])
      },
      flipY: false
    });

    if (this.cameraPosition && this.viewPosition) {
      this._addToScene();
    } else {
      this._bindMourseEvent();
    }
  }

  //========== 对外属性 ==========
  //水平张角
  get horizontalAngle() {
    return this._horizontalAngle;
  }
  set horizontalAngle(val) {
    this._horizontalAngle = val;
    this.resetRadar();
  }
  //垂直张角
  get verticalAngle() {
    return this._verticalAngle;
  }
  set verticalAngle(val) {
    this._verticalAngle = val;
    this.resetRadar();
  }
  //可视距离
  get distance() {
    return this._distance;
  }
  set distance(val) {
    this._distance = val;
    this.resetRadar();
  }
  //可视区域颜色
  get visibleAreaColor() {
    return this._visibleAreaColor;
  }
  set visibleAreaColor(val) {
    this._visibleAreaColor = val;
  }
  //不可视区域颜色
  get hiddenAreaColor() {
    return this._hiddenAreaColor;
  }
  set hiddenAreaColor(val) {
    this._hiddenAreaColor = val;
  }
  //混合系数0-1
  get alpha() {
    return this._alpha;
  }
  set alpha(val) {
    this._alpha = val;
  }
  //显示和隐藏
  get show() {
    return this._show;
  }
  set show(val) {
    this._show = val;
    if (val) {
      if (!this.postProcess) this._addPostProcess();
    } else {
      if (this.postProcess) {
        this.viewer.scene.postProcessStages.remove(this.postProcess);
        delete this.postProcess;
      }
    }
    if (this.radar) this.radar.show = this._debugFrustum && this.show;
  }

  get showFrustum() {
    return this._debugFrustum;
  }
  set showFrustum(val) {
    this._debugFrustum = val;
    if (this.radar) this.radar.show = val;
  }

  //========== 方法 ==========
  setCursor(val) {
    this.viewer._container.style.cursor = val ? "crosshair" : "";
  }
  //激活绑定事件
  _bindMourseEvent() {
    var that = this;
    var viewer = this.viewer;
    var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction(movement => {
      var cartesian = getCurrentMousePosition(viewer.scene, movement.position);
      if (!cartesian) return;

      if (!that.cameraPosition) {
        //相机位置
        cartesian = addPositionsHeight(cartesian, that._offsetHeight); //加人的身高等因素，略微抬高一些

        that.cameraPosition = cartesian;
      } else if (that.cameraPosition && !that.viewPosition) {
        var len = Cesium.Cartesian3.distance(that.cameraPosition, cartesian);
        if (len > 5000) {
          cartesian = getOnLinePointByLen(that.cameraPosition, cartesian, 5000);
        }
        that.viewPosition = cartesian;
        that._unbindMourseEvent();
        that.setCursor(false);
        that._addToScene();
      } else {
        that._unbindMourseEvent();
        that.setCursor(false);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(movement => {
      var cartesian = getCurrentMousePosition(viewer.scene, movement.endPosition);
      if (!cartesian) return;
      var cp = that.cameraPosition;
      if (cp) {
        var len = Cesium.Cartesian3.distance(cp, cartesian);
        if (len > 5000) {
          cartesian = getOnLinePointByLen(cp, cartesian, 5000);
          that.frustumQuaternion = that.getFrustumQuaternion(cp, cartesian);
          that.distance = 5000;
        } else {
          that.frustumQuaternion = that.getFrustumQuaternion(cp, cartesian);
          that.distance = Number(len.toFixed(1));
        }
        if (!that.isAdd) {
          that.viewPosition = cartesian;
          that._addToScene();
        } else {
          that.viewPosition = cartesian;
          that.viewShadowMap._lightCamera.direction = Cesium.Cartesian3.subtract(
            cartesian,
            cp,
            new Cesium.Cartesian3(0, 0, 0)
          );
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this._handler = handler;

    this.setCursor(true);
  }

  //解绑事件
  _unbindMourseEvent() {
    if (this._handler) {
      this._handler.destroy();
      delete this._handler;
    }
    this.setCursor(false);
  }

  //添加到场景里
  _addToScene() {
    this.frustumQuaternion = this.getFrustumQuaternion(this.cameraPosition, this.viewPosition);
    this._createShadowMap(this.cameraPosition, this.viewPosition);
    this._addPostProcess();
    if (!this.radar) this.addRadar(this.cameraPosition, this.frustumQuaternion);
    this.viewer.scene.primitives.add(this);
    this.fire(eventType.end, {
      distance: this.distance,
      cameraPosition: this.cameraPosition,
      viewPosition: this.viewPosition
    });
    this.isAdd = true;
  }

  //创建ShadowMap
  _createShadowMap(cpos, viewPosition, fq) {
    var camera_pos = cpos;
    var lookat_pos = viewPosition;
    var scene = this.viewer.scene;
    var camera1 = new Cesium.Camera(scene);
    camera1.position = camera_pos;
    camera1.direction = Cesium.Cartesian3.subtract(
      lookat_pos,
      camera_pos,
      new Cesium.Cartesian3(0, 0, 0)
    );
    camera1.up = Cesium.Cartesian3.normalize(camera_pos, new Cesium.Cartesian3(0, 0, 0));

    var far = Number(Cesium.Cartesian3.distance(lookat_pos, camera_pos).toFixed(1));
    this.distance = far;

    camera1.frustum = new Cesium.PerspectiveFrustum({
      fov: Cesium.Math.toRadians(120),
      aspectRatio: scene.canvas.clientWidth / scene.canvas.clientHeight,
      near: 0.1,
      far: 5000
    });

    var isSpotLight = true;
    this.viewShadowMap = new Cesium.ShadowMap({
      lightCamera: camera1,
      enable: false,
      isPointLight: !isSpotLight,
      isSpotLight: isSpotLight,
      cascadesEnabled: false,
      context: scene.context,
      pointLightRadius: far,
      maximumDistance: this._maximumDistance
    });
  }

  //获取四元数
  getFrustumQuaternion(cpos, viewPosition) {
    //获取相机四元数，用来调整视椎体摆放
    var direction = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(viewPosition, cpos, new Cesium.Cartesian3()),
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
    return orientation;
  }

  //添加后处理
  _addPostProcess() {
    var that = this;
    var bias = that.viewShadowMap._isPointLight
      ? that.viewShadowMap._pointBias
      : that.viewShadowMap._primitiveBias;
    this.postProcess = new Cesium.PostProcessStage({
      fragmentShader: fragmentShaderSource,
      uniforms: {
        czzj: function() {
          return that.verticalAngle;
        },
        dis: function() {
          return that.distance;
        },
        spzj: function() {
          return that.horizontalAngle;
        },
        visibleColor: function() {
          return that.visibleAreaColor;
        },
        disVisibleColor: function() {
          return that.hiddenAreaColor;
        },
        mixNum: function() {
          return that.alpha;
        },
        dasShadow: function() {
          return that.viewShadowMap._shadowMapTexture || that._defaultColorTexture;
        },
        _shadowMap_matrix: function() {
          return that.viewShadowMap._shadowMapMatrix;
        },
        shadowMap_lightPositionEC: function() {
          return that.viewShadowMap._lightPositionEC;
        },
        shadowMap_lightPositionWC: function shadowMap_lightPositionWC() {
          return that.viewShadowMap._lightCamera.position;
        },
        shadowMap_lightDirectionEC: function() {
          return that.viewShadowMap._lightDirectionEC;
        },
        shadowMap_lightUp: function() {
          return that.viewShadowMap._lightCamera.up;
        },
        shadowMap_lightDir: function() {
          return that.viewShadowMap._lightCamera.direction;
        },
        shadowMap_lightRight: function() {
          return that.viewShadowMap._lightCamera.right;
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
        depthTexture1: function() {
          return that.getSceneDepthTexture(that.viewer);
          // return that._defaultDepth;
        }
      }
    });
    this.show && this.viewer.scene.postProcessStages.add(this.postProcess);
  }
  getSceneDepthTexture(viewer) {
    var scene = viewer.scene;
    var environmentState = scene._environmentState;
    var view = scene._view;
    var useGlobeDepthFramebuffer = environmentState.useGlobeDepthFramebuffer;
    var globeFramebuffer = useGlobeDepthFramebuffer ? view.globeDepth.framebuffer : undefined;
    var sceneFramebuffer = view.sceneFramebuffer.getFramebuffer();
    var depthTexture = Cesium.defaultValue(globeFramebuffer, sceneFramebuffer).depthStencilTexture; //对的

    // var depthTexture = scene._view.pickDepths[0]._depthTexture;
    // var depthTexture = scene._view.pickDepths[0]._textureToCopy;
    // var depthTexture = scene._view.pickDepths[0]._copyDepthCommand._framebuffer._colorTextures[0];
    // var depthTexture = this.wyypost&&this.wyypost._depthTexture?this.wyypost._depthTexture:scene.context.uniformState.globeDepthTexture;
    // var depthTexture = scene.context.uniformState.globeDepthTexture;//对的
    return depthTexture;
  }

  //添加雷达
  addRadar(cpos, frustumQuaternion) {
    var position = cpos;
    var that = this;
    this.radar = this.viewer.entities.add(
      new Cesium.Entity({
        position: position,
        orientation: frustumQuaternion,
        show: this._debugFrustum && this.show,
        rectangularSensor: new RectangularSensorGraphics({
          radius: that.distance, //传感器的半径
          xHalfAngle: Cesium.Math.toRadians(that.horizontalAngle / 2), //传感器水平半角
          yHalfAngle: Cesium.Math.toRadians(that.verticalAngle / 2), //传感器垂直半角
          material: new Cesium.Color(0.0, 1.0, 1.0, 0.4), //目前用的统一材质
          lineColor: new Cesium.Color(1.0, 1.0, 1.0, 1.0), //线的颜色
          slice: 8,
          showScanPlane: false, //是否显示扫描面
          showThroughEllipsoid: false, //此参数控制深度检测，为false启用深度检测，可以解决雷达一半在地球背面时显示的问题
          showLateralSurfaces: false,
          showDomeSurfaces: false
        })
      })
    );
  }
  //重置雷达
  resetRadar() {
    this.removeRadar();
    this.addRadar(this.cameraPosition, this.frustumQuaternion);
  }
  //删除雷达
  removeRadar() {
    if (this.radar) {
      this.viewer.entities.remove(this.radar);
      delete this.radar;
    }
  }

  //更新
  update(frameState) {
    this.viewShadowMap && frameState.shadowMaps.push(this.viewShadowMap);
  }

  //销毁
  destroy() {
    this.viewer.terrainShadows = Cesium.ShadowMode.DISABLED;
    this._unbindMourseEvent();

    if (this.postProcess) {
      this.viewer.scene.postProcessStages.remove(this.postProcess);
      delete this.postProcess;
    }
    this.removeRadar();

    super.destroy();
  }
}
