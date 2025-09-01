import {defineStore} from 'pinia'

interface cesiumLastMap {
    arcgisViewer: any
    isActiveMap: boolean
}

export const usemapStore = defineStore({
    id: 'cesiumLastMap',
    state: (): cesiumLastMap => ({
        arcgisViewer: null,
        isActiveMap: false,// 地图是否初始化完成
    }),
    actions: {
        getCesiumViewer() {
            return this.arcgisViewer;
        },
        setIsActiveMap(bool) {
            this.isActiveMap = bool
        },
        setCesiumViewer(viewer) {
            this.arcgisViewer = viewer
        },
    }
})
