export default [
    {
        id: 1,
        label: '基础底图',
        menu: true,
        children: [
            {
                id: 11,
                label: '天地图-影像底图',
                type: 'img_d',
                disabled: true
            },
            {
                id: 12,
                label: '天地图-影像注记',
                type: 'img_z',
            },
            // {
            //     id: 13,
            //     label: '天地图-矢量底图',
            //     type: 'vec_d',
            // },
            // {
            //     id: 14,
            //     label: '天地图-矢量注记',
            //     type: 'vec_z',
            // },
            // {
            //     id: 15,
            //     label: '天地图-地形晕渲',
            //     type: 'ter_d',
            // },
            // {
            //     id: 16,
            //     label: '天地图-地形注记',
            //     type: 'ter_z',
            // },
        ],
    },
    {
        id: 2,
        label: '行政区划',
        children: [
            {
                id: 21,
                label: '区县界',
                type: 'county_boundaries',
            },
            {
                id: 22,
                label: '乡镇界',
                type: 'townshipBoundary',
            },
        ],
    },
    {
        id: 3,
        label: '流域分区',
        children: [
            {
                id: 31,
                label: '流域范围线',
                type: 'catchmentLine',
            },
            {
                id: 32,
                label: '子流域分区',
                type: 'subbasinZoning',
            },
        ],
    },
    {
        id: 4,
        label: '水系',
        menu: true,
        children: [
            {
                id: 41,
                label: '水系线',
                type: 'drainageLine',
            },
        ],
    },
    {
        id: 5,
        label: '倾斜模型',
        children: [
            {
                id: 51,
                label: '中心城区5cm',
                type: 'centralCity5cm',
            },
            {
                id: 52,
                label: '江源水库3cm',
                type: 'riverReservoir3cm',
            },
            {
                id: 53,
                label: '四清水库3cm',
                type: 'siqingReservoir3cm',
            },
            {
                id: 54,
                label: '仙岭水库3cm',
                type: 'xianlingReservoir3cm',
            },
            {
                id: 55,
                label: '王仙湖闸坝3cm',
                type: 'wangxianhuDam3cm',
            },
            {
                id: 56,
                label: '苏仙湖闸坝3cm',
                type: 'suxianhudam3cm',
            },
            {
                id: 57,
                label: '苏仙桥3cm',
                type: 'suXianqiao3cm',
            },
            {
                id: 58,
                label: '东街桥3cm',
                type: 'eastStreetBridge3cm',
            },
            {
                id: 59,
                label: '苏园桥3cm',
                type: 'suyuanqiao3cm',
            }
        ],
    },
    {
        id: 6,
        label: '水利工程',
        children: [
            {
                id: 61,
                label: '水库',
                type: 'wz-reservoir',
            },
            {
                id: 62,
                label: '水电站',
                type: 'wz-hydropowerStation',
            },
            {
                id: 63,
                label: '水闸',
                type: 'wz-gateDam',
            },
        ],
    },
    {
        id: 7,
        label: '测站',
        children: [
            {
                id: 71,
                label: '雨量站',
                type: 'rainfallStation',
            },
            {
                id: 72,
                label: '河道站',
                type: 'riverStation',
            },
            {
                id: 73,
                label: '水库站',
                type: 'reservoirStation',
            },
            {
                id: 74,
                label: '视频测流站',
                type: 'videoTraffic',
            },
            {
                id: 75,
                label: '河湖监控',
                type: 'riverMonitoring',
                // disabled: true
            },
        ],
    },
];