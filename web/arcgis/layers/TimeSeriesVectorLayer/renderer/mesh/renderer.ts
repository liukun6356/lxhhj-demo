import { doubleToTwoFloat, toRadians } from "shared/utils/math";
import { bboxCenter } from "web/arcgis/supports/bbox";
import { calcGLSLStructData_colorMapping, ColorMappingStructSize } from "web/arcgis/supports/colorMapping";
import { calcGLSLStructData_vectorField, calcVectorFieldSamplerLayout, createVectorFieldSamplerGeometry, VectorFieldStructSize } from "web/arcgis/supports/vector-field/VectorFieldSampler";
import { createGLState, type GLRenderState } from "web/arcgis/supports/webgl/state";
import { glDraw } from "web/utils/webgl/draw";
import { createFBO, type FBO } from "web/utils/webgl/framebuffer";
import { DataTextureBaseOpts } from "web/utils/webgl/texture";
import { createMultiPartsUBO } from "web/utils/webgl/ubo";
import { MeshMappingMode } from "../../interface";
import { TimeSeriesVectorLayerView } from "../../layer";
import { MeshTexBinding, TransformStructSize } from "./common";
import { getTsVectorDrawVFDataMeshProgram, getTsVectorMeshProgram, RenderMode } from "./mesh";
import { getTsVectorVectorFieldProgram, TsAttrBindingVectorField } from "./vector-field";

export type MeshRenderer = ReturnType<typeof createMeshRenderer>;

function calcGLSLStructData_transform({ state }: { state: __esri.ViewState }) {
    const PADDING = NaN;
    const [hx, lx] = doubleToTwoFloat(state.center[0]);
    const [hy, ly] = doubleToTwoFloat(state.center[1]);
    const rotateRad = toRadians(state.rotation);
    const cos = Math.cos(rotateRad);
    const sin = Math.sin(rotateRad);
    return new Float32Array([
        //u_rotate
        cos, sin, 0, PADDING,
        -sin, cos, 0, PADDING,
        0, 0, 1, PADDING,
        //
        hx, hy, lx, ly,
        state.size[0], state.size[1], state.resolution, PADDING
    ]);

}

export function createMeshRenderer(layerView: TimeSeriesVectorLayerView) {
    const { context: gl } = layerView;
    const _preloads = {} as Record<'mesh' | 'wireframe' | 'vectorField', ReturnType<typeof _preload>>;

    let program_mesh = getTsVectorMeshProgram(gl);
    let program_vectorField = getTsVectorVectorFieldProgram(gl);
    let program_vectorFieldDrawData = getTsVectorDrawVFDataMeshProgram(gl);

    const ubo = createMultiPartsUBO(gl, [
        { name: "transform", calcFunc: calcGLSLStructData_transform, byteSize: TransformStructSize },
        { name: "colorMappingZ", calcFunc: calcGLSLStructData_colorMapping, byteSize: ColorMappingStructSize },
        { name: "colorMappingMesh", calcFunc: calcGLSLStructData_colorMapping, byteSize: ColorMappingStructSize },
        { name: "colorMappingVF", calcFunc: calcGLSLStructData_colorMapping, byteSize: ColorMappingStructSize },
        { name: "vectorField", calcFunc: calcGLSLStructData_vectorField, byteSize: VectorFieldStructSize }
    ]);

    let rt: FBO;
    let vectorFieldGeometry = createVectorFieldSamplerGeometry(gl, TsAttrBindingVectorField.position);


    function doRenderZ({ renderState, defaultRT }: DrawContext) {
        const {
            _geometryLoader: geo,
            _meshRenderOptsLoader: mr,
        } = layerView;
        const { mapping } = mr.getData();
        const { texture_encodeXY, texture_z, vao, drawInfo } = geo.getRenderData('z');
        const { program, uniforms } = program_mesh;

        ubo.update('colorMappingZ', mapping);

        renderState
            .framebuffer(defaultRT.framebuffer)
            .viewport(defaultRT.viewport)
            .applyState(createGLState({
                blend: {
                    enable: true,
                    funcSrc: gl.ONE,
                    funcDst: gl.ONE_MINUS_SRC_ALPHA,
                }
            }))
            .useProgram(program)
            .applyUboBind({ 0: ubo.buffer })
            .applyTexture2DBind({
                [MeshTexBinding.encodeXY]: texture_encodeXY,
                [MeshTexBinding.z]: texture_z,
                [MeshTexBinding.colorMapping]: mapping.texture,
            })
            .bindVao(vao);

        //set uniforms
        gl.uniform1i(uniforms.u_tex_vertex_z, MeshTexBinding.z);
        gl.uniform1i(uniforms.u_tex_vertex_encodeXY, MeshTexBinding.encodeXY);
        gl.uniform1i(uniforms.u_tex_colorMapping, MeshTexBinding.colorMapping);
        gl.uniform1f(uniforms.u_renderMode, RenderMode.z);

        glDraw(gl, drawInfo);
    }
    function doRenderMesh({ renderState, defaultRT }: DrawContext) {
        const {
            _geometryLoader: geo,
            _timeSourceLoader: ts,
            _timeDataRenderOptsLoader: tr,
        } = layerView;
        const { mapping, opacity } = tr.getData();
        const { percent, beforeTex, afterTex } = ts.getCurRenderData();
        const { program, uniforms } = program_mesh;
        const { texture_encodeXY, vao, drawInfo } = geo.getRenderData('mesh');

        ubo.update('colorMappingMesh', mapping);

        renderState
            .framebuffer(defaultRT.framebuffer)
            .viewport(defaultRT.viewport)
            .applyState(createGLState({
                blend: {
                    enable: true,
                    funcSrc: gl.ONE,
                    funcDst: gl.ONE_MINUS_SRC_ALPHA,
                }
            }))
            .useProgram(program)
            .applyUboBind({ 0: ubo.buffer })
            .applyTexture2DBind({
                [MeshTexBinding.encodeXY]: texture_encodeXY,
                [MeshTexBinding.colorMapping]: mapping.texture,
                [MeshTexBinding.dataBefore]: beforeTex,
                [MeshTexBinding.dataAfter]: afterTex,
            })
            .bindVao(vao);

        //set uniforms
        gl.uniform1i(uniforms.u_tex_vertex_encodeXY, MeshTexBinding.encodeXY);
        gl.uniform1i(uniforms.u_tex_colorMapping, MeshTexBinding.colorMapping);
        gl.uniform1i(uniforms.u_tex_dataBefore, MeshTexBinding.dataAfter);
        gl.uniform1i(uniforms.u_tex_dataAfter, MeshTexBinding.dataBefore);

        gl.uniform1f(uniforms.u_mappingMode, MeshMappingMode[ts.meshMappingMode]);
        gl.uniform1f(uniforms.u_renderMode, RenderMode.mesh);
        gl.uniform1f(uniforms.u_percent, percent);
        gl.uniform1f(uniforms.u_opacity, opacity);

        glDraw(gl, drawInfo);
    }
    function doRenderWireframe({ renderState, defaultRT }: DrawContext) {
        const {
            _geometryLoader: geo,
            _meshRenderOptsLoader: mr,
        } = layerView;

        const { meshLineColor } = mr.getData();
        const { program, uniforms } = program_mesh;
        const { texture_encodeXY, vao, drawInfo } = geo.getRenderData('wireframe');

        renderState
            .framebuffer(defaultRT.framebuffer)
            .viewport(defaultRT.viewport)
            .applyState(createGLState({
                blend: {
                    enable: true,
                    funcSrc: gl.ONE,
                    funcDst: gl.ONE_MINUS_SRC_ALPHA,
                }
            }))
            .useProgram(program)
            .applyUboBind({ 0: ubo.buffer })
            .applyTexture2DBind({
                [MeshTexBinding.encodeXY]: texture_encodeXY,
            })
            .bindVao(vao);

        //set uniforms
        gl.uniform4fv(uniforms.u_meshLineColor, [
            meshLineColor.r / 255,
            meshLineColor.g / 255,
            meshLineColor.b / 255,
            meshLineColor.a
        ]);
        gl.uniform1f(uniforms.u_renderMode, RenderMode.wireframe);
        gl.uniform1i(uniforms.u_tex_vertex_encodeXY, MeshTexBinding.encodeXY);

        glDraw(gl, drawInfo);
    }
    function doRenderVectorField({ renderState, state, defaultRT }: DrawContext) {
        const {
            _geometryLoader: geo,
            _vectorFieldTimeSourceLoader: vfts,
            _vectorFieldRenderOptsLoader: vfr,
        } = layerView;

        if (!rt || rt.width !== state.size[0] || rt.height !== state.size[1]) {
            const old = rt;
            old && requestIdleCallback(() => old.destroy(), { timeout: 5000 });
            rt = createFBO(gl, {
                width: state.size[0],
                height: state.size[1],
                depth: false,
                stencil: false,
                colorAttachments: {
                    0: {
                        ...DataTextureBaseOpts,
                        format: gl.RG_INTEGER,
                        internalformat: gl.RG32UI,
                        type: gl.UNSIGNED_INT,
                    }
                }
            });
        }
        const { percent, beforeTex, afterTex } = vfts.getCurRenderData();
        drawEncode();
        drawColor();
        function drawEncode() {
            const { program, uniforms } = program_vectorFieldDrawData;
            const { texture_encodeXY, vao, drawInfo } = geo.getRenderData('mesh');

            const count = vfts.meshMappingMode === 'per-vertex'
                ? geo.meta.vertexCount
                : geo.meta.meshCount;

            if (vfts.timeDataLength !== count * 2) {
                console.warn(`数据长度不匹配, 匹配模式:${vfts.meshMappingMode}, ${vfts.meshMappingMode === 'per-vertex' ? '顶点' : '网格'
                    }数: ${count}, 数据长度为:${vfts.timeDataLength}`);
            }

            //1 draw encode data
            renderState
                .framebuffer(rt.framebuffer)
                .viewport(rt.defaultViewport)
                .applyState(createGLState({
                    blend: {
                        enable: false,
                    }
                }))
                .applyUboBind({ 0: ubo.buffer })
                .applyTexture2DBind({
                    [MeshTexBinding.encodeXY]: texture_encodeXY,
                    [MeshTexBinding.dataBefore]: beforeTex,
                    [MeshTexBinding.dataAfter]: afterTex,
                })
                .bindVao(vao)
                .useProgram(program);

            //set uniforms
            gl.uniform1i(uniforms.u_tex_vertex_encodeXY, MeshTexBinding.encodeXY);
            gl.uniform1i(uniforms.u_tex_dataAfter, MeshTexBinding.dataAfter);
            gl.uniform1i(uniforms.u_tex_dataBefore, MeshTexBinding.dataBefore);

            gl.uniform4fv(uniforms.u_range1, beforeTex.range);
            gl.uniform4fv(uniforms.u_range2, afterTex.range);
            gl.uniform1f(uniforms.u_mappingMode, MeshMappingMode[vfts.meshMappingMode]);

            gl.clearBufferuiv(gl.COLOR, 0, new Uint32Array([0, 0, 0, 0]));
            glDraw(gl, drawInfo);
        }

        function drawColor() {
            const { program, uniforms } = program_vectorField;
            const center = bboxCenter(geo.bbox);
            const renderOpts = vfr.getData();
            const samplerInfo = calcVectorFieldSamplerLayout(state, renderOpts.gap);
            const { vao, drawInfo } = vectorFieldGeometry
                .update(samplerInfo.samplerCount)
                .getRenderData();
            const fullExtentCenter = state.toScreenNoRotation([], center[0], center[1]);
            const offset = [
                fullExtentCenter[0] - state.size[0] / 2,
                fullExtentCenter[1] - state.size[1] / 2
            ].map((i) => i % renderOpts.gap);
            ubo.update('vectorField', samplerInfo, renderOpts, offset);

            if (renderOpts.enableColorMapping && renderOpts.colorMapping) {
                if (renderOpts.colorMapping.type === 'ramp') {
                    renderOpts.colorMapping.valueRange = renderOpts.flowRange
                }
                ubo.update('colorMappingVF', renderOpts.colorMapping);
            }

            renderState
                .framebuffer(defaultRT.framebuffer)
                .viewport(defaultRT.viewport)
                .applyState(createGLState({
                    blend: {
                        enable: true,
                        funcSrc: gl.SRC_ALPHA,
                        funcDst: gl.ONE_MINUS_SRC_ALPHA,
                    }
                }))
                .applyUboBind({ 0: ubo.buffer })
                .applyTexture2DBind({
                    [MeshTexBinding.arrow]: renderOpts.arrowTexture,
                    [MeshTexBinding.colorMapping]: renderOpts.colorMapping?.texture,
                    [MeshTexBinding.vfData]: rt.textures[0],
                })
                .bindVao(vao)
                .useProgram(program);

            gl.uniform1i(uniforms.u_tex_vfEncodeData, MeshTexBinding.vfData);
            gl.uniform1i(uniforms.u_tex_colorMapping, MeshTexBinding.colorMapping);
            gl.uniform1i(uniforms.u_tex_arrow, MeshTexBinding.arrow);

            gl.uniform4fv(uniforms.u_range1, beforeTex.range);
            gl.uniform4fv(uniforms.u_range2, afterTex.range);
            gl.uniform1f(uniforms.u_percent, percent);
            gl.uniform1f(uniforms.u_opacity, renderOpts.opacity);

            glDraw(gl, drawInfo);
        }
    }
    type DrawContext = {
        state: __esri.ViewState,
        renderState: GLRenderState,
        defaultRT: { viewport: number[], framebuffer: WebGLFramebuffer }
    }
    return {
        preload: preloadDraws,
        render(drawContext: DrawContext) {
            const {
                _geometryLoader: geo,
                _timeSourceLoader: ts,
                _vectorFieldTimeSourceLoader: vfts,
                _meshRenderOptsLoader: mr,
                _timeDataRenderOptsLoader: tr,
                _vectorFieldRenderOptsLoader: vfr,
            } = layerView;
            if (!geo) return;

            let renderZ = false;
            let renderMesh = false;
            let renderWireframe = false;
            let renderVectorField = false;
            if (mr?.renderOpts.renderZ) {
                const { enable, mapping } = mr.getData();
                renderZ = geo.ready(true) && mapping.texture && enable;
            };
            if (!renderZ && tr && ts) {
                const { enable, mapping, opacity } = tr.getData();
                renderMesh = enable
                    && opacity > 0
                    && ts.meshMappingMode
                    && ts.readyAtCurrent()
                    && mapping.texture
                    && geo.ready(false);
            };

            renderWireframe = mr
                && mr.renderOpts.meshLineColor
                && mr.renderOpts.showMeshLine
                && geo.ready(false);

            if (vfts && vfr) {
                const { show, arrowTexture, flowRange, opacity } = vfr.getData();
                renderVectorField = show
                    && opacity > 0
                    && flowRange
                    && arrowTexture //箭头纹理存在
                    && geo.ready(false)
                    && vfts.meshMappingMode
                    && vfts.readyAtCurrent()

            }

            if (!(renderZ || renderMesh || renderWireframe || renderVectorField)) return;

            ubo.update('transform', { state: drawContext.state });

            renderZ && ensureMeshDraw() && doRenderZ(drawContext);
            renderMesh && ensureMeshDraw() && doRenderMesh(drawContext);
            renderWireframe && ensureWireframeDraw() && doRenderWireframe(drawContext);
            renderVectorField && ensureVectorFieldDraw() && doRenderVectorField(drawContext);

            drawContext.renderState.bindVao(null);
        },
        destroy() {
            ubo?.destroy();
        }
    }
    function ensureMeshDraw() {
        return true;
    }
    function ensureWireframeDraw() {
        return true;
    }
    function ensureVectorFieldDraw() {
        return true;
    }
    function preloadDraws(type: 'mesh' | "wireframe" | 'vector-field') {
        if (type === 'mesh') {
            _preloads.mesh ??= _preload(() => {

            });
        } else if (type === 'wireframe') {
            _preloads.wireframe ??= _preload(() => {

            });
        } else {
            _preloads.vectorField ??= _preload(() => {

            });
        }
    };
    function _preload(fn: Function) {
        let hasRun = false;
        const timer = requestIdleCallback(() => {
            hasRun = true;
            try { fn() } catch (e) { console.error(e) }
        });
        return {
            flush: () => {
                if (hasRun) return;
                hasRun = true;
                cancelIdleCallback(timer);
                try { fn() } catch (e) { console.error(e) }
            }
        }
    }
}
