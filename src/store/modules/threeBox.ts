import {defineStore} from 'pinia'

interface ThreeBoxStore {
    renderer: object
    labelRenderer:object
    performanceState: object
    isActiveRenderer: boolean

}

export const usethreeBoxStore = defineStore({
    id: 'threeBoxMap',
    state: (): ThreeBoxStore => ({
        renderer: null,
        labelRenderer: null,
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
        getLabelRenderer() {
            return this.labelRenderer;
        },
        setLabelRenderer(labelRenderer) {
            this.labelRenderer = labelRenderer
        },
        setPerformanceState(states) {
            this.performanceState = states
        },
        setIsActiveRenderer(bool) {
            this.isActiveRenderer = bool
        }
    }
})
