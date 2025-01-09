//Douglas-Peucker algorithm
export function simplify(coords: number[], first: number, last: number, sqTolerance: number) {
    let maxSqDist = sqTolerance;
    const mid = (last - first) >> 1;
    let minPosToMid = last - first;
    let index;

    const ax = coords[first];
    const ay = coords[first + 1];
    const bx = coords[last];
    const by = coords[last + 1];

    for (let i = first + 3; i < last; i += 3) {
        const d = getSqSegDist(coords[i], coords[i + 1], ax, ay, bx, by);
        if (d > maxSqDist) {
            index = i;
            maxSqDist = d;
        } else if (d === maxSqDist) {
            const posToMid = Math.abs(i - mid);
            if (posToMid < minPosToMid) {
                index = i;
                minPosToMid = posToMid;
            }
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 3) simplify(coords, first, index, sqTolerance);
        coords[index + 2] = maxSqDist;
        if (last - index > 3) simplify(coords, index, last, sqTolerance);
    }
}

// 点到线段的距离平方
export function getSqSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {

    let dx = bx - ax;
    let dy = by - ay;

    if (dx !== 0 || dy !== 0) {

        const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            ax = bx;
            ay = by;

        } else if (t > 0) {
            ax += dx * t;
            ay += dy * t;
        }
    }

    dx = px - ax;
    dy = py - ay;

    return dx * dx + dy * dy;
}
