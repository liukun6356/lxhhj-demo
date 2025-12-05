export function blockEvent(e: Event) {
    e.preventDefault();
    e.stopPropagation();
}


let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

export function getUtilsCanvas() {
    canvas ??= document.createElement('canvas');
    ctx ??= canvas.getContext('2d');
    return { canvas, ctx }
}