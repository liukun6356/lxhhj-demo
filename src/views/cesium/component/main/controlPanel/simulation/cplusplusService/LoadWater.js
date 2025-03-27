import { RenderWater } from './RenderWater'
export class LoadWater {

    constructor(http_requestUrl) {
        this.http_requestUrl = http_requestUrl;
        this.init_info;
        this.model_matrix;
        this.render_water;
    }

    stop_render() {
        this.render_water?.stop_render();
    }

    remove_model() {
        this.render_water?.remove_model();
    }

    async load_history_data(task_id, viewer) {
        const self = this;
        try {
            if (typeof self.init_info == 'undefined' || typeof self.model_matrix == 'undefined') {
                self.init_info = await self.request_init_model(self.http_requestUrl);
                console.log('Initialize succeed: ', self.init_info);
                const position = Cesium.Cartesian3.fromDegrees(self.init_info.longitude, self.init_info.latitude, 0.0);
                const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(-90.5), Cesium.Math.toRadians(0), Cesium.Math.toRadians(0));
                self.model_matrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr);
            }
            if (typeof self.render_water == 'undefined') {
                self.render_water = new RenderWater(self.http_requestUrl, self.model_matrix, viewer);
            }
            const xhr = new XMLHttpRequest();
            xhr.open('POST', self.http_requestUrl + '/history');
            var request = JSON.stringify({
                "task_id": task_id
            });
            xhr.addEventListener("readystatechange", function () {
                if (this.readyState == 4 && this.status == 200) {
                    const surfaceInfo = JSON.parse(this.responseText);
                    console.log('Request history data Succeed:', surfaceInfo);
                    self.render_water.create_model_entity(self.init_info, surfaceInfo);
                }
            });
            xhr.send(request);
        }
        catch (error) {
            console.error('Error in load history data:', error);
        }
    }

    async process_data(task_id, section_path, nc_1d_path, nc_2d_path, use_shp, viewer) {
        const self = this;
        try {
            if (typeof self.init_info == 'undefined' || typeof self.model_matrix == 'undefined') {
                self.init_info = await self.request_init_model(self.http_requestUrl);
                console.log('Initialize succeed: ', self.init_info);
                const position = Cesium.Cartesian3.fromDegrees(113.0357, 25.7974, 0.0);
                const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(-90.5), Cesium.Math.toRadians(0), Cesium.Math.toRadians(0));
                self.model_matrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr);
            }
            if (typeof self.render_water == 'undefined') {
                self.render_water = new RenderWater(self.http_requestUrl, self.model_matrix, viewer);
            }
            const xhr = new XMLHttpRequest();
            xhr.open('POST', self.http_requestUrl + '/ProcessData');
            var request = JSON.stringify({
                "task_id": task_id,
                "section_path": section_path,
                "nc_1d_path": nc_1d_path,
                "nc_2d_path": nc_2d_path,
                "use_shp": use_shp
            });
            xhr.addEventListener("readystatechange", function () {
                if (this.readyState == 4 && this.status == 200) {
                    const surfaceInfo = JSON.parse(this.responseText);
                    console.log('ProcessData Success:', surfaceInfo);
                    self.render_water.create_model_entity(self.init_info, surfaceInfo);
                }
            });
            xhr.send(request);
        }
        catch (error) {
            console.error('Error in load history data:', error);
        }
    }

    async request_init_model() {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.http_requestUrl + '/initialize');
            xhr.addEventListener("readystatechange", function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        const initInfo = JSON.parse(this.responseText);
                        resolve(initInfo); // 当请求成功时，使用resolve返回initInfo  
                    } else {
                        reject(new Error('Request failed.  Returned status of ' + this.status));
                    }
                }
            });
            xhr.send();
        });
    }
}
