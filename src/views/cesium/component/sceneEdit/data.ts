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
            {
                id: 13,
                label: '天地图-矢量底图',
                type: 'vec_d',
            },
            {
                id: 14,
                label: '天地图-矢量注记',
                type: 'vec_z',
            },
            {
                id: 15,
                label: '天地图-地形晕渲',
                type: 'ter_d',
            },
            {
                id: 16,
                label: '天地图-地形注记',
                type: 'ter_z',
            },
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
];
