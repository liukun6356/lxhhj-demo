import {createRouter, createWebHashHistory} from 'vue-router';

// 静态路由
export const constantRoutes = [
    {
        path: '/',
        redirect: '/cesium',
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
                redirect: '/cesium/main/lengendShow',
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
                        name: 'Cesium-main-RangeSearch',
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
                    },{
                        path: 'terrainClipPlan',
                        component: () => import('@/views/cesium/component/terrainClipPlan/index.vue'),
                        name: 'Cesium-main-TerrainClipPlan',
                        meta: {title: 'terrainClipPlan', icon: '', affix: true},
                    },{
                        path: 'skyline',
                        component: () => import('@/views/cesium/component/skyline/index.vue'),
                        name: 'Cesium-main-Skyline',
                        meta: {title: 'skyline', icon: '', affix: true},
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
                redirect: '/three/main/building',
                children: [
                    {
                        path: 'building',
                        component: () => import('@/views/three/component/building/index.vue'),
                        name: 'Three-main-Building',
                        meta: {title: 'building', icon: '', affix: true},
                    }
                ]
            }
        ]
    },
    {
        path: '/webgl',
        component: () => import('@/layout/index.vue'),
        redirect: '/webgl/main',
        name: "WebGl",
        children: [
            {
                path: 'main',
                component: () => import('@/views/webgl/index.vue'),
                name: 'Webgl-main',
                redirect: '/webgl/main/canvas2d',
                children: [
                    {
                        path: 'canvas2d',
                        component: () => import('@/views/webgl/component/canvas2d/index.vue'),
                        name: 'Webgl-main-Canvas2d',
                        meta: {title: 'building', icon: '', affix: true},
                    }
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
