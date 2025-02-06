import axios,{AxiosPromise} from 'axios';

// 调取天地图 驾车规划
export function getDrive(params): AxiosPromise {
    return axios({
        url:"http://api.tianditu.gov.cn/drive",
        method: 'get',
        params
    });
}
