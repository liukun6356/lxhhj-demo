import { property, subclass } from "@arcgis/core/core/accessorSupport/decorators";
import Layer from "@arcgis/core/layers/Layer";
import TileInfo from "@arcgis/core/layers/support/TileInfo";
import BaseLayerViewGL2D from "@arcgis/core/views/2d/layers/BaseLayerViewGL2D";
import { mat3, vec4 } from "gl-matrix";

@subclass()
class CustomLayerView2D extends BaseLayerViewGL2D {
    @property()
    layer: TileGridLayer;

    private a_Position = 0;

    // Maps from tile id to the texture used by that tile.
    private textures = new Map();
    // A [x, y, width, height] rectangle that describes the
    // position of an unrotated tile in pixels.
    private rect = vec4.create();
    // The modelTransform is a rotation around the center
    // of the screen; we implement it as a translation, followed
    // by a rotation, followed by a translation back to the origin.
    // It is used to rotate the 'rect' defined above in the vertex
    // shader.
    private modelTransform = mat3.create();
    private modelTransformPreTranslation = mat3.create();
    private modelTransformRotation = mat3.create();
    private modelTransformPostTranslation = mat3.create();
    private ndcTransform = mat3.create();

    private ctx: CanvasRenderingContext2D;
    private program: WebGLProgram;

    private u_Rect: WebGLUniformLocation;
    private u_ModelTransform: WebGLUniformLocation;
    private u_NDCTransform: WebGLUniformLocation;
    private u_Texture: WebGLUniformLocation;

    private vertexBuffer: WebGLBuffer;
    private indexBuffer: WebGLBuffer;

    attach() {
        // We create and keep around a canvas and its associated 2D context.
        // We will use it at every frame to paint the textures for newly
        // created tiles.
        const canvas = document.createElement("canvas");
        canvas.width = this.layer.tileInfo.size[0];
        canvas.height = this.layer.tileInfo.size[1];
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "skyblue";
        ctx.shadowColor = "white";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.font = "20px sans-serif";
        this.ctx = ctx;

        // Creation of WebGL resources.
        const gl = this.context;

        // Create shaders.
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(
            vs,
            `precision highp float;
              attribute vec2 a_Position;
              uniform vec4 u_Rect;
              uniform mat3 u_ModelTransform;
              uniform mat3 u_NDCTransform;
              varying vec2 v_TexCoord;
              void main(void) {
                vec3 transformed = u_NDCTransform * u_ModelTransform * vec3(u_Rect.xy + u_Rect.zw * a_Position, 1.0);
                transformed /= transformed.z;
                gl_Position = vec4(transformed.xy, 0.0, 1.0);
                v_TexCoord = a_Position;
              }`
        );
        gl.compileShader(vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(
            fs,
            `precision highp float;
              varying vec2 v_TexCoord;
              uniform sampler2D u_Texture;
              void main(void) {
                gl_FragColor = texture2D(u_Texture, v_TexCoord);
              }`
        );
        gl.compileShader(fs);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.bindAttribLocation(this.program, this.a_Position, "a_Position");
        gl.linkProgram(this.program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        // Retrieve uniform locations.
        this.u_Rect = gl.getUniformLocation(this.program, "u_Rect");
        this.u_ModelTransform = gl.getUniformLocation(this.program, "u_ModelTransform");
        this.u_NDCTransform = gl.getUniformLocation(this.program, "u_NDCTransform");
        this.u_Texture = gl.getUniformLocation(this.program, "u_Texture");

        // Create buffers. The tile is represented by a 1x1 square; the vertex shader will
        // stretch it and position it on screen using the pixel values contained in `this.rect`.
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array([0, 0, 1, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    }

    // Creates the textures for new tiles that don't have a texture yet, and destroys the textures
    // of tiles that are not on screen anymore.
    manageTextures() {
        const gl = this.context;

        const tileIdSet = new Set();
      
        // Create new textures as needed.
        for (let i = 0; i < this.tiles.length; ++i) {
            const tile = this.tiles[i];
            tileIdSet.add(tile.id);

            if (!this.textures.has(tile.id)) {
                // The image is simply a border-to-border square with the tile id
                // in the upper-left corner of the screen. When tiled, the squares
                // will display as tile boundaries across the entire screen.
                this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
                this.ctx.fillText([tile.level, tile.row, tile.col, tile.world].join("/"), 10, 24);
                this.ctx.strokeStyle = 'red';
                this.ctx.strokeRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
               
                const texture = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);//可能其他程序会修改, 强制指定
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.ctx.canvas);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                this.textures.set(tile.id, texture);
            }
        }

        // Destroys unneeded textures.
        this.textures.forEach((_, id) => {
            if (!tileIdSet.has(id)) {
                gl.deleteTexture(this.textures.get(id));
                this.textures.delete(id);
            }
        });
    }

    // Example of a render implementation that draws tile boundaries
    render(renderParameters: __esri.BaseLayerViewGL2DRenderRenderParameters) {
        this.manageTextures();

        const gl = this.context;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enableVertexAttribArray(this.a_Position);
        gl.useProgram(this.program);

        // Computes the matrices.
        this.ndcTransform[0] = 2.0 / gl.canvas.width;
        this.ndcTransform[3] = 0;
        this.ndcTransform[6] = -1;
        this.ndcTransform[1] = 0;
        this.ndcTransform[4] = -2.0 / gl.canvas.height;
        this.ndcTransform[7] = 1;
        this.ndcTransform[2] = 0;
        this.ndcTransform[5] = 0;
        this.ndcTransform[8] = 1;

        const tileSize = this.layer.tileInfo.size[0];
        const state = renderParameters.state;
        //@ts-ignore
        const pixelRatio = state.pixelRatio as number;
        const width = state.size[0];
        const height = state.size[1];
        const coords = [0, 0];

        if (state.rotation !== 0) {
            this.modelTransformPreTranslation[0] = 1;
            this.modelTransformPreTranslation[3] = 0;
            this.modelTransformPreTranslation[6] = -width * pixelRatio * 0.5;
            this.modelTransformPreTranslation[1] = 0;
            this.modelTransformPreTranslation[4] = 1;
            this.modelTransformPreTranslation[7] = -height * pixelRatio * 0.5;
            this.modelTransformPreTranslation[2] = 0;
            this.modelTransformPreTranslation[5] = 0;
            this.modelTransformPreTranslation[8] = 1;

            const rot = (state.rotation * Math.PI) / 180;
            this.modelTransformRotation[0] = Math.cos(rot);
            this.modelTransformRotation[3] = -Math.sin(rot);
            this.modelTransformRotation[6] = 0;
            this.modelTransformRotation[1] = Math.sin(rot);
            this.modelTransformRotation[4] = Math.cos(rot);
            this.modelTransformRotation[7] = 0;
            this.modelTransformRotation[2] = 0;
            this.modelTransformRotation[5] = 0;
            this.modelTransformRotation[8] = 1;

            this.modelTransformPostTranslation[0] = 1;
            this.modelTransformPostTranslation[3] = 0;
            this.modelTransformPostTranslation[6] = width * pixelRatio * 0.5;
            this.modelTransformPostTranslation[1] = 0;
            this.modelTransformPostTranslation[4] = 1;
            this.modelTransformPostTranslation[7] = height * pixelRatio * 0.5;
            this.modelTransformPostTranslation[2] = 0;
            this.modelTransformPostTranslation[5] = 0;
            this.modelTransformPostTranslation[8] = 1;

            mat3.multiply(this.modelTransform, this.modelTransformRotation, this.modelTransformPreTranslation);
            mat3.multiply(this.modelTransform, this.modelTransformPostTranslation, this.modelTransform);
        } else {
            this.modelTransform[0] = 1;
            this.modelTransform[3] = 0;
            this.modelTransform[6] = 0;
            this.modelTransform[1] = 0;
            this.modelTransform[4] = 1;
            this.modelTransform[7] = 0;
            this.modelTransform[2] = 0;
            this.modelTransform[5] = 0;
            this.modelTransform[8] = 1;
        }

        // Set per-frame states and uniforms.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.a_Position, 2, gl.UNSIGNED_BYTE, false, 2, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.uniformMatrix3fv(this.u_NDCTransform, false, this.ndcTransform);
        gl.uniformMatrix3fv(this.u_ModelTransform, false, this.modelTransform);

        // Render each tile separately.
        for (let i = 0; i < this.tiles.length; i++) {
            // Retrieve the current tile and its associated texture.
            const tile = this.tiles[i];
            const texture = this.textures.get(tile.id);

            // Derive the screen `rect` for this tile.
            const screenScale = (tile.resolution / state.resolution) * pixelRatio;
            //@ts-ignore
            state.toScreenNoRotation(coords, tile.coords);
            this.rect[0] = coords[0];
            this.rect[1] = coords[1];
            this.rect[2] = tileSize * screenScale;
            this.rect[3] = tileSize * screenScale;

            // Set per-tile uniforms and states.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform4fv(this.u_Rect, this.rect);
            gl.uniform1i(this.u_Texture, 0);

            // Draw the tile.
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        }
    }

    // Destroy the shader program, the buffers and all the tile textures.
    detach() {
        const gl = this.context;

        gl.deleteProgram(this.program);
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);

        this.textures.forEach((_, id) => {
            gl.deleteTexture(this.textures.get(id));
            this.textures.delete(id);
        });
    }

    // Required when using tiling; this methods is called every time that `this.tiles`
    // changes, to give the derived class a chance to perform per-tile work as needed;
    // This is where, for instance, tile data could be fetched from a server.
    //     tilesChanged() {
    //     }
}

@subclass()
export class TileGridLayer extends Layer {
    @property()
    tileInfo: TileInfo;
    @property()
    tileSize: number = 256;

    createLayerView(view: any) {
        if (view.type !== "2d") throw new Error("不支持3d");
        this.tileInfo ||
            (this.tileInfo = TileInfo.create({
                size: this.tileSize,
                spatialReference: view.spatialReference,
            }));
        const lyView = new CustomLayerView2D({
            view: view,
            //@ts-ignore
            layer: this,
        });
        return Promise.resolve(lyView);
    }
}
