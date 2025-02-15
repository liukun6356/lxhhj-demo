export default [
    {
        id:4,
        label:"流体模拟",
        children: [
            {
                id: 41,
                label:"模拟流体",
                name:"Cesium-main-SimulateFluid"
            }

        ]
    },
    {
        id: 1,
        label: 'demo效果',
        children: [
            {
                id: 11,
                label: '地图工具栏(图层管理)',
                name: "Cesium-main-ControlPanel"
            },
            {
                id: 12,
                label: "场景编辑+粒子特效",
                name: "Cesium-main-SceneEdit"
            },
            {
                id: 13,
                label: '图例展示+点聚合(base64)',
                name: "Cesium-main-LengendShow"
            },
            {
                id: 14,
                label: "楼宇管线场景递进+白膜",
                name: "Cesium-main-BuildingProgression"
            },
            {
                id: 15,
                label: "救援场景演练(czml)",
                name: "Cesium-main-SceneRehearsal"
            },
            {
                id:16,
                label:"无人机轨道飞行(clock)",
                name:"Cesium-main-PolylineFly"
            }
        ],
    },
    {
        id: 2,
        label: "空间分析",
        children: [
            {
                id: 21,
                label: '范围查询(wkt)',
                name: "Cesium-analyse-RangeSearch"
            },
            {
                id: 22,
                label: '挖方分析(dom+dem)',
                name: "Cesium-analyse-TerrainClipPlan"
            },
            {
                id: 23,
                label: '天际线分析',
                name: "Cesium-analyse-Skyline"
            }
        ]
    },
    {
        id: 3,
        label: "单体化",
        children: [
            {
                id: 31,
                label: '模型单体化(entity)',
                name: "Cesium-monomer-TilesetOnlyEntity"
            },
            {
                id: 32,
                label: '楼层叠加',
                name: "Cesium-monomer-FloorsStacking"
            },
        ]
    }

];
