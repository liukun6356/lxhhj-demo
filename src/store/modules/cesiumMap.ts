import {defineStore} from 'pinia'
import {Viewer} from 'cesium'
import allPointPosList from "@/assets/data/allPointPosList"

export interface mapStore {
    cesiumViewer: Viewer | null,
    dualCesiumViewer: Viewer | null,
    mapType: '2d' | '3d',
    isDualScreen: Boolean
    isActiveMap: Boolean,
    curSelectTool: '' | '图层' | '图例' | '环境' | '漫游' | '模拟' | '全图' | '数值' | '仿真',
    numericalValueShowTip: Boolean
    numericalValueShowGrid: Boolean
    allPointPosList: Object
    waterPrimitiveCollection: PrimitiveCollection | null
    isActivewaterPrimitiveCollection: boolean,
    krigingWorker: Worker,
}

//用于存储全局Cesium->Viewer对象，在挂载前注意使用markRaw解除vue响应式劫持
export const usemapStore = defineStore({
    id: 'sys',
    state: (): mapStore => ({
        cesiumViewer: null,// 全局地图实例
        dualCesiumViewer: null,// 双屏地图实例
        mapType: '3d',// 当前地图模式
        isDualScreen: false,// 是否双屏模式
        isActiveMap: false,// 地图是否初始化完成
        curSelectTool: "漫游", // 当前选择地图工具
        numericalValueShowTip: true,// 数值功能-是否显示断面tip 双屏地图交互
        numericalValueShowGrid: true,// 数值功能-是否显示网格 双屏地图交互
        allPointPosList: allPointPosList, // 所有点高程信息
        waterPrimitiveCollection: null,// "功能" primitive集合
        isActivewaterPrimitiveCollection: false,// "功能" primitive集合 是否加载完成
        krigingWorker: new Worker('/worker/worker.js'),//克里金计算线程
    }),
    actions: {
        setCesiumViewer(viewer: Viewer) {
            this.cesiumViewer = viewer
        },
        setDualCesoumViewer(viewer: Viewer) {
            this.dualCesiumViewer = viewer
        },
        getCesiumViewer() {
            return this.cesiumViewer;
        },
        getDualCesoumViewer() {
            return this.dualCesiumViewer;
        },
        setMapType(type) {
            this.mapType = type
        },
        setIsDualScreen(bool) {
            this.isDualScreen = bool
        },
        setIsActiveMap(bool) {
            this.isActiveMap = bool
        },
        setCurSelectTool(tool) {
            this.curSelectTool = tool
        },
        setNumericalValueShowTip(tool) {
            this.numericalValueShowTip = tool
        },
        setNumericalValueShowGrid(tool) {
            this.numericalValueShowGrid = tool
        },
        setWaterPrimitiveCollection(primitiveCollection) {
            this.waterPrimitiveCollection = primitiveCollection
        },
        getWaterPrimitiveCollection() {
            return this.waterPrimitiveCollection
        },
        setIsActivewaterPrimitiveCollection(bool) {
            this.isActivewaterPrimitiveCollection = bool
        },
        // getDrawControl() {
        //     const drawControl = new das3d.Draw({
        //         viewer: this.cesiumViewer,
        //         hasEdit: false
        //     });
        //     return drawControl;
        // },

    }
})
