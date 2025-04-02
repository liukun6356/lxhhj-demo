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
            }, {
                id: 12,
                label: '天地图-影像注记',
                type: 'img_z',
            }, {
                id: 13,
                label: '天地图-矢量底图',
                type: 'vec_d',
            },
        ],
    }, {
        id: 2,
        label: "水务",
        children: [
            {
                id: 21,
                label: '管网(万级)',
                type: 'multPipline',
            }
        ]
    }

];
