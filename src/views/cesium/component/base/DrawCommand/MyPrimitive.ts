import {Cesium} from "mars3d";

export class MyPrimitive {
    private drawCommand: null;

    constructor() {
        this.drawCommand = null;
    }

    /**
     * 创建 DrawCommand
     * @param {Cesium.Context} context
     */
    createCommand(context) {
        const positionBuffer = Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: new Float32Array([
                -2247147.127351012, 5291339.469888422, 2754024.573868693,
                -2251279.7964703566, 5292932.628369802, 2747646.727740204,
                -2258888.7074400582, 5286251.940750707, 2754871.7291802308,
            ]),
            usage: Cesium.BufferUsage.STATIC_DRAW,
        })

        const va = new Cesium.VertexArray({
            context: context,
            attributes: [{
                index: 0, // 等于 attributeLocations['position']
                vertexBuffer: positionBuffer,
                componentsPerAttribute: 3,
                componentDatatype: Cesium.ComponentDatatype.FLOAT
            }]
        })

        const shaderProgram = Cesium.ShaderProgram.fromCache({
            context: context,
            vertexShaderSource: `
            #version 300 es
            in vec3 position;
    
            void main() {
                gl_Position = czm_modelViewProjection * vec4(position, 1.0);
            }`,
            fragmentShaderSource: `
            #version 300 es
            precision highp float;
    
            uniform vec3 color;
            out vec4 fragColor;
    
            void main() {
                fragColor = vec4(color, 1.0);
            }`,
            attributeLocations: {
                "position": 0,
            }
        })

        const uniformMap = {
            color() {
                return Cesium.Color.WHITE
            }
        }

        const renderState = Cesium.RenderState.fromCache({
            cull: {
                enabled: true,
                face: Cesium.CullFace.BACK
            },
            depthTest: {
                enabled: true
            }
        })

        this.drawCommand = new Cesium.DrawCommand({
            modelMatrix: Cesium.Matrix4.IDENTITY.clone(),
            vertexArray: va,
            shaderProgram: shaderProgram,
            uniformMap: uniformMap,
            renderState: renderState,
            pass: Cesium.Pass.OPAQUE,
            primitiveType: Cesium.PrimitiveType.LINE_LOOP,// 三角形
        })
    }

    /**
     * 实现Primitive接口，供Cesium内部在每一帧中调用
     * @param {Cesium.FrameState} frameState
     */
    update(frameState) {
        if (!this.drawCommand) {
            this.createCommand(frameState.context)
        }
        frameState.commandList.push(this.drawCommand)
    }

    isDestroyed() {
        return this.isDestroyed;
    }

    destroy() {
        this._isDestroyed = true;
        this.drawCommand.shaderProgram.destroy();
        this.drawCommand.vertexArray.destroy();
    }
}
