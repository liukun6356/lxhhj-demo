## 项目地址

|  | 链接
| --- | --- 
| 源代码 | https://github.com/liukun6356/lxhhj-demo

## 技术栈

| 技术栈 | 描述 | 官网 |
| --- | --- | --- |
| Cesium | 三维GIS引擎 | https://sandcastle.cesium.com/ |
| mars3d | 开源三维SDK | http://mars3d.cn/project/vue/jcxm.html |
| three | 3D 图形渲染库 | https://threejs.org |
| arcgis | 二维GIS引擎 | https://developers.arcgis.com/javascript/latest/ |
| leaflet | 轻量级交互式地图 | https://leafletjs.cn/ |
| leaflet-draw | 轻量级交互式地图绘制 | https://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html |
| Turf | 地理空间分析工具 | https://turfjs.fenxianglu.cn/ |
| proj4 | 地理坐标转换 | http://proj4js.org/ |
| earcut | 多边形三角剖分库 | https://github.com/mapbox/earcut/ |
| arrugator | GIS栅格图像重投影 | https://gitlab.com/IvanSanchez/arrugator/ |
| geotiff | 解析和处理GeoTIFF文件 | https://geotiffjs.github.io/ |
| gl-matrix | 矩阵和向量计算 | https://glmatrix.net/ |
| simplex-noise | Simplex噪声库 | https://github.com/jwagner/simplex-noise.js |
| @tweenjs/tween.js | 补间动画库 | https://www.npmjs.com/package/@tweenjs/tween.js |
| three-spritetext | three文本库 | https://www.npmjs.com/package/@tweenjs/tween.js |
| geoserver |编辑和发布地理控件| https://geoserver.org/ |
| Vue3 | 渐进式 JavaScript 框架 | https://v3.cn.vuejs.org/ |
| TypeScript | JavaScript 的一个超集 | https://www.tslang.cn/ |
| Vite | 前端开发与构建工具 | https://cn.vitejs.dev/ |
| Element Plus | 基于 Vue 3，面向设计师和开发者的组件库 | https://element-plus.gitee.io/zh-CN/ |
| lil-gui | 轻量界面库 | https://lil-gui.georgealways.com/ |
| Pinia | 新一代状态管理工具 | https://pinia.vuejs.org/ |
| Vue Router | Vue.js 的官方路由 | https://router.vuejs.org/zh/ |

## 环境要求

- Node 环境 版本：18.0.0
- 开发工具 Webstorm

## 目录结构
```
├── dist/               # 构建输出
├── public/             # 公共资源
├── src/                # 源代码
│   ├─ api/             # 接口请求
│   ├─ assets/          # 静态资源
│   ├─ cesium-source/   # cesium源码包
│   ├─ components/      # 公共组件
│   ├─ layout/          # 布局组件
│   ├─ router/          # 路由配置
│   ├─ store/           # 状态管理
│   ├─ styles/          # 样式文件
│   ├─ utils/           # 工具函数
│   ├─ views/           # 页面视图
│       ├─ arcgis/      # arcgis应用
│       ├─ cesium/      # cesium应用
│       ├─ cesiumLast/  # cesiumLast应用
│       ├─ leaflet/     # leaflet应用
│       ├─ three/       # three应用
│       ├─ ui/          # vite应用
│       ├─ webgl/       # webgl应用
│       ├─ webgpu/      # webgpu应用
│       └─ 404.vue      # 404页面
│   ├─ App.vue          # 根组件
│   └─ main.ts          # 程序入口
├── .env.development    # 开发环境
├── .env.production     # 生产环境
├── .env.staging        # 测试环境
├── .gitignore          # 忽略文件
├── package.json        # 项目配置
├── index.html          # 入口页面
├── tsconfig.json       # TS 配置
├── vite.config.ts      # Vite配置
├── yarn.lock           # 锁定依赖
└── README.md           # 项目说明
```

## 项目启动

1. 安装依赖

    ```bash
    yarn install
    ```
2. 启动运行

    ```bash
    yarn dev
    ```
3. 访问测试 浏览器访问： [链接](localhost:60219)
4. 测试环境打包
    ```bash
    yarn build:staging
    ```
5. 正式环境打包
    ```bash
    yarn build:prod
    ```

## <img src="https://profile-avatar.csdnimg.cn/0b75e2e590014770956b95dd23ef9a41_hr_beginner.jpg" width="50" height="50" alt="描述图片的文字" style="position:relative;top:15px"> 柳晓黑胡椒

https://blog.csdn.net/hr_beginner

```javascript                                                                              
  ,--,                                ,-.  
,--.'|     ,--,                   ,--/ /|  
|  | :   ,--.'|            ,--, ,--. :/ |  
:  : '   |  |,           ,'_ /| :  : ' /   
|  ' |   `--'_      .--. |  | : |  '  /    
'  | |   ,' ,'|   ,'_ /| :  . | '  |  :    
|  | :   '  | |   |  ' | |  . . |  |   \   
'  : |__ |  | :   |  | ' |  | | '  : |. \  
|  | '.'|'  : |__ :  | : ;  ; | |  | ' \ \ 
;  :    ;|  | '.'|'  :  `--'   \'  : |--'  
|  ,   / ;  :    ;:  ,      .-./;  |,'     
 ---`-'  |  ,   /  `--`----'    '--'       
          ---`-'                                                                
```
