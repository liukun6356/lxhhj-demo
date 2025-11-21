import {defineStore} from 'pinia'
import {Viewer} from 'cesium'
import allPointPosList from "@/assets/data/allPointPosList";

interface cesiumLastMap {
    cesiumViewer: any
    dualCesiumViewer: Viewer | null,
    mapType: '2d' | '3d'
    isDualScreen: Boolean
    isActiveMap: boolean
    curSelectTool: '' | '图层' | '图例' | '环境' | '漫游' | '模拟' | '全图' | '数值' | '仿真'
    allPointPosList: Object
}

export const usemapStore = defineStore({
    id: 'cesiumLastMap',
    state: (): cesiumLastMap => ({
        cesiumViewer: null,// 全局地图实例
        dualCesiumViewer: null,// 双屏地图实例
        mapType: '3d',// 当前地图模式
        isDualScreen: false,// 是否双屏模式
        isActiveMap: false,// 地图是否初始化完成
        curSelectTool: "", // 当前选择地图工具
        allPointPosList: allPointPosList, // 所有点高程信息
    }),
    actions: {
        getCesiumViewer() {
            return this.cesiumViewer;
        },
        getDualCesoumViewer() {
            return this.dualCesiumViewer;
        },
        setCesiumViewer(viewer) {
            this.cesiumViewer = viewer
        },
        setDualCesoumViewer(viewer: Viewer) {
            this.dualCesiumViewer = viewer
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
    }
})
