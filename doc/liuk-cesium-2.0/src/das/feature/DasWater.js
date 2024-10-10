import * as Cesium from "cesium";
import TextureChanged from "./core/TextureChangedWater";
// 镜面反射水
//
export class DasWater {
  //========== 构造方法 ==========

  constructor(options) {
    if (!Cesium.defined(options.viewer)) {
      throw new Cesium.DeveloperError("options.viewer is required.");
    }
    if (!Cesium.defined(options.viewer.scene)) {
      throw new Cesium.DeveloperError("viewer.scene is required.");
    }
    this._scene = options.viewer.scene;
    this._wrfbo = new TextureChanged();
    this._opacity = Cesium.defaultValue(options.opacity, 1);
    this._color = Cesium.defaultValue(options.color, 1);
    this._waterColor = Cesium.Color.fromCssColorString(this._color || "#3388ff").withAlpha(this._opacity);
    this._frequency = Cesium.defaultValue(options.frequency, 1000);
    this._animationSpeed = Cesium.defaultValue(options.animationSpeed, 0.05);
    this._amplitude = Cesium.defaultValue(options.amplitude, 6);
    this._specularIntensity = Cesium.defaultValue(options.specularIntensity, 0.5);
    this._fadeFactor = Cesium.defaultValue(options.fadeFactor, 1);
    this._positions = Cesium.defaultValue(options.positions, []);
    this._trackedPrimitives = [];
    this._isVisible = Cesium.defaultValue(options.isVisible, true);
    this.waterPolygon = this.createWaterPolygonPrimitive(this._positions);
    this.waterHeight = 0;
    this.requestID = 0;
    this.updateReflectTexture();

  }
  //========== 方法 ==========
  createWaterPolygonPrimitive(positions) {
    var _scene = this._scene;
    var Primitive = void 0;
    var fromPositions = void 0;
    var that = this;
    fromPositions = Cesium.CoplanarPolygonGeometry.fromPositions({
      vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
      positions: positions
    });
    var RenderState = new Cesium.RenderState();
    RenderState.depthTest.enabled = true
    Primitive = _scene.primitives.add(new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: fromPositions
      }),
      appearance: new Cesium.Appearance({
        materialSupport: Cesium.MaterialAppearance.MaterialSupport.ALL,
        material: that._createWaterMaterial(),
        renderState: RenderState,
        vertexShaderSource: `attribute vec3 position3DHigh;
          attribute vec3 position3DLow;
          attribute vec3 normal;
          attribute vec3 tangent;
          attribute vec3 bitangent;
          attribute vec2 st;
          attribute float batchId;
          varying vec3 v_positionEC;
          varying vec3 v_normalEC;
          varying vec3 v_tangentEC;
          varying vec3 v_bitangentEC;
          varying vec2 v_st;
          void main()
          {
          vec4 p = czm_computePosition();
          v_positionEC = (czm_modelViewRelativeToEye * p).xyz;
          v_normalEC = czm_normal * normal;
          v_tangentEC = czm_normal * tangent;
          v_bitangentEC = czm_normal * bitangent;
          v_st = st;
          gl_Position = czm_modelViewProjectionRelativeToEye * p;
          }`,
        fragmentShaderSource: `varying vec3 v_positionEC;
          varying vec3 v_normalEC;
          varying vec3 v_tangentEC;
          varying vec3 v_bitangentEC;
          varying vec2 v_st;
          void main()
          {
          vec3 positionToEyeEC = -v_positionEC;
          mat3 tangentToEyeMatrix = czm_tangentToEyeSpaceMatrix(v_normalEC, v_tangentEC, v_bitangentEC);
          vec3 normalEC = normalize(v_normalEC);
          #ifdef FACE_FORWARD
          normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
          #endif
          czm_materialInput materialInput;
          materialInput.normalEC = normalEC;
          materialInput.tangentToEyeMatrix = tangentToEyeMatrix;
          materialInput.positionToEyeEC = positionToEyeEC;
          materialInput.st = v_st;
          czm_material material = czm_getMaterial(materialInput);
          #ifdef FLAT
          gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);
          #else
          gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
          #endif
          }
          `
      })
    }));
    var o = new Cesium.Cartesian3();
    var a = new Cesium.Cartesian3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    var s = new Cesium.Cartesian3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
    positions.forEach(function (e) {
      Cesium.Cartesian3.add(o, e, o);
      a.x = a.x > e.x ? e.x : a.x;
      a.y = a.y > e.y ? e.y : a.y;
      a.z = a.z > e.z ? e.z : a.z;
      s.x = s.x < e.x ? e.x : s.x;
      s.y = s.y < e.y ? e.y : s.y;
      s.z = s.z < e.z ? e.z : s.z;
    });
    var l = s.x - a.x;
    var u = s.y - a.y;
    var h = s.z - a.z;
    var radius = 0.5 * Math.max(l, u, h);
    var centerPos = Cesium.Cartesian3.multiplyByScalar(o, 1 / positions.length, o);
    Primitive.centerPos = centerPos;
    Primitive.radius = radius;
    var getWaterHeight = Cesium.Cartographic.fromCartesian(centerPos);
    Primitive.waterHeight = getWaterHeight.height;
    this._trackPrimitive(Primitive);
    return Primitive;
  }
  _createWaterMaterial() {
    var that = this;
    var material = new Cesium.Material({
      fabric: {
        type: "WaterMaterial",
        uniforms: {
          color: this._waterColor,
          image: Cesium.buildModuleUrl("Assets/Textures/waterNormals.jpg"),
          normalMap: Cesium.buildModuleUrl("Assets/Textures/waterNormals.jpg"),
          frequency: 1000,
          animationSpeed: 0.05,
          amplitude: 2,
          specularIntensity: 0.5,
          fadeFactor: 1
        },
        source:`uniform sampler2D image;
                uniform sampler2D normalMap;
                uniform vec4 color;
                uniform float frequency;
                uniform float animationSpeed;
                uniform float amplitude;
                uniform float specularIntensity;
                uniform float fadeFactor;
                czm_material czm_getMaterial(czm_materialInput materialInput)
                {
                    czm_material material = czm_getDefaultMaterial(materialInput);
                    float time = czm_frameNumber * animationSpeed;
                    // fade is a function of the distance from the fragment and the frequency of the waves
                    float fade = max(1.0, (length(materialInput.positionToEyeEC) / 10000000000.0) * frequency * fadeFactor);
                    float specularMapValue = texture2D(image, materialInput.st).r;
                    specularMapValue = 1.0;
                    // note: not using directional motion at this time, just set the angle to 0.0;
                    vec4 noise = czm_getWaterNoise(normalMap, materialInput.st * frequency, time, 0.0);
                    vec3 normalTangentSpace = noise.xyz * vec3(1.0, 1.0, (1.0 / amplitude));
                    // fade out the normal perturbation as we move further from the water surface
                    normalTangentSpace.xy /= fade;
                    // attempt to fade out the normal perturbation as we approach non water areas (low specular map value)
                    normalTangentSpace = mix(vec3(0.0, 0.0, 50.0), normalTangentSpace, specularMapValue);
                    normalTangentSpace = normalize(normalTangentSpace);
                    // get ratios for alignment of the new normal vector with a vector perpendicular to the tangent plane
                    float tsPerturbationRatio = clamp(dot(normalTangentSpace, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
                    // fade out water effect as specular map value decreases
                    material.alpha = specularMapValue;
                    // base color is a blend of the water and non-water color based on the value from the specular map
                    // may need a uniform blend factor to better control this
                    // material.diffuse = mix(blendColor.rgb, baseWaterColor.rgb, specularMapValue);
                    vec2 v = gl_FragCoord.xy / czm_viewport.zw; 
                    v.y = 1.0 - v.y;
                    // material.diffuse = texture2D(image, v).rgb; 
                    material.diffuse = texture2D(image, v + noise.xy*0.03).rgb; 
                    // diffuse highlights are based on how perturbed the normal is
                    material.diffuse += (0.1 * tsPerturbationRatio);
                    // material.diffuse += (0.1 * tsPerturbationRatio);
                    material.diffuse = material.diffuse;
                    material.normal = normalize(materialInput.tangentToEyeMatrix * normalTangentSpace);
                    material.specular = specularIntensity;
                    material.shininess = 10.0;
                    material.diffuse = color.rgb * material.diffuse;
                    // material.diffuse = mix(material.diffuse,color.rgb, color.a);
                    material.alpha = color.a;
                    return material;
                }`
         
        
        
      }
    });
    material._uniforms.image_1 = function () {
      return that._wrfbo._colorTexture || that._scene.context.defaultTexture;
    };
    material._uniforms.color_0 = function () {
      return that._waterColor;
    };
    material._uniforms.amplitude_5 = function () {
      return that._amplitude;
    };
    material._uniforms.animationSpeed_4 = function () {
      return that._animationSpeed;
    };
    material._uniforms.frequency_3 = function () {
      return that._frequency;
    };
    material._uniforms.specularIntensity_6 = function () {
      return that._specularIntensity;
    };
    material._uniforms.fadeFactor_7 = function () {
      return that._fadeFactor;
    };
    return material;
  }
  _trackPrimitive(pri) {
    ~this._trackedPrimitives.indexOf(pri) || this._trackedPrimitives.push(pri);
  }
  updateReflectTexture() {
    var that = this;
    this._disposeListener = function () {
      var sceneCamera = that._scene.camera,
        sceneCameraVol = sceneCamera.frustum.computeCullingVolume(sceneCamera.positionWC, sceneCamera.directionWC, sceneCamera.upWC);
      if (that._trackedPrimitives.some(function (primitiveItem) {
        if (!primitiveItem.show) return false;
        var bounding = primitiveItem._boundingSphereWC || primitiveItem._boundingVolumes;
        return bounding && bounding.some(function (e) {
          return sceneCameraVol.computeVisibility(e) !== Cesium.Intersect.OUTSIDE;
        });
      })) {
        var i = Number.MAX_VALUE,
          selectPrimitive = void 0;
        that._trackedPrimitives.forEach(function (primitiveItem) {
          if (primitiveItem.show) {
            var bounding = primitiveItem._boundingSphereWC || primitiveItem._boundingVolumes;
            if (bounding && bounding.some(function (e) {
              return sceneCameraVol.computeVisibility(e) !== Cesium.Intersect.OUTSIDE;
            })) {
              var a = Cesium.Cartesian3.distanceSquared(primitiveItem.centerPos, sceneCamera.positionWC) - primitiveItem.radius;
              i > a && (i = a, selectPrimitive = primitiveItem);
            }
          }
        }), selectPrimitive && that.doWork(that._scene, selectPrimitive.waterHeight, that._wrfbo);
      }
      that.requestID = window.requestAnimationFrame(function () {
        that._disposeListener();
      })
    }
    that.requestID = window.requestAnimationFrame(function () {
      that._disposeListener();
    })
  }
  doWork(scene, waterHeight, wrfbo) {
    var that = this;
    var newFrustum1 = new Cesium.PerspectiveFrustum();
    var newOffCenterFrustum1 = new Cesium.PerspectiveOffCenterFrustum();
    var newFrustum2 = new Cesium.OrthographicFrustum();
    var newOffCenterFrustum2 = new Cesium.OrthographicOffCenterFrustum();
    var PassState = Cesium.Cesium3DTilePassState && new Cesium.Cesium3DTilePassState({
      pass: Cesium.Cesium3DTilePass.RENDER
    });
    var tempCamera;
    if (tempCamera || (tempCamera = new Cesium.Camera(scene)), scene.mode === Cesium.SceneMode.SCENE3D) {
      var sceneContext = scene.context;
      var passState = scene._view.passState;
      var cameraClone = Cesium.Camera.clone(scene.camera, tempCamera);
      var cloneCameraPosition = cameraClone.positionCartographic;
      var cloneCameraPitch = cameraClone.pitch;
      var cloneCameraHeading = cameraClone.heading;
      var cloneCameraRoll = cameraClone.roll;
      cameraClone.setView({
        destination: Cesium.Cartesian3.fromRadians(cloneCameraPosition.longitude, cloneCameraPosition.latitude, waterHeight + waterHeight - cloneCameraPosition.height),
        orientation: {
          heading: cloneCameraHeading,
          pitch: -cloneCameraPitch,
          roll: cloneCameraRoll
        }
      });
      var BufferWidth = 0.5 * scene.context.drawingBufferWidth;
      var BufferHeight = 0.5 * scene.context.drawingBufferHeight;
      passState.viewport.x = 0;
      passState.viewport.y = 0;
      passState.viewport.width = BufferWidth;
      passState.viewport.height = BufferHeight;
      passState.framebuffer = wrfbo._framebuffer;
      var clearColorCommand = scene._clearColorCommand;
      Cesium.Color.multiplyByScalar(Cesium.Color.DEEPSKYBLUE, 0.1, clearColorCommand.color);
      clearColorCommand.color.alpha = 1;
      // clearColorCommand.execute(sceneContext, passState);
      if (scene._frameState.useLogDepth) {
        clearColorCommand.execute(sceneContext, passState);
      } else {
        return;
      }
      wrfbo._colorTexture;
      wrfbo.update(sceneContext, BufferWidth, BufferHeight);
      wrfbo._colorTexture;
      var ClearCommand = scene._depthClearCommand;
      var uniformState = sceneContext.uniformState;
      uniformState.updateCamera(cameraClone);
      var cameraCloneMartix;
      if (Cesium.defined(cameraClone.frustum.fov)) {
        cameraCloneMartix = cameraClone.frustum.clone(newFrustum1);
      } else if (Cesium.defined(cameraClone.frustum.infiniteProjectionMatrix)) {
        cameraCloneMartix = cameraClone.frustum.clone(newOffCenterFrustum1)
      } else if (Cesium.defined(cameraClone.frustum.width)) {
        cameraCloneMartix = cameraClone.frustum.clone(newFrustum2)
      } else {
        cameraCloneMartix = cameraClone.frustum.clone(newOffCenterFrustum2)
      }
      cameraCloneMartix.near = cameraClone.frustum.near;
      cameraCloneMartix.far = cameraClone.frustum.far;
      uniformState.updateFrustum(cameraCloneMartix)
      var frameState = scene._frameState;
      frameState.passes.render = true;
      frameState.tilesetPassState = PassState;
      scene.frameState.commandList.length = 0;
      scene._primitives.update(frameState);
      scene._view.createPotentiallyVisibleSet(scene);
      for (var M, S, T, E = scene._view.frustumCommandsList, A = E.length, P = [Cesium.Pass.ENVIRONMENT, Cesium.Pass.GLOBE, Cesium.Pass.TERRAIN_CLASSIFICATION, Cesium.Pass.CESIUM_3D_TILE, Cesium.Pass.TRANSLUCENT], L = 0; L < A; ++L) {
        var D = A - L - 1
        var I = E[D];
        if (D != 0) {
          cameraCloneMartix.near = (I.near * scene.opaqueFrustumNearOffset);
        } else {
          cameraCloneMartix.near = I.near;
        }
        cameraCloneMartix.far = I.far;
        uniformState.updateFrustum(cameraCloneMartix);
        ClearCommand.execute(sceneContext, passState);
        for (var R = 0; R < P.length; R++) {
          // for ( M = I.commands[P[R]], S = I.indices[P[R]], T = 0; T < S; ++T) {
          // M[T].execute(sceneContext, passState);
          for (uniformState.updatePass(P[R]), M = I.commands[P[R]], S = I.indices[P[R]], T = 0; T < S; ++T) {
            !function (e, t, n, i) {
              var r = t._frameState;
              if (!Cesium.defined(t.debugCommandFilter) || t.debugCommandFilter(e)) {
                if (e instanceof Cesium.ClearCommand) {
                  return e.execute(n, i)
                };
                if (r.useLogDepth && Cesium.defined(e.derivedCommands.logDepth)) {
                  e = e.derivedCommands.logDepth.command
                }
                r = r.passes;
                !r.pick && t._hdr && Cesium.defined(e.derivedCommands) && Cesium.defined(e.derivedCommands.hdr) && (e = e.derivedCommands.hdr.command);
                r.pick || r.depth || t.debugShowCommands || t.debugShowFrustums || e.execute(n, i);
              }
            }(M[T], scene, sceneContext, passState);
          }
        }
      }
      passState.framebuffer = null;
      uniformState.das3dWaterHeight = -500000;
    }
  }
  destroy() {
    this._scene.primitives.remove(this.waterPolygon);
    window.cancelAnimationFrame(this.requestID);
    Cesium.destroyObject(this);
  }
  //========== 对外属性 ==========
  get color() {
    return this._color;
  }
  set color(val) {
    this._color = val;
    this._waterColor = Cesium.Color.fromCssColorString(this._color).withAlpha(this._opacity);
  }

  get opacity() {
    return this._opacity;
  }
  set opacity(val) {
    this._opacity = val;
    this._waterColor = Cesium.Color.fromCssColorString(this._color).withAlpha(this._opacity);
  }

  get frequency() {
    return this._frequency;
  }
  set frequency(val) {
    this._frequency = val;
  }

  get animationSpeed() {
    return this._animationSpeed;
  }
  set animationSpeed(val) {
    this._animationSpeed = val;
  }

  get specularIntensity() {
    return this._specularIntensity;
  }
  set specularIntensity(val) {
    this._specularIntensity = val;
  }

  get amplitude() {
    return this._amplitude;
  }
  set amplitude(val) {
    this._amplitude = val;
  }

  get fadeFactor() {
    return this._fadeFactor;
  }
  set fadeFactor(val) {
    this._fadeFactor = val;
  }

  get isVisible() {
    return this._isVisible;
  }
  set isVisible(val) {
    this._isVisible = val;
    if (this.waterPolygon) {
      this.waterPolygon.show = this._isVisible;
    }
  }
}
