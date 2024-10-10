/*点光源*/
import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
//点光源
export class PointLight extends DasClass {
  constructor(viewer, options) {
    super(options);
    this.viewer = viewer;
    this.options = options;
    this._pointPosition = options.pointPosition;
    this._lightEnabled = Cesium.defaultValue(options.lightEnabled, true);
    this._color = Cesium.Color.fromCssColorString(Cesium.defaultValue(options.color, '#ffffff'));
    this._cutoffDistance = Cesium.defaultValue(options.cutoffDistance, 50);
    this._decay = Cesium.defaultValue(options.decay, 0.03);
    this._lightIntensity = Cesium.defaultValue(options.lightIntensity, 3);
    this.initialize(this.viewer);
  }
  initialize(viewer) {
    var that = this;
    var newPoint = new Cesium.Cartesian3();
    this._postProcessStage = new Cesium.PostProcessStage({
      fragmentShader: `precision highp float;
            uniform sampler2D colorTexture;
            varying vec2 v_textureCoordinates;
            uniform float cutoffDistance;
            uniform float decay;
            uniform float lightIntensity;
            uniform vec3 lightPositionEC;
            uniform vec3 color;
            uniform bool u_enable;
            float pow2( const in float x ) { return x*x; }
          float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
          float saturate( in float a ) { return clamp( a, 0.0, 1.0 ); }
          
          void main()
          {
            gl_FragColor = texture2D(colorTexture, v_textureCoordinates);
            if (u_enable == true) {
              float logDepthOrDepth = czm_unpackDepth(texture2D(czm_globeDepthTexture, gl_FragCoord.xy / czm_viewport.zw));
              vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, logDepthOrDepth);
              eyeCoordinate /= eyeCoordinate.w;
              float dis = distance(eyeCoordinate.xyz, lightPositionEC);
              if (dis < cutoffDistance) {
                vec3 lightAdd = color * lightIntensity;
                
                // if PHYSICALLY_CORRECT_LIGHTS
                // float distanceFalloff = 1.0 / max( pow( dis, 2.0 ), 1.0 );
                // distanceFalloff *= pow2( saturate( 1.0 - pow2( dis / cutoffDistance ) ) );
                
                float distanceFalloff = 1.0;
                if( cutoffDistance > 0.0 && decay > 0.0 ) {
		            if (cutoffDistance <= 1.0) {
		                float a = 1.0 / (1.0 + decay * dis * dis);
                        distanceFalloff = distanceFalloff * a / dis;
		            } else {
		                distanceFalloff = pow( saturate( -dis / cutoffDistance + 1.0 ), decay );
		            }
	            }
	            
                lightAdd = lightAdd * distanceFalloff;
                gl_FragColor += vec4(lightAdd, 1.0);
              }
            };
          } `,
      uniforms: {
        lightPositionEC: function () {
          return Cesium.Matrix4.multiplyByPoint(viewer.camera.viewMatrix, that._pointPosition, newPoint)
        },
        lightEnabled: function () {
          return that._lightEnabled;
        },
        color: function () {
          return that._color;
        },
        cutoffDistance: function () {
          return that._cutoffDistance;
        },
        decay: function () {
          return that._decay;
        },
        lightIntensity: function () {
          return that._lightIntensity;
        },
        u_enable: function () {
          return that._lightEnabled;
        }
      }
    });
     viewer.scene.postProcessStages.add(this._postProcessStage);
  }

  destroy() {
    viewer.scene.postProcessStages.remove(this._postProcessStage);
  }

  //========== 对外属性 ==========
  get pointPosition() {
    return this._pointPosition;
  }
  set pointPosition(value) {
    this._pointPosition = value;
  }

  get lightEnabled() {
    return this._lightEnabled;
  }
  set lightEnabled(value) {
    this._lightEnabled = value;
  }

  get color() {
    return this._color;
  }
  set color(value) {
    this._color = Cesium.Color.fromCssColorString(value);
  }

  get cutoffDistance() {
    return this._cutoffDistance;
  }
  set cutoffDistance(value) {
    this._cutoffDistance = value;
  }

  get decay() {
    return this._decay;
  }
  set decay(value) {
    this._decay = value;
  }

  get lightIntensity() {
    return this._lightIntensity;
  }
  set lightIntensity(value) {
    this._lightIntensity = value;
  }
}
