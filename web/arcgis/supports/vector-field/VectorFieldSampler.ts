import type { BBox } from "geojson";
import { createAttribute, createVAO, createVBO } from "web/utils/webgl/buffer";
import { BufferDataType, DrawMode } from "web/utils/webgl/constant";
import type { ArrayInstancedDrawInfo } from "web/utils/webgl/draw";
import { bboxCenter, bboxRotate, bboxSize } from "../bbox";
import { VectorFieldRenderOptsLoader } from "./VectorFieldRenderOpts";


export type VectorFieldSamplerLayout = ReturnType<typeof calcVectorFieldSamplerLayout>;
export function calcVectorFieldSamplerLayout(
    state: __esri.ViewState,
    gap: number
) {
    const [screenWidth, screenHeight] = state.size;
    const screenBBox = [0, 0, screenWidth, screenHeight] as BBox;
    const [cx, cy] = bboxCenter(screenBBox);
    //如图 image.png,  xy为世界坐标系, sxsy为屏幕坐标系
    //黑色为屏幕框, 红色框代表view.extent
    //现在将地图逆时针旋转α角度
    //至少需要渲染橙色框(xy)内的数据，才能覆盖整个屏幕(黑色框)
    //采样点分布在橙色框内（s1,s2,s3...), 
    //要求采样点的屏幕坐标，只需要将未旋转前的采样点坐标系o1,o2,o3,... 旋转相同角度
    const bboxScreenSpaceNoRotate = state.rotation % 360 === 0
        ? screenBBox
        : bboxRotate(screenBBox, [cx, cy], state.rotation);
    const [width, height] = bboxSize(bboxScreenSpaceNoRotate);
    const halfGapCount = [Math.ceil(width / 2 / gap), Math.ceil(height / 2 / gap)];
    const topLeft = [cx - halfGapCount[0] * gap, cy - halfGapCount[1] * gap];
    const colPoints = halfGapCount[0] * 2 + 1;
    const rowPoints = halfGapCount[1] * 2 + 1;
    return {
        samplerCount: colPoints * rowPoints,
        dimension: [colPoints, rowPoints],
        topLeft,
    }
}


export const VectorFieldStructSize = 5 * 4 * Float32Array.BYTES_PER_ELEMENT;
//see web/arcgis/supports/webgl/glsl/vector-field.ts
export function calcGLSLStructData_vectorField(
    { topLeft, dimension, }: VectorFieldSamplerLayout,
    { sizeMapping, gap, enableColorMapping,
        enableSizeMapping, defaultColor,
        defaultSize, arrowAspect, flowRange, minShowFlow
    }: ReturnType<VectorFieldRenderOptsLoader['getData']>,
    offsetNoRotate: number[]
) {
    const PADDING = NaN;
    const UNKNOWN = NaN;
    const mappingSize = sizeMapping ?? [UNKNOWN, UNKNOWN];
    const colorDefault = [
        defaultColor.r / 255,
        defaultColor.g / 255,
        defaultColor.b / 255,
        defaultColor.a,
    ];
    return new Float32Array([
        topLeft[0], topLeft[1], dimension[0], dimension[1],
        //
        offsetNoRotate[0], offsetNoRotate[1],
        enableColorMapping ? 1 : 0, enableSizeMapping ? 1 : 0,
        //
        flowRange[0], flowRange[1], ...mappingSize,
        ...colorDefault,
        defaultSize, gap, arrowAspect, minShowFlow
    ]);
}

export function createVectorFieldSamplerGeometry(
    gl: WebGL2RenderingContext,
    bindTarget: number,
) {
    const vbo = createVBO(gl, { srcData: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]) });
    const vao = createVAO(gl, {
        [bindTarget]: {
            attribute: createAttribute({
                name: "position",
                format: 'vec2',
                type: BufferDataType.f32
            }),
            vbo
        }
    });
    //@ts-ignore
    vao._name = 'VectorFieldGeometry';
    const drawInfo = {
        first: 0,
        mode: DrawMode.TriangleFan,
        count: 8,
        instanceCount: 0,
    } as ArrayInstancedDrawInfo;
    return {
        update(samplerCount: number) {
            drawInfo.instanceCount = samplerCount;
            return this;
        },
        getRenderData() {
            return {
                drawInfo,
                vao,
            }
        },
        destroy() {
            gl.deleteBuffer(vbo);
            gl.deleteVertexArray(vao);
        }
    }
}
