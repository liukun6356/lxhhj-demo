//聚光灯
import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
import { EffectCollection } from "../scene/EffectCollection";
//聚光灯
export class SpotLight extends DasClass {
    constructor(viewer, options) {
        super(options);
        viewer.effects || (viewer.effects = new EffectCollection(options));
        this._viewer = viewer;
        var defaultLights = [{
            name: "默认点位",
            coords: [113.39086, 49.90735],
            heading: 0,
            modelMatrix: new Cesium.Matrix4
        }];
        this._lights = Cesium.defaultValue(options.lights, defaultLights);
        this._lightEnabled = Cesium.defaultValue(options.lightEnabled, true);
        this._selectedName = Cesium.defaultValue(options.selectedName, "全部");
        this._enabled = Cesium.defaultValue(options.enabled, true);
        this._color = Cesium.Color.fromCssColorString(Cesium.defaultValue(options.color, '#ffffff'));
        this._angle = Cesium.defaultValue(options.angle, 100);
        this._cutoffDistance = Cesium.defaultValue(options.cutoffDistance, 50);
        this._decay = Cesium.defaultValue(options.decay, 2);
        this._lightIntensity = Cesium.defaultValue(options.lightIntensity, 3);
        this.init()
    }
    init() {
        this.createStage(this._lights);
        this._updatePostProcess();
    }
    createStage(lights) {
        var that = this;
        var glStr = `
              precision highp float;
              uniform sampler2D colorTexture;
              uniform sampler2D depthTexture;
              varying vec2 v_textureCoordinates;
            `;
        lights.forEach(function (e, value) {
            glStr += `uniform bool enabled` + value + `;
            uniform vec3 color` + value + `;
            uniform float cutoffDistance` + value + `;
            uniform float decay` + value + `;
            uniform float lightIntensity` + value + `;
            uniform float angle` + value + `;
            uniform vec3 lightPositionEC` + value + `;
            uniform vec3 lightDirEC` + value + `;
            `
        });
        glStr += `
        uniform mat4 inverseViewMatrix;
        uniform mat4 viewMatrix1;
        vec4 toEye(in vec2 uv, in float depth)
        {
            vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));
            vec4 posInCamera =czm_inverseProjection * vec4(xy, depth, 1.0);
            posInCamera =posInCamera / posInCamera.w;
            return posInCamera;
        }
        float getDepth(in vec4 depth)
        {
            float z_window = czm_unpackDepth(depth);
            z_window = czm_reverseLogDepth(z_window);
            float n_range = czm_depthRange.near;
            float f_range = czm_depthRange.far;
            return (2.0 * z_window - n_range - f_range) / (f_range - n_range);
        }
        float saturate( in float a ) { return clamp( a, 0.0, 1.0 ); }
        void main()
        {        
            gl_FragColor = texture2D(colorTexture, v_textureCoordinates);
            float depth = getDepth( texture2D(depthTexture, v_textureCoordinates));
            vec4 viewPos = toEye(v_textureCoordinates, depth);
            viewPos /= viewPos.w;
            vec4 worldPos = inverseViewMatrix*viewPos;
            float logDepthOrDepth = czm_unpackDepth(texture2D(czm_globeDepthTexture, gl_FragCoord.xy / czm_viewport.zw));
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, logDepthOrDepth);
            eyeCoordinate /=eyeCoordinate.w; 
            vec3 pos; vec3 dir;
         `;
        lights.forEach(function (e, value) {
            glStr += `if (enabled` + value + `) {pos=lightPositionEC` + value + `;
                dir=lightDirEC` + value + `;
                vec3 vecToPos = eyeCoordinate.xyz - pos;
                vec3 pointDir = normalize(vecToPos);
                float range = cutoffDistance` + value + `;
                float dis = dot(vecToPos, dir);
                if (dot(dir, pointDir) >= cos(angle` + value + `*0.5) && dis < range) {
                    vec3 lightAdd = color` + value + ` * lightIntensity` + value + `;
                    
                    float b = pow( saturate( -dis / range + 1.0 ), decay${value} );
                    if (range <= 1.0) {
		                float a = 1.0 / (1.0 + decay${value} * dis * dis);
                        b = b * a / dis;
		            } 
		            
		            lightAdd = lightAdd *  b;
		            gl_FragColor += vec4(lightAdd, 1.0);
                }};`
        });
        glStr += `}\n`;
        var uniforms = {};
        lights.forEach(function (lightItem, t) {
            var n = (new Cesium.JulianDate,
                new Cesium.Matrix4,
                new Cesium.Cartesian3)
                , i = new Cesium.Cartesian3
                , r = new Cesium.Cartesian3;
            lightItem.offset,
                lightItem.modelMatrix,
                new Cesium.Cartesian3(1, 0, -0.5),
                uniforms["lightPositionEC" + t] = function () {
                    return Cesium.Matrix4.multiplyByPoint(that._lights[t].modelMatrix, that._lights[t].offset, n),
                        Cesium.Matrix4.multiplyByPoint(that._viewer.camera.viewMatrix, n, n),
                        n
                }
                ,
                uniforms["lightDirEC" + t] = function () {
                    var e = Cesium.Cartesian3.add(that._lights[t].offset, that._lights[t].direction, new Cesium.Cartesian3);
                    return Cesium.Matrix4.multiplyByPoint(that._lights[t].modelMatrix, that._lights[t].offset, n),
                        Cesium.Matrix4.multiplyByPoint(that._viewer.camera.viewMatrix, n, n),
                        Cesium.Matrix4.multiplyByPoint(that._lights[t].modelMatrix, e, i),
                        Cesium.Matrix4.multiplyByPoint(that._viewer.camera.viewMatrix, i, i),
                        Cesium.Cartesian3.subtract(i, n, r),
                        Cesium.Cartesian3.normalize(r, r)
                }
        });
        lights = new Cesium.PostProcessStage({
            fragmentShader: glStr,
            uniforms: uniforms
        });
        this._postProcessStage = lights
    }
    _add() {
        return this._viewer.scene.postProcessStages.add(this._postProcessStage);
    }
    _remove() {
        return this._viewer.scene.postProcessStages.remove(this._postProcessStage);
    }
    getkey(obj) {
        var list = [];
        $.each(obj, function (key, value) {
            list.push(key);
        })
        return list;
    }
    _updatePostProcess() {
        var that = this;
        var t = this.getkey(that._lights);
        var n = this.getkey(t);
        t.unshift("全部"),
            n.unshift(null),
            that._postProcessStage.enabled = that._lightEnabled;
        for (var i = n[t.indexOf(that._selectedName)], r = 0; r < t.length; r++) {
            null !== i && r != i || (that._postProcessStage.uniforms["enabled" + r] = that._enabled,
                that._postProcessStage.uniforms["color" + r] = that._color,
                that._postProcessStage.uniforms["angle" + r] = that._angle / 180 * Math.PI,
                that._postProcessStage.uniforms["cutoffDistance" + r] = that._cutoffDistance,
                that._postProcessStage.uniforms["decay" + r] = that._decay,
                that._postProcessStage.uniforms["lightIntensity" + r] = that._lightIntensity)
        }
    }
    _update() {
        var ellipsoid = this._viewer.scene.globe.ellipsoid;
        var positionItem = this._positions[0];
        this._cartographic = ellipsoid.cartesianToCartographic(positionItem);
        this._minH = Cesium.Cartesian3.fromRadians(this._cartographic.longitude, this._cartographic.latitude, Number(this._minHeight));
        this._maxH = Cesium.Cartesian3.fromRadians(this._cartographic.longitude, this._cartographic.latitude, Number(this._maxHeight));
    }
    destroy() {
        this._viewer.scene.postProcessStages.remove(this._postProcessStage);
    }
    //对外方法

    get viewer() {
        return this._viewer
    }
    set viewer(e) {
        this._viewer = e
    }


    get lights() {
        return this._lights
    }
    set lights(e) {
        e !== this._lights && (this._lights = e,
            this._updatePostProcess())
    }


    get lightEnabled() {
        return this._lightEnabled
    }
    set lightEnabled(e) {
        e !== this._lightEnabled && (this._lightEnabled = e,
            this._updatePostProcess())
    }


    get selectedName() {
        return this._selectedName
    }
    set selectedName(e) {
        e !== this._selectedName && (this._selectedName = e,
            this._updatePostProcess())
    }


    get enabled() {
        return this._enabled
    }
    set enabled(e) {
        e !== this._enabled && (this._enabled = e,
            this._updatePostProcess())
    }


    get color() {
        return this._color
    }
    set color(e) {
        e = Cesium.Color.fromCssColorString(e);
        e !== this._color && (this._color = e,
            this._updatePostProcess())
    }


    get angle() {
        return this._angle
    }
    set angle(e) {
        e !== this._angle && (this._angle = e,
            this._updatePostProcess())
    }


    get cutoffDistance() {
        return this._cutoffDistance
    };
    set cutoffDistance(e) {
        e !== this._cutoffDistance && (this._cutoffDistance = e,
            this._updatePostProcess())
    }


    get decay() {
        return this._decay
    };
    set decay(e) {
        e !== this._decay && (this._decay = e,
            this._updatePostProcess())
    }

    get lightIntensity() {
        return this._lightIntensity
    }
    set lightIntensity(e) {
        e !== this._lightIntensity && (this._lightIntensity = e,
            this._updatePostProcess())
    }

}
