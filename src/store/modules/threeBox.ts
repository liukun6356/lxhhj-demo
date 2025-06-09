import {defineStore} from 'pinia'

interface ThreeBoxStore {
    renderer: object
    css2DRenderer:object
    css3DRenderer:object
    camera:object
    performanceState: object
    isActiveRenderer: boolean

}

export const usethreeBoxStore = defineStore({
    id: 'threeBoxMap',
    state: (): ThreeBoxStore => ({
        renderer: null,
        css2DRenderer: null,
        css3DRenderer: null,
        camera:null,
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
        getCss2DRenderer() {
            return this.css2DRenderer;
        },
        setCss2DRenderer(css2DRenderer) {
            this.css2DRenderer = css2DRenderer
        },
        getCss3DRenderer() {
            return this.css3DRenderer;
        },
        setCss3DRenderer(css3DRenderer) {
            this.css3DRenderer = css3DRenderer
        },
        getCamera() {
            return this.camera;
        },
        setCamera(camera) {
            this.camera = camera
        },
        setPerformanceState(states) {
            this.performanceState = states
        },
        setIsActiveRenderer(bool) {
            this.isActiveRenderer = bool
        },

    }
})
