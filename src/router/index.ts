import {createRouter, createWebHashHistory} from 'vue-router';

// 静态路由
export const constantRoutes = [
    {
        path: '/',
        redirect: '/three',
    },
    {
        path: '/cesium',
        component: () => import('@/layout/index.vue'),
        redirect: '/cesium/base',
        name: "Cesium",
        children: [
            {
                path: 'fluid',
                component: () => import('@/views/cesium/index.vue'),
                name: 'Cesium-Fluid',
                redirect: '/cesium/fluid/simulateFluid',
                meta: {title: '流体', icon: '', affix: true},
                children: [
                    {
                        path: 'simulateFluid',
                        component: () => import('@/views/cesium/component/fluid/simulateFluid/index.vue'),
                        name: 'Cesium-Fluid-SimulateFluid',
                        meta: {title: '模拟流体', icon: '', affix: true},
                    },
                    {
                        path: 'heightMap',
                        component: () => import('@/views/cesium/component/fluid/heightMap/index.vue'),
                        name: 'Cesium-Fluid-HeightMap',
                        meta: {title: '高度图', icon: '', affix: true},
                    }, {
                        path: 'dxgw2',
                        component: () => import('@/views/cesium/component/fluid/dxgw2/index.vue'),
                        name: 'Cesium-Fluid-dxgw2',
                        meta: {title: '地下管网2', icon: '', affix: true},
                    }, {
                        path: 'dxgw3',
                        component: () => import('@/views/cesium/component/fluid/dxgw3/index.vue'),
                        name: 'Cesium-Fluid-dxgw3',
                        meta: {title: '地下管网3', icon: '', affix: true},
                    },
                    {
                        path: 'triangularMesh',
                        component: () => import('@/views/cesium/component/fluid/triangularMesh/index.vue'),
                        name: 'Cesium-Fluid-TriangularMesh',
                        meta: {title: '二维水动力模型渲染', icon: '', affix: true},
                    }
                ]
            },
            {
                path: 'main',
                component: () => import('@/views/cesium/index.vue'),
                name: 'Cesium-main',
                redirect: '/cesium/main/SimulateFluid',
                meta: {title: 'demo效果', icon: '', affix: true},
                children: [
                    {
                        path: 'controlPanel',
                        component: () => import('@/views/cesium/component/main/controlPanel/index.vue'),
                        name: 'Cesium-Main-ControlPanel',
                        meta: {title: '地图工具栏(图层管理)', icon: '', affix: true},
                    }, {
                        path: 'lengendShow',
                        component: () => import('@/views/cesium/component/main/lengendShow/index.vue'),
                        name: 'Cesium-Main-LengendShow',
                        meta: {title: '图例展示+点聚合(base64)', icon: '', affix: true},
                    }, {
                        path: 'sceneEdit',
                        component: () => import('@/views/cesium/component/main/sceneEdit/index.vue'),
                        name: 'Cesium-Main-SceneEdit',
                        meta: {title: '场景编辑+粒子特效', icon: '', affix: true},
                    }, {
                        path: 'buildingProgression',
                        component: () => import('@/views/cesium/component/main/buildingProgression/index.vue'),
                        name: 'Cesium-Main-BuildingProgression',
                        meta: {title: '楼宇管线场景递进', icon: '', affix: true},
                    }, {
                        path: 'sceneRehearsal',
                        component: () => import('@/views/cesium/component/main/sceneRehearsal/index.vue'),
                        name: 'Cesium-Main-SceneRehearsal',
                        meta: {title: '救援场景演练(czml)', icon: '', affix: true},
                    }, {
                        path: 'polylineFly',
                        component: () => import('@/views/cesium/component/main/polylineFly/index.vue'),
                        name: 'Cesium-Main-PolylineFly',
                        meta: {title: '无人机轨道飞行(clock)', icon: '', affix: true},
                    }, {
                        path: 'flyDemo',
                        component: () => import('@/views/cesium/component/main/flyDemo/index.vue'),
                        name: 'Cesium-Main-flyDemo',
                        meta: {title: '实时轨迹demo', icon: '', affix: true},
                    }
                ]
            },
            {
                path: 'monomer',
                component: () => import('@/views/cesium/index.vue'),
                name: 'Cesium-Monomer',
                redirect: '/cesium/monomer/rangeSearch',
                meta: {title: '单体化', icon: '', affix: true},
                children: [
                    {
                        path: 'tilesetOnlyEntity',
                        component: () => import('@/views/cesium/component/monomer/tilesetOnlyEntity/index.vue'),
                        name: 'Cesium-Monomer-TilesetOnlyEntity',
                        meta: {title: '模型单体化(entity)', icon: '', affix: true},
                    }, {
                        path: 'floorsStacking',
                        component: () => import('@/views/cesium/component/monomer/floorsStacking/index.vue'),
                        name: 'Cesium-Monomer-FloorsStacking',
                        meta: {title: '楼层叠加', icon: '', affix: true},
                    },
                ]
            },
            {
                path: 'analysis',
                component: () => import('@/views/cesium/index.vue'),
                name: 'Cesium-Analysis',
                redirect: '/cesium/analysis/rangeSearch',
                meta: {title: '空间分析', icon: '', affix: true},
                children: [
                    {
                        path: 'rangeSearch',
                        component: () => import('@/views/cesium/component/analysis/rangeSearch/index.vue'),
                        name: 'Cesium-Analysis-RangeSearch',
                        meta: {title: '范围查询(wkt)', icon: '', affix: true},
                    }, {
                        path: 'terrainClipPlan',
                        component: () => import('@/views/cesium/component/analysis/terrainClipPlan/index.vue'),
                        name: 'Cesium-Analysis-TerrainClipPlan',
                        meta: {title: '挖方分析(dom+dem)', icon: '', affix: true},
                    }, {
                        path: 'skyline',
                        component: () => import('@/views/cesium/component/analysis/skyline/index.vue'),
                        name: 'Cesium-Analysis-Skyline',
                        meta: {title: '天际线分析', icon: '', affix: true},
                    },
                ]
            },
            {
                path: 'tools',
                component: () => import('@/views/cesium/index.vue'),
                name: 'Cesium-Tools',
                redirect: '/cesium/tools/rangeSearch',
                meta: {title: '工具控件', icon: '', affix: true},
                children: [
                    {
                        path: 'mapSplit',
                        component: () => import('@/views/cesium/component/tools/mapSplit/index.vue'),
                        name: 'Cesium-Tools-MapSplit',
                        meta: {title: '卷帘', icon: '', affix: true},
                    },
                ]
            },
            {
                path: 'base',
                component: () => import('@/views/cesium/index.vue'),
                name: 'Cesium-Base',
                redirect: '/cesium/base/DrawCommand',
                meta: {title: '原理', icon: '', affix: true},
                children: [
                    {
                        path: 'primitive',
                        component: () => import('@/views/cesium/component/base/primitive/index.vue'),
                        name: 'Cesium-Base-Primitive',
                        meta: {title: 'primitive', icon: '', affix: true},
                    },
                    {
                        path: 'appearance',
                        component: () => import('@/views/cesium/component/base/appearance/index.vue'),
                        name: 'Cesium-Base-Appearance',
                        meta: {title: 'appearance', icon: '', affix: true},
                    },
                    {
                        path: 'DrawCommand',
                        component: () => import('@/views/cesium/component/base/DrawCommand/index.vue'),
                        name: 'Cesium-Base-DrawCommand',
                        meta: {title: 'DrawCommand', icon: '', affix: true},
                    },
                    {
                        path: 'drawFlood',
                        component: () => import('@/views/cesium/component/base/drawFlood/index.vue'),
                        name: 'Cesium-Base-DrawFlood',
                        meta: {title: '画水动力三角形', icon: '', affix: true},
                    },
                ]
            },
        ]
    },
    {
        path: '/cesiumLast',
        component: () => import('@/layout/index.vue'),
        redirect: '/cesiumLast/blob',
        name: "cesium@",
        // noShow: true,
        children: [
            {
                path: 'blob',
                component: () => import('@/views/cesiumLast/index.vue'),
                name: 'cesium@-Blob',
                redirect: '/cesiumLast/blob/switchCamera',
                meta: {title: 'takeaway', icon: '', affix: true},
                children: [
                    {
                        path: 'switchCamera',
                        component: () => import('@/views/cesiumLast/component/blob/switchCamera/index.vue'),
                        name: 'cesium@-Blob-SwitchCamera',
                        meta: {title: '视角切换', icon: '', affix: true},
                    },
                    {
                        path: 'primitive',
                        component: () => import('@/views/cesiumLast/component/blob/primitive/index.vue'),
                        name: 'cesium@-Blob-Primitive',
                        meta: {title: 'primitive-geometry', icon: '', affix: true},
                    },
                    {
                        path: 'appearance',
                        component: () => import('@/views/cesiumLast/component/blob/appearance/index.vue'),
                        name: 'cesium@-Base-Appearance',
                        meta: {title: 'primitive-appearance', icon: '', affix: true},
                    },
                    {
                        path: 'customPrimitive',
                        component: () => import('@/views/cesiumLast/component/blob/customPrimitive/index.vue'),
                        name: 'cesium@-Base-customPrimitive',
                        meta: {title: 'custom-primitive', icon: '', affix: true},
                    },
                ]
            },
            {
                path: 'demo',
                component: () => import('@/views/cesiumLast/index.vue'),
                name: 'cesium@-Demo',
                redirect: '/cesiumLast/blob/switchCamera',
                meta: {title: 'demo', icon: '', affix: true},
                children: [
                    {
                        path: 'switchCamera',
                        component: () => import('@/views/cesiumLast/component/demo/triangularMesh/index.vue'),
                        name: 'cesium@-Demo-TriangularMesh',
                        meta: {title: '水动力网格', icon: '', affix: true},
                    },
                ]
            }
        ]
    },
    {
        path: '/three',
        component: () => import('@/layout/index.vue'),
        redirect: '/three/course',
        name: "Three",
        children: [
            {
                path: 'main',
                component: () => import('@/views/three/index.vue'),
                name: 'Three-Main',
                redirect: '/three/main/3dBuild',
                meta: {title: 'demo效果', icon: '', affix: true},
                children: [
                    {
                        path: '3dBuild',
                        component: () => import('@/views/three/component/main/3dBuild/index.vue'),
                        name: 'Three-Main-3dBuild',
                        meta: {title: '3d楼栋', icon: '', affix: true},
                    },
                    {
                        path: '3dFactory',
                        component: () => import('@/views/three/component/main/3dFactory/index.vue'),
                        name: 'Three-Main-3dFactory',
                        meta: {title: '3d厂区', icon: '', affix: true},
                    },
                ]
            },
            {
                path: 'demo',
                component: () => import('@/views/three/index.vue'),
                name: 'Three-Demo',
                redirect: '/three/demo/instancingBillboards',
                meta: {title: '案例效果', icon: '', affix: true},
                children: [
                    {
                        path: 'instancingBillboards',
                        component: () => import('@/views/three/component/demo/instancingBillboards/index.vue'),
                        name: 'Three-Demo-InstancingBillboards',
                        meta: {title: '柏林噪声', icon: '', affix: true},
                    }
                ]
            }, {
                path: 'stagDemo',
                component: () => import('@/views/three/index.vue'),
                name: 'Three-StagDemo',
                redirect: '/three/course/pointLight',
                meta: {title: 'demo', icon: '', affix: true},
                children: [
                    {
                        path: 'noiseTerrain',
                        component: () => import('@/views/three/component/stagDemo/noiseTerrain/index.vue'),
                        name: 'Three-StagDemo-NoiseTerrain',
                        meta: {title: '噪声地形', icon: '', affix: true},
                    }, {
                        path: 'tubeTravel',
                        component: () => import('@/views/three/component/stagDemo/tubeTravel/index.vue'),
                        name: 'Three-StagDemo-TubeTravel',
                        meta: {title: '隧道穿梭', icon: '', affix: true},
                    }, {
                        path: 'infiniteTunnel',
                        component: () => import('@/views/three/component/stagDemo/infiniteTunnel/index.vue'),
                        name: 'Three-StagDemo-InfiniteTunnel',
                        meta: {title: '无限隧道', icon: '', affix: true},
                    }, {
                        path: 'house',
                        component: () => import('@/views/three/component/stagDemo/house/index.vue'),
                        name: 'Three-StagDemo-House',
                        meta: {title: '盖房子', icon: '', affix: true},
                    }, {
                        path: 'gradientColorBarChart',
                        component: () => import('@/views/three/component/stagDemo/gradientColorBarChart/index.vue'),
                        name: 'Three-StagDemo-GradientColorBarChart',
                        meta: {title: '颜色渐变柱状图', icon: '', affix: true},
                    }, {
                        path: 'snowyForest',
                        component: () => import('@/views/three/component/stagDemo/snowyForest/index.vue'),
                        name: 'Three-StagDemo-SnowyForest',
                        meta: {title: '林海雪原', icon: '', affix: true},
                    }, {
                        path: 'tubeEntryAnimation',
                        component: () => import('@/views/three/component/stagDemo/tubeEntryAnimation/index.vue'),
                        name: 'Three-StagDemo-TubeEntryAnimation',
                        meta: {title: '丝滑入场动画', icon: '', affix: true},
                    }, {
                        path: 'numberRain',
                        component: () => import('@/views/three/component/stagDemo/numberRain/index.vue'),
                        name: 'Three-StagDemo-NumberRain',
                        meta: {title: '数字雨', icon: '', affix: true},
                    }, {
                        path: 'pieChart',
                        component: () => import('@/views/three/component/stagDemo/pieChart/index.vue'),
                        name: 'Three-StagDemo-PieChart',
                        meta: {title: '3D饼图', icon: '', affix: true},
                    }, {
                        path: 'carConfig',
                        component: () => import('@/views/three/component/stagDemo/carConfig/index.vue'),
                        name: 'Three-StagDemo-CarConfig',
                        meta: {title: '汽车选配', icon: '', affix: true},
                    }, {
                        path: 'dancingMirror',
                        component: () => import('@/views/three/component/stagDemo/dancingMirror/index.vue'),
                        name: 'Three-StagDemo-DancingMirror',
                        meta: {title: '练舞房', icon: '', affix: true},
                    }, {
                        path: 'musicPlayer',
                        component: () => import('@/views/three/component/stagDemo/musicPlayer/index.vue'),
                        name: 'Three-StagDemo-MusicPlayer',
                        meta: {title: '音乐播放器', icon: '', affix: true},
                    }, {
                        path: 'tShirtDesign',
                        component: () => import('@/views/three/component/stagDemo/tShirtDesign/index.vue'),
                        name: 'Three-StagDemo-TShirtDesign',
                        meta: {title: 'T恤贴花', icon: '', affix: true},
                    }, {
                        path: 'threejsEditor',
                        component: () => import('@/views/three/component/stagDemo/threejsEditor/index.vue'),
                        name: 'Three-StagDemo-ThreejsEditor',
                        meta: {title: 'three编辑器', icon: '', affix: true},
                    },
                    {
                        path: 'pigHeartEmmiter',
                        component: () => import('@/views/three/component/stagDemo/pigHeartEmmiter/index.vue'),
                        name: 'Three-StagDemo-PigHeartEmmiter',
                        meta: {title: '爱心发射器', icon: '', affix: true},
                    },
                ]
            }, {
                path: 'course',
                component: () => import('@/views/three/index.vue'),
                name: 'Three-Course',
                redirect: '/three/course/pointLight',
                meta: {title: '教程学习', icon: '', affix: true},
                children: [
                    {
                        path: 'pointLight',
                        component: () => import('@/views/three/component/course/pointLight/index.vue'),
                        name: 'Three-Course-PointLight',
                        meta: {title: '场景', icon: '', affix: true},
                    }, {
                        path: 'perspectiveCamera',
                        component: () => import('@/views/three/component/course/perspectiveCamera/index.vue'),
                        name: 'Three-Course-PerspectiveCamera',
                        meta: {title: '透视相机(视锥体)', icon: '', affix: true},
                    }, {
                        path: 'bufferGeometry',
                        component: () => import('@/views/three/component/course/bufferGeometry/index.vue'),
                        name: 'Three-Course-BufferGeometry',
                        meta: {title: 'bufferGeometry', icon: '', affix: true},
                    }, {
                        path: 'pointLineMesh',
                        component: () => import('@/views/three/component/course/pointLineMesh/index.vue'),
                        name: 'Three-Course-PointLineMesh',
                        meta: {title: '点线网格模型', icon: '', affix: true},
                    }, {
                        path: 'materialTexture',
                        component: () => import('@/views/three/component/course/materialTexture/index.vue'),
                        name: 'Three-Course-MaterialTexture',
                        meta: {title: '材质纹理', icon: '', affix: true},
                    }, {
                        path: 'textureUv',
                        component: () => import('@/views/three/component/course/textureUv/index.vue'),
                        name: 'Three-Course-TextureUv',
                        meta: {title: '顶点uv坐标', icon: '', affix: true},
                    }, {
                        path: 'curve',
                        component: () => import('@/views/three/component/course/curve/index.vue'),
                        name: 'Three-Course-Curve',
                        meta: {title: '各种曲线', icon: '', affix: true},
                    }, {
                        path: 'generateGeometry',
                        component: () => import('@/views/three/component/course/generateGeometry/index.vue'),
                        name: 'Three-Course-GenerateGeometry',
                        meta: {title: '各种几何体', icon: '', affix: true},
                    }, {
                        path: 'sceneGroup',
                        component: () => import('@/views/three/component/course/sceneGroup/index.vue'),
                        name: 'Three-Course-SceneGroup',
                        meta: {title: '场景遍历及坐标', icon: '', affix: true},
                    }, {
                        path: 'lightHelper',
                        component: () => import('@/views/three/component/course/lightHelper/index.vue'),
                        name: 'Three-Course-LightHelper',
                        meta: {title: '各种灯光', icon: '', affix: true},
                    }, {
                        path: 'vertexNormal',
                        component: () => import('@/views/three/component/course/vertexNormal/index.vue'),
                        name: 'Three-Course-VertexNormal',
                        meta: {title: '顶点法线反射', icon: '', affix: true},
                    }, {
                        path: 'geometryColor',
                        component: () => import('@/views/three/component/course/geometryColor/index.vue'),
                        name: 'Three-Course-GeometryColor',
                        meta: {title: '顶点颜色渐变', icon: '', affix: true},
                    }, {
                        path: 'gltfStructure',
                        component: () => import('@/views/three/component/course/gltfStructure/index.vue'),
                        name: 'Three-Course-GltfStructure',
                        meta: {title: 'GLTF的三种文件结构', icon: '', affix: true},
                    }, {
                        path: 'box3',
                        component: () => import('@/views/three/component/course/box3/index.vue'),
                        name: 'Three-Course-Box3',
                        meta: {title: '包围盒与模型大小计算', icon: '', affix: true},
                    }, {
                        path: 'orthographicCameraShadow',
                        component: () => import('@/views/three/component/course/orthographicCameraShadow/index.vue'),
                        name: 'Three-Course-OrthographicCameraShadow',
                        meta: {title: '正投影相机和三种灯光的阴影', icon: '', affix: true},
                    }, {
                        path: 'orbitControls',
                        component: () => import('@/views/three/component/course/orbitControls/index.vue'),
                        name: 'Three-Course-OrbitControls',
                        meta: {title: 'OrbitControls 的常用属性方法', icon: '', affix: true},
                    }, {
                        path: 'postProcessing',
                        component: () => import('@/views/three/component/course/postProcessing/index.vue'),
                        name: 'Three-Course-PostProcessing',
                        meta: {title: '后处理', icon: '', affix: true},
                    }, {
                        path: 'sprite',
                        component: () => import('@/views/three/component/course/sprite/index.vue'),
                        name: 'Three-Course-Sprite',
                        meta: {title: '点精灵模型', icon: '', affix: true},
                    }, {
                        path: 'materialShare',
                        component: () => import('@/views/three/component/course/materialShare/index.vue'),
                        name: 'Three-Course-MaterialShare',
                        meta: {title: '几何体材质共用clone,copy', icon: '', affix: true},
                    }, {
                        path: 'tweenAnimation',
                        component: () => import('@/views/three/component/course/tweenAnimation/index.vue'),
                        name: 'Three-Course-TweenAnimation',
                        meta: {title: '动画库Tween', icon: '', affix: true},
                    }, {
                        path: 'keyframesAnimation',
                        component: () => import('@/views/three/component/course/keyframesAnimation/index.vue'),
                        name: 'Three-Course-KeyframesAnimation',
                        meta: {title: '关键帧动画和模型动画播放', icon: '', affix: true},
                    }, {
                        path: 'morphAnimation',
                        component: () => import('@/views/three/component/course/morphAnimation/index.vue'),
                        name: 'Three-Course-MorphAnimation',
                        meta: {title: '改变顶点的变形动画', icon: '', affix: true},
                    }, {
                        path: 'boneAnimation',
                        component: () => import('@/views/three/component/course/boneAnimation/index.vue'),
                        name: 'Three-Course-BoneAnimation',
                        meta: {title: '骨骼动画:顶点运动', icon: '', affix: true},
                    }, {
                        path: 'cssAnnotation',
                        component: () => import('@/views/three/component/course/cssAnnotation/index.vue'),
                        name: 'Three-Course-CssAnnotation',
                        meta: {title: 'dom标签及canvas标签', icon: '', affix: true},
                    }, {
                        path: 'audioApi',
                        component: () => import('@/views/three/component/course/audioApi/index.vue'),
                        name: 'Three-Course-AudioApi',
                        meta: {title: '3d场景音乐', icon: '', affix: true},
                    }, {
                        path: 'pbrMaterial',
                        component: () => import('@/views/three/component/course/pbrMaterial/index.vue'),
                        name: 'Three-Course-PbrMaterial',
                        meta: {title: 'pbr材质', icon: '', affix: true},
                    }, {
                        path: 'reflectorMirror',
                        component: () => import('@/views/three/component/course/reflectorMirror/index.vue'),
                        name: 'Three-Course-ReflectorMirror',
                        meta: {title: '镜子', icon: '', affix: true},
                    }, {
                        path: 'allControls',
                        component: () => import('@/views/three/component/course/allControls/index.vue'),
                        name: 'Three-Course-AllControls',
                        meta: {title: '各种控制器', icon: '', affix: true},
                    }, {
                        path: 'decalGeometry',
                        component: () => import('@/views/three/component/course/decalGeometry/index.vue'),
                        name: 'Three-Course-DecalGeometry',
                        meta: {title: '贴花几何体', icon: '', affix: true},
                    }, {
                        path: 'cannonWorld',
                        component: () => import('@/views/three/component/course/cannonWorld/index.vue'),
                        name: 'Three-Course-CannonWorld',
                        meta: {title: '物理引擎cannon', icon: '', affix: true},
                    }, {
                        path: 'quarksTest',
                        component: () => import('@/views/three/component/course/quarksTest/index.vue'),
                        name: 'Three-Course-QuarksTest',
                        meta: {title: '粒子效果', icon: '', affix: true},
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
                redirect: '/arcgis/main/tsFeature',
                meta: {title: 'demo效果', icon: '', affix: true},
                children: [
                    {
                        path: 'layerManage',
                        component: () => import('@/views/arcgis/component/main/layerManage/index.vue'),
                        name: 'Arcgis-Main-LayerManage',
                        meta: {title: '图层管理', icon: '', affix: true},
                    }, {
                        path: 'tsFeature',
                        component: () => import('@/views/arcgis/component/main/tsFeature/index.vue'),
                        name: 'Arcgis-Main-TsFeature',
                        meta: {title: 'tsFeature', icon: '', affix: true},
                    }, {
                        path: 'tsKriging',
                        component: () => import('@/views/arcgis/component/main/tsKriging/index.vue'),
                        name: 'Arcgis-Main-TsKriging',
                        meta: {title: 'tsKriging', icon: '', affix: true},
                    }, {
                        path: 'tsRaster',
                        component: () => import('@/views/arcgis/component/main/tsRaster/index.vue'),
                        name: 'Arcgis-Main-TsRaster',
                        meta: {title: 'tsRaster', icon: '', affix: true},
                    }
                ]
            }, {
                path: "analysis",
                component: () => import('@/views/arcgis/index.vue'),
                name: 'Arcgis-analysis',
                redirect: '/arcgis/main/rangeSearch',
                meta: {title: '空间分析', icon: '', affix: true},
                children: [
                    {
                        path: 'rangeSearch',
                        component: () => import('@/views/arcgis/component/analysis/rangeSearch/index.vue'),
                        name: 'Arcgis-Analysis-RangeSearch',
                        meta: {title: '范围查询', icon: '', affix: true},
                    }
                ]
            }
        ]
    },
    {
        name: "Leaflet",
        path: '/leaflet',
        component: () => import('@/layout/index.vue'),
        redirect: '/leaflet/main',
        children: [
            {
                path: 'main',
                component: () => import('@/views/leaflet/index.vue'),
                name: 'Leaflet-main',
                redirect: '/leaflet/main/mapSelectLine',
                meta: {title: 'demo效果', icon: '', affix: true},
                children: [
                    {
                        path: 'mapSelectLine',
                        component: () => import('@/views/leaflet/component/main/mapSelectLine.vue'),
                        name: 'Leaflet-Main-MapSelectLine',
                        meta: {title: '点位连接线路', icon: '', affix: true},
                    },
                    {
                        path: 'mapSelectPoint',
                        component: () => import('@/views/leaflet/component/main/mapSelectPoint.vue'),
                        name: 'Leaflet-Main-MapSelectPoint',
                        meta: {title: '选取点位', icon: '', affix: true},
                    },
                    {
                        path: 'mapSelectArea',
                        component: () => import('@/views/leaflet/component/main/mapSelectArea.vue'),
                        name: 'Leaflet-Main-MapSelectArea',
                        meta: {title: '选取区域', icon: '', affix: true},
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
                meta: {title: '案例效果', icon: '', affix: true},
                children: [
                    {
                        path: 'helloWebgl',
                        component: () => import('@/views/webgl/component/main/helloWebgl.vue'),
                        name: 'Webgl-Main-HelloWebgl',
                        meta: {title: '点，线，三角', icon: '', affix: true},
                    },
                    {
                        path: 'spinEditing',
                        component: () => import('@/views/webgl/component/main/spinEditing.vue'),
                        name: 'Webgl-Main-SpinEditing',
                        meta: {title: '旋转编辑', icon: '', affix: true},
                    },
                    {
                        path: 'imageProcessing',
                        component: () => import('@/views/webgl/component/main/imageProcessing.vue'),
                        name: 'Webgl-Main-ImageProcessing',
                        meta: {title: '图像处理', icon: '', affix: true},
                    },
                    {
                        path: 'transform2d',
                        component: () => import('@/views/webgl/component/main/transform2d.vue'),
                        name: 'Webgl-Main-Transform2d',
                        meta: {title: '二维平移', icon: '', affix: true},
                    },
                    {
                        path: 'transform2dmatrix',
                        component: () => import('@/views/webgl/component/main/transform2dmatrix.vue'),
                        name: 'Webgl-Main-Transformtwodmatrix',
                        meta: {title: '二维平移(矩阵)', icon: '', affix: true},
                    },
                    {
                        path: 'transform3d',
                        component: () => import('@/views/webgl/component/main/transform3d.vue'),
                        name: 'Webgl-Main-Transform3d',
                        meta: {title: '三维投影(正射)', icon: '', affix: true},
                    },
                    {
                        path: 'transform3dPerspective',
                        component: () => import('@/views/webgl/component/main/transform3dPerspective.vue'),
                        name: 'Webgl-Main-TransformthreedPerspective',
                        meta: {title: '三维投影(透视)', icon: '', affix: true},
                    },
                    {
                        path: 'cameraAngle',
                        component: () => import('@/views/webgl/component/main/cameraAngle/index.vue'),
                        name: 'Webgl-Main-CameraAngle',
                        meta: {title: '三维相机', icon: '', affix: true},
                    },
                    {
                        path: 'directionLight',
                        component: () => import('@/views/webgl/component/main/directionLight.vue'),
                        name: 'Webgl-Main-DirectionLight',
                        meta: {title: '方向光源', icon: '', affix: true},
                    },
                    {
                        path: 'pointLight',
                        component: () => import('@/views/webgl/component/main/pointLight.vue'),
                        name: 'Webgl-Main-PointLight',
                        meta: {title: '点光源', icon: '', affix: true},
                    },
                    {
                        path: 'codeFun',
                        component: () => import('@/views/webgl/component/main/codeFun/index.vue'),
                        name: 'Webgl-Main-CodeFun',
                        meta: {title: '码少趣多', icon: '', affix: true},
                    },
                ]
            },
            {
                path: 'main',
                component: () => import('@/views/webgl/index.vue'),
                name: 'Webgl-Project',
                redirect: '/webgl/main/helloWebgl',
                meta: {title: '项目shader', icon: '', affix: true},
                children: [
                    {
                        path: 'ts-featureGrid',
                        component: () => import('@/views/webgl/component/project/tsFeatureGrid.vue'),
                        name: 'Webgl-Project-TsFeatureGrid',
                        meta: {title: 'tsFeatureGrid', icon: '', affix: true},
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
        noShow: true,
        children: [
            {
                path: 'main',
                component: () => import('@/views/webgpu/index.vue'),
                name: 'Webgpu-main',
                redirect: '/webgpu/main/helloWebgpu',
                meta: {title: '案例效果', icon: '', affix: true},
                children: [
                    {
                        path: 'helloWebgpu',
                        component: () => import('@/views/webgpu/component/main/hellowebgpu.vue'),
                        name: 'Webgpu-Main-HelloWebgpu',
                        meta: {title: 'helloWebgpu', icon: '', affix: true},
                    },
                ]
            }
        ]
    },
    {
        name: "Ui",
        path: '/ui',
        component: () => import('@/layout/index.vue'),
        redirect: '/ui/main',
        children: [
            {
                path: 'main',
                component: () => import('@/views/ui/index.vue'),
                name: 'Ui-Main',
                redirect: '/ui/main/mapClip',
                meta: {title: 'demo效果', icon: '', affix: true},
                children: [
                    {
                        path: 'mapClip',
                        component: () => import('@/views/ui/component/main/mapClip.vue'),
                        name: 'Ui-Main-MapClip',
                        meta: {title: '地图卷帘', icon: '', affix: true},
                    }, {
                        path: 'dragSort',
                        component: () => import('@/views/ui/component/main/dragSort.vue'),
                        name: 'Ui-Main-DragSort',
                        meta: {title: '拖拽排序', icon: '', affix: true},
                    }, {
                        path: 'gradientBtn',
                        component: () => import('@/views/ui/component/main/gradientBtn.vue'),
                        name: 'Ui-Main-GradientBtn',
                        meta: {title: '渐近伸缩抽屉按钮', icon: '', affix: true},
                    }, {
                        path: 'recursionTree',
                        component: () => import('@/views/ui/component/main/recursionTree/index.vue'),
                        name: 'Ui-Main-RecursionTree',
                        meta: {title: '递归家谱数', icon: '', affix: true},
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
