import axios,{AxiosPromise} from 'axios';

// 调取天地图 驾车规划
export function getDrive(params): AxiosPromise {
    return axios({
        url:"http://api.tianditu.gov.cn/drive",
        method: 'get',
        params
    });
}

// 调取wfs GetFeaturei
export function wfsGetFeaturei(params): AxiosPromise {
    return axios({
        url:import.meta.env.VITE_APP_GEOSERVE_URL + "/zhsw/ows",
        method: 'get',
        params
    });
}
