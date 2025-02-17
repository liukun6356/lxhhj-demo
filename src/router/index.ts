import {createRouter, createWebHashHistory} from 'vue-router';

// 静态路由
export const constantRoutes = [
    {
        path: '/',
        redirect: '/webgl',
    },
    {
        path: '/cesium',
        component: () => import('@/layout/index.vue'),
        redirect: '/cesium/main',
        name: "Cesium",
        children: [
            {
                path: 'main',
                component: () => import('@/views/cesium/index.vue'),
                name: 'Cesium-main',
                redirect: '/cesium/main/SimulateFluid',
                children: [
                    {
                        path: 'controlPanel',
                        component: () => import('@/views/cesium/component/controlPanel/index.vue'),
                        name: 'Cesium-main-ControlPanel',
                        meta: {title: 'controlPanel', icon: '', affix: true},
                    }, {
                        path: 'lengendShow',
                        component: () => import('@/views/cesium/component/lengendShow/index.vue'),
                        name: 'Cesium-main-LengendShow',
                        meta: {title: 'lengendShow', icon: '', affix: true},
                    }, {
                        path: 'rangeSearch',
                        component: () => import('@/views/cesium/component/rangeSearch/index.vue'),
                        name: 'Cesium-analyse-RangeSearch',
                        meta: {title: 'rangeSearch', icon: '', affix: true},
                    }, {
                        path: 'sceneEdit',
                        component: () => import('@/views/cesium/component/sceneEdit/index.vue'),
                        name: 'Cesium-main-SceneEdit',
                        meta: {title: 'sceneEdit', icon: '', affix: true},
                    }, {
                        path: 'buildingProgression',
                        component: () => import('@/views/cesium/component/buildingProgression/index.vue'),
                        name: 'Cesium-main-BuildingProgression',
                        meta: {title: 'buildingProgression', icon: '', affix: true},
                    }, {
                        path: 'terrainClipPlan',
                        component: () => import('@/views/cesium/component/terrainClipPlan/index.vue'),
                        name: 'Cesium-analyse-TerrainClipPlan',
                        meta: {title: 'terrainClipPlan', icon: '', affix: true},
                    }, {
                        path: 'skyline',
                        component: () => import('@/views/cesium/component/skyline/index.vue'),
                        name: 'Cesium-analyse-Skyline',
                        meta: {title: 'skyline', icon: '', affix: true},
                    }, {
                        path: 'tilesetOnlyEntity',
                        component: () => import('@/views/cesium/component/tilesetOnlyEntity/index.vue'),
                        name: 'Cesium-monomer-TilesetOnlyEntity',
                        meta: {title: 'tilesetOnlyEntity', icon: '', affix: true},
                    }, {
                        path: 'floorsStacking',
                        component: () => import('@/views/cesium/component/floorsStacking/index.vue'),
                        name: 'Cesium-monomer-FloorsStacking',
                        meta: {title: 'floorsStacking', icon: '', affix: true},
                    }, {
                        path: 'sceneRehearsal',
                        component: () => import('@/views/cesium/component/sceneRehearsal/index.vue'),
                        name: 'Cesium-main-SceneRehearsal',
                        meta: {title: 'sceneRehearsal', icon: '', affix: true},
                    }, {
                        path: 'polylineFly',
                        component: () => import('@/views/cesium/component/polylineFly/index.vue'),
                        name: 'Cesium-main-PolylineFly',
                        meta: {title: 'polylineFly', icon: '', affix: true},
                    }, {
                        path: 'simulateFluid',
                        component: () => import('@/views/cesium/component/simulateFluid/index.vue'),
                        name: 'Cesium-main-SimulateFluid',
                        meta: {title: 'simulateFluid', icon: '', affix: true},
                    }
                ]
            }
        ]
    },
    {
        path: '/three',
        component: () => import('@/layout/index.vue'),
        redirect: '/three/main',
        name: "Three",
        children: [
            {
                path: 'main',
                component: () => import('@/views/three/index.vue'),
                name: 'Three-main',
                redirect: '/three/main/instancingBillboards',
                children: [
                    {
                        path: 'building',
                        component: () => import('@/views/three/component/building/index.vue'),
                        name: 'Three-main-Building',
                        meta: {title: 'building', icon: '', affix: true},
                    },
                    {
                        path: 'instancingBillboards',
                        component: () => import('@/views/three/component/instancingBillboards/index.vue'),
                        name: 'Three-main-InstancingBillboards',
                        meta: {title: 'instancingBillboards', icon: '', affix: true},
                    }
                ]
            }
        ]
    },
    {
        path: '/arcgis',
        component: () => import('@/layout/index.vue'),
        redirect: '/arcgis/main',
        name: "Arcgis",
        children: [
            {
                path: 'main',
                component: () => import('@/views/arcgis/index.vue'),
                name: 'Arcgis-main',
                redirect: '/arcgis/main/tsKriging',
                children: [
                    {
                        path: 'tsFeature',
                        component: () => import('@/views/arcgis/component/tsFeature/index.vue'),
                        name: 'Arcgis-main-TsFeature',
                        meta: {title: 'tsFeature', icon: '', affix: true},
                    },
                    {
                        path: 'tsKriging',
                        component: () => import('@/views/arcgis/component/tsKriging/index.vue'),
                        name: 'Arcgis-main-TsKriging',
                        meta: {title: 'tsKriging', icon: '', affix: true},
                    },
                    {
                        path: 'tsRaster',
                        component: () => import('@/views/arcgis/component/tsRaster/index.vue'),
                        name: 'Arcgis-main-TsRaster',
                        meta: {title: 'tsRaster', icon: '', affix: true},
                    },
                    {
                        path: 'layerManage',
                        component: () => import('@/views/arcgis/component/layerManage/index.vue'),
                        name: 'Arcgis-main-LayerManage',
                        meta: {title: 'layerManage', icon: '', affix: true},
                    },
                ]
            }
        ]
    },
    {
        path: '/webgl',
        component: () => import('@/layout/index.vue'),
        redirect: '/webgl/main',
        name: "Webgl",
        children: [
            {
                path: 'main',
                component: () => import('@/views/webgl/index.vue'),
                name: 'Webgl-main',
                redirect: '/webgl/main/helloWebgl',
                children: [
                    {
                        path: 'helloWebgl',
                        component: () => import('@/views/webgl/component/helloWebgl.vue'),
                        name: 'Webgl-main-HelloWebgl',
                        meta: {title: 'helloWebgl', icon: '', affix: true},
                    },
                    {
                        path: 'spinEditing',
                        component: () => import('@/views/webgl/component/spinEditing.vue'),
                        name: 'Webgl-main-SpinEditing',
                        meta: {title: 'spinEditing', icon: '', affix: true},
                    },
                    {
                        path: 'imageProcessing',
                        component: () => import('@/views/webgl/component/imageProcessing.vue'),
                        name: 'Webgl-main-ImageProcessing',
                        meta: {title: 'imageProcessing', icon: '', affix: true},
                    },
                    {
                        path: 'transform2d',
                        component: () => import('@/views/webgl/component/transform2d.vue'),
                        name: 'Webgl-main-Transform2d',
                        meta: {title: 'transform2d', icon: '', affix: true},
                    },
                    {
                        path: 'transform2dmatrix',
                        component: () => import('@/views/webgl/component/transform2dmatrix.vue'),
                        name: 'Webgl-main-Transform2dmatrix',
                        meta: {title: 'transform2dmatrix', icon: '', affix: true},
                    },
                    {
                        path: 'transform3d',
                        component: () => import('@/views/webgl/component/transform3d.vue'),
                        name: 'Webgl-main-Transform3d',
                        meta: {title: 'transform3d', icon: '', affix: true},
                    },
                    {
                        path: 'tsFeatureGrid',
                        component: () => import('@/views/webgl/component/tsFeatureGrid.vue'),
                        name: 'Webgl-main-TsFeatureGrid',
                        meta: {title: 'tsFeatureGrid', icon: '', affix: true},
                    },
                    {
                        path: 'transform3dPerspective',
                        component: () => import('@/views/webgl/component/transform3dPerspective.vue'),
                        name: 'Webgl-main-Transform3dPerspective',
                        meta: {title: 'transform3dPerspective', icon: '', affix: true},
                    },
                    {
                        path: 'cameraAngle',
                        component: () => import('@/views/webgl/component/cameraAngle/index.vue'),
                        name: 'Webgl-main-CameraAngle',
                        meta: {title: 'cameraAngle', icon: '', affix: true},
                    },
                    {
                        path: 'directionLight',
                        component: () => import('@/views/webgl/component/directionLight.vue'),
                        name: 'Webgl-main-DirectionLight',
                        meta: {title: 'directionLight', icon: '', affix: true},
                    },
                    {
                        path: 'pointLight',
                        component: () => import('@/views/webgl/component/pointLight.vue'),
                        name: 'Webgl-main-PointLight',
                        meta: {title: 'pointLight', icon: '', affix: true},
                    },
                    {
                        path: 'codeFun',
                        component: () => import('@/views/webgl/component/codeFun/index.vue'),
                        name: 'Webgl-main-CodeFun',
                        meta: {title: 'codeFun', icon: '', affix: true},
                    },
                ]
            }
        ]
    },
    {
        path: '/webgpu',
        component: () => import('@/layout/index.vue'),
        redirect: '/webgpu/main',
        name: "Webgpu",
        children: [
            {
                path: 'main',
                component: () => import('@/views/webgpu/index.vue'),
                name: 'Webgpu-main',
                redirect: '/webgpu/main/helloWebgpu',
                children: [
                    {
                        path: 'helloWebgpu',
                        component: () => import('@/views/webgpu/component/hellowebgpu.vue'),
                        name: 'Webgpu-main-HelloWebgpu',
                        meta: {title: 'helloWebgpu', icon: '', affix: true},
                    },
                ]
            }
        ]
    },
    {
        path: '/ui',
        component: () => import('@/layout/index.vue'),
        redirect: '/ui/main',
        name: "Ui",
        children: [
            {
                path: 'main',
                component: () => import('@/views/ui/index.vue'),
                name: 'Ui-main',
                redirect: '/ui/main/dragSort',
                children: [
                    {
                        path: 'dragSort',
                        component: () => import('@/views/ui/component/dragSort.vue'),
                        name: 'Ui-main-DragSort',
                        meta: {title: 'dragSort', icon: '', affix: true},
                    },
                ]
            }
        ]
    },
    { // 匹配不到跳到首页
        path: "/:pathMatch(.*)*",
        redirect: "/404",
    },
    {
        path: '/404',
        component: () => import('@/views/404.vue'),
        name: "404",
    }
];

// 创建路由
const router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes,
    // 刷新时，滚动条位置还原
    scrollBehavior: () => ({left: 0, top: 0})
});

export default router;
