import {Cesium} from "mars3d";

export class MyPrimitive {
    private drawCommand: null;
    private vertices: Float64Array;
    private triangles: Uint32Array;
    private dataIndexArr: Float32Array;

    constructor(vertices: Float64Array, triangles: Uint32Array) {
        this.drawCommand = null;
        this.vertices = vertices
        this.triangles = triangles
        this.dataIndexArr = new Float32Array(vertices.length / 3)
        for (let i = this.dataIndexArr.length; i--;) this.dataIndexArr[i] = i;
    }

    /**
     * 创建 DrawCommand
     * @param {Cesium.Context} context
     */
    createCommand(context) {
        const verticesHigh = new Float32Array(this.vertices.length);
        const verticesLow = new Float32Array(this.vertices.length);
        for (let i = 0; i < this.vertices.length; i += 3) {
            const i1 = i + 1,
                i2 = i + 2;
            const x = this.vertices[i];
            const y = this.vertices[i1];
            const z = this.vertices[i2];
            const [hx, lx] = this.doubleToTwoFloats(x);
            const [hy, ly] = this.doubleToTwoFloats(y);
            const [hz, lz] = this.doubleToTwoFloats(z);
            verticesHigh[i] = hx;
            verticesHigh[i1] = hy;
            verticesHigh[i2] = hz;
            verticesLow[i] = lx;
            verticesLow[i1] = ly;
            verticesLow[i2] = lz;
        }
        const positionHighBuffer = Cesium.Buffer.createVertexBuffer({
            context,
            typedArray: verticesHigh,
            usage: Cesium.BufferUsage.STATIC_DRAW,
        });
        const positionLowBuffer = Cesium.Buffer.createVertexBuffer({
            context,
            typedArray: verticesLow,
            usage: Cesium.BufferUsage.STATIC_DRAW,
        });

        const triangleCount = this.triangles.length / 3;
        const gridLineIndexArr = new Uint32Array(triangleCount * 6);
        for (let i = 0; i < triangleCount; i++) {
            const i3 = i * 3;
            const ia = this.triangles[i3];
            const ib = this.triangles[i3 + 1];
            const ic = this.triangles[i3 + 2];
            const i6 = i * 6;
            gridLineIndexArr[i6] = ia;
            gridLineIndexArr[i6 + 1] = ib;
            gridLineIndexArr[i6 + 2] = ia;
            gridLineIndexArr[i6 + 3] = ic;
            gridLineIndexArr[i6 + 4] = ib;
            gridLineIndexArr[i6 + 5] = ic;
        }
        const indexBuffer = Cesium.Buffer.createIndexBuffer({
            context,
            typedArray:gridLineIndexArr,
            usage: Cesium.BufferUsage.STATIC_DRAW,
            indexDatatype: Cesium.IndexDatatype.UNSIGNED_INT,
        });


        const va = new Cesium.VertexArray({
            context: context,
            attributes: [
                {
                    index:1,
                    vertexBuffer: positionHighBuffer,
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 3,
                    normalize: false,
                },
                {
                    index: 2,
                    vertexBuffer: positionLowBuffer,
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 3,
                    normalize: false,
                },
            ],
            indexBuffer,
            attributeLocations: {  positionHigh: 1, positionLow: 2,}
        })

        const shaderProgram = Cesium.ShaderProgram.fromCache({
            context: context,
            vertexShaderSource: `
            #version 300 es
             in vec3 positionHigh;
             in vec3 positionLow;
    
            void main() {
                vec4 positionRelativeToEye = czm_translateRelativeToEye(positionHigh, positionLow);
                vec4 positionEC = czm_modelViewRelativeToEye * positionRelativeToEye; 
                gl_Position = czm_projection * positionEC;
            }`,
            fragmentShaderSource: `
            #version 300 es
            precision highp float;
    
            uniform vec3 color;
            out vec4 fragColor;
    
            void main() {
                fragColor = vec4(color, 0.1);
            }`,
            attributeLocations: {positionHigh: 1, positionLow: 2}
        })

        const uniformMap = {
            color() {
                return Cesium.Color.WHITE
            }
        }

        const renderState = Cesium.RenderState.fromCache({
            cull: { // 是否启用背面剔除
                enabled: true,
                face: Cesium.CullFace.BACK
            },
            depthTest: { // 是否启用深度测试
                enabled: false
            },
            depthMask: true, //是否写入深度缓冲区
            blending: { // 控制颜色混合
                enabled: true,
                equationRgb: Cesium.BlendEquation.ADD,// 使用 ADD 模式进行混合
                equationAlpha: Cesium.BlendEquation.ADD,
                functionSourceRgb: Cesium.BlendFunction.SOURCE_ALPHA,
                functionSourceAlpha: Cesium.BlendFunction.SOURCE_ALPHA,
                functionDestinationRgb:
                Cesium.BlendFunction.ONE_MINUS_SOURCE_ALPHA,
                functionDestinationAlpha:
                Cesium.BlendFunction.ONE_MINUS_SOURCE_ALPHA,
            },
        })

        this.drawCommand = new Cesium.DrawCommand({
            modelMatrix: Cesium.Matrix4.IDENTITY.clone(),
            vertexArray: va,
            shaderProgram: shaderProgram,
            uniformMap: uniformMap,
            renderState: renderState,
            pass: Cesium.Pass.OPAQUE,
            primitiveType: Cesium.PrimitiveType.LINES,// 三角形
        })
    }
    doubleToTwoFloats(v: number) {
        // 高低位分解 2**6，笛卡尔束通常事很大的数字，将坐标分解为高位和低位，提高渲染经度，避免抖动 => 单精度浮点数->双精度浮点数
        // 高位  表示主要位置（粗略网格）
        // 低位  表示相对于高位的偏移量（细节）
        if (v >= 0) {
            const i = 65536 * Math.floor(v / 65536);
            return [i, v - i]; // [高位，低位]
        } else {
            const i = 65536 * Math.floor(-v / 65536);
            return [-i, v + i]; // [高位，低位]
        }
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
