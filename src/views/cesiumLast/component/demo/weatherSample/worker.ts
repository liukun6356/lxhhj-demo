import { generate_WEBGL, train } from 'kriging-webgl';
self.onmessage = async e => {
    const result = await workerGernerate(e.data.data);
    self.postMessage({
        id: e.data.id,
        result,
        success: true
    }, [result.packedImagebitmap]);
}
export async function workerGernerate({ data, xs, ys, llCorner, cellSize, gridSize, packValueRange }: {
    data: number[],
    xs: number[],
    ys: number[],
    llCorner: number[],
    cellSize: number,
    gridSize: number[],
    packValueRange: number[]
}) {
    let start = performance.now();
    const variogram = train(
        data,
        xs,
        ys,
        'exponential',
        0,
        10
    );
    const trainTime = performance.now() - start;

    start = performance.now();
    const packedImagebitmap = await generate_WEBGL({
        variogram,
        llCorner,
        cellSize,
        gridSize,
        packValueRange,
        outputFormat: 'packed-imagebitmap'
    });

    return {
        packedImagebitmap,
        trainTime,
        generateTime: performance.now() - start
    }
}

