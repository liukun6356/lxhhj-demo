import * as Cesium from "cesium";
import reflectRender from "./water2/reflectRender";
import refractRender from "./water2/refractRender";
import wrfboReflect from "./water2/wrfboReflect";
// 镜面反射水(全反射)
//
export class DasWater2 {
  //========== 构造方法 ==========

  constructor(options) {
    if (!Cesium.defined(options.viewer)) {
      throw new Cesium.DeveloperError("options.viewer is required.");
    }
    if (!Cesium.defined(options.viewer.scene)) {
      throw new Cesium.DeveloperError("viewer.scene is required.");
    }
    this._layers = options.layers;
    this._scene = options.viewer.scene;
    this._rColor = Cesium.defaultValue(options.rColor, new Cesium.Color(0.439, 0.564, 0.788, 0.5));
    this._normal = Cesium.buildModuleUrl("Assets/Textures/waterNormals.jpg");
    this._brightness = Cesium.defaultValue(options.brightness, 1);
    this._animateSpeed = Cesium.defaultValue(options.animateSpeed, 0.06);
    this._frequency = Cesium.defaultValue(options.frequency, 10);
    this._amplitude = Cesium.defaultValue(options.amplitude, 1);
    this._specularIntensity = Cesium.defaultValue(options.specularIntensity, 0.9);
    this.rPolygon = null;
    this._normalMap = null;
    var that = this;
    Cesium.Resource.fetchImage({
      url: that._normal
    }).then(function(e) {
      (that._normalMap = new Cesium.Texture({
        context: that._scene.frameState.context,
        source: e
      })),
        (that._normalMap.sampler = new Cesium.Sampler({
          wrapS: Cesium.TextureWrap.REPEAT,
          wrapT: Cesium.TextureWrap.REPEAT,
          maximumAnisotropy: 16
        }));
    });
    this._wrfboReflect = new wrfboReflect();
    this._reflectRender = new reflectRender();
    this._wrfboRefract = new wrfboReflect();
    this._refractRender = new refractRender();
    this._positions = Cesium.defaultValue(options.positions, []);
    this._trackedPrimitives = [];
    this._isVisible = Cesium.defaultValue(options.isVisible, true);
    this.createPolygonPrimitive(this._positions, false);
    this.updateReflectTexture();
  }
  //========== 方法 ==========

  createPolygonPrimitive(positions, t) {
    var scene = this._scene;
    var primitive = null;
    var geometry = Cesium.CoplanarPolygonGeometry.fromPositions({
      vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
      positions: positions
    });
    primitive = scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: geometry
        }),
        appearance: new Cesium.MaterialAppearance({
          materialSupport: Cesium.MaterialAppearance.MaterialSupport.ALL,
          closed: true
        })
      })
    );
    primitive.appearance.material = this._createMaterial();
    var val = new Cesium.Cartesian3(),
      maxVal = new Cesium.Cartesian3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
      minVal = new Cesium.Cartesian3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
    positions.forEach(function(position) {
      Cesium.Cartesian3.add(val, position, val),
        (maxVal.x = (maxVal.x > position.x ? position : maxVal).x),
        (maxVal.y = (maxVal.y > position.y ? position : maxVal).y),
        (maxVal.z = (maxVal.z > position.z ? position : maxVal).z),
        (minVal.x = (minVal.x < position.x ? position : minVal).x),
        (minVal.y = (minVal.y < position.y ? position : minVal).y),
        (minVal.z = (minVal.z < position.z ? position : minVal).z);
    });
    var xminVal = minVal.x - maxVal.x;
    var yminVal = minVal.y - maxVal.y;
    var zminVal = minVal.z - maxVal.z;
    xminVal = 0.5 * Math.max(xminVal, yminVal, zminVal);
    yminVal = Cesium.Cartesian3.multiplyByScalar(val, 1 / positions.length, val);
    zminVal = Cesium.Cartesian3.subtract(positions[0], yminVal, new Cesium.Cartesian3());
    positions = Cesium.Cartesian3.subtract(positions[1], yminVal, new Cesium.Cartesian3());
    positions = Cesium.Cartesian3.cross(zminVal, positions, new Cesium.Cartesian3());
    positions = Cesium.Cartesian3.normalize(positions, new Cesium.Cartesian3());
    primitive.centerPos = yminVal;
    primitive.radius = xminVal;
    primitive.normal = positions;
    this._normal = positions;
    Cesium.Cartographic.fromCartesian(yminVal);
    for (
      var planeTmp = Cesium.Plane.fromPointNormal(yminVal, positions), layerIndex = 0;
      layerIndex < this._layers.length;
      layerIndex++
    ) {
      var transform;
      var tileset = this._layers[layerIndex];
      if (tileset.clippingPlanes) {
        transform = tileset.root.transform;
        transform = Cesium.Matrix4.inverse(transform, new Cesium.Matrix4());
        transform = Cesium.Plane.transform(planeTmp, transform);
        tileset.clippingPlanes.get(0).normal = transform.normal;
        tileset.clippingPlanes.get(0).distance = transform.distance;
      }
    }
    this._trackPrimitive(primitive);
    this.rPolygon = primitive;
    this.rPolygon.show = this._isVisible;
    return primitive;
  }
  _createMaterial() {
    var WaterMaterial = new Cesium.Material({
      fabric: {
        type: "DasWater2Material",
        uniforms: {
          color: this._rColor,
          reflect: Cesium.buildModuleUrl("Assets/Textures/waterNormals.jpg"),
          refract: Cesium.buildModuleUrl("Assets/Textures/waterNormals.jpg"),
          normalMap: Cesium.buildModuleUrl("Assets/Textures/waterNormals.jpg"),
          brightness: this._brightness,
          animateSpeed: this._animateSpeed,
          frequency: this._frequency,
          amplitude: this._amplitude,
          specularIntensity: this._specularIntensity
        },
        source: `
        uniform vec4 color;
        uniform sampler2D reflect;
        uniform sampler2D refract;
        uniform sampler2D normalMap;
        uniform float brightness;
        uniform float frequency;
        uniform float animateSpeed;
        uniform float amplitude;
        uniform float specularIntensity;
        czm_material czm_getMaterial(czm_materialInput materialInput)
        {
            czm_material material = czm_getDefaultMaterial(materialInput);
            float specularMapValue = 1.0; 
            float fadeFactor = 1.0;
            float time = czm_frameNumber * animateSpeed;
            // fade is a function of the distance from the fragment and the frequency of the waves
            float fade = max(1.0, (length(materialInput.positionToEyeEC) / 10000000000.0) * frequency * fadeFactor);
            vec4 noise = czm_getWaterNoise(normalMap, materialInput.st * frequency, time, 0.0);
            vec3 normalTangentSpace = noise.xyz * vec3(1.0, 1.0, (1.0 / amplitude));
            // fade out the normal perturbation as we move further from the water surface
            normalTangentSpace.xy /= fade;
            // attempt to fade out the normal perturbation as we approach non water areas (low specular map value)
            normalTangentSpace = mix(vec3(0.0, 0.0, 50.0), normalTangentSpace, specularMapValue);
            normalTangentSpace = normalize(normalTangentSpace);
            // get ratios for alignment of the new normal vector with a vector perpendicular to the tangent plane
            float tsPerturbationRatio = clamp(dot(normalTangentSpace, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
            vec2 uv = gl_FragCoord.xy / czm_viewport.zw; 
            vec3 refract = texture2D(refract, uv + noise.xy*0.03).rgb;
            refract += (0.1 * tsPerturbationRatio);
            uv.x = 1.0 - uv.x;
            vec3 reflect = texture2D(reflect, uv + noise.xy*0.03).rgb;
            reflect += (0.1 * tsPerturbationRatio);
            float reflectance = specularIntensity;
            material.diffuse = mix( refract, reflect, reflectance ); 
            material.diffuse = brightness * color.rgb * material.diffuse;
            material.specular = 0.99;
            material.shininess = 20.0;
            material.alpha = color.a;
            material.normal = normalize(materialInput.tangentToEyeMatrix * normalTangentSpace);
            if ( materialInput.normalEC.z < 0.0 ) {
                material.diffuse.rgb = vec3(0, 0, 0); // back
                material.shininess = 0.0;
                material.specular = 0.0;
                material.alpha = color.a;
            }  
            return material;
        }`
      }
    });
    var that = this;
    return (
      (WaterMaterial._uniforms.color_0 = function() {
        return that._rColor;
      }),
      (WaterMaterial._uniforms.reflect_1 = function() {
        return that._wrfboReflect._colorTexture || that._scene.context.defaultTexture;
      }),
      (WaterMaterial._uniforms.refract_2 = function() {
        return that._wrfboRefract._colorTexture || that._scene.context.defaultTexture;
      }),
      (WaterMaterial._uniforms.normalMap_3 = function() {
        return that._normalMap;
      }),
      (WaterMaterial._uniforms.brightness_4 = function() {
        return that._brightness;
      }),
      (WaterMaterial._uniforms.animateSpeed_5 = function() {
        return that._animateSpeed;
      }),
      (WaterMaterial._uniforms.frequency_6 = function() {
        return that._frequency;
      }),
      (WaterMaterial._uniforms.amplitude_7 = function() {
        return that._amplitude;
      }),
      (WaterMaterial._uniforms.specularIntensity_8 = function() {
        return that._specularIntensity;
      }),
      WaterMaterial
    );
  }
  _trackPrimitive(e) {
    ~this._trackedPrimitives.indexOf(e) || this._trackedPrimitives.push(e);
  }
  updateReflectTexture() {
    var scene = this._scene;
    var that = this;
    this._disposeListener = scene.preRender.addEventListener(function() {
      that._reflectRender.render(that._scene, that.rPolygon, that._wrfboReflect, that._layers);
        that._refractRender.render(that._scene, that.rPolygon, that._wrfboRefract, that._layers);
    });
  }
  release() {
    this._initialized = false;
    this._rPolygon = null;
    this._drawCommand = null;
  }
  destroy() {
    this._scene.primitives.remove(this.rPolygon);
    if (this._disposeListener != null) {
      this._disposeListener();
      this._disposeListener=null;
    }
    Cesium.destroyObject(this);
  }
  get rColor() {
    return this._rColor;
  }
  set rColor(value) {
    this._rColor = value;
  }
  get brightness() {
    return this._brightness;
  }
  set brightness(value) {
    this._brightness = value;
  }
  get frequency() {
    return this._frequency;
  }
  set frequency(value) {
    this._frequency = value;
  }

  get amplitude() {
    return this._amplitude;
  }
  set amplitude(value) {
    this._amplitude = value;
  }
  get specularIntensity() {
    return this._specularIntensity;
  }
  set specularIntensity(value) {
    this._specularIntensity = value;
  }
  get isVisible() {
    return this._isVisible;
  }
  set isVisible(value) {
    this._isVisible = value;
    if (this.rPolygon) {
      this.rPolygon.show = this._isVisible;
    }
  }
}
