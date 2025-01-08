import {defineStore} from 'pinia'

interface mapStore {
    arcgisViewer: any
    isActiveMap: boolean
}

export const usemapStore = defineStore({
    id: 'arcgisMap',
    state: (): mapStore => ({
        arcgisViewer: null,
        isActiveMap: false,// 地图是否初始化完成
    }),
    actions: {
        getArcgisViewer() {
            return this.arcgisViewer;
        },
        setIsActiveMap(bool) {
            this.isActiveMap = bool
        },
        setArcgisViewer(viewer) {
            this.arcgisViewer = viewer
        },
    }
})
