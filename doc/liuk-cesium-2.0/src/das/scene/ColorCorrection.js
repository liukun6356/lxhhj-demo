//颜色校正
//关于这些值的示例可参考https://www.freesion.com/article/96731097085/
import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
import { EffectCollection } from "../scene/EffectCollection";

export class ColorCorrection extends DasClass {
    constructor(options, oldparam) {
        super(options);

        //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
        if (options instanceof Cesium.Viewer) {
            options = {
                viewer: options,
                ...oldparam
            };
        }
        //兼容v2.2之前旧版本处理,非升级用户可删除上面代码
        options.viewer.effects || (options.viewer.effects = new EffectCollection(options));
        this._viewer = Cesium.defaultValue(options.viewer, viewer);
            this._viewer.clock.shouldAnimate = true;
            this._isBrightness = Cesium.defaultValue(options.isBrightness, void 0);
            this._enabled = Cesium.defaultValue(options.enabled, this._isBrightness);
            this._enabled = Cesium.defaultValue(this._enabled, true);
            this._brightness = Cesium.defaultValue(options.brightness, 0.4);
            this._contrast = Cesium.defaultValue(options.contrast, 0.4);
            this._saturation = Cesium.defaultValue(options.saturation, 0.4);
            this._hue = Cesium.defaultValue(options.hue, 0.4);
            this._gamma = Cesium.defaultValue(options.gamma, 0.4);
            this.initialize();
    }
    initialize() {
        this._postProcessStage = new Cesium.PostProcessStage({
            fragmentShader: "\n        uniform sampler2D colorTexture;\n        uniform float u_brightness;\n        uniform float u_contrast;\n        uniform float u_saturation;\n        uniform float u_hue;\n        uniform float u_gamma;\n        \n        varying vec2 v_textureCoordinates;\n        \n        void main(void)\n        {\n            gl_FragColor = texture2D(colorTexture, v_textureCoordinates);\n            gl_FragColor.rgb = mix(vec3(0.0), gl_FragColor.rgb, u_brightness);\n            gl_FragColor.rgb = mix(vec3(0.5), gl_FragColor.rgb, u_contrast);\n            gl_FragColor.rgb = czm_hue(gl_FragColor.rgb, u_hue);\n            gl_FragColor.rgb = czm_saturation(gl_FragColor.rgb, u_saturation);\n            // gamma\n            //input\n            //float3 diffuseCol = pow(tex2D( diffTex, texCoord ), 2.2 );  \n            //output\n            //fragColor.rgb = pow(fragColor.rgb, 1.0/2.2);\n        }\n        ",
            uniforms: {
                u_brightness: this._brightness,
                u_contrast: this._contrast,
                u_saturation: this._saturation,
                u_hue: this._hue,
                u_gamma: this._gamma
            }
        });
        this._postProcessStage.enabled = this._enabled;
    }
    _update() {
        this._postProcessStage.enabled = this._isBrightness,
            this._postProcessStage.enabled = Cesium.defaultValue(this._enabled, this._isBrightness),
            this._postProcessStage.uniforms.u_brightness = this._brightness,
            this._postProcessStage.uniforms.u_contrast = this._contrast,
            this._postProcessStage.uniforms.u_saturation = this._saturation,
            this._postProcessStage.uniforms.u_hue = this._hue,
            this._postProcessStage.uniforms.u_gamma = this._gamma
    }
    destroy() {
        if (this._postProcessStage) {
            this._postProcessStage.destroy();
            Cesium.destroyObject(this)
        }
    }
    _add() {
        return this._viewer.scene.postProcessStages.add(this._postProcessStage)
    }
    _remove() {
        return this._viewer.scene.postProcessStages.remove(this._postProcessStage)
    }
    pause() {
        this.enabled = false;
    }
    resume() {
        this.enabled = true;
    }
    //暴露的方法
    get viewer() {
        return this._viewer;
    }
    set viewer(val) {
        this._viewer = val;
    }
    //是否可以修改亮度
    get isBrightness() {
        return this._isBrightness;
    }
    set isBrightness(val) {
        this._isBrightness = val;
        this._enabled = this._isBrightness;
        this._update();
    }

    //是否启用后处理
    get enabled() {
        return this._postProcessStage.enabled;
    }
    set enabled(val) {
        this._viewer = val
    }

    //亮度
    get brightness() {
        return this._brightness
    }
    set brightness(val) {
        this._brightness = Number(val);
        this._update();
    }

    //对比度
    get contrast() {
        return this._contrast;
    }
    set contrast(val) {
        this._contrast = Number(val);
        this._update();
    }

    //饱和度
    get saturation() {
        return this._saturation;
    }
    set saturation(val) {
        this._saturation = Number(val);
        this._update();
    }

    //色调
    get hue() {
        return this._hue;
    }
    set hue(val) {
        this._hue = Number(val);
        this._update();
    }

    //伽马值
    get gamma() {
        return this._gamma
    }
    set gamma(val) {
        this._gamma = Number(val);
        this._update();
    }
}
