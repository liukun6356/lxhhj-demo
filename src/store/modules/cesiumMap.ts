import {defineStore} from 'pinia'
import {Viewer} from 'cesium'

export interface mapStore {
    cesiumViewer: Viewer | null,
    isActiveMap: Boolean,
}

//用于存储全局Cesium->Viewer对象，在挂载前注意使用markRaw解除vue响应式劫持
export const usemapStore = defineStore({
    id: 'sys',
    state: (): mapStore => ({
        cesiumViewer: null,// 全局地图实例
        isActiveMap: false,// 地图是否初始化完成
    }),
    actions: {
        setCesiumViewer(viewer: Viewer) {
            this.cesiumViewer = viewer
        },
        setIsActiveMap(bool) {
            this.isActiveMap = bool
        },
    }
})
