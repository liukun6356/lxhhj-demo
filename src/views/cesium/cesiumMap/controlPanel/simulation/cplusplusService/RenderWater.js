import { CustomWaterShader } from './CustomWaterShader.js'
export class RenderWater {
    constructor(http_requestUrl, model_matrix, viewer) {
        this.http_requestUrl = http_requestUrl;
        this.model_matrix = model_matrix;
        this.currentModel;
        this.viewer = viewer;
        this.current_index0 = -1;
        this.current_index1 = -1;
        this.multiplier = 1.0;
        this.wait_for_change_tex = false;
        this.current_start_time;
        this.current_end_time;
        this.current_during_time;
        this.surface_info;
        this.surface_info_juliandate = new Array;
        this.custom_water_shader;
    }

    stop_render() {
        if (typeof this.currentModel == 'undefined') {
            return;
        }
        this.currentModel.show = false;
        //this.viewer.scene.primitives.remove(this.currentModel);
        this.viewer.clock.shouldAnimate = false;
    }

    remove_model() {
        if (typeof this.currentModel == 'undefined') {
            return;
        }
        if (this.viewer.scene.primitives.contains(this.currentModel) == true) {
            this.stop_render();
        }
        this.currentModel.destroy();
        this.currentModel = undefined
    }

    async create_model_entity(initInfo, surfaceInfo) {
        var self = this;
        self.surface_info = surfaceInfo;
        self.surface_info_juliandate.length = 0;
        for (let i = 0; i < self.surface_info.filelist_blend.length; i++) {
            var t_time_array = self.surface_info.filelist_blend[i].split("_");
            var t_time_ISO_data = t_time_array[0] + '-' + t_time_array[1] + '-' + t_time_array[2];
            var t_time_ISO_time = t_time_array[3] + ':' + t_time_array[4] + ':' + t_time_array[5];
            self.surface_info_juliandate.push(Cesium.JulianDate.fromIso8601(t_time_ISO_data + 'T' + t_time_ISO_time + 'Z'));
        }

        if (self.surface_info.filelist_blend_count < 2) {
            console.warn('Error in Too little data, blend texture count must more then two.');
            return;
        }
        //务必确保五张纹理都加载完成后再进入正式的加载设置
        var surface = await self.load_texture_uniform(new Cesium.Resource({
            url: self.http_requestUrl + self.surface_info.surface_dir_blend + '/' + self.surface_info.filelist_blend[0] + '.png'
        }));
        self.current_index0 = 0;
        var next_surface = await self.load_texture_uniform(new Cesium.Resource({
            url: self.http_requestUrl + self.surface_info.surface_dir_blend + '/' + self.surface_info.filelist_blend[1] + '.png'
        }));
        self.current_index1 = 1;

        var normal = await self.load_texture_uniform(new Cesium.Resource({
            url: self.http_requestUrl + initInfo.normal_tex
        }));
        var sky = await self.load_texture_uniform(new Cesium.Resource({
            url: self.http_requestUrl + initInfo.sky_tex
        }));
        var noise = await self.load_texture_uniform(new Cesium.Resource({
            url: self.http_requestUrl + initInfo.noise_tex
        }));

        //所有数据都准备好后加载模型
        var shader = new CustomWaterShader
        self.custom_water_shader = shader.createShader(surface, next_surface, normal, sky, noise);

        if (typeof self.currentModel == 'undefined') {
            const model = self.viewer.scene.primitives.add(Cesium.Model.fromGltf({
                url: self.http_requestUrl + initInfo.model,
                show: true,
                modelMatrix: self.model_matrix,
                allowPicking: true,
                debugShowBoundingVolume: false,
                debugWireframe: false,
                customShader: self.custom_water_shader
            }));
            model.readyPromise.then(function () {
                self.currentModel = model;
                self.init_clock_to_update_shader()
            });
        }
        else {
            self.currentModel.customShader = self.custom_water_shader;
            self.currentModel.show = true;
            self.init_clock_to_update_shader()
        }

    }

    async load_texture_uniform(resource) {
        try {
            var image = await resource.fetchImage({ flipY: true });
            var tex_uniform = new Cesium.TextureUniform({
                typedArray: Cesium.getImagePixels(image),
                width: image.width,
                height: image.height,
                repeat: true,
                minificationFilter: Cesium.TextureMinificationFilter.LINEAR_MIPMAP_LINEAR,
            });
            return tex_uniform;
        } catch (error) {
            // 捕获任何在加载纹理过程中发生的错误，并拒绝Promise
            throw new Error('load texture uniform failed : ' + resource.url, error);
        }
    }

    init_clock_to_update_shader() {
        const self = this;
        var sueface_blend_count = self.surface_info.filelist_blend_count;
        /*
        var t_0_time_array = self.surface_info.filelist_blend[0].split("_");
        var t_0_time_ISO_data = t_0_time_array[0] + '-' + t_0_time_array[1] + '-' + t_0_time_array[2];
        var t_0_time_ISO_time = t_0_time_array[3] + ':' + t_0_time_array[4] + ':' + t_0_time_array[5];
        var t_0_time = Cesium.JulianDate.fromIso8601(t_0_time_ISO_data + 'T' + t_0_time_ISO_time + 'Z');

        var t_1_array = self.surface_info.filelist_blend[1].split("_");
        var t_1_time_ISO_data = t_1_array[0] + '-' + t_1_array[1] + '-' + t_1_array[2];
        var t_1_time_ISO_time = t_1_array[3] + ':' + t_1_array[4] + ':' + t_1_array[5];
        var t_1_time = Cesium.JulianDate.fromIso8601(t_1_time_ISO_data + 'T' + t_1_time_ISO_time + 'Z');

        var t_n_time_array = self.surface_info.filelist_blend[sueface_blend_count - 1].split("_");
        var t_n_time_ISO_data = t_n_time_array[0] + '-' + t_n_time_array[1] + '-' + t_n_time_array[2];
        var t_n_time_ISO_time = t_n_time_array[3] + ':' + t_n_time_array[4] + ':' + t_n_time_array[5];
        var t_n_time = Cesium.JulianDate.fromIso8601(t_n_time_ISO_data + 'T' + t_n_time_ISO_time + 'Z');
        */
        var t_0_time = self.surface_info_juliandate[0];
        var t_1_time = self.surface_info_juliandate[1];
        var t_n_time = self.surface_info_juliandate[self.surface_info_juliandate.length - 1];

        self.current_start_time = t_0_time;
        self.current_end_time = t_1_time;
        self.current_during_time = Cesium.JulianDate.secondsDifference(self.current_end_time, self.current_start_time);
        console.log("current_index0: " + self.current_index0);
        console.log("current_index1: " + self.current_index1);
        console.log("current_start_time: " + self.current_start_time);
        console.log("current_end_time: " + self.current_end_time);

        self.viewer.clock.startTime = t_0_time;
        self.viewer.clock.currentTime = t_0_time;
        self.viewer.clock.stopTime = t_n_time;
        self.viewer.clock.clockstep = Cesium.ClockStep.TICK_DEPENDENT;
        self.viewer.clock.clockRange = Cesium.ClockRange.CLAMPED
        self.viewer.clock.multiplier = self.multiplier; // 倍速
        self.viewer.clock.onTick.addEventListener(function () {
            self.on_clock_ticked();
        });
        self.viewer.clock.shouldAnimate = true;
        // self.viewer.timeline.zoomTo(t_0_time, t_n_time); // todo
    }

    on_clock_ticked() {
        const self = this;
        //如果正在更换深度纹理，不要响应了，必须要等待这一帧的替换完成
        if (self.wait_for_change_tex) {
            return;
        }
        var since_start = Cesium.JulianDate.compare(self.viewer.clock.currentTime, self.viewer.clock.startTime);
        var since_end = Cesium.JulianDate.compare(self.viewer.clock.currentTime, self.viewer.clock.stopTime);
        if (since_start == 0 || since_end == 0) {
            return;
        }

        var current_time = self.viewer.clock.currentTime;
        for (let i = 0; i < self.surface_info_juliandate.length; i++) {
            var time = self.surface_info_juliandate[i];
            //等同于comparisonResult = current_time-time
            var comparison_result = Cesium.JulianDate.compare(current_time, time);
            var time_index0 = -1;
            var time_index1 = -1;
            //clock设置的是当前仿真的最早与最晚时间，因此current_time永远都在time_line范畴内
            //不用管超出timeline的情况
            if (comparison_result < 0) {
                //找到第一个大于current_time的时刻点，只要不相等i一定大于0
                time_index0 = i - 1;
                time_index1 = i;
                break;
            } else if (comparison_result == 0) {
                if (self.multiplier > 0 && i == self.surface_info_juliandate.length - 1) {
                    //正放需要看是不是最后一个时间刻
                    break;
                }
                else if (self.multiplier < 0 && i == 0) {
                    //倒放需要看是不是第一个时间刻
                    break;
                }
                else {
                    time_index0 = i - 1;
                    time_index1 = i;
                    break;
                }
            } else if (comparison_result === 1) {
                //小于直接跳过
                continue;
            }
        }
        if (time_index0 == -1 || time_index1 == -1) {
            self.viewer.clock.shouldAnimate = false;
            console.log("Time stop.");
            return;
        }

        if (self.current_index0 == time_index0 && self.current_index1 == time_index1) {
            //如果还在当前渲染时间序列内
            var elapsedTime_seconds = Cesium.JulianDate.secondsDifference(self.viewer.clock.currentTime, self.current_start_time);
            var percent = elapsedTime_seconds / self.current_during_time;
            if (percent < 0 || percent > 1) {
                console.log("percent 异常: " + percent);
            }
            self.custom_water_shader.setUniform("u_percent", percent);
        }
        else {
            self.load_new_tex(time_index0, time_index1);
        }
    }

    async load_new_tex(index0, index1) {
        const self = this;
        // var t_0_time_array = self.surface_info.filelist_blend[index0].split("_");
        var t_0_time_array = self.surface_info?.filelist_blend[index0].split("_") || []; // todo
        var t_0_time_ISO_data = t_0_time_array[0] + '-' + t_0_time_array[1] + '-' + t_0_time_array[2];
        var t_0_time_ISO_time = t_0_time_array[3] + ':' + t_0_time_array[4] + ':' + t_0_time_array[5];
        var t_0_time = Cesium.JulianDate.fromIso8601(t_0_time_ISO_data + 'T' + t_0_time_ISO_time + 'Z');

        var t_1_array = self.surface_info.filelist_blend[index1].split("_");
        var t_1_time_ISO_data = t_1_array[0] + '-' + t_1_array[1] + '-' + t_1_array[2];
        var t_1_time_ISO_time = t_1_array[3] + ':' + t_1_array[4] + ':' + t_1_array[5];
        var t_1_time = Cesium.JulianDate.fromIso8601(t_1_time_ISO_data + 'T' + t_1_time_ISO_time + 'Z');

        var during_time = Cesium.JulianDate.secondsDifference(t_1_time, t_0_time);
        self.current_index0 = index0;
        self.current_index1 = index1;
        self.current_start_time = t_0_time;
        self.current_end_time = t_1_time;
        self.current_during_time = during_time;
        console.log("during_time: " + self.current_during_time);
        console.log("current_index0: " + self.current_index0);
        console.log("current_index1: " + self.current_index1);
        console.log("current_start_time: " + self.current_start_time);
        console.log("current_end_time: " + self.current_end_time);

        //等待异步的纹理替换完成
        self.wait_for_change_tex = true;
        var res0 = new Cesium.Resource({
            url: self.http_requestUrl + self.surface_info.surface_dir_blend + '/' + self.surface_info.filelist_blend[index0] + '.png'
        });
        var tex0_uniform = await self.load_texture_uniform(res0);

        var res1 = new Cesium.Resource({
            url: self.http_requestUrl + self.surface_info.surface_dir_blend + '/' + self.surface_info.filelist_blend[index1] + '.png'
        });
        var tex1_uniform = await self.load_texture_uniform(res1);

        self.custom_water_shader.setUniform("u_surface_tex", tex0_uniform);
        self.custom_water_shader.setUniform("u_next_surface_tex", tex1_uniform);
        console.log("Set: " + res0.url);
        console.log("Set: " + res1.url);
        self.custom_water_shader.setUniform("u_percent", 0);
        self.wait_for_change_tex = false;
    }
}
