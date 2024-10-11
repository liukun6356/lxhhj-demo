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
                redirect: '/cesium/main/controlPanel',
                children: [
                    {
                        path: 'controlPanel',
                        component: () => import('@/views/cesium/component/controlPanel/index.vue'),
                        name: 'Cesium-main-ControlPanel',
                        meta: {title: 'cover', icon: '', affix: true},
                    },
                ]
            }
        ]
    },
    {
        path: '/three',
        component: () => import('@/layout/index.vue'),
        redirect: '/three/complete',
        name: "Three",
        children: [
            {
                path: 'complete',
                component: () => import('@/views/three/index.vue'),
                name: 'Three-Complete',
            }
        ]
    },
    {
        path: '/webgl',
        component: () => import('@/layout/index.vue'),
        redirect: '/webgl/complete',
        name: "WebGl",
        children: [
            {
                path: 'complete',
                component: () => import('@/views/webgl/index.vue'),
                name: 'WebGl-Complete',
            }
        ]
    },
];

// 创建路由
const router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes,
    // 刷新时，滚动条位置还原
    scrollBehavior: () => ({left: 0, top: 0})
});

export default router;
