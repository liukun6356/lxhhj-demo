import { BufferDataType, type GLDrawMode } from "./constant";

//
export interface ArrayDrawInfo {
    mode: GLDrawMode;
    first: number;
    count: number;
}
export interface ArrayInstancedDrawInfo extends ArrayDrawInfo {
    instanceCount: number;
}
export interface ElementsDrawInfo {
    mode: GLDrawMode,
    count: number,
    type: typeof BufferDataType['u8' | 'u16' | 'u32'],
    offset: number
}
export interface ElementsInstancedDrawInfo extends ElementsDrawInfo {
    instanceCount: number;
}
export function glDraw(
    gl: WebGL2RenderingContext,
    drawInfo: ArrayDrawInfo | ElementsDrawInfo | ArrayInstancedDrawInfo | ElementsInstancedDrawInfo
) {
    if ('first' in drawInfo) {
        if ('instanceCount' in drawInfo) {
            gl.drawArraysInstanced(
                gl[drawInfo.mode],
                drawInfo.first,
                drawInfo.count,
                drawInfo.instanceCount
            )
        } else {
            gl.drawArrays(
                gl[drawInfo.mode],
                drawInfo.first,
                drawInfo.count,
            );
        }
    } else {
        if ('instanceCount' in drawInfo) {
            gl.drawElementsInstanced(
                gl[drawInfo.mode],
                drawInfo.count,
                gl[drawInfo.type],
                drawInfo.offset,
                drawInfo.instanceCount
            )
        } else {
            gl.drawElements(
                gl[drawInfo.mode],
                drawInfo.count,
                gl[drawInfo.type],
                drawInfo.offset,
            );
        }
    }
}