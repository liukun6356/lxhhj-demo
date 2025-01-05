import {defineStore} from 'pinia'

interface WebglGlStore {
    gl: object
    isActiveGl: boolean
}

export const usewebglGlStore = defineStore({
    id: 'globalMap',
    state: (): WebglGlStore => ({
        gl: null,
        isActiveGl: false
    }),
    actions: {
        getWebglGl() {
            return this.gl;
        },
        setWebglGl(obj) {
            this.gl = obj;
        },
        setIsActiveGl(bool) {
            this.isActiveGl = bool
        }
    }
})
