import {defineStore} from 'pinia'
import {generateUUID} from "@/utils/dictionary"

interface ThreejsEditorStore {
    meshArr: object[]
    selObj: object
}

export enum MeshTypes {
    Box = 'Box',
    Cylinder = 'Cylinder',
}

export const usethreejsEditorStore = defineStore({
    id: 'threejsEditor',
    state: (): ThreejsEditorStore => ({
        meshArr: [
            {
                id: 1,
                type: 'Box',
                name: 'Box1',
                props: {
                    width: 500,
                    height: 200,
                    depth: 200,
                    material: {
                        color: 'orange',
                    },
                    position: {x: 0, y: 0, z: 0},
                    scale: {x: 1, y: 1, z: 1},
                    rotation: {x: 0, y: 0, z: 0}
                }
            }
        ],
        selObj: null
    }),
    actions: {
        addMesh(type: MeshTypes) {
            const uuid = generateUUID()
            let mesh
            switch (type) {
                case MeshTypes.Box:
                    mesh = {
                        id: uuid,
                        type: 'Box',
                        name: 'Box' + uuid,
                        props: {
                            width: 200,
                            height: 200,
                            depth: 200,
                            material: {color: 'orange',},
                            position: {x: 0, y: 0, z: 0},
                            scale: {x: 1, y: 1, z: 1},
                            rotation: {x: 0, y: 0, z: 0}
                        }
                    }
                    break
                case MeshTypes.Cylinder:
                    mesh = {
                        id: uuid,
                        type: 'Cylinder',
                        name: 'Cylinder' + uuid,
                        props: {
                            radiusTop: 200,
                            radiusBottom: 200,
                            height: 300,
                            material: {color: 'orange',},
                            position: {x: 0, y: 0, z: 0},
                            scale: {x: 1, y: 1, z: 1},
                            rotation: {x: 0, y: 0, z: 0}
                        }
                    }
                    break
            }
            this.meshArr = [...this.meshArr, mesh]
        },
        removeMesh(name) {
            this.meshArr = this.meshArr.filter(mesh => mesh.name !== name)
        },
        updateMeshInfo(name, info, type) {
            const index = this.meshArr.findIndex(item => item.name === name)
            switch (type) {
                case "translate":
                    this.meshArr[index].props = {...this.meshArr[index].props, position: info}// 响应式默认监听一层
                    break
                case "scale":
                    this.meshArr[index].props = {...this.meshArr[index].props, scale: info}
                    break
                case "rotate":
                    this.meshArr[index].props = {
                        ...this.meshArr[index].props,
                        rotation: {x: info.x, y: info.y, z: info.z}
                    }
                    break
            }
        },
        updateMaterial(name, info) {
            const index = this.meshArr.findIndex(item => item.name === name)
            this.meshArr[index].props = {
                ...this.meshArr[index].props, material: {
                    ...this.meshArr[index].props.material,
                    ...info
                }
            }
        },
        setSelObj(obj) {
            this.selObj = obj
        }
    }
})
