import {defineStore} from 'pinia'

interface ThreeBoxStore {
    renderer: object
    performanceState: object
    isActiveRenderer:boolean
}

export const usethreeBoxStore = defineStore({
    id: 'threeBoxMap',
    state: (): ThreeBoxStore => ({
        renderer: null,
        performanceState: null,
        isActiveRenderer: false
    }),
    actions: {
        getRenderer() {
            return this.renderer;
        },
        setRenderer(renderer) {
            this.renderer = renderer;
        },
        setPerformanceState(states) {
            this.performanceState = states
        },
        setIsActiveRenderer(bool) {
            this.isActiveRenderer = bool
        }
    }
})
