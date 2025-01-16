import {defineStore} from 'pinia'

interface arcgisMapStore {
    arcgisViewer: any
    isActiveMap: boolean
}

export const usearcgisMapStore = defineStore({
    id: 'arcgisMap',
    state: (): arcgisMapStore => ({
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
